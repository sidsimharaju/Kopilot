"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PRIORITIES } from "@/lib/constants";
import type { Objective, ObjectivePriority, Project, ProjectState } from "@/lib/types";

type Props = {
  state: ProjectState;
  pid: number | undefined;
  oid: number | undefined;
  update: (mut: (s: ProjectState) => ProjectState) => void;
  updateProject: (mut: (p: Project) => Project) => void;
};

const GRID_COLS =
  "grid grid-cols-[110px_minmax(200px,1fr)_minmax(220px,1.1fr)_minmax(260px,1.2fr)_minmax(200px,1fr)_minmax(200px,1fr)_44px] gap-2";

const HEADER_LABELS = [
  "Priority",
  "Objective",
  "Hypothesis",
  "Key questions",
  "Target participants",
  "Goal targets",
  "",
];

function nextNumberedLine(value: string): { insert: string; nextStart: number } {
  const trimmed = value.trimEnd();
  const lastLine = trimmed.split("\n").pop() ?? "";
  const match = lastLine.match(/^(\d+)\.\s/);
  const next = match ? parseInt(match[1], 10) + 1 : 1;
  const insert = `\n${next}. `;
  return { insert, nextStart: insert.length };
}

export function ObjectivesTable({ state, oid, update, updateProject }: Props) {
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const objectives = state.objectives ?? [];

  function addObjective() {
    const newId = oid ?? 1;
    update((s) => {
      const list: Objective[] = [
        ...(s.objectives ?? []),
        { id: newId, priority: "Must" as ObjectivePriority },
      ];
      return { ...s, objectives: list };
    });
    updateProject((p) => ({ ...p, oid: newId + 1 }));
  }

  function setField(id: number, field: keyof Objective, value: string) {
    update((s) => ({
      ...s,
      objectives: (s.objectives ?? []).map((o) =>
        o.id === id ? { ...o, [field]: value } : o,
      ),
    }));
  }

  function remove(id: number) {
    update((s) => ({
      ...s,
      objectives: (s.objectives ?? []).filter((o) => o.id !== id),
    }));
    setPendingDelete(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning objectives</CardTitle>
        <CardDescription>
          Fill each column to match the research plan template.
        </CardDescription>
        <CardAction>
          <Button size="sm" variant="outline" onClick={addObjective} className="gap-1.5">
            <Plus className="size-3.5" /> Add objective
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {objectives.length === 0 ? (
          <div className="rounded border border-dashed border-border bg-background px-4 py-8 text-center text-[13px] text-muted-foreground">
            No objectives yet. Click <span className="font-medium">Add objective</span>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[1280px]">
              <div
                className={`${GRID_COLS} border-b border-border px-1 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground`}
              >
                {HEADER_LABELS.map((label, i) => (
                  <div key={i}>{label}</div>
                ))}
              </div>

              {objectives.map((o) => (
                <div
                  key={o.id}
                  className={`${GRID_COLS} items-stretch border-b border-border px-1 py-3`}
                >
                  <div className="flex">
                    <Select
                      value={o.priority ?? "Must"}
                      onValueChange={(v) => {
                        if (v) setField(o.id!, "priority", v);
                      }}
                    >
                      <SelectTrigger size="sm" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Textarea
                    rows={4}
                    placeholder="What do you want to learn?"
                    value={o.objective ?? ""}
                    onChange={(e) => setField(o.id!, "objective", e.target.value)}
                    className="h-full min-h-24 resize-none [field-sizing:content]"
                  />

                  <Textarea
                    rows={4}
                    placeholder="Your best assumption"
                    value={o.hypothesis ?? ""}
                    onChange={(e) => setField(o.id!, "hypothesis", e.target.value)}
                    className="h-full min-h-24 resize-none [field-sizing:content]"
                  />

                  <Textarea
                    rows={4}
                    placeholder="1. one per line&#10;2. press Enter for the next"
                    value={o.keyQuestions ?? ""}
                    onChange={(e) => setField(o.id!, "keyQuestions", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        const ta = e.currentTarget;
                        const start = ta.selectionStart ?? 0;
                        const before = ta.value.slice(0, start);
                        const after = ta.value.slice(ta.selectionEnd ?? start);
                        if (!before.trim()) return;
                        e.preventDefault();
                        const { insert } = nextNumberedLine(before);
                        const next = before + insert + after;
                        setField(o.id!, "keyQuestions", next);
                        requestAnimationFrame(() => {
                          ta.selectionStart = ta.selectionEnd = start + insert.length;
                        });
                      }
                    }}
                    className="h-full min-h-24 resize-none [field-sizing:content]"
                  />

                  <Textarea
                    rows={4}
                    placeholder="Who would be ideal?"
                    value={o.participants ?? ""}
                    onChange={(e) => setField(o.id!, "participants", e.target.value)}
                    className="h-full min-h-24 resize-none [field-sizing:content]"
                  />

                  <Textarea
                    rows={4}
                    placeholder="e.g. 3 of 5 rate 4+"
                    value={o.goalTargets ?? ""}
                    onChange={(e) => setField(o.id!, "goalTargets", e.target.value)}
                    className="h-full min-h-24 resize-none [field-sizing:content]"
                  />

                  <div className="flex items-start justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setPendingDelete(o.id!)}
                      aria-label="Delete objective"
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this objective?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (pendingDelete !== null) remove(pendingDelete);
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
