---
name: research-full-report
description: Generates a comprehensive, narrative research report from transcripts, session notes, and a research plan. Use this when a researcher needs a full, standalone report — with background context, methodology, participant profiles, themed insights with quotes and evidence, hypothesis outcomes, and prioritized recommendations. Trigger when the user says "full report", "detailed report", "in-depth report", "write the full findings", "complete report", or wants a report thorough enough for stakeholders who weren't in the study. Adapts automatically: usability tests get per-task breakdowns with ease ratings; discovery/generative studies get theme-based insights with rich narrative. This is the deep-read version — use research-summary-report first if the user just needs the quick, actionable version.
---

## What this skill produces

A complete, standalone research report that tells the full story of a study — from why it was done to what was found to what to do next. A reader who wasn't in the study should be able to pick this up and understand everything. Every insight is grounded in evidence from transcripts and session notes, with participant quotes where they add clarity.

## What you need before starting

Confirm you have access to:
- **Transcripts and/or session notes** for all participants
- **Research plan data**: purpose, learning objectives (with priority), hypotheses, key questions, target participants, methodology
- **Participant metadata**: name, title, company, session date, recording link, notes link (extract from transcripts/notes if not provided separately)
- **Study type**: usability test or discovery/generative — infer from methodology in the research plan if not stated explicitly

If any of these are missing, ask before starting. The background and methodology sections especially depend on having the full research plan.

## Detecting the study type

Look at the methodology field in the research plan:
- **Usability test**: tasks were given, participants completed defined flows, ease/confidence/other ratings were captured → include the Task Findings section; omit the Insight Themes section
- **Discovery / generative**: open-ended interviews, exploratory learning goals, no defined tasks → include the Insight Themes section; omit the Task Findings section

## Output format

Generate a well-structured document using this exact structure. Omit one of the two main findings sections (Task Findings or Insight Themes) based on study type.

---

# Research Report: {Study/Project Name}

**Date:** {date}
**Product Area:** {product area}
**Researcher:** {name}
**Designer:** {name, or omit if not applicable}
**Stakeholders:** {names, or omit if not applicable}
**Methodology:** {method + format}
**Participants:** {n} participants

---

## Background

{2–3 paragraphs. Why was this study conducted? What product or feature context matters? What decisions is this research meant to inform? Draw from the purpose field in the research plan. Write for a reader with no prior context — they should understand why this study happened and why it matters, without needing to have seen the research plan.}

---

## Research Objectives

What the team set out to learn:

**Primary objectives (Must):**
- {Must objective 1}
- {Must objective 2}

**Secondary objectives:**
- {Should/Could objectives}

**Hypotheses going in:**
- {Hypothesis 1, stated plainly}
- {Hypothesis 2}

---

## Methodology

**Method:** {usability test / discovery interviews / concept test / etc.}
**Format:** {moderated / unmoderated}
**Sessions:** {n participants, date range if known}

{1–2 paragraphs. How were sessions structured? What were participants asked to do or discuss? Any notable screener criteria or participant selection logic? For usability tests, briefly describe the tasks. For discovery studies, describe the discussion guide focus areas.}

---

## Participants

| Participant | Title | Company | Session Date |
|------------|-------|---------|--------------|
| {Name} | {title} | {company} | {date} |

{1–2 sentences describing the participant group as a whole — seniority range, diversity of use cases, any notable characteristics. This frames who the findings represent.}

---

## Key Takeaways

The most important things to know from this study. Written as strong declarative statements, not hedged observations. Ordered by importance.

1. **{Takeaway headline}** — {1 sentence that expands on what this means}
2. **{Takeaway headline}** — {1 sentence}
3. **{Takeaway headline}** — {1 sentence}

*(3–5 takeaways is the right range. More than that means you haven't prioritized.)*

---

## Task Findings *(usability tests only — omit for discovery studies)*

### Task Performance Overview

| Task | Avg Ease Rating (1–5) | Completion Rate | Key Issue |
|------|----------------------|-----------------|-----------|
| {Task name} | {avg} | {n/N completed} | {Top friction point in one phrase} |

Only include metrics that were actually collected. If confidence ratings, likelihood to use, or other benchmarks were captured, add them as additional columns. Don't invent metrics that weren't measured.

### Per-Task Breakdown

*Repeat this block for each task.*

**Task {N}: {Task name}**

*What participants were asked to do:* {1 sentence describing the task}

*What happened:* {2–3 sentences describing the pattern across participants — what went smoothly, where confusion or hesitation emerged, any notable outliers}

*Ease ratings by participant:*

| Participant | Rating | Notes |
|------------|--------|-------|
| {Name} | {1–5} | {Optional: what they said about it} |

*Supporting quotes:*
> "{Direct quote from transcript}" — {Participant name or role}

> "{Direct quote}" — {Participant}

---

## Insight Themes *(discovery/generative studies only — omit for usability tests)*

*Repeat this block for each major theme.*

### Theme {N}: {Theme name}

{2–3 sentences. What does this theme represent, and why does it matter? Frame it as something the team learned, not just something participants said.}

**Pattern:** {How many or which participants expressed this? Note any variation — e.g., "more common among post-sales users" or "only surfaced with users who had prior experience with X"}

**Evidence:**

> "{Direct quote}" — {Participant name or role}, {title}, {company}

> "{Direct quote}" — {Participant}

---

## Hypothesis Outcomes

Revisiting each hypothesis from the research plan with what was actually found.

| Hypothesis | Outcome | Evidence |
|------------|---------|----------|
| {hypothesis as stated in the plan} | Supported / Refuted / Inconclusive | {1–2 sentences pointing to the key evidence} |

---

## Recommendations

Organized by priority. Each recommendation should be specific enough that someone could put it on a backlog.

### Must act on

**{Recommendation}**
*Why:* {What finding drives this, and what's the cost of not acting}

### Should act on

**{Recommendation}**
*Why:* {Connecting rationale}

### Consider for later

**{Recommendation}**
*Why:* {What makes this lower priority now but worth revisiting}

---

## Open Questions

What's still unresolved, or what new questions surfaced? Use this to feed into scoping the next research phase.

- {question}
- {question}

---

## Appendix: Session Details

| Participant | Title | Company | Session Date | Recording | Notes |
|------------|-------|---------|--------------|-----------|-------|
| {Name} | {title} | {company} | {date} | {link or "—"} | {link or "—"} |

---

## Writing guidance

- Lead with the things that matter most — don't bury the headline findings in the middle of a findings section
- Every insight needs evidence. If you can't point to a quote or observation, it's not a finding yet
- Quotes should be direct and sharp. Paraphrase sparingly, and only when needed for clarity
- Match the level of detail to what the transcripts actually support — don't over-extrapolate from thin data
- The Background and Methodology sections should make the report fully self-contained
- Keep Recommendations specific and actionable. "Improve the UX" is not a recommendation
