export type SessionRange = { min?: string; ideal?: string; max?: string };

export type Cohort = "internal" | "customers" | "noncustomers";

export type ParticipantStatus =
  | "identified"
  | "contacted"
  | "scheduled"
  | "completed"
  | "dropped"
  | "no-show";

export type ParticipantCohort = "internal" | "customer" | "noncustomer";

export type Participant = {
  id?: number;
  cohort?: ParticipantCohort;
  type?: "internal" | "external";
  audience?: string;
  name?: string;
  role?: string;
  company?: string;
  contact?: string;
  hasCSM?: boolean;
  csmName?: string;
  csmContact?: string;
  status?: ParticipantStatus;
  sessionLink?: string;
  sessionPassword?: string;
  sessionDoc?: string;
  scheduledAt?: string;
  transcript?: string;
  findings?: string;
  msg1?: string;
  msg2?: string;
  [k: string]: unknown;
};

export type SurveyParticipant = {
  id?: number;
  name?: string;
  email?: string;
  company?: string;
  status?: string;
  [k: string]: unknown;
};

export type ObjectivePriority = "Must" | "Should" | "Could" | "Maybe Later";

export type Objective = {
  id?: number;
  priority?: ObjectivePriority;
  objective?: string;
  hypothesis?: string;
  keyQuestions?: string;
  participants?: string;
  methodology?: string;
  goalTargets?: string;
  [k: string]: unknown;
};

export type ProjectState = {
  projectName?: string;
  date?: string;
  area?: string;
  designer?: string[];
  researcher?: string[];
  purpose?: string;
  context?: string;
  methodology?: string;
  cohorts?: Record<Cohort, boolean>;
  sessions?: Record<Cohort, SessionRange>;
  criteria?: { customers?: string; noncustomers?: string };
  screener?: { customers?: string; noncustomers?: string };
  screenerChoice?: { customers?: string; noncustomers?: string };
  chipSelections?: { customers?: string[]; noncustomers?: string[] };
  championsLink?: string;
  customerLink?: string;
  objectives?: Objective[];
  participants?: Participant[];
  surveyParticipants?: SurveyParticipant[];
  analysisResult?: unknown;
  synthesisResult?: unknown;
  synthesisRich?: string;
  [k: string]: unknown;
};

export type Project = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  shareToken?: string;
  S: ProjectState;
  pid?: number;
  oid?: number;
  spid?: number;
};

export type SessionUser = {
  email: string;
  name: string;
};
