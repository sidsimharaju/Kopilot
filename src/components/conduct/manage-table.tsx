"use client";

import { useRef, useState } from "react";
import { Eye, Loader2, Paperclip, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EditParticipantSheet } from "./edit-participant-sheet";
import { MessagesPanel } from "./messages-panel";
import {
  COHORT_LABEL_SHORT,
  COHORT_PILL,
  STATUS_LABEL,
  STATUS_TONE,
  STATUS_VALUES,
  initials,
} from "@/lib/participant";
import {
  TRANSCRIPT_ACCEPT,
  isSupportedTranscriptFile,
  readTranscriptUpload,
} from "@/lib/transcript";
import { cn } from "@/lib/utils";
import type {
  Participant,
  ParticipantCohort,
  ParticipantStatus,
  ProjectState,
} from "@/lib/types";

type Props = {
  state: ProjectState;
  update: (mut: (s: ProjectState) => ProjectState) => void;
};

export function ManageTable({ state, update }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const participants = state.participants ?? [];
  const editing = participants.find((p) => p.id === editingId) ?? null;
  const confirming = participants.find((p) => p.id === confirmId) ?? null;
  const previewing = participants.find((p) => p.id === previewId) ?? null;

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

  function saveEdit(id: number, data: Omit<Participant, "id">) {
    update((s) => ({
      ...s,
      participants: (s.participants ?? []).map((p) =>
        p.id === id ? { ...p, ...data, id } : p,
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
          <Metric label="Completed" value={metrics.completed} />
          <Metric label="Scheduled" value={metrics.scheduled} />
          <Metric label="Needs action" value={metrics.pending} />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <CardTitle>Session participants</CardTitle>
          <MessagesPanel state={state} update={update} />
        </div>
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <div className="rounded border border-dashed border-border bg-background px-4 py-8 text-center text-[13px] text-muted-foreground">
            No participants yet. Add people in the Conduct tab.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] border-collapse text-[12.5px]">
              <thead>
                <tr className="text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="p-2">Name</th>
                  <th className="p-2">Role / Type</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Session link</th>
                  <th className="p-2">Password</th>
                  <th className="p-2">Doc link</th>
                  <th className="p-2">Transcript</th>
                  <th className="w-[40px] p-2"></th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id} className="border-t border-border align-top">
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(p.id!)}
                        className="group flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-accent"
                      >
                        <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-[10.5px] font-semibold text-muted-foreground">
                          {initials(p.name)}
                        </span>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-[12.5px] font-medium group-hover:underline">
                            {p.name}
                          </span>
                          <span className="truncate text-[11px] text-muted-foreground">
                            {p.company}
                          </span>
                        </div>
                      </button>
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(p.id!)}
                        className="flex w-full flex-col items-start gap-1 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-accent"
                      >
                        <span className="truncate text-[12px]">{p.role || "—"}</span>
                        <span
                          className={cn(
                            "w-fit rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                            COHORT_PILL[p.cohort ?? "internal"],
                          )}
                        >
                          {COHORT_LABEL_SHORT[p.cohort ?? "internal"]}
                        </span>
                        {p.cohort === "customer" && p.hasCSM && p.csmName ? (
                          <span className="w-fit rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            via CSM {p.csmName}
                          </span>
                        ) : null}
                      </button>
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
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                                  STATUS_TONE[s],
                                )}
                              >
                                {STATUS_LABEL[s]}
                              </span>
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
                    <td className="p-2">
                      <TranscriptCell
                        participant={p}
                        onSet={(v) => setField(p.id!, "transcript", v)}
                        onPreview={() => setPreviewId(p.id!)}
                      />
                    </td>
                    <td className="p-2 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setConfirmId(p.id!)}
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

      {editing ? (
        <EditParticipantSheet
          participant={editing}
          cohort={(editing.cohort ?? "internal") as ParticipantCohort}
          open={editingId !== null}
          onOpenChange={(open) => {
            if (!open) setEditingId(null);
          }}
          onSave={(data) => saveEdit(editing.id!, data)}
        />
      ) : null}

      <Sheet
        open={previewId !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewId(null);
        }}
      >
        <SheetContent className="flex w-full flex-col gap-4 sm:max-w-[640px]">
          <SheetHeader>
            <SheetTitle>{previewing?.name || "Transcript"}</SheetTitle>
            <SheetDescription>
              {[previewing?.role, previewing?.company].filter(Boolean).join(" · ") ||
                "Transcript preview"}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="min-h-0 flex-1 px-4 pb-4">
            <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-foreground">
              {(previewing?.transcript || "").trim() || "No transcript attached."}
            </pre>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={confirmId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove participant?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirming?.name ? (
                <>This removes <strong>{confirming.name}</strong> and any attached
                transcript from this study. This can&apos;t be undone.</>
              ) : (
                "This removes the participant from this study. This can't be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (confirmId !== null) remove(confirmId);
                setConfirmId(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function TranscriptCell({
  participant,
  onSet,
  onPreview,
}: {
  participant: Participant;
  onSet: (value: string) => void;
  onPreview: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const hasTranscript = Boolean((participant.transcript || "").trim());
  const chars = (participant.transcript ?? "").length;

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    if (!isSupportedTranscriptFile(file.name)) {
      toast.error("Unsupported file type. Use .txt, .docx, .vtt, or .srt.");
      return;
    }
    setUploading(true);
    try {
      const text = await readTranscriptUpload(file);
      if (!text.trim()) {
        toast.error("File was empty after parsing.");
        return;
      }
      onSet(text);
      toast.success(
        `Loaded ${text.length.toLocaleString()} characters from ${file.name}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Upload failed: ${msg}`);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={fileInput}
        type="file"
        accept={TRANSCRIPT_ACCEPT}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInput.current?.click()}
        disabled={uploading}
        className="h-7 gap-1.5 text-[11.5px]"
      >
        {uploading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Paperclip className="size-3.5" />
        )}
        {uploading
          ? "Uploading…"
          : hasTranscript
            ? `${chars.toLocaleString()} chars`
            : "Attach"}
      </Button>
      {hasTranscript ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onPreview}
          aria-label="Preview transcript"
          className="text-muted-foreground"
        >
          <Eye className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2.5">
      <div className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      <div className="text-[22px] font-semibold tabular-nums">{value}</div>
    </div>
  );
}
