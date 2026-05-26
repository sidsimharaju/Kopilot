import type { ParticipantStatus } from "./types";

export const AUDIENCE_LABELS: Record<string, string> = {
  "internal-fresh": "Fresh eyes",
  "internal-adjacent": "Adjacent product",
  "internal-rolematch": "Role match",
  se: "Solutions engineer",
  "field-engineer": "Field / platform engineer",
  csm: "CSM",
  customer: "Customer (direct)",
  noncustomer: "Non-Kong (Respondent)",
};

export const STATUS_LABEL: Record<ParticipantStatus, string> = {
  identified: "Identified",
  contacted: "Contacted",
  scheduled: "Scheduled",
  completed: "Completed",
  dropped: "Dropped",
  "no-show": "No-show",
};

export const STATUS_TONE: Record<ParticipantStatus, string> = {
  identified: "bg-border-soft text-text-3",
  contacted: "bg-blue-100 text-blue-700",
  scheduled: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-700",
  dropped: "bg-border-soft text-text-3",
  "no-show": "bg-red-100 text-red-700",
};

export const STATUS_VALUES: ParticipantStatus[] = [
  "identified",
  "contacted",
  "scheduled",
  "completed",
  "dropped",
  "no-show",
];

export const COHORT_PILL: Record<string, string> = {
  internal: "bg-emerald-100 text-emerald-700",
  customer: "bg-brand-soft text-primary",
  noncustomer: "bg-amber-100 text-amber-800",
};

export const COHORT_LABEL_SHORT: Record<string, string> = {
  internal: "Internal",
  customer: "Customer",
  noncustomer: "Non-Kong",
};

export function initials(name: string | undefined): string {
  if (!name) return "??";
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
