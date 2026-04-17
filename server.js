require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ════════════════════════════════════════════════════════════
// AGENT ENDPOINT — OpenAI
// ════════════════════════════════════════════════════════════

app.post('/api/agent', async (req, res) => {
  const { messages, system, max_tokens } = req.body;
  if (!messages) return res.status(400).json({ error: 'messages required' });

  // Build OpenAI messages array (system prompt goes first as a system message)
  const openaiMessages = [];
  if (system) openaiMessages.push({ role: 'system', content: system });
  openaiMessages.push(...messages);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(process.env.OPENAI_API_KEY || '').replace(/^Bearer\s+/i, '')}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: max_tokens || 4000,
        messages: openaiMessages,
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);

    // Normalize to Anthropic-like shape so the frontend needs no changes
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
  console.log(`\n🔬 Research Cockpit running at http://localhost:${PORT}\n`);
  console.log(`   LLM: OpenAI gpt-4o`);
  console.log();
});
