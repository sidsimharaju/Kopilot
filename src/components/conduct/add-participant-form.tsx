"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Participant, ParticipantCohort } from "@/lib/types";

type Props = {
  cohort: ParticipantCohort;
  withCSM?: boolean;
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

export function AddParticipantForm({ cohort, withCSM, onAdd, onCancel }: Props) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [audience, setAudience] = useState(AUDIENCE_OPTIONS[cohort][0].value);
  const [csmName, setCsmName] = useState("");
  const [csmContact, setCsmContact] = useState("");

  function submit() {
    if (!name.trim()) return;
    const base: Omit<Participant, "id"> = {
      name: name.trim(),
      role: role.trim(),
      company: company.trim(),
      contact: contact.trim(),
      cohort,
      type: cohort === "internal" ? "internal" : "external",
      audience,
      status: "identified",
    };
    if (cohort === "customer") {
      base.hasCSM = Boolean(withCSM);
      if (withCSM) {
        base.csmName = csmName.trim();
        base.csmContact = csmContact.trim();
      }
    }
    onAdd(base);
  }

  return (
    <div className="rounded-md border border-border bg-card p-3 flex flex-col gap-2">
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
          <Label>{cohort === "internal" ? "Team" : "Company"}</Label>
          <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder={cohort === "internal" ? "Platform team" : "Acme Corp"} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>{cohort === "internal" ? "Slack handle" : "Email"}</Label>
          <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder={cohort === "internal" ? "@jane" : "jane@acme.com"} />
        </div>
      </div>

      {cohort !== "noncustomer" ? (
        <div className="flex flex-col gap-1">
          <Label>Audience type</Label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="rounded-md border border-input bg-card px-2 py-1.5 text-[13px]"
          >
            {AUDIENCE_OPTIONS[cohort].map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {cohort === "customer" && withCSM ? (
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
          Add
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
