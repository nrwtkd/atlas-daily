import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import AppShell from "./components/AppShell";
import Icon from "./components/Icon";
import Mascot from "./components/Mascot";
import Onboarding from "./components/Onboarding";
import {
  getCompletedToday,
  getGoalProgress,
  getGoalSteps,
  getMascotStage,
  getStageProgress,
  getTodayKey,
  getTodaySteps,
  mascotStages
} from "./domain/dailyRules";
import type { AtlasDailyState, Goal, GoalStep, Screen } from "./domain/types";
import { AtlasDailyService } from "./services/atlasDailyService";
import { IndexedDbAtlasDailyRepository } from "./storage/indexedDbRepository";
import "./styles.css";

const service = new AtlasDailyService(new IndexedDbAtlasDailyRepository());

function formatLongDate(): string {
  return new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
}

function goalById(state: AtlasDailyState, id: string): Goal | undefined {
  return state.goals.find((goal) => goal.id === id);
}

function App() {
  const [state, setState] = useState<AtlasDailyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>("today");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    service.load().then(setState).finally(() => setLoading(false));
  }, []);

  async function persist(next: AtlasDailyState) {
    const saved = await service.save(next);
    setState(saved);
  }

  if (loading) return <div className="loadingPage"><span className="onboardingLogo"><Icon name="spark" size={28}/></span><p>Menyiapkan perjalananmu…</p></div>;
  if (!state) return <Onboarding onCreate={async (name) => setState(await service.createProfile(name))}/>;

  return (
    <AppShell name={state.profile.displayName} screen={screen} onNavigate={(next) => { setNotice(""); setScreen(next); }}>
      {notice && <div className="notice"><Icon name="spark" size={18}/><span>{notice}</span></div>}
      {screen === "today" && <TodayScreen state={state} persist={persist} onNavigate={setScreen} setNotice={setNotice}/>} 
      {screen === "goals" && <GoalsScreen state={state} persist={persist} setNotice={setNotice}/>} 
      {screen === "journey" && <JourneyScreen state={state}/>} 
      {screen === "data" && <DataScreen state={state} persist={persist} onReset={() => setState(null)}/>} 
    </AppShell>
  );
}

function PageHeader({ eyebrow, title, text, action }: { eyebrow: string; title: string; text: string; action?: ReactNode }) {
  return <header className="pageHeader"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{text}</p></div>{action}</header>;
}

