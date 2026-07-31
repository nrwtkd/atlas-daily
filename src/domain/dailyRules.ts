import type { Goal, GoalStep } from "./types";

export interface MascotStage {
  id: "seed" | "sprout" | "explorer" | "guardian";
  label: string;
  min: number;
  next: number | null;
  message: string;
}

export const mascotStages: MascotStage[] = [
  { id: "seed", label: "Benih Pemberani", min: 0, next: 3, message: "Kita mulai kecil. Satu langkah pun sudah membuatku tumbuh." },
  { id: "sprout", label: "Tunas Gigih", min: 3, next: 8, message: "Lihat, aku mulai bertunas karena langkah-langkahmu." },
  { id: "explorer", label: "Penjelajah", min: 8, next: 15, message: "Kita sudah punya bekal. Ayo terus berjalan ke tujuanmu." },
  { id: "guardian", label: "Penjaga Impian", min: 15, next: null, message: "Aku tumbuh bersama keberanianmu menjaga mimpi." }
];

export function getTodayKey(date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function getGoalSteps(steps: GoalStep[], goalId: string): GoalStep[] {
  return steps
    .filter((step) => step.goalId === goalId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getGoalProgress(goal: Goal, steps: GoalStep[]): number {
  const goalSteps = getGoalSteps(steps, goal.id);
  if (!goalSteps.length) return 0;
  return Math.round((goalSteps.filter((step) => step.completedAt).length / goalSteps.length) * 100);
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
