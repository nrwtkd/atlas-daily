import { useState, type FormEvent } from "react";
import Icon from "./Icon";

export default function Onboarding({ onCreate }: { onCreate: (name: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onCreate(name);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="onboardingPage">
      <div className="onboardingGlow one" />
      <div className="onboardingGlow two" />
      <section className="onboardingCard">
        <span className="onboardingLogo"><Icon name="leaf" size={28}/></span>
        <p className="eyebrow">ATLAS DAILY</p>
        <h1>Kepalamu tidak harus membereskan semuanya sendirian.</h1>
        <p className="lead">Tuangkan yang ramai. Atlas membantumu memilih apa yang cukup untuk dipegang hari ini.</p>
        <form onSubmit={submit}>
          <label htmlFor="name">Kami boleh menyapamu siapa?</label>
          <input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Namamu" autoFocus />
          <button className="primaryButton wide" disabled={!name.trim() || saving}>
            {saving ? "Menyiapkan ruangmu…" : "Masuk ke ruangku"}<Icon name="arrow" size={18}/>
          </button>
        </form>
        <div className="privacyLine"><span>●</span> Data versi ini tersimpan di perangkatmu.</div>
      </section>
    </div>
  );
}
