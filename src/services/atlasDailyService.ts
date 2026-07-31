import { getGoalSteps, getTodayKey } from "../domain/dailyRules";
import type { AtlasDailyState, Goal, GoalStep, ImportEnvelope } from "../domain/types";
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
  if (candidate.schemaVersion !== 2 || !candidate.profile || !Array.isArray(candidate.goals) || !Array.isArray(candidate.steps)) {
    throw new Error("Format data Atlas Daily belum dikenali.");
  }
}

export class AtlasDailyService {
  constructor(private readonly repository: AtlasDailyRepository) {}

  async load(): Promise<AtlasDailyState | null> {
    const loaded = await this.repository.load();
    if (!loaded) return null;
    if ((loaded as AtlasDailyState).schemaVersion === 2 && Array.isArray((loaded as AtlasDailyState).goals)) return loaded;

    const legacy = loaded as unknown as { profile?: AtlasDailyState["profile"] };
    const timestamp = now();
    const migrated: AtlasDailyState = {
      schemaVersion: 2,
      profile: legacy.profile ?? {
        localProfileId: makeId("profile"),
        displayName: "Kamu",
        createdAt: timestamp,
        updatedAt: timestamp
      },
      goals: [],
      steps: [],
      lastUpdatedAt: timestamp,
      syncMetadata: {}
    };
    await this.repository.save(migrated);
    return migrated;
  }

  async createProfile(displayName: string): Promise<AtlasDailyState> {
    const timestamp = now();
    const state: AtlasDailyState = {
      schemaVersion: 2,
      profile: {
        localProfileId: makeId("profile"),
        displayName: displayName.trim() || "Kamu",
        createdAt: timestamp,
        updatedAt: timestamp
      },
      goals: [],
      steps: [],
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

  createGoal(state: AtlasDailyState, input: { title: string; why: string; targetDate?: string; steps: string[] }): AtlasDailyState {
    const timestamp = now();
    const goal: Goal = {
      id: makeId("goal"),
      title: input.title.trim(),
      why: input.why.trim(),
      targetDate: input.targetDate || undefined,
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp
    };
    const steps: GoalStep[] = input.steps.filter(Boolean).map((title) => ({
      id: makeId("step"),
      goalId: goal.id,
      title: title.trim(),
      createdAt: timestamp,
      updatedAt: timestamp
    }));
    return { ...state, goals: [goal, ...state.goals], steps: [...steps, ...state.steps] };
  }

  addStep(state: AtlasDailyState, goalId: string, title: string, scheduleToday = false): AtlasDailyState {
    const timestamp = now();
    const step: GoalStep = {
      id: makeId("step"),
      goalId,
      title: title.trim(),
      scheduledFor: scheduleToday ? getTodayKey() : undefined,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    return {
      ...state,
      goals: state.goals.map((goal) => goal.id === goalId ? { ...goal, status: "active", completedAt: undefined, updatedAt: timestamp } : goal),
      steps: [step, ...state.steps]
    };
  }

  scheduleStep(state: AtlasDailyState, stepId: string, scheduled = true): AtlasDailyState {
    const timestamp = now();
    return {
      ...state,
      steps: state.steps.map((step) => step.id === stepId ? {
        ...step,
        scheduledFor: scheduled ? getTodayKey() : undefined,
        updatedAt: timestamp
      } : step)
    };
  }

  completeStep(state: AtlasDailyState, stepId: string): AtlasDailyState {
    const timestamp = now();
    const target = state.steps.find((step) => step.id === stepId);
    if (!target) return state;
    const nextSteps = state.steps.map((step) => step.id === stepId ? {
      ...step,
      completedAt: step.completedAt ? undefined : timestamp,
      scheduledFor: step.completedAt ? step.scheduledFor : undefined,
      updatedAt: timestamp
    } : step);
    const goalSteps = getGoalSteps(nextSteps, target.goalId);
    const allDone = goalSteps.length > 0 && goalSteps.every((step) => step.completedAt);
    return {
      ...state,
      steps: nextSteps,
      goals: state.goals.map((goal) => goal.id === target.goalId ? {
        ...goal,
        status: allDone ? "completed" : "active",
        completedAt: allDone ? timestamp : undefined,
        updatedAt: timestamp
      } : goal)
    };
  }

  updateGoalStatus(state: AtlasDailyState, goalId: string, status: Goal["status"]): AtlasDailyState {
    const timestamp = now();
    return {
      ...state,
      goals: state.goals.map((goal) => goal.id === goalId ? {
        ...goal,
        status,
        completedAt: status === "completed" ? timestamp : undefined,
        updatedAt: timestamp
      } : goal)
    };
  }

  exportState(state: AtlasDailyState): Blob {
    const envelope: ImportEnvelope = {
      product: "atlas-daily",
      exportedAt: now(),
      schemaVersion: 2,
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
