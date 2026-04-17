/* ════════════════════════════════════════════════
   Research Cockpit — app.js
   All API calls go through /api/* on the local server
   so secrets never touch the browser.
════════════════════════════════════════════════ */

// ── State ─────────────────────────────────────
const S = {
  projectName: '', date: '', area: '', designer: '', researcher: '',
  purpose: '', context: '',
  objectives: [],
  participants: [],
  analysisResult: null,
  synthesisResult: null,
};
let pid = 1, oid = 1;

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
- Analysis: {"participants":[{"name":"","role":"","summary":"","byObjective":[{"objective":"","finding":"","confidence":"high|medium|low","quotes":[""]}]}],"synthesis":{"tldr":"","themes":[{"name":"","description":"","participants":""}],"topPainPoints":[""],"recommendations":[""],"openQuestions":[""]}}`;

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

function delObj(id) { document.getElementById('obj-' + id)?.remove(); }

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

async function saveSetup() {
  const btn = document.getElementById('save-btn');
  const status = document.getElementById('save-status');
  btn.textContent = 'Saving…';
  btn.disabled = true;

  S.projectName = document.getElementById('f-name').value;
  S.date        = document.getElementById('f-date').value;
  S.area        = document.getElementById('f-area').value;
  S.designer    = document.getElementById('f-designer').value;
  S.researcher  = document.getElementById('f-researcher').value;
  S.purpose     = document.getElementById('f-purpose').value;
  S.context     = document.getElementById('f-context').value;
  readObjectives();
  liveTitle();

  status.textContent = '✓ Saved';
  status.style.color = 'var(--green)';

  document.getElementById('nav-setup').classList.add('done');
  btn.textContent = 'Save & continue';
  btn.disabled = false;
  toast('Project saved');
  goTo('participants');
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
}

// ── Outreach ──────────────────────────────────
function refreshOutreach() {
  const tbl = document.getElementById('o-tbl');
  const empty = document.getElementById('o-empty');
  const body = document.getElementById('o-body');
  if (!S.participants.length) { tbl.style.display = 'none'; empty.style.display = 'block'; updateMetrics(); return; }
  tbl.style.display = 'table';
  empty.style.display = 'none';
  body.innerHTML = S.participants.map(p => {
    const done = p.status === 'completed';
    return `<tr>
      <td><div class="cp">${esc(p.name)}</div><div class="cs">${esc(p.role)}${p.company ? ' · ' + esc(p.company) : ''}</div></td>
      <td>
        <select class="isel" onchange="setType(${p.id},this.value)">
          <option value="internal" ${p.type === 'internal' ? 'selected' : ''}>Internal</option>
          <option value="external" ${p.type === 'external' ? 'selected' : ''}>External</option>
        </select>
      </td>
      <td>
        ${done
          ? `<input class="iinp" value="${esc(p.zoomLink)}" placeholder="Paste Zoom link" onchange="setZoom(${p.id},this.value)"/>`
          : `<span class="hint" style="font-size:11px">After completion</span>`}
      </td>
      <td>
        <select class="isel" onchange="setStatus(${p.id},this.value)">
          <option value="pending"       ${p.status === 'pending'       ? 'selected' : ''}>Pending</option>
          <option value="outreach-sent" ${p.status === 'outreach-sent' ? 'selected' : ''}>Outreach sent</option>
          <option value="scheduled"     ${p.status === 'scheduled'     ? 'selected' : ''}>Scheduled</option>
          <option value="completed"     ${p.status === 'completed'     ? 'selected' : ''}>Completed</option>
          <option value="declined"      ${p.status === 'declined'      ? 'selected' : ''}>Declined</option>
        </select>
      </td>
      <td style="text-align:right">
        ${done ? `<button class="btn xs filled" onclick="addTranscript(${p.id})">+ Transcript</button>` : ''}
      </td>
    </tr>`;
  }).join('');
  updateMetrics();
}

function setStatus(id, val) { const p = S.participants.find(p => p.id === id); if (p) { p.status = val; refreshOutreach(); updateBadges(); } }
function setType(id, val)   { const p = S.participants.find(p => p.id === id); if (p) p.type = val; }
function setZoom(id, val)   { const p = S.participants.find(p => p.id === id); if (p) p.zoomLink = val; }

function addTranscript(id) {
  const p = S.participants.find(p => p.id === id);
  if (!p) return;
  const t = prompt(`Paste Zoom transcript for ${p.name}:`);
  if (t) { p.transcript = t; toast('Transcript saved for ' + p.name); }
}

function updateMetrics() {
  const ps = S.participants;
  document.getElementById('m-total').textContent = ps.length;
  document.getElementById('m-done').textContent  = ps.filter(p => p.status === 'completed').length;
  document.getElementById('m-sched').textContent = ps.filter(p => p.status === 'scheduled').length;
  document.getElementById('m-pend').textContent  = ps.filter(p => p.status === 'pending' || p.status === 'outreach-sent').length;
  const done = ps.filter(p => p.status === 'completed').length;
  document.getElementById('tb-pill').textContent = `${done} / ${ps.length} interviews`;
}

function updateBadges() {
  const n = S.participants.length;
  const done = S.participants.filter(p => p.status === 'completed').length;
  const nbp = document.getElementById('nb-p'); nbp.style.display = n ? '' : 'none'; nbp.textContent = n;
  const nbo = document.getElementById('nb-o'); nbo.style.display = n ? '' : 'none'; nbo.textContent = `${done}/${n}`;
  if (n) document.getElementById('nav-participants').classList.add('done');
}

async function genOutreach(type) {
  const area = document.getElementById('o-out-area');
  const text = document.getElementById('o-out-text');
  const chip = document.getElementById('o-out-chip');
  area.style.display = 'block';
  text.textContent = 'Generating…';
  chip.textContent = type === 'internal-slack' ? 'Internal Slack message' : 'External recruitment email';
  chip.style.background = type === 'internal-slack' ? '#fdf4ff' : '#eff6ff';
  chip.style.color = type === 'internal-slack' ? '#7c3aed' : '#1d4ed8';

  const objSummary = S.objectives.filter(o => o.objective)
    .map((o, i) => `${i + 1}. [${o.priority}] ${o.objective}`).join('\n')
    || 'Understanding user workflow pain points';
  const projCtx = `Project: "${S.projectName || 'User research study'}". Purpose: ${S.purpose || 'Understanding user needs'}. ${S.context ? 'Context: ' + S.context : ''}`;

  const prompt = type === 'internal-slack'
    ? `Generate an internal Slack message for a user research study.\n${projCtx}\nLearning objectives:\n${objSummary}\n\nCasual, brief (3-5 sentences), invite for 30-45 min session, mention what we're learning. Return as {"message":"..."}`
    : `Generate an external recruitment email for a user research study.\n${projCtx}\nLearning objectives:\n${objSummary}\n\nProfessional but warm. Why their perspective matters, what's involved (30-45 min), clear CTA. Return as {"subject":"...","body":"..."}`;

  try {
    const data = await callAgent(prompt);
    text.textContent = type === 'internal-slack'
      ? (data.message || 'Could not generate message')
      : `Subject: ${data.subject || ''}\n\n${data.body || ''}`;
  } catch (e) {
    text.textContent = 'Generation failed — fill in project name and objectives in Setup first.';
  }
}

