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
  high: "bg-foreground text-background",
  medium: "bg-muted text-foreground",
  low: "bg-muted text-muted-foreground",
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
              <CardContent className="flex max-h-[520px] flex-col gap-3 overflow-y-auto">
                {(p.byObjective ?? []).map((f, i) => (
                  <div
                    key={i}
                    className="rounded border border-border bg-background p-3"
                  >
                    <div className="mb-1.5 flex items-start justify-between gap-3">
                      <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                        Objective {i + 1}
                      </div>
                      {f.confidence ? (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                            CONFIDENCE_TONE[f.confidence],
                          )}
                        >
                          {f.confidence}
                        </span>
                      ) : null}
                    </div>
                    <div className="mb-2 text-[13px] font-medium">{f.objective}</div>
                    <Textarea
                      rows={5}
                      defaultValue={mergeFindingText(f)}
                      placeholder="No finding yet."
                      onBlur={(e) => setFinding(idx, i, e.target.value)}
                    />
                    <p className="mt-1 text-[10.5px] text-muted-foreground">
                      Quotes are inlined as &gt; &ldquo;…&rdquo;. Delete or edit them
                      freely.
                    </p>
                  </div>
                ))}
              </CardContent>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
