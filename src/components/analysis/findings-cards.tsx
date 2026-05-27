"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/participant";
import type {
  AnalysisResult,
  FindingConfidence,
  Synthesis,
} from "@/lib/types";

const CONFIDENCE_TONE: Record<FindingConfidence, string> = {
  high: "bg-foreground text-background",
  medium: "bg-muted text-foreground",
  low: "bg-muted text-muted-foreground",
};

export function FindingsCards({
  analysis,
  synthesis,
}: {
  analysis: AnalysisResult | null | undefined;
  synthesis: Synthesis | null | undefined;
}) {
  const participants = analysis?.participants ?? [];
  return (
    <div className="flex flex-col gap-3">
      {synthesis ? <SynthesisCard synthesis={synthesis} /> : null}
      {participants.map((p, idx) => (
        <Card key={`${p.name ?? "anon"}-${idx}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-muted text-[10.5px] font-semibold text-muted-foreground">
                {initials(p.name)}
              </span>
              <span>{p.name || "Participant"}</span>
              {p.role ? (
                <span className="text-[11.5px] font-normal text-muted-foreground">
                  {p.role}
                </span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
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
                <div className="text-[12.5px] leading-relaxed text-foreground">
                  {f.finding || (
                    <span className="text-muted-foreground italic">No finding yet.</span>
                  )}
                </div>
                {(f.quotes ?? []).length > 0 ? (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {(f.quotes ?? []).map((q, qi) => (
                      <blockquote
                        key={qi}
                        className="border-l-2 border-border bg-muted/50 px-2.5 py-1.5 text-[12px] italic text-muted-foreground"
                      >
                        “{q}”
                      </blockquote>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SynthesisCard({ synthesis }: { synthesis: Synthesis }) {
  return (
    <Card className="bg-muted/40">
      <CardHeader>
        <CardTitle>Synthesis</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-[13px]">
        {synthesis.tldr ? (
          <div>
            <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              TL;DR
            </div>
            <div className="leading-relaxed">{synthesis.tldr}</div>
          </div>
        ) : null}
        {synthesis.themes && synthesis.themes.length > 0 ? (
          <div>
            <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Themes
            </div>
            <div className="flex flex-col gap-2">
              {synthesis.themes.map((t, i) => (
                <div
                  key={i}
                  className="rounded border border-border bg-card p-2.5"
                >
                  <div className="font-medium">{t.name}</div>
                  {t.description ? (
                    <div className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                      {t.description}
                    </div>
                  ) : null}
                  {t.participants ? (
                    <div className="mt-1.5 text-[11px] text-muted-foreground">
                      {t.participants}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <BulletList label="Top pain points" items={synthesis.topPainPoints} />
        <BulletList label="Recommendations" items={synthesis.recommendations} />
        <BulletList label="Open questions" items={synthesis.openQuestions} />
      </CardContent>
    </Card>
  );
}

function BulletList({
  label,
  items,
}: {
  label: string;
  items: string[] | undefined;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      <ul className="ml-4 flex list-disc flex-col gap-1 text-[12.5px] leading-relaxed">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