function copyOut() {
  navigator.clipboard.writeText(document.getElementById('o-out-text').textContent);
  toast('Copied to clipboard');
}

// ── Analysis ──────────────────────────────────
async function runAnalysis() {
  const btn = document.getElementById('a-btn');
  btn.textContent = 'Analysing…';
  btn.disabled = true;
  readObjectives();

  const completed = S.participants.filter(p => p.status === 'completed');
  const participantData = completed.length
    ? completed.map(p => `PARTICIPANT: ${p.name} (${p.role}${p.company ? ' at ' + p.company : ''})\nTRANSCRIPT:\n${p.transcript || 'No transcript pasted — mark as completed and add via Outreach tab.'}`).join('\n\n---\n\n')
    : 'No completed interviews. Simulate findings for a study on researcher workflow fragmentation (Notion, Calendly, Dovetail, etc.) with 3 participants.';

  const objList = S.objectives.filter(o => o.objective)
    .map((o, i) => `${i + 1}. [${o.priority}] ${o.objective}`)
    .join('\n') || '1. [Must] Understand pain points in researcher workflow across tools';

  const prompt = `Analyze these research interviews. Segment FIRST by participant, then within each participant map to each objective. Generate cross-interview synthesis too.

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
    document.getElementById('nav-analysis').classList.add('done');
    toast('Analysis complete');
  } catch (e) {
    btn.textContent = 'Create analysis';
    btn.disabled = false;
    toast('Analysis failed: ' + e.message);
    console.error(e);
  }
}

function renderAnalysis(data) {
  document.getElementById('a-empty').style.display = 'none';
  const out = document.getElementById('a-content');
  out.style.display = 'flex';
  out.innerHTML = '';

  // Per participant
  if (data.participants?.length) {
    out.innerHTML += `<div class="panel">
      <div class="ptitle">Per participant — mapped to objectives</div>
      ${data.participants.map(pu => `
        <div class="ah">
          <div class="pav" style="width:30px;height:30px;font-size:11px;flex-shrink:0">${initials(pu.name)}</div>
          ${esc(pu.name)}<span class="ah-sub">${esc(pu.role)}</span>
        </div>
        ${pu.summary ? `<div style="font-size:13px;color:var(--t2);line-height:1.6;margin-bottom:10px;padding:8px 12px;background:var(--page);border-radius:var(--rsm)">${esc(pu.summary)}</div>` : ''}
        ${(pu.byObjective || []).map((ob, i) => `
          <div class="obj-sh">Objective ${i + 1}: ${esc(ob.objective)}</div>
          <div class="fi-t" style="margin-bottom:4px">${esc(ob.finding)}</div>
          <span class="conf c${(ob.confidence || 'm')[0]}" style="margin-bottom:8px;display:inline-block">${ob.confidence || 'medium'}</span>
          ${(ob.quotes || []).map(q => `<div class="qb">"${esc(q)}"</div>`).join('')}
        `).join('')}
      `).join('<hr style="margin:16px 0">')}
    </div>`;
  }

  // Synthesis
  const syn = data.synthesis || S.synthesisResult;
  if (syn) {
    let h = `<div class="panel"><div class="ptitle">Synthesis — cross-interview patterns</div>`;
    if (syn.tldr) h += `<div style="font-size:14px;line-height:1.7;padding:12px 14px;background:var(--page);border-radius:var(--rsm);margin-bottom:14px">${esc(syn.tldr)}</div>`;
    if (syn.themes?.length) {
      h += `<div class="ptitle" style="margin-top:4px">Themes</div>`;
      h += syn.themes.map(t => `<div style="padding:10px 0;border-bottom:1px solid var(--border-lt)"><div style="font-weight:500;font-size:13px;margin-bottom:3px">${esc(t.name)}</div><div class="fi-t">${esc(t.description)}</div>${t.participants ? `<div style="font-size:11px;color:var(--t3);margin-top:3px">↳ ${esc(t.participants)}</div>` : ''}</div>`).join('');
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
  S.synthesisResult = syn;
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
        <td style="padding:8px 0;border:none;font-size:13px">${esc(S.designer) || '—'}</td>
      </tr>
      <tr>
        <td style="padding:8px 16px 8px 0;font-weight:500;font-size:12px;color:#6b7280;border:none">Researcher</td>
        <td style="padding:8px 0;border:none;font-size:13px">${esc(S.researcher) || '—'}</td>
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
      <div class="dp-mr"><div class="dp-ml">Designer</div><div class="dp-mv">${esc(S.designer)}</div></div>
      <div class="dp-mr"><div class="dp-ml">Researcher</div><div class="dp-mv">${esc(S.researcher)}</div></div>
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
addObjRow({ priority: 'Must' });
goTo('setup');
