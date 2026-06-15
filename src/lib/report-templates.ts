import type { Project } from "./types";

// Empty starter templates that mirror the research-summary-report and
// research-full-report skills. They are shown in the Reports editor before any
// report has been generated, so a researcher can see the expected structure and
// fill it in by hand — no transcript analysis required. Plan data we already
// have (project name, objectives, hypotheses, participants) is pre-filled;
// everything that depends on findings is left blank with {placeholders}.

function methodologyLabel(m: string | undefined): string {
  if (m === "discovery") return "Discovery interview";
  if (m === "usability") return "Moderated usability test";
  return "{method + format}";
}

function joinNames(arr: string[] | undefined, placeholder: string): string {
  const names = (arr ?? []).map((n) => (n ?? "").trim()).filter(Boolean);
  return names.length ? names.join(", ") : placeholder;
}

function participantsLabel(n: number): string {
  if (n <= 0) return "{n} participants";
  return `${n} participant${n === 1 ? "" : "s"}`;
}

function header(project: Project, title: string): string {
  const S = project.S;
  const n = (S.participants ?? []).length;
  return [
    `# ${title}: ${S.projectName?.trim() || "{Study/Project Name}"}`,
    "",
    `**Date:** ${S.date?.trim() || "{insert date}"}`,
    `**Product Area:** ${S.area?.trim() || "{product area}"}`,
    `**Researcher:** ${joinNames(S.researcher, "{insert name}")}`,
    `**Methodology:** ${methodologyLabel(S.methodology)}`,
    `**Participants:** ${participantsLabel(n)}`,
  ].join("\n");
}

export function summaryTemplate(project: Project): string {
  const S = project.S;
  const isUsability = S.methodology === "usability";
  const objectives = (S.objectives ?? []).filter((o) => o.objective);
  const participants = S.participants ?? [];

  const hypothesisRows = objectives
    .filter((o) => (o.hypothesis ?? "").trim())
    .map((o) => `| ${o.hypothesis} | Supported / Refuted / Inconclusive |  |`);

  const perObjectiveBlocks = objectives.length
    ? objectives
        .map((o) => {
          const rows = participants.length
            ? participants.map((p) => `| ${p.name ?? ""} |  |`).join("\n")
            : "| {Name} |  |";
          return `**${o.objective}**\n\n| Participant | Summary |\n|------------|---------|\n${rows}`;
        })
        .join("\n\n")
    : `**{Objective or key question}**\n\n| Participant | Summary |\n|------------|---------|\n| {Name} |  |`;

  const participantRows = participants.length
    ? participants
        .map(
          (p) =>
            `| ${p.name ?? ""} | ${p.role ?? ""} | ${p.company ?? ""} | ${p.scheduledAt ?? ""} | ${p.sessionLink ?? "—"} | ${p.sessionDoc ?? "—"} |`,
        )
        .join("\n")
    : "| {Name} | {title} | {company} | {date} | {link or —} | {link or —} |";

  const taskSection = isUsability
    ? `\n\n---\n\n## Task Performance Summary\n\n| Task | Avg Ease Rating (1–5) | Completion Rate | Key Issue |\n|------|----------------------|-----------------|-----------|\n| {Task name} |  |  |  |\n`
    : "";

  return `${header(project, "Research Summary")}

---

## Summary

_{One paragraph: the big picture — what you learned at the highest level, and whether it aligns with or challenges the study's purpose. Don't list findings here.}_

---

## Key Learnings and Recommendations

| Priority | Learning | Recommendation |
|----------|----------|----------------|
| Must |  |  |
| Should |  |  |
| Nice |  |  |
| Later |  |  |${taskSection}

---

## Hypothesis Check

| Hypothesis | Outcome | Evidence |
|------------|---------|----------|
${hypothesisRows.length ? hypothesisRows.join("\n") : "| {hypothesis} | Supported / Refuted / Inconclusive |  |"}

---

## Open Questions

- {Question that remains unresolved, or a new one that came up}

---

## Participant Details

| Participant | Title | Company | Session Date | Recording | Notes |
|------------|-------|---------|--------------|-----------|-------|
${participantRows}

### Per-Participant Summaries

${perObjectiveBlocks}
`;
}

