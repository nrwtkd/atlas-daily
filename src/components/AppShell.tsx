import type { ReactNode } from "react";
import type { Screen } from "../domain/types";
import Icon from "./Icon";

const navItems: Array<{ id: Screen; label: string; icon: "today" | "goal" | "journey" | "data" }> = [
  { id: "today", label: "Hari Ini", icon: "today" },
  { id: "goals", label: "Goals", icon: "goal" },
  { id: "journey", label: "Perjalanan", icon: "journey" },
  { id: "data", label: "Data Saya", icon: "data" }
];

export default function AppShell({ name, screen, onNavigate, children }: {
  name: string;
  screen: Screen;
  onNavigate: (screen: Screen) => void;
  children: ReactNode;
}) {
  return (
    <div className="appShell">
      <aside className="sidebar">
        <button className="brand" onClick={() => onNavigate("today")} type="button">
          <span className="brandMark"><Icon name="spark" size={22}/></span>
          <span><strong>Atlas Daily</strong><small>small steps, real progress</small></span>
        </button>
        <nav className="navList" aria-label="Navigasi utama">
          {navItems.map((item) => (
            <button key={item.id} type="button" className={screen === item.id ? "navItem active" : "navItem"} onClick={() => onNavigate(item.id)}>
              <Icon name={item.icon} size={19}/><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebarNote"><Icon name="flag" size={18}/><p>Goal besar tidak harus dikerjakan sekaligus. Kita hanya perlu langkah berikutnya.</p></div>
        <div className="profileChip"><span>{name.slice(0, 1).toUpperCase()}</span><div><strong>{name}</strong><small>bertumbuh bersama Tala</small></div></div>
      </aside>
      <main className="content">{children}</main>
      <nav className="mobileNav" aria-label="Navigasi utama seluler">
        {navItems.map((item) => (
          <button key={item.id} type="button" className={screen === item.id ? "active" : ""} onClick={() => onNavigate(item.id)}>
            <Icon name={item.icon} size={20}/><span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
