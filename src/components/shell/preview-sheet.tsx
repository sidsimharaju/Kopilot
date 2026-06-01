"use client";

import { useMemo, useState } from "react";
import { Copy, Download, FileText, Eye } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      list: participants.map((p, i) => {
        const csmNote =
          p.cohort === "customer" && p.hasCSM && p.csmName
            ? ` · via CSM ${p.csmName}`
            : "";
        return {
          heading: `${i + 1}. ${val(p.name) || "—"}${p.role ? " · " + p.role : ""}${p.company ? " · " + p.company : ""}${csmNote}`,
          lines: p.status ? [`Status: ${p.status}`] : [],
        };
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
    if (sec.heading) lines.push(`## ${sec.heading}`);
    if (sec.rows) {
      for (const [k, v] of sec.rows) lines.push(`- **${k}:** ${v}`);
    }
    if (sec.paragraphs) {
      for (const p of sec.paragraphs) lines.push(p);
    }
    if (sec.list) {
      for (const item of sec.list) {
        lines.push(`### ${item.heading}`);
        for (const l of item.lines) lines.push(`- ${l}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd() + "\n";
}

function buildDocsHTML(project: Project, { standalone }: { standalone: boolean }): string {
  const s = project.S ?? ({} as ProjectState);
  const title = val(s.projectName) || "Untitled research";
  const sections = buildSections(project);
  const body: string[] = [`<h1>${escapeHtml(title)}</h1>`];
  for (const sec of sections) {
    if (sec.heading) body.push(`<h2>${escapeHtml(sec.heading)}</h2>`);
    if (sec.rows) {
      body.push("<ul>");
      for (const [k, v] of sec.rows) {
        body.push(`<li><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</li>`);
      }
      body.push("</ul>");
    }
    if (sec.paragraphs) {
      for (const p of sec.paragraphs) body.push(`<p>${escapeHtml(p)}</p>`);
    }
    if (sec.list) {
      for (const item of sec.list) {
        body.push(`<h3>${escapeHtml(item.heading)}</h3>`);
        if (item.lines.length > 0) {
          body.push("<ul>");
          for (const l of item.lines) body.push(`<li>${escapeHtml(l)}</li>`);
          body.push("</ul>");
        }
      }
    }
  }
  const inner = body.join("\n");
  if (!standalone) return inner;
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  body { font: 11pt/1.5 "Google Sans","Helvetica Neue",Arial,sans-serif; color: #202124; max-width: 8.5in; margin: 1in auto; padding: 0 0.5in; }
  h1 { font-size: 26pt; font-weight: 400; margin: 0 0 0.6em; }
  h2 { font-size: 16pt; font-weight: 400; margin: 1.4em 0 0.4em; color: #1a73e8; }
  h3 { font-size: 12pt; font-weight: 600; margin: 1em 0 0.3em; }
  p, li { font-size: 11pt; line-height: 1.55; }
  ul { padding-left: 1.4em; }
  li { margin: 0.15em 0; }
</style>
</head><body>${inner}</body></html>`;
}

export function PreviewSheet({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const markdown = useMemo(() => buildMarkdown(project), [project]);
  const docsHtml = useMemo(
    () => buildDocsHTML(project, { standalone: false }),
    [project],
  );

  async function copy(text: string, label = "Copied") {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch {
      toast.error("Copy failed");
    }
  }

  async function addToGoogleDocs() {
    const html = buildDocsHTML(project, { standalone: false });
    const plain = buildMarkdown(project);
    try {
      const clip = (
        window as unknown as { ClipboardItem?: typeof ClipboardItem }
      ).ClipboardItem;
      if (clip && navigator.clipboard && "write" in navigator.clipboard) {
        await navigator.clipboard.write([
          new clip({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([plain], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(plain);
      }
      window.open("https://docs.new", "_blank", "noopener,noreferrer");
      toast.success("Formatted content copied. Paste (Cmd+V) into the new Doc.");
    } catch {
      toast.error("Could not copy. Use Copy below and paste into a Doc.");
    }
  }

  function download() {
    const html = buildDocsHTML(project, { standalone: true });
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

  function downloadMarkdown() {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug =
      (project.S?.projectName || "research-plan")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "research-plan";
    a.href = url;
    a.download = `${slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
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
      <SheetContent className="flex w-full flex-col gap-3 sm:max-w-[960px] lg:max-w-[1100px]">
        <SheetHeader>
          <SheetTitle>{project.S?.projectName || "Untitled research"}</SheetTitle>
          <SheetDescription>
            Formatted research plan — view as a Google Doc or as Markdown.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="gdoc" className="flex flex-1 flex-col gap-3 overflow-hidden px-4">
          <TabsList className="w-fit">
            <TabsTrigger value="gdoc">Google Docs</TabsTrigger>
            <TabsTrigger value="md">Markdown</TabsTrigger>
          </TabsList>

          <TabsContent
            value="gdoc"
            className="flex-1 overflow-hidden"
          >
            <div className="h-full overflow-y-auto rounded-md border border-border bg-card">
              <div
                className="px-10 py-8 text-[#202124] [font-family:'Google_Sans','Helvetica_Neue',Arial,sans-serif] [&_h1]:mb-3 [&_h1]:text-[26pt] [&_h1]:font-normal [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-[16pt] [&_h2]:font-normal [&_h2]:text-[#1a73e8] [&_h3]:mt-4 [&_h3]:mb-1 [&_h3]:text-[12pt] [&_h3]:font-semibold [&_li]:my-1 [&_li]:text-[11pt] [&_li]:leading-[1.55] [&_p]:text-[11pt] [&_p]:leading-[1.55] [&_ul]:list-disc [&_ul]:pl-6"
                dangerouslySetInnerHTML={{ __html: docsHtml }}
              />
            </div>
          </TabsContent>

          <TabsContent value="md" className="flex-1 overflow-hidden">
            <pre className="h-full overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-border bg-card p-4 font-mono text-[12.5px] leading-relaxed">
              {markdown}
            </pre>
          </TabsContent>
        </Tabs>

        <SheetFooter className="flex-row flex-wrap justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => copy(markdown, "Markdown copied")}>
              <Copy className="size-4" />
              Copy Markdown
            </Button>
            <Button variant="outline" onClick={downloadMarkdown}>
              <Download className="size-4" />
              Download .md
            </Button>
            <Button variant="outline" onClick={download}>
              <Download className="size-4" />
              Print / PDF
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
