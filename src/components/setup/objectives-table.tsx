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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Learning objectives</CardTitle>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Fill each column to match the research plan template.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={addObjective} className="gap-1.5">
          <Plus className="size-3.5" /> Add objective
        </Button>
      </CardHeader>
      <CardContent>
        {objectives.length === 0 ? (
          <div className="rounded border border-dashed border-border bg-background px-4 py-8 text-center text-[13px] text-muted-foreground">
            No objectives yet. Click <span className="font-medium">Add objective</span>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-[12.5px]">
              <thead>
                <tr className="text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="w-[100px] p-2">Priority</th>
                  <th className="p-2">Objective</th>
                  <th className="p-2">Hypothesis</th>
                  <th className="p-2">Key questions</th>
                  <th className="p-2">Target participants</th>
                  <th className="p-2">Methodology</th>
                  <th className="p-2">Goal targets</th>
                  <th className="w-[40px] p-2"></th>
                </tr>
              </thead>
              <tbody>
                {objectives.map((o) => (
                  <tr key={o.id} className="align-top">
                    <td className="p-1">
                      <Select
                        value={o.priority ?? "Must"}
                        onValueChange={(v) => {
                          if (v) setField(o.id!, "priority", v);
                        }}
                      >
                        <SelectTrigger size="sm" className="w-full text-[12px]">
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
                    </td>
                    <td className="p-1">
                      <Textarea
                        rows={2}
                        placeholder="What do you want to learn?"
                        value={o.objective ?? ""}
                        onChange={(e) =>
                          setField(o.id!, "objective", e.target.value)
                        }
                      />
                    </td>
                    <td className="p-1">
                      <Textarea
                        rows={2}
                        placeholder="Your best assumption"
                        value={o.hypothesis ?? ""}
                        onChange={(e) =>
                          setField(o.id!, "hypothesis", e.target.value)
                        }
                      />
                    </td>
                    <td className="p-1">
                      <Textarea
                        rows={2}
                        placeholder="One per line"
                        value={o.keyQuestions ?? ""}
                        onChange={(e) =>
                          setField(o.id!, "keyQuestions", e.target.value)
                        }
                      />
                    </td>
                    <td className="p-1">
                      <Textarea
                        rows={2}
                        placeholder="Who would be ideal?"
                        value={o.participants ?? ""}
                        onChange={(e) =>
                          setField(o.id!, "participants", e.target.value)
                        }
                      />
                    </td>
                    <td className="p-1">
                      <Textarea
                        rows={2}
                        placeholder="Method + format"
                        value={o.methodology ?? ""}
                        onChange={(e) =>
                          setField(o.id!, "methodology", e.target.value)
                        }
                      />
                    </td>
                    <td className="p-1">
                      <Textarea
                        rows={2}
                        placeholder="e.g. 3 of 5 rate 4+"
                        value={o.goalTargets ?? ""}
                        onChange={(e) =>
                          setField(o.id!, "goalTargets", e.target.value)
                        }
                      />
                    </td>
                    <td className="p-1 text-center">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
