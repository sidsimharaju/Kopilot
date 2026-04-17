/* ════════════════════════════════════════════════
   Research Cockpit — app.js
   All API calls go through /api/* on the local server
   so secrets never touch the browser.
════════════════════════════════════════════════ */

// ── State ─────────────────────────────────────
const S = {
  projectName: '', date: '', area: '', designer: [], researcher: [],
  purpose: '', context: '',
  objectives: [],
  participants: [],
  outreachEmail: null,
  outreachSlack: null,
  analysisResult: null,
  synthesisResult: null,
};
let pid = 1, oid = 1;

const DESIGNERS  = ['Ally','Andras','Erick','Helen','Janmesh','Jason','Jenya','Jessica','Julie','Julieta','Katrina','Missy','Mo','Salomon','Santhosh','Shikha','Sid','Travis'];
const RESEARCHERS = ['Shikha'];

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

// ── Persistence ───────────────────────────────
const STORAGE_KEY = 'rc_state_v1';

function saveState() {
  readObjectives();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ S, pid, oid }));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    Object.assign(S, saved.S);
    // Migrate old string values to arrays
    if (typeof S.designer === 'string')  S.designer  = S.designer  ? [S.designer]  : [];
    if (typeof S.researcher === 'string') S.researcher = S.researcher ? [S.researcher] : [];
    pid = saved.pid || 1;
    oid = saved.oid || 1;
    return true;
  } catch { return false; }
}

function restoreUI() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('f-name', S.projectName);
  set('f-date', S.date);
  set('f-area', S.area);
  set('f-purpose', S.purpose);
  set('f-context', S.context);
  document.getElementById('tb-title').textContent = S.projectName || 'New project';
  renderPersonPills('designer');
  renderPersonPills('researcher');

  // Restore objective rows
  document.getElementById('obj-rows').innerHTML = '';
  const savedOid = oid;
  oid = 1;
  if (S.objectives.length) S.objectives.forEach(o => addObjRow(o));
  else addObjRow({ priority: 'Must' });
  oid = savedOid;

  // Participants already in S — just render
  refreshPTable();
  updateBadges();

  // Nav done states
  if (S.projectName || S.purpose || S.objectives.some(o => o.objective))
    document.getElementById('nav-setup').classList.add('done');
  if (S.participants.length)
    document.getElementById('nav-participants').classList.add('done');
  if (S.participants.length && S.participants.every(p => p.status === 'completed' || p.status === 'declined'))
    document.getElementById('nav-outreach').classList.add('done');

  // Restore outreach button states
  updateEmailBtn();
  updateSlackBtn();

  // Restore analysis
  if (S.analysisResult?.participants?.length || S.synthesisResult) {
    renderAnalysis({ participants: S.analysisResult?.participants || [], synthesis: S.synthesisResult });
    document.getElementById('nav-analysis').classList.add('done');
  }
}

