"use client";

import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { initials } from "@/lib/participant";
import { cn } from "@/lib/utils";
import type { Participant } from "@/lib/types";

type Props = {
  participants: Participant[];
  selectedIds: number[];
  onToggle: (id: number, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  analyzing: boolean;
  hasAnalysis: boolean;
  onAnalyze: () => void;
};

export function AnalysisSelectionPanel({
  participants,
  selectedIds,
  onToggle,
  onSelectAll,
  analyzing,
  hasAnalysis,
  onAnalyze,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const selected = new Set(selectedIds);
  const allSelected =
    participants.length > 0 && participants.every((p) => selected.has(p.id!));
  const selectedCount = participants.filter((p) => selected.has(p.id!)).length;

  return (
    <Card className="border-chart-3/30 bg-chart-3/[0.04]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-chart-3" />
          Select participants to analyze
        </CardTitle>
        <CardAction>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand selection" : "Minimize selection"}
            className="text-muted-foreground"
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                collapsed && "-rotate-90",
              )}
            />
          </Button>
        </CardAction>
      </CardHeader>
      {collapsed ? null : (
        <CardContent className="flex flex-col gap-3">
          <p className="text-[12px] text-muted-foreground">
            Findings and reports are generated only from the people you select
            below. Attach transcripts in Conduct → Manage to add more.
          </p>

          {participants.length === 0 ? (
            <div className="rounded border border-dashed border-border bg-background px-4 py-6 text-center text-[12.5px] text-muted-foreground">
              No transcripts yet. Go to Conduct → Manage and attach a transcript
              for at least one participant.
            </div>
          ) : (
            <>
              <label className="flex items-center gap-2 border-b border-border/60 pb-2 text-[12px] font-medium">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => onSelectAll(Boolean(checked))}
                />
                Select all ({participants.length})
              </label>
              <div className="flex flex-col gap-1">
                {participants.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 transition-colors hover:bg-background"
                  >
                    <Checkbox
                      checked={selected.has(p.id!)}
                      onCheckedChange={(checked) =>
                        onToggle(p.id!, Boolean(checked))
                      }
                    />
                    <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-[10.5px] font-semibold text-muted-foreground">
                      {initials(p.name)}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[13px] font-medium">
                        {p.name}
                      </span>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {[p.role, p.company].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                    <span className="text-[10.5px] tabular-nums text-muted-foreground">
                      {(p.transcript ?? "").length.toLocaleString()} chars
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-[11.5px] text-muted-foreground">
                  {selectedCount} of {participants.length} selected
                </span>
                <Button
                  onClick={onAnalyze}
                  disabled={selectedCount === 0 || analyzing}
                  className="gap-1.5"
                >
                  <Sparkles className="size-4" />
                  {analyzing
                    ? hasAnalysis
                      ? "Re-analyzing…"
                      : "Analyzing…"
                    : hasAnalysis
                      ? "Re-analyze"
                      : "Create analysis"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
