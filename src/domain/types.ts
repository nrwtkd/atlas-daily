export type Screen = "today" | "goals" | "journey" | "data";
export type GoalStatus = "active" | "paused" | "completed";

export interface AtlasProfile {
  localProfileId: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  why: string;
  targetDate?: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface GoalStep {
  id: string;
  goalId: string;
  title: string;
  scheduledFor?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AtlasDailyState {
  schemaVersion: 2;
  profile: AtlasProfile;
  goals: Goal[];
  steps: GoalStep[];
  lastUpdatedAt: string;
  syncMetadata: {
    remoteUserId?: string;
    lastSyncedAt?: string;
  };
}

export interface ImportEnvelope {
  product: "atlas-daily";
  exportedAt: string;
  schemaVersion: 2;
  state: AtlasDailyState;
}
