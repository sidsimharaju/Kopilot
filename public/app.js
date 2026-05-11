/* ════════════════════════════════════════════════
   Research Cockpit — app.js
════════════════════════════════════════════════ */

// ── State ─────────────────────────────────────
const S = {
  projectName: '', date: '', area: '', designer: [], researcher: [],
  purpose: '', context: '',
  methodology: 'usability',
  cohorts: { internal: false, customers: false, noncustomers: false },
  sessions: {
    internal:     { min: '', ideal: '', max: '' },
    customers:    { min: '', ideal: '', max: '' },
    noncustomers: { min: '', ideal: '', max: '' },
  },
  criteria: { customers: '', noncustomers: '' },
  screener: { customers: '', noncustomers: '' },
  screenerChoice: { customers: '', noncustomers: '' },
  chipSelections: { customers: [], noncustomers: [] },
  championsLink: '',
  customerLink: '',
  objectives: [],
  participants: [],
  surveyParticipants: [],
  analysisResult: null,
  synthesisResult: null,
};
let pid = 1, oid = 1, spid = 1;
let _activeCohortDetail = null;
let _activeSourceCohort = null;

const DESIGNERS  = ['Ally','Andras','Erick','Helen','Janmesh','Jason','Jenya','Jessica','Julie','Julieta','Katrina','Missy','Mo','Salomon','Santhosh','Shikha','Sid','Travis'];
const RESEARCHERS = ['Shikha'];

const AUDIENCE_LABELS = {
  'internal-fresh':    'Fresh eyes',
  'internal-adjacent': 'Adjacent product',
  'internal-rolematch':'Role match',
  'se':                'Solutions engineer',
  'field-engineer':    'Field / platform engineer',
  'csm':               'CSM',
  'customer':          'Customer (direct)',
  'noncustomer':       'Non-Kong (Respondent)',
};

const SURVEY_STATUS = {
  'added':       { bg: '#f4f4f5', color: '#3f3f46',  label: 'Added' },
  'contacted':   { bg: '#dbeafe', color: '#1d4ed8',  label: 'Contacted' },
  'responded':   { bg: '#dcfce7', color: '#15803d',  label: 'Responded' },
  'no-response': { bg: '#fee2e2', color: '#dc2626',  label: 'No response' },
};

const STATUS_PILL = {
  'identified': { bg: '#f4f4f5', color: '#3f3f46',  label: 'Identified' },
  'contacted':  { bg: '#dbeafe', color: '#1d4ed8',  label: 'Contacted' },
  'scheduled':  { bg: '#fef3c7', color: '#92400e',  label: 'Scheduled' },
  'completed':  { bg: '#dcfce7', color: '#15803d',  label: 'Completed' },
  'dropped':    { bg: '#f4f4f5', color: '#9ca3af',  label: 'Dropped' },
  'no-show':    { bg: '#fee2e2', color: '#dc2626',  label: 'No-Show' },
};

function addPerson(field, select) {
  const name = select.value;
  select.value = '';
  if (!name || S[field].includes(name)) return;
  S[field].push(name);
  renderPersonPills(field);
}

function removePerson(field, name) {
  S[field] = S[field].filter(n => n !== name);
  renderPersonPills(field);
}

function renderPersonPills(field) {
  const c = document.getElementById(field + '-pills');
  if (!c) return;
  c.innerHTML = (S[field] || []).map(name =>
    `<span class="ppill">${esc(name)}<button class="ppill-x" onclick="removePerson('${field}','${esc(name)}')">×</button></span>`
  ).join('');
}

// ── Firestore-backed persistence ───────────────
let currentProjectId = null;
let _projectCreatedAt = null;

function saveState() {
  readObjectives();
  if (!currentProjectId) return;
  const now = new Date().toISOString();
  if (!_projectCreatedAt) _projectCreatedAt = now;

  // Capture live field values
  S.methodology    = S.methodology || 'usability';
  S.championsLink  = document.getElementById('f-champions-link')?.value || S.championsLink || '';
  S.customerLink   = document.getElementById('f-customer-link')?.value  || S.customerLink  || '';
  ['internal','customers','noncustomers'].forEach(c => {
    if (!S.sessions[c]) S.sessions[c] = {};
    S.sessions[c].min   = document.getElementById('f-sessions-' + c + '-min')?.value   || S.sessions[c].min   || '';
    S.sessions[c].ideal = document.getElementById('f-sessions-' + c + '-ideal')?.value || S.sessions[c].ideal || '';
    S.sessions[c].max   = document.getElementById('f-sessions-' + c + '-max')?.value   || S.sessions[c].max   || '';
  });
  if (!S.criteria) S.criteria = {};
  if (!S.screener) S.screener = {};
  S.criteria.customers    = document.getElementById('f-criteria-customers')?.value    || S.criteria.customers    || '';
  S.criteria.noncustomers = document.getElementById('f-criteria-noncustomers')?.value || S.criteria.noncustomers || '';
  S.screener.customers    = document.getElementById('f-screener-customers')?.value    || S.screener.customers    || '';
  S.screener.noncustomers = document.getElementById('f-screener-noncustomers')?.value || S.screener.noncustomers || '';

  apiFetch(`/api/projects/${currentProjectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: currentProjectId,
      createdAt: _projectCreatedAt,
      updatedAt: now,
      S: { ...S },
      pid, oid, spid,
    }),
  }).catch(e => console.warn('Save failed:', e));
}

async function saveStateAsync() {
  readObjectives();
  if (!currentProjectId) return;
  const now = new Date().toISOString();
  if (!_projectCreatedAt) _projectCreatedAt = now;
  await apiFetch(`/api/projects/${currentProjectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: currentProjectId,
      createdAt: _projectCreatedAt,
      updatedAt: now,
      S: { ...S },
      pid, oid, spid,
    }),
  });
}

// ── Tab switching (directory) ──────────────────
let _activeTab = 'projects';

