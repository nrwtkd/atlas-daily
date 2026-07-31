import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import AppShell from "./components/AppShell";
import Icon from "./components/Icon";
import Mascot from "./components/Mascot";
import Onboarding from "./components/Onboarding";
import {
  getActiveMilestone,
  getCompletedToday,
  getGoalMilestones,
  getGoalProgress,
  getMascotStage,
  getMilestoneProgress,
  getMilestoneSteps,
  getNextStep,
  getStageProgress,
  getTodayKey,
  getTodaySteps,
  mascotStages
} from "./domain/dailyRules";
import { getGoalTemplate, goalTemplates } from "./domain/goalTemplates";
import type {
  AtlasDailyState,
  Goal,
  GoalCategory,
  GoalStep,
  ReviewDecision,
  Screen,
  StepSize
} from "./domain/types";
import { AtlasDailyService } from "./services/atlasDailyService";
import { IndexedDbAtlasDailyRepository } from "./storage/indexedDbRepository";
import "./styles.css";

const service = new AtlasDailyService(new IndexedDbAtlasDailyRepository());

function formatLongDate(): string {
  return new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
}

function formatTargetDate(value?: string): string {
  if (!value) return "Tanpa tenggat kaku";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function goalById(state: AtlasDailyState, id: string): Goal | undefined {
  return state.goals.find((goal) => goal.id === id);
}

function stepVersion(step: GoalStep): string {
  if (step.selectedSize === "stretch") return step.stretchVersion;
  if (step.selectedSize === "steady") return step.steadyVersion;
  return step.minimumVersion;
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

  if (loading) return <div className="loadingPage"><span className="onboardingLogo"><Icon name="spark" size={28}/></span><p>Menyiapkan ruang bertumbuhmu…</p></div>;
  if (!state) return <Onboarding onCreate={async (name) => { setState(await service.createProfile(name)); setScreen("coach"); }}/>;

  return (
    <AppShell name={state.profile.displayName} screen={screen} onNavigate={(next) => { setNotice(""); setScreen(next); }}>
      {notice && <div className="notice"><Icon name="spark" size={18}/><span>{notice}</span></div>}
      {screen === "today" && <TodayScreen state={state} persist={persist} onNavigate={setScreen} setNotice={setNotice}/>} 
      {screen === "coach" && <CoachScreen state={state} persist={persist} onDone={() => setScreen("today")} setNotice={setNotice}/>} 
      {screen === "plan" && <PlanScreen state={state} persist={persist} onNavigate={setScreen} setNotice={setNotice}/>} 
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
  const activeGoals = state.goals.filter((goal) => goal.status === "active");
  const [focusGoalId, setFocusGoalId] = useState(activeGoals[0]?.id ?? "");
  const [triggerDrafts, setTriggerDrafts] = useState<Record<string, string>>({});
  const todaySteps = getTodaySteps(state.steps);
  const completedToday = getCompletedToday(state.steps);
  const totalCompleted = state.steps.filter((step) => step.completedAt).length;
  const stage = getMascotStage(totalCompleted);
  const stageProgress = getStageProgress(totalCompleted, stage);

  useEffect(() => {
    if (!activeGoals.some((goal) => goal.id === focusGoalId)) setFocusGoalId(activeGoals[0]?.id ?? "");
  }, [activeGoals, focusGoalId]);

  const focusGoal = activeGoals.find((goal) => goal.id === focusGoalId) ?? activeGoals[0];
  const activeMilestone = focusGoal ? getActiveMilestone(focusGoal.id, state.milestones, state.steps) : undefined;
  const nextStep = focusGoal ? getNextStep(focusGoal.id, state.milestones, state.steps) : undefined;

  async function complete(step: GoalStep) {
    await persist(service.completeStep(state, step.id));
    setNotice("Langkah ini selesai. Bukan sekadar centang—kamu benar-benar bergerak menuju tujuanmu. ✨");
  }

  async function chooseStep(step: GoalStep, size: StepSize) {
    if (todaySteps.length >= 3) {
      setNotice("Tiga langkah sudah cukup untuk hari ini. Selesaikan atau pindahkan salah satunya lebih dulu.");
      return;
    }
    await persist(service.scheduleStep(state, step.id, size));
    setNotice(size === "minimum" ? "Versi minimum dipilih. Memulai kecil tetap dihitung sebagai progres." : "Langkah sudah dibawa ke hari ini.");
  }

  async function saveTrigger(step: GoalStep) {
    const value = triggerDrafts[step.id] ?? step.trigger ?? "";
    await persist(service.setStepTrigger(state, step.id, value));
    setNotice(value ? "Rencana jika–maka tersimpan. Kamu sudah menentukan kapan langkah ini akan dimulai." : "Pemicu dikosongkan.");
  }

  if (!state.goals.length) {
    return (
      <div className="pageWrap">
        <PageHeader eyebrow={formatLongDate()} title={`Halo, ${state.profile.displayName}.`} text="Kamu tidak perlu sudah tahu cara mencapainya. Kita akan menyusun jalannya bersama, satu pertanyaan per layar."/>
        <section className="emptyCoachHero">
          <div className="coachMascot"><Mascot stage={stage}/></div>
          <div>
            <p className="sectionKicker">MULAI DARI ARAH, BUKAN DAFTAR TUGAS</p>
            <h2>Apa satu hal yang paling ingin kamu ubah dalam hidupmu saat ini?</h2>
            <p>Atlas akan membantumu memperjelas target, memeriksa apakah targetnya realistis, menyarankan tahapan, lalu menyiapkan langkah pertama hari ini.</p>
            <button className="primaryButton" onClick={() => onNavigate("coach")}>Susun tujuan pertamaku <Icon name="arrow" size={17}/></button>
          </div>
        </section>
      </div>
    );
  }

  if (!activeGoals.length) {
    return (
      <div className="pageWrap">
        <PageHeader eyebrow={formatLongDate()} title={`Halo, ${state.profile.displayName}.`} text="Semua tujuanmu sedang dijeda. Kamu tidak perlu memaksa kembali sebelum siap."/>
        <section className="emptyCoachHero">
          <div className="coachMascot"><Mascot stage={stage}/></div>
          <div><p className="sectionKicker">JEDA BUKAN KEGAGALAN</p><h2>Mau meninjau tujuan lama atau menyusun arah yang lebih cocok?</h2><p>Progres yang sudah ada tetap tersimpan. Kamu boleh mengaktifkan kembali, mengecilkan rencana, atau memulai tujuan baru.</p><div className="heroActions"><button className="softButton" onClick={() => onNavigate("plan")}>Tinjau tujuanku</button><button className="primaryButton" onClick={() => onNavigate("coach")}>Susun tujuan baru <Icon name="arrow" size={16}/></button></div></div>
        </section>
      </div>
    );
  }

  return (
    <div className="pageWrap">
      <PageHeader eyebrow={formatLongDate()} title={`Pagi, ${state.profile.displayName}.`} text="Hari ini bukan tentang mengejar semuanya. Cukup jaga satu arah tetap hidup." action={<button className="softButton" onClick={() => onNavigate("coach")}><Icon name="plus" size={17}/> Susun tujuan baru</button>}/>

      <section className="directionCard">
        <div className="directionMain">
          <p className="sectionKicker">ARAH BESARKU</p>
          <select value={focusGoal?.id ?? ""} onChange={(event) => setFocusGoalId(event.target.value)}>
            {activeGoals.map((goal) => <option value={goal.id} key={goal.id}>{goal.title}</option>)}
          </select>
          <h2>{focusGoal?.successEvidence}</h2>
          <p>{focusGoal?.why || "Tujuan ini penting karena kamu memilih untuk menjaganya."}</p>
          <div className="directionMeta"><span><Icon name="calendar" size={15}/>{formatTargetDate(focusGoal?.targetDate)}</span><span>{focusGoal?.weeklyMinutes ?? 0} menit realistis per minggu</span></div>
        </div>
        <div className="directionProgress">
          <strong>{focusGoal ? getGoalProgress(focusGoal, state.steps) : 0}%</strong>
          <span>perjalanan selesai</span>
          <button className="textButton" onClick={() => onNavigate("plan")}>Lihat rencana <Icon name="arrow" size={15}/></button>
        </div>
      </section>

      <div className="dailyCoachGrid">
        <section className="card dailyActionCard">
          <div className="cardHeader"><div><p className="sectionKicker">LANGKAH HARI INI</p><h2>{todaySteps.length ? "Yang sedang kamu pegang" : "Pilih ukuran langkah yang cocok dengan harimu"}</h2></div><span className="countPill">{todaySteps.length}/3</span></div>

          {todaySteps.length > 0 ? <div className="todayList">{todaySteps.map((step) => {
            const goal = goalById(state, step.goalId);
            const milestone = state.milestones.find((item) => item.id === step.milestoneId);
            return <article className="todayStep coached" key={step.id}>
              <button className="checkButton" onClick={() => void complete(step)} aria-label={`Selesaikan ${step.title}`}><Icon name="check" size={18}/></button>
              <div className="todayStepBody"><small>{goal?.title} → {milestone?.title}</small><h3>{stepVersion(step)}</h3><span className={`sizeBadge ${step.selectedSize}`}>{step.selectedSize === "minimum" ? "Versi minimum" : step.selectedSize === "stretch" ? "Versi penuh" : "Versi cukup"}</span>
                <div className="triggerBox"><label>Setelah atau ketika…</label><div><input value={triggerDrafts[step.id] ?? step.trigger ?? ""} onChange={(event) => setTriggerDrafts((current) => ({ ...current, [step.id]: event.target.value }))} placeholder="Contoh: setelah menidurkan anak pukul 20.00"/><button onClick={() => void saveTrigger(step)}>Simpan</button></div></div>
              </div>
            </article>;
          })}</div> : nextStep ? (
            <div className="nextActionCoach">
              <div className="coachChain"><span>{focusGoal?.title}</span><Icon name="arrow" size={15}/><span>{activeMilestone?.title}</span><Icon name="arrow" size={15}/><strong>{nextStep.title}</strong></div>
              <p className="coachQuestion">Seberapa besar ruang yang kamu punya hari ini?</p>
              <div className="sizeOptions">
                <button onClick={() => void chooseStep(nextStep, "minimum")}><strong>10 menit</strong><span>Versi minimum</span><p>{nextStep.minimumVersion}</p></button>
                <button onClick={() => void chooseStep(nextStep, "steady")}><strong>25 menit</strong><span>Versi cukup</span><p>{nextStep.steadyVersion}</p></button>
                <button onClick={() => void chooseStep(nextStep, "stretch")}><strong>45+ menit</strong><span>Versi penuh</span><p>{nextStep.stretchVersion}</p></button>
              </div>
              <p className="permissionLine">Memilih versi minimum bukan menurunkan standar. Itu cara menjaga arah saat kapasitas terbatas.</p>
            </div>
          ) : <div className="emptyState compact"><span><Icon name="flag" size={27}/></span><h3>Semua tahap pada tujuan ini selesai.</h3><p>Kamu boleh merayakan, meninjau hasilnya, atau menyusun tujuan berikutnya.</p></div>}
        </section>

        <aside className="sideStack">
          <section className="card milestonePulse"><p className="sectionKicker">FOKUS TAHAP INI</p><h3>{activeMilestone?.title ?? "Tujuan selesai"}</h3><p>{activeMilestone?.proof ?? "Kamu sudah menuntaskan seluruh jalan yang disusun."}</p>{activeMilestone && <div className="progressTrack"><span style={{ width: `${getMilestoneProgress(activeMilestone, state.steps)}%` }}/></div>}</section>
          <section className="card mascotCoach"><div className="miniMascotLarge"><Mascot stage={stage} celebrating={completedToday.length > 0}/></div><div><p className="sectionKicker">TALA · {stage.label.toUpperCase()}</p><h3>{completedToday.length ? "Kita bergerak hari ini!" : stage.message}</h3><div className="levelTrack"><span style={{ width: `${stageProgress}%` }}/></div><small>{totalCompleted} langkah nyata terselesaikan</small></div></section>
        </aside>
      </div>
    </div>
  );
}

type CoachDraft = {
  category: GoalCategory | "";
  desire: string;
  why: string;
  currentReality: string;
  successEvidence: string;
  targetDate: string;
  weeklyMinutes: number;
  obstacle: string;
  strategy: string;
};

const initialCoachDraft: CoachDraft = {
  category: "",
  desire: "",
  why: "",
  currentReality: "",
  successEvidence: "",
  targetDate: "",
  weeklyMinutes: 120,
  obstacle: "",
  strategy: ""
};

function CoachScreen({ state, persist, onDone, setNotice }: {
  state: AtlasDailyState;
  persist: (state: AtlasDailyState) => Promise<void>;
  onDone: () => void;
  setNotice: (message: string) => void;
}) {
  const [coachStep, setCoachStep] = useState(0);
  const [draft, setDraft] = useState<CoachDraft>(initialCoachDraft);
  const [selectedMilestones, setSelectedMilestones] = useState<string[]>([]);
  const totalCoachSteps = 7;
  const template = getGoalTemplate(draft.category || "custom");

  function chooseCategory(category: GoalCategory) {
    const nextTemplate = getGoalTemplate(category);
    setDraft((current) => ({ ...current, category }));
    setSelectedMilestones(nextTemplate.milestones.map((milestone) => milestone.id));
  }

  function nextDisabled(): boolean {
    if (coachStep === 0) return !draft.category;
    if (coachStep === 1) return draft.desire.trim().length < 5;
    if (coachStep === 2) return draft.why.trim().length < 5 || draft.currentReality.trim().length < 3;
    if (coachStep === 3) return draft.successEvidence.trim().length < 5;
    if (coachStep === 4) return draft.weeklyMinutes < 15 || draft.obstacle.trim().length < 3;
    if (coachStep === 6) return selectedMilestones.length === 0;
    return false;
  }

  async function finish() {
    const milestones = template.milestones.filter((milestone) => selectedMilestones.includes(milestone.id));
    await persist(service.createGoal(state, {
      category: draft.category || "custom",
      desire: draft.desire,
      why: draft.why,
      currentReality: draft.currentReality,
      successEvidence: draft.successEvidence,
      targetDate: draft.targetDate,
      weeklyMinutes: draft.weeklyMinutes,
      obstacle: draft.obstacle,
      strategy: draft.strategy,
      milestones
    }));
    setNotice("Tujuanmu sudah punya arah, tahapan, dan satu langkah minimum untuk hari ini.");
    onDone();
  }

  const checks = [
    { label: "Jelas", ok: draft.desire.trim().length >= 10, text: "Perubahan yang dituju dapat dipahami." },
    { label: "Terukur", ok: draft.successEvidence.trim().length >= 8, text: "Ada bukti bahwa tujuan benar-benar tercapai." },
    { label: "Realistis", ok: draft.weeklyMinutes >= 15, text: `Disesuaikan dengan ${draft.weeklyMinutes} menit per minggu.` },
    { label: "Bermakna", ok: draft.why.trim().length >= 8, text: "Alasan pribadi tetap terlihat di dalam rencana." },
    { label: "Peka waktu", ok: Boolean(draft.targetDate), text: draft.targetDate ? `Ditargetkan ${formatTargetDate(draft.targetDate)}.` : "Belum memakai tenggat; ini boleh untuk tujuan eksploratif." }
  ];

  return (
    <div className="coachPage">
      <div className="coachTop"><button className="brandInline" onClick={() => setCoachStep(0)}><Icon name="spark" size={20}/> Atlas Coach</button><div className="coachProgress"><span style={{ width: `${((coachStep + 1) / totalCoachSteps) * 100}%` }}/></div><small>Langkah {coachStep + 1} dari {totalCoachSteps}</small></div>
      <section className="coachCard">
        {coachStep === 0 && <>
          <p className="eyebrow">MULAI DARI SATU AREA HIDUP</p>
          <h1>Apa yang paling ingin kamu majukan saat ini?</h1>
          <p className="coachLead">Tidak perlu memilih semua. Tujuan yang fokus lebih mudah dijaga daripada banyak rencana yang saling berebut energi.</p>
          <div className="categoryGrid">{goalTemplates.map((item) => <button type="button" className={draft.category === item.category ? "categoryCard selected" : "categoryCard"} key={item.category} onClick={() => chooseCategory(item.category)}><span>{item.icon}</span><strong>{item.label}</strong><small>{item.description}</small></button>)}</div>
        </>}

        {coachStep === 1 && <>
          <p className="eyebrow">KEINGINAN MENJADI ARAH</p>
          <h1>Apa yang ingin berubah?</h1>
          <p className="coachLead">Tulis dengan bahasa sehari-hari. Atlas belum menilai apakah kalimatmu sudah “sempurna”.</p>
          <textarea className="coachTextarea" rows={4} value={draft.desire} onChange={(event) => setDraft((current) => ({ ...current, desire: event.target.value }))} placeholder="Contoh: Aku ingin meluncurkan produk digital pertamaku yang benar-benar berguna." autoFocus/>
          <div className="exampleChips"><span>Contoh:</span>{template.examples.map((example) => <button type="button" key={example} onClick={() => setDraft((current) => ({ ...current, desire: example }))}>{example}</button>)}</div>
        </>}

        {coachStep === 2 && <>
          <p className="eyebrow">PASTIKAN INI BENAR-BENAR MILIKMU</p>
          <h1>Mengapa ini penting—dan kamu sedang mulai dari mana?</h1>
          <div className="coachFields"><label>Kalau tujuan ini tercapai, apa yang berubah dalam hidupmu?<textarea rows={3} value={draft.why} onChange={(event) => setDraft((current) => ({ ...current, why: event.target.value }))} placeholder="Alasan yang ingin kamu ingat ketika semangat sedang turun."/></label><label>Kondisimu sekarang seperti apa?<textarea rows={3} value={draft.currentReality} onChange={(event) => setDraft((current) => ({ ...current, currentReality: event.target.value }))} placeholder="Apa yang sudah ada, belum ada, atau masih membuatmu tertahan?"/></label></div>
          <div className="coachNote"><Icon name="spark" size={18}/><p>Goal yang sehat tidak dimulai dari menyalahkan kondisi sekarang. Kita hanya perlu melihat titik berangkat dengan jujur.</p></div>
        </>}

        {coachStep === 3 && <>
          <p className="eyebrow">BUAT HASILNYA TERLIHAT</p>
          <h1>Apa bukti bahwa tujuan ini benar-benar tercapai?</h1>
          <p className="coachLead">Hindari hanya “merasa lebih baik”. Pilih hasil, perilaku, angka, karya, atau kondisi yang dapat diamati.</p>
          <textarea className="coachTextarea" rows={4} value={draft.successEvidence} onChange={(event) => setDraft((current) => ({ ...current, successEvidence: event.target.value }))} placeholder="Contoh: Produk bisa digunakan, telah dicoba 5 orang, dan siap dibeli melalui satu halaman penjualan."/>
          <label className="dateField">Kapan kamu ingin mulai melihat hasil ini?<input type="date" value={draft.targetDate} onChange={(event) => setDraft((current) => ({ ...current, targetDate: event.target.value }))}/><small>Tenggat membantu memberi arah, tetapi nanti boleh disesuaikan.</small></label>
        </>}

        {coachStep === 4 && <>
          <p className="eyebrow">RENCANA HARUS MUAT DI HIDUPMU</p>
          <h1>Berapa kapasitas nyata yang bisa kamu jaga?</h1>
          <div className="capacityChoices">{[60, 120, 180, 300].map((minutes) => <button type="button" className={draft.weeklyMinutes === minutes ? "selected" : ""} key={minutes} onClick={() => setDraft((current) => ({ ...current, weeklyMinutes: minutes }))}><strong>{minutes < 60 ? minutes : minutes / 60}</strong><span>{minutes < 60 ? "menit" : "jam"} per minggu</span></button>)}</div>
          <div className="coachFields"><label>Apa yang paling mungkin menghambatmu?<textarea rows={3} value={draft.obstacle} onChange={(event) => setDraft((current) => ({ ...current, obstacle: event.target.value }))} placeholder="Waktu sempit, energi turun, bingung mulai, takut gagal, dukungan terbatas…"/></label><label>Strategi yang mungkin membantu, opsional<textarea rows={3} value={draft.strategy} onChange={(event) => setDraft((current) => ({ ...current, strategy: event.target.value }))} placeholder="Contoh: memakai versi minimum 10 menit saat hari sedang penuh."/></label></div>
        </>}

        {coachStep === 5 && <>
          <p className="eyebrow">RANCANGAN TUJUANMU</p>
          <h1>Ini bukan kontrak kaku. Ini arah yang bisa kamu miliki dan sesuaikan.</h1>
          <div className="goalStatement"><span>Tujuanku</span><h2>{draft.desire}</h2><p>Pada {draft.targetDate ? formatTargetDate(draft.targetDate) : "waktu yang akan kutinjau kembali"}, aku ingin melihat: <strong>{draft.successEvidence}</strong></p><small>Aku menyiapkan sekitar {draft.weeklyMinutes} menit per minggu karena: {draft.why}</small></div>
          <div className="smartGrid">{checks.map((check) => <article className={check.ok ? "smartItem ok" : "smartItem"} key={check.label}><span><Icon name={check.ok ? "check" : "flag"} size={16}/></span><div><strong>{check.label}</strong><p>{check.text}</p></div></article>)}</div>
          <div className="coachNote"><Icon name="spark" size={18}/><p>Target tidak harus lolos semua unsur dengan sempurna. Yang penting cukup jelas untuk membantumu memilih tindakan berikutnya.</p></div>
        </>}

        {coachStep === 6 && <>
          <p className="eyebrow">ATLAS MENYARANKAN JALAN AWAL</p>
          <h1>Pilih tahapan yang relevan untuk tujuanmu.</h1>
          <p className="coachLead">Ini bukan jawaban mutlak. Hapus tahap yang tidak cocok; langkah tambahan tetap bisa dibuat nanti.</p>
          <div className="roadmapPicker">{template.milestones.map((milestone, index) => {
            const selected = selectedMilestones.includes(milestone.id);
            return <button type="button" className={selected ? "roadmapPick selected" : "roadmapPick"} key={milestone.id} onClick={() => setSelectedMilestones((current) => selected ? current.filter((id) => id !== milestone.id) : [...current, milestone.id])}><span className="roadmapNumber">{index + 1}</span><div><strong>{milestone.title}</strong><p>{milestone.proof}</p><small>{milestone.steps.length} langkah awal disiapkan</small></div><span className="roadmapCheck">{selected && <Icon name="check" size={16}/>}</span></button>;
          })}</div>
          <div className="coachNote success"><Icon name="spark" size={18}/><p>Setelah dibuat, Atlas otomatis membawa <strong>versi minimum dari langkah pertama</strong> ke halaman Hari Ini. Kamu tidak akan ditinggalkan dengan rencana kosong.</p></div>
        </>}

        <div className="coachFooter"><button className="backButton" disabled={coachStep === 0} onClick={() => setCoachStep((value) => Math.max(0, value - 1))}>Kembali</button>{coachStep < totalCoachSteps - 1 ? <button className="primaryButton" disabled={nextDisabled()} onClick={() => setCoachStep((value) => value + 1)}>Lanjut <Icon name="arrow" size={17}/></button> : <button className="primaryButton" disabled={nextDisabled()} onClick={() => void finish()}>Buat rencana dan mulai <Icon name="arrow" size={17}/></button>}</div>
      </section>
    </div>
  );
}

function PlanScreen({ state, persist, onNavigate, setNotice }: {
  state: AtlasDailyState;
  persist: (state: AtlasDailyState) => Promise<void>;
  onNavigate: (screen: Screen) => void;
  setNotice: (message: string) => void;
}) {
  const [selectedGoalId, setSelectedGoalId] = useState(state.goals[0]?.id ?? "");
  const [newStep, setNewStep] = useState<Record<string, string>>({});
  const [showReview, setShowReview] = useState(false);
  const [reviewObstacle, setReviewObstacle] = useState("");
  const [reviewDecision, setReviewDecision] = useState<ReviewDecision>("continue");
  const [reviewNote, setReviewNote] = useState("");
  const goal = state.goals.find((item) => item.id === selectedGoalId) ?? state.goals[0];

  useEffect(() => {
    if (!state.goals.some((item) => item.id === selectedGoalId)) setSelectedGoalId(state.goals[0]?.id ?? "");
  }, [selectedGoalId, state.goals]);

  async function schedule(step: GoalStep, size: StepSize) {
    await persist(service.scheduleStep(state, step.id, size));
    setNotice("Langkah dibawa ke Hari Ini. Ukurannya tetap bisa disesuaikan.");
  }

  async function addStep(milestoneId: string) {
    if (!goal) return;
    const value = newStep[milestoneId]?.trim();
    if (!value) return;
    await persist(service.addCustomStep(state, goal.id, milestoneId, value));
    setNewStep((current) => ({ ...current, [milestoneId]: "" }));
    setNotice("Langkah tambahan sudah masuk ke tahap ini.");
  }

  async function submitReview(event: FormEvent) {
    event.preventDefault();
    if (!goal || !reviewObstacle) return;
    await persist(service.reviewGoal(state, goal.id, { obstacle: reviewObstacle, decision: reviewDecision, note: reviewNote }));
    setShowReview(false);
    setNotice(reviewDecision === "pause" ? "Goal dijeda dengan sadar. Progresmu tidak hilang." : "Rencana sudah ditinjau. Menyesuaikan bukan berarti menyerah.");
  }

  if (!goal) return <div className="pageWrap"><PageHeader eyebrow="TUJUANKU" title="Belum ada tujuan yang sedang disusun." text="Mulai dari satu tujuan yang paling berarti untuk musim hidupmu sekarang." action={<button className="primaryButton" onClick={() => onNavigate("coach")}>Susun tujuan <Icon name="arrow" size={16}/></button>}/></div>;

  const milestones = getGoalMilestones(state.milestones, goal.id);
  const category = getGoalTemplate(goal.category);
  return (
    <div className="pageWrap">
      <PageHeader eyebrow="TUJUANKU & RENCANA" title="Lihat hubungan antara arah besar dan langkah kecil." text="Rencana yang baik bukan yang paling padat, tetapi yang membuat langkah berikutnya terlihat." action={<button className="primaryButton" onClick={() => onNavigate("coach")}><Icon name="plus" size={16}/> Tujuan baru</button>}/>
      <div className="goalTabs">{state.goals.map((item) => <button className={item.id === goal.id ? "selected" : ""} key={item.id} onClick={() => setSelectedGoalId(item.id)}><span>{getGoalTemplate(item.category).icon}</span><div><strong>{item.title}</strong><small>{getGoalProgress(item, state.steps)}% selesai</small></div></button>)}</div>

      <section className="planHero">
        <div><p className="sectionKicker">{category.label.toUpperCase()} · {goal.status === "active" ? "AKTIF" : goal.status === "paused" ? "DIJEDA" : "SELESAI"}</p><h2>{goal.title}</h2><blockquote>“{goal.why || "Aku memilih tujuan ini karena ia penting untuk hidup yang ingin kubangun."}”</blockquote><div className="planFacts"><span><strong>Bukti berhasil</strong>{goal.successEvidence}</span><span><strong>Kapasitas</strong>{goal.weeklyMinutes} menit per minggu</span><span><strong>Target</strong>{formatTargetDate(goal.targetDate)}</span></div></div><div className="planProgress"><strong>{getGoalProgress(goal, state.steps)}%</strong><span>sudah ditempuh</span><div className="progressTrack large"><span style={{ width: `${getGoalProgress(goal, state.steps)}%` }}/></div><button className="softButton" onClick={() => setShowReview((value) => !value)}>Rencana terasa berat?</button></div>
      </section>

      {showReview && <form className="card recoveryPanel" onSubmit={submitReview}><div><p className="sectionKicker">CHECK-IN TANPA MENGHAKIMI</p><h2>Apa yang paling menggambarkan kondisimu?</h2></div><div className="recoveryChoices">{["Waktuku tidak cukup", "Langkahnya terlalu besar", "Aku sedang kelelahan", "Ada keadaan tak terduga", "Aku kehilangan alasan tujuan ini", "Tujuan ini bukan prioritas sekarang"].map((item) => <button type="button" className={reviewObstacle === item ? "selected" : ""} key={item} onClick={() => setReviewObstacle(item)}>{item}</button>)}</div><label>Respons yang paling sehat sekarang<select value={reviewDecision} onChange={(event) => setReviewDecision(event.target.value as ReviewDecision)}><option value="continue">Lanjutkan dari langkah berikutnya</option><option value="shrink">Kecilkan ukuran langkah</option><option value="shift">Geser rencana atau tenggat</option><option value="pause">Jeda dengan sadar</option></select></label><label>Catatan untuk diriku, opsional<textarea rows={2} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Apa yang ingin kamu ingat saat kembali nanti?"/></label><div className="formFooter"><p>Masalahnya tidak selalu kemauan. Kadang rencananya memang perlu menyesuaikan hidup.</p><button className="primaryButton" disabled={!reviewObstacle}>Simpan penyesuaian</button></div></form>}

      <section className="roadmapSection"><div className="sectionHeading"><div><p className="sectionKicker">ROADMAP</p><h2>Jalan yang sedang kamu tempuh</h2></div><p>{milestones.length} tahap · setiap tahap punya bukti selesai</p></div><div className="roadmapTimeline">{milestones.map((milestone, index) => {
        const progress = getMilestoneProgress(milestone, state.steps);
        const steps = getMilestoneSteps(state.steps, milestone.id);
        return <article className={progress === 100 ? "milestoneCard complete" : "milestoneCard"} key={milestone.id}><div className="milestoneIndex">{progress === 100 ? <Icon name="check" size={17}/> : index + 1}</div><div className="milestoneContent"><div className="milestoneHeader"><div><h3>{milestone.title}</h3><p>{milestone.proof}</p></div><strong>{progress}%</strong></div><div className="progressTrack"><span style={{ width: `${progress}%` }}/></div><div className="planStepList">{steps.map((step) => <div className={step.completedAt ? "planStep done" : "planStep"} key={step.id}><span className="stepDot">{step.completedAt && <Icon name="check" size={13}/>}</span><div><strong>{step.title}</strong><small>{step.completedAt ? "Selesai" : step.scheduledFor === getTodayKey() ? "Sedang dibawa hari ini" : step.minimumVersion}</small></div>{!step.completedAt && <div className="stepMenu"><button onClick={() => void schedule(step, "minimum")}>10 mnt</button><button onClick={() => void schedule(step, "steady")}>25 mnt</button><button onClick={() => void schedule(step, "stretch")}>45+ mnt</button></div>}</div>)}</div><div className="addStepRow"><input value={newStep[milestone.id] ?? ""} onChange={(event) => setNewStep((current) => ({ ...current, [milestone.id]: event.target.value }))} placeholder="Tambahkan langkah yang lebih cocok untukmu" onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void addStep(milestone.id); } }}/><button onClick={() => void addStep(milestone.id)} disabled={!newStep[milestone.id]?.trim()}><Icon name="plus" size={16}/></button></div></div></article>;
      })}</div></section>
    </div>
  );
}

