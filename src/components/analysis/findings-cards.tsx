"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/participant";
import type {
  AnalysisResult,
  FindingConfidence,
  ObjectiveFinding,
  ProjectState,
} from "@/lib/types";

const CONFIDENCE_TONE: Record<FindingConfidence, string> = {
  high: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  low: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
};

function mergeFindingText(f: ObjectiveFinding): string {
  const base = (f.finding ?? "").trim();
  const quotes = (f.quotes ?? []).filter((q) => q && q.trim());
  if (quotes.length === 0) return base;
  const quoteLines = quotes.map((q) => `> "${q.trim()}"`).join("\n");
  return base ? `${base}\n\n${quoteLines}` : quoteLines;
}

type Props = {
  analysis: AnalysisResult | null | undefined;
  update: (mut: (s: ProjectState) => ProjectState) => void;
};

export function FindingsCards({ analysis, update }: Props) {
  const participants = analysis?.participants ?? [];
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  function setFinding(pIdx: number, oIdx: number, text: string) {
    update((s) => {
      const next = structuredClone(s.analysisResult) ?? { participants: [] };
      const obj = next.participants?.[pIdx]?.byObjective?.[oIdx];
      if (obj) {
        obj.finding = text;
        obj.quotes = [];
      }
      return { ...s, analysisResult: next };
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {participants.map((p, idx) => {
        const isCollapsed = collapsed[idx] === true;
        return (
          <Card key={`${p.name ?? "anon"}-${idx}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed((c) => ({ ...c, [idx]: !isCollapsed }))
                  }
                  aria-label={isCollapsed ? "Expand participant" : "Collapse participant"}
                  className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform",
                      isCollapsed && "-rotate-90",
                    )}
                  />
                </button>
                <span className="flex size-7 items-center justify-center rounded-full bg-muted text-[10.5px] font-semibold text-muted-foreground">
                  {initials(p.name)}
                </span>
                <span>{p.name || "Participant"}</span>
                {p.role ? (
                  <span className="text-[11.5px] font-normal text-muted-foreground">
                    {p.role}
                  </span>
                ) : null}
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {(p.byObjective ?? []).length}{" "}
                  {(p.byObjective ?? []).length === 1 ? "finding" : "findings"}
                </span>
              </CardTitle>
            </CardHeader>
            {!isCollapsed ? (
              <CardContent className="max-h-[560px] overflow-y-auto p-0">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-10 bg-card">
                    <tr className="border-y border-border text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      <th className="w-[38%] px-4 py-2.5">Objective</th>
                      <th className="px-4 py-2.5">Learning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(p.byObjective ?? []).map((f, i) => (
                      <tr
                        key={i}
                        className="border-b border-border align-top last:border-0"
                      >
                        <td className="border-r border-border bg-muted/30 px-4 py-3.5">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-background text-[10px] font-semibold text-muted-foreground ring-1 ring-border">
                                {i + 1}
                              </span>
                              {f.confidence ? (
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                                    CONFIDENCE_TONE[f.confidence],
                                  )}
                                >
                                  {f.confidence}
                                </span>
                              ) : null}
                            </div>
                            <span className="text-[13px] font-medium leading-snug text-foreground">
                              {f.objective}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <Textarea
                            rows={4}
                            defaultValue={mergeFindingText(f)}
                            placeholder="No finding yet."
                            onBlur={(e) => setFinding(idx, i, e.target.value)}
                            className="min-h-[96px] resize-y text-[13px] leading-relaxed"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
