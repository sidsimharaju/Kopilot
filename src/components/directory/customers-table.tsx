"use client";

import { useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const COHORT_OPTIONS: Array<{ value: ParticipantCohort; label: string }> = [
  { value: "internal", label: "Internal Konger" },
  { value: "customer", label: "Kong customer" },
  { value: "noncustomer", label: "Non-Kong" },
];

function dedupeKey(name: string, email: string): string {
  return `${name.trim().toLowerCase()}|${email.trim().toLowerCase()}`;
}

export function CustomersTable({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [cohort, setCohort] = useState<string>("all");
  const [pending, setPending] = useState<CustomerRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingCohort, setSavingCohort] = useState<string | null>(null);

  async function changeCohort(row: CustomerRow, next: ParticipantCohort) {
    if (row.cohort === next) return;
    const key = dedupeKey(row.name, row.email === "—" ? "" : row.email);
    setSavingCohort(key);
    try {
      const res = await fetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          name: row.name,
          email: row.email === "—" ? "" : row.email,
          cohort: next,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${body ? ` — ${body}` : ""}`);
      }
      toast.success(`Moved ${row.name} to ${COHORT_OPTIONS.find((o) => o.value === next)?.label}`);
      window.location.assign("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Update failed: ${msg}`);
      setSavingCohort(null);
    }
  }

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

  async function confirmDelete() {
    if (!pending || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/customers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          name: pending.name,
          email: pending.email === "—" ? "" : pending.email,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${body ? ` — ${body}` : ""}`);
      }
      const data = (await res.json()) as { removed?: number };
      toast.success(`Removed ${pending.name} (${data.removed ?? 0} entries)`);
      setPending(null);
      window.location.assign("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Delete failed: ${msg}`);
      setDeleting(false);
    }
  }

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
              <TableHead className="w-[44px]" />
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
                  <Select
                    value={r.cohort}
                    onValueChange={(v) =>
                      v && changeCohort(r, v as ParticipantCohort)
                    }
                    disabled={savingCohort === dedupeKey(r.name, r.email === "—" ? "" : r.email)}
                  >
                    <SelectTrigger size="sm" className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COHORT_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setPending(r)}
                    aria-label={`Remove ${r.name}`}
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!deleting && !open) setPending(null);
        }}
      >
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Remove {pending?.name}?</DialogTitle>
            <DialogDescription>
              This removes the participant from every project they&apos;re in
              {pending && pending.projects.length > 0 ? (
                <>
                  {" "}({pending.projects.length}{" "}
                  {pending.projects.length === 1 ? "project" : "projects"})
                </>
              ) : null}
              . The projects themselves stay intact. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPending(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Removing…" : "Remove customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
