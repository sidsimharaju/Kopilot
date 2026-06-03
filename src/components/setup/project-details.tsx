"use client";

import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DESIGNERS } from "@/lib/constants";
import type { ProjectState } from "@/lib/types";

type Props = {
  state: ProjectState;
  update: (mut: (s: ProjectState) => ProjectState) => void;
};

export function ProjectDetails({ state, update }: Props) {
  const designers = state.designer ?? [];

  function addDesigner(name: string) {
    if (!name) return;
    update((s) => {
      const current = s.designer ?? [];
      if (current.includes(name)) return s;
      return { ...s, designer: [...current, name] };
    });
  }

  function removeDesigner(name: string) {
    update((s) => {
      const current = s.designer ?? [];
      return { ...s, designer: current.filter((n) => n !== name) };
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project details</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="f-name">Project name</Label>
            <Input
              id="f-name"
              placeholder="e.g. Context Mesh Discovery"
              value={state.projectName ?? ""}
              onChange={(e) =>
                update((s) => ({ ...s, projectName: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="f-date">Research start date</Label>
            <Input
              id="f-date"
              type="date"
              value={state.date ?? ""}
              onChange={(e) => update((s) => ({ ...s, date: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="f-area">Product area</Label>
            <Input
              id="f-area"
              placeholder="e.g. Core Platform"
              value={state.area ?? ""}
              onChange={(e) => update((s) => ({ ...s, area: e.target.value }))}
            />
          </div>
        </div>

        <PersonField
          label="Designer"
          options={DESIGNERS}
          selected={designers}
          onAdd={addDesigner}
          onRemove={removeDesigner}
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-purpose">Purpose</Label>
          <Textarea
            id="f-purpose"
            rows={3}
            placeholder="What is motivating you to conduct this research? What do you need to learn at the highest level?"
            value={state.purpose ?? ""}
            onChange={(e) => update((s) => ({ ...s, purpose: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-context">Context &amp; additional background</Label>
          <Textarea
            id="f-context"
            rows={3}
            placeholder="Any additional context, constraints, or background. Also used to generate outreach messages…"
            value={state.context ?? ""}
            onChange={(e) => update((s) => ({ ...s, context: e.target.value }))}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function PersonField({
  label,
  options,
  selected,
  onAdd,
  onRemove,
}: {
  label: string;
  options: string[];
  selected: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
}) {
  const pillCls = "bg-muted text-foreground";
  const available = options.filter((n) => !selected.includes(n));
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-card px-2 py-1.5 min-h-[34px]">
        {selected.map((name) => (
          <span
            key={name}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${pillCls}`}
          >
            {name}
            <button
              type="button"
              className="text-current opacity-60 hover:opacity-100"
              onClick={() => onRemove(name)}
              aria-label={`Remove ${name}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <Select
          value=""
          onValueChange={(v) => {
            if (v) onAdd(v);
          }}
        >
          <SelectTrigger
            size="sm"
            className="ml-auto h-6 border-0 bg-transparent px-1 text-[12px] text-muted-foreground shadow-none focus-visible:ring-0"
          >
            <SelectValue placeholder={`+ Add ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {available.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
