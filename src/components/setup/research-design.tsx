"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { callAgentJSON } from "@/lib/agent";
import { cn } from "@/lib/utils";
import {
  CHIPS_CUSTOMERS,
  CHIPS_INTERNAL,
  CHIPS_NONCUSTOMERS,
  COHORT_COUNT,
  COHORT_DESCRIPTION,
  COHORT_LABEL,
} from "@/lib/constants";
import type { Cohort, ProjectState, SessionRange } from "@/lib/types";

type Props = {
  state: ProjectState;
  update: (mut: (s: ProjectState) => ProjectState) => void;
};

const COHORTS: Cohort[] = ["internal", "customers", "noncustomers"];

const CHIPS: Record<Cohort, Array<{ label: string; value: string }>> = {
  internal: CHIPS_INTERNAL,
  customers: CHIPS_CUSTOMERS,
  noncustomers: CHIPS_NONCUSTOMERS,
};

export function ResearchDesign({ state, update }: Props) {
  const methodology = state.methodology ?? "usability";
  const cohorts = state.cohorts ?? { internal: false, customers: false, noncustomers: false };
  const selected = COHORTS.filter((c) => cohorts[c]);

  function setMethod(m: "usability" | "discovery") {
    update((s) => ({ ...s, methodology: m }));
  }

  function toggleCohort(c: Cohort) {
    update((s) => {
      const current = s.cohorts ?? { internal: false, customers: false, noncustomers: false };
      return { ...s, cohorts: { ...current, [c]: !current[c] } };
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Research design</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label>Methodology</Label>
          <p className="text-[12px] text-muted-foreground">
            One method for the whole study. Mixing methods means separate studies.
          </p>
          <ToggleGroup
            value={[methodology]}
            onValueChange={(vals) => {
              const v = vals[0];
              if (v) setMethod(v as "usability" | "discovery");
            }}
            className="grid w-full grid-cols-2 gap-2"
          >
            <MethodOption
              value="usability"
              title="Moderated usability test"
              subtitle="Watch someone use something"
            />
            <MethodOption
              value="discovery"
              title="Discovery interview"
              subtitle="Understand how someone thinks"
            />
          </ToggleGroup>
        </div>

        <hr className="border-border" />

        <div className="flex flex-col gap-2">
          <Label>Who are you talking to?</Label>
          <p className="text-[12px] text-muted-foreground">
            Select every cohort you plan to include. Aim for ~6 sessions total.
          </p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {COHORTS.map((c) => (
              <CohortSelector
                key={c}
                cohort={c}
                selected={cohorts[c]}
                onClick={() => toggleCohort(c)}
              />
            ))}
          </div>
        </div>

        {selected.length > 0 ? (
          <Tabs defaultValue={selected[0]} className="flex flex-col gap-3">
            <TabsList className="w-fit">
              {selected.map((c) => (
                <TabsTrigger key={c} value={c}>
                  {COHORT_LABEL[c]}
                </TabsTrigger>
              ))}
            </TabsList>
            {selected.map((c) => (
              <TabsContent key={c} value={c}>
                <CohortDetail cohort={c} state={state} update={update} />
              </TabsContent>
            ))}
          </Tabs>
        ) : null}
      </CardContent>
    </Card>
  );
}

function MethodOption({
  value,
  title,
  subtitle,
}: {
  value: string;
  title: string;
  subtitle: string;
}) {
  return (
    <ToggleGroupItem
      value={value}
      variant="outline"
      className="flex h-auto flex-col items-start gap-1 rounded-md border bg-card px-3 py-2.5 text-left whitespace-normal hover:bg-accent aria-pressed:border-foreground aria-pressed:bg-accent"
    >
      <div className="text-[13px] font-medium">{title}</div>
      <div className="text-[11px] text-muted-foreground">{subtitle}</div>
    </ToggleGroupItem>
  );
}

function CohortSelector({
  cohort,
  selected,
  onClick,
}: {
  cohort: Cohort;
  selected: boolean;
  onClick: () => void;
}) {
  const isPaid = cohort === "noncustomers";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-2 rounded-md border bg-card px-3 py-2.5 text-left transition-colors",
        selected
          ? "border-foreground bg-accent"
          : "border-border hover:bg-accent",
        isPaid && !selected && "border-dashed",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded-[3px] border-2",
          selected ? "border-foreground bg-foreground text-background" : "border-muted-foreground",
        )}
      >
        {selected ? <Check className="size-2.5" strokeWidth={3} /> : null}
      </span>
      <span className="flex flex-1 flex-col">
        <span className="text-[13px] font-medium">{COHORT_LABEL[cohort]}</span>
        <span className="text-[11px] text-muted-foreground">{COHORT_DESCRIPTION[cohort]}</span>
        <span className="mt-1 text-[10.5px] font-medium text-muted-foreground">
          {COHORT_COUNT[cohort]}
        </span>
      </span>
    </button>
  );
}

