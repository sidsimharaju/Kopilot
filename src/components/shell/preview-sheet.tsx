"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Download, Eye, FileText } from "lucide-react";
import { marked } from "marked";
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
import { RichEditor } from "@/components/analysis/rich-editor";
import { COHORT_LABEL } from "@/lib/constants";
import type { Project, ProjectState } from "@/lib/types";

function val(value: string | undefined): string {
  return (value ?? "").trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

type Section = {
  heading?: string;
  paragraphs?: string[];
  list?: Array<{ heading: string; lines: string[] }>;
  rows?: Array<[string, string]>;
};

function buildSections(project: Project): Section[] {
  const s = project.S ?? ({} as ProjectState);
  const sections: Section[] = [];

  const metaRows: Array<[string, string]> = [];
  if (s.date) metaRows.push(["Start date", s.date]);
  if (s.area) metaRows.push(["Area", s.area]);
  if ((s.designer ?? []).length > 0)
    metaRows.push(["Designer", (s.designer ?? []).join(", ")]);
  if ((s.researcher ?? []).length > 0)
    metaRows.push(["Researcher", (s.researcher ?? []).join(", ")]);
  if (s.methodology)
    metaRows.push([
      "Methodology",
      s.methodology === "discovery" ? "Discovery interview" : "Moderated usability test",
    ]);
  if (metaRows.length > 0) sections.push({ heading: "Overview", rows: metaRows });

  if (val(s.purpose)) sections.push({ heading: "Purpose", paragraphs: [s.purpose!] });
  if (val(s.context)) sections.push({ heading: "Context", paragraphs: [s.context!] });

  if ((s.objectives ?? []).length > 0) {
    sections.push({
      heading: "Learning objectives",
      list: (s.objectives ?? []).map((o, i) => {
        const lines: string[] = [];
        if (o.hypothesis) lines.push(`Hypothesis: ${o.hypothesis}`);
        if (o.keyQuestions) lines.push(`Key questions: ${o.keyQuestions}`);
        if (o.participants) lines.push(`Target participants: ${o.participants}`);
        if (o.methodology) lines.push(`Methodology: ${o.methodology}`);
        if (o.goalTargets) lines.push(`Goal targets: ${o.goalTargets}`);
        return {
          heading: `${i + 1}. [${o.priority || "Must"}] ${val(o.objective) || "—"}`,
          lines,
        };
      }),
    });
  }

  const cohorts = s.cohorts ?? {};
  const selected = (Object.keys(cohorts) as Array<keyof typeof cohorts>).filter(
    (c) => cohorts[c],
  );
  if (selected.length > 0) {
    sections.push({
      heading: "Cohorts",
      list: selected.map((c) => {
        const sess = (s.sessions?.[c] ?? {}) as {
          min?: string;
          ideal?: string;
          max?: string;
        };
        const lines: string[] = [
          `Sessions: ${val(sess.min) || "—"} min · ${val(sess.ideal) || "—"} ideal · ${val(sess.max) || "—"} max`,
        ];
        if (c !== "internal") {
          const criteria = s.criteria?.[c as "customers" | "noncustomers"];
          if (criteria) lines.push(`Criteria: ${criteria}`);
          const screener = s.screener?.[c as "customers" | "noncustomers"];
          if (screener) lines.push(`Screener: ${screener}`);
        }
        return { heading: COHORT_LABEL[c] ?? String(c), lines };
      }),
    });
  }

  const participants = s.participants ?? [];
  if (participants.length > 0) {
    sections.push({
      heading: "Participants",
      // Render participants as a table for an at-a-glance roster.
      rows: participants.map((p) => {
        const who = `${val(p.name) || "—"}${p.role ? " · " + p.role : ""}${p.company ? " · " + p.company : ""}`;
        const csmNote =
          p.cohort === "customer" && p.hasCSM && p.csmName
            ? ` (via CSM ${p.csmName})`
            : "";
        return [who, `${p.status ?? "—"}${csmNote}`] as [string, string];
      }),
    });
  }

  return sections;
}

function buildMarkdown(project: Project): string {
  const s = project.S ?? ({} as ProjectState);
  const title = val(s.projectName) || "Untitled research";
  const sections = buildSections(project);
  const lines: string[] = [`# ${title}`, ""];
  for (const sec of sections) {
    if (sec.heading) lines.push(`## ${sec.heading}`, "");
    if (sec.rows) {
      const isParticipants = sec.heading === "Participants";
      lines.push(`| ${isParticipants ? "Participant" : "Field"} | ${isParticipants ? "Status" : "Value"} |`);
      lines.push("| --- | --- |");
      for (const [k, v] of sec.rows) {
        lines.push(`| ${k.replace(/\|/g, "\\|")} | ${v.replace(/\|/g, "\\|")} |`);
      }
      lines.push("");
    }
    if (sec.paragraphs) {
      for (const p of sec.paragraphs) lines.push(p, "");
    }
    if (sec.list) {
      for (const item of sec.list) {
        lines.push(`### ${item.heading}`);
        for (const l of item.lines) lines.push(`- ${l}`);
        lines.push("");
      }
    }
  }
  return lines.join("\n").trimEnd() + "\n";
}

// A neutral print stylesheet that mirrors the in-app rich editor — not a
// Google Doc — so the PDF matches what the user sees.
function printDoc(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  body { font: 14px/1.6 -apple-system, "Helvetica Neue", Arial, sans-serif; color: #18181b; max-width: 760px; margin: 48px auto; padding: 0 24px; }
  h1 { font-size: 24px; font-weight: 600; margin: 0 0 12px; }
  h2 { font-size: 18px; font-weight: 600; margin: 24px 0 8px; }
  h3 { font-size: 15px; font-weight: 600; margin: 18px 0 6px; }
  p, li { font-size: 14px; line-height: 1.6; }
  ul, ol { padding-left: 22px; }
  li { margin: 3px 0; }
  strong { font-weight: 600; }
  blockquote { margin: 8px 0; border-left: 3px solid #e4e4e7; padding: 4px 12px; color: #52525b; font-style: italic; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th, td { border: 1px solid #e4e4e7; padding: 6px 10px; text-align: left; font-size: 13px; }
  th { background: #f4f4f5; font-weight: 600; }
</style></head><body>${bodyHtml}</body></html>`;
}

export function PreviewSheet({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const initialHtml = useMemo(
    () => marked.parse(buildMarkdown(project), { async: false }) as string,
    [project],
  );
  const [content, setContent] = useState(initialHtml);

  // Resync when the underlying plan changes (e.g. project edited elsewhere).
  useEffect(() => setContent(initialHtml), [initialHtml]);

  const title = project.S?.projectName || "Untitled research";

  async function writeRich() {
    const plain = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const clip = (
      window as unknown as { ClipboardItem?: typeof ClipboardItem }
    ).ClipboardItem;
    if (clip && navigator.clipboard && "write" in navigator.clipboard) {
      await navigator.clipboard.write([
        new clip({
          "text/html": new Blob([content], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        }),
      ]);
    } else {
      await navigator.clipboard.writeText(plain);
    }
  }

  async function copyRich() {
    try {
      await writeRich();
      toast.success("Copied. Paste to keep the formatting.");
    } catch {
      toast.error("Copy failed");
    }
  }

  async function addToGoogleDocs() {
    try {
      await writeRich();
      window.open("https://docs.new", "_blank", "noopener,noreferrer");
      toast.success("Formatted content copied. Paste (Cmd+V) into the new Doc.");
    } catch {
      toast.error("Could not copy. Use Copy and paste into a Doc.");
    }
  }

  function downloadPdf() {
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Popup blocked. Allow popups to download the PDF.");
      return;
    }
    win.document.open();
    win.document.write(printDoc(title, content));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label="Preview"
            title="Preview"
            className="size-[30px] p-0"
          >
            <Eye className="size-3.5" />
          </Button>
        }
      />
      <SheetContent className="flex w-full flex-col gap-3 sm:max-w-[960px] lg:max-w-[1100px]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            Formatted research plan — edit with the same tools as reports, then
            copy or export.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <RichEditor
            value={content}
            onChange={setContent}
            minHeight="50vh"
            maxHeight="68vh"
          />
        </div>

        <SheetFooter className="flex-row flex-wrap justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={copyRich}>
              <Copy className="size-4" />
              Copy
            </Button>
            <Button variant="outline" onClick={downloadPdf}>
              <Download className="size-4" />
              Download PDF
            </Button>
          </div>
          <Button onClick={addToGoogleDocs}>
            <FileText className="size-4" />
            Add to Google Docs
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
