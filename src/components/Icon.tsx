import type { ReactNode } from "react";

const icons: Record<string, ReactNode> = {
  today: <><path d="M5 8h14M8 3v3m8-3v3M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z"/><path d="m9 14 2 2 4-4"/></>,
  dump: <><path d="M5 4h14v12H8l-3 3V4Z"/><path d="M8 8h8M8 12h5"/></>,
  later: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  close: <><path d="M4 12a8 8 0 1 0 8-8"/><path d="M4 4v5h5"/><path d="m9 13 2 2 4-5"/></>,
  data: <><path d="M12 3v12"/><path d="m8 11 4 4 4-4"/><path d="M5 19h14"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  arrow: <path d="m9 18 6-6-6-6"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  leaf: <><path d="M5 19c1-8 5-13 14-14-1 9-6 13-14 14Z"/><path d="M7 17c3-3 6-6 10-9"/></>,
  spark: <><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13"/></>,
  undo: <><path d="M9 7 4 12l5 5"/><path d="M5 12h8a6 6 0 0 1 6 6"/></>
};

export default function Icon({ name, size = 20 }: { name: keyof typeof icons; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}
