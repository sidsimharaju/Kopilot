import type { ProjectState } from "./types";

export type ProjectStatus = {
  label: string;
  cls: "draft" | "planning" | "progress" | "done" | "analysis";
};

export function deriveStatus(state: ProjectState | undefined): ProjectStatus {
  const s = state ?? {};
  const analysis = s.analysisResult as { participants?: unknown[] } | undefined;
  if (Array.isArray(analysis?.participants) && analysis.participants.length) {
    return { label: "Analysis", cls: "analysis" };
  }
  const participants = s.participants ?? [];
  if (participants.some((p) => p.status === "completed")) {
    return { label: "Interviews", cls: "done" };
  }
  if (participants.length > 0) {
    return { label: "Recruiting", cls: "progress" };
  }
  const objectives = s.objectives ?? [];
  if (s.projectName || objectives.some((o) => "objective" in o && Boolean(o.objective))) {
    return { label: "Planning", cls: "planning" };
  }
  return { label: "Draft", cls: "draft" };
}

export function methodologyLabel(methodology: string | undefined): string {
  if (methodology === "usability") return "Usability test";
  if (methodology === "discovery") return "Discovery interview";
  return "";
}
