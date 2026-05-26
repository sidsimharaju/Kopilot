"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { fmtRelative } from "@/lib/format";
import { deriveStatus, methodologyLabel } from "@/lib/project-status";
import type { Project } from "@/lib/types";

const STATUS_CLS: Record<string, string> = {
  draft: "bg-border-soft text-text-3",
  planning: "bg-brand-soft text-primary",
  progress: "bg-amber-100 text-amber-800",
  done: "bg-emerald-100 text-emerald-700",
  analysis: "bg-violet-100 text-violet-700",
};

export function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const state = project.S ?? {};
  const name = state.projectName || "Untitled project";
  const purpose = (state.purpose || "").trim();
  const designers = state.designer ?? [];
  const researchers = state.researcher ?? [];
  const status = deriveStatus(state);
  const method = methodologyLabel(state.methodology);

  function open() {
    router.push(`/projects/${project.id}/setup`);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Project deleted");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Delete failed: ${message}`);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="group flex w-full flex-col gap-2 rounded-md border border-border bg-card p-4 text-left transition-colors hover:border-text-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="truncate text-[14px] font-medium tracking-tight">{name}</div>
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              aria-label="Project options"
              className="inline-flex size-6 items-center justify-center rounded text-text-3 hover:bg-accent hover:text-foreground"
            >
              <MoreVertical className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setConfirmOpen(true);
                }}
                variant="destructive"
              >
                Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {purpose ? (
          <div className="line-clamp-2 text-[12.5px] text-text-2">{purpose}</div>
        ) : null}
        {method ? (
          <div>
            <span className="rounded-[3px] border border-border-soft bg-background px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-text-2">
              {method}
            </span>
          </div>
        ) : null}
        {designers.length + researchers.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {designers.map((n) => (
              <span
                key={`d-${n}`}
                className="rounded-full bg-brand-soft px-2 py-0.5 text-[10.5px] font-medium text-primary"
              >
                {n}
              </span>
            ))}
            {researchers.map((n) => (
              <span
                key={`r-${n}`}
                className="rounded-full bg-violet-100 px-2 py-0.5 text-[10.5px] font-medium text-violet-700"
              >
                {n}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-1 flex items-center justify-between border-t border-border-soft pt-2 text-[11px] text-text-3">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10.5px] font-medium",
              STATUS_CLS[status.cls],
            )}
          >
            {status.label}
          </span>
          <span>Updated {fmtRelative(project.updatedAt)}</span>
        </div>
      </button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
