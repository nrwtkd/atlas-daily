import type { Goal, GoalStep, Milestone } from "./types";

export interface MascotStage {
  id: "seed" | "sprout" | "explorer" | "guardian";
  label: string;
  min: number;
  next: number | null;
  message: string;
}

export const mascotStages: MascotStage[] = [
  { id: "seed", label: "Teman Memulai", min: 0, next: 3, message: "Kita belum perlu berlari. Mari temukan arah dan satu langkah pertama." },
  { id: "sprout", label: "Teman Bertumbuh", min: 3, next: 8, message: "Langkah kecilmu mulai membentuk jalan yang nyata." },
  { id: "explorer", label: "Teman Menjelajah", min: 8, next: 15, message: "Kita sudah punya arah, ritme, dan keberanian untuk menyesuaikan." },
  { id: "guardian", label: "Penjaga Arah", min: 15, next: null, message: "Kamu tidak hanya mengejar target. Kamu sudah belajar mengarahkan hidupmu." }
];

export function getTodayKey(date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function getWeekKey(date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  const day = local.getDay() || 7;
  local.setDate(local.getDate() - day + 1);
  return local.toISOString().slice(0, 10);
}

export function getGoalMilestones(milestones: Milestone[], goalId: string): Milestone[] {
  return milestones.filter((item) => item.goalId === goalId).sort((a, b) => a.order - b.order);
}

export function getMilestoneSteps(steps: GoalStep[], milestoneId: string): GoalStep[] {
  return steps.filter((step) => step.milestoneId === milestoneId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getGoalSteps(steps: GoalStep[], goalId: string): GoalStep[] {
  return steps.filter((step) => step.goalId === goalId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getGoalProgress(goal: Goal, steps: GoalStep[]): number {
  const goalSteps = getGoalSteps(steps, goal.id);
  if (!goalSteps.length) return 0;
  return Math.round((goalSteps.filter((step) => step.completedAt).length / goalSteps.length) * 100);
}

export function getMilestoneProgress(milestone: Milestone, steps: GoalStep[]): number {
  const milestoneSteps = getMilestoneSteps(steps, milestone.id);
  if (!milestoneSteps.length) return 0;
  return Math.round((milestoneSteps.filter((step) => step.completedAt).length / milestoneSteps.length) * 100);
}

export function getActiveMilestone(goalId: string, milestones: Milestone[], steps: GoalStep[]): Milestone | undefined {
  return getGoalMilestones(milestones, goalId).find((milestone) => getMilestoneProgress(milestone, steps) < 100);
}

export function getNextStep(goalId: string, milestones: Milestone[], steps: GoalStep[]): GoalStep | undefined {
  const activeMilestone = getActiveMilestone(goalId, milestones, steps);
  if (!activeMilestone) return undefined;
  return getMilestoneSteps(steps, activeMilestone.id).find((step) => !step.completedAt);
}

export function getTodaySteps(steps: GoalStep[], dayKey = getTodayKey()): GoalStep[] {
  return steps.filter((step) => step.scheduledFor === dayKey && !step.completedAt);
}

export function getCompletedToday(steps: GoalStep[], dayKey = getTodayKey()): GoalStep[] {
  return steps.filter((step) => step.completedAt?.slice(0, 10) === dayKey);
}

export function getMascotStage(completedSteps: number): MascotStage {
  return [...mascotStages].reverse().find((stage) => completedSteps >= stage.min) ?? mascotStages[0];
}

export function getStageProgress(completedSteps: number, stage: MascotStage): number {
  if (stage.next === null) return 100;
  return Math.min(100, Math.round(((completedSteps - stage.min) / (stage.next - stage.min)) * 100));
}
