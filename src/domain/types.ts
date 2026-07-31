export type Screen = "today" | "plan" | "coach" | "journey" | "data";
export type GoalStatus = "active" | "paused" | "completed";
export type GoalCategory = "health" | "learning" | "career" | "finance" | "business" | "family" | "spiritual" | "personal" | "custom";
export type StepSize = "minimum" | "steady" | "stretch";
export type ReviewDecision = "continue" | "shrink" | "shift" | "pause";

export interface AtlasProfile {
  localProfileId: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  category: GoalCategory;
  title: string;
  desire: string;
  why: string;
  currentReality: string;
  successEvidence: string;
  targetDate?: string;
  weeklyMinutes: number;
  obstacle: string;
  strategy: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  proof: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoalStep {
  id: string;
  goalId: string;
  milestoneId: string;
  title: string;
  minimumVersion: string;
  steadyVersion: string;
  stretchVersion: string;
  selectedSize?: StepSize;
  scheduledFor?: string;
  trigger?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalReview {
  id: string;
  goalId: string;
  weekKey: string;
  obstacle: string;
  decision: ReviewDecision;
  note: string;
  createdAt: string;
}

export interface AtlasDailyState {
  schemaVersion: 3;
  profile: AtlasProfile;
  goals: Goal[];
  milestones: Milestone[];
  steps: GoalStep[];
  reviews: GoalReview[];
  lastUpdatedAt: string;
  syncMetadata: {
    remoteUserId?: string;
    lastSyncedAt?: string;
  };
}

export interface ImportEnvelope {
  product: "atlas-daily";
  exportedAt: string;
  schemaVersion: 3;
  state: AtlasDailyState;
}
