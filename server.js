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
// AGENT ENDPOINT — Claude + optional Google Drive MCP
// ════════════════════════════════════════════════════════════

app.post('/api/agent', async (req, res) => {
  const { messages, system, max_tokens } = req.body;
  if (!messages) return res.status(400).json({ error: 'messages required' });

  // Configure Google Drive MCP server if credentials are set in .env
  const mcpServers = process.env.GOOGLE_DRIVE_MCP_URL ? [{
    type: 'url',
    url: process.env.GOOGLE_DRIVE_MCP_URL,
    name: 'google_drive',
    authorization_token: process.env.GOOGLE_DRIVE_MCP_TOKEN,
  }] : [];

  try {
    const requestBody = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: max_tokens || 4000,
      system,
      messages,
    };
    if (mcpServers.length) requestBody.mcp_servers = mcpServers;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        ...(mcpServers.length ? { 'anthropic-beta': 'mcp-client-1' } : {}),
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
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
  console.log(`   Google Drive: ${process.env.GOOGLE_DRIVE_MCP_URL ? 'MCP server connected ✓' : 'not configured (set GOOGLE_DRIVE_MCP_URL in .env)'}`);
  console.log();
});
