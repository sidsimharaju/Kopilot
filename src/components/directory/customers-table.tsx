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
import { STATUS_LABEL, STATUS_TONE } from "@/lib/participant";
import { cn } from "@/lib/utils";
import type { ParticipantStatus, Project } from "@/lib/types";

type CustomerRow = {
  name: string;
  company: string;
  role: string;
  status: ParticipantStatus;
  project: string;
  contact: string;
  cohort: string;
};

export function CustomersTable({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");

  const rows: CustomerRow[] = useMemo(() => {
    const out: CustomerRow[] = [];
    for (const p of projects) {
      const participants = p.S?.participants ?? [];
      for (const part of participants) {
        if (part.cohort !== "customer" && part.cohort !== "noncustomer") continue;
        out.push({
          name: part.name ?? "—",
          company: part.company ?? "—",
          role: part.role ?? "—",
          status: (part.status ?? "identified") as ParticipantStatus,
          project: p.S?.projectName || "Untitled",
          contact: part.contact ?? "—",
          cohort: part.cohort,
        });
      }
    }
    return out;
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      const hay = `${r.name} ${r.company} ${r.role} ${r.project} ${r.contact}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query, status]);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-8 py-20 text-center">
        <div className="text-[14px] font-medium">No customer participants yet</div>
        <div className="text-[13px] text-muted-foreground">
          Add customer or non-customer participants in a project to see them here.
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
            placeholder="Search customer, company, role, or project…"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => v && setStatus(v)}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
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
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Contact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.company}</TableCell>
                <TableCell>{r.role}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                      STATUS_TONE[r.status],
                    )}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{r.project}</TableCell>
                <TableCell className="text-muted-foreground">{r.contact}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
