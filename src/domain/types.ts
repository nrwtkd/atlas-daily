export type Capacity = "tipis" | "cukup" | "lapang";
export type ItemStatus = "inbox" | "today" | "later" | "done" | "released";
export type Screen = "today" | "dump" | "later" | "close" | "data";

export interface AtlasProfile {
  localProfileId: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AtlasItem {
  id: string;
  text: string;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
  plannedFor?: string;
  completedAt?: string;
  releasedAt?: string;
  source: "brain-dump" | "manual" | "carry-over";
}

export interface DailyCheckIn {
  id: string;
  date: string;
  capacity: Capacity;
  enoughNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface AtlasDailyState {
  schemaVersion: 1;
  profile: AtlasProfile;
  items: AtlasItem[];
  checkIns: DailyCheckIn[];
  lastUpdatedAt: string;
  syncMetadata: {
    remoteUserId?: string;
    lastSyncedAt?: string;
  };
}

export interface ImportEnvelope {
  product: "atlas-daily";
  exportedAt: string;
  schemaVersion: 1;
  state: AtlasDailyState;
}
