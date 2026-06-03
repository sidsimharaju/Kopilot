export const DESIGNERS = [
  "Ally", "Andras", "Erick", "Helen", "Janmesh", "Jason", "Jenya", "Jessica",
  "Julie", "Julieta", "Katrina", "Missy", "Mo", "Salomon", "Santhosh",
  "Shikha", "Sid", "Travis",
];

export const COHORTS = ["internal", "customers", "noncustomers"] as const;

export const COHORT_LABEL: Record<string, string> = {
  internal: "Internal Kongers",
  customers: "Kong customers",
  noncustomers: "Non-Kong customers",
};

export const COHORT_DESCRIPTION: Record<string, string> = {
  internal: "Practice runs + proxy signal",
  customers: "Primary signal source",
  noncustomers: "Competitive perspective",
};

export const COHORT_COUNT: Record<string, string> = {
  internal: "1–3 sessions",
  customers: "3–5 sessions",
  noncustomers: "2–3 sessions · paid",
};

export const CHIPS_INTERNAL: Array<{ label: string; value: string }> = [
  { label: "Fresh eyes", value: "Fresh eyes: hasn't worked on this product." },
  { label: "Adjacent product", value: "Adjacent product: knows the platform but not this specific flow." },
  { label: "Role match (SE, field eng, PM)", value: "Role match: same role as the people you're building for." },
  { label: "Pacing practice only", value: "Pacing practice: just need someone to run the script with to check timing." },
];

export const CHIPS_CUSTOMERS: Array<{ label: string; value: string }> = [
  { label: "Fresh eyes", value: "Low context: hasn't used this feature before" },
  { label: "Domain expert", value: "Deep domain expertise: knows this space well" },
  { label: "Power user", value: "Power user of this product area" },
  { label: "High intent", value: "High intent: actively evaluating or adopting this feature" },
  { label: "Role match", value: "Specific role match, e.g. platform engineer, API owner" },
  { label: "Enterprise / plan tier", value: "Enterprise scale or specific plan tier" },
];

export const CHIPS_NONCUSTOMERS: Array<{ label: string; value: string }> = [
  { label: "On a competitor", value: "Currently using a competing API gateway" },
  { label: "Never used Kong", value: "Has never used Kong in any form" },
  { label: "Actively evaluating", value: "Actively evaluating API gateway options right now" },
  { label: "Owns infrastructure", value: "Platform or DevOps engineer who owns the infrastructure" },
  { label: "Mid-size company", value: "50–500 person company" },
  { label: "Enterprise", value: "Enterprise (500+ employees)" },
];

export const PRIORITIES = ["Must", "Should", "Could", "Maybe Later"] as const;