function newProject() {
  if (!confirm('Start a new project? All current data will be cleared.')) return;
  localStorage.removeItem(STORAGE_KEY);
  Object.assign(S, {
    projectName: '', date: '', area: '', designer: [], researcher: [],
    purpose: '', context: '',
    objectives: [], participants: [],
    outreachEmail: null,
    outreachSlack: null,
    analysisResult: null, synthesisResult: null,
  });
  pid = 1; oid = 1;
  ['f-name','f-date','f-area','f-purpose','f-context']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  renderPersonPills('designer');
  renderPersonPills('researcher');
  document.getElementById('tb-title').textContent = 'New project';
  document.getElementById('obj-rows').innerHTML = '';
  document.getElementById('a-content').style.display = 'none';
  document.getElementById('a-empty').style.display = 'block';
  document.querySelectorAll('.nav').forEach(el => el.classList.remove('done'));
  addObjRow({ priority: 'Must' });
  refreshPTable();
  updateBadges();
  goTo('setup');
  toast('New project started');
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

// ── Navigation ────────────────────────────────
function goTo(p) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav').forEach(el => el.classList.remove('active'));
  document.getElementById('page-' + p).classList.add('active');
  document.getElementById('nav-' + p).classList.add('active');
  if (p === 'outreach') refreshOutreach();
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

// ── Agent (Claude with tools, via server) ─────
const AGENT_SYSTEM = `You are a research operations assistant.

Always respond with valid JSON only — no markdown fences, no preamble.

Response schemas:
- Outreach (internal-slack): {"message":""}
- Outreach (external-email): {"subject":"","body":""}
- Analysis: {"participants":[{"name":"","role":"","byObjective":[{"objective":"","finding":"2-3 sentence narrative specific to this objective: what this person does/experiences, the tension or insight, and why it matters — enough to stand alone without reading the transcript","confidence":"high|medium|low","quotes":[""]}]}],"synthesis":{"tldr":"","themes":[{"name":"","description":"","participants":""}],"topPainPoints":[""],"recommendations":[""],"openQuestions":[""]}}`;

// ── Agent caller ─────────────────────────────
async function callAgent(userMsg, options = {}) {
  const res = await fetch('/api/agent', {
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

// ── AI fill ───────────────────────────────────
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

// ── Auto-save for Setup fields ────────────────
let _autoSaveTimer = null;
function scheduleAutoSave() {
  clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(() => {
    S.projectName = document.getElementById('f-name')?.value || '';
    S.date        = document.getElementById('f-date')?.value || '';
    S.area        = document.getElementById('f-area')?.value || '';
    S.purpose     = document.getElementById('f-purpose')?.value || '';
    S.context     = document.getElementById('f-context')?.value || '';
    readObjectives();
    liveTitle();
    if (S.projectName || S.purpose || S.objectives.some(o => o.objective))
      document.getElementById('nav-setup').classList.add('done');
    saveState();
  }, 500);
}

// ── CSV upload ────────────────────────────────
function triggerCSVUpload() {
  document.getElementById('csv-input').click();
}

function handleCSVUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = '';
  const reader = new FileReader();
  reader.onload = ev => processCSVText(ev.target.result);
  reader.readAsText(file);
}

function parseCSVLine(line) {
  const result = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQ = !inQ; }
    else if (line[i] === ',' && !inQ) { result.push(cur); cur = ''; }
    else { cur += line[i]; }
  }
  result.push(cur);
  return result.map(v => v.trim().replace(/^"|"$/g, ''));
}

function processCSVText(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) { toast('CSV must have a header row and at least one data row'); return; }

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());

  // Map flexible column names → our fields
  const colFor = field => {
    const aliases = {
      name:    ['name', 'full name', 'fullname', 'participant', 'participant name'],
      role:    ['role', 'title', 'job title', 'jobtitle', 'position'],
      company: ['company', 'team', 'department', 'org', 'organization'],
      contact: ['contact', 'email', 'email address', 'emailaddress', 'slack'],
      type:    ['type', 'participant type', 'participanttype'],
    };
    return aliases[field].reduce((found, a) => found !== -1 ? found : headers.indexOf(a), -1);
  };

  const idx = { name: colFor('name'), role: colFor('role'), company: colFor('company'), contact: colFor('contact'), type: colFor('type') };

  const rows = lines.slice(1).map(line => {
    const cols = parseCSVLine(line);
    return {
      name:    idx.name    !== -1 ? cols[idx.name]    || '' : '',
      role:    idx.role    !== -1 ? cols[idx.role]    || '' : '',
      company: idx.company !== -1 ? cols[idx.company] || '' : '',
      contact: idx.contact !== -1 ? cols[idx.contact] || '' : '',
      type:    idx.type    !== -1 ? (cols[idx.type] || '').toLowerCase().startsWith('int') ? 'internal' : 'external' : 'external',
    };
  }).filter(r => r.name || r.role || r.contact); // skip completely empty rows

  if (!rows.length) { toast('No participant rows found in CSV'); return; }

  // Split into complete (have name + role) and incomplete
  const complete   = rows.filter(r => r.name && r.role);
  const incomplete = rows.filter(r => !r.name || !r.role);

  complete.forEach(r => addP({ ...r }));
  if (complete.length) toast(`${complete.length} participant${complete.length > 1 ? 's' : ''} added`);

  if (incomplete.length) showCSVFillPanel(incomplete);
}

