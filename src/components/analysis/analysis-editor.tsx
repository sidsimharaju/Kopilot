"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SaveIndicator } from "@/components/setup/save-indicator";
import { runAnalysis } from "@/lib/analyze";
import { useProject } from "@/lib/use-project";
import type { Project } from "@/lib/types";
import { FindingsCards } from "./findings-cards";
import { ReportsPanel } from "./reports-panel";
import { TranscriptsPanel } from "./transcripts-panel";

export function AnalysisEditor({ initial }: { initial: Project }) {
  const { project, status, update } = useProject(initial);
  const [analyzing, setAnalyzing] = useState(false);

  const participants = project.S.participants ?? [];
  const participantsWithTranscripts = participants.filter(
    (p) => (p.transcript || "").trim().length > 0,
  );
  const hasTranscripts = participantsWithTranscripts.length > 0;
  const hasAnalysis =
    (project.S.analysisResult?.participants?.length ?? 0) > 0 ||
    Boolean(project.S.synthesisResult);

  async function analyze() {
    if (!hasTranscripts) {
      toast.error("Add at least one transcript first");
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
    <div className="relative flex flex-col gap-3.5">
      <div className="pointer-events-none absolute right-0 -top-4 z-10">
        <SaveIndicator status={status} />
      </div>

      <TranscriptsPanel state={project.S} update={update} />

      {!hasAnalysis ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <div className="text-[20px]">🔬</div>
            <div className="text-[15px] font-medium">Create analysis</div>
            <div className="max-w-md text-[12.5px] text-muted-foreground">
              Once you have transcripts above, click below to map findings to your
              learning objectives and generate a cross-interview synthesis.
            </div>
            <Button
              onClick={analyze}
              disabled={!hasTranscripts || analyzing}
              className="gap-1.5"
            >
              <Sparkles className="size-4" />
              {analyzing ? "Analyzing…" : "Create analysis"}
            </Button>
            {!hasTranscripts ? (
              <div className="text-[11.5px] text-muted-foreground">
                Paste or upload at least one transcript above to enable analysis.
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={analyze}
              disabled={analyzing}
              className="gap-1.5"
            >
              <Sparkles className="size-3.5" />
              {analyzing ? "Re-analyzing…" : "Re-analyze"}
            </Button>
          </div>
          <FindingsCards
            analysis={project.S.analysisResult}
            synthesis={project.S.synthesisResult}
            synthesisRich={project.S.synthesisRich}
            update={update}
          />
        </>
      )}

      {hasTranscripts ? <ReportsPanel project={project} update={update} /> : null}
    </div>
  );
}