export function fullTemplate(project: Project): string {
  const S = project.S;
  const isUsability = S.methodology === "usability";
  const objectives = (S.objectives ?? []).filter((o) => o.objective);
  const participants = S.participants ?? [];

  const mustList =
    objectives
      .filter((o) => (o.priority ?? "Must") === "Must")
      .map((o) => `- ${o.objective}`)
      .join("\n") || "- {Must objective}";

  const secondaryList =
    objectives
      .filter((o) => (o.priority ?? "Must") !== "Must")
      .map((o) => `- ${o.objective}`)
      .join("\n") || "- {Should / Could objective}";

  const hypothesisList =
    objectives
      .filter((o) => (o.hypothesis ?? "").trim())
      .map((o) => `- ${o.hypothesis}`)
      .join("\n") || "- {Hypothesis, stated plainly}";

  const participantRows = participants.length
    ? participants
        .map(
          (p) =>
            `| ${p.name ?? ""} | ${p.role ?? ""} | ${p.company ?? ""} | ${p.scheduledAt ?? ""} |`,
        )
        .join("\n")
    : "| {Name} | {title} | {company} | {date} |";

  const appendixRows = participants.length
    ? participants
        .map(
          (p) =>
            `| ${p.name ?? ""} | ${p.role ?? ""} | ${p.company ?? ""} | ${p.scheduledAt ?? ""} | ${p.sessionLink ?? "—"} | ${p.sessionDoc ?? "—"} |`,
        )
        .join("\n")
    : "| {Name} | {title} | {company} | {date} | {link or —} | {link or —} |";

  const hypothesisRows =
    objectives
      .filter((o) => (o.hypothesis ?? "").trim())
      .map((o) => `| ${o.hypothesis} | Supported / Refuted / Inconclusive |  |`)
      .join("\n") ||
    "| {hypothesis} | Supported / Refuted / Inconclusive |  |";

  const findingsSection = isUsability
    ? `## Task Findings

### Task Performance Overview

| Task | Avg Ease Rating (1–5) | Completion Rate | Key Issue |
|------|----------------------|-----------------|-----------|
| {Task name} |  |  |  |

### Per-Task Breakdown

**Task 1: {Task name}**

_What participants were asked to do:_ {1 sentence}

_What happened:_ {2–3 sentences on the pattern across participants}

_Supporting quotes:_
> "{Direct quote from transcript}" — {Participant}`
    : `## Insight Themes

### Theme 1: {Theme name}

{2–3 sentences. What does this theme represent, and why does it matter?}

**Pattern:** {How many or which participants expressed this, and any variation}

**Evidence:**
> "{Direct quote}" — {Participant, title, company}`;

  return `${header(project, "Research Report")}

---

## Background

{2–3 paragraphs. Why was this study conducted? What product context matters, and what decisions is it meant to inform? Write for a reader with no prior context.}

---

## Research Objectives

**Primary objectives (Must):**
${mustList}

**Secondary objectives:**
${secondaryList}

**Hypotheses going in:**
${hypothesisList}

---

## Methodology

**Method:** ${methodologyLabel(S.methodology)}
**Format:** {moderated / unmoderated}
**Sessions:** ${participantsLabel(participants.length)}

{1–2 paragraphs. How were sessions structured? What were participants asked to do or discuss?}

---

## Participants

| Participant | Title | Company | Session Date |
|------------|-------|---------|--------------|
${participantRows}

{1–2 sentences describing the participant group as a whole — seniority range, diversity of use cases, notable characteristics.}

---

## Key Takeaways

1. **{Takeaway headline}** — {1 sentence}
2. **{Takeaway headline}** — {1 sentence}
3. **{Takeaway headline}** — {1 sentence}

---

${findingsSection}

---

## Hypothesis Outcomes

| Hypothesis | Outcome | Evidence |
|------------|---------|----------|
${hypothesisRows}

---

## Recommendations

### Must act on

**{Recommendation}**
_Why:_ {What finding drives this, and the cost of not acting}

### Should act on

**{Recommendation}**
_Why:_ {Connecting rationale}

### Consider for later

**{Recommendation}**
_Why:_ {What makes this lower priority now but worth revisiting}

---

## Open Questions

- {What's still unresolved, or a new question that surfaced}

---

## Appendix: Session Details

| Participant | Title | Company | Session Date | Recording | Notes |
|------------|-------|---------|--------------|-----------|-------|
${appendixRows}
`;
}
