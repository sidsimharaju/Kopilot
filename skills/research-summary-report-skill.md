---
name: research-summary-report
description: Generates a concise, actionable research summary report from transcripts, session notes, and a research plan. Use this whenever a researcher is in the analysis phase and needs a quick, prioritized output — a tight summary that connects findings to the study's purpose, learning objectives, and hypotheses, with Must/Should/Nice/Later recommendations. Trigger when the user says "analyse findings", "summary report", "actionable report", "write up findings", "generate the summary", or is ready to synthesize from transcripts and notes into a report. Works for both task-based usability tests (adapts to include ease ratings and per-task issues) and discovery/generative research (adapts to theme-based patterns). Always use this skill before reaching for the full report — the summary comes first.
---

## What this skill produces

A tight, decision-ready summary that tells stakeholders what was learned and what to do about it — without burying the lead in methodology or long narratives. The format mirrors an established internal template, and every recommendation is anchored to the learning objectives from the original research plan.

## What you need before starting

Confirm you have access to:
- **Transcripts and/or session notes** for all participants
- **Research plan data**: purpose, learning objectives (with priority), hypotheses, key questions, methodology
- **Participant metadata**: name, title, company, session date, recording link, notes link (extract from transcripts/notes if not provided separately)
- **Study type**: usability test or discovery/generative — infer from methodology in the research plan if not stated explicitly

If any of these are missing, ask before proceeding. A summary without the research plan context will miss the point — the whole value is connecting findings back to what the study was trying to learn.

## Detecting the study type

Look at the methodology field in the research plan:
- **Usability test**: tasks were given, participants were observed completing flows, ease/confidence ratings were captured → include the Task Performance Summary section
- **Discovery / generative**: open-ended interviews, exploratory goals, no defined tasks → omit the Task Performance Summary section, frame learnings as patterns and themes

## Output format

Generate a well-structured document using this exact structure. Include all sections; omit the Task Performance Summary only for discovery studies.

---

# Research Summary: {Study/Project Name}

**Date:** {date}
**Product Area:** {product area}
**Researcher:** {name}
**Methodology:** {method + format, e.g. "Moderated usability test"}
**Participants:** {n} participants

---

## Summary

{1 paragraph. Synthesize the big picture — what did you learn at the highest level, and does it align with or challenge the stated purpose? Don't list findings here. Write for a reader who will skim this first and decide whether to read further.}

---

## Key Learnings and Recommendations

Prioritize based on the learning objective priorities from the research plan (Must objectives drive Must rows) and severity of what was found.

| Priority | Learning | Recommendation |
|----------|----------|----------------|
| Must | {Finding that directly answers a Must learning objective, or reveals a critical blocker to adoption or task success} | {Specific, actionable next step — what should the team do?} |
| Must | | |
| Should | | |
| Nice | | |
| Later | | |

**Priority logic:**
- **Must**: directly addresses a Must objective, or reveals something that would block users from succeeding
- **Should**: addresses a Should objective, or an important pattern that wasn't the primary focus
- **Nice**: interesting signal, not urgent
- **Later**: worth revisiting in a future study

---

## Hypothesis Check

For each hypothesis from the research plan, state whether the study supported, refuted, or left it inconclusive. This closes the loop on what the team assumed going in.

| Hypothesis | Outcome | Evidence |
|------------|---------|----------|
| {hypothesis as stated in the plan} | Supported / Refuted / Inconclusive | {1 sentence pointing to the evidence} |

---

## Task Performance Summary *(usability tests only — omit for discovery studies)*

| Task | Avg Ease Rating (1–5) | Completion Rate | Key Issue |
|------|----------------------|-----------------|-----------|
| {Task name} | {avg, e.g. 3.2} | {n/N completed} | {Top friction point or confusion in one phrase} |

If other benchmark metrics were captured (confidence, likelihood to use, satisfaction, etc.), add them as additional columns. The table should be adaptive — only include metrics that were actually collected.

---

## Open Questions

Questions that remain unresolved, or new questions that came up during the study. Useful for scoping what to study next.

- {question}
- {question}

---

## Participant Details

| Participant | Title | Company | Session Date | Recording | Notes |
|------------|-------|---------|--------------|-----------|-------|
| {Name} | {title} | {company} | {date} | {link or "—"} | {link or "—"} |

### Per-Participant Summaries

For each learning objective or key question from the research plan, summarize what each participant surfaced. This is the cross-tab view — useful for spotting outliers and patterns across participants.

**{Objective or Key Question 1}**

| Participant | Summary |
|------------|---------|
| {Name} | {1–2 sentence summary of what this participant revealed on this question} |
| {Name} | |

*Repeat for each objective/key question from the research plan.*

---

## Writing guidance

- Write the Summary and Key Learnings first — these are what most people will read
- Use plain language; avoid hedging ("it seems like", "potentially") unless the evidence is genuinely weak
- Quotes from transcripts are welcome in the Key Learnings if they're sharp and representative, but keep them short
- The Hypothesis Check and Participant Details sections support the learnings — they don't need to be long
- If a finding doesn't connect to any learning objective, either cut it or put it in Open Questions
