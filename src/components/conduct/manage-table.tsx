"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COHORT_LABEL_SHORT,
  COHORT_PILL,
  STATUS_LABEL,
  STATUS_TONE,
  STATUS_VALUES,
  initials,
} from "@/lib/participant";
import { cn } from "@/lib/utils";
import type {
  Participant,
  ParticipantStatus,
  ProjectState,
} from "@/lib/types";

type Props = {
  state: ProjectState;
  update: (mut: (s: ProjectState) => ProjectState) => void;
};

export function ManageTable({ state, update }: Props) {
  const participants = state.participants ?? [];

  const metrics = {
    total: participants.length,
    completed: participants.filter((p) => p.status === "completed").length,
    scheduled: participants.filter((p) => p.status === "scheduled").length,
    pending: participants.filter(
      (p) => !p.status || p.status === "identified" || p.status === "contacted",
    ).length,
  };

  function setField(id: number, field: keyof Participant, value: unknown) {
    update((s) => ({
      ...s,
      participants: (s.participants ?? []).map((p) =>
        p.id === id ? { ...p, [field]: value } : p,
      ),
    }));
  }

  function remove(id: number) {
    update((s) => ({
      ...s,
      participants: (s.participants ?? []).filter((p) => p.id !== id),
    }));
  }

  return (
    <Card>
      <CardHeader>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Total" value={metrics.total} />
          <Metric label="Completed" value={metrics.completed} tone="success" />
          <Metric label="Scheduled" value={metrics.scheduled} />
          <Metric label="Needs action" value={metrics.pending} tone="warning" />
        </div>
        <CardTitle className="mt-4">Session participants</CardTitle>
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <div className="rounded border border-dashed border-border bg-background px-4 py-8 text-center text-[13px] text-muted-foreground">
            No participants yet. Add people in the Conduct tab.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-[12.5px]">
              <thead>
                <tr className="text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="p-2">Name</th>
                  <th className="p-2">Role / Type</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Session link</th>
                  <th className="p-2">Password</th>
                  <th className="p-2">Doc link</th>
                  <th className="w-[40px] p-2"></th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id} className="border-t border-border align-top">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-[10.5px] font-semibold text-muted-foreground">
                          {initials(p.name)}
                        </span>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-[12.5px] font-medium">
                            {p.name}
                          </span>
                          <span className="truncate text-[11px] text-muted-foreground">
                            {p.company}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex flex-col gap-1">
                        <span className="truncate text-[12px]">{p.role || "—"}</span>
                        <span
                          className={cn(
                            "w-fit rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                            COHORT_PILL[p.cohort ?? "internal"],
                          )}
                        >
                          {COHORT_LABEL_SHORT[p.cohort ?? "internal"]}
                        </span>
                      </div>
                    </td>
                    <td className="p-2">
                      <Select
                        value={p.status ?? "identified"}
                        onValueChange={(v) => {
                          if (v) setField(p.id!, "status", v as ParticipantStatus);
                        }}
                      >
                        <SelectTrigger
                          size="sm"
                          className={cn(
                            "h-6 rounded-full border-0 px-2 py-0.5 text-[10.5px] font-medium shadow-none focus-visible:ring-0",
                            STATUS_TONE[p.status ?? "identified"],
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_VALUES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Input
                        value={p.sessionLink ?? ""}
                        onChange={(e) =>
                          setField(p.id!, "sessionLink", e.target.value)
                        }
                        placeholder="zoom.us/…"
                        className="h-7 text-[12px]"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={p.sessionPassword ?? ""}
                        onChange={(e) =>
                          setField(p.id!, "sessionPassword", e.target.value)
                        }
                        placeholder="—"
                        className="h-7 text-[12px]"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={p.sessionDoc ?? ""}
                        onChange={(e) =>
                          setField(p.id!, "sessionDoc", e.target.value)
                        }
                        placeholder="docs.google.com/…"
                        className="h-7 text-[12px]"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => remove(p.id!)}
                        aria-label="Remove participant"
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "warning";
}) {
  const cls =
    tone === "success" || tone === "warning"
      ? "text-foreground"
      : "text-foreground";
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2.5">
      <div className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      <div className={cn("text-[22px] font-semibold tabular-nums", cls)}>{value}</div>
    </div>
  );
}
