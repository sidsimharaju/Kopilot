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
  const [analyzingIds, setAnalyzingIds] = useState<number[]>([]);
  const [doneIds, setDoneIds] = useState<number[]>([]);

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

  // The findings section always shows one card per participant with a row per
  // learning objective — independent of whether analysis has run. Findings from
  // a prior analysis are merged in by participant name and aligned to the
  // current objectives; anything not yet analyzed renders empty so people can
  // type it by hand or run analysis later (which just fills these in).
  const objTexts = (project.S.objectives ?? [])
    .filter((o) => o.objective)
    .map((o) => o.objective as string);
  const analyzedByName = new Map(
    (project.S.analysisResult?.participants ?? []).map((ap) => [
      (ap.name ?? "").trim().toLowerCase(),
      ap,
    ]),
  );
  const displayAnalysis: AnalysisResult = {
    participants: participants.map((p) => {
      const incoming = analyzedByName.get((p.name ?? "").trim().toLowerCase())?.byObjective ?? [];
      const byObjective =
        objTexts.length > 0
          ? objTexts.map((objText, i) => {
              const match =
                incoming.find(
                  (e) => (e.objective ?? "").trim().toLowerCase() === objText.toLowerCase(),
                ) ?? incoming[i];
              return {
                objective: objText,
                finding: (match?.finding ?? "").trim(),
                confidence: match?.confidence,
                quotes: match?.quotes ?? [],
              };
            })
          : incoming.map((e) => ({
              objective: e.objective ?? "",
              finding: e.finding ?? "",
              confidence: e.confidence,
              quotes: e.quotes ?? [],
            }));
      return { name: p.name, role: p.role, byObjective };
    }),
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
    setAnalyzingIds(effectiveSelected);
    setDoneIds([]);
    try {
      const { analysis, synthesis } = await runAnalysis(project, (id) => {
        setDoneIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      });
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
      setAnalyzingIds([]);
      setDoneIds([]);
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
        analyzingIds={analyzingIds}
        doneIds={doneIds}
        hasAnalysis={hasAnalysis}
        onAnalyze={analyze}
      />

      <FindingsCards analysis={displayAnalysis} update={update} />

      <ReportsPanel project={project} update={update} />
    </div>
  );
}