function switchTab(tab) {
  _activeTab = tab;
  document.querySelectorAll('.dir-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  const newBtn = document.getElementById('dir-new-btn');
  if (tab === 'projects') {
    document.getElementById('dir-grid').style.display = 'grid';
    document.getElementById('dir-customers').style.display = 'none';
    document.getElementById('dir-empty').style.display = 'none';
    if (newBtn) newBtn.style.display = '';
    renderDirectory();
  } else {
    document.getElementById('dir-grid').style.display = 'none';
    document.getElementById('dir-customers').style.display = 'block';
    if (newBtn) newBtn.style.display = 'none';
    renderCustomers();
  }
}

async function renderCustomers() {
  const container = document.getElementById('dir-customers');
  container.innerHTML = '<div style="color:var(--t3);font-size:13px;padding:4px 0">Loading…</div>';

  let projects;
  try {
    projects = await apiFetch('/api/projects').then(r => r.json());
  } catch (e) {
    container.innerHTML = `<div class="hint">Could not load data — ${e.message}</div>`;
    return;
  }

  const map = new Map();
  for (const proj of projects) {
    const participants = (proj.S?.participants || []);
    for (const p of participants) {
      const key = (p.contact || '').toLowerCase().trim() || (p.name || '').toLowerCase().trim();
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, { name: p.name || '', role: p.role || '', company: p.company || '', contact: p.contact || '', projects: [], interviews: 0 });
      }
      const entry = map.get(key);
      entry.interviews += p.status === 'completed' ? 1 : 0;
      const projName = proj.S?.projectName || 'Untitled';
      if (!entry.projects.find(pr => pr.id === proj.id)) {
        entry.projects.push({ id: proj.id, name: projName });
      }
    }
  }

  const rows = [...map.values()].sort((a, b) => b.interviews - a.interviews || a.name.localeCompare(b.name));

  if (!rows.length) {
    container.innerHTML = `
      <div class="dir-empty" style="display:flex">
        <div class="dei">👥</div>
        <div class="del">No customers yet</div>
        <div class="ded">Add participants to your research projects and they'll appear here.</div>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="cust-wrap">
      <table class="cust-tbl">
        <thead><tr>
          <th>Name</th><th>Role / Company</th><th>Contact</th><th>Research</th><th style="text-align:right">Interviews</th>
        </tr></thead>
        <tbody>
          ${rows.map(r => `<tr>
            <td><div class="cp">${esc(r.name)}</div></td>
            <td><div class="cs">${esc(r.role)}${r.company ? ' · ' + esc(r.company) : ''}</div></td>
            <td><div class="cs">${esc(r.contact)}</div></td>
            <td><div class="cust-pills">${r.projects.map(pr => `<span class="cust-proj-pill">${esc(pr.name)}</span>`).join('')}</div></td>
            <td style="text-align:right"><span class="cust-iv-badge ${r.interviews > 0 ? 'has-iv' : ''}">${r.interviews}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// ── Directory view ─────────────────────────────
async function showDirectory() {
  document.getElementById('dir-view').style.display = 'flex';
  document.getElementById('cockpit-view').style.display = 'none';
  document.body.style.overflow = 'auto';
  if (_activeTab === 'customers') {
    await renderCustomers();
  } else {
    await renderDirectory();
  }
}

function showCockpit() {
  document.getElementById('dir-view').style.display = 'none';
  document.getElementById('cockpit-view').style.display = 'grid';
  document.body.style.overflow = 'hidden';
}

async function backToDirectory() {
  saveState();
  await showDirectory();
}

async function renderDirectory() {
  const grid = document.getElementById('dir-grid');
  const empty = document.getElementById('dir-empty');
  empty.style.display = 'none';
  grid.innerHTML = '<div style="color:var(--t3);font-size:13px;padding:4px 0">Loading…</div>';

  try {
    const projects = await apiFetch('/api/projects').then(r => r.json());
    if (!projects.length) {
      empty.style.display = 'flex';
      grid.innerHTML = '';
      return;
    }
    grid.innerHTML = projects.map(p => {
      const state = p.S || {};
      const name = state.projectName || 'Untitled project';
      const purpose = (state.purpose || '').trim();
      const designers = (state.designer || []);
      const researchers = (state.researcher || []);
      const status = deriveStatus(state);
      const pills = [
        ...designers.map(n => `<span class="pj-pill pj-pill-d">${esc(n)}</span>`),
        ...researchers.map(n => `<span class="pj-pill pj-pill-r">${esc(n)}</span>`),
      ].join('');
      const methodLabel = state.methodology === 'usability' ? 'Usability test'
        : state.methodology === 'discovery' ? 'Discovery interview' : '';
      return `
        <div class="pj-card" onclick="openProject('${p.id}')">
          <div class="pj-card-top">
            <div class="pj-name">${esc(name)}</div>
            <div class="pj-menu" onclick="event.stopPropagation()">
              <button class="pj-menu-btn" onclick="toggleCardMenu('${p.id}')">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="3" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="8" cy="13" r="1.2"/></svg>
              </button>
              <div class="pj-menu-drop" id="pjm-${p.id}">
                <button class="pj-menu-item" onclick="deleteProject('${p.id}')">Delete project</button>
              </div>
            </div>
          </div>
          ${purpose ? `<div class="pj-desc">${esc(purpose)}</div>` : ''}
          ${methodLabel ? `<div style="margin-top:2px"><span class="pj-method-tag">${esc(methodLabel)}</span></div>` : ''}
          ${pills ? `<div class="pj-pills">${pills}</div>` : ''}
          <div class="pj-footer">
            <span class="pj-st s-${status.cls}">${status.label}</span>
            <span class="pj-date">Updated ${fmtRelative(new Date(p.updatedAt))}</span>
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    grid.innerHTML = `<div class="hint" style="padding:4px 0">Could not load projects — ${e.message}</div>`;
  }
}

function deriveStatus(state) {
  if (state.analysisResult?.participants?.length) return { label: 'Analysis', cls: 'analysis' };
  if ((state.participants || []).some(p => p.status === 'completed')) return { label: 'Interviews', cls: 'done' };
  if ((state.participants || []).length > 0) return { label: 'Recruiting', cls: 'progress' };
  if (state.projectName || (state.objectives || []).some(o => o.objective)) return { label: 'Planning', cls: 'planning' };
  return { label: 'Draft', cls: 'draft' };
}

function fmtRelative(date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

async function openProject(id) {
  currentProjectId = id;
  _projectCreatedAt = null;
  try {
    const project = await apiFetch(`/api/projects/${id}`).then(r => r.json());
    _projectCreatedAt = project.createdAt;
    Object.assign(S, project.S || {});
    if (typeof S.designer  === 'string') S.designer  = S.designer  ? [S.designer]  : [];
    if (typeof S.researcher === 'string') S.researcher = S.researcher ? [S.researcher] : [];
    if (!S.cohorts)       S.cohorts = { internal: false, customers: false, noncustomers: false };
    if (!S.sessions)      S.sessions = { internal:{min:'',ideal:'',max:''}, customers:{min:'',ideal:'',max:''}, noncustomers:{min:'',ideal:'',max:''} };
    if (!S.criteria)      S.criteria = { customers: '', noncustomers: '' };
    if (!S.screener)      S.screener = { customers: '', noncustomers: '' };
    if (!S.screenerChoice) S.screenerChoice = { customers: '', noncustomers: '' };
    if (!S.chipSelections) S.chipSelections = { customers: [], noncustomers: [] };
    if (!S.methodology)   S.methodology = 'usability';
    if (!S.championsLink) S.championsLink = '';
    if (!S.customerLink)  S.customerLink  = '';
    if (!S.surveyParticipants) S.surveyParticipants = [];
    // Migrate old participant statuses
    S.participants = (S.participants || []).map(p => {
      const migrated = { ...p };
      if (p.status === 'pending')       migrated.status = 'identified';
      if (p.status === 'outreach-sent') migrated.status = 'contacted';
      if (p.status === 'declined')      migrated.status = 'dropped';
      if (!migrated.sessionLink) migrated.sessionLink = migrated.zoomLink || '';
      if (!migrated.cohort)   migrated.cohort   = migrated.type === 'internal' ? 'internal' : 'customer';
      if (!migrated.audience) migrated.audience = migrated.type === 'internal' ? 'internal-fresh' : 'csm';
      if (!migrated.msg1)     migrated.msg1 = '';
      if (!migrated.msg2)     migrated.msg2 = '';
      return migrated;
    });
    pid  = project.pid  || 1;
    oid  = project.oid  || 1;
    spid = project.spid || 1;
  } catch (e) {
    toast('Failed to load project');
    return;
  }
  restoreUI();
  goTo('setup');
  showCockpit();
}

async function deleteProject(id) {
  if (!confirm('Delete this project? This cannot be undone.')) return;
  try {
    await apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
    toast('Project deleted');
    await renderDirectory();
  } catch (e) {
    toast('Delete failed: ' + e.message);
  }
}

function toggleCardMenu(id) {
  const target = document.getElementById('pjm-' + id);
  const isOpen = target.classList.contains('open');
  document.querySelectorAll('.pj-menu-drop').forEach(m => m.classList.remove('open'));
  if (!isOpen) target.classList.add('open');
}

document.addEventListener('click', () => {
  document.querySelectorAll('.pj-menu-drop').forEach(m => m.classList.remove('open'));
});

// ── New / reset project ────────────────────────
async function newProject() {
  currentProjectId = 'proj_' + Date.now();
  _projectCreatedAt = new Date().toISOString();

  Object.assign(S, {
    projectName: '', date: '', area: '', designer: [], researcher: [],
    purpose: '', context: '',
    methodology: 'usability',
    cohorts: { internal: false, customers: false, noncustomers: false },
    sessions: { internal:{min:'',ideal:'',max:''}, customers:{min:'',ideal:'',max:''}, noncustomers:{min:'',ideal:'',max:''} },
    criteria: { customers: '', noncustomers: '' },
    screener: { customers: '', noncustomers: '' },
    screenerChoice: { customers: '', noncustomers: '' },
    chipSelections: { customers: [], noncustomers: [] },
    championsLink: '', customerLink: '',
    objectives: [], participants: [], surveyParticipants: [],
    analysisResult: null, synthesisResult: null,
  });
  pid = 1; oid = 1; spid = 1;

  ['f-name','f-date','f-area','f-purpose','f-context']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  renderPersonPills('designer');
  renderPersonPills('researcher');
  document.getElementById('tb-title').textContent = 'New project';
  document.getElementById('obj-rows').innerHTML = '';
  document.getElementById('a-content').style.display = 'none';
  document.getElementById('a-empty').style.display = 'block';
  document.querySelectorAll('.nav').forEach(el => el.classList.remove('done'));
  setMethod('usability');
  ['internal','customers','noncustomers'].forEach(c => {
    document.getElementById('csel-' + c)?.classList.remove('selected');
    const d = document.getElementById('cdetail-' + c);
    if (d) d.style.display = 'none';
  });
  addObjRow({ priority: 'Must' });
  updateRecruitBadge();

  await saveStateAsync();
  showCockpit();
  goTo('setup');
}

// ── Utils ─────────────────────────────────────
function toast(m) {
  const e = document.getElementById('toast');
  e.textContent = m;
  e.classList.add('show');
  clearTimeout(e._t);
  e._t = setTimeout(() => e.classList.remove('show'), 2800);
}
function initials(n) { return (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}
function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function liveTitle() {
  const n = document.getElementById('f-name').value || 'New project';
  S.projectName = n;
  document.getElementById('tb-title').textContent = n;
}

// ── Restore UI from S ─────────────────────────
function restoreUI() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('f-name',    S.projectName);
  set('f-date',    S.date);
  set('f-area',    S.area);
  set('f-purpose', S.purpose);
  set('f-context', S.context);
  set('f-champions-link', S.championsLink);
  set('f-customer-link',  S.customerLink);
  set('f-criteria-customers',    S.criteria?.customers    || '');
  set('f-criteria-noncustomers', S.criteria?.noncustomers || '');
  set('f-screener-customers',    S.screener?.customers    || '');
  set('f-screener-noncustomers', S.screener?.noncustomers || '');
  // session fields
  ['internal','customers','noncustomers'].forEach(c => {
    set('f-sessions-' + c + '-min',   S.sessions?.[c]?.min   || '');
    set('f-sessions-' + c + '-ideal', S.sessions?.[c]?.ideal || '');
    set('f-sessions-' + c + '-max',   S.sessions?.[c]?.max   || '');
  });
  document.getElementById('tb-title').textContent = S.projectName || 'New project';
  renderPersonPills('designer');
  renderPersonPills('researcher');

  document.getElementById('obj-rows').innerHTML = '';
  const savedOid = oid;
  oid = 1;
  if (S.objectives.length) S.objectives.forEach(o => addObjRow(o));
  else addObjRow({ priority: 'Must' });
  oid = savedOid;

  // restore methodology
  setMethod(S.methodology || 'usability');
  // restore cohorts
  restoreCohorts();
  // restore screener choices
  ['customers','noncustomers'].forEach(cohort => {
    const choice = S.screenerChoice?.[cohort];
    if (choice) setScreenerChoice(cohort, choice);
    // restore chip selections
    const saved = S.chipSelections?.[cohort] || [];
    if (saved.length) {
      document.querySelectorAll(`#chips-${cohort} .crit-chip`).forEach(chip => {
        if (saved.includes(chip.dataset.val)) chip.classList.add('selected');
      });
    }
  });

  updateRecruitBadge();

  document.querySelectorAll('.nav').forEach(el => el.classList.remove('done'));
  if (S.projectName || S.purpose || S.objectives.some(o => o.objective))
    document.getElementById('nav-setup').classList.add('done');
  if (S.participants.length)
    document.getElementById('nav-recruit').classList.add('done');

  updateAnalysisBtn();

  if (S.analysisResult?.participants?.length || S.synthesisResult) {
    renderAnalysis({ participants: S.analysisResult?.participants || [], synthesis: S.synthesisResult });
    document.getElementById('nav-analysis').classList.add('done');
  } else {
    document.getElementById('a-content').style.display = 'none';
    document.getElementById('a-empty').style.display = 'block';
  }
}

// ── Navigation ────────────────────────────────
function goTo(p) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav').forEach(el => el.classList.remove('active'));
  document.getElementById('page-' + p).classList.add('active');
  document.getElementById('nav-' + p).classList.add('active');
  if (p === 'recruit') refreshRecruitPage();
}

// ── Drawer ────────────────────────────────────
function openDrawer() {
  renderDocPreview();
  document.getElementById('overlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');
  document.getElementById('prev-btn').classList.add('on');
}
function closeDrawer() {
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('prev-btn').classList.remove('on');
}

// ── Safe API fetch — redirects to login if session expired ──
async function apiFetch(url, opts = {}) {
  const res = await fetch(url, opts);
  const ct = res.headers.get('content-type') || '';
  if (!res.ok || ct.includes('text/html')) {
    // Auth redirect: server returned HTML instead of JSON
    window.location.href = '/auth/google';
    throw new Error('Session expired — redirecting to login');
  }
  return res;
}

// ── Agent (Claude with tools, via server) ─────
const AGENT_SYSTEM = `You are a research operations assistant.

Always respond with valid JSON only — no markdown fences, no preamble.

Response schemas:
- Analysis: {"participants":[{"name":"","role":"","byObjective":[{"objective":"","finding":"2-3 sentence narrative specific to this objective: what this person does/experiences, the tension or insight, and why it matters — enough to stand alone without reading the transcript","confidence":"high|medium|low","quotes":[""]}]}],"synthesis":{"tldr":"","themes":[{"name":"","description":"","participants":""}],"topPainPoints":[""],"recommendations":[""],"openQuestions":[""]}}`;

async function callAgent(userMsg, options = {}) {
  const res = await apiFetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: AGENT_SYSTEM,
      messages: [{ role: 'user', content: userMsg }],
      max_tokens: options.max_tokens || 4000,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Agent error');
  const text = data.content?.find(b => b.type === 'text')?.text || '';
  try { return JSON.parse(text.replace(/```json|```/g, '').trim()); }
  catch { throw new Error('JSON parse error: ' + text.slice(0, 200)); }
}