function CohortDetail({
  cohort,
  state,
  update,
}: {
  cohort: Cohort;
  state: ProjectState;
  update: (mut: (s: ProjectState) => ProjectState) => void;
}) {
  const sessions = state.sessions?.[cohort] ?? {};
  const chipSelections = state.chipSelections?.[cohort] ?? [];
  const criteria =
    cohort === "internal"
      ? ""
      : (state.criteria?.[cohort as "customers" | "noncustomers"] ?? "");
  const screener =
    cohort === "internal"
      ? ""
      : (state.screener?.[cohort as "customers" | "noncustomers"] ?? "");
  const screenerChoice =
    cohort === "internal"
      ? ""
      : (state.screenerChoice?.[cohort as "customers" | "noncustomers"] ?? "");

  function setSessionField(field: keyof SessionRange, value: string) {
    update((s) => {
      const all = s.sessions ?? {
        internal: {}, customers: {}, noncustomers: {},
      };
      const cur = all[cohort] ?? {};
      return {
        ...s,
        sessions: { ...all, [cohort]: { ...cur, [field]: value } },
      };
    });
  }

  function setChipSelections(values: string[]) {
    update((s) => {
      const all = s.chipSelections ?? {};
      return { ...s, chipSelections: { ...all, [cohort]: values } };
    });
  }

  function setCriteria(value: string) {
    if (cohort === "internal") return;
    update((s) => {
      const cur = s.criteria ?? {};
      return { ...s, criteria: { ...cur, [cohort]: value } };
    });
  }

  function setScreener(value: string) {
    if (cohort === "internal") return;
    update((s) => {
      const cur = s.screener ?? {};
      return { ...s, screener: { ...cur, [cohort]: value } };
    });
  }

  function setScreenerChoice(value: "yes" | "no") {
    if (cohort === "internal") return;
    update((s) => {
      const cur = s.screenerChoice ?? {};
      return { ...s, screenerChoice: { ...cur, [cohort]: value } };
    });
  }

  const isPaid = cohort === "noncustomers";

  return (
    <div
      className={cn(
        "rounded-md border bg-background p-4",
        isPaid ? "border-foreground/30 bg-muted/40" : "border-border",
      )}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-semibold">{COHORT_LABEL[cohort]}</span>
        {isPaid ? (
          <span className="rounded bg-foreground px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
            Paid via Respondent
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <SessionInput
            label="min"
            value={sessions.min ?? ""}
            onChange={(v) => setSessionField("min", v)}
          />
          <SessionInput
            label="ideal"
            value={sessions.ideal ?? ""}
            onChange={(v) => setSessionField("ideal", v)}
          />
          <SessionInput
            label="max"
            value={sessions.max ?? ""}
            onChange={(v) => setSessionField("max", v)}
          />
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Who to recruit <span className="font-normal text-muted-foreground normal-case tracking-normal">(pick any that apply)</span>
        </div>
        <ToggleGroup
          multiple
          value={chipSelections}
          onValueChange={setChipSelections}
          className="flex flex-wrap gap-1.5"
        >
          {CHIPS[cohort].map((chip) => (
            <ToggleGroupItem
              key={chip.value}
              value={chip.value}
              variant="outline"
              size="sm"
              className="rounded-full border bg-card px-2.5 py-1 text-[11.5px] text-muted-foreground hover:bg-accent aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background"
            >
              {chip.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {cohort !== "internal" ? (
        <>
          <div className="mb-3 flex flex-col gap-1.5">
            <Label className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
              Criteria
            </Label>
            <Textarea
              rows={3}
              placeholder="Describe your ideal participant. Edit freely."
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
              {isPaid ? "Screener (required)" : "Do you need a screener?"}
            </Label>
            {!isPaid ? (
              <ToggleGroup
                value={screenerChoice ? [screenerChoice] : []}
                onValueChange={(vals) => {
                  const v = vals[0];
                  if (v === "yes" || v === "no") setScreenerChoice(v);
                }}
                className="flex gap-2"
              >
                <ToggleGroupItem
                  value="yes"
                  variant="outline"
                  className="h-auto rounded-md border bg-card px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-accent aria-pressed:border-foreground aria-pressed:bg-accent aria-pressed:text-foreground"
                >
                  Yes, I need a screener
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="no"
                  variant="outline"
                  className="h-auto rounded-md border bg-card px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-accent aria-pressed:border-foreground aria-pressed:bg-accent aria-pressed:text-foreground"
                >
                  No, job title is enough
                </ToggleGroupItem>
              </ToggleGroup>
            ) : null}
            {isPaid || screenerChoice === "yes" ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  rows={4}
                  placeholder="Screener questions will appear here. Edit freely."
                  value={screener}
                  onChange={(e) => setScreener(e.target.value)}
                />
                <GenerateScreenerButton
                  projectName={state.projectName}
                  criteria={criteria}
                  isPaid={isPaid}
                  onResult={setScreener}
                />
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function GenerateScreenerButton({
  projectName,
  criteria,
  isPaid,
  onResult,
}: {
  projectName: string | undefined;
  criteria: string;
  isPaid: boolean;
  onResult: (text: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!criteria.trim()) {
      toast.error("Add participant criteria first.");
      return;
    }
    setBusy(true);
    try {
      const prompt = `Write a short research screener, 4-6 questions to qualify participants before a UX study session. Mix of multiple choice and short answer. No em dashes, no corporate language.

What needs to be verified: ${criteria}
${projectName ? "Study: " + projectName : ""}

Format each question as:
Q: [question text]
Type: [Multiple choice / Short answer]
[Options if multiple choice]
[Pass / fail criteria in brackets]

Return JSON: {"result":"screener questions as plain text"}`;
      const data = await callAgentJSON<{ result?: string }>(prompt, { max_tokens: 600 });
      if (data.result) {
        onResult(data.result);
        toast.success(
          isPaid
            ? "Share with Shikha for sign-off before sending"
            : "Review before sending",
        );
      } else {
        toast.error("No screener returned");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Generate failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={run}
      disabled={busy}
      className="w-fit gap-1.5"
    >
      <Sparkles className="size-3.5" />
      {busy ? "Generating…" : "Generate screener"}
    </Button>
  );
}

function SessionInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-input bg-card px-1.5 py-1">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-5 w-10 border-0 bg-transparent px-1 text-[12px] shadow-none focus-visible:ring-0"
      />
    </span>
  );
}