function JourneyScreen({ state }: { state: AtlasDailyState }) {
  const completed = state.steps.filter((step) => step.completedAt).sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
  const stage = getMascotStage(completed.length);
  return <div className="pageWrap"><PageHeader eyebrow="PERJALANAN" title="Bukti bahwa kamu tidak hanya berniat." text="Di sini yang dihargai bukan streak sempurna, tetapi langkah nyata, penyesuaian yang sehat, dan keberanian untuk kembali."/>
    <section className="journeyHero"><div><Mascot stage={stage} celebrating={completed.length > 0}/></div><div><p className="sectionKicker">TALA SEKARANG</p><h2>{stage.label}</h2><p>{stage.message}</p><strong>{completed.length} langkah nyata telah diselesaikan</strong></div></section>
    <div className="journeyStats">{state.goals.map((goal) => <article className="card" key={goal.id}><span>{getGoalTemplate(goal.category).icon}</span><div><strong>{goal.title}</strong><small>{getGoalProgress(goal, state.steps)}% perjalanan</small></div><div className="progressTrack"><span style={{ width: `${getGoalProgress(goal, state.steps)}%` }}/></div></article>)}</div>
    <section className="evolutionSection"><div className="sectionHeading"><div><p className="sectionKicker">EVOLUSI TALA</p><h2>Tumbuh bersama kemampuanmu mengarahkan hidup</h2></div></div><div className="evolutionGrid">{mascotStages.map((item) => { const unlocked = completed.length >= item.min; return <article className={unlocked ? "evolutionCard unlocked" : "evolutionCard"} key={item.id}><div className="miniMascot"><Mascot stage={item}/></div><strong>{item.label}</strong><span>{item.min === 0 ? "Mulai menyusun arah" : `${item.min} langkah selesai`}</span></article>; })}</div></section>
    <section className="card historyCard"><div className="cardHeader"><div><p className="sectionKicker">JEJAK LANGKAH</p><h2>Yang sudah benar-benar kamu kerjakan</h2></div></div>{completed.length ? <div className="historyList">{completed.map((step) => <article key={step.id}><span><Icon name="check" size={15}/></span><div><strong>{step.title}</strong><small>{goalById(state, step.goalId)?.title} · {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(step.completedAt!))}</small></div></article>)}</div> : <div className="emptyState compact"><span><Icon name="journey" size={27}/></span><h3>Jejakmu akan muncul di sini.</h3><p>Rencana pertamamu otomatis menyiapkan satu langkah minimum di Hari Ini.</p></div>}</section>
  </div>;
}

