require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const session = require('express-session');
const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore({ projectId: process.env.GOOGLE_CLOUD_PROJECT || 'gcp-product-dev' });

const app = express();
app.set('trust proxy', 1); // trust Cloud Run's TLS termination proxy

const ALLOWED_EMAILS = new Set([
  'shikha.sharma@konghq.com',
  'sid.simharaju@konghq.com',
]);

const BASE_URL = process.env.BASE_URL || 'https://research-cockpit-116402097360.us-central1.run.app';

// ════════════════════════════════════════════════════════════
// FIRESTORE SESSION STORE
// Keeps sessions in Firestore so all Cloud Run instances share them.
// ════════════════════════════════════════════════════════════

const { Store } = require('express-session');

class FirestoreStore extends Store {
  constructor(firestoreDb) {
    super();
    this._col = firestoreDb.collection('_sessions');
  }
  get(sid, cb) {
    this._col.doc(sid).get()
      .then(doc => {
        if (!doc.exists) return cb(null, null);
        const { sess, expires } = doc.data();
        if (expires && expires < Date.now()) {
          this._col.doc(sid).delete().catch(() => {});
          return cb(null, null);
        }
        cb(null, sess);
      })
      .catch(cb);
  }
  set(sid, sess, cb) {
    const maxAge = sess.cookie?.maxAge ?? 7 * 24 * 60 * 60 * 1000;
    // Strip custom Session prototype — Firestore only accepts plain objects
    const plainSess = JSON.parse(JSON.stringify(sess));
    this._col.doc(sid).set({ sess: plainSess, expires: Date.now() + maxAge })
      .then(() => cb(null))
      .catch(cb);
  }
  destroy(sid, cb) {
    this._col.doc(sid).delete()
      .then(() => cb(null))
      .catch(cb);
  }
}

// ════════════════════════════════════════════════════════════
// SESSION
// ════════════════════════════════════════════════════════════

app.use(session({
  store: new FirestoreStore(db),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV !== 'development',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax',
  },
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ════════════════════════════════════════════════════════════
// AUTH ROUTES (public — before the auth guard)
// ════════════════════════════════════════════════════════════

app.get('/auth/google', (req, res) => {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
  url.searchParams.set('redirect_uri', `${BASE_URL}/auth/google/callback`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  res.redirect(url.toString());
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Missing auth code.');

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${BASE_URL}/auth/google/callback`,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokens.error_description || tokens.error);

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const user = await userRes.json();

    if (!ALLOWED_EMAILS.has(user.email)) {
      return res.status(403).send(`
        <html><body style="font-family:sans-serif;padding:40px">
          <h2>Access Denied</h2>
          <p><strong>${user.email}</strong> is not authorized to access Research Cockpit.</p>
          <p><a href="/auth/google">Try a different account</a></p>
        </body></html>
      `);
    }

    req.session.user = { email: user.email, name: user.name };
    res.redirect('/');
  } catch (err) {
    console.error('OAuth error:', err);
    res.status(500).send('Authentication failed. Please try again.');
  }
});

app.get('/auth/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/auth/google'));
});

// ════════════════════════════════════════════════════════════
// AUTH GUARD — all routes below require login
// ════════════════════════════════════════════════════════════

app.use((req, res, next) => {
  if (req.session?.user) return next();
  res.redirect('/auth/google');
});

// ════════════════════════════════════════════════════════════
// STATIC FILES
// ════════════════════════════════════════════════════════════

app.use(express.static(path.join(__dirname, 'public')));

// ════════════════════════════════════════════════════════════
// PROJECTS — Firestore CRUD
// ════════════════════════════════════════════════════════════

const PROJECTS = db.collection('projects');
const TRANSCRIPT_CHAR_LIMIT = 20000;

app.get('/api/projects', async (req, res) => {
  try {
    const snap = await PROJECTS.orderBy('updatedAt', 'desc').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) {
    console.error('List projects error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const doc = await PROJECTS.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const data = { ...req.body, updatedAt: new Date().toISOString() };
    // Cap transcript size to stay well under Firestore's 1MB document limit
    if (data.S?.participants) {
      data.S.participants = data.S.participants.map(p => ({
        ...p,
        transcript: (p.transcript || '').slice(0, TRANSCRIPT_CHAR_LIMIT),
      }));
    }
    await PROJECTS.doc(req.params.id).set(data);
    res.json({ ok: true });
  } catch (err) {
    console.error('Save project error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    await PROJECTS.doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════
// AGENT ENDPOINT — OpenAI
// ════════════════════════════════════════════════════════════

app.post('/api/agent', async (req, res) => {
  const { messages, system, max_tokens } = req.body;
  if (!messages) return res.status(400).json({ error: 'messages required' });

  const openaiMessages = [];
  if (system) openaiMessages.push({ role: 'system', content: system });
  openaiMessages.push(...messages);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(process.env.OPENAI_API_KEY || '').replace(/^Bearer\s+/i, '').trim()}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: max_tokens || 4000,
        messages: openaiMessages,
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);

    const text = data.choices?.[0]?.message?.content || '';
    res.json({ content: [{ type: 'text', text }] });
  } catch (err) {
    console.error('Agent error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════
// SERVE FRONTEND
// ════════════════════════════════════════════════════════════

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ════════════════════════════════════════════════════════════
// START
// ════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\nResearch Cockpit running at http://localhost:${PORT}\n`);
});
