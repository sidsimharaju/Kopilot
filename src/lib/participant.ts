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
  identified: "bg-muted text-muted-foreground",
  contacted: "bg-chart-3/15 text-chart-3",
  scheduled: "bg-chart-4/20 text-chart-4",
  completed: "bg-chart-2/15 text-chart-2",
  dropped: "bg-muted text-muted-foreground",
  "no-show": "bg-destructive/10 text-destructive",
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
  internal: "bg-chart-2/15 text-chart-2",
  customer: "bg-chart-3/15 text-chart-3",
  noncustomer: "bg-chart-5/20 text-chart-5",
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
