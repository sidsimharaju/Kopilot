"use client";

import { useState } from "react";
import { toast } from "sonner";
import { runAnalysis } from "@/lib/analyze";
import { useProject } from "@/lib/use-project";
import type { AnalysisResult, Project } from "@/lib/types";
import { AnalysisSelectionPanel } from "./analysis-selection-panel";
import { FindingsCards } from "./findings-cards";
import { ReportsPanel } from "./reports-panel";

export function AnalysisEditor({ initial }: { initial: Project }) {
  const { project, update } = useProject(initial);
  const [analyzing, setAnalyzing] = useState(false);

  const participants = project.S.participants ?? [];
  const withTranscripts = participants.filter(
    (p) => (p.transcript || "").trim().length > 0,
  );
  const transcriptIds = withTranscripts.map((p) => p.id!);
  const selectedIds = project.S.analysisSelection ?? transcriptIds;
  const effectiveSelected = selectedIds.filter((id) => transcriptIds.includes(id));

  const hasAnalysis =
    (project.S.analysisResult?.participants?.length ?? 0) > 0 ||
    Boolean(project.S.synthesisResult);

  // The findings section shows per participant, one row per learning objective.
  // Before any transcript analysis runs we render an empty scaffold so the
  // researcher can type what they learned by hand; the first edit materializes
  // it into analysisResult (see FindingsCards).
  const objectives = (project.S.objectives ?? []).filter((o) => o.objective);
  const displayAnalysis: AnalysisResult = hasAnalysis
    ? (project.S.analysisResult ?? { participants: [] })
    : {
        participants: participants.map((p) => ({
          name: p.name,
          role: p.role,
          byObjective: objectives.map((o) => ({
            objective: o.objective as string,
            finding: "",
            quotes: [],
          })),
        })),
      };

  function setSelection(ids: number[]) {
    update((s) => ({ ...s, analysisSelection: ids }));
  }

  function toggle(id: number, checked: boolean) {
    const base = project.S.analysisSelection ?? transcriptIds;
    const next = checked
      ? Array.from(new Set([...base, id]))
      : base.filter((x) => x !== id);
    setSelection(next);
  }

  function selectAll(checked: boolean) {
    setSelection(checked ? transcriptIds : []);
  }

  async function analyze() {
    if (effectiveSelected.length === 0) {
      toast.error("Select at least one participant with a transcript");
      return;
    }
    setAnalyzing(true);
    try {
      const { analysis, synthesis } = await runAnalysis(project);
      update((s) => ({
        ...s,
        analysisResult: analysis,
        synthesisResult: synthesis,
      }));
      toast.success("Analysis complete");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Analysis failed: ${message}`);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="flex flex-col gap-3.5">
      <AnalysisSelectionPanel
        participants={withTranscripts}
        selectedIds={effectiveSelected}
        onToggle={toggle}
        onSelectAll={selectAll}
        analyzing={analyzing}
        hasAnalysis={hasAnalysis}
        onAnalyze={analyze}
      />

      <FindingsCards analysis={displayAnalysis} update={update} />

      <ReportsPanel project={project} update={update} />
    </div>
  );
}
