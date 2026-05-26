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
  high: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-border-soft text-text-3",
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
              <span className="flex size-7 items-center justify-center rounded-full bg-border-soft text-[10.5px] font-semibold text-text-2">
                {initials(p.name)}
              </span>
              <span>{p.name || "Participant"}</span>
              {p.role ? (
                <span className="text-[11.5px] font-normal text-text-3">
                  {p.role}
                </span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {(p.byObjective ?? []).map((f, i) => (
              <div
                key={i}
                className="rounded border border-border-soft bg-background p-3"
              >
                <div className="mb-1.5 flex items-start justify-between gap-3">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-3">
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
                    <span className="text-text-3 italic">No finding yet.</span>
                  )}
                </div>
                {(f.quotes ?? []).length > 0 ? (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {(f.quotes ?? []).map((q, qi) => (
                      <blockquote
                        key={qi}
                        className="border-l-2 border-primary/40 bg-brand-soft/50 px-2.5 py-1.5 text-[12px] italic text-text-2"
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
    <Card className="border-primary/40 bg-brand-soft/30">
      <CardHeader>
        <CardTitle>Synthesis</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-[13px]">
        {synthesis.tldr ? (
          <div>
            <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-3">
              TL;DR
            </div>
            <div className="leading-relaxed">{synthesis.tldr}</div>
          </div>
        ) : null}
        {synthesis.themes && synthesis.themes.length > 0 ? (
          <div>
            <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-3">
              Themes
            </div>
            <div className="flex flex-col gap-2">
              {synthesis.themes.map((t, i) => (
                <div
                  key={i}
                  className="rounded border border-border-soft bg-card p-2.5"
                >
                  <div className="font-medium">{t.name}</div>
                  {t.description ? (
                    <div className="mt-1 text-[12.5px] leading-relaxed text-text-2">
                      {t.description}
                    </div>
                  ) : null}
                  {t.participants ? (
                    <div className="mt-1.5 text-[11px] text-text-3">
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
      <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-3">
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
