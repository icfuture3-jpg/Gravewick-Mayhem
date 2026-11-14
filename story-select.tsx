import { useState, type CSSProperties } from "react";
import { HERO_ABILITIES } from "./hero-abilities";
import { SOLO_STORIES, type HeroId } from "./solo-story";
import { HeroCard } from "./hero-card";
import { miniChapter } from "./mini-backstory";
import { MINI_RULES } from "./mini-game";
const button: CSSProperties = {padding: "9px 20px", background: "#51317c", color: "white", border: "2px solid #a283e8", borderRadius: 8, cursor: "pointer", font: "bold 16px Trebuchet MS"};
export function StorySelect({onStory, onMini, onTeam, onBack}: {onStory: (hero: HeroId) => void; onMini: (hero: HeroId) => void; onTeam: () => void; onBack: () => void}) {
  const [hero, setHero] = useState<HeroId>(0);
  const info = HERO_ABILITIES[hero], story = SOLO_STORIES[hero];
  return <div style={{position: "absolute", inset: 0, background: "radial-gradient(ellipse at top,#3a245b,#0d0818)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 14, boxSizing: "border-box", overflow: "auto"}}>
    <h2 style={{margin: 0, color: "#ffd36a", font: "bold 32px Impact, sans-serif"}}>Choose your story</h2>
    <div style={{fontSize: 14}}>Click a character to read their story, or launch their mini-game directly below them.</div>
    <div role="group" aria-label="Click a character" style={{display: "flex", gap: 12, width: "100%", justifyContent: "center"}}>
      {HERO_ABILITIES.map((h, i) => <div key={h.name} style={{flex: 1, maxWidth: 250, display: "flex", flexDirection: "column", gap: 6}}>
        <HeroCard hero={i as HeroId} selected={hero === i} onClick={() => setHero(i as HeroId)} />
        <button style={{...button, fontSize: 13, padding: "7px 4px"}} onClick={() => onMini(i as HeroId)}>Play {h.name}'s mini-game</button>
      </div>)}
    </div>
    <div style={{textAlign: "center", maxWidth: 780}}>
      <h3 style={{margin: "4px 0", color: info.color}}>{story.title}</h3>
      <div style={{fontSize: 14}}>{story.intro}</div>
      <div style={{marginTop: 8, fontSize: 13, color: "#e2cff5"}}><b>Mini-game · {story.game}</b> — {miniChapter(hero, 0).objective}<br />{MINI_RULES[hero]}</div>
    </div>
    <div style={{display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center"}}>
      <button style={{...button, background: "#7749a4"}} onClick={() => onStory(hero)}>Play {info.name}'s story</button>
      <button style={button} onClick={() => onMini(hero)}>Play {story.game}</button>
    </div>
    <div style={{fontSize: 12}}>Solo: three chapters, backstory cutscenes, mini-games and battles. Only your chosen hero fights. No training or shared high scores.</div>
    <div style={{display: "flex", gap: 12}}><button style={button} onClick={onTeam}>Team story + training</button><button style={button} onClick={onBack}>Back</button></div>
  </div>;
}
