"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Search, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ParticipantCohort, Project } from "@/lib/types";

type CustomerRow = {
  name: string;
  company: string;
  role: string;
  email: string;
  cohort: ParticipantCohort;
  audience: string;
  hasCSM: boolean;
  csmName: string;
  csmContact: string;
  projects: string[];
};

const AUDIENCE_OPTIONS: Record<ParticipantCohort, Array<{ value: string; label: string }>> = {
  internal: [
    { value: "internal-fresh", label: "Fresh eyes — hasn't worked on this product" },
    { value: "internal-adjacent", label: "Adjacent product" },
    { value: "internal-rolematch", label: "Role match" },
    { value: "se", label: "Solutions engineer" },
    { value: "field-engineer", label: "Field / platform engineer" },
  ],
  customer: [
    { value: "csm", label: "Via CSM" },
    { value: "customer", label: "Customer (direct)" },
  ],
  noncustomer: [{ value: "noncustomer", label: "Non-Kong (Respondent)" }],
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

const COHORT_PILL: Record<ParticipantCohort, string> = {
  internal: "bg-chart-2/15 text-chart-2 ring-chart-2/30",
  customer: "bg-chart-3/15 text-chart-3 ring-chart-3/30",
  noncustomer: "bg-chart-5/20 text-chart-5 ring-chart-5/30",
};

const COHORT_LABEL_SHORT: Record<ParticipantCohort, string> = {
  internal: "Internal",
  customer: "Customer",
  noncustomer: "Non-Kong",
};

function dedupeKey(name: string, email: string): string {
  return `${name.trim().toLowerCase()}|${email.trim().toLowerCase()}`;
}

export function CustomersTable({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cohort, setCohort] = useState<string>("all");
  const [pending, setPending] = useState<CustomerRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [savingCohortFor, setSavingCohortFor] = useState<string | null>(null);

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
            audience: part.audience ?? AUDIENCE_OPTIONS[c][0].value,
            hasCSM: Boolean(part.hasCSM),
            csmName: part.csmName ?? "",
            csmContact: part.csmContact ?? "",
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

  async function changeCohort(row: CustomerRow, next: ParticipantCohort) {
    if (row.cohort === next) return;
    const key = dedupeKey(row.name, row.email === "—" ? "" : row.email);
    setSavingCohortFor(key);
    try {
      const res = await fetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          name: row.name,
          email: row.email === "—" ? "" : row.email,
          update: { cohort: next },
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${body ? ` — ${body}` : ""}`);
      }
      const label = COHORT_OPTIONS.find((o) => o.value === next)?.label;
      toast.success(`Moved ${row.name} to ${label}`);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Update failed: ${msg}`);
    } finally {
      setSavingCohortFor(null);
    }
  }

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
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Delete failed: ${msg}`);
    } finally {
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
            <SelectValue>
              {COHORT_FILTERS.find((o) => o.value === cohort)?.label}
            </SelectValue>
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
              <TableHead className="w-[88px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r, i) => {
              const key = dedupeKey(r.name, r.email === "—" ? "" : r.email);
              return (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.company}</TableCell>
                  <TableCell className="text-muted-foreground">{r.email}</TableCell>
                  <TableCell>{r.role}</TableCell>
                  <TableCell>
                    <CohortPillSelect
                      value={r.cohort}
                      disabled={savingCohortFor === key}
                      onChange={(next) => changeCohort(r, next)}
                    />
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
                    <div className="flex justify-end gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditing(r)}
                        aria-label={`Edit ${r.name}`}
                        className="text-muted-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
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
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
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

      <EditCustomerSheet
        row={editing}
        onClose={() => setEditing(null)}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}

function CohortPillSelect({
  value,
  disabled,
  onChange,
}: {
  value: ParticipantCohort;
  disabled?: boolean;
  onChange: (next: ParticipantCohort) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => v && onChange(v as ParticipantCohort)}
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        className={cn(
          "h-7 w-[150px] rounded-full border-0 px-2.5 text-[11px] font-medium ring-1 ring-inset focus-visible:ring-2",
          COHORT_PILL[value],
        )}
      >
        <SelectValue>{COHORT_LABEL_SHORT[value]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {COHORT_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EditCustomerSheet({
  row,
  onClose,
  onSaved,
}: {
  row: CustomerRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [cohort, setCohort] = useState<ParticipantCohort>("internal");
  const [audience, setAudience] = useState<string>("");
  const [csmName, setCsmName] = useState("");
  const [csmContact, setCsmContact] = useState("");
  const [saving, setSaving] = useState(false);
  const open = row !== null;
  const viaCSM = cohort === "customer" && audience === "csm";

  useEffect(() => {
    if (!row) return;
    setName(row.name);
    setEmail(row.email === "—" ? "" : row.email);
    setRole(row.role === "—" ? "" : row.role);
    setCompany(row.company === "—" ? "" : row.company);
    setCohort(row.cohort);
    setAudience(row.audience || AUDIENCE_OPTIONS[row.cohort][0].value);
    setCsmName(row.csmName);
    setCsmContact(row.csmContact);
  }, [row]);

  function changeCohort(next: ParticipantCohort) {
    setCohort(next);
    const valid = AUDIENCE_OPTIONS[next].some((o) => o.value === audience);
    if (!valid) setAudience(AUDIENCE_OPTIONS[next][0].value);
  }

  async function save() {
    if (!row) return;
    setSaving(true);
    try {
      const hasCSM = cohort === "customer" && audience === "csm";
      const res = await fetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          name: row.name,
          email: row.email === "—" ? "" : row.email,
          update: {
            name: name.trim(),
            email: email.trim(),
            role: role.trim(),
            company: company.trim(),
            cohort,
            audience,
            hasCSM,
            csmName: hasCSM ? csmName.trim() : "",
            csmContact: hasCSM ? csmContact.trim() : "",
          },
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${body ? ` — ${body}` : ""}`);
      }
      toast.success("Customer updated");
      onSaved();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Save failed: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!saving && !next) onClose();
      }}
    >
      <SheetContent className="flex w-full flex-col gap-4 sm:max-w-[560px]">
        <SheetHeader>
          <SheetTitle>Edit customer</SheetTitle>
          <SheetDescription>
            Changes apply to every project this person is in
            {row && row.projects.length > 0 ? (
              <>
                {" "}({row.projects.length}{" "}
                {row.projects.length === 1 ? "project" : "projects"})
              </>
            ) : null}
            .
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4">
          <div className="flex flex-col gap-1">
            <Label>Cohort</Label>
            <Select
              value={cohort}
              onValueChange={(v) => v && changeCohort(v as ParticipantCohort)}
            >
              <SelectTrigger className="w-full">
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
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label>Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Role / Title</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{cohort === "internal" ? "Team" : "Company"}</Label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{cohort === "internal" ? "Slack handle" : "Email"}</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          {cohort !== "noncustomer" ? (
            <div className="flex flex-col gap-1">
              <Label>Audience type</Label>
              <Select
                value={audience}
                onValueChange={(v) => v && setAudience(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-[420px] max-w-[min(560px,calc(100vw-2rem))]">
                  {AUDIENCE_OPTIONS[cohort].map((o) => (
                    <SelectItem key={o.value} value={o.value} className="whitespace-normal">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {viaCSM ? (
            <div className="grid grid-cols-1 gap-2 border-t border-border pt-2 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label>CSM name</Label>
                <Input
                  value={csmName}
                  onChange={(e) => setCsmName(e.target.value)}
                  placeholder="Sarah Smith"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>CSM Slack / email</Label>
                <Input
                  value={csmContact}
                  onChange={(e) => setCsmContact(e.target.value)}
                  placeholder="@sarah or sarah@konghq.com"
                />
              </div>
            </div>
          ) : null}
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !name.trim()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
