"use client";

import { useRef, useState } from "react";
import { ChevronRight, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_TONE, initials } from "@/lib/participant";
import type { Participant, ProjectState } from "@/lib/types";

const ACCEPTED = ".txt,.docx,.vtt,.srt,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/vtt";

function stripCaptionMarkup(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/^WEBVTT.*$/im, "")
    .replace(/^\d+\s*$/gm, "")
    .replace(/^\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?\s*-->\s*\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?.*$/gm, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function readUpload(file: File): Promise<string> {
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  const isDocx = ext === "docx";
  const res = await fetch(
    `/api/parse-doc?filename=${encodeURIComponent(file.name)}`,
    { method: "POST", body: await file.arrayBuffer() },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { text?: string };
  const raw = data.text ?? "";
  if (isDocx) return raw.trim();
  return stripCaptionMarkup(raw);
}

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
          Paste or upload a transcript for each completed session. We accept .txt,
          .docx, .vtt, and .srt files. Analysis uses everything marked
          &ldquo;completed&rdquo; with text.
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
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const hasTranscript = Boolean((participant.transcript || "").trim());
  const status = participant.status ?? "identified";

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    const ext = file.name.toLowerCase().split(".").pop() ?? "";
    if (!["txt", "docx", "vtt", "srt"].includes(ext)) {
      toast.error("Unsupported file type. Use .txt, .docx, .vtt, or .srt.");
      return;
    }
    setUploading(true);
    try {
      const text = await readUpload(file);
      if (!text.trim()) {
        toast.error("File was empty after parsing.");
        return;
      }
      const existing = (participant.transcript || "").trim();
      const next = existing
        ? `${existing}\n\n${text}`.trim()
        : text;
      onSetTranscript(next);
      toast.success(`Loaded ${text.length.toLocaleString()} characters from ${file.name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Upload failed: ${msg}`);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

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
        <div className="flex flex-col gap-2 border-t border-border p-3">
          <Textarea
            rows={8}
            placeholder="Paste the transcript here, or upload a .txt / .docx / .vtt / .srt file. The analysis uses the first ~5,000 characters."
            value={participant.transcript ?? ""}
            onChange={(e) => onSetTranscript(e.target.value)}
          />
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="gap-1.5"
            >
              <Upload className="size-3.5" />
              {uploading ? "Uploading…" : hasTranscript ? "Append from file" : "Upload file"}
            </Button>
            {hasTranscript ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onSetTranscript("")}
                disabled={uploading}
                className="text-muted-foreground"
              >
                Clear
              </Button>
            ) : null}
            <span className="text-[11px] text-muted-foreground">
              .txt · .docx · .vtt · .srt
            </span>
            {status !== "completed" && hasTranscript ? (
              <button
                type="button"
                className="ml-auto text-[11.5px] font-medium text-primary hover:underline"
                onClick={onMarkCompleted}
              >
                Mark as completed
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
