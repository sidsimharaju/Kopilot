import type {
  AnalysisResult,
  ObjectiveFinding,
  Participant,
  ParticipantAnalysis,
  Project,
  Synthesis,
} from "./types";

const TRANSCRIPT_CHAR_LIMIT = 5000;

// Participants the user has chosen to include in analysis. Only people with a
// transcript are eligible; an undefined selection means "all eligible".
export function selectedTranscriptParticipants(project: Project): Participant[] {
  const withTranscript = (project.S.participants ?? []).filter(
    (p) => (p.transcript || "").trim().length > 0,
  );
  const sel = project.S.analysisSelection;
  if (!sel) return withTranscript;
  const set = new Set(sel);
  return withTranscript.filter((p) => set.has(p.id as number));
}

const AGENT_SYSTEM = `You are a research operations assistant.

Always respond with valid JSON only — no markdown fences, no preamble.

Response schemas:
- Analysis: {"participants":[{"name":"","role":"","byObjective":[{"objective":"","finding":"2-3 sentence narrative","confidence":"high|medium|low","quotes":[""]}]}],"synthesis":{"tldr":"","themes":[{"name":"","description":"","participants":""}],"topPainPoints":[""],"recommendations":[""],"openQuestions":[""]}}`;

export function buildAnalysisPrompt(project: Project): string {
  const S = project.S;
  const completed = selectedTranscriptParticipants(project);
  const participantData =
    completed.length === 0
      ? "No completed interviews. Return {\"participants\":[],\"synthesis\":null}."
      : completed
          .map((p) => {
            const raw = p.transcript || "No transcript provided.";
            const truncated =
              raw.length > TRANSCRIPT_CHAR_LIMIT
                ? raw.slice(0, TRANSCRIPT_CHAR_LIMIT) + "\n[transcript truncated for length]"
                : raw;
            return `PARTICIPANT: ${p.name} (${p.role}${p.company ? " at " + p.company : ""})\nTRANSCRIPT:\n${truncated}`;
          })
          .join("\n\n---\n\n");

  const validObjectives = (S.objectives ?? []).filter((o) => o.objective);
  const objList =
    validObjectives.length === 0
      ? "1. [Must] Understand pain points in the user workflow"
      : validObjectives
          .map((o, i) => `${i + 1}. [${o.priority ?? "Must"}] ${o.objective}`)
          .join("\n");

  const objCount = validObjectives.length || 1;

  return `Analyze these research interviews. For each participant, map their findings to EVERY learning objective listed below — even if the participant didn't speak directly about an objective, infer what you can from their transcript or write "Not directly addressed in this interview." for that objective. Never skip an objective. The byObjective array MUST contain exactly ${objCount} entries per participant, in the SAME ORDER as the objectives below.

For each objective entry, write a detailed, in-depth finding (2-3 sentences) specific to that objective: what this person does or experiences, the tension or key insight, and why it matters. Include 1-2 verbatim quotes that best support the finding when possible.

Also write a cross-interview synthesis.

PROJECT: ${S.projectName || "User research study"}
PURPOSE: ${S.purpose || "Understanding user needs"}

LEARNING OBJECTIVES (return one finding per objective per participant, in this order):
${objList}

INTERVIEWS:
${participantData}

Return the full JSON structure.`;
}

async function loadSkill(name: string): Promise<string> {
  try {
    const res = await fetch(`/api/skills/${name}`);
    if (!res.ok) return "";
    const data = (await res.json()) as { content?: string };
    return data.content ?? "";
  } catch {
    return "";
  }
}

