"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Project } from "@/lib/types";

type CustomerRow = {
  name: string;
  company: string;
  role: string;
  status: string;
  project: string;
  contact: string;
};

export function CustomersTable({ projects }: { projects: Project[] }) {
  const rows: CustomerRow[] = [];
  for (const p of projects) {
    const participants = p.S?.participants ?? [];
    for (const part of participants) {
      if (part.cohort !== "customer" && part.cohort !== "noncustomer") continue;
      rows.push({
        name: part.name ?? "—",
        company: part.company ?? "—",
        role: part.role ?? "—",
        status: part.status ?? "identified",
        project: p.S?.projectName || "Untitled",
        contact: part.contact ?? "—",
      });
    }
  }

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
          {rows.map((r, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell>{r.company}</TableCell>
              <TableCell>{r.role}</TableCell>
              <TableCell>{r.status}</TableCell>
              <TableCell className="text-muted-foreground">{r.project}</TableCell>
              <TableCell className="text-muted-foreground">{r.contact}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
