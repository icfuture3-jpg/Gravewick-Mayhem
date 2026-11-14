import { HERO_ABILITIES } from "./hero-abilities";
import { useState } from "react";
import { HeroCard } from "./hero-card";
import type { HeroId } from "./solo-story";

const CAST = HERO_ABILITIES;

export function HeroPreview({ onBack, onMini }: { onBack: () => void; onMini: (hero: HeroId) => void }) {
  const [picked, setPicked] = useState<HeroId>(0);
  const hero = CAST[picked]!;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", background: "radial-gradient(circle at 50% 35%, #3a2470, #0d0818 80%)", color: "#fff" }}>
      <h2 style={{ margin: "14px 0 0", fontFamily: "Impact, sans-serif", fontSize: 36, color: "#ffd36a" }}>Meet the heroes</h2>
      <div role="group" aria-label="Click a hero" style={{display: "flex", gap: 12, width: "95%", justifyContent: "center", margin: "12px 0"}}>
        {CAST.map((h, i) => <HeroCard key={h.name} hero={i as HeroId} selected={i === picked} onClick={() => setPicked(i as HeroId)} />)}
      </div>
      <div style={{ maxWidth: 560, textAlign: "center", marginBottom: 8 }}>
        <b style={{ color: hero.color }}>{hero.name} — {hero.role}</b>
        <div style={{ fontSize: 14 }}>{hero.blurb}</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>
          <div><b>J · {hero.primaryName}:</b> {hero.primaryHint}</div>
          <div><b>K · {hero.skillName}:</b> {hero.skillHint}</div>
          <div><b>L · {hero.ultName}:</b> {hero.ultHint}</div>
        </div>
      </div>
      <button onClick={() => onMini(picked)} style={{padding: "8px 20px", background: "#51317c", color: "white", cursor: "pointer", marginBottom: 8}}>Play {hero.name}’s mini-game</button>
      <button onClick={onBack} style={{ marginBottom: 14, padding: "6px 26px", font: "bold 16px 'Trebuchet MS', sans-serif", color: "#fff", background: "#6a3fc0", border: "2px solid #0a0612", borderRadius: 10, cursor: "pointer" }}>Back</button>
    </div>
  );
}
