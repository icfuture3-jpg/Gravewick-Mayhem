import { useEffect, useRef, useState, type CSSProperties } from "react";
import { startTale, advanceTale, taleScenes } from "./tales";
import { MiniGame } from "./mini-game-view";
import { HERO_ABILITIES } from "./hero-abilities";
import { SOLO_STORIES, type HeroId } from "./solo-story";
import { drawAction } from "./cinematic";
import type { Scene } from "./movie";

const button: CSSProperties = {padding: "9px 22px", background: "#694090", border: "2px solid #c3a1ed", borderRadius: 8, color: "white", cursor: "pointer", font: "bold 16px Trebuchet MS"};
const panel: CSSProperties = {position: "absolute", inset: 0, zIndex: 70, background: "radial-gradient(ellipse at top,#33204f,#10091e)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 16, boxSizing: "border-box", overflow: "auto", textAlign: "center"};

export function Tales({hero, onExit}: {hero: HeroId; onExit: () => void}) {
  const [tale, setTale] = useState(() => startTale(hero));
  const title = SOLO_STORIES[hero].title;
  if (tale.phase === "game") return <MiniGame key={`${hero}-${tale.chapter}`} hero={hero} stage={tale.chapter}
    onComplete={(bonus) => setTale((current) => advanceTale(current, "win", bonus))} onExit={onExit} />;
  if (tale.phase === "complete") return <div style={panel}>
    <h1 style={{margin: 0, color: "#ffd36a"}}>Gravewick Tales</h1>
    <h2>{HERO_ABILITIES[hero].name}'s tale complete</h2>
    <h3 style={{color: HERO_ABILITIES[hero].color}}>{title}</h3>
    <p style={{maxWidth: 700}}>{SOLO_STORIES[hero].ending}</p>
    <div>Three memories restored · Tales score {tale.score}</div>
    <div style={{display: "flex", gap: 12}}><button style={button} onClick={() => setTale(startTale(hero))}>Replay this tale</button><button style={button} onClick={onExit}>Choose another character</button></div>
    <small>Separate from Gravewick Mayhem · Session-only progress</small>
  </div>;
  return <TaleCutscene key={`${tale.chapter}-${tale.phase}`} scenes={taleScenes(tale)}
    label={`Gravewick Tales · ${HERO_ABILITIES[hero].name} · Chapter ${tale.chapter + 1}/3`}
    nextLabel={tale.phase === "intro" ? "Play this memory" : tale.chapter === 2 ? "Finish tale" : "Next chapter"}
    onNext={() => setTale((current) => advanceTale(current, "continue"))} onExit={onExit} />;
}

function TaleCutscene({scenes, label, nextLabel, onNext, onExit}: {scenes: Scene[]; label: string; nextLabel: string; onNext: () => void; onExit: () => void}) {
  const [picked, setPicked] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = scenes[picked]!;
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const start = performance.now(); let raf = 0;
    const frame = (now: number) => {
      ctx.clearRect(0, 0, 960, 360); ctx.fillStyle = "#211531"; ctx.fillRect(0, 0, 960, 360);
      drawAction(ctx, scene, Math.min(scene.duration - 0.01, (now - start) / 1000));
      raf = requestAnimationFrame(frame);
    }; raf = requestAnimationFrame(frame); return () => cancelAnimationFrame(raf);
  }, [scene]);
  return <div style={panel}>
    <h2 style={{margin: 0, color: "#ffd36a"}}>{label}</h2>
    <h3 style={{margin: 0}}>{scene.caption}</h3>
    <canvas ref={canvas} width={960} height={360} aria-label="Personal story cutscene" style={{width: "100%", flex: 1, minHeight: 80, objectFit: "contain"}} />
    <p style={{maxWidth: 800, margin: 0}}>{scene.text}</p>
    <div style={{display: "flex", gap: 12}}><button style={button} onClick={() => picked + 1 < scenes.length ? setPicked(picked + 1) : onNext()}>{picked + 1 < scenes.length ? "Continue story" : nextLabel}</button><button style={button} onClick={onExit}>Back to Gravewick Tales</button></div>
    <small>Story {picked + 1}/{scenes.length} · Mini-games only · No arena battles</small>
  </div>;
}
