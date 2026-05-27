"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { COHORT_PILL } from "@/lib/participant";
import { cn } from "@/lib/utils";
import type { ParticipantCohort, Project } from "@/lib/types";

type CustomerRow = {
  name: string;
  company: string;
  role: string;
  email: string;
  cohort: ParticipantCohort;
  projects: string[];
};

const COHORT_FILTERS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All cohorts" },
  { value: "internal", label: "Internal Kongers" },
  { value: "customer", label: "Kong customers" },
  { value: "noncustomer", label: "Non-Kong customers" },
];

const COHORT_LABEL_SHORT: Record<ParticipantCohort, string> = {
  internal: "Internal",
  customer: "Customer",
  noncustomer: "Non-Kong",
};

function dedupeKey(name: string, email: string): string {
  return `${name.trim().toLowerCase()}|${email.trim().toLowerCase()}`;
}

export function CustomersTable({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [cohort, setCohort] = useState<string>("all");

  const rows: CustomerRow[] = useMemo(() => {
    const map = new Map<string, CustomerRow>();
    for (const p of projects) {
      const projectName = p.S?.projectName || "Untitled";
      const participants = p.S?.participants ?? [];
      for (const part of participants) {
        const name = part.name ?? "";
        if (!name.trim()) continue;
        const c = (part.cohort ?? "internal") as ParticipantCohort;
        const email = part.contact ?? "";
        const key = dedupeKey(name, email);
        const existing = map.get(key);
        if (existing) {
          if (!existing.projects.includes(projectName)) {
            existing.projects.push(projectName);
          }
        } else {
          map.set(key, {
            name,
            company: part.company ?? "—",
            role: part.role ?? "—",
            email: email || "—",
            cohort: c,
            projects: [projectName],
          });
        }
      }
    }
    return Array.from(map.values());
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (cohort !== "all" && r.cohort !== cohort) return false;
      if (!q) return true;
      const hay = `${r.name} ${r.company} ${r.role} ${r.email} ${r.projects.join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query, cohort]);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-8 py-20 text-center">
        <div className="text-[14px] font-medium">No participants yet</div>
        <div className="text-[13px] text-muted-foreground">
          Add participants in a project to see them here.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, company, role, email, or project…"
            className="pl-9"
          />
        </div>
        <Select value={cohort} onValueChange={(v) => v && setCohort(v)}>
          <SelectTrigger className="sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COHORT_FILTERS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Cohort</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead className="text-right">#</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.company}</TableCell>
                <TableCell className="text-muted-foreground">{r.email}</TableCell>
                <TableCell>{r.role}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                      COHORT_PILL[r.cohort],
                    )}
                  >
                    {COHORT_LABEL_SHORT[r.cohort]}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {r.projects.map((proj) => (
                      <span
                        key={proj}
                        className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground"
                      >
                        {proj}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {r.projects.length}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
