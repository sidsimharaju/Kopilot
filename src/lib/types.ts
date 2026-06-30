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
  chipSelections?: { internal?: string[]; customers?: string[]; noncustomers?: string[] };
  championsLink?: string;
  customerLink?: string;
  objectives?: Objective[];
  participants?: Participant[];
  surveyParticipants?: SurveyParticipant[];
  analysisResult?: AnalysisResult | null;
  synthesisResult?: Synthesis | null;
  synthesisRich?: string;
  analysisSelection?: number[];
  messageTemplates?: MessageTemplates;
  reports?: { summary?: string; full?: string };
  completedAt?: string | null;
  [k: string]: unknown;
};

export type MessageTemplateKind =
  | "slackInternal"
  | "slackCsm"
  | "emailCustomer"
  | "emailNoncustomer";

export type MessageTemplates = Partial<Record<MessageTemplateKind, string>>;

export type FindingConfidence = "high" | "medium" | "low";

export type ObjectiveFinding = {
  objective: string;
  finding: string;
  confidence?: FindingConfidence;
  quotes?: string[];
};

export type ParticipantAnalysis = {
  name?: string;
  role?: string;
  byObjective?: ObjectiveFinding[];
};

export type AnalysisResult = {
  participants?: ParticipantAnalysis[];
};

export type SynthesisTheme = {
  name?: string;
  description?: string;
  participants?: string;
};

export type Synthesis = {
  tldr?: string;
  themes?: SynthesisTheme[];
  topPainPoints?: string[];
  recommendations?: string[];
  openQuestions?: string[];
};

export type Project = {
  id: string;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  shareToken?: string;
  S: ProjectState;
  pid?: number;
  oid?: number;
  spid?: number;
};

// A customer preserved in its own collection so it survives the hard-delete of
// the project it was added in. Shown alongside live (project-derived) customers.
export type ArchivedCustomer = {
  id: string;
  name?: string;
  email?: string;
  company?: string;
  role?: string;
  cohort?: ParticipantCohort;
  audience?: string;
  hasCSM?: boolean;
  csmName?: string;
  csmContact?: string;
  projects?: string[];
  archivedAt?: string;
};

export type SessionUser = {
  email: string;
  name: string;
};

export type FeatureRequestComment = {
  id: string;
  authorEmail: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type FeatureRequest = {
  id: string;
  title: string;
  body: string;
  status: "open" | "resolved";
  authorEmail: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  votes?: Record<string, 1 | -1>;
  comments?: FeatureRequestComment[];
};
