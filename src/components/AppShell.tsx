import type { ReactNode } from "react";
import type { Screen } from "../domain/types";
import Icon from "./Icon";

const navItems: Array<{ id: Screen; label: string; mobileLabel: string; icon: "today" | "goal" | "spark" | "journey" | "data" }> = [
  { id: "today", label: "Hari Ini", mobileLabel: "Hari", icon: "today" },
  { id: "plan", label: "Tujuanku", mobileLabel: "Tujuan", icon: "goal" },
  { id: "coach", label: "Susun Tujuan", mobileLabel: "Susun", icon: "spark" },
  { id: "journey", label: "Perjalananku", mobileLabel: "Progres", icon: "journey" },
  { id: "data", label: "Data Saya", mobileLabel: "Data", icon: "data" }
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
          <span><strong>Atlas Daily</strong><small>tujuan besar, langkah manusiawi</small></span>
        </button>
        <nav className="navList" aria-label="Navigasi utama">
          {navItems.map((item) => (
            <button key={item.id} type="button" className={screen === item.id ? "navItem active" : "navItem"} onClick={() => onNavigate(item.id)}>
              <Icon name={item.icon} size={19}/><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebarNote"><Icon name="flag" size={18}/><p>Kamu tidak perlu pandai merencanakan. Atlas akan membantumu menemukan arah dan langkah berikutnya.</p></div>
        <div className="profileChip"><span>{name.slice(0, 1).toUpperCase()}</span><div><strong>{name}</strong><small>mulai dari kondisi hari ini</small></div></div>
      </aside>
      <main className="content">{children}</main>
      <nav className="mobileNav" aria-label="Navigasi utama seluler">
        {navItems.map((item) => (
          <button key={item.id} type="button" className={screen === item.id ? "active" : ""} onClick={() => onNavigate(item.id)}>
            <Icon name={item.icon} size={19}/><span>{item.mobileLabel}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
