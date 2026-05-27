"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_TONE, initials } from "@/lib/participant";
import type { Participant, ProjectState } from "@/lib/types";

type Props = {
  state: ProjectState;
  update: (mut: (s: ProjectState) => ProjectState) => void;
};

export function TranscriptsPanel({ state, update }: Props) {
  const participants = state.participants ?? [];
  const completed = participants.filter((p) => p.status === "completed");

  function setTranscript(id: number, value: string) {
    update((s) => ({
      ...s,
      participants: (s.participants ?? []).map((p) =>
        p.id === id ? { ...p, transcript: value } : p,
      ),
    }));
  }

  function markCompleted(id: number) {
    update((s) => ({
      ...s,
      participants: (s.participants ?? []).map((p) =>
        p.id === id ? { ...p, status: "completed" as const } : p,
      ),
    }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transcripts</CardTitle>
        <p className="text-[12px] text-muted-foreground">
          Paste a transcript for each completed session. Analysis uses everything
          marked &ldquo;completed&rdquo; with text.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {participants.length === 0 ? (
          <div className="rounded border border-dashed border-border bg-background px-4 py-6 text-center text-[12.5px] text-muted-foreground">
            No participants yet. Add some in the Conduct tab.
          </div>
        ) : (
          participants.map((p) => (
            <TranscriptRow
              key={p.id}
              participant={p}
              completedCount={completed.length}
              onSetTranscript={(v) => setTranscript(p.id!, v)}
              onMarkCompleted={() => markCompleted(p.id!)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function TranscriptRow({
  participant,
  onSetTranscript,
  onMarkCompleted,
}: {
  participant: Participant;
  completedCount: number;
  onSetTranscript: (v: string) => void;
  onMarkCompleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasTranscript = Boolean((participant.transcript || "").trim());
  const status = participant.status ?? "identified";

  return (
    <div className="rounded border border-border bg-background">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-3 py-2 text-left"
      >
        <ChevronRight
          className={cn(
            "size-3.5 flex-shrink-0 text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
        />
        <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-[10.5px] font-semibold text-muted-foreground">
          {initials(participant.name)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13px] font-medium">{participant.name}</span>
          <span className="truncate text-[11px] text-muted-foreground">
            {[participant.role, participant.company].filter(Boolean).join(" · ")}
          </span>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10.5px] font-medium",
            STATUS_TONE[status],
          )}
        >
          {STATUS_LABEL[status]}
        </span>
        <span className="text-[10.5px] tabular-nums text-muted-foreground">
          {hasTranscript ? `${(participant.transcript ?? "").length.toLocaleString()} chars` : "no transcript"}
        </span>
      </button>
      {open ? (
        <div className="border-t border-border p-3 flex flex-col gap-2">
          <Textarea
            rows={8}
            placeholder="Paste the transcript here. The analysis will use the first ~5,000 characters."
            value={participant.transcript ?? ""}
            onChange={(e) => onSetTranscript(e.target.value)}
          />
          {status !== "completed" && hasTranscript ? (
            <button
              type="button"
              className="self-start text-[11.5px] font-medium text-primary hover:underline"
              onClick={onMarkCompleted}
            >
              Mark as completed
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