// Variant that returns plain text (for champions brief etc.)
async function callAgentText(prompt, options = {}) {
  const res = await apiFetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: 'You are a research operations assistant. Write like a colleague on Slack: warm, direct, short sentences, no em dashes, no corporate language. Return plain text only.',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.max_tokens || 600,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Agent error');
  return data.content?.find(b => b.type === 'text')?.text || '';
}

// ── AI fill (setup page) ───────────────────────
async function fillWithAI() {
  const input = document.getElementById('ai-input').value.trim();
  if (!input) { toast('Describe your research first'); return; }

  const btn = document.getElementById('ai-fill-btn');
  const status = document.getElementById('ai-fill-status');
  btn.disabled = true;
  btn.textContent = '✦ Generating…';
  status.textContent = '';

  const prompt = `Extract and generate structured research plan fields from this description. Return ONLY a JSON object — no markdown, no preamble.

Description:
${input}

Return this schema (use empty string "" for anything not determinable):
{
  "projectName": "short descriptive name",
  "area": "product area or domain",
  "purpose": "2-3 sentence research motivation and top-level goal",
  "context": "constraints, background, additional notes",
  "objectives": [
    {
      "priority": "Must",
      "objective": "specific thing to learn",
      "hypothesis": "best assumption",
      "keyQuestions": "questions to answer",
      "participants": "who would be ideal",
      "methodology": "method + format",
      "goalTargets": "measurable target if applicable"
    }
  ]
}

Generate 2–4 well-prioritised learning objectives (Must/Should/Could) from the description.`;

  try {
    const data = await callAgent(prompt);

    if (data.projectName) {
      document.getElementById('f-name').value = data.projectName;
      S.projectName = data.projectName;
      document.getElementById('tb-title').textContent = data.projectName;
    }
    if (data.area)    document.getElementById('f-area').value    = data.area;
    if (data.purpose) document.getElementById('f-purpose').value = data.purpose;
    if (data.context) document.getElementById('f-context').value = data.context;

    if (data.objectives?.length) {
      document.getElementById('obj-rows').innerHTML = '';
      oid = 1;
      data.objectives.forEach(o => addObjRow(o));
    }

    status.textContent = '✓ Fields generated — review and edit below';
    status.style.color = 'var(--green)';
    toast('Fields filled — review and save when ready');
  } catch (e) {
    status.textContent = 'Failed: ' + e.message;
    status.style.color = 'var(--red)';
  }

  btn.disabled = false;
  btn.textContent = '✦ Generate fields';
}

// ── Setup ─────────────────────────────────────
function addObjRow(data) {
  const id = oid++;
  const d = data || {};
  const row = document.createElement('div');
  row.className = 'obj-row';
  row.id = 'obj-' + id;
  row.innerHTML = `
    <div class="occ">
      <select class="sel" id="op-${id}">
        <option value="Must"        ${d.priority === 'Must'        ? 'selected' : ''}>Must</option>
        <option value="Should"      ${d.priority === 'Should'      ? 'selected' : ''}>Should</option>
        <option value="Could"       ${d.priority === 'Could'       ? 'selected' : ''}>Could</option>
        <option value="Maybe Later" ${d.priority === 'Maybe Later' ? 'selected' : ''}>Maybe Later</option>
      </select>
    </div>
    <div class="occ"><textarea class="ta" id="oo-${id}" placeholder="What do you want to learn?">${d.objective || ''}</textarea></div>
    <div class="occ"><textarea class="ta" id="oh-${id}" placeholder="Your best assumption">${d.hypothesis || ''}</textarea></div>
    <div class="occ"><textarea class="ta" id="oq-${id}" placeholder="Questions to answer">${d.keyQuestions || ''}</textarea></div>
    <div class="occ"><textarea class="ta" id="ot-${id}" placeholder="Who would be ideal?">${d.participants || ''}</textarea></div>
    <div class="occ"><textarea class="ta" id="om-${id}" placeholder="Method + format">${d.methodology || ''}</textarea></div>
    <div class="occ"><textarea class="ta" id="og-${id}" placeholder="e.g. 3 of 5 rate 4+">${d.goalTargets || ''}</textarea></div>
    <div class="occ"><button class="delbtn" onclick="delObj(${id})">×</button></div>`;
  document.getElementById('obj-rows').appendChild(row);
}

function delObj(id) { document.getElementById('obj-' + id)?.remove(); scheduleAutoSave(); }

function readObjectives() {
  S.objectives = [];
  document.querySelectorAll('#obj-rows .obj-row').forEach(row => {
    const id = parseInt(row.id.replace('obj-', ''));
    S.objectives.push({
      id,
      priority:     document.getElementById('op-' + id)?.value || 'Must',
      objective:    document.getElementById('oo-' + id)?.value || '',
      hypothesis:   document.getElementById('oh-' + id)?.value || '',
      keyQuestions: document.getElementById('oq-' + id)?.value || '',
      participants: document.getElementById('ot-' + id)?.value || '',
      methodology:  document.getElementById('om-' + id)?.value || '',
      goalTargets:  document.getElementById('og-' + id)?.value || '',
    });
  });
}

// ── Auto-save ─────────────────────────────────
let _autoSaveTimer = null;
function scheduleAutoSave() {
  clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(() => {
    S.projectName = document.getElementById('f-name')?.value || '';
    S.date        = document.getElementById('f-date')?.value || '';
    S.area        = document.getElementById('f-area')?.value || '';
    S.purpose     = document.getElementById('f-purpose')?.value || '';
    S.context     = document.getElementById('f-context')?.value || '';
    S.championsLink = document.getElementById('f-champions-link')?.value || '';
    S.customerLink  = document.getElementById('f-customer-link')?.value  || '';
    ['internal','customers','noncustomers'].forEach(c => {
      if (!S.sessions[c]) S.sessions[c] = {};
      S.sessions[c].min   = document.getElementById('f-sessions-' + c + '-min')?.value   || '';
      S.sessions[c].ideal = document.getElementById('f-sessions-' + c + '-ideal')?.value || '';
      S.sessions[c].max   = document.getElementById('f-sessions-' + c + '-max')?.value   || '';
    });
    if (!S.criteria) S.criteria = {};
    if (!S.screener) S.screener = {};
    S.criteria.customers    = document.getElementById('f-criteria-customers')?.value    || '';
    S.criteria.noncustomers = document.getElementById('f-criteria-noncustomers')?.value || '';
    S.screener.customers    = document.getElementById('f-screener-customers')?.value    || '';
    S.screener.noncustomers = document.getElementById('f-screener-noncustomers')?.value || '';
    readObjectives();
    liveTitle();
    if (S.projectName || S.purpose || S.objectives.some(o => o.objective))
      document.getElementById('nav-setup').classList.add('done');
    saveState();
  }, 500);
}

// ── Research design — method ───────────────────
function setMethod(m) {
  S.methodology = m;
  ['usability', 'discovery'].forEach(k => {
    document.getElementById('mb-' + k)?.classList.toggle('active', k === m);
  });
  saveState();
}

// ── Cohorts ───────────────────────────────────
function toggleCohortSel(cohort) {
  if (!S.cohorts) S.cohorts = {};
  S.cohorts[cohort] = !S.cohorts[cohort];
  applyCohortSel(cohort);
  updateCohortTotals();
  scheduleAutoSave();
  syncRecruitCohorts();
}

function applyCohortSel(cohort) {
  const selected = S.cohorts?.[cohort] || false;
  document.getElementById('csel-' + cohort)?.classList.toggle('selected', selected);
  refreshCohortDetailTabs(cohort, selected);
}

function refreshCohortDetailTabs(justToggled, justSelected) {
  const COHORTS = ['internal', 'customers', 'noncustomers'];
  const selected = COHORTS.filter(c => S.cohorts?.[c]);

  // If the just-toggled cohort was newly selected, make it the active tab
  if (justToggled && justSelected) _activeCohortDetail = justToggled;
  // If active tab was just deselected, pick the first remaining selected cohort
  if (!S.cohorts?.[_activeCohortDetail]) {
    _activeCohortDetail = selected[0] || null;
  }

  const strip = document.getElementById('cohort-detail-tabstrip');
  if (!strip) return;

  if (!selected.length) {
    strip.style.display = 'none';
    COHORTS.forEach(c => { const d = document.getElementById('cdetail-' + c); if (d) d.style.display = 'none'; });
    return;
  }

  const LABELS = { internal: 'Internal Kongers', customers: 'Kong customers', noncustomers: 'Non-Kong customers' };
  strip.style.display = '';
  strip.innerHTML = `<div class="cd-tabstrip">${selected.map(c =>
    `<button class="cd-tab${c === _activeCohortDetail ? ' active' : ''}${c === 'noncustomers' ? ' paid-tab' : ''}" onclick="showCohortDetail('${c}')">${LABELS[c]}</button>`
  ).join('')}</div>`;

  COHORTS.forEach(c => {
    const d = document.getElementById('cdetail-' + c);
    if (d) d.style.display = (c === _activeCohortDetail) ? 'block' : 'none';
  });
}

function showCohortDetail(cohort) {
  _activeCohortDetail = cohort;
  refreshCohortDetailTabs();
}

function restoreCohorts() {
  ['internal', 'customers', 'noncustomers'].forEach(c => {
    document.getElementById('csel-' + c)?.classList.toggle('selected', !!(S.cohorts?.[c]));
  });
  // Set initial active tab to first selected cohort
  if (!_activeCohortDetail || !S.cohorts?.[_activeCohortDetail]) {
    _activeCohortDetail = ['internal','customers','noncustomers'].find(c => S.cohorts?.[c]) || null;
  }
  refreshCohortDetailTabs();
  updateCohortTotals();
}

function updateCohortTotals() {
  let totalIdeal = 0;
  ['internal','customers','noncustomers'].forEach(c => {
    if (!S.cohorts?.[c]) return;
    const v = parseInt(document.getElementById('f-sessions-' + c + '-ideal')?.value) || 0;
    totalIdeal += v;
  });
  const el = document.getElementById('cohort-total-summary');
  if (el) {
    const selected = ['internal','customers','noncustomers'].filter(c => S.cohorts?.[c]);
    if (!selected.length) { el.textContent = ''; return; }
    el.textContent = totalIdeal ? `${totalIdeal} sessions planned` : `${selected.length} cohort${selected.length > 1 ? 's' : ''} selected`;
  }
}

function toggleCritChip(el, cohort) {
  el.classList.toggle('selected');
  const selected = [...document.querySelectorAll('#chips-' + cohort + ' .crit-chip.selected')]
    .map(c => c.dataset.val);
  if (!S.chipSelections) S.chipSelections = {};
  S.chipSelections[cohort] = selected;
  saveState();
}

function setScreenerChoice(cohort, choice) {
  if (!S.screenerChoice) S.screenerChoice = {};
  S.screenerChoice[cohort] = choice;
  ['yes','no'].forEach(v => {
    document.getElementById('syn-' + v + '-' + cohort)?.classList.toggle('active', v === choice);
  });
  const panel = document.getElementById('screener-' + cohort + '-panel');
  if (panel) panel.style.display = choice === 'yes' ? 'block' : 'none';
  saveState();
}

