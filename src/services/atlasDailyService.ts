import { getGoalMilestones, getGoalSteps, getTodayKey, getWeekKey } from "../domain/dailyRules";
import type { MilestoneTemplate } from "../domain/goalTemplates";
import type {
  AtlasDailyState,
  Goal,
  GoalReview,
  GoalStep,
  ImportEnvelope,
  Milestone,
  ReviewDecision,
  StepSize
} from "../domain/types";
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
  if (candidate.schemaVersion !== 3 || !candidate.profile || !Array.isArray(candidate.goals) || !Array.isArray(candidate.milestones) || !Array.isArray(candidate.steps)) {
    throw new Error("Format data Atlas Daily belum dikenali.");
  }
}

function legacyProfile(input: unknown): AtlasDailyState["profile"] | undefined {
  if (!input || typeof input !== "object") return undefined;
  return (input as { profile?: AtlasDailyState["profile"] }).profile;
}

export class AtlasDailyService {
  constructor(private readonly repository: AtlasDailyRepository) {}

  async load(): Promise<AtlasDailyState | null> {
    const loaded = await this.repository.load();
    if (!loaded) return null;
    const raw = loaded as unknown as Record<string, unknown>;
    if (raw.schemaVersion === 3 && Array.isArray(raw.goals) && Array.isArray(raw.milestones) && Array.isArray(raw.steps)) {
      return loaded as AtlasDailyState;
    }

    const timestamp = now();
    const migrated: AtlasDailyState = {
      schemaVersion: 3,
      profile: legacyProfile(loaded) ?? {
        localProfileId: makeId("profile"),
        displayName: "Kamu",
        createdAt: timestamp,
        updatedAt: timestamp
      },
      goals: [],
      milestones: [],
      steps: [],
      reviews: [],
      lastUpdatedAt: timestamp,
      syncMetadata: {}
    };

    if (raw.schemaVersion === 2 && Array.isArray(raw.goals) && Array.isArray(raw.steps)) {
      const oldGoals = raw.goals as Array<Record<string, unknown>>;
      const oldSteps = raw.steps as Array<Record<string, unknown>>;
      for (const oldGoal of oldGoals) {
        const goalId = String(oldGoal.id ?? makeId("goal"));
        migrated.goals.push({
          id: goalId,
          category: "custom",
          title: String(oldGoal.title ?? "Tujuan lama"),
          desire: String(oldGoal.title ?? "Tujuan lama"),
          why: String(oldGoal.why ?? ""),
          currentReality: "",
          successEvidence: String(oldGoal.title ?? "Tujuan tercapai"),
          targetDate: typeof oldGoal.targetDate === "string" ? oldGoal.targetDate : undefined,
          weeklyMinutes: 120,
          obstacle: "",
          strategy: "",
          status: oldGoal.status === "paused" || oldGoal.status === "completed" ? oldGoal.status : "active",
          createdAt: String(oldGoal.createdAt ?? timestamp),
          updatedAt: String(oldGoal.updatedAt ?? timestamp),
          completedAt: typeof oldGoal.completedAt === "string" ? oldGoal.completedAt : undefined
        });
        const milestoneId = makeId("milestone");
        migrated.milestones.push({
          id: milestoneId,
          goalId,
          title: "Rencana awal",
          proof: "Langkah-langkah awal untuk tujuan ini sudah diselesaikan.",
          order: 0,
          createdAt: timestamp,
          updatedAt: timestamp
        });
        oldSteps.filter((step) => String(step.goalId) === goalId).forEach((oldStep) => {
          const title = String(oldStep.title ?? "Langkah berikutnya");
          migrated.steps.push({
            id: String(oldStep.id ?? makeId("step")),
            goalId,
            milestoneId,
            title,
            minimumVersion: `Mulai 10 menit: ${title}`,
            steadyVersion: title,
            stretchVersion: `Selesaikan ${title} dan catat hasilnya.`,
            selectedSize: oldStep.scheduledFor ? "steady" : undefined,
            scheduledFor: typeof oldStep.scheduledFor === "string" ? oldStep.scheduledFor : undefined,
            completedAt: typeof oldStep.completedAt === "string" ? oldStep.completedAt : undefined,
            createdAt: String(oldStep.createdAt ?? timestamp),
            updatedAt: String(oldStep.updatedAt ?? timestamp)
          });
        });
      }
    }

    await this.repository.save(migrated);
    return migrated;
  }