export async function runAnalysis(
  project: Project,
): Promise<{ analysis: AnalysisResult; synthesis: Synthesis | null }> {
  const skillName =
    project.S.methodology === "discovery"
      ? "synthesize-discovery-interview"
      : "synthesize-usability-test";
  const skillBody = await loadSkill(skillName);
  const baseSystem = AGENT_SYSTEM;
  const system = skillBody
    ? `${skillBody}\n\n---\n\nOPERATIONAL FORMAT (overrides any output format described above):\n${baseSystem}`
    : baseSystem;
  const prompt = buildAnalysisPrompt(project);
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4000,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Agent error: ${errText}`);
  }
  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = data.content?.find((b) => b.type === "text")?.text || "";
  let parsed: { participants?: ParticipantAnalysis[]; synthesis?: Synthesis | null };
  try {
    parsed = JSON.parse(text.replace(/```json|```/g, "").trim()) as typeof parsed;
  } catch {
    throw new Error("Could not parse analysis JSON");
  }

  const canonicalObjectives = (project.S.objectives ?? [])
    .filter((o) => o.objective)
    .map((o) => o.objective as string);

  const participants: ParticipantAnalysis[] = (parsed.participants ?? []).map((pu) => {
    const existing = Array.isArray(pu.byObjective) ? pu.byObjective : [];
    const aligned: ObjectiveFinding[] = canonicalObjectives.map((objText, i) => {
      const match =
        existing.find((e) => (e?.objective || "").trim() === objText.trim()) ||
        existing[i] ||
        null;
      return match
        ? { ...match, objective: objText }
        : { objective: objText, finding: "", confidence: "medium", quotes: [] };
    });
    return { ...pu, byObjective: aligned };
  });

  return {
    analysis: { participants },
    synthesis: parsed.synthesis ?? null,
  };
}

export async function generateReport(
  type: "summary" | "full",
  project: Project,
): Promise<string> {
  const skillName =
    type === "full" ? "research-full-report" : "research-summary-report";
  const skillRes = await fetch(`/api/skills/${skillName}`);
  if (!skillRes.ok) throw new Error("Could not load report skill");
  const { content: skillPrompt } = (await skillRes.json()) as {
    content: string;
  };

  const S = project.S;
  const TRANSCRIPT_LIMIT = 6000;
  const completed = selectedTranscriptParticipants(project);
  const participantData = completed
    .map((p) => {
      const raw = p.transcript || "";
      const truncated =
        raw.length > TRANSCRIPT_LIMIT
          ? raw.slice(0, TRANSCRIPT_LIMIT) + "\n[truncated]"
          : raw;
      return `PARTICIPANT: ${p.name} (${p.role}${p.company ? " at " + p.company : ""})\nTRANSCRIPT:\n${truncated}`;
    })
    .join("\n\n---\n\n");

  const objList = (S.objectives ?? [])
    .filter((o) => o.objective)
    .map((o, i) => `${i + 1}. [${o.priority ?? "Must"}] ${o.objective}`)
    .join("\n");

  const analysisJson =
    S.analysisResult || S.synthesisResult
      ? JSON.stringify(
          { participants: S.analysisResult?.participants ?? [], synthesis: S.synthesisResult },
          null,
          2,
        )
      : "(no prior analysis)";

  const userPrompt = `${skillPrompt}

PROJECT: ${S.projectName || "Untitled"}
PURPOSE: ${S.purpose || ""}
LEARNING OBJECTIVES:
${objList || "(none)"}

PRIOR ANALYSIS:
${analysisJson}

INTERVIEWS:
${participantData || "(none)"}

Write the report in markdown. Output only the markdown itself — do not wrap the whole response in code fences (no \`\`\`markdown … \`\`\`).`;

  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system:
        "You are a research operations assistant. Return clear, well-structured markdown. Never wrap the entire response in a code fence.",
      messages: [{ role: "user", content: userPrompt }],
      max_tokens: type === "full" ? 4000 : 2000,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Report generation failed: ${errText}`);
  }
  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const raw = data.content?.find((b) => b.type === "text")?.text || "";
  return stripWrappingFence(raw);
}

// Unwrap a response that's entirely a single fenced code block, so reports
// render as formatted text rather than a raw markdown code block.
function stripWrappingFence(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^```[^\n]*\n([\s\S]*?)\n?```$/);
  return match ? match[1].trim() : trimmed;
}
