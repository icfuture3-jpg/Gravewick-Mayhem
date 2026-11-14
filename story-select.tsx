import type { CSSProperties } from "react";
import { HERO_ABILITIES } from "./hero-abilities";
import { SOLO_STORIES, type HeroId } from "./solo-story";
import { HeroCard } from "./hero-card";

const button: CSSProperties = {padding: "9px 20px", background: "#51317c", color: "white", border: "2px solid #a283e8", borderRadius: 8, cursor: "pointer", font: "bold 16px Trebuchet MS"};
export function StorySelect({onStory, onBack}: {onStory: (hero: HeroId) => void; onBack: () => void}) {
  return <div style={{position: "absolute", inset: 0, background: "radial-gradient(ellipse at top,#3a245b,#0d0818)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 16, boxSizing: "border-box", overflow: "auto"}}>
    <h1 style={{margin: 0, color: "#ffd36a", font: "bold 40px Impact, sans-serif"}}>Gravewick Tales</h1>
    <div style={{fontSize: 15, textAlign: "center"}}>Personal stories &amp; mini-games · Separate from Gravewick Mayhem</div>
    <div>Click a character to begin their own tale.</div>
    <div role="group" aria-label="Choose a Gravewick Tale" style={{display: "flex", gap: 12, width: "100%", justifyContent: "center"}}>
      {HERO_ABILITIES.map((h, i) => <div key={h.name} style={{flex: 1, maxWidth: 250, display: "flex", flexDirection: "column", gap: 8, textAlign: "center"}}>
        <HeroCard hero={i as HeroId} selected={false} onClick={() => onStory(i as HeroId)} />
        <b style={{color: h.color}}>{SOLO_STORIES[i]!.title}</b>
        <span style={{fontSize: 13}}>{SOLO_STORIES[i]!.game} · Three backstory memories</span>
        <button style={{...button, fontSize: 14, padding: "8px 4px"}} onClick={() => onStory(i as HeroId)}>Play {h.name}'s tale</button>
      </div>)}
    </div>
    <div style={{fontSize: 13, textAlign: "center"}}>Backstory cutscenes → personal mini-games → your character's ending.<br />No original campaign battles, no training, and no shared high scores. Progress lasts for this session.</div>
    <button style={button} onClick={onBack}>Back to main menu</button>
  </div>;
}
