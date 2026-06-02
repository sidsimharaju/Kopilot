"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Participant, ParticipantCohort } from "@/lib/types";

type Props = {
  cohort: ParticipantCohort;
  initial?: Participant;
  submitLabel?: string;
  allowCohortChange?: boolean;
  onAdd: (p: Omit<Participant, "id">) => void;
  onCancel: () => void;
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

const COHORT_OPTIONS: Array<{ value: ParticipantCohort; label: string }> = [
  { value: "internal", label: "Internal Konger" },
  { value: "customer", label: "Kong customer" },
  { value: "noncustomer", label: "Non-Kong" },
];

export function AddParticipantForm({
  cohort,
  initial,
  submitLabel,
  allowCohortChange = false,
  onAdd,
  onCancel,
}: Props) {
  const [activeCohort, setActiveCohort] = useState<ParticipantCohort>(cohort);
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [contact, setContact] = useState(initial?.contact ?? "");
  const [audience, setAudience] = useState(
    initial?.audience ?? AUDIENCE_OPTIONS[cohort][0].value,
  );
  const [csmName, setCsmName] = useState(initial?.csmName ?? "");
  const [csmContact, setCsmContact] = useState(initial?.csmContact ?? "");
  const viaCSM = activeCohort === "customer" && audience === "csm";

  function changeCohort(next: ParticipantCohort) {
    setActiveCohort(next);
    const valid = AUDIENCE_OPTIONS[next].some((o) => o.value === audience);
    if (!valid) {
      setAudience(AUDIENCE_OPTIONS[next][0].value);
    }
  }

  function submit() {
    if (!name.trim()) return;
    const base: Omit<Participant, "id"> = {
      ...(initial ?? {}),
      name: name.trim(),
      role: role.trim(),
      company: company.trim(),
      contact: contact.trim(),
      cohort: activeCohort,
      type: activeCohort === "internal" ? "internal" : "external",
      audience,
      status: initial?.status ?? "identified",
    };
    if (activeCohort === "customer") {
      base.hasCSM = viaCSM;
      if (viaCSM) {
        base.csmName = csmName.trim();
        base.csmContact = csmContact.trim();
      } else {
        base.csmName = "";
        base.csmContact = "";
      }
    } else {
      base.hasCSM = false;
      base.csmName = "";
      base.csmContact = "";
    }
    onAdd(base);
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-3">
      {allowCohortChange ? (
        <div className="flex flex-col gap-1">
          <Label>Cohort</Label>
          <Select
            value={activeCohort}
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
      ) : null}

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label>Full name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Role / Title</Label>
          <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Platform Engineer" />
        </div>
        <div className="flex flex-col gap-1">
          <Label>{activeCohort === "internal" ? "Team" : "Company"}</Label>
          <Input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder={activeCohort === "internal" ? "Platform team" : "Acme Corp"}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>{activeCohort === "internal" ? "Slack handle" : "Email"}</Label>
          <Input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={activeCohort === "internal" ? "@jane" : "jane@acme.com"}
          />
        </div>
      </div>

      {activeCohort !== "noncustomer" ? (
        <div className="flex flex-col gap-1">
          <Label>Audience type</Label>
          <Select value={audience} onValueChange={(v) => v && setAudience(v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-[420px] max-w-[min(560px,calc(100vw-2rem))]">
              {AUDIENCE_OPTIONS[activeCohort].map((o) => (
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
            <Input value={csmName} onChange={(e) => setCsmName(e.target.value)} placeholder="Sarah Smith" />
          </div>
          <div className="flex flex-col gap-1">
            <Label>CSM Slack / email</Label>
            <Input value={csmContact} onChange={(e) => setCsmContact(e.target.value)} placeholder="@sarah or sarah@konghq.com" />
          </div>
        </div>
      ) : null}

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={submit} disabled={!name.trim()}>
          {submitLabel ?? "Add"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
