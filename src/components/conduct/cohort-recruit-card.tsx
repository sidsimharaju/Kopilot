"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AUDIENCE_LABELS,
  COHORT_PILL,
  STATUS_LABEL,
  STATUS_TONE,
  initials,
} from "@/lib/participant";
import { cn } from "@/lib/utils";
import type { Participant, ParticipantCohort, ProjectState } from "@/lib/types";
import { AddParticipantForm } from "./add-participant-form";

type Props = {
  cohort: ParticipantCohort;
  state: ProjectState;
  pid: number | undefined;
  update: (mut: (s: ProjectState) => ProjectState) => void;
  updateProject: (mut: (p: { pid?: number } & Record<string, unknown>) => { pid?: number } & Record<string, unknown>) => void;
};

const COHORT_TITLE: Record<ParticipantCohort, string> = {
  internal: "Internal Kongers",
  customer: "Kong customers",
  noncustomer: "Non-Kong customers",
};

const COHORT_HELP: Record<ParticipantCohort, string> = {
  internal: "Reach out first. Good for practising your script and catching early issues before going external.",
  customer: "Reach out in parallel with internals. Enterprise customers take longer so start early.",
  noncustomer: "Sourced through Respondent. Work with Shikha on the screener. Log confirmed participants here.",
};

export function CohortRecruitCard({ cohort, state, pid, update, updateProject }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const participants = (state.participants ?? []).filter((p) => p.cohort === cohort);

  function addParticipant(data: Omit<Participant, "id">) {
    const newId = pid ?? 1;
    update((s) => ({
      ...s,
      participants: [...(s.participants ?? []), { ...data, id: newId }],
    }));
    updateProject((p) => ({ ...p, pid: newId + 1 }));
    setShowAdd(false);
  }

  function removeParticipant(id: number) {
    update((s) => ({
      ...s,
      participants: (s.participants ?? []).filter((p) => p.id !== id),
    }));
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", COHORT_PILL[cohort])}>
              {COHORT_TITLE[cohort]}
            </span>
            <span className="text-[11px] font-normal text-text-3">
              {participants.length} added
            </span>
          </CardTitle>
          <p className="text-[12px] text-text-3">{COHORT_HELP[cohort]}</p>
        </div>
        {!showAdd ? (
          <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
            <Plus className="size-3.5" /> Add person
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {showAdd ? (
          <AddParticipantForm
            cohort={cohort}
            withCSM={cohort === "customer"}
            onAdd={addParticipant}
            onCancel={() => setShowAdd(false)}
          />
        ) : null}

        {participants.length === 0 ? (
          <div className="rounded border border-dashed border-border bg-background px-4 py-6 text-center text-[12.5px] text-text-3">
            No one added yet.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded border border-border-soft bg-background px-2.5 py-2"
              >
                <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-border-soft text-[10.5px] font-semibold text-text-2">
                  {initials(p.name)}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13px] font-medium">{p.name}</span>
                  <span className="truncate text-[11.5px] text-text-3">
                    {[p.role, p.company].filter(Boolean).join(" · ")}
                  </span>
                </div>
                <span className="hidden text-[11px] text-text-3 sm:inline">
                  {AUDIENCE_LABELS[p.audience ?? ""] ?? ""}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                    STATUS_TONE[p.status ?? "identified"],
                  )}
                >
                  {STATUS_LABEL[p.status ?? "identified"]}
                </span>
                <button
                  type="button"
                  onClick={() => removeParticipant(p.id!)}
                  className="inline-flex size-6 items-center justify-center rounded text-text-3 hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Remove participant"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
