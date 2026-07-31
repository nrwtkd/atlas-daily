import { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "./components/AppShell";
import Icon from "./components/Icon";
import Onboarding from "./components/Onboarding";
import { capacityCopy, getDoneToday, getTodayItems, getTodayKey, splitBrainDump } from "./domain/dailyRules";
import type { AtlasDailyState, AtlasItem, Capacity, Screen } from "./domain/types";
import { AtlasDailyService } from "./services/atlasDailyService";
import { IndexedDbAtlasDailyRepository } from "./storage/indexedDbRepository";
import "./styles.css";

const service = new AtlasDailyService(new IndexedDbAtlasDailyRepository());
const capacityOrder: Capacity[] = ["tipis", "cukup", "lapang"];

function formatLongDate(): string {
  return new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
}

function replaceItem(state: AtlasDailyState, nextItem: AtlasItem): AtlasDailyState {
  return { ...state, items: state.items.map((item) => item.id === nextItem.id ? nextItem : item) };
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

  if (loading) return <div className="loadingPage"><span className="onboardingLogo"><Icon name="leaf" size={28}/></span><p>Menyiapkan ruangmu…</p></div>;
  if (!state) return <Onboarding onCreate={async (name) => setState(await service.createProfile(name))} />;

  return (
    <AppShell name={state.profile.displayName} screen={screen} onNavigate={(next) => { setNotice(""); setScreen(next); }}>
      {notice && <div className="notice"><Icon name="spark" size={18}/><span>{notice}</span></div>}
      {screen === "today" && <TodayScreen state={state} persist={persist} onNavigate={setScreen} setNotice={setNotice} />}
      {screen === "dump" && <DumpScreen state={state} persist={persist} onNavigate={setScreen} setNotice={setNotice} />}
      {screen === "later" && <LaterScreen state={state} persist={persist} setNotice={setNotice} />}
      {screen === "close" && <CloseDayScreen state={state} persist={persist} setNotice={setNotice} />}
      {screen === "data" && <DataScreen state={state} persist={persist} onReset={() => setState(null)} />}
    </AppShell>
  );
}

function PageHeader({ eyebrow, title, text, action }: { eyebrow: string; title: string; text: string; action?: React.ReactNode }) {
  return (
    <header className="pageHeader">
      <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{text}</p></div>
      {action}
    </header>
  );
}

function TodayScreen({ state, persist, onNavigate, setNotice }: {
  state: AtlasDailyState;
  persist: (state: AtlasDailyState) => Promise<void>;
  onNavigate: (screen: Screen) => void;
  setNotice: (message: string) => void;
}) {
  const dayKey = getTodayKey();
  const checkIn = state.checkIns.find((item) => item.date === dayKey);
  const capacity = checkIn?.capacity ?? "cukup";
  const today = getTodayItems(state.items, dayKey);
  const done = getDoneToday(state.items, dayKey);
  const laterCount = state.items.filter((item) => item.status === "later").length;

  async function chooseCapacity(nextCapacity: Capacity) {
    await persist(service.setCapacity(state, nextCapacity));
    setNotice(`${capacityCopy[nextCapacity].label} dipilih. Batasmu hari ini: ${capacityCopy[nextCapacity].limit} fokus.`);
  }

  async function complete(item: AtlasItem) {
    await persist(replaceItem(state, service.moveItem(item, "done")));
    setNotice("Satu hal selesai. Tidak perlu buru-buru mengambil yang lain.");
  }

  async function moveLater(item: AtlasItem) {
    await persist(replaceItem(state, service.moveItem(item, "later")));
    setNotice("Sudah dipindahkan. Kamu tidak harus membawanya hari ini.");
  }

  return (
    <div className="pageWrap">
      <PageHeader eyebrow={formatLongDate()} title={`Halo, ${state.profile.displayName}.`} text="Mari lihat apa yang benar-benar perlu kamu pegang hari ini." action={<button className="softButton" onClick={() => onNavigate("dump")}><Icon name="plus" size={17}/> Tuangkan isi kepala</button>} />

      <section className="capacityPanel">
        <div><p className="sectionKicker">KAPASITASKU HARI INI</p><h2>Seberapa banyak ruang yang kamu punya?</h2></div>
        <div className="capacityOptions">
          {capacityOrder.map((item) => (
            <button key={item} className={capacity === item ? "capacityButton active" : "capacityButton"} onClick={() => void chooseCapacity(item)}>
              <span>{capacityCopy[item].label}</span><small>{capacityCopy[item].description}</small>
            </button>
          ))}
        </div>
      </section>

      <div className="dashboardGrid">
        <section className="card focusCard">
          <div className="cardHeader">
            <div><p className="sectionKicker">YANG CUKUP UNTUK HARI INI</p><h2>{today.length ? `${today.length} fokus yang kamu pilih` : "Belum ada yang harus dibawa"}</h2></div>
            <span className="countPill">{today.length}/{capacityCopy[capacity].limit}</span>
          </div>

          {today.length === 0 ? (
            <div className="emptyState">
              <span><Icon name="leaf" size={27}/></span>
              <h3>Mulai dari kepala yang lebih lega.</h3>
              <p>Tuangkan semuanya dulu. Kamu tidak perlu langsung tahu mana yang paling penting.</p>
              <button className="primaryButton" onClick={() => onNavigate("dump")}>Mulai menuangkan <Icon name="arrow" size={17}/></button>
            </div>
          ) : (
            <div className="focusList">
              {today.map((item, index) => (
                <article className="focusItem" key={item.id}>
                  <button className="checkButton" onClick={() => void complete(item)} aria-label={`Tandai selesai: ${item.text}`}><Icon name="check" size={18}/></button>
                  <div><small>Fokus {index + 1}</small><p>{item.text}</p></div>
                  <button className="iconButton" title="Simpan untuk nanti" onClick={() => void moveLater(item)}><Icon name="later" size={18}/></button>
                </article>
              ))}
            </div>
          )}

          {today.length > 0 && <p className="permissionLine">Selesai satu pun tetap berarti. Sisanya boleh menunggu.</p>}
        </section>

        <aside className="sideStack">
          <section className="card quietCard">
            <span className="illustration"><Icon name="spark" size={25}/></span>
            <p className="sectionKicker">PENGINGAT KECIL</p>
            <h3>Produktif bukan berarti memuat semuanya.</h3>
            <p>Hari yang baik adalah hari ketika hal terpenting mendapat ruang—termasuk dirimu.</p>
          </section>
          <section className="card miniStats">
            <button onClick={() => onNavigate("close")}><strong>{done.length}</strong><span>selesai hari ini</span><Icon name="arrow" size={17}/></button>
            <button onClick={() => onNavigate("later")}><strong>{laterCount}</strong><span>aman disimpan nanti</span><Icon name="arrow" size={17}/></button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function DumpScreen({ state, persist, onNavigate, setNotice }: {
  state: AtlasDailyState;
  persist: (state: AtlasDailyState) => Promise<void>;
  onNavigate: (screen: Screen) => void;
  setNotice: (message: string) => void;
}) {
  const [raw, setRaw] = useState("");
  const [drafts, setDrafts] = useState<AtlasItem[]>(() => state.items.filter((item) => item.status === "inbox"));
  const dayKey = getTodayKey();
  const capacity = state.checkIns.find((item) => item.date === dayKey)?.capacity ?? "cukup";
  const todayCount = getTodayItems(state.items, dayKey).length;
  const remaining = Math.max(0, capacityCopy[capacity].limit - todayCount);

  async function unpack() {
    const lines = splitBrainDump(raw);
    if (!lines.length) return;
    const newItems = service.createItems(lines);
    const next = { ...state, items: [...newItems, ...state.items] };
    await persist(next);
    setDrafts((current) => [...newItems, ...current]);
    setRaw("");
    setNotice(`${newItems.length} hal sudah keluar dari kepalamu. Sekarang cukup putuskan tempatnya.`);
  }

  async function decide(item: AtlasItem, status: "today" | "later" | "released") {
    if (status === "today" && remaining <= 0) {
      setNotice(`Batas hari ini sudah penuh. Simpan hal ini untuk nanti—bukan berarti tidak penting.`);
      return;
    }
    const moved = service.moveItem(item, status);
    await persist(replaceItem(state, moved));
    setDrafts((current) => current.filter((draft) => draft.id !== item.id));
    setNotice(status === "today" ? "Dipilih untuk hari ini." : status === "later" ? "Aman disimpan untuk nanti." : "Dilepaskan. Tidak semua hal harus menjadi tugas.");
  }

  const unresolved = drafts.filter((draft) => state.items.some((item) => item.id === draft.id && item.status === "inbox"));

  return (
    <div className="pageWrap narrowPage">
      <PageHeader eyebrow="TUANGKAN" title="Tidak perlu rapi. Keluarkan saja dulu." text="Tulis satu hal per baris. Jadwal, ide, kekhawatiran, pekerjaan rumah—semuanya boleh masuk." />

      <section className="card dumpComposer">
        <textarea value={raw} onChange={(event) => setRaw(event.target.value)} placeholder={`Contoh:\nSelesaikan surat untuk besok\nSiapkan bekal anak\nKepikiran ide produk\nRumah terasa berantakan`} rows={8} />
        <div className="composerFooter">
          <p>Atlas belum menilai apa pun. Ini hanya tempat menurunkan beban dari kepala.</p>
          <button className="primaryButton" disabled={!splitBrainDump(raw).length} onClick={() => void unpack()}><Icon name="spark" size={17}/> Urai isi kepalaku</button>
        </div>
      </section>

      {unresolved.length > 0 && (
        <section className="sortingSection">
          <div className="sortingHeader"><div><p className="sectionKicker">PUTUSKAN SEKALI SAJA</p><h2>Ke mana hal-hal ini perlu ditempatkan?</h2></div><span className="remainingPill">Sisa ruang hari ini: {remaining}</span></div>
          <div className="sortingList">
            {unresolved.map((item) => (
              <article className="sortItem" key={item.id}>
                <p>{item.text}</p>
                <div className="decisionButtons">
                  <button onClick={() => void decide(item, "today")} disabled={remaining <= 0}><Icon name="today" size={16}/> Hari ini</button>
                  <button onClick={() => void decide(item, "later")}><Icon name="later" size={16}/> Nanti</button>
                  <button onClick={() => void decide(item, "released")}><Icon name="trash" size={16}/> Lepaskan</button>
                </div>
              </article>
            ))}
          </div>
          <div className="sortFinish"><button className="softButton" onClick={() => onNavigate("today")}>Lihat hari yang sudah disederhanakan <Icon name="arrow" size={17}/></button></div>
        </section>
      )}
    </div>
  );
}

function LaterScreen({ state, persist, setNotice }: {
  state: AtlasDailyState;
  persist: (state: AtlasDailyState) => Promise<void>;
  setNotice: (message: string) => void;
}) {
  const later = state.items.filter((item) => item.status === "later").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const dayKey = getTodayKey();
  const capacity = state.checkIns.find((item) => item.date === dayKey)?.capacity ?? "cukup";
  const remaining = Math.max(0, capacityCopy[capacity].limit - getTodayItems(state.items, dayKey).length);

  async function move(item: AtlasItem, status: "today" | "released") {
    if (status === "today" && remaining <= 0) {
      setNotice("Ruang hari ini sudah cukup. Ambil ini setelah salah satu fokus selesai atau besok.");
      return;
    }
    await persist(replaceItem(state, service.moveItem(item, status)));
    setNotice(status === "today" ? "Dibawa ke hari ini." : "Sudah dilepaskan dari daftar.");
  }

  return (
    <div className="pageWrap narrowPage">
      <PageHeader eyebrow="SIMPAN UNTUK NANTI" title="Tidak hilang. Hanya tidak perlu dipikirkan sekarang." text="Ruang ini menjaga hal-hal penting tanpa memaksanya masuk ke hari ini." />
      <section className="card listCard">
        {later.length === 0 ? <div className="emptyState compact"><span><Icon name="later" size={27}/></span><h3>Ruang nanti masih kosong.</h3><p>Saat kamu menunda sesuatu dengan sadar, hal itu akan aman muncul di sini.</p></div> : (
          <div className="laterList">
            {later.map((item) => (
              <article className="laterItem" key={item.id}>
                <div><p>{item.text}</p><small>Disimpan {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(new Date(item.updatedAt))}</small></div>
                <div className="rowActions">
                  <button onClick={() => void move(item, "today")} disabled={remaining <= 0}><Icon name="today" size={16}/> Bawa hari ini</button>
                  <button className="ghostDanger" onClick={() => void move(item, "released")}><Icon name="trash" size={16}/> Lepaskan</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CloseDayScreen({ state, persist, setNotice }: {
  state: AtlasDailyState;
  persist: (state: AtlasDailyState) => Promise<void>;
  setNotice: (message: string) => void;
}) {
  const dayKey = getTodayKey();
  const done = getDoneToday(state.items, dayKey);
  const unfinished = getTodayItems(state.items, dayKey);
  const checkIn = state.checkIns.find((item) => item.date === dayKey);
  const [note, setNote] = useState(checkIn?.enoughNote ?? "");

  async function decide(item: AtlasItem, status: "later" | "released") {
    await persist(replaceItem(state, service.moveItem(item, status)));
    setNotice(status === "later" ? "Disimpan untuk nanti. Hari ini boleh ditutup." : "Dilepaskan tanpa utang rasa bersalah.");
  }

  async function saveNote() {
    await persist(service.setEnoughNote(state, note));
    setNotice("Hari ini sudah ditutup dengan lembut.");
  }

  return (
    <div className="pageWrap narrowPage">
      <PageHeader eyebrow="TUTUP HARI" title="Sebelum beristirahat, rapikan beban—bukan hidupmu." text="Yang selesai kita akui. Yang belum selesai cukup diputuskan tempatnya." />

      <section className="closingSummary">
        <div className="summaryNumber"><strong>{done.length}</strong><span>hal selesai hari ini</span></div>
        <div className="summaryWords"><Icon name="spark" size={22}/><p>{done.length === 0 ? "Bertahan dan hadir juga bagian dari perjalanan." : done.length === 1 ? "Satu hal sungguh-sungguh selesai lebih berarti daripada banyak hal setengah jalan." : "Kamu sudah bergerak. Tidak perlu mengecilkan progresmu."}</p></div>
      </section>

      {unfinished.length > 0 && (
        <section className="card unfinishedCard">
          <div className="cardHeader"><div><p className="sectionKicker">YANG BELUM SELESAI</p><h2>Tidak perlu otomatis menjadi utang besok.</h2></div></div>
          <div className="unfinishedList">
            {unfinished.map((item) => (
              <article key={item.id}><p>{item.text}</p><div><button onClick={() => void decide(item, "later")}><Icon name="later" size={16}/> Simpan nanti</button><button onClick={() => void decide(item, "released")}><Icon name="trash" size={16}/> Lepaskan</button></div></article>
            ))}
          </div>
        </section>
      )}

      <section className="card enoughCard">
        <p className="sectionKicker">SATU KALIMAT SAJA</p>
        <h2>Apa yang sudah cukup hari ini?</h2>
        <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Contoh: Aku menyelesaikan yang paling penting dan hadir untuk keluargaku." />
        <div className="enoughFooter"><p>Tidak wajib panjang. Bahkan boleh dikosongkan.</p><button className="primaryButton" onClick={() => void saveNote()}>Tutup hari ini <Icon name="check" size={17}/></button></div>
      </section>
    </div>
  );
}

function DataScreen({ state, persist, onReset }: {
  state: AtlasDailyState;
  persist: (state: AtlasDailyState) => Promise<void>;
  onReset: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  function download() {
    const blob = service.exportState(state);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `atlas-daily-${getTodayKey()}.atlasdaily.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Cadangan data sudah diunduh.");
  }

  async function importFile(file?: File) {
    if (!file) return;
    try {
      const imported = await service.importState(await file.text());
      await persist(imported);
      setMessage("Data berhasil dipulihkan.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Data gagal dipulihkan.");
    }
  }

  async function reset() {
    if (!window.confirm("Hapus seluruh data Atlas Daily di perangkat ini? Tindakan ini tidak dapat dibatalkan.")) return;
    await service.clear();
    onReset();
  }

  return (
    <div className="pageWrap narrowPage">
      <PageHeader eyebrow="DATA SAYA" title="Kamu tetap memegang kendali atas datamu." text="Versi ini menyimpan data di browser perangkat. Unduh cadangan sebelum membersihkan browser atau pindah perangkat." />
      {message && <div className="notice inline"><Icon name="spark" size={18}/><span>{message}</span></div>}
      <section className="dataGrid">
        <article className="card dataCard"><span><Icon name="data" size={24}/></span><h2>Unduh cadangan</h2><p>Simpan seluruh isi Atlas Daily dalam satu berkas yang bisa kamu pegang sendiri.</p><button className="primaryButton" onClick={download}>Unduh data</button></article>
        <article className="card dataCard"><span><Icon name="undo" size={24}/></span><h2>Pulihkan data</h2><p>Pilih berkas cadangan Atlas Daily yang pernah kamu unduh.</p><input ref={fileRef} type="file" accept=".json,.atlasdaily" hidden onChange={(event) => void importFile(event.target.files?.[0])}/><button className="softButton" onClick={() => fileRef.current?.click()}>Pilih berkas</button></article>
      </section>
      <section className="dangerZone"><div><h3>Mulai ulang Atlas Daily</h3><p>Menghapus seluruh data lokal di perangkat ini.</p></div><button onClick={() => void reset()}>Hapus seluruh data</button></section>
    </div>
  );
}

export default App;
