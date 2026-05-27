"use client";

import { useMemo, useState } from "react";
import { Copy, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { COHORT_LABEL } from "@/lib/constants";
import type { Project, ProjectState } from "@/lib/types";

function fmt(value: string | undefined): string {
  return (value ?? "").trim() || "—";
}

function buildPlainText(project: Project): string {
  const s = project.S ?? ({} as ProjectState);
  const lines: string[] = [];
  lines.push(`# ${fmt(s.projectName) || "Untitled research"}`);
  if (s.date) lines.push(`Start date: ${s.date}`);
  if (s.area) lines.push(`Area: ${s.area}`);
  if ((s.designer ?? []).length > 0) lines.push(`Designer: ${(s.designer ?? []).join(", ")}`);
  if ((s.researcher ?? []).length > 0) lines.push(`Researcher: ${(s.researcher ?? []).join(", ")}`);
  lines.push("");
  if (s.purpose) {
    lines.push("## Purpose");
    lines.push(s.purpose);
    lines.push("");
  }
  if (s.context) {
    lines.push("## Context");
    lines.push(s.context);
    lines.push("");
  }
  if ((s.objectives ?? []).length > 0) {
    lines.push("## Learning objectives");
    (s.objectives ?? []).forEach((o, i) => {
      lines.push(`### ${i + 1}. [${o.priority || "Must"}] ${fmt(o.objective)}`);
      if (o.hypothesis) lines.push(`Hypothesis: ${o.hypothesis}`);
      if (o.keyQuestions) lines.push(`Key questions: ${o.keyQuestions}`);
      if (o.participants) lines.push(`Target participants: ${o.participants}`);
      if (o.methodology) lines.push(`Methodology: ${o.methodology}`);
      if (o.goalTargets) lines.push(`Goal targets: ${o.goalTargets}`);
      lines.push("");
    });
  }
  if (s.methodology) {
    lines.push("## Methodology");
    lines.push(s.methodology === "discovery" ? "Discovery interview" : "Moderated usability test");
    lines.push("");
  }
  const cohorts = s.cohorts ?? {};
  const selected = (Object.keys(cohorts) as Array<keyof typeof cohorts>).filter(
    (c) => cohorts[c],
  );
  if (selected.length > 0) {
    lines.push("## Cohorts");
    selected.forEach((c) => {
      const sess = (s.sessions?.[c] ?? {}) as {
        min?: string;
        ideal?: string;
        max?: string;
      };
      lines.push(
        `- ${COHORT_LABEL[c] ?? c}: ${fmt(sess.min)} min · ${fmt(sess.ideal)} ideal · ${fmt(sess.max)} max`,
      );
      if (c !== "internal") {
        const criteria = s.criteria?.[c as "customers" | "noncustomers"];
        if (criteria) lines.push(`  Criteria: ${criteria}`);
        const screener = s.screener?.[c as "customers" | "noncustomers"];
        if (screener) lines.push(`  Screener: ${screener}`);
      }
    });
    lines.push("");
  }
  const participants = s.participants ?? [];
  if (participants.length > 0) {
    lines.push("## Participants");
    participants.forEach((p, i) => {
      lines.push(
        `${i + 1}. ${fmt(p.name)}${p.role ? " · " + p.role : ""}${p.company ? " · " + p.company : ""}${p.status ? " · " + p.status : ""}`,
      );
    });
    lines.push("");
  }
  return lines.join("\n");
}

function buildPrintableHTML(project: Project): string {
  const text = buildPlainText(project);
  const safe = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${project.S?.projectName ?? "Research plan"}</title>
<style>
  body { font: 13px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111; max-width: 720px; margin: 32px auto; padding: 0 24px; }
  h1, h2, h3 { margin-top: 1.4em; }
  h1 { font-size: 22px; }
  h2 { font-size: 16px; border-bottom: 1px solid #e4e4e7; padding-bottom: 4px; }
  h3 { font-size: 14px; }
  pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; }
  @media print { body { margin: 0; padding: 0; } }
</style>
</head><body><pre>${safe}</pre></body></html>`;
}

export function PreviewSheet({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const text = useMemo(() => buildPlainText(project), [project]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Plan copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  function download() {
    const html = buildPrintableHTML(project);
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Popup blocked. Allow popups to print.");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm" className="h-[30px] gap-1.5">
            <Eye className="size-3.5" />
            Preview
          </Button>
        }
      />
      <SheetContent className="flex w-full flex-col gap-3 sm:max-w-[640px]">
        <SheetHeader>
          <SheetTitle>{project.S?.projectName || "Untitled research"}</SheetTitle>
          <SheetDescription>
            Formatted research plan — copy or print to PDF.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <pre className="whitespace-pre-wrap break-words text-[12.5px] leading-relaxed">
            {text}
          </pre>
        </div>

        <SheetFooter className="flex-row justify-between gap-2">
          <Button variant="outline" onClick={copy}>
            <Copy className="size-4" />
            Copy
          </Button>
          <Button onClick={download}>
            <Download className="size-4" />
            Print / PDF
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