function TodayScreen({ state, persist, onNavigate, setNotice }: {
  state: AtlasDailyState;
  persist: (state: AtlasDailyState) => Promise<void>;
  onNavigate: (screen: Screen) => void;
  setNotice: (message: string) => void;
}) {
  const todaySteps = getTodaySteps(state.steps);
  const completedToday = getCompletedToday(state.steps);
  const totalCompleted = state.steps.filter((step) => step.completedAt).length;
  const stage = getMascotStage(totalCompleted);
  const stageProgress = getStageProgress(totalCompleted, stage);
  const activeGoals = state.goals.filter((goal) => goal.status === "active");
  const backlog = state.steps.filter((step) => !step.completedAt && !step.scheduledFor && goalById(state, step.goalId)?.status === "active");
  const [quickGoalId, setQuickGoalId] = useState(activeGoals[0]?.id ?? "");
  const [quickTitle, setQuickTitle] = useState("");

  useEffect(() => {
    if (!quickGoalId && activeGoals[0]) setQuickGoalId(activeGoals[0].id);
  }, [activeGoals, quickGoalId]);

  async function complete(step: GoalStep) {
    await persist(service.completeStep(state, step.id));
    setNotice("Langkah selesai! Tala ikut tumbuh bersamamu. ✨");
  }

  async function schedule(step: GoalStep) {
    await persist(service.scheduleStep(state, step.id));
    setNotice("Langkah ini sudah dibawa ke hari ini.");
  }

  async function addQuick(event: FormEvent) {
    event.preventDefault();
    if (!quickGoalId || !quickTitle.trim()) return;
    await persist(service.addStep(state, quickGoalId, quickTitle, true));
    setQuickTitle("");
    setNotice("Langkah kecilmu sudah masuk ke hari ini.");
  }

  if (!state.goals.length) {
    return (
      <div className="pageWrap">
        <PageHeader eyebrow={formatLongDate()} title={`Halo, ${state.profile.displayName}.`} text="Hari ini kita mulai dari satu tujuan yang benar-benar ingin kamu dekati."/>
        <section className="firstGoalHero">
          <div className="firstGoalMascot"><Mascot stage={stage}/></div>
          <div><p className="sectionKicker">KENALAN DENGAN TALA</p><h2>Ia akan tumbuh setiap kali kamu mengambil langkah nyata.</h2><p>Bukan karena kamu sempurna setiap hari, tetapi karena kamu terus kembali pada tujuanmu.</p><button className="primaryButton" onClick={() => onNavigate("goals")}>Buat goal pertamaku <Icon name="arrow" size={17}/></button></div>
        </section>
      </div>
    );
  }

  return (
    <div className="pageWrap">
      <PageHeader eyebrow={formatLongDate()} title={`Halo, ${state.profile.displayName}.`} text="Tidak perlu mengerjakan seluruh goal-mu hari ini. Pilih langkah yang membuatmu benar-benar bergerak." action={<button className="softButton" onClick={() => onNavigate("goals")}><Icon name="goal" size={17}/> Kelola goals</button>}/>

      <section className="mascotHero">
        <div className="mascotStage"><Mascot stage={stage} celebrating={completedToday.length > 0}/></div>
        <div className="mascotCopy">
          <p className="sectionKicker">TALA · {stage.label.toUpperCase()}</p>
          <h2>{completedToday.length ? `Yey! ${completedToday.length} langkah selesai hari ini.` : stage.message}</h2>
          <p>{stage.next === null ? "Tala sudah mencapai tahap tertinggi, tetapi perjalananmu tetap terus bertumbuh." : `${stage.next - totalCompleted} langkah lagi sampai Tala berevolusi ke tahap berikutnya.`}</p>
          <div className="levelRow"><div className="levelTrack"><span style={{ width: `${stageProgress}%` }}/></div><strong>{totalCompleted} langkah</strong></div>
        </div>
        <div className="todayScore"><span>{completedToday.length}</span><small>langkah selesai<br/>hari ini</small></div>
      </section>

      <div className="dashboardGrid">
        <section className="card todayCard">
          <div className="cardHeader"><div><p className="sectionKicker">LANGKAH HARI INI</p><h2>{todaySteps.length ? `${todaySteps.length} langkah yang sedang dibawa` : "Hari ini masih kosong"}</h2></div><span className="countPill">{todaySteps.length}/3 ideal</span></div>
          {todaySteps.length ? <div className="todayList">{todaySteps.map((step) => {
            const goal = goalById(state, step.goalId);
            return <article className="todayStep" key={step.id}><button className="checkButton" onClick={() => void complete(step)} aria-label={`Selesaikan ${step.title}`}><Icon name="check" size={18}/></button><div><small>{goal?.title ?? "Goal"}</small><p>{step.title}</p></div></article>;
          })}</div> : <div className="emptyState compact"><span><Icon name="flag" size={27}/></span><h3>Pilih satu langkah kecil.</h3><p>Satu langkah yang selesai lebih berguna daripada daftar panjang yang hanya menunggu.</p></div>}

          {activeGoals.length > 0 && <form className="quickStepForm" onSubmit={addQuick}><select value={quickGoalId} onChange={(event) => setQuickGoalId(event.target.value)}>{activeGoals.map((goal) => <option value={goal.id} key={goal.id}>{goal.title}</option>)}</select><input value={quickTitle} onChange={(event) => setQuickTitle(event.target.value)} placeholder="Langkah kecil apa yang bisa dilakukan hari ini?"/><button className="primaryButton" disabled={!quickTitle.trim()}><Icon name="plus" size={16}/> Tambah</button></form>}
        </section>

        <aside className="sideStack">
          <section className="card goalPulse"><p className="sectionKicker">GOAL YANG SEDANG BERJALAN</p>{activeGoals.slice(0, 3).map((goal) => { const progress = getGoalProgress(goal, state.steps); return <div className="miniGoal" key={goal.id}><div><strong>{goal.title}</strong><span>{progress}%</span></div><div className="progressTrack"><span style={{ width: `${progress}%` }}/></div></div>; })}<button className="textButton" onClick={() => onNavigate("goals")}>Lihat semua goals <Icon name="arrow" size={15}/></button></section>
        </aside>
      </div>

      {backlog.length > 0 && <section className="nextStepSection"><div className="sectionHeading"><div><p className="sectionKicker">BUTUH IDE LANGKAH?</p><h2>Ambil dari rencana goal-mu</h2></div><p>Pilih satu saja. Kamu bisa kembali lagi nanti.</p></div><div className="suggestionGrid">{backlog.slice(0, 6).map((step) => <article className="suggestionCard" key={step.id}><small>{goalById(state, step.goalId)?.title}</small><p>{step.title}</p><button onClick={() => void schedule(step)}><Icon name="plus" size={15}/> Bawa hari ini</button></article>)}</div></section>}
    </div>
  );
}