// ── Prompt bar helper ─────────────────────────
function togglePbar(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('open');
}

// ── Cohort AI helpers ─────────────────────────
async function genCohortCriteria(cohort) {
  const inputId  = 'pbar-criteria-' + cohort + '-input';
  const statusId = 'pbar-criteria-' + cohort + '-status';
  const outputId = 'f-criteria-' + cohort;
  const input = document.getElementById(inputId)?.value.trim();
  if (!input) { toast('Describe who you need first'); return; }
  const btn = event.target;
  const status = document.getElementById(statusId);
  btn.disabled = true; btn.textContent = '✦ Drafting…'; if (status) status.textContent = '';
  const objectives = S.objectives.map(o => o.objective).filter(Boolean).join('; ') || S.purpose || '';
  const cohortLabel = cohort === 'customers' ? 'Kong customers (existing users)' : 'non-Kong participants (sourced via Respondent, paid)';
  const prompt = `Write a participant criteria statement for a UX research study. 3-4 short bullet points covering role, technical context, experience level, and must-have/must-not-have traits. Plain language, no corporate speak, no em dashes.

Cohort: ${cohortLabel}
What the researcher described: ${input}
${objectives ? 'Study objectives: ' + objectives : ''}

Return JSON: {"result":"bullet criteria as plain text using - dashes"}`;
  try {
    const data = await callAgent(prompt, { max_tokens: 300 });
    const text = data.result || '';
    const ta = document.getElementById(outputId);
    if (ta) { ta.value = text; scheduleAutoSave(); }
    if (status) { status.textContent = '✓ Edit as needed'; status.style.color = 'var(--green)'; }
  } catch(e) { if (status) { status.textContent = 'Failed'; status.style.color = 'var(--red)'; } }
  btn.disabled = false; btn.textContent = '✦ Draft';
}

async function genCohortScreener(cohort) {
  const inputId  = 'pbar-screener-' + cohort + '-input';
  const statusId = 'pbar-screener-' + cohort + '-status';
  const outputId = 'f-screener-' + cohort;
  const criteriaId = 'f-criteria-' + cohort;
  const input = document.getElementById(inputId)?.value.trim();
  const criteria = document.getElementById(criteriaId)?.value || '';
  if (!input && !criteria) { toast('Describe what you need to verify first'); return; }
  const btn = event.target;
  const status = document.getElementById(statusId);
  btn.disabled = true; btn.textContent = '✦ Drafting…'; if (status) status.textContent = '';
  const prompt = `Write a short research screener, 4-6 questions to qualify participants before a UX study session. Mix of multiple choice and short answer. No em dashes, no corporate language.

What needs to be verified: ${input || criteria}
${S.projectName ? 'Study: ' + S.projectName : ''}

Format each question as:
Q: [question text]
Type: [Multiple choice / Short answer]
[Options if multiple choice]
[Pass / fail criteria in brackets]

Return JSON: {"result":"screener questions as plain text"}`;
  try {
    const data = await callAgent(prompt, { max_tokens: 600 });
    const text = data.result || '';
    const ta = document.getElementById(outputId);
    if (ta) { ta.value = text; scheduleAutoSave(); }
    const suffix = cohort === 'noncustomers' ? '✓ Share with Shikha for sign-off before sending' : '✓ Review before sending';
    if (status) { status.textContent = suffix; status.style.color = 'var(--green)'; }
  } catch(e) { if (status) { status.textContent = 'Failed'; status.style.color = 'var(--red)'; } }
  btn.disabled = false; btn.textContent = '✦ Draft screener';
}

// ── Recruit tab switching ─────────────────────
function switchRecruitTab(tab) {
  ['source','manage'].forEach(t => {
    const el = document.getElementById('rtab-content-' + t);
    if (el) { el.style.display = t === tab ? 'flex' : 'none'; el.style.flexDirection = 'column'; }
    document.getElementById('rtab-' + t)?.classList.toggle('active', t === tab);
  });
  if (tab === 'source') renderSourceTab();
  if (tab === 'manage') renderManageTab();
}

function refreshRecruitPage() {
  const activeTab = ['source','manage'].find(t => document.getElementById('rtab-' + t)?.classList.contains('active')) || 'source';
  switchRecruitTab(activeTab);
  updateRecruitBadge();
}

function updateRecruitBadge() {
  const n = S.participants.length;
  const done = S.participants.filter(p => p.status === 'completed').length;
  const badge = document.getElementById('nb-recruit');
  const countEl = document.getElementById('manage-count');
  if (badge) { badge.style.display = n ? '' : 'none'; badge.textContent = `${done}/${n}`; }
  if (countEl) { countEl.style.display = n ? '' : 'none'; countEl.textContent = n; }
  if (n) document.getElementById('nav-recruit')?.classList.add('done');
}

function updateBadges() { updateRecruitBadge(); }

function syncRecruitCohorts() { renderSourceTab(); }

function show(id, visible) { const el = document.getElementById(id); if (el) el.style.display = visible ? 'flex' : 'none'; }

// ── SOURCE TAB ────────────────────────────────
function renderSourceTab() {
  const c = S.cohorts || {};
  const selected = ['internal','customers','noncustomers'].filter(k => c[k]);
  const any = selected.length > 0;
  const noC = document.getElementById('source-no-cohorts');
  if (noC) noC.style.display = any ? 'none' : 'block';

  // Keep active cohort valid
  if (!_activeSourceCohort || !c[_activeSourceCohort]) {
    _activeSourceCohort = selected[0] || null;
  }

  // Build tab strip
  const tabsEl = document.getElementById('source-cohort-tabs');
  if (tabsEl) {
    if (!any) {
      tabsEl.style.display = 'none';
    } else {
      const LABELS = { internal: 'Internal Kongers', customers: 'Kong customers', noncustomers: 'Non-Kong customers' };
      tabsEl.style.display = '';
      tabsEl.innerHTML = `<div class="cd-tabstrip">${selected.map(k =>
        `<button class="cd-tab${k === _activeSourceCohort ? ' active' : ''}${k === 'noncustomers' ? ' paid-tab' : ''}" onclick="switchSourceCohort('${k}')">${LABELS[k]}</button>`
      ).join('')}</div>`;
    }
  }

  // Show only active cohort section
  ['internal','customers','noncustomers'].forEach(k => {
    const el = document.getElementById('csrc-' + k);
    if (el) el.style.display = (c[k] && k === _activeSourceCohort) ? 'flex' : 'none';
  });

  buildRovoPrompt();
  buildHexGuidance();
  renderAddedPreviews();
  // Render per-person message lists inline (booking links live in the source tab now)
  restoreBookingLinks();
  renderParticipantMsgList('internal', S.participants.filter(p => p.cohort === 'internal' || p.type === 'internal'));
  renderParticipantMsgList('customer', S.participants.filter(p => p.cohort === 'customer' || (p.type !== 'internal' && p.cohort !== 'noncustomer')));
}

function restoreBookingLinks() {
  const cl = document.getElementById('f-champions-link');
  const kl = document.getElementById('f-customer-link');
  if (cl) cl.value = S.championsLink || '';
  if (kl) kl.value = S.customerLink  || '';
}

function switchSourceCohort(cohort) {
  _activeSourceCohort = cohort;
  renderSourceTab();
}

function buildRovoPrompt() {
  const area = S.area || '[product area]';
  const purpose = S.purpose ? S.purpose.slice(0, 100) + (S.purpose.length > 100 ? '…' : '') : '';
  const guide = S.methodology === 'usability' ? 'usability test' : S.methodology === 'discovery' ? 'discovery interview' : 'research session';
  const el = document.getElementById('rovo-prompt-text');
  if (el) el.textContent = `Help me find people internally at Kong who would be good participants for a ${guide} on ${area}.${purpose ? '\n\nContext: ' + purpose : ''}\n\nLook for a mix of: solutions engineers, field engineers, platform engineers, and anyone whose role matches the target user for this study. Include people from different timezones if possible.\n\nNote: Search Rovo directly, not Claude or Cowork. Rovo searches across Confluence which has role, team, and region data for everyone at Kong. Once you have names, DM people directly rather than posting in channels.`;
}

function buildHexGuidance() {
  const area = S.area || '';
  const urlHint = area.toLowerCase().includes('gateway') ? 'https://cloud.konghq.com/us/gateway-manager/%'
    : area.toLowerCase().includes('portal') ? 'https://cloud.konghq.com/us/%/portals%'
    : area.toLowerCase().includes('ai') ? 'https://cloud.konghq.com/us/%  (also filter AI_GATEWAY_ACTIVATED = TRUE)'
    : 'https://cloud.konghq.com/us/[feature-path]/%';
  const el = document.getElementById('hex-prompt-text');
  if (el) el.textContent = `Step-by-step:\n\n1. Open Hex → Section 2: Front-End Engagement Plug & Play Queries\n2. Date range: last 90 days (30 days for recency)\n3. url_pattern for your area:\n   ${urlHint}\n4. Min Distinct URL: 4, Distinct Page Views: 3\n5. Sort by DISTINCT_URLS descending\n6. Filter: BILLING_CLASSIFICATION = enterprise\n7. Check activation flags for your area\n8. ACCOUNT_OWNER column = the CSM to DM on Slack\n9. Export → filter in Google Sheets → add CSMs here`;
}

function copyPrompt(type) {
  const el = document.getElementById(type === 'rovo' ? 'rovo-prompt-text' : 'hex-prompt-text');
  if (el) { navigator.clipboard.writeText(el.textContent); toast('Copied'); }
}

function renderAddedPreviews() {
  const cohortMap = {
    internal:    p => p.cohort === 'internal' || p.type === 'internal',
    customer:    p => p.cohort === 'customer' || (p.type !== 'internal' && p.cohort !== 'noncustomer'),
    noncustomer: p => p.cohort === 'noncustomer',
  };
  ['internal','customer','noncustomer'].forEach(cohort => {
    const el = document.getElementById('added-preview-' + cohort); if (!el) return;
    const ps = S.participants.filter(cohortMap[cohort]);
    if (!ps.length) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.innerHTML = `<div style="padding-top:12px;border-top:1px solid var(--border-lt)"><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--t3);margin-bottom:6px">Added (${ps.length})</div>${ps.map(p=>`<div class="added-mini"><div class="pav" style="width:22px;height:22px;font-size:9px;flex-shrink:0">${initials(p.name)}</div><span class="added-mini-name">${esc(p.name)}</span><span class="added-mini-role">${esc(p.role||'')}</span><span class="audience-tag" style="margin-left:auto">${esc(AUDIENCE_LABELS[p.audience]||'')}</span></div>`).join('')}</div>`;
  });
}

