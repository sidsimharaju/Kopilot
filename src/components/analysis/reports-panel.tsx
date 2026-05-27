"use client";

import { useState } from "react";
import { Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateReport } from "@/lib/analyze";
import type { Project } from "@/lib/types";

export function ReportsPanel({ project }: { project: Project }) {
  const [type, setType] = useState<"summary" | "full" | null>(null);
  const [running, setRunning] = useState(false);
  const [markdown, setMarkdown] = useState("");

  async function run(kind: "summary" | "full") {
    setType(kind);
    setRunning(true);
    try {
      const md = await generateReport(kind, project);
      setMarkdown(md);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Report failed: ${message}`);
    } finally {
      setRunning(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate report</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => run("summary")}
            disabled={running}
            className="gap-1.5"
          >
            <Sparkles className="size-3.5" />
            {running && type === "summary" ? "Generating…" : "Summary report"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => run("full")}
            disabled={running}
            className="gap-1.5"
          >
            <Sparkles className="size-3.5" />
            {running && type === "full" ? "Generating…" : "Full report"}
          </Button>
        </div>
        {markdown ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                {type === "full" ? "Full report" : "Summary report"}
              </div>
              <Button size="sm" variant="outline" onClick={copy} className="gap-1.5">
                <Copy className="size-3.5" /> Copy markdown
              </Button>
            </div>
            <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded border border-border bg-background p-3 text-[12.5px] leading-relaxed">
              {markdown}
            </pre>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
