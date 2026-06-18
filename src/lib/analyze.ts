import type {
  AnalysisResult,
  ObjectiveFinding,
  Participant,
  ParticipantAnalysis,
  Project,
  Synthesis,
} from "./types";

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

const PER_PARTICIPANT_CHAR_LIMIT = 14000;

// Per-call output schemas. Kept small (one participant per request) so a single
// response never has to hold every participant at once — the all-in-one call
// used to overflow max_tokens and silently drop participants.
const PARTICIPANT_SCHEMA =
  'Always respond with valid JSON only — no markdown fences, no preamble. Schema: {"byObjective":[{"objective":"","finding":"2-3 sentence narrative","confidence":"high|medium|low","quotes":[""]}]}';
const SYNTHESIS_SCHEMA =
  'Always respond with valid JSON only — no markdown fences, no preamble. Schema: {"tldr":"","themes":[{"name":"","description":"","participants":""}],"topPainPoints":[""],"recommendations":[""],"openQuestions":[""]}';

function objectivesList(project: Project): {
  objList: string;
  objCount: number;
  canonical: string[];
} {
  const canonical = (project.S.objectives ?? [])
    .filter((o) => o.objective)
    .map((o) => o.objective as string);
  const objList =
    canonical.length === 0
      ? "1. Understand pain points in the user workflow"
      : canonical.map((o, i) => `${i + 1}. ${o}`).join("\n");
  return { objList, objCount: canonical.length || 1, canonical };
}

function buildParticipantPrompt(
  project: Project,
  p: Participant,
  objList: string,
  objCount: number,
): string {
  const S = project.S;
  const raw = p.transcript || "No transcript provided.";
  const transcript =
    raw.length > PER_PARTICIPANT_CHAR_LIMIT
      ? raw.slice(0, PER_PARTICIPANT_CHAR_LIMIT) + "\n[transcript truncated for length]"
      : raw;

  return `Analyze this single research interview. Map the participant's input to EVERY learning objective below — even if they didn't speak directly about an objective, infer what you can from the transcript or write "Not directly addressed in this interview." for that objective. Never skip an objective. The byObjective array MUST contain exactly ${objCount} entries, in the SAME ORDER as the objectives below.

For each objective, write a detailed, in-depth finding (2-3 sentences) specific to that objective: what this person does or experiences, the tension or key insight, and why it matters. Include 1-2 verbatim quotes that best support the finding when possible.

PROJECT: ${S.projectName || "User research study"}
PURPOSE: ${S.purpose || "Understanding user needs"}

LEARNING OBJECTIVES (return one finding per objective, in this order):
${objList}

PARTICIPANT: ${p.name} (${p.role}${p.company ? " at " + p.company : ""})
TRANSCRIPT:
${transcript}

Return the JSON object only.`;
}

function buildSynthesisPrompt(
  project: Project,
  participants: ParticipantAnalysis[],
  objList: string,
): string {
  const S = project.S;
  const compact = participants.map((p) => ({
    name: p.name,
    role: p.role,
    findings: (p.byObjective ?? []).map((o) => `[${o.objective}] ${o.finding}`),
  }));
  return `Write a cross-interview synthesis for this study based on the per-participant findings below.

PROJECT: ${S.projectName || "User research study"}
PURPOSE: ${S.purpose || "Understanding user needs"}

LEARNING OBJECTIVES:
${objList}

PER-PARTICIPANT FINDINGS (JSON):
${JSON.stringify(compact, null, 2)}

Return the synthesis JSON object only.`;
}

// Force every participant's findings into the canonical objective order, so the
// table always shows one row per objective even if the model returned them in a
// different order or skipped some.
function alignToObjectives(
  canonical: string[],
  incoming: Array<Partial<ObjectiveFinding>>,
): ObjectiveFinding[] {
  const norm = (f: Partial<ObjectiveFinding> | null | undefined): ObjectiveFinding => ({
    objective: (f?.objective || "").trim(),
    finding: (f?.finding || "").trim(),
    confidence: f?.confidence ?? "medium",
    quotes: Array.isArray(f?.quotes) ? (f.quotes as string[]) : [],
  });
  if (canonical.length === 0) return incoming.map((e) => norm(e));
  return canonical.map((objText, i) => {
    const match =
      incoming.find((e) => (e?.objective || "").trim() === objText.trim()) ??
      incoming[i] ??
      null;
    return match ? { ...norm(match), objective: objText } : norm({ objective: objText });
  });
}

async function callAnalysisAgent(
  system: string,
  prompt: string,
  maxTokens: number,
): Promise<Record<string, unknown>> {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
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
  return JSON.parse(text.replace(/```json|```/g, "").trim()) as Record<string, unknown>;
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
  onProgress?: (participantId: number) => void,
): Promise<{ analysis: AnalysisResult; synthesis: Synthesis | null }> {
  const skillName =
    project.S.methodology === "discovery"
      ? "synthesize-discovery-interview"
      : "synthesize-usability-test";
  const skillBody = await loadSkill(skillName);
  const participantSystem = skillBody
    ? `${skillBody}\n\n---\n\nOPERATIONAL FORMAT (overrides any output format described above):\n${PARTICIPANT_SCHEMA}`
    : PARTICIPANT_SCHEMA;

  const completed = selectedTranscriptParticipants(project);
  const { objList, objCount, canonical } = objectivesList(project);

  // One request per participant. Each response is small and self-contained, so
  // it can't be truncated into dropping people the way a single all-in-one call
  // was. If one participant's call fails, they still get a card with empty
  // findings rather than disappearing.
  const participants: ParticipantAnalysis[] = await Promise.all(
    completed.map(async (p): Promise<ParticipantAnalysis> => {
      let incoming: Array<Partial<ObjectiveFinding>> = [];
      try {
        const parsed = await callAnalysisAgent(
          participantSystem,
          buildParticipantPrompt(project, p, objList, objCount),
          2000,
        );
        if (Array.isArray(parsed.byObjective)) {
          incoming = parsed.byObjective as Array<Partial<ObjectiveFinding>>;
        }
      } catch (err) {
        console.error(`Analysis failed for ${p.name}`, err);
      }
      if (typeof p.id === "number") onProgress?.(p.id);
      return {
        name: p.name,
        role: p.role,
        byObjective: alignToObjectives(canonical, incoming),
      };
    }),
  );

  let synthesis: Synthesis | null = null;
  if (participants.length > 0) {
    try {
      const parsed = await callAnalysisAgent(
        SYNTHESIS_SCHEMA,
        buildSynthesisPrompt(project, participants, objList),
        1800,
      );
      synthesis = parsed as Synthesis;
    } catch (err) {
      console.error("Synthesis failed", err);
    }
  }

  return { analysis: { participants }, synthesis };
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