// ── Add panel ─────────────────────────────────
function openAddPanel(cohort) {
  const panel = document.getElementById('add-panel');
  document.getElementById('ma-cohort').value = cohort;
  ['ma-name','ma-role','ma-company','ma-contact'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const titles = { internal:'Add internal Konger', customer:'Add CSM', noncustomer:'Log confirmed participant', survey:'Add survey respondent', any:'Add participant' };
  document.getElementById('add-panel-title').textContent = titles[cohort] || 'Add participant';
  const audField = document.getElementById('audience-field-wrap');
  const sel = document.getElementById('ma-audience');
  if (cohort === 'survey') { if (audField) audField.style.display = 'none'; }
  else {
    if (audField) audField.style.display = 'block';
    if (sel) sel.value = cohort === 'internal' ? 'internal-fresh' : cohort === 'customer' ? 'csm' : cohort === 'noncustomer' ? 'noncustomer' : 'internal-fresh';
  }
  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function closeAddPanel() { document.getElementById('add-panel').style.display = 'none'; }

function confirmManualAdd() {
  const name = document.getElementById('ma-name').value.trim();
  if (!name) { toast('Name required'); return; }
  const cohort = document.getElementById('ma-cohort').value || 'internal';
  if (cohort === 'survey') {
    addSurveyP({ name, contact: document.getElementById('ma-contact').value, company: document.getElementById('ma-company').value });
  } else {
    addP({ name, role: document.getElementById('ma-role').value, company: document.getElementById('ma-company').value, contact: document.getElementById('ma-contact').value, cohort, audience: document.getElementById('ma-audience').value || 'internal-fresh', type: cohort === 'internal' ? 'internal' : 'external' });
  }
  closeAddPanel();
}

// ── CSV upload ────────────────────────────────
let _csvUploadCohort = 'internal';
function triggerCSVUpload(cohort) { _csvUploadCohort = cohort || 'internal'; document.getElementById('csv-input').click(); }
function handleCSVUpload2(e) { const file = e.target.files[0]; if (!file) return; e.target.value = ''; const reader = new FileReader(); reader.onload = ev => processCSVText(ev.target.result, _csvUploadCohort); reader.readAsText(file); }

function parseCSVLine(line) {
  const result = []; let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQ = !inQ; }
    else if (line[i] === ',' && !inQ) { result.push(cur); cur = ''; }
    else { cur += line[i]; }
  }
  result.push(cur);
  return result.map(v => v.trim().replace(/^"|"$/g, ''));
}

function processCSVText(text, cohort) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) { toast('CSV needs a header row and at least one data row'); return; }
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
  const col = field => {
    const a = { name:['name','full name','participant'], role:['role','title','position'], company:['company','team','org'], contact:['contact','email','slack'], audience:['audience','type'] };
    return (a[field] || [field]).reduce((f, x) => f !== -1 ? f : headers.indexOf(x), -1);
  };
  const cols = { name: col('name'), role: col('role'), company: col('company'), contact: col('contact'), audience: col('audience') };
  const rows = lines.slice(1).map(line => {
    const v = parseCSVLine(line);
    return { name: cols.name >= 0 ? v[cols.name] || '' : '', role: cols.role >= 0 ? v[cols.role] || '' : '', company: cols.company >= 0 ? v[cols.company] || '' : '', contact: cols.contact >= 0 ? v[cols.contact] || '' : '', audience: cols.audience >= 0 ? v[cols.audience] || '' : '' };
  }).filter(r => r.name || r.contact);
  if (cohort === 'survey') { rows.forEach(r => addSurveyP(r)); toast(`${rows.length} survey respondent${rows.length !== 1 ? 's' : ''} added`); return; }
  const complete = rows.filter(r => r.name && r.role);
  const incomplete = rows.filter(r => !r.name || !r.role);
  complete.forEach(r => addP({ ...r, cohort, type: cohort === 'internal' ? 'internal' : 'external' }));
  if (complete.length) toast(`${complete.length} participant${complete.length > 1 ? 's' : ''} added`);
  if (incomplete.length) showCSVFillPanel(incomplete, cohort);
}

