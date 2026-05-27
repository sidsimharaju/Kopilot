"use client";

import { useRef, useState } from "react";
import { ChevronDown, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { callAgentJSON } from "@/lib/agent";
import { cn } from "@/lib/utils";
import type {
  Objective,
  ObjectivePriority,
  Participant,
  ParticipantCohort,
  Project,
  ProjectState,
  SessionRange,
} from "@/lib/types";

type FillBriefResult = {
  projectName?: string;
  area?: string;
  purpose?: string;
  context?: string;
  objectives?: Objective[];
};

type DocImportResult = FillBriefResult & {
  date?: string;
  methodology?: string;
  championsLink?: string;
  customerLink?: string;
  cohorts?: Record<"internal" | "customers" | "noncustomers", boolean>;
  sessions?: Record<"internal" | "customers" | "noncustomers", SessionRange>;
  criteria?: { customers?: string; noncustomers?: string };
  participants?: Participant[];
};

type Props = {
  state: ProjectState;
  update: (mut: (s: ProjectState) => ProjectState) => void;
  updateProject: (mut: (p: Project) => Project) => void;
};

export function QuickStart({ state, update, updateProject }: Props) {
  const [open, setOpen] = useState(true);
  const [brief, setBrief] = useState("");
  const [busyAI, setBusyAI] = useState(false);
  const [busyDoc, setBusyDoc] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function fillFromBrief() {
    if (!brief.trim()) {
      toast.error("Add a brief first.");
      return;
    }
    setBusyAI(true);
    try {
      const prompt = `Extract and generate structured research plan fields from this description. Return ONLY a JSON object — no markdown, no preamble.

Description:
${brief}

Return this schema (use empty string "" for anything not determinable):
{
  "projectName": "short descriptive name",
  "area": "product area or domain",
  "purpose": "2-3 sentence research motivation and top-level goal",
  "context": "constraints, background, additional notes",
  "objectives": [
    {
      "priority": "Must",
      "objective": "specific thing to learn",
      "hypothesis": "best assumption",
      "keyQuestions": "questions to answer",
      "participants": "who would be ideal",
      "methodology": "method + format",
      "goalTargets": "measurable target if applicable"
    }
  ]
}

Generate 2–4 well-prioritised learning objectives (Must/Should/Could) from the description.`;

      const data = await callAgentJSON<FillBriefResult>(prompt);
      applyFillResult(data, state, update, updateProject);
      toast.success("Filled from brief");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Fill failed: ${msg}`);
    } finally {
      setBusyAI(false);
    }
  }

  async function importDoc(file: File) {
    setBusyDoc(true);
    try {
      const buf = await file.arrayBuffer();
      const parseRes = await fetch(
        `/api/parse-doc?filename=${encodeURIComponent(file.name)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: buf,
        },
      );
      const parsed = (await parseRes.json()) as { text?: string; error?: string };
      if (!parseRes.ok) throw new Error(parsed.error || `HTTP ${parseRes.status}`);
      const text = (parsed.text || "").slice(0, 30000);
      if (!text.trim()) throw new Error("Document is empty");

      const prompt = `You are parsing an existing UX research plan / report document. Extract every field you can find and return ONLY a JSON object (no markdown, no preamble).

DOCUMENT:
${text}

Return this exact schema. Use empty string "" or empty array [] for anything not present in the document. Be thorough — pull EVERY field you can find anywhere in the document, even if it's mentioned in passing.

{
  "projectName": "",
  "date": "YYYY-MM-DD if a research start date is given, else empty",
  "area": "product area",
  "purpose": "research motivation / top-level goal (2-4 sentences)",
  "context": "constraints, background, additional notes",
  "methodology": "usability | discovery (pick one based on what the doc describes)",
  "championsLink": "URL if mentioned",
  "customerLink": "URL if mentioned",
  "objectives": [
    {
      "priority": "Must | Should | Could | Maybe Later",
      "objective": "",
      "hypothesis": "",
      "keyQuestions": "questions, one per line, prefix each with - to render as bullets",
      "participants": "ideal participant description",
      "methodology": "method + format for this objective",
      "goalTargets": "measurable target if applicable"
    }
  ],
  "cohorts": {
    "internal": false,
    "customers": false,
    "noncustomers": false
  },
  "sessions": {
    "internal":    { "min": "", "ideal": "", "max": "" },
    "customers":   { "min": "", "ideal": "", "max": "" },
    "noncustomers":{ "min": "", "ideal": "", "max": "" }
  },
  "criteria": {
    "customers": "screening criteria text",
    "noncustomers": "screening criteria text"
  },
  "participants": [
    {
      "name": "",
      "role": "",
      "company": "",
      "contact": "email or other",
      "cohort": "internal | customer | noncustomer",
      "notes": "",
      "sessionLink": "zoom / meet link if a session URL appears near this participant",
      "sessionPassword": "session passcode if mentioned",
      "sessionDoc": "doc / guide URL if mentioned"
    }
  ]
}

Rules:
- Set cohort flags true only if the document explicitly discusses that group of participants.
- For methodology, "usability" = moderated usability test; "discovery" = discovery interview. Default to "discovery" if unclear.
- For keyQuestions, format as a list with "- " prefix on each line if multiple.`;

      const data = await callAgentJSON<DocImportResult>(prompt, { max_tokens: 6000 });
      applyDocImport(data, state, update, updateProject);
      toast.success(`Imported ${file.name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Import failed: ${msg}`);
    } finally {
      setBusyDoc(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-[14px]">
          <Sparkles className="size-4" />
          Quick start
        </CardTitle>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Collapse" : "Expand"}
        >
          <ChevronDown
            className={cn("size-4 transition-transform", !open && "-rotate-90")}
          />
        </Button>
      </CardHeader>
      {open ? (
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="text-[12px] text-muted-foreground">
              Paste a brief or short description of the research, and I&apos;ll fill
              project name, area, purpose, context, and 2–4 learning objectives.
            </div>
            <Textarea
              rows={4}
              placeholder="e.g. We want to learn how customers configure rate limits in Konnect. Run discovery interviews with 5 SEs and 3 customer admins…"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <Button onClick={fillFromBrief} disabled={busyAI} className="gap-1.5">
                <Sparkles className="size-3.5" />
                {busyAI ? "Filling…" : "Fill from brief"}
              </Button>
            </div>
          </div>

          <div className="border-t border-border-soft pt-3">
            <div className="mb-2 text-[12px] text-muted-foreground">
              Or upload an existing plan / report (.docx / .txt / .md) and I&apos;ll
              extract every field I can find.
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".docx,.txt,.md"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importDoc(f);
              }}
            />
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={busyDoc}
              className="gap-1.5"
            >
              <Upload className="size-3.5" />
              {busyDoc ? "Importing…" : "Import document"}
            </Button>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}

const VALID_PRIORITIES: ObjectivePriority[] = ["Must", "Should", "Could", "Maybe Later"];

function normalizePriority(value: unknown): ObjectivePriority {
  if (typeof value === "string") {
    const match = VALID_PRIORITIES.find((p) => p.toLowerCase() === value.toLowerCase());
    if (match) return match;
  }
  return "Must";
}

function applyFillResult(
  data: FillBriefResult,
  current: ProjectState,
  update: (mut: (s: ProjectState) => ProjectState) => void,
  updateProject: (mut: (p: Project) => Project) => void,
) {
  const baseOid = 1;
  let nextOid = baseOid;
  update((s) => {
    const next: ProjectState = { ...s };
    if (data.projectName) next.projectName = data.projectName;
    if (data.area) next.area = data.area;
    if (data.purpose) next.purpose = data.purpose;
    if (data.context) next.context = data.context;
    if (data.objectives && data.objectives.length > 0) {
      const startId = (current.objectives ?? []).reduce(
        (max, o) => Math.max(max, o.id ?? 0),
        0,
      );
      nextOid = startId + 1;
      const incoming = data.objectives.map((o, i) => ({
        ...o,
        id: startId + 1 + i,
        priority: normalizePriority(o.priority),
      }));
      nextOid = startId + 1 + incoming.length;
      next.objectives = [...(s.objectives ?? []), ...incoming];
    }
    return next;
  });
  updateProject((p) => ({ ...p, oid: nextOid }));
}

function applyDocImport(
  data: DocImportResult,
  current: ProjectState,
  update: (mut: (s: ProjectState) => ProjectState) => void,
  updateProject: (mut: (p: Project) => Project) => void,
) {
  applyFillResult(data, current, update, updateProject);

  update((s) => {
    const next: ProjectState = { ...s };
    if (data.date) next.date = data.date;
    if (data.methodology === "usability" || data.methodology === "discovery") {
      next.methodology = data.methodology;
    }
    if (data.championsLink) next.championsLink = data.championsLink;
    if (data.customerLink) next.customerLink = data.customerLink;
    if (data.cohorts) {
      next.cohorts = { ...(s.cohorts ?? {}), ...data.cohorts } as ProjectState["cohorts"];
    }
    if (data.sessions) {
      next.sessions = { ...(s.sessions ?? {}), ...data.sessions } as ProjectState["sessions"];
    }
    if (data.criteria) {
      next.criteria = { ...(s.criteria ?? {}), ...data.criteria };
    }
    if (data.participants && data.participants.length > 0) {
      const existing = s.participants ?? [];
      const dedupKey = (p: Participant) =>
        `${(p.name ?? "").toLowerCase()}|${(p.contact ?? "").toLowerCase()}`;
      const seen = new Set(existing.map(dedupKey));
      const startId = existing.reduce((max, p) => Math.max(max, p.id ?? 0), 0);
      const incoming = data.participants
        .filter((p) => !seen.has(dedupKey(p)))
        .map((p, i) => ({
          ...p,
          id: startId + 1 + i,
          cohort: validCohort(p.cohort),
          status: p.status ?? "identified",
        }));
      next.participants = [...existing, ...incoming];
      updateProject((proj) => ({ ...proj, pid: startId + 1 + incoming.length }));
    }
    return next;
  });
}

function validCohort(value: unknown): ParticipantCohort {
  return value === "internal" || value === "customer" || value === "noncustomer"
    ? value
    : "internal";
}
