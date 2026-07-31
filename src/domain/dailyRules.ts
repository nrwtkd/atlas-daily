import type { AtlasItem, Capacity } from "./types";

export const capacityCopy: Record<Capacity, { label: string; description: string; limit: number }> = {
  tipis: {
    label: "Energi tipis",
    description: "Satu hal penting sudah cukup.",
    limit: 1
  },
  cukup: {
    label: "Energi cukup",
    description: "Pegang paling banyak tiga fokus.",
    limit: 3
  },
  lapang: {
    label: "Energi lapang",
    description: "Tetap tiga fokus; sisanya bonus, bukan kewajiban.",
    limit: 3
  }
};

export function getTodayKey(date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function getTodayItems(items: AtlasItem[], dayKey = getTodayKey()): AtlasItem[] {
  return items
    .filter((item) => item.status === "today" && item.plannedFor === dayKey)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getDoneToday(items: AtlasItem[], dayKey = getTodayKey()): AtlasItem[] {
  return items
    .filter((item) => item.status === "done" && item.completedAt?.slice(0, 10) === dayKey)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
}

export function splitBrainDump(raw: string): string[] {
  return Array.from(new Set(
    raw
      .split(/\n|•|;/)
      .map((item) => item.replace(/^[-–—\d.)\s]+/, "").trim())
      .filter((item) => item.length >= 2)
  ));
}