function showCSVFillPanel(rows) {
  const panel = document.getElementById('csv-panel');
  const container = document.getElementById('csv-fill-rows');
  panel.style.display = 'block';

  container.innerHTML = rows.map((r, i) => `
    <div style="padding:14px 0;border-bottom:1px solid var(--border-lt)">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--t3);margin-bottom:10px">
        Row ${i + 1}${r.name ? ' · ' + esc(r.name) : ''}
      </div>
      <div class="g2" style="margin-bottom:8px">
        <div>
          <label class="fl">Name *</label>
          <input class="inp ${!r.name ? 'inp-required' : ''}" id="cfr-name-${i}" value="${esc(r.name)}" placeholder="Full name"/>
        </div>
        <div>
          <label class="fl">Role / Title *</label>
          <input class="inp ${!r.role ? 'inp-required' : ''}" id="cfr-role-${i}" value="${esc(r.role)}" placeholder="e.g. Senior Designer"/>
        </div>
      </div>
      <div class="g2">
        <div>
          <label class="fl">Company / Team</label>
          <input class="inp" id="cfr-company-${i}" value="${esc(r.company)}" placeholder="Team or org"/>
        </div>
        <div>
          <label class="fl">Email / Slack</label>
          <input class="inp" id="cfr-contact-${i}" value="${esc(r.contact)}" placeholder="email@company.com"/>
        </div>
      </div>
      <div style="margin-top:8px">
        <label class="fl">Type</label>
        <select class="sel" id="cfr-type-${i}" style="max-width:160px">
          <option value="external" ${r.type === 'external' ? 'selected' : ''}>External</option>
          <option value="internal" ${r.type === 'internal' ? 'selected' : ''}>Internal</option>
        </select>
      </div>
    </div>`).join('');

  // store count for confirmCSVFill
  panel.dataset.count = rows.length;
  document.getElementById('csv-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function confirmCSVFill() {
  const panel = document.getElementById('csv-panel');
  const count = parseInt(panel.dataset.count || '0');
  let added = 0, errors = [];

  for (let i = 0; i < count; i++) {
    const name = document.getElementById(`cfr-name-${i}`)?.value.trim();
    const role = document.getElementById(`cfr-role-${i}`)?.value.trim();
    if (!name) { errors.push(`Row ${i + 1} is missing a name`); continue; }
    if (!role) { errors.push(`Row ${i + 1} is missing a role`); continue; }
    addP({
      name,
      role,
      company: document.getElementById(`cfr-company-${i}`)?.value || '',
      contact: document.getElementById(`cfr-contact-${i}`)?.value || '',
      type:    document.getElementById(`cfr-type-${i}`)?.value || 'external',
    });
    added++;
  }

  if (errors.length) { toast(errors[0]); return; }
  panel.style.display = 'none';
  panel.dataset.count = '0';
  if (added) toast(`${added} participant${added > 1 ? 's' : ''} added`);
}

function toggleManual() {
  const c = document.getElementById('manual-panel');
  c.style.display = c.style.display === 'none' ? 'block' : 'none';
}

function addManual() {
  const name = document.getElementById('m-name').value.trim();
  if (!name) { toast('Name required'); return; }
  addP({
    name,
    role:    document.getElementById('m-role').value,
    company: document.getElementById('m-company').value,
    contact: document.getElementById('m-contact').value,
    type:    document.getElementById('m-type').value,
  });
  ['m-name', 'm-role', 'm-company', 'm-contact'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('manual-panel').style.display = 'none';
  toast('Participant added');
}

function addP(p) {
  p.id = pid++;
  p.status = 'pending';
  p.zoomLink = '';
  p.transcript = '';
  S.participants.push(p);
  refreshPTable();
  updateBadges();
  saveState();
}

function refreshPTable() {
  const tbl = document.getElementById('p-tbl');
  const empty = document.getElementById('p-empty');
  const body = document.getElementById('p-body');
  if (!S.participants.length) { tbl.style.display = 'none'; empty.style.display = 'block'; return; }
  tbl.style.display = 'table';
  empty.style.display = 'none';
  body.innerHTML = S.participants.map(p => `<tr>
    <td><div class="cp">${esc(p.name)}</div><div class="cs">${esc(p.contact)}</div></td>
    <td><div class="cs">${esc(p.role)}${p.company ? ' · ' + esc(p.company) : ''}</div></td>
    <td><span class="chip c-${p.type}">${p.type}</span></td>
    <td><span class="chip c-pending"><span class="cdot"></span>${p.status.replace('-', ' ')}</span></td>
    <td style="text-align:right">
      <button class="btn xs" style="color:var(--red);border-color:#fca5a5" onclick="removeP(${p.id})">Remove</button>
    </td>
  </tr>`).join('');
}

function removeP(id) {
  S.participants = S.participants.filter(p => p.id !== id);
  refreshPTable(); refreshOutreach(); updateBadges();
  saveState();
}

// ── Outreach ──────────────────────────────────
const STATUS_PILL = {
  'pending':       { bg:'#f3f4f6', color:'#6b7280',  label:'Pending' },
  'outreach-sent': { bg:'#eff6ff', color:'#1d4ed8',  label:'Outreach sent' },
  'scheduled':     { bg:'#fef3c7', color:'#92400e',  label:'Scheduled' },
  'completed':     { bg:'#f0fdf4', color:'#16a34a',  label:'Completed' },
  'declined':      { bg:'#fee2e2', color:'#dc2626',  label:'Declined' },
};

function statusPill(id, current) {
  const s = STATUS_PILL[current] || STATUS_PILL['pending'];
  return `<div class="spill-wrap">
    <span class="spill" style="background:${s.bg};color:${s.color}">${s.label}</span>
    <select class="spill-sel" onchange="setStatus(${id},this.value)">
      ${Object.entries(STATUS_PILL).map(([v,d]) =>
        `<option value="${v}" ${current===v?'selected':''}>${d.label}</option>`).join('')}
    </select>
  </div>`;
}

function refreshOutreach() {
  const tbl = document.getElementById('o-tbl');
  const empty = document.getElementById('o-empty');
  const body = document.getElementById('o-body');
  if (!S.participants.length) { tbl.style.display = 'none'; empty.style.display = 'block'; updateMetrics(); return; }
  tbl.style.display = 'table';
  empty.style.display = 'none';
  body.innerHTML = S.participants.map(p => {
    const hasTranscript = !!p.transcript;
    return `<tr>
      <td><div class="cp">${esc(p.name)}</div><div class="cs">${esc(p.role)}${p.company ? ' · ' + esc(p.company) : ''}</div></td>
      <td>
        <select class="isel" onchange="setType(${p.id},this.value)">
          <option value="internal" ${p.type === 'internal' ? 'selected' : ''}>Internal</option>
          <option value="external" ${p.type === 'external' ? 'selected' : ''}>External</option>
        </select>
      </td>
      <td>${statusPill(p.id, p.status)}</td>
      <td><input class="iinp" value="${esc(p.zoomLink)}" placeholder="Paste Zoom link" onchange="setZoom(${p.id},this.value)"/></td>
      <td style="text-align:right;white-space:nowrap">
        <button class="btn xs ${hasTranscript ? 'transcript-done' : 'filled'}" onclick="triggerTranscriptUpload(${p.id})">
          ${hasTranscript ? '✓ Transcript' : '+ Transcript'}
        </button>
      </td>
    </tr>`;
  }).join('');
  updateMetrics();
}

function setStatus(id, val) {
  const p = S.participants.find(p => p.id === id);
  if (!p) return;
  p.status = val;
  refreshOutreach();
  updateBadges();
  const nav = document.getElementById('nav-outreach');
  if (S.participants.length && S.participants.every(p => p.status === 'completed' || p.status === 'declined')) {
    nav.classList.add('done');
  } else {
    nav.classList.remove('done');
  }
  saveState();
}
function setType(id, val)   { const p = S.participants.find(p => p.id === id); if (p) { p.type = val; saveState(); } }
function setZoom(id, val)   { const p = S.participants.find(p => p.id === id); if (p) { p.zoomLink = val; saveState(); } }

// ── Transcript upload ─────────────────────────
function parseVTT(content) {
  return content.split('\n').filter(line => {
    const t = line.trim();
    if (!t) return false;
    if (t.startsWith('WEBVTT')) return false;
    if (t.startsWith('NOTE')) return false;
    if (/^\d+$/.test(t)) return false;                    // cue index
    if (/\d{2}:\d{2}.*-->/.test(t)) return false;        // timestamp line
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
  const pid = parseInt(e.target.dataset.pid);
  e.target.value = '';
  if (!file || !pid) return;

  const reader = new FileReader();
  reader.onload = ev => {
    const raw = ev.target.result;
    const transcript = file.name.endsWith('.vtt') ? parseVTT(raw) : raw;
    const p = S.participants.find(p => p.id === pid);
    if (p) {
      p.transcript = transcript;
      // Auto-advance to completed if still pending
      if (p.status === 'pending' || p.status === 'outreach-sent') {
        p.status = 'completed';
        updateBadges();
      }
      saveState();
      refreshOutreach();
      toast(`Transcript uploaded for ${p.name}`);
    }
  };
  reader.readAsText(file);
}

function updateMetrics() {
  const ps = S.participants;
  document.getElementById('m-total').textContent = ps.length;
  document.getElementById('m-done').textContent  = ps.filter(p => p.status === 'completed').length;
  document.getElementById('m-sched').textContent = ps.filter(p => p.status === 'scheduled').length;
  document.getElementById('m-pend').textContent  = ps.filter(p => p.status === 'pending' || p.status === 'outreach-sent').length;
}

function updateBadges() {
  const n = S.participants.length;
  const done = S.participants.filter(p => p.status === 'completed').length;
  const nbp = document.getElementById('nb-p'); nbp.style.display = n ? '' : 'none'; nbp.textContent = n;
  const nbo = document.getElementById('nb-o'); nbo.style.display = n ? '' : 'none'; nbo.textContent = `${done}/${n}`;
  if (n) document.getElementById('nav-participants').classList.add('done');
}

function updateEmailBtn() {
  const btn = document.getElementById('email-btn');
  if (!btn) return;
  const t = btn.querySelector('.email-btn-text');
  if (t) t.textContent = S.outreachEmail ? 'View email' : 'Generate email';
}

function updateSlackBtn() {
  const btn = document.getElementById('slack-btn');
  if (!btn) return;
  const t = btn.querySelector('.slack-btn-text');
  if (t) t.textContent = S.outreachSlack ? 'View Slack message' : 'Generate Slack message';
}

function showEmailPanel(email) {
  const area = document.getElementById('o-out-area');
  const chip = document.getElementById('o-out-chip');
  const subjectRow = document.getElementById('o-email-subject');
  area.style.display = 'block';
  chip.textContent = 'External recruitment email';
  chip.style.background = '#eff6ff';
  chip.style.color = '#1d4ed8';
  subjectRow.style.display = 'block';
  document.getElementById('o-out-subject').value = email.subject || '';
  document.getElementById('o-out-text').value = email.body || '';
  document.getElementById('o-save-btn').style.display = '';
}

function saveOutreachEmail() {
  S.outreachEmail = {
    subject: document.getElementById('o-out-subject').value,
    body: document.getElementById('o-out-text').value,
  };
  saveState();
  toast('Email saved');
}

async function genOutreach(type) {
  // External email: toggle if already generated
  if (type === 'external-email') {
    if (S.outreachEmail) {
      const area = document.getElementById('o-out-area');
      if (area.style.display !== 'none' && document.getElementById('o-email-subject').style.display !== 'none') {
        area.style.display = 'none';
      } else {
        showEmailPanel(S.outreachEmail);
      }
      return;
    }
    // Generate for the first time
    const area = document.getElementById('o-out-area');
    const text = document.getElementById('o-out-text');
    const chip = document.getElementById('o-out-chip');
    area.style.display = 'block';
    document.getElementById('o-email-subject').style.display = 'none';
    document.getElementById('o-save-btn').style.display = 'none';
    chip.textContent = 'Generating email…';
    chip.style.background = '#eff6ff';
    chip.style.color = '#1d4ed8';
    text.value = '';

    const objSummary = S.objectives.filter(o => o.objective)
      .map((o, i) => `${i + 1}. [${o.priority}] ${o.objective}`).join('\n')
      || 'Understanding user workflow pain points';
    const methodology = S.objectives.filter(o => o.methodology).map(o => o.methodology).join('; ') || '30-minute virtual session';
    const targetParts = S.objectives.filter(o => o.participants).map(o => o.participants).join('; ') || 'relevant users';
    const researcher = (S.researcher || []).join(', ') || '[Researcher Name]';

    const prompt = `Fill in this participant recruitment email template using the project context below. Replace ALL bracketed placeholders with specific details. Return ONLY a JSON object with no markdown: {"subject":"...","body":"..."}

TEMPLATE TO FILL:
Hi [Customer's First Name],

We're looking for ways to make [product or feature] better for customers like you. To do that, we'd love to hear your feedback!

We're conducting a research study to understand how we can improve [specific aspects of the product/service]. Your insights would be incredibly valuable in shaping our next steps.

What's involved
• A [duration] virtual session with one of our team members.
• Sharing your honest thoughts about [specific product feature or topic].

When
• [Provide date range or scheduling flexibility, e.g., "At a time that's convenient for you in the next two weeks."]

What's in it for you
• [A $amount gift card/reward, or simply "the opportunity to shape the future of [Product/Service Name]."]

Interested?
Click [here to schedule your session] or reply to this email with your availability, and we'll handle the rest.

We look forward to hearing from you!

Best regards,
${researcher}
Researcher
[Contact Information]
Kong

PROJECT CONTEXT:
Project: "${S.projectName || 'User research study'}"
Product area: ${S.area || ''}
Purpose: ${S.purpose || 'Understanding user needs'}
${S.context ? 'Context: ' + S.context : ''}
Target participants: ${targetParts}
Methodology: ${methodology}
Learning objectives:
${objSummary}

For the subject line use the pattern: "Help us improve [specific product/feature from context]!"`;

    try {
      const data = await callAgent(prompt);
      S.outreachEmail = { subject: data.subject || '', body: data.body || '' };
      saveState();
      updateEmailBtn();
      showEmailPanel(S.outreachEmail);
    } catch (e) {
      text.value = 'Generation failed — fill in project details in Setup first.';
    }
    return;
  }

  // Internal Slack — toggle if already generated
  if (S.outreachSlack) {
    const area = document.getElementById('o-out-area');
    const isSlackVisible = area.style.display !== 'none' && document.getElementById('o-email-subject').style.display === 'none';
    if (isSlackVisible) { area.style.display = 'none'; return; }
    showSlackPanel(S.outreachSlack);
    return;
  }

  // Generate for the first time
  const area = document.getElementById('o-out-area');
  const text = document.getElementById('o-out-text');
  const chip = document.getElementById('o-out-chip');
  area.style.display = 'block';
  document.getElementById('o-email-subject').style.display = 'none';
  document.getElementById('o-save-btn').style.display = 'none';
  chip.textContent = 'Generating Slack message…';
  chip.style.background = '#fdf4ff';
  chip.style.color = '#7c3aed';
  text.value = '';

  const objSummary = S.objectives.filter(o => o.objective)
    .map(o => `• ${o.objective}`).join('\n') || '• Understanding user workflow pain points';
  const researcher = (S.researcher || []).join(', ') || '[your name]';
  const methodology = S.objectives.filter(o => o.methodology).map(o => o.methodology).join('; ');
  const duration = methodology.toLowerCase().includes('45') ? '45' : '30';

  const prompt = `Generate an internal Slack message to recruit a colleague for a user research study.

Follow this exact template style — keep it brief, casual, and direct (2–4 sentences max):

"Hey [First Name], I'm ${researcher} from the design team. I'm working on a study on how [research topic from context]. [One optional sentence: a specific observation about why this person would be helpful, if context supports it.] I thought you could be a really helpful person to talk to before we take this further. Would you be open to a ${duration}-minute chat?"

Rules:
- Use [First Name] as the placeholder for the recipient's name
- Base "research topic" on the purpose/context/objectives below — be specific, not generic
- The optional observation should feel personal and insightful if context supports it, otherwise omit it
- No subject line, no sign-off, no emojis
- Return ONLY: {"message":"..."}

PROJECT CONTEXT:
Project: "${S.projectName || 'User research study'}"
Purpose: ${S.purpose || ''}
${S.context ? 'Context: ' + S.context : ''}
Product area: ${S.area || ''}
Learning objectives:
${objSummary}`;

  try {
    const data = await callAgent(prompt);
    S.outreachSlack = data.message || '';
    saveState();
    updateSlackBtn();
    showSlackPanel(S.outreachSlack);
  } catch (e) {
    text.value = 'Generation failed — fill in project details in Setup first.';
  }
}

function showSlackPanel(message) {
  const area = document.getElementById('o-out-area');
  const chip = document.getElementById('o-out-chip');
  area.style.display = 'block';
  document.getElementById('o-email-subject').style.display = 'none';
  document.getElementById('o-save-btn').style.display = 'none';
  chip.textContent = 'Internal Slack message';
  chip.style.background = '#fdf4ff';
  chip.style.color = '#7c3aed';
  document.getElementById('o-out-text').value = message;
}

function copyOut() {
  const subject = document.getElementById('o-out-subject');
  const body = document.getElementById('o-out-text').value;
  const full = subject.style.display !== 'none' && subject.value
    ? `Subject: ${subject.value}\n\n${body}`
    : body;
  navigator.clipboard.writeText(full);
  toast('Copied to clipboard');
}

// ── Analysis ──────────────────────────────────
async function runAnalysis() {
  const initBtn = document.getElementById('a-btn');
  const reBtn   = document.getElementById('a-reanalyze-btn');
  if (initBtn) { initBtn.textContent = 'Analysing…'; initBtn.disabled = true; }
  if (reBtn)   { reBtn.textContent   = 'Analysing…'; reBtn.disabled   = true; }
  readObjectives();

  const completed = S.participants.filter(p => p.status === 'completed');
  const participantData = completed.length
    ? completed.map(p => `PARTICIPANT: ${p.name} (${p.role}${p.company ? ' at ' + p.company : ''})\nTRANSCRIPT:\n${p.transcript || 'No transcript — include any verbal notes you have.'}`).join('\n\n---\n\n')
    : 'No completed interviews. Simulate findings for a study on researcher workflow fragmentation (Notion, Calendly, Dovetail, etc.) with 3 participants.';

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
    const data = await callAgent(prompt, { max_tokens: 4000 });
    S.analysisResult = { participants: data.participants || [] };
    S.synthesisResult = data.synthesis || null;
    renderAnalysis(data);
    saveState();
    document.getElementById('nav-analysis').classList.add('done');
    toast('Analysis complete');
  } catch (e) {
    if (initBtn) { initBtn.textContent = 'Create analysis'; initBtn.disabled = false; }
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

  // ── Header row with Re-analyze button ─────────────────────────────────────
  out.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between">
    <div style="font-size:12px;color:var(--t3)">${participants.length} participant${participants.length !== 1 ? 's' : ''} analysed</div>
    <button class="btn" id="a-reanalyze-btn" onclick="runAnalysis()">Re-analyze</button>
  </div>`;

  // ── 1. Synthesis at top ────────────────────────────────────────────────────
  if (syn) {
    let h = `<div class="panel">
      <div class="ptitle">Synthesis</div>`;
    if (syn.tldr) {
      h += `<div style="font-size:14px;line-height:1.7;padding:12px 14px;background:var(--page);border-radius:var(--rsm);margin-bottom:14px">${esc(syn.tldr)}</div>`;
    }
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

  // ── 2. Objective-first breakdown ───────────────────────────────────────────
  if (participants.length) {
    // Collect all unique objectives in order
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

// ── Finalize ──────────────────────────────────
function generateDocument() {
  readObjectives();
  const html = buildDocHTML();
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) toast('Pop-up blocked — allow pop-ups and try again');
  else {
    document.getElementById('nav-finalize').classList.add('done');
    toast('Document opened — use Print → Save as PDF');
  }
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

  // Analysis section
  let analysisHTML = '';
  if (S.analysisResult?.participants?.length) {
    analysisHTML = `
      <div style="page-break-before:always"></div>
      <h2 style="font-size:18px;font-weight:600;color:#111827;margin:0 0 20px">Analysis</h2>
      ${S.analysisResult.participants.map(pu => `
        <div style="margin-bottom:28px;padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb">
          <div style="font-weight:600;font-size:14px;margin-bottom:4px">${esc(pu.name)}</div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:10px">${esc(pu.role)}</div>
          ${pu.summary ? `<p style="font-size:13px;color:#374151;line-height:1.6;margin:0 0 12px">${esc(pu.summary)}</p>` : ''}
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

  // Synthesis section
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
    @media print {
      body { padding: 24px 32px; }
      .no-print { display: none; }
    }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f9fafb; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; padding: 9px 12px; border: 1px solid #e5e7eb; text-align: left; }
    p { margin: 0; }
  </style>
</head>
<body>

  <!-- Print hint -->
  <div class="no-print" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:10px 14px;margin-bottom:28px;font-size:12px;color:#0369a1">
    💡 To save as PDF: <strong>File → Print → Save as PDF</strong> (set margins to "Minimal" for best results)
  </div>

  <!-- Section label -->
  <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:10px">🎯 Research Goals</div>

  <!-- Title -->
  <h1 style="font-size:28px;font-weight:600;color:#111827;margin-bottom:16px;line-height:1.2">Research plan: ${esc(name)}</h1>

  <!-- Tip box -->
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px 16px;margin-bottom:24px;font-size:13px;color:#166534;line-height:1.6">
    💡 This research plan is yours and customizable, but everything in green gets added to our collection of research so it's accessible and usable.
  </div>

  <!-- Metadata -->
  <table style="margin-bottom:24px;width:auto;min-width:400px">
    <tbody>
      <tr>
        <td style="padding:8px 16px 8px 0;font-weight:500;font-size:12px;color:#6b7280;white-space:nowrap;border:none;width:120px">Date</td>
        <td style="padding:8px 0;border:none;font-size:13px">${esc(fmtDate(S.date)) || '—'}</td>
      </tr>
      <tr>
        <td style="padding:8px 16px 8px 0;font-weight:500;font-size:12px;color:#6b7280;border:none">Product Area</td>
        <td style="padding:8px 0;border:none;font-size:13px">${esc(S.area) || '—'}</td>
      </tr>
      <tr>
        <td style="padding:8px 16px 8px 0;font-weight:500;font-size:12px;color:#6b7280;border:none">Designer</td>
        <td style="padding:8px 0;border:none;font-size:13px">${esc((S.designer||[]).join(', ')) || '—'}</td>
      </tr>
      <tr>
        <td style="padding:8px 16px 8px 0;font-weight:500;font-size:12px;color:#6b7280;border:none">Researcher</td>
        <td style="padding:8px 0;border:none;font-size:13px">${esc((S.researcher||[]).join(', ')) || '—'}</td>
      </tr>
    </tbody>
  </table>

  <!-- Purpose -->
  <h2 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin-bottom:8px">Purpose</h2>
  <div style="padding:14px 16px;background:#f9fafb;border-radius:6px;border:1px solid #e5e7eb;font-size:13px;color:#374151;line-height:1.7;margin-bottom:24px;font-style:italic">
    ${S.purpose ? esc(S.purpose) : '<span style="color:#9ca3af">Not specified</span>'}
  </div>

  ${S.context ? `
  <h2 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin-bottom:8px">Context</h2>
  <div style="padding:14px 16px;background:#f9fafb;border-radius:6px;border:1px solid #e5e7eb;font-size:13px;color:#374151;line-height:1.7;margin-bottom:24px">
    ${esc(S.context)}
  </div>
  ` : ''}

  <!-- Learning objectives -->
  <h2 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin-bottom:12px">Learning objectives</h2>
  <table style="margin-bottom:40px">
    <thead>
      <tr>
        <th style="width:90px">Priority</th>
        <th>Objective</th>
        <th>Hypotheses</th>
        <th>Key questions</th>
        <th>Target participants</th>
        <th>Methodology</th>
        <th>Goal targets (if applicable)</th>
      </tr>
    </thead>
    <tbody>${objRows}</tbody>
  </table>

  <!-- Participants -->
  ${parts.length ? `
  <div style="page-break-before:always"></div>
  <h2 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin-bottom:12px">Participant recruiting tracker</h2>
  <table style="margin-bottom:40px">
    <thead>
      <tr>
        <th>Participant Name</th>
        <th>Participant Email</th>
        <th>Company</th>
        <th>Participation Status</th>
        <th>Paid Status</th>
        <th>Amount</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>${partRows}</tbody>
  </table>
  ` : ''}

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
    <div class="dp-tip">💡 This research plan is yours and customizable. Everything gets added to your collection of research so it's accessible and usable.</div>
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

// ── Init ──────────────────────────────────────
if (loadState()) {
  restoreUI();
} else {
  addObjRow({ priority: 'Must' });
}
goTo('setup');

// Auto-save listeners for Setup fields
['f-name','f-date','f-area','f-purpose','f-context'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', scheduleAutoSave);
  document.getElementById(id)?.addEventListener('change', scheduleAutoSave);
});
// Objectives — event delegation (handles dynamic rows)
document.getElementById('obj-rows').addEventListener('input', scheduleAutoSave);
document.getElementById('obj-rows').addEventListener('change', scheduleAutoSave);
