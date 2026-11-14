import { miniChapter } from "./mini-backstory";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { drawHero } from "./art";
import { HERO_ABILITIES, GADGETS } from "./hero-abilities";
import { SOLO_STORIES, type HeroId } from "./solo-story";
import { createMini, stepMini, miniBonus, miniPoint, MINI_RULES, type MiniInput, type MiniState } from "./mini-game";

const button: CSSProperties = {padding: "8px 16px", color: "white", background: "#51317c", border: "2px solid #b392e8", borderRadius: 8, cursor: "pointer", font: "bold 15px Trebuchet MS"};
export function MiniGame({hero, stage = 0, onComplete, onExit}: {
  hero: HeroId; stage?: number; onComplete: (bonus: number) => void; onExit: () => void;
}) {
  const chapter = stage;
  const lore = miniChapter(hero, chapter);
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef(createMini(hero, chapter));
  const [running, setRunning] = useState(false);
  const [version, setVersion] = useState(0);
  const [view, setView] = useState({time: state.current.time, progress: 0, status: "playing", message: "", show: true, gadget: 0});
  const actions = useRef<{action?: boolean; skill?: boolean; rune?: number}>({});
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const keys = new Set<string>();
    const aim = {x: 480, y: 180};
    let raf = 0, last = performance.now(), lastView = 0;
    const clear = () => {keys.clear(); actions.current = {};};
    const keydown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLButtonElement && (e.code === "Space" || e.code === "Enter")) return;
      if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
      if (!e.repeat) {
        if (e.code === "KeyK") actions.current.skill = true;
        if (e.code === "KeyJ") actions.current.action = true;
        if (e.code === "Space" && hero === 1) actions.current.rune = 4;
        const rune = ["Digit1", "Digit2", "Digit3", "Digit4"].indexOf(e.code);
        if (rune >= 0) actions.current.rune = rune;
      }
      keys.add(e.code);
    };
    const keyup = (e: KeyboardEvent) => keys.delete(e.code);
    const blur = () => {clear(); setRunning(false);};
    const draw = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      const s = state.current;
      if (running) {
        const input: MiniInput = {x: Number(keys.has("KeyD") || keys.has("ArrowRight")) - Number(keys.has("KeyA") || keys.has("ArrowLeft")),
          y: Number(keys.has("KeyS") || keys.has("ArrowDown")) - Number(keys.has("KeyW") || keys.has("ArrowUp")), aimX: aim.x, aimY: aim.y, ...actions.current};
        if (hero === 0 && (keys.has("KeyJ") || keys.has("Space"))) input.action = true;
        stepMini(s, input, dt); actions.current = {};
      }
      drawMini(ctx, s, aim.x, aim.y);
      if (now - lastView > 80) {setView({time: s.time, progress: s.progress, status: s.status, message: s.message, show: s.show > 0, gadget: s.gadget}); lastView = now;}
      raf = requestAnimationFrame(draw);
    };
    const move = (e: MouseEvent) => {const box = canvas.current!.getBoundingClientRect(); Object.assign(aim, miniPoint(box, e.clientX, e.clientY));};
    const click = (e: MouseEvent) => {move(e); if (hero !== 2) actions.current.action = true;};
    window.addEventListener("keydown", keydown); window.addEventListener("keyup", keyup); window.addEventListener("blur", blur);
    const node = canvas.current!; node.addEventListener("mousemove", move); node.addEventListener("click", click);
    raf = requestAnimationFrame(draw);
    return () => {cancelAnimationFrame(raf); clear(); window.removeEventListener("keydown", keydown); window.removeEventListener("keyup", keyup); window.removeEventListener("blur", blur); node.removeEventListener("mousemove", move); node.removeEventListener("click", click);};
  }, [hero, running, version]);
  const restart = () => {state.current = createMini(hero, chapter); setView({time: state.current.time, progress: 0, status: "playing", message: "", show: true, gadget: 0}); setRunning(false); setVersion((n) => n + 1);};
  return <div style={{position: "absolute", inset: 0, zIndex: 70, background: "#10091e", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 12, boxSizing: "border-box", overflow: "auto"}}>
    <div style={{color: "#ffd36a", fontWeight: "bold"}}>Gravewick Tales</div>
    <h2 style={{margin: 0, color: HERO_ABILITIES[hero].color}}>{HERO_ABILITIES[hero].name} · {SOLO_STORIES[hero].game}</h2>
    <div style={{fontSize: 14, color: "#ead4ff", textAlign: "center"}}><b>Memory {chapter + 1}/3 · {lore.place}</b> — {lore.objective}</div>
    <div style={{fontSize: 14, maxWidth: 900, textAlign: "center"}}>{MINI_RULES[hero]}</div>
    <div aria-live="polite" style={{color: "#ffd36a"}}>{Math.ceil(view.time)}s · {view.progress}/{state.current.goal} {hero === 2 ? "patterns" : hero === 1 ? "targets" : "lights"}{hero === 1 ? ` · Gadget ${view.gadget + 1}: ${GADGETS[view.gadget]!.name}` : ""}</div>
    <div aria-live="polite" style={{fontSize: 13, maxWidth: 900, textAlign: "center", minHeight: 32, color: "#e2cff5"}}>
      {view.status === "won" ? lore.ending : view.message || SOLO_STORIES[hero].intro}
    </div>
    <canvas ref={canvas} width={960} height={480} aria-label={`${SOLO_STORIES[hero].game} playfield`} style={{width: "100%", flex: 1, minHeight: 0, objectFit: "contain", cursor: "crosshair"}} />
    {hero === 2 && <div style={{display: "flex", gap: 8}}>{["Moon", "Star", "Eye", "Key"].map((name, i) => <button key={name} style={button} disabled={!running || view.show || view.status !== "playing"} onClick={() => {actions.current.rune = i;}}>{i + 1} · {name}</button>)}</div>}
    <div role="status" style={{minHeight: 18, fontSize: 14}}>{view.status === "won" ? `Challenge complete! +${miniBonus(state.current)} bonus` : view.status === "lost" ? "Time's up. Retry this memory, or choose another character." : (hero === 2 ? "Watch the rune lights, then repeat them." : "Ready when you are.")}</div>
    <div style={{display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center"}}>
      {view.status === "playing" && <button style={button} onClick={(event) => {event.currentTarget.blur(); setRunning((v) => !v);}}>{running ? "Pause mini-game" : state.current.elapsed > 0 ? "Resume mini-game" : "Start mini-game"}</button>}
      {view.status !== "playing" && <button style={button} onClick={() => restart()}>Retry mini-game</button>}
      {view.status === "won" && <button style={button} onClick={() => onComplete(miniBonus(state.current))}>Continue tale</button>}
      <button style={button} onClick={onExit}>Back to Gravewick Tales</button>
    </div>
  </div>;
}

export function drawMini(ctx: CanvasRenderingContext2D, s: MiniState, aimX: number, aimY: number) {
  ctx.clearRect(0, 0, 960, 480); ctx.fillStyle = s.hero === 0 ? "#102b2c" : s.hero === 1 ? "#38231c" : "#211437"; ctx.fillRect(0, 0, 960, 480);
  ctx.strokeStyle = "#39264f"; ctx.lineWidth = 1;
  for (let x = 0; x < 960; x += 60) {ctx.beginPath(); ctx.moveTo(x, 70); ctx.lineTo(x, 465); ctx.stroke();}
  ctx.font = "bold 18px Trebuchet MS"; ctx.fillStyle = "#e8d6b8"; ctx.textAlign = "left";
  ctx.fillText(miniChapter(s.hero, s.stage).place, 24, 30);
  if (s.hero === 0) {
    for (let i = 0; i < 6; i++) {ctx.fillStyle = "#445754"; ctx.fillRect(80 + i * 150, 55, 42, 38); ctx.fillStyle = "#b5a37b"; ctx.fillRect(95 + i * 150, 62, 12, 20);}
    for (const spark of s.sparks) if (!spark.taken) {
      ctx.fillStyle = spark.found ? "#ffd36a" : "#50405e";
      ctx.beginPath(); ctx.arc(spark.x, spark.y, spark.found ? 14 : 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,211,106,0.3)"; ctx.beginPath(); ctx.arc(s.px, s.py, 120, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 3; i++) {ctx.fillStyle = "#b52f68"; ctx.beginPath(); ctx.arc(180 + i * 270, 240 + Math.sin(s.elapsed * 1.5 + i * 2) * 120, 25, 0, Math.PI * 2); ctx.fill();}
  } else if (s.hero === 1) {
    for (let i = 0; i < 6; i++) {ctx.fillStyle = "#6b4c34"; ctx.fillRect(95 + i * 140, 70, 70, 150); ctx.fillStyle = "#a47d4b"; ctx.fillRect(90 + i * 140, 210, 80, 10);}
    ctx.fillStyle = "rgba(255,70,70,0.4)"; ctx.fillRect(90 + (s.elapsed * 65) % 780 - 4, 70, 8, 395);
    for (const target of s.targets) if (!target.hit) {
      ctx.fillStyle = GADGETS[target.kind]!.color; ctx.beginPath(); ctx.arc(target.x, target.y, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#10091e"; ctx.font = "bold 20px Trebuchet MS"; ctx.textAlign = "center"; ctx.fillText(String(target.kind + 1), target.x, target.y + 7);
    }
    for (const shot of s.shots) {ctx.fillStyle = GADGETS[shot.kind]!.color; ctx.beginPath(); ctx.arc(shot.x, shot.y, 9, 0, Math.PI * 2); ctx.fill();}
  } else {
    for (let i = 0; i < 10; i++) {ctx.fillStyle = "#513d64"; ctx.fillRect(i * 100, 40, 70, 35); ctx.fillStyle = "#9c77b3"; ctx.fillRect(i * 100 + 5, 43, 8, 28);}
    const active = s.show > 0 ? s.sequence[Math.floor((s.sequence.length * 0.8 + 0.8 - s.show) / 0.8)] : undefined;
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = active === i ? "#ffb5ed" : "#46315d"; ctx.strokeStyle = "#b481e8"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(170 + i * 170, 100, 140, 130, 15); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "white"; ctx.font = "bold 24px Trebuchet MS"; ctx.textAlign = "center";
      ctx.fillText(["1 · Moon", "2 · Star", "3 · Eye", "4 · Key"][i]!, 240 + i * 170, 175);
    }
    ctx.fillStyle = "#ffd36a"; ctx.font = "bold 22px Trebuchet MS"; ctx.textAlign = "center";
    ctx.fillText(s.show > 0 ? "WATCH THE PATTERN" : `YOUR TURN · ${s.index}/${s.sequence.length}`, 480, 280);
  }
  ctx.save(); if (s.tiny > 0) {ctx.translate(s.px, s.py); ctx.scale(0.45, 0.45); ctx.translate(-s.px, -s.py);}
  drawHero(ctx, s.hero, s.px, s.py, Math.atan2(aimY - s.py, aimX - s.px), s.elapsed, s.invuln > 0, false, 0.2, s); ctx.restore();
  if (s.hero !== 2) {ctx.strokeStyle = "white"; ctx.beginPath(); ctx.arc(aimX, aimY, 9, 0, Math.PI * 2); ctx.stroke();}
}