  async createProfile(displayName: string): Promise<AtlasDailyState> {
    const timestamp = now();
    const state: AtlasDailyState = {
      schemaVersion: 3,
      profile: {
        localProfileId: makeId("profile"),
        displayName: displayName.trim() || "Kamu",
        createdAt: timestamp,
        updatedAt: timestamp
      },
      goals: [],
      milestones: [],
      steps: [],
      reviews: [],
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

  createGoal(state: AtlasDailyState, input: {
    category: Goal["category"];
    desire: string;
    why: string;
    currentReality: string;
    successEvidence: string;
    targetDate?: string;
    weeklyMinutes: number;
    obstacle: string;
    strategy: string;
    milestones: MilestoneTemplate[];
  }): AtlasDailyState {
    const timestamp = now();
    const goalId = makeId("goal");
    const title = input.desire.trim();
    const goal: Goal = {
      id: goalId,
      category: input.category,
      title,
      desire: title,
      why: input.why.trim(),
      currentReality: input.currentReality.trim(),
      successEvidence: input.successEvidence.trim(),
      targetDate: input.targetDate || undefined,
      weeklyMinutes: input.weeklyMinutes,
      obstacle: input.obstacle.trim(),
      strategy: input.strategy.trim(),
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const milestones: Milestone[] = [];
    const steps: GoalStep[] = [];
    input.milestones.forEach((template, milestoneIndex) => {
      const milestoneId = makeId("milestone");
      milestones.push({
        id: milestoneId,
        goalId,
        title: template.title,
        proof: template.proof,
        order: milestoneIndex,
        createdAt: timestamp,
        updatedAt: timestamp
      });
      template.steps.forEach((stepTemplate, stepIndex) => {
        steps.push({
          id: makeId("step"),
          goalId,
          milestoneId,
          title: stepTemplate.title,
          minimumVersion: stepTemplate.minimum,
          steadyVersion: stepTemplate.steady,
          stretchVersion: stepTemplate.stretch,
          selectedSize: milestoneIndex === 0 && stepIndex === 0 ? "minimum" : undefined,
          scheduledFor: milestoneIndex === 0 && stepIndex === 0 ? getTodayKey() : undefined,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      });
    });

    return {
      ...state,
      goals: [goal, ...state.goals],
      milestones: [...milestones, ...state.milestones],
      steps: [...steps, ...state.steps]
    };
  }

  scheduleStep(state: AtlasDailyState, stepId: string, size: StepSize, scheduled = true): AtlasDailyState {
    const timestamp = now();
    return {
      ...state,
      steps: state.steps.map((step) => step.id === stepId ? {
        ...step,
        selectedSize: scheduled ? size : undefined,
        scheduledFor: scheduled ? getTodayKey() : undefined,
        updatedAt: timestamp
      } : step)
    };
  }

  setStepTrigger(state: AtlasDailyState, stepId: string, trigger: string): AtlasDailyState {
    const timestamp = now();
    return {
      ...state,
      steps: state.steps.map((step) => step.id === stepId ? { ...step, trigger: trigger.trim(), updatedAt: timestamp } : step)
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
    const allDone = getGoalSteps(nextSteps, target.goalId).every((step) => step.completedAt);
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

  addCustomStep(state: AtlasDailyState, goalId: string, milestoneId: string, title: string): AtlasDailyState {
    const timestamp = now();
    const cleanTitle = title.trim();
    const step: GoalStep = {
      id: makeId("step"),
      goalId,
      milestoneId,
      title: cleanTitle,
      minimumVersion: `Mulai 10 menit: ${cleanTitle}`,
      steadyVersion: cleanTitle,
      stretchVersion: `Selesaikan ${cleanTitle} dan catat hasilnya.`,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    return { ...state, steps: [...state.steps, step] };
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

  reviewGoal(state: AtlasDailyState, goalId: string, input: { obstacle: string; decision: ReviewDecision; note: string }): AtlasDailyState {
    const timestamp = now();
    const review: GoalReview = {
      id: makeId("review"),
      goalId,
      weekKey: getWeekKey(),
      obstacle: input.obstacle,
      decision: input.decision,
      note: input.note.trim(),
      createdAt: timestamp
    };
    const nextStatus = input.decision === "pause" ? "paused" : "active";
    return {
      ...state,
      reviews: [review, ...state.reviews],
      goals: state.goals.map((goal) => goal.id === goalId ? {
        ...goal,
        status: nextStatus,
        updatedAt: timestamp
      } : goal)
    };
  }

  exportState(state: AtlasDailyState): Blob {
    const envelope: ImportEnvelope = {
      product: "atlas-daily",
      exportedAt: now(),
      schemaVersion: 3,
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