function GoalsScreen({ state, persist, setNotice }: {
  state: AtlasDailyState;
  persist: (state: AtlasDailyState) => Promise<void>;
  setNotice: (message: string) => void;
}) {
  const [showCreate, setShowCreate] = useState(state.goals.length === 0);
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [stepsRaw, setStepsRaw] = useState("");
  const [newStep, setNewStep] = useState<Record<string, string>>({});

  async function createGoal(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    const steps = stepsRaw.split(/\n|;/).map((item) => item.trim()).filter(Boolean);
    await persist(service.createGoal(state, { title, why, targetDate, steps }));
    setTitle(""); setWhy(""); setTargetDate(""); setStepsRaw(""); setShowCreate(false);
    setNotice("Goal dibuat. Sekarang ia punya jalan yang bisa kamu tempuh sedikit demi sedikit.");
  }

  async function addStep(goalId: string) {
    const value = newStep[goalId]?.trim();
    if (!value) return;
    await persist(service.addStep(state, goalId, value));
    setNewStep((current) => ({ ...current, [goalId]: "" }));
    setNotice("Langkah baru ditambahkan.");
  }

  async function toggleStep(step: GoalStep) {
    await persist(service.completeStep(state, step.id));
    setNotice(step.completedAt ? "Langkah dibuka kembali." : "Progres bertambah! Tala senang melihatmu bergerak.");
  }

  async function schedule(step: GoalStep) {
    await persist(service.scheduleStep(state, step.id, step.scheduledFor !== getTodayKey()));
    setNotice(step.scheduledFor === getTodayKey() ? "Langkah dikeluarkan dari hari ini." : "Langkah dibawa ke hari ini.");
  }

  async function changeStatus(goal: Goal) {
    const next = goal.status === "paused" ? "active" : "paused";
    await persist(service.updateGoalStatus(state, goal.id, next));
    setNotice(next === "paused" ? "Goal dijeda. Tidak hilang, hanya tidak sedang dikejar." : "Goal aktif kembali.");
  }

  return (
    <div className="pageWrap">
      <PageHeader eyebrow="GOALS" title="Arah yang ingin kamu dekati." text="Goal bukan daftar harapan. Di sini setiap goal punya langkah nyata yang bisa dibawa ke hari ini." action={<button className="primaryButton" onClick={() => setShowCreate((value) => !value)}><Icon name="plus" size={17}/> Goal baru</button>}/>

      {showCreate && <form className="card goalForm" onSubmit={createGoal}><div className="formHeader"><div><p className="sectionKicker">GOAL BARU</p><h2>Apa yang ingin benar-benar kamu wujudkan?</h2></div></div><label>Nama goal<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Contoh: Lulus UKOM dengan hasil terbaik" autoFocus/></label><div className="formTwo"><label>Kenapa ini penting?<input value={why} onChange={(event) => setWhy(event.target.value)} placeholder="Alasan yang ingin kamu ingat"/></label><label>Target waktu, opsional<input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)}/></label></div><label>Langkah awal, satu per baris<textarea rows={5} value={stepsRaw} onChange={(event) => setStepsRaw(event.target.value)} placeholder={`Baca kisi-kisi terbaru\nLatihan 30 soal\nReview materi yang masih lemah`}/></label><div className="formFooter"><p>Tidak harus lengkap. Langkah baru bisa ditambahkan kapan saja.</p><button className="primaryButton" disabled={!title.trim()}>Buat goal <Icon name="arrow" size={16}/></button></div></form>}

      <div className="goalGrid">{state.goals.map((goal) => {
        const steps = getGoalSteps(state.steps, goal.id);
        const progress = getGoalProgress(goal, state.steps);
        return <article className={`card goalCard ${goal.status}`} key={goal.id}>
          <div className="goalCardTop"><div><div className="goalStatus"><span/>{goal.status === "active" ? "Aktif" : goal.status === "paused" ? "Dijeda" : "Selesai"}</div><h2>{goal.title}</h2>{goal.why && <p>{goal.why}</p>}</div><strong className="goalPercent">{progress}%</strong></div>
          <div className="progressTrack large"><span style={{ width: `${progress}%` }}/></div>
          <div className="goalMeta"><span>{steps.filter((step) => step.completedAt).length}/{steps.length} langkah selesai</span>{goal.targetDate && <span><Icon name="calendar" size={14}/> {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${goal.targetDate}T00:00:00`))}</span>}</div>
          <div className="stepList">{steps.length ? steps.map((step) => <div className={`goalStep ${step.completedAt ? "done" : ""}`} key={step.id}><button className="smallCheck" onClick={() => void toggleStep(step)}><Icon name="check" size={14}/></button><span>{step.title}</span>{!step.completedAt && <button className={step.scheduledFor === getTodayKey() ? "scheduleButton active" : "scheduleButton"} onClick={() => void schedule(step)}>{step.scheduledFor === getTodayKey() ? "Hari ini" : "+ Hari ini"}</button>}</div>) : <p className="noSteps">Belum ada langkah. Tambahkan satu langkah terkecil yang bisa dilakukan.</p>}</div>
          <div className="addStepRow"><input value={newStep[goal.id] ?? ""} onChange={(event) => setNewStep((current) => ({ ...current, [goal.id]: event.target.value }))} placeholder="Tambahkan langkah berikutnya" onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void addStep(goal.id); } }}/><button onClick={() => void addStep(goal.id)} disabled={!newStep[goal.id]?.trim()}><Icon name="plus" size={16}/></button></div>
          {goal.status !== "completed" && <button className="goalPause" onClick={() => void changeStatus(goal)}><Icon name={goal.status === "paused" ? "play" : "pause"} size={15}/>{goal.status === "paused" ? "Aktifkan kembali" : "Jeda goal"}</button>}
        </article>;
      })}</div>
    </div>
  );
}

function JourneyScreen({ state }: { state: AtlasDailyState }) {
  const completed = state.steps.filter((step) => step.completedAt).sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
  const stage = getMascotStage(completed.length);
  return <div className="pageWrap"><PageHeader eyebrow="PERJALANAN" title="Progres yang benar-benar sudah terjadi." text="Bukan streak sempurna. Ini jejak langkah yang sudah kamu ambil menuju hidup yang kamu inginkan."/>
    <section className="journeyHero"><div><Mascot stage={stage} celebrating={completed.length > 0}/></div><div><p className="sectionKicker">TALA SEKARANG</p><h2>{stage.label}</h2><p>{stage.message}</p><strong>{completed.length} langkah nyata telah diselesaikan</strong></div></section>
    <section className="evolutionSection"><div className="sectionHeading"><div><p className="sectionKicker">EVOLUSI TALA</p><h2>Tumbuh bersama progresmu</h2></div></div><div className="evolutionGrid">{mascotStages.map((item) => { const unlocked = completed.length >= item.min; return <article className={unlocked ? "evolutionCard unlocked" : "evolutionCard"} key={item.id}><div className="miniMascot"><Mascot stage={item}/></div><strong>{item.label}</strong><span>{item.min === 0 ? "Mulai perjalanan" : `${item.min} langkah selesai`}</span></article>; })}</div></section>
    <section className="card historyCard"><div className="cardHeader"><div><p className="sectionKicker">JEJAK LANGKAH</p><h2>Yang sudah kamu wujudkan</h2></div></div>{completed.length ? <div className="historyList">{completed.map((step) => <article key={step.id}><span><Icon name="check" size={15}/></span><div><strong>{step.title}</strong><small>{goalById(state, step.goalId)?.title} · {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(step.completedAt!))}</small></div></article>)}</div> : <div className="emptyState compact"><span><Icon name="journey" size={27}/></span><h3>Jejakmu akan muncul di sini.</h3><p>Selesaikan satu langkah kecil, lalu perjalananmu mulai terlihat.</p></div>}</section>
  </div>;
}

function DataScreen({ state, persist, onReset }: { state: AtlasDailyState; persist: (state: AtlasDailyState) => Promise<void>; onReset: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  function download() { const blob = service.exportState(state); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `atlas-daily-${getTodayKey()}.atlasdaily.json`; anchor.click(); URL.revokeObjectURL(url); setMessage("Cadangan data sudah diunduh."); }
  async function importFile(file?: File) { if (!file) return; try { const imported = await service.importState(await file.text()); await persist(imported); setMessage("Data berhasil dipulihkan."); } catch (error) { setMessage(error instanceof Error ? error.message : "Data gagal dipulihkan."); } }
  async function reset() { if (!window.confirm("Hapus seluruh data Atlas Daily di perangkat ini?")) return; await service.clear(); onReset(); }
  return <div className="pageWrap narrowPage"><PageHeader eyebrow="DATA SAYA" title="Kamu tetap memegang kendali atas datamu." text="Versi ini menyimpan goals dan progres di browser perangkatmu."/>{message && <div className="notice inline"><Icon name="spark" size={18}/><span>{message}</span></div>}<section className="dataGrid"><article className="card dataCard"><span><Icon name="data" size={24}/></span><h2>Unduh cadangan</h2><p>Simpan goals, langkah, dan perjalananmu dalam satu berkas.</p><button className="primaryButton" onClick={download}>Unduh data</button></article><article className="card dataCard"><span><Icon name="undo" size={24}/></span><h2>Pulihkan data</h2><p>Pilih berkas cadangan Atlas Daily yang pernah diunduh.</p><input ref={fileRef} type="file" accept=".json,.atlasdaily" hidden onChange={(event) => void importFile(event.target.files?.[0])}/><button className="softButton" onClick={() => fileRef.current?.click()}>Pilih berkas</button></article></section><section className="dangerZone"><div><h3>Mulai ulang Atlas Daily</h3><p>Menghapus seluruh data lokal di perangkat ini.</p></div><button onClick={() => void reset()}>Hapus seluruh data</button></section></div>;
}

export default App;