function DataScreen({ state, persist, onReset }: { state: AtlasDailyState; persist: (state: AtlasDailyState) => Promise<void>; onReset: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  function download() { const blob = service.exportState(state); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `atlas-daily-${getTodayKey()}.atlasdaily.json`; anchor.click(); URL.revokeObjectURL(url); setMessage("Cadangan data sudah diunduh."); }
  async function importFile(file?: File) { if (!file) return; try { const imported = await service.importState(await file.text()); await persist(imported); setMessage("Data berhasil dipulihkan."); } catch (error) { setMessage(error instanceof Error ? error.message : "Data gagal dipulihkan."); } }
  async function reset() { if (!window.confirm("Hapus seluruh data Atlas Daily di perangkat ini?")) return; await service.clear(); onReset(); }
  return <div className="pageWrap narrowPage"><PageHeader eyebrow="DATA SAYA" title="Kamu tetap memegang kendali atas datamu." text="Versi ini menyimpan tujuan, rencana, dan progres di browser perangkatmu."/>{message && <div className="notice inline"><Icon name="spark" size={18}/><span>{message}</span></div>}<section className="dataGrid"><article className="card dataCard"><span><Icon name="data" size={24}/></span><h2>Unduh cadangan</h2><p>Simpan seluruh perjalanan Atlas Daily dalam satu berkas.</p><button className="primaryButton" onClick={download}>Unduh data</button></article><article className="card dataCard"><span><Icon name="undo" size={24}/></span><h2>Pulihkan data</h2><p>Pilih berkas cadangan Atlas Daily yang pernah diunduh.</p><input ref={fileRef} type="file" accept=".json,.atlasdaily" hidden onChange={(event) => void importFile(event.target.files?.[0])}/><button className="softButton" onClick={() => fileRef.current?.click()}>Pilih berkas</button></article></section><section className="dangerZone"><div><h3>Mulai ulang Atlas Daily</h3><p>Menghapus seluruh data lokal di perangkat ini.</p></div><button onClick={() => void reset()}>Hapus seluruh data</button></section></div>;
}

export default App;
