import { useEffect, useRef, useState, type CSSProperties } from "react";
import { HERO_ABILITIES } from "./hero-abilities";
import { SOLO_STORIES, type HeroId } from "./solo-story";
import { drawFigure } from "./heroes";
import { MINI_RULES } from "./mini-game";
const button: CSSProperties = {padding: "9px 20px", background: "#51317c", color: "white", border: "2px solid #a283e8", borderRadius: 8, cursor: "pointer", font: "bold 16px Trebuchet MS"};
export function StorySelect({onStory, onMini, onTeam, onBack}: {onStory: (hero: HeroId) => void; onMini: (hero: HeroId) => void; onTeam: () => void; onBack: () => void}) {
  const [hero, setHero] = useState<HeroId>(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    let raf = 0;
    const frame = (now: number) => {
      ctx.clearRect(0, 0, 960, 220);
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = i === hero ? 1 : 0.4;
        drawFigure(ctx, i, 240 + i * 240, 150 + Math.sin(now / 600 + i) * 4, i === hero ? 1.4 : 1.15, 0, i !== 1, false, now / 1000);
      }
      ctx.globalAlpha = 1; raf = requestAnimationFrame(frame);
    }; raf = requestAnimationFrame(frame); return () => cancelAnimationFrame(raf);
  }, [hero]);
  const info = HERO_ABILITIES[hero], story = SOLO_STORIES[hero];
  return <div style={{position: "absolute", inset: 0, background: "radial-gradient(ellipse at top,#3a245b,#0d0818)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 14, boxSizing: "border-box", overflow: "auto"}}>
    <h2 style={{margin: 0, color: "#ffd36a", font: "bold 32px Impact, sans-serif"}}>Choose your story</h2>
    <div style={{fontSize: 14}}>Three heroes. Three pasts. Your choice—all stories and mini-games are unlocked.</div>
    <canvas ref={canvas} width={960} height={220} aria-label="Grimble, Pip and Wisp" style={{width: "100%", minHeight: 80, flex: 1, objectFit: "contain"}} />
    <div role="group" aria-label="Choose a hero" style={{display: "flex", gap: 12}}>
      {HERO_ABILITIES.map((h, i) => <button key={h.name} style={{...button, background: hero === i ? "#7543a0" : "#21152f", borderColor: h.color}} aria-pressed={hero === i} onClick={() => setHero(i as HeroId)}>{h.name}</button>)}
    </div>
    <div style={{textAlign: "center", maxWidth: 780}}>
      <h3 style={{margin: "4px 0", color: info.color}}>{story.title}</h3>
      <div style={{fontSize: 14}}>{story.intro}</div>
      <div style={{marginTop: 8, fontSize: 13, color: "#e2cff5"}}><b>Mini-game · {story.game}</b> — {MINI_RULES[hero]}</div>
    </div>
    <div style={{display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center"}}>
      <button style={{...button, background: "#7749a4"}} onClick={() => onStory(hero)}>Play {info.name}'s story</button>
      <button style={button} onClick={() => onMini(hero)}>Play {story.game}</button>
    </div>
    <div style={{fontSize: 12}}>Solo: three chapters, backstory cutscenes, mini-games and battles. Only your chosen hero fights. No training or shared high scores.</div>
    <div style={{display: "flex", gap: 12}}><button style={button} onClick={onTeam}>Team story + training</button><button style={button} onClick={onBack}>Back</button></div>
  </div>;
}
