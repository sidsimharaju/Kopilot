"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/participant";
import type {
  AnalysisResult,
  FindingConfidence,
  ProjectState,
  Synthesis,
  SynthesisTheme,
} from "@/lib/types";

const CONFIDENCE_TONE: Record<FindingConfidence, string> = {
  high: "bg-foreground text-background",
  medium: "bg-muted text-foreground",
  low: "bg-muted text-muted-foreground",
};

type Props = {
  analysis: AnalysisResult | null | undefined;
  synthesis: Synthesis | null | undefined;
  update: (mut: (s: ProjectState) => ProjectState) => void;
};

export function FindingsCards({ analysis, synthesis, update }: Props) {
  const participants = analysis?.participants ?? [];

  function setFinding(pIdx: number, oIdx: number, text: string) {
    update((s) => {
      const next = structuredClone(s.analysisResult) ?? { participants: [] };
      const obj = next.participants?.[pIdx]?.byObjective?.[oIdx];
      if (obj) obj.finding = text;
      return { ...s, analysisResult: next };
    });
  }

  function setSynthesisField<K extends keyof Synthesis>(key: K, value: Synthesis[K]) {
    update((s) => {
      const next: Synthesis = structuredClone(s.synthesisResult) ?? {};
      next[key] = value;
      return { ...s, synthesisResult: next };
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {synthesis ? (
        <SynthesisCard synthesis={synthesis} setField={setSynthesisField} />
      ) : null}
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
                <Textarea
                  rows={3}
                  defaultValue={f.finding ?? ""}
                  placeholder="No finding yet."
                  onBlur={(e) => setFinding(idx, i, e.target.value)}
                />
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

function SynthesisCard({
  synthesis,
  setField,
}: {
  synthesis: Synthesis;
  setField: <K extends keyof Synthesis>(key: K, value: Synthesis[K]) => void;
}) {
  return (
    <Card className="bg-muted/40">
      <CardHeader>
        <CardTitle>Synthesis</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-[13px]">
        <div className="flex flex-col gap-1.5">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            TL;DR
          </div>
          <Textarea
            rows={3}
            defaultValue={synthesis.tldr ?? ""}
            placeholder="One paragraph summary"
            onBlur={(e) => setField("tldr", e.target.value)}
          />
        </div>

        <ThemeList
          themes={synthesis.themes}
          setThemes={(themes) => setField("themes", themes)}
        />

        <BulletList
          label="Top pain points"
          items={synthesis.topPainPoints}
          setItems={(items) => setField("topPainPoints", items)}
        />
        <BulletList
          label="Recommendations"
          items={synthesis.recommendations}
          setItems={(items) => setField("recommendations", items)}
        />
        <BulletList
          label="Open questions"
          items={synthesis.openQuestions}
          setItems={(items) => setField("openQuestions", items)}
        />
      </CardContent>
    </Card>
  );
}

function ThemeList({
  themes,
  setThemes,
}: {
  themes: SynthesisTheme[] | undefined;
  setThemes: (themes: SynthesisTheme[]) => void;
}) {
  const list = themes ?? [];

  function setOne(idx: number, mut: (t: SynthesisTheme) => SynthesisTheme) {
    setThemes(list.map((t, i) => (i === idx ? mut(t) : t)));
  }
  function add() {
    setThemes([...list, { name: "", description: "", participants: "" }]);
  }
  function remove(idx: number) {
    setThemes(list.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Themes
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={add}
          aria-label="Add theme"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
      {list.map((t, i) => (
        <div
          key={i}
          className="flex flex-col gap-1.5 rounded border border-border bg-card p-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <Input
              defaultValue={t.name ?? ""}
              placeholder="Theme name"
              onBlur={(e) =>
                setOne(i, (theme) => ({ ...theme, name: e.target.value }))
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => remove(i)}
              aria-label="Remove theme"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
          <Textarea
            rows={2}
            defaultValue={t.description ?? ""}
            placeholder="Description"
            onBlur={(e) =>
              setOne(i, (theme) => ({ ...theme, description: e.target.value }))
            }
          />
          <Input
            defaultValue={t.participants ?? ""}
            placeholder="Participants (e.g. P1, P3, P5)"
            onBlur={(e) =>
              setOne(i, (theme) => ({ ...theme, participants: e.target.value }))
            }
          />
        </div>
      ))}
    </div>
  );
}

function BulletList({
  label,
  items,
  setItems,
}: {
  label: string;
  items: string[] | undefined;
  setItems: (items: string[]) => void;
}) {
  const list = items ?? [];

  function setOne(idx: number, value: string) {
    setItems(list.map((it, i) => (i === idx ? value : it)));
  }
  function add() {
    setItems([...list, ""]);
  }
  function remove(idx: number) {
    setItems(list.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={add}
          aria-label={`Add ${label.toLowerCase()}`}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
      {list.map((item, i) => (
        <div key={i} className="flex items-start gap-1.5">
          <Input
            defaultValue={item}
            placeholder="…"
            onBlur={(e) => setOne(i, e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => remove(i)}
            aria-label="Remove"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
