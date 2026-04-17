# Research Cockpit

A research project management tool with Google Docs integration, Atlassian people search, and Claude AI analysis.

## Project structure

```
research-cockpit/
├── server.js          # Express server — all API routes and secrets
├── package.json
├── .env.example       # Copy to .env and fill in your keys
├── .gitignore
├── public/
│   ├── index.html     # App shell
│   ├── styles.css     # All styles
│   └── app.js         # All frontend logic
└── README.md
```

---

## Quick start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Then open `.env` and fill in your keys (see below).

### 3. Run the server
```bash
npm start
# or for auto-reload during development:
npm run dev
```

Open **http://localhost:3000**

---

## API keys you need

### Anthropic (required — powers analysis and outreach generation)
1. Go to https://console.anthropic.com
2. Create an API key
3. Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-...`

### Google OAuth2 (required — for Google Docs sync)
1. Go to https://console.cloud.google.com
2. Create a new project (or use existing)
3. Enable these APIs:
   - **Google Docs API**
   - **Google Drive API**
4. Go to **Credentials** → **Create credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
7. Copy Client ID and Client Secret to `.env`

**First time connecting:**  
Visit http://localhost:3000/auth/google — it will redirect you through Google's consent screen and store your token in memory.

> ⚠️ Tokens are currently stored in memory (lost on server restart). For production, store them in a database or use a session store.

### Atlassian (optional — for live people directory search)
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create an API token
3. Add to `.env`:
   ```
   ATLASSIAN_DOMAIN=yoursite.atlassian.net
   ATLASSIAN_EMAIL=your@email.com
   ATLASSIAN_API_TOKEN=your_token
   ```
4. Required API scope: `read:account`
5. Endpoint used: `GET /gateway/api/people/search?q={query}&limit=10`

Without Atlassian config, the app falls back to Claude-simulated search results.

---

## Google Doc

The app is pre-configured to write to this doc:  
https://docs.google.com/document/d/1j7VQnJ3pJ2yoodJVOwRCpVlHrgMFVf9hye1CSXFV57M/edit

To use a different doc, change `DOC_ID` in `public/app.js` and `server.js`.

---

## How each section works

| Stage | What it does |
|-------|-------------|
| **Setup** | Fill project details + learning objectives (matching the research plan template). Saves to Google Doc on submit. |
| **Participants** | Search Atlassian directory (or Claude fallback). Add people to the project. |
| **Outreach & Interviews** | Track participant status. Generate sample Slack (internal) or email (external) outreach messages via Claude, based on your objectives. Mark participants as completed and paste Zoom transcripts. |
| **Analysis** | One button — Claude reads all transcripts and maps findings per participant → per objective. Synthesis is auto-generated below. |
| **Finalize** | Push everything to the Google Doc using the research plan template structure. |

---

## Zoom transcripts

Currently entered manually via the "+ Transcript" button per participant.  
To auto-fetch from Zoom, you would need to integrate the [Zoom API](https://marketplace.zoom.us/docs/api-reference/zoom-api/methods/#operation/recordingGet) — the data structure is already in place (`p.transcript`).

---

## Production notes

- Move Google tokens from in-memory to a persistent store (e.g. Redis, SQLite)
- Add a session middleware (e.g. `express-session`)
- Rate-limit the `/api/claude` endpoint
- Add input validation/sanitization
- Deploy behind HTTPS (required for Google OAuth in production)
