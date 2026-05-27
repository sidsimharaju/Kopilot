"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { EditParticipantSheet } from "./edit-participant-sheet";

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
  const [editingId, setEditingId] = useState<number | null>(null);
  const participants = (state.participants ?? []).filter((p) => p.cohort === cohort);
  const editing = participants.find((p) => p.id === editingId) ?? null;

  function addParticipant(data: Omit<Participant, "id">) {
    const newId = pid ?? 1;
    update((s) => ({
      ...s,
      participants: [...(s.participants ?? []), { ...data, id: newId }],
    }));
    updateProject((p) => ({ ...p, pid: newId + 1 }));
    setShowAdd(false);
  }

  function updateParticipant(id: number, data: Omit<Participant, "id">) {
    update((s) => ({
      ...s,
      participants: (s.participants ?? []).map((p) =>
        p.id === id ? { ...p, ...data, id } : p,
      ),
    }));
  }

  function removeParticipant(id: number) {
    update((s) => ({
      ...s,
      participants: (s.participants ?? []).filter((p) => p.id !== id),
    }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", COHORT_PILL[cohort])}>
            {COHORT_TITLE[cohort]}
          </span>
          <span className="text-[11px] font-normal text-muted-foreground">
            {participants.length} added
          </span>
        </CardTitle>
        <CardDescription>{COHORT_HELP[cohort]}</CardDescription>
        {!showAdd ? (
          <CardAction>
            <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
              <Plus className="size-3.5" /> Add person
            </Button>
          </CardAction>
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
          <div className="rounded border border-dashed border-border bg-background px-4 py-6 text-center text-[12.5px] text-muted-foreground">
            No one added yet.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {participants.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setEditingId(p.id!)}
                className="group flex items-center gap-3 rounded-md border border-border bg-background px-2.5 py-2 text-left transition-colors hover:border-foreground/30 hover:bg-accent"
              >
                <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-[10.5px] font-semibold text-muted-foreground">
                  {initials(p.name)}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13px] font-medium">{p.name}</span>
                  <span className="truncate text-[11.5px] text-muted-foreground">
                    {[p.role, p.company].filter(Boolean).join(" · ")}
                  </span>
                </div>
                <span className="hidden text-[11px] text-muted-foreground sm:inline">
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
                <Pencil className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeParticipant(p.id!);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      removeParticipant(p.id!);
                    }
                  }}
                  className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Remove participant"
                >
                  <Trash2 className="size-3.5" />
                </span>
              </button>
            ))}
          </div>
        )}
      </CardContent>
      {editing ? (
        <EditParticipantSheet
          participant={editing}
          cohort={cohort}
          withCSM={cohort === "customer" && Boolean(editing.hasCSM)}
          open={editingId !== null}
          onOpenChange={(open) => {
            if (!open) setEditingId(null);
          }}
          onSave={(data) => updateParticipant(editing.id!, data)}
        />
      ) : null}
    </Card>
  );
}
