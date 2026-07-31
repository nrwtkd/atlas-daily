import { getTodayKey } from "../domain/dailyRules";
import type { AtlasDailyState, AtlasItem, Capacity, DailyCheckIn, ImportEnvelope, ItemStatus } from "../domain/types";
import type { AtlasDailyRepository } from "../storage/repository";

function now(): string {
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function assertState(input: unknown): asserts input is AtlasDailyState {
  if (!input || typeof input !== "object") throw new Error("Berkas tidak berisi data Atlas Daily.");
  const candidate = input as Partial<AtlasDailyState>;
  if (candidate.schemaVersion !== 1 || !candidate.profile || !Array.isArray(candidate.items) || !Array.isArray(candidate.checkIns)) {
    throw new Error("Format data Atlas Daily belum dikenali.");
  }
}

export class AtlasDailyService {
  constructor(private readonly repository: AtlasDailyRepository) {}

  async load(): Promise<AtlasDailyState | null> {
    return this.repository.load();
  }

  async createProfile(displayName: string): Promise<AtlasDailyState> {
    const timestamp = now();
    const state: AtlasDailyState = {
      schemaVersion: 1,
      profile: {
        localProfileId: makeId("profile"),
        displayName: displayName.trim() || "Kamu",
        createdAt: timestamp,
        updatedAt: timestamp
      },
      items: [],
      checkIns: [],
      lastUpdatedAt: timestamp,
      syncMetadata: {}
    };
    await this.repository.save(state);
    return state;
  }

  async save(state: AtlasDailyState): Promise<AtlasDailyState> {
    const updated: AtlasDailyState = { ...state, lastUpdatedAt: now() };
    await this.repository.save(updated);
    return updated;
  }

  createItems(lines: string[]): AtlasItem[] {
    const timestamp = now();
    return lines.map((text) => ({
      id: makeId("item"),
      text,
      status: "inbox",
      createdAt: timestamp,
      updatedAt: timestamp,
      source: "brain-dump"
    }));
  }

  moveItem(item: AtlasItem, status: ItemStatus): AtlasItem {
    const timestamp = now();
    const dayKey = getTodayKey();
    return {
      ...item,
      status,
      updatedAt: timestamp,
      plannedFor: status === "today" ? dayKey : undefined,
      completedAt: status === "done" ? timestamp : undefined,
      releasedAt: status === "released" ? timestamp : undefined
    };
  }

  setCapacity(state: AtlasDailyState, capacity: Capacity): AtlasDailyState {
    const timestamp = now();
    const dayKey = getTodayKey();
    const previous = state.checkIns.find((checkIn) => checkIn.date === dayKey);
    const checkIn: DailyCheckIn = previous
      ? { ...previous, capacity, updatedAt: timestamp }
      : {
          id: makeId("checkin"),
          date: dayKey,
          capacity,
          enoughNote: "",
          createdAt: timestamp,
          updatedAt: timestamp
        };
    return {
      ...state,
      checkIns: [checkIn, ...state.checkIns.filter((item) => item.date !== dayKey)]
    };
  }

  setEnoughNote(state: AtlasDailyState, enoughNote: string): AtlasDailyState {
    const timestamp = now();
    const dayKey = getTodayKey();
    const previous = state.checkIns.find((checkIn) => checkIn.date === dayKey);
    const checkIn: DailyCheckIn = previous
      ? { ...previous, enoughNote, updatedAt: timestamp }
      : {
          id: makeId("checkin"),
          date: dayKey,
          capacity: "cukup",
          enoughNote,
          createdAt: timestamp,
          updatedAt: timestamp
        };
    return {
      ...state,
      checkIns: [checkIn, ...state.checkIns.filter((item) => item.date !== dayKey)]
    };
  }

  exportState(state: AtlasDailyState): Blob {
    const envelope: ImportEnvelope = {
      product: "atlas-daily",
      exportedAt: now(),
      schemaVersion: 1,
      state
    };
    return new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" });
  }

  async importState(raw: string): Promise<AtlasDailyState> {
    const parsed = JSON.parse(raw) as Partial<ImportEnvelope> | AtlasDailyState;
    const candidate = "product" in parsed ? (parsed as Partial<ImportEnvelope>).state : parsed;
    assertState(candidate);
    await this.repository.save(candidate);
    return candidate;
  }

  async clear(): Promise<void> {
    await this.repository.clear();
  }
}
