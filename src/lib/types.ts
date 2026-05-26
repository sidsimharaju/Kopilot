export type SessionRange = { min?: string; ideal?: string; max?: string };

export type Cohort = "internal" | "customers" | "noncustomers";

export type Participant = {
  id?: number;
  cohort?: Cohort;
  audience?: string;
  name?: string;
  email?: string;
  company?: string;
  notes?: string;
  status?: string;
  scheduledAt?: string;
  transcript?: string;
  findings?: string;
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

export type Objective = {
  id?: number;
  text?: string;
  notes?: string;
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
