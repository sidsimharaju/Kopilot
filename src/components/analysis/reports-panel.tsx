"use client";

import { useState } from "react";
import { Copy, RefreshCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateReport } from "@/lib/analyze";
import type { Project, ProjectState } from "@/lib/types";
import { MarkdownEditor } from "./markdown-editor";

type Kind = "summary" | "full";

const TITLE: Record<Kind, string> = {
  summary: "Summary report",
  full: "Full report",
};

type Props = {
  project: Project;
  update: (mut: (s: ProjectState) => ProjectState) => void;
};

export function ReportsPanel({ project, update }: Props) {
  const reports = project.S.reports ?? {};
  const [running, setRunning] = useState<Kind | null>(null);
  const [active, setActive] = useState<Kind>("summary");

  const content = reports[active] ?? "";
  const hasContent = Boolean(content.trim());

  function setReport(kind: Kind, value: string) {
    update((s) => ({
      ...s,
      reports: { ...(s.reports ?? {}), [kind]: value },
    }));
  }

  async function run(kind: Kind) {
    setRunning(kind);
    try {
      const md = await generateReport(kind, project);
      setReport(kind, md);
      setActive(kind);
      toast.success(`${TITLE[kind]} generated`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Report failed: ${message}`);
    } finally {
      setRunning(null);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied as markdown");
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span>Reports</span>
          <Tabs value={active} onValueChange={(v) => setActive(v as Kind)}>
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="full">Full</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {hasContent ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => run(active)}
                disabled={running !== null}
                className="gap-1.5"
              >
                <RefreshCcw className="size-3.5" />
                {running === active ? "Regenerating…" : "Regenerate"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copy}
                className="gap-1.5"
              >
                <Copy className="size-3.5" />
                Copy markdown
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => run(active)}
              disabled={running !== null}
              className="gap-1.5"
            >
              <Sparkles className="size-3.5" />
              {running === active
                ? `Generating ${TITLE[active].toLowerCase()}…`
                : `Generate ${TITLE[active].toLowerCase()}`}
            </Button>
          )}
        </div>

        {hasContent ? (
          <MarkdownEditor
            value={content}
            onChange={(v) => setReport(active, v)}
            placeholder={`Write the ${TITLE[active].toLowerCase()} here.`}
            minHeight="420px"
            maxHeight="720px"
          />
        ) : (
          <div className="rounded border border-dashed border-border bg-background px-4 py-8 text-center text-[12.5px] text-muted-foreground">
            No {TITLE[active].toLowerCase()} yet. Generate one to see it here.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
