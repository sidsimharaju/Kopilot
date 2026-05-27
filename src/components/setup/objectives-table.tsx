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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Priority</TableHead>
                  <TableHead>Objective</TableHead>
                  <TableHead>Hypothesis</TableHead>
                  <TableHead className="min-w-[280px]">Key questions</TableHead>
                  <TableHead>Target participants</TableHead>
                  <TableHead>Methodology</TableHead>
                  <TableHead>Goal targets</TableHead>
                  <TableHead className="w-[44px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {objectives.map((o) => (
                  <TableRow key={o.id} className="align-top">
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <Textarea
                        rows={4}
                        placeholder="What do you want to learn?"
                        value={o.objective ?? ""}
                        onChange={(e) =>
                          setField(o.id!, "objective", e.target.value)
                        }
                        className="min-h-20 [field-sizing:content]"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        rows={4}
                        placeholder="Your best assumption"
                        value={o.hypothesis ?? ""}
                        onChange={(e) =>
                          setField(o.id!, "hypothesis", e.target.value)
                        }
                        className="min-h-20 [field-sizing:content]"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        rows={4}
                        placeholder="- one per line&#10;- start each with -"
                        value={o.keyQuestions ?? ""}
                        onChange={(e) =>
                          setField(o.id!, "keyQuestions", e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            const ta = e.currentTarget;
                            const start = ta.selectionStart ?? 0;
                            const before = ta.value.slice(0, start);
                            const after = ta.value.slice(ta.selectionEnd ?? start);
                            const insert = "\n- ";
                            e.preventDefault();
                            const next = before + insert + after;
                            setField(o.id!, "keyQuestions", next);
                            requestAnimationFrame(() => {
                              ta.selectionStart = ta.selectionEnd = start + insert.length;
                            });
                          }
                        }}
                        className="min-h-20 [field-sizing:content]"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        rows={4}
                        placeholder="Who would be ideal?"
                        value={o.participants ?? ""}
                        onChange={(e) =>
                          setField(o.id!, "participants", e.target.value)
                        }
                        className="min-h-20 [field-sizing:content]"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        rows={4}
                        placeholder="Method + format"
                        value={o.methodology ?? ""}
                        onChange={(e) =>
                          setField(o.id!, "methodology", e.target.value)
                        }
                        className="min-h-20 [field-sizing:content]"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        rows={4}
                        placeholder="e.g. 3 of 5 rate 4+"
                        value={o.goalTargets ?? ""}
                        onChange={(e) =>
                          setField(o.id!, "goalTargets", e.target.value)
                        }
                        className="min-h-20 [field-sizing:content]"
                      />
                    </TableCell>
                    <TableCell className="text-center">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
