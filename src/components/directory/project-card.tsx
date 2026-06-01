"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  draft: "bg-muted text-muted-foreground",
  planning: "bg-chart-3/15 text-chart-3",
  progress: "bg-chart-4/20 text-chart-4",
  done: "bg-chart-2/15 text-chart-2",
  analysis: "bg-chart-3/15 text-chart-3",
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

  const handle = project.slug || project.id;

  function open() {
    router.push(`/projects/${handle}/setup`);
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      console.log("[delete] sending DELETE for project", project.id);
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
        cache: "no-store",
      });
      console.log("[delete] response", res.status);
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${body ? ` — ${body}` : ""}`);
      }
      toast.success("Project deleted");
      setConfirmOpen(false);
      window.location.assign("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Delete failed: ${message}`);
      setDeleting(false);
    }
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        }}
        className="group flex w-full cursor-pointer flex-col gap-3 rounded-xl bg-card p-5 text-left shadow-sm ring-1 ring-foreground/10 transition-all hover:shadow-md hover:ring-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="truncate text-[15px] font-semibold tracking-tight">{name}</div>
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              aria-label="Project options"
              className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
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
          <div className="line-clamp-2 text-[13px] text-muted-foreground">{purpose}</div>
        ) : null}
        <div className="flex flex-col gap-2">
          {method ? (
            <span className="w-fit rounded-full bg-chart-3/15 px-2 py-0.5 text-[11px] font-medium text-chart-3">
              {method}
            </span>
          ) : null}
          {designers.length + researchers.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {[...designers, ...researchers].map((n) => (
                <span
                  key={n}
                  className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground"
                >
                  {n}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="mt-auto flex items-center justify-between pt-3 text-[12px] text-muted-foreground">
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
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!deleting) setConfirmOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{name}&rdquo;?</DialogTitle>
            <DialogDescription>
              The project will be removed from the directory. Participants you added
              will remain visible on the Customers tab.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
