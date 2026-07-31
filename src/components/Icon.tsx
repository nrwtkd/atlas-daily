import type { ReactNode } from "react";

const icons: Record<string, ReactNode> = {
  today: <><path d="M5 8h14M8 3v3m8-3v3M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z"/><path d="m9 14 2 2 4-4"/></>,
  goal: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="m15 9 5-5M16 4h4v4"/></>,
  journey: <><path d="M4 19c2-5 5-7 8-7s5-2 8-7"/><circle cx="5" cy="18" r="2"/><circle cx="12" cy="12" r="2"/><path d="m18 4 2 1-1 2"/></>,
  data: <><path d="M12 3v12"/><path d="m8 11 4 4 4-4"/><path d="M5 19h14"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  arrow: <path d="m9 18 6-6-6-6"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  spark: <><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></>,
  flag: <><path d="M5 21V4"/><path d="M5 5h11l-2 4 2 4H5"/></>,
  calendar: <><path d="M5 8h14M8 3v3m8-3v3M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z"/></>,
  pause: <><path d="M9 6v12M15 6v12"/></>,
  play: <path d="m9 6 9 6-9 6Z"/>,
  trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13"/></>,
  undo: <><path d="M9 7 4 12l5 5"/><path d="M5 12h8a6 6 0 0 1 6 6"/></>
};

export default function Icon({ name, size = 20 }: { name: keyof typeof icons; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>;
}