function showCSVFillPanel(rows, cohort) {
  const panel = document.getElementById('csv-panel');
  panel.dataset.cohort = cohort;
  panel.style.display = 'block';
  document.getElementById('csv-fill-rows').innerHTML = rows.map((r, i) => `
    <div style="padding:14px 0;border-bottom:1px solid var(--border-lt)">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--t3);margin-bottom:10px">
        Row ${i + 1}${r.name ? ' · ' + esc(r.name) : ''}
      </div>
      <div class="g2" style="margin-bottom:8px">
        <div><label class="fl">Name *</label><input class="inp ${!r.name ? 'inp-required' : ''}" id="cfr-name-${i}" value="${esc(r.name)}" placeholder="Full name"/></div>
        <div><label class="fl">Role / Title *</label><input class="inp ${!r.role ? 'inp-required' : ''}" id="cfr-role-${i}" value="${esc(r.role)}" placeholder="e.g. Senior Engineer"/></div>
      </div>
      <div class="g2">
        <div><label class="fl">Company / Team</label><input class="inp" id="cfr-company-${i}" value="${esc(r.company)}"/></div>
        <div><label class="fl">Slack / Email</label><input class="inp" id="cfr-contact-${i}" value="${esc(r.contact)}"/></div>
      </div>
    </div>`).join('');
  panel.dataset.count = rows.length;
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function confirmCSVFill() {
  const panel = document.getElementById('csv-panel');
  const count = parseInt(panel.dataset.count || '0');
  const cohort = panel.dataset.cohort || 'internal';
  let added = 0;
  for (let i = 0; i < count; i++) {
    const name = document.getElementById(`cfr-name-${i}`)?.value.trim();
    const role = document.getElementById(`cfr-role-${i}`)?.value.trim();
    if (!name || !role) { toast(`Row ${i + 1} needs name and role`); return; }
    addP({ name, role, company: document.getElementById(`cfr-company-${i}`)?.value || '', contact: document.getElementById(`cfr-contact-${i}`)?.value || '', cohort, type: cohort === 'internal' ? 'internal' : 'external' });
    added++;
  }
  panel.style.display = 'none';
  if (added) toast(`${added} participant${added > 1 ? 's' : ''} added`);
}

// ── Core participant functions ─────────────────
function addP(p) {
  p.id = pid++;
  p.status = 'identified';
  p.sessionLink = '';
  p.transcript = '';
  p.msg1 = '';
  p.msg2 = '';
  if (!p.audience) p.audience = p.type === 'internal' ? 'internal-fresh' : 'csm';
  S.participants.push(p);
  renderAddedPreviews();
  renderInlineMsgLists();
  renderManageTab();
  updateRecruitBadge();
  saveState();
}

function removeP(id) {
  S.participants = S.participants.filter(p => p.id !== id);
  renderAddedPreviews();
  renderInlineMsgLists();
  renderManageTab();
  updateRecruitBadge();
  updateAnalysisBtn();
  saveState();
}

// ── Survey participants ───────────────────────
function addSurveyP(p) {
  p.id = spid++;
  p.status = 'added';
  if (!S.surveyParticipants) S.surveyParticipants = [];
  S.surveyParticipants.push(p);
  renderSurveyTable();
  updateMetrics();
  saveState();
}

function setSurveyStatus(id, val) {
  const p = (S.surveyParticipants || []).find(p => p.id === id);
  if (p) { p.status = val; renderSurveyTable(); saveState(); }
}

function removeSurveyP(id) {
  S.surveyParticipants = (S.surveyParticipants || []).filter(p => p.id !== id);
  renderSurveyTable();
  updateMetrics();
  saveState();
}

function renderSurveyTable() {
  const sp = S.surveyParticipants || [];
  const tbl = document.getElementById('survey-tbl');
  const empty = document.getElementById('survey-empty');
  const body = document.getElementById('survey-body');
  if (!tbl) return;
  if (!sp.length) { tbl.style.display = 'none'; if (empty) empty.style.display = 'block'; return; }
  tbl.style.display = 'table';
  if (empty) empty.style.display = 'none';
  body.innerHTML = sp.map(p => {
    const s = SURVEY_STATUS[p.status] || SURVEY_STATUS['added'];
    return `<tr class="survey-row">
      <td><div class="cp">${esc(p.name || p.contact || '')}</div><div class="cs">${esc(p.contact || '')}</div></td>
      <td><div class="cs">${esc(p.company || '')}</div></td>
      <td><div class="spill-wrap"><span class="spill" style="background:${s.bg};color:${s.color}">${s.label}</span><select class="spill-sel" onchange="setSurveyStatus(${p.id},this.value)">${Object.entries(SURVEY_STATUS).map(([v,d])=>`<option value="${v}" ${p.status===v?'selected':''}>${d.label}</option>`).join('')}</select></div></td>
      <td style="text-align:right"><button class="btn xs" style="color:var(--red);border-color:#fca5a5" onclick="removeSurveyP(${p.id})">×</button></td>
    </tr>`;
  }).join('');
}

// ── Inline message rendering (source tab has messaging now) ──
function renderInlineMsgLists() {
  const ps = S.participants;
  renderParticipantMsgList('internal', ps.filter(p => p.cohort === 'internal' || p.type === 'internal'));
  renderParticipantMsgList('customer', ps.filter(p => p.cohort === 'customer' || (p.type !== 'internal' && p.cohort !== 'noncustomer')));
}

function renderMessageTab() { renderInlineMsgLists(); }

function renderParticipantMsgList(cohort, participants) {
  const el = document.getElementById('msglist-' + cohort); if (!el) return;
  if (!participants.length) {
    el.innerHTML = `<div class="hint" style="padding:6px 0">No ${cohort === 'internal' ? 'internal Konger' : 'CSM / customer'} participants added yet. Go to the Source tab.</div>`;
    return;
  }
  el.innerHTML = participants.map(p => `
    <div class="participant-msg-card" id="msgcard-${p.id}">
      <div class="pmc-hdr">
        <div class="pav" style="width:24px;height:24px;font-size:9px;flex-shrink:0">${initials(p.name)}</div>
        <div><div class="pmc-name">${esc(p.name)}</div><div class="pmc-role">${esc(p.role||'')}${p.company?' · '+esc(p.company):''}</div></div>
        <div style="margin-left:auto;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <select class="sel" style="max-width:230px;font-size:11px;padding:3px 6px" onchange="setAudience(${p.id},this.value)">
            ${Object.entries(AUDIENCE_LABELS).map(([v,l])=>`<option value="${v}" ${p.audience===v?'selected':''}>${l}</option>`).join('')}
          </select>
          <button class="btn sm" onclick="genParticipantMessages(${p.id})">✦ Draft</button>
        </div>
      </div>
      ${p.msg1 ? `
        <div class="msg-block"><div class="msg-block-label">Message 1: short ask, send first</div><textarea class="msg-ta" onchange="saveMsg(${p.id},'msg1',this.value)">${esc(p.msg1)}</textarea></div>
        <div class="msg-block"><div class="msg-block-label">Message 2: full context, send after they respond</div><textarea class="msg-ta" style="min-height:110px" onchange="saveMsg(${p.id},'msg2',this.value)">${esc(p.msg2)}</textarea></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn xs filled" onclick="copyBothMessages(${p.id})">Copy both</button>
          <button class="btn xs" onclick="setStatus(${p.id},'contacted');renderManageTab();toast('Marked as Contacted')">Mark contacted →</button>
        </div>` : `<div class="hint" style="font-size:11px;margin-top:4px">Select audience type above then click Draft.</div>`}
    </div>`).join('');
}

function setAudience(id, val) { const p = S.participants.find(p => p.id === id); if (p) { p.audience = val; saveState(); } }
function saveMsg(id, field, val) { const p = S.participants.find(p => p.id === id); if (p) { p[field] = val; saveState(); } }
function copyBothMessages(id) {
  const p = S.participants.find(p => p.id === id); if (!p) return;
  navigator.clipboard.writeText(`MESSAGE 1, send first\n${p.msg1}\n\n---\n\nMESSAGE 2, send after they respond\n${p.msg2}\n\nMake this sound like you. change anything that feels stiff.`);
  toast('Both messages copied');
}

async function genParticipantMessages(id) {
  const p = S.participants.find(p => p.id === id); if (!p) return;
  const card = document.getElementById('msgcard-' + id);
  const btn = card?.querySelector('button[onclick*="genParticipantMessages"]');
  if (btn) { btn.disabled = true; btn.textContent = '…'; }
  const audType = p.audience || 'internal-fresh';
  const topic = S.objectives.filter(o => o.objective).map(o => o.objective).join('; ') || S.purpose || 'research study';
  const guide = S.methodology === 'usability' ? 'moderated usability test' : S.methodology === 'discovery' ? 'discovery interview' : 'research session';
  const bookingLink = audType === 'csm' && S.customerLink ? S.customerLink : '';
  const whyYou = {
    'internal-fresh':    "MUST say they haven't worked on this product and that's the whole point. Without this they'll say 'I don't work on that.'",
    'internal-adjacent': "Say they know the platform but not this specific flow. That middle-ground is exactly the perspective you need.",
    'internal-rolematch':"Say they are exactly the role you're building for.",
    'se':                "About their customer-facing role. They see how customers evaluate and adopt Kong.",
    'field-engineer':    "About breadth: they work across many customer setups and that range is the value.",
    'csm':               "Message 1 is a CONNECTION REQUEST only: who you are, the org name, connection ask. NO study details. Message 2: study topic, why that org fits, 30-min session, offer options: intro you, add you to a call, or let you reach out directly.",
    'customer':          "Warm and direct. Clear time commitment, no prep needed, honest reactions are the point.",
    'noncustomer':       "Brief, specific about why they fit.",
  };
  const prompt = `Draft two recruiting messages. Follow all rules.

RULES:
1. Both messages always. Msg 1: short ask, 3-4 sentences, one ask, why-you line, NO study details. Msg 2: full context, sent after they say yes.
2. Why-you line is mandatory and specific, never generic.
3. Write like a colleague on Slack: warm, direct, short sentences, no em dashes, no corporate language.
4. End msg 2 with: "Make this sound like you. change anything that feels stiff."

AUDIENCE: ${audType}, ${AUDIENCE_LABELS[audType] || audType}
WHY-YOU: ${whyYou[audType] || 'Be specific.'}
PARTICIPANT: ${p.name}${p.role ? ', ' + p.role : ''}${p.company ? ' at ' + p.company : ''}
PROJECT: ${S.projectName || 'research study'}, ${S.area || 'our product'}
STUDY: ${guide}
TOPIC: ${topic}
FROM: Shikha, design team at Kong
${bookingLink ? 'BOOKING LINK (append to msg 2 or msg 1 if CSM): ' + bookingLink : ''}

Return ONLY valid JSON: {"msg1":"...","msg2":"..."}`;

  try {
    const data = await callAgent(prompt, { max_tokens: 900 });
    p.msg1 = data.msg1 || ''; p.msg2 = data.msg2 || '';
    saveState();
    const isCohortInternal = p.cohort === 'internal' || p.type === 'internal';
    renderParticipantMsgList(isCohortInternal ? 'internal' : 'customer', S.participants.filter(x => isCohortInternal ? (x.cohort === 'internal' || x.type === 'internal') : (x.cohort === 'customer' || (x.type !== 'internal' && x.cohort !== 'noncustomer'))));
    toast(`Messages drafted for ${p.name}`);
  } catch(err) { toast('Draft failed: ' + err.message); }
  if (btn) { btn.disabled = false; btn.textContent = '✦ Draft'; }
}

async function genCohortMessages(cohort) {
  const ps = cohort === 'internal'
    ? S.participants.filter(p => p.cohort === 'internal' || p.type === 'internal')
    : S.participants.filter(p => p.cohort === 'customer' || (p.type !== 'internal' && p.cohort !== 'noncustomer'));
  if (!ps.length) { toast('No participants in this cohort yet'); return; }
  for (const p of ps) await genParticipantMessages(p.id);
}

// ── Champions brief ───────────────────────────
async function genChampionsBrief() {
  const btn = document.getElementById('champions-gen-btn');
  const status = document.getElementById('champions-status');
  btn.disabled = true; btn.textContent = '✦ Generating…'; status.textContent = '';
  const link = S.championsLink || '';
  const criteria = S.objectives.filter(o => o.participants).map(o => o.participants).join('; ') || 'participants familiar with the product area';
  const guide = S.methodology === 'usability' ? 'usability test' : 'research session';
  const prompt = `Write a short Slack message to Shikha (UX researcher at Kong) requesting help recruiting from the Kong Champions program.

Include: what the study is about in plain language, what participants do (${guide}, ~30 min), participant criteria (${criteria}), no incentive (Champions volunteer).${link ? '\n\nInclude this booking link: ' + link : ''}

PROJECT: ${S.projectName || 'research study'}, ${S.area || ''}
PURPOSE: ${S.purpose || ''}

Plain text only, no JSON, no subject line. Write like a colleague on Slack.`;
  try {
    const text = await callAgentText(prompt, { max_tokens: 400 });
    document.getElementById('champions-text').value = text;
    document.getElementById('champions-output').style.display = 'block';
    status.textContent = '✓ Copy and send to Shikha on Slack';
    status.style.color = 'var(--green)';
  } catch(err) { status.textContent = 'Failed: ' + err.message; status.style.color = 'var(--red)'; }
  btn.disabled = false; btn.textContent = '✦ Generate brief';
}
function copyChampions() { navigator.clipboard.writeText(document.getElementById('champions-text').value); toast('Copied'); }

// ── Intercom email ────────────────────────────
async function genIntercomEmail() {
  const btn = document.getElementById('intercom-gen-btn');
  const status = document.getElementById('intercom-status');
  btn.disabled = true; btn.textContent = '✦ Generating…'; status.textContent = '';
  const topic = S.objectives.filter(o => o.objective).map((o,i) => `${i+1}. ${o.objective}`).join('\n') || S.purpose || 'understanding user needs';
  const prompt = `Write a recruitment email for Intercom to reach Kong customers directly (no CSM). Concise, warm, specific. No em dashes, no corporate language.

Include: what the study is about, what's involved (30-min session, no prep, no roadmap commitments, honest reactions are the point), clear CTA. Leave [INCENTIVE] placeholder if applicable.

PROJECT: ${S.projectName || 'research study'}
PURPOSE: ${S.purpose || ''}
AREA: ${S.area || ''}
OBJECTIVES: ${topic}

Return JSON: {"subject":"...","body":"..."}`;
  try {
    const data = await callAgent(prompt, { max_tokens: 700 });
    document.getElementById('intercom-subject').value = data.subject || '';
    document.getElementById('intercom-text').value    = data.body    || '';
    document.getElementById('intercom-output').style.display = 'block';
    status.textContent = '✓ Get reviewed by Shikha before sending. Send in Intercom in batches of 50–100.';
    status.style.color = 'var(--green)';
  } catch(err) { status.textContent = 'Failed: ' + err.message; status.style.color = 'var(--red)'; }
  btn.disabled = false; btn.textContent = '✦ Generate email';
}
function copyIntercom() {
  navigator.clipboard.writeText(`Subject: ${document.getElementById('intercom-subject').value}\n\n${document.getElementById('intercom-text').value}`);
  toast('Copied');
}

// ── STATUS PILL & MANAGE TAB ──────────────────
function statusPill(id, current) {
  const s = STATUS_PILL[current] || STATUS_PILL['identified'];
  return `<div class="spill-wrap">
    <span class="spill" style="background:${s.bg};color:${s.color}">${s.label}</span>
    <select class="spill-sel" onchange="setStatus(${id},this.value)">
      ${Object.entries(STATUS_PILL).map(([v,d]) => `<option value="${v}" ${current===v?'selected':''}>${d.label}</option>`).join('')}
    </select>
  </div>`;
}

function setStatus(id, val) {
  const p = S.participants.find(p => p.id === id); if (!p) return;
  p.status = val;
  renderManageTab();
  updateRecruitBadge();
  updateAnalysisBtn();
  saveState();
}

function setZoom(id, val) { const p = S.participants.find(p => p.id === id); if (p) { p.sessionLink = val; saveState(); } }

function renderManageTab() {
  const tbl   = document.getElementById('manage-tbl');
  const empty = document.getElementById('manage-empty');
  const body  = document.getElementById('manage-body');
  if (!tbl) return;
  const ps = S.participants;
  if (!ps.length) { tbl.style.display = 'none'; if (empty) empty.style.display = 'block'; return; }
  tbl.style.display = 'table';
  if (empty) empty.style.display = 'none';
  body.innerHTML = ps.map(p => {
    const hasT = !!p.transcript;
    return `<tr>
      <td><div class="cp">${esc(p.name)}</div><div class="cs">${esc(p.contact||'')}</div></td>
      <td><div class="cs">${esc(p.role||'')}${p.company?' · '+esc(p.company):''}</div><span class="audience-tag">${esc(AUDIENCE_LABELS[p.audience]||'')}</span></td>
      <td>${statusPill(p.id, p.status)}</td>
      <td><input class="iinp" value="${esc(p.sessionLink||'')}" placeholder="Session link" onchange="setZoom(${p.id},this.value)" style="width:130px"/></td>
      <td style="text-align:right;white-space:nowrap">
        <button class="btn xs ${hasT?'transcript-done':'filled'}" onclick="triggerTranscriptUpload(${p.id})">${hasT?'✓ Transcript':'+ Transcript'}</button>
        <button class="btn xs" style="color:var(--red);border-color:#fca5a5;margin-left:4px" onclick="removeP(${p.id})">×</button>
      </td>
    </tr>`;
  }).join('');
  updateMetrics();
}

// ── Transcript upload ─────────────────────────
function parseVTT(content) {
  return content.split('\n').filter(line => {
    const t = line.trim();
    if (!t) return false;
    if (t.startsWith('WEBVTT')) return false;
    if (t.startsWith('NOTE')) return false;
    if (/^\d+$/.test(t)) return false;
    if (/\d{2}:\d{2}.*-->/.test(t)) return false;
    return true;
  }).join('\n').trim();
}

function triggerTranscriptUpload(pid) {
  const input = document.getElementById('transcript-upload');
  input.dataset.pid = pid;
  input.click();
}

function handleTranscriptUpload(e) {
  const file = e.target.files[0];
  const pid  = parseInt(e.target.dataset.pid);
  e.target.value = '';
  if (!file || !pid) return;

  const reader = new FileReader();
  reader.onload = ev => {
    const raw = ev.target.result;
    const transcript = file.name.endsWith('.vtt') ? parseVTT(raw) : raw;
    const p = S.participants.find(p => p.id === pid);
    if (p) {
      p.transcript = transcript;
      if (['identified','contacted','scheduled'].includes(p.status)) p.status = 'completed';
      saveState();
      renderManageTab();
      updateRecruitBadge();
      updateAnalysisBtn();
      toast(`Transcript uploaded for ${p.name}`);
    }
  };
  reader.readAsText(file);
}

function updateMetrics() {
  const ps = S.participants;
  const sp = S.surveyParticipants || [];
  document.getElementById('m-total').textContent = ps.length + sp.length;
  document.getElementById('m-done').textContent  = ps.filter(p => p.status === 'completed').length + sp.filter(p => p.status === 'responded').length;
  document.getElementById('m-sched').textContent = ps.filter(p => p.status === 'scheduled').length;
  document.getElementById('m-pend').textContent  = ps.filter(p => ['identified','contacted'].includes(p.status)).length;
}

// ── Analysis ──────────────────────────────────
function updateAnalysisBtn() {
  const btn = document.getElementById('a-btn');
  if (!btn) return;
  const hasTranscripts = S.participants.some(p => p.status === 'completed' && p.transcript);
  btn.disabled = !hasTranscripts;
  btn.title = hasTranscripts ? '' : 'Add at least one completed interview with a transcript first';
  const ed = document.querySelector('#a-empty .ed');
  if (ed) ed.textContent = hasTranscripts
    ? 'Click below to generate analysis from your transcripts.'
    : 'You need at least one completed interview with a transcript uploaded before running analysis.';
}

async function runAnalysis() {
  const hasTranscripts = S.participants.some(p => p.status === 'completed' && p.transcript);
  if (!hasTranscripts) { toast('Upload at least one transcript first'); return; }

  const initBtn = document.getElementById('a-btn');
  const reBtn   = document.getElementById('a-reanalyze-btn');
  if (initBtn) { initBtn.textContent = 'Analysing…'; initBtn.disabled = true; }
  if (reBtn)   { reBtn.textContent   = 'Analysing…'; reBtn.disabled   = true; }
  readObjectives();

  const TRANSCRIPT_CHAR_LIMIT = 5000;
  const completed = S.participants.filter(p => p.status === 'completed');
  const participantData = completed.length
    ? completed.map(p => {
        const raw = p.transcript || 'No transcript — include any verbal notes you have.';
        const truncated = raw.length > TRANSCRIPT_CHAR_LIMIT
          ? raw.slice(0, TRANSCRIPT_CHAR_LIMIT) + '\n[transcript truncated for length]'
          : raw;
        return `PARTICIPANT: ${p.name} (${p.role}${p.company ? ' at ' + p.company : ''})\nTRANSCRIPT:\n${truncated}`;
      }).join('\n\n---\n\n')
    : 'No completed interviews. Simulate findings for a study on researcher workflow fragmentation with 3 participants.';

  const objList = S.objectives.filter(o => o.objective)
    .map((o, i) => `${i + 1}. [${o.priority}] ${o.objective}`)
    .join('\n') || '1. [Must] Understand pain points in researcher workflow across tools';

  const prompt = `Analyze these research interviews. For each participant, map their findings to every learning objective. For each objective entry write a detailed, in-depth finding (2-3 sentences) specific to that objective: what this person does or experiences, the tension or key insight, and why it matters — enough that a reader gets the full picture without needing the transcript. Include 1-2 verbatim quotes that best support the finding. Also write a cross-interview synthesis.

PROJECT: ${S.projectName || 'User research study'}
PURPOSE: ${S.purpose || 'Understanding user needs'}

LEARNING OBJECTIVES:
${objList}

INTERVIEWS:
${participantData}

Return the full JSON structure.`;

  try {
    const data = await callAgent(prompt, { max_tokens: 2500 });
    S.analysisResult = { participants: data.participants || [] };
    S.synthesisResult = data.synthesis || null;
    renderAnalysis(data);
    saveState();
    document.getElementById('nav-analysis').classList.add('done');
    toast('Analysis complete');
  } catch (e) {
    if (initBtn) { initBtn.textContent = 'Create analysis'; updateAnalysisBtn(); }
    if (reBtn)   { reBtn.textContent   = 'Re-analyze';      reBtn.disabled   = false; }
    toast('Analysis failed: ' + e.message);
    console.error(e);
  }
}

function renderAnalysis(data) {
  document.getElementById('a-empty').style.display = 'none';
  const out = document.getElementById('a-content');
  out.style.display = 'flex';
  out.innerHTML = '';

  const participants = data.participants || S.analysisResult?.participants || [];
  const syn = data.synthesis || S.synthesisResult;
  S.synthesisResult = syn;

  out.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between">
    <div style="font-size:12px;color:var(--t3)">${participants.length} participant${participants.length !== 1 ? 's' : ''} analysed</div>
    <button class="btn" id="a-reanalyze-btn" onclick="runAnalysis()">Re-analyze</button>
  </div>`;

  if (syn) {
    let h = `<div class="panel"><div class="ptitle">Synthesis</div>`;
    if (syn.tldr) h += `<div style="font-size:14px;line-height:1.7;padding:12px 14px;background:var(--page);border-radius:var(--rsm);margin-bottom:14px">${esc(syn.tldr)}</div>`;
    if (syn.themes?.length) {
      h += `<div class="ptitle" style="margin-top:4px">Themes</div>`;
      h += syn.themes.map(t =>
        `<div style="padding:10px 0;border-bottom:1px solid var(--border-lt)">
          <div style="font-weight:500;font-size:13px;margin-bottom:3px">${esc(t.name)}</div>
          <div class="fi-t">${esc(t.description)}</div>
          ${t.participants ? `<div style="font-size:11px;color:var(--t3);margin-top:3px">↳ ${esc(t.participants)}</div>` : ''}
        </div>`
      ).join('');
    }
    if (syn.topPainPoints?.length) {
      h += `<div class="ptitle" style="margin-top:14px">Top pain points</div>`;
      h += syn.topPainPoints.map((p, i) => `<div class="ni"><span class="nn">${i + 1}</span>${esc(p)}</div>`).join('');
    }
    if (syn.recommendations?.length) {
      h += `<div class="ptitle" style="margin-top:14px">Recommendations</div>`;
      h += syn.recommendations.map((r, i) => `<div class="ni"><span class="nn" style="color:var(--green)">${i + 1}</span>${esc(r)}</div>`).join('');
    }
    if (syn.openQuestions?.length) {
      h += `<div class="ptitle" style="margin-top:14px">Open questions</div>`;
      h += syn.openQuestions.map(q => `<div class="ni"><span class="nn">?</span>${esc(q)}</div>`).join('');
    }
    h += '</div>';
    out.innerHTML += h;
  }

  if (participants.length) {
    const allObjectives = [];
    participants.forEach(pu => {
      (pu.byObjective || []).forEach((ob, i) => {
        if (!allObjectives[i]) allObjectives[i] = ob.objective;
      });
    });

    if (allObjectives.length) {
      let h = `<div class="panel"><div class="ptitle">Findings by objective</div>`;
      allObjectives.forEach((objText, i) => {
        h += `<div class="obj-sh" style="margin-top:${i > 0 ? '20px' : '0'}">Objective ${i + 1}: ${esc(objText)}</div>`;
        participants.forEach(pu => {
          const ob = (pu.byObjective || [])[i];
          if (!ob) return;
          h += `<div style="margin-bottom:12px;padding:12px 14px;background:var(--page);border-radius:var(--rsm)">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <div class="pav" style="width:24px;height:24px;font-size:9px;flex-shrink:0">${initials(pu.name)}</div>
              <span style="font-size:13px;font-weight:500">${esc(pu.name)}</span>
              <span style="font-size:11px;color:var(--t3)">${esc(pu.role)}</span>
              <span class="conf c${(ob.confidence || 'm')[0]}" style="margin-left:auto">${ob.confidence || 'medium'}</span>
            </div>
            <p style="font-size:13px;color:var(--t1);line-height:1.65;margin:0 0 8px">${esc(ob.finding)}</p>
            ${(ob.quotes || []).slice(0, 2).map(q => `<div style="font-size:13px;font-style:italic;color:var(--t2);line-height:1.6;padding:8px 12px;border-left:3px solid var(--border);background:#fff;border-radius:0 var(--rsm) var(--rsm) 0;margin-top:6px">"${esc(q)}"</div>`).join('')}
          </div>`;
        });
      });
      h += '</div>';
      out.innerHTML += h;
    }
  }
}

// ── Generate document ─────────────────────────
function generateDocument() {
  readObjectives();
  const html = buildDocHTML();
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) toast('Pop-up blocked — allow pop-ups and try again');
  else toast('Document opened — use Print → Save as PDF');
}

function buildDocHTML() {
  const objs = S.objectives;
  const parts = S.participants;
  const name = S.projectName || 'Untitled';

  const priBadge = p => {
    const map = {
      'Must':        { bg: '#fee2e2', color: '#b91c1c' },
      'Should':      { bg: '#fef3c7', color: '#92400e' },
      'Could':       { bg: '#f3f4f6', color: '#374151' },
      'Maybe Later': { bg: '#f3f4f6', color: '#374151' },
    };
    const s = map[p] || map['Could'];
    return `<span style="display:inline-block;padding:2px 9px;border-radius:4px;background:${s.bg};color:${s.color};font-size:11px;font-weight:600;white-space:nowrap">${esc(p)}</span>`;
  };

  const objRows = objs.length
    ? objs.map(o => `<tr>
        <td style="vertical-align:top;padding:10px 12px;border:1px solid #e5e7eb">${priBadge(o.priority)}</td>
        <td style="vertical-align:top;padding:10px 12px;border:1px solid #e5e7eb">${esc(o.objective)}</td>
        <td style="vertical-align:top;padding:10px 12px;border:1px solid #e5e7eb">${esc(o.hypothesis)}</td>
        <td style="vertical-align:top;padding:10px 12px;border:1px solid #e5e7eb">${esc(o.keyQuestions)}</td>
        <td style="vertical-align:top;padding:10px 12px;border:1px solid #e5e7eb">${esc(o.participants)}</td>
        <td style="vertical-align:top;padding:10px 12px;border:1px solid #e5e7eb">${esc(o.methodology)}</td>
        <td style="vertical-align:top;padding:10px 12px;border:1px solid #e5e7eb">${esc(o.goalTargets)}</td>
      </tr>`).join('')
    : `<tr><td colspan="7" style="padding:14px;text-align:center;color:#9ca3af;font-style:italic;border:1px solid #e5e7eb">No objectives added</td></tr>`;

  const partRows = parts.length
    ? parts.map(p => `<tr>
        <td style="padding:9px 12px;border:1px solid #e5e7eb">${esc(p.name)}</td>
        <td style="padding:9px 12px;border:1px solid #e5e7eb">${esc(p.contact)}</td>
        <td style="padding:9px 12px;border:1px solid #e5e7eb">${esc(p.company)}</td>
        <td style="padding:9px 12px;border:1px solid #e5e7eb;text-transform:capitalize">${esc(p.status.replace('-', ' '))}</td>
        <td style="padding:9px 12px;border:1px solid #e5e7eb">N/A</td>
        <td style="padding:9px 12px;border:1px solid #e5e7eb"></td>
        <td style="padding:9px 12px;border:1px solid #e5e7eb">${esc(p.role)}${p.company ? ' · ' + esc(p.company) : ''}</td>
      </tr>`).join('')
    : `<tr><td colspan="7" style="padding:14px;text-align:center;color:#9ca3af;font-style:italic;border:1px solid #e5e7eb">No participants added</td></tr>`;

  let analysisHTML = '';
  if (S.analysisResult?.participants?.length) {
    analysisHTML = `
      <div style="page-break-before:always"></div>
      <h2 style="font-size:18px;font-weight:600;color:#111827;margin:0 0 20px">Analysis</h2>
      ${S.analysisResult.participants.map(pu => `
        <div style="margin-bottom:28px;padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb">
          <div style="font-weight:600;font-size:14px;margin-bottom:4px">${esc(pu.name)}</div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:10px">${esc(pu.role)}</div>
          ${(pu.byObjective || []).map((ob, i) => `
            <div style="margin-bottom:10px;padding-left:12px;border-left:3px solid #d1d5db">
              <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#9ca3af;margin-bottom:3px">Objective ${i + 1}</div>
              <div style="font-size:13px;font-weight:500;color:#111827;margin-bottom:4px">${esc(ob.objective)}</div>
              <div style="font-size:13px;color:#374151;margin-bottom:4px">${esc(ob.finding)}</div>
              ${(ob.quotes || []).map(q => `<div style="font-size:12px;color:#6b7280;font-style:italic;margin-top:4px">"${esc(q)}"</div>`).join('')}
            </div>
          `).join('')}
        </div>
      `).join('')}`;
  }

  let synthesisHTML = '';
  const syn = S.synthesisResult;
  if (syn) {
    synthesisHTML = `
      <h2 style="font-size:18px;font-weight:600;color:#111827;margin:32px 0 16px">Synthesis</h2>
      ${syn.tldr ? `<p style="font-size:14px;line-height:1.7;color:#374151;padding:14px 16px;background:#f0fdf4;border-radius:6px;border-left:4px solid #22c55e;margin:0 0 20px">${esc(syn.tldr)}</p>` : ''}
      ${syn.themes?.length ? `
        <h3 style="font-size:14px;font-weight:600;color:#111827;margin:0 0 10px">Themes</h3>
        ${syn.themes.map((t, i) => `<div style="padding:10px 0;border-bottom:1px solid #f3f4f6"><span style="font-weight:500">${i + 1}. ${esc(t.name)}</span> — <span style="color:#374151">${esc(t.description)}</span>${t.participants ? `<div style="font-size:11px;color:#9ca3af;margin-top:2px">↳ ${esc(t.participants)}</div>` : ''}</div>`).join('')}
      ` : ''}
      ${syn.topPainPoints?.length ? `
        <h3 style="font-size:14px;font-weight:600;color:#111827;margin:20px 0 10px">Top pain points</h3>
        ${syn.topPainPoints.map((p, i) => `<div style="padding:6px 0;font-size:13px">${i + 1}. ${esc(p)}</div>`).join('')}
      ` : ''}
      ${syn.recommendations?.length ? `
        <h3 style="font-size:14px;font-weight:600;color:#111827;margin:20px 0 10px">Recommendations</h3>
        ${syn.recommendations.map((r, i) => `<div style="padding:6px 0;font-size:13px">${i + 1}. ${esc(r)}</div>`).join('')}
      ` : ''}
      ${syn.openQuestions?.length ? `
        <h3 style="font-size:14px;font-weight:600;color:#111827;margin:20px 0 10px">Open questions</h3>
        ${syn.openQuestions.map(q => `<div style="padding:6px 0;font-size:13px">• ${esc(q)}</div>`).join('')}
      ` : ''}`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Research plan: ${esc(name)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; font-size: 13px; color: #111827; background: #fff; padding: 48px 56px; max-width: 960px; margin: 0 auto; }
    @media print { body { padding: 24px 32px; } .no-print { display: none; } }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f9fafb; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; padding: 9px 12px; border: 1px solid #e5e7eb; text-align: left; }
    p { margin: 0; }
  </style>
</head>
<body>
  <div class="no-print" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:10px 14px;margin-bottom:28px;font-size:12px;color:#0369a1">
    To save as PDF: <strong>File → Print → Save as PDF</strong> (set margins to "Minimal" for best results)
  </div>
  <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:10px">Research Goals</div>
  <h1 style="font-size:28px;font-weight:600;color:#111827;margin-bottom:16px;line-height:1.2">Research plan: ${esc(name)}</h1>
  <table style="margin-bottom:24px;width:auto;min-width:400px">
    <tbody>
      <tr><td style="padding:8px 16px 8px 0;font-weight:500;font-size:12px;color:#6b7280;white-space:nowrap;border:none;width:120px">Date</td><td style="padding:8px 0;border:none;font-size:13px">${esc(fmtDate(S.date)) || '—'}</td></tr>
      <tr><td style="padding:8px 16px 8px 0;font-weight:500;font-size:12px;color:#6b7280;border:none">Product Area</td><td style="padding:8px 0;border:none;font-size:13px">${esc(S.area) || '—'}</td></tr>
      <tr><td style="padding:8px 16px 8px 0;font-weight:500;font-size:12px;color:#6b7280;border:none">Designer</td><td style="padding:8px 0;border:none;font-size:13px">${esc((S.designer||[]).join(', ')) || '—'}</td></tr>
      <tr><td style="padding:8px 16px 8px 0;font-weight:500;font-size:12px;color:#6b7280;border:none">Researcher</td><td style="padding:8px 0;border:none;font-size:13px">${esc((S.researcher||[]).join(', ')) || '—'}</td></tr>
    </tbody>
  </table>
  <h2 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin-bottom:8px">Purpose</h2>
  <div style="padding:14px 16px;background:#f9fafb;border-radius:6px;border:1px solid #e5e7eb;font-size:13px;color:#374151;line-height:1.7;margin-bottom:24px;font-style:italic">
    ${S.purpose ? esc(S.purpose) : '<span style="color:#9ca3af">Not specified</span>'}
  </div>
  ${S.context ? `<h2 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin-bottom:8px">Context</h2><div style="padding:14px 16px;background:#f9fafb;border-radius:6px;border:1px solid #e5e7eb;font-size:13px;color:#374151;line-height:1.7;margin-bottom:24px">${esc(S.context)}</div>` : ''}
  <h2 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin-bottom:12px">Learning objectives</h2>
  <table style="margin-bottom:40px">
    <thead><tr><th style="width:90px">Priority</th><th>Objective</th><th>Hypotheses</th><th>Key questions</th><th>Target participants</th><th>Methodology</th><th>Goal targets</th></tr></thead>
    <tbody>${objRows}</tbody>
  </table>
  ${parts.length ? `<div style="page-break-before:always"></div><h2 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin-bottom:12px">Participant recruiting tracker</h2><table style="margin-bottom:40px"><thead><tr><th>Participant Name</th><th>Participant Email</th><th>Company</th><th>Participation Status</th><th>Paid Status</th><th>Amount</th><th>Notes</th></tr></thead><tbody>${partRows}</tbody></table>` : ''}
  ${analysisHTML}
  ${synthesisHTML}
</body>
</html>`;
}

// ── Doc preview ───────────────────────────────
function renderDocPreview() {
  const objs = S.objectives, parts = S.participants;
  const name = S.projectName || '{project name}';

  const objRows = objs.length
    ? objs.map(o => `<tr>
        <td><span class="dp-pri ${(o.priority || 'must').toLowerCase()}">${o.priority || 'Must'}</span></td>
        <td>${esc(o.objective)}</td><td>${esc(o.hypothesis)}</td>
        <td>${esc(o.keyQuestions)}</td><td>${esc(o.participants)}</td>
        <td>${esc(o.methodology)}</td><td>${esc(o.goalTargets)}</td>
      </tr>`).join('')
    : `<tr><td colspan="7" style="color:#9ca3af;font-style:italic;text-align:center;padding:14px">No objectives yet</td></tr>`;

  const partRows = parts.length
    ? parts.map(p => `<div class="dp-pr"><div class="dp-pn">${esc(p.name)}</div><div style="flex:1;font-size:12px;color:#6b7280">${esc(p.role)}${p.company ? ' · ' + esc(p.company) : ''}</div><div class="dp-pst ${p.status}">${p.status}</div></div>`).join('')
    : `<div style="font-size:12px;color:#9ca3af;padding:8px 0;font-style:italic">No participants added</div>`;

  document.getElementById('dsub').textContent = `${name} · ${fmtDate(S.date) || 'No date set'}`;
  document.getElementById('docprev').innerHTML = `
    <div class="dp-h1">Research plan: ${esc(name)}</div>
    <div class="dp-tip">This research plan is yours and customizable. Everything gets added to your collection of research so it's accessible and usable.</div>
    <div class="dp-meta">
      <div class="dp-mr"><div class="dp-ml">Date</div><div class="dp-mv">${esc(fmtDate(S.date))}</div></div>
      <div class="dp-mr"><div class="dp-ml">Product area</div><div class="dp-mv">${esc(S.area)}</div></div>
      <div class="dp-mr"><div class="dp-ml">Designer</div><div class="dp-mv">${esc((S.designer||[]).join(', '))}</div></div>
      <div class="dp-mr"><div class="dp-ml">Researcher</div><div class="dp-mv">${esc((S.researcher||[]).join(', '))}</div></div>
    </div>
    <div class="dp-sh">Purpose</div>
    <div class="dp-purpose">${S.purpose ? esc(S.purpose) : '<span style="color:#9ca3af;font-style:italic">Not filled in yet</span>'}</div>
    ${S.context ? `<div class="dp-sh">Context</div><div class="dp-purpose">${esc(S.context)}</div>` : ''}
    <div class="dp-sh">Learning objectives</div>
    <table class="dp-table">
      <thead><tr><th>Priority</th><th>Objective</th><th>Hypothesis</th><th>Key questions</th><th>Target participants</th><th>Methodology</th><th>Goal targets</th></tr></thead>
      <tbody>${objRows}</tbody>
    </table>
    ${parts.length ? `<div class="dp-sh">Participants</div>${partRows}` : ''}
  `;
}

// ── Auto-save listeners ───────────────────────
document.addEventListener('DOMContentLoaded', () => {
  ['f-name','f-date','f-area','f-purpose','f-context'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', scheduleAutoSave);
  });
});

// ── Init ──────────────────────────────────────
showDirectory();
