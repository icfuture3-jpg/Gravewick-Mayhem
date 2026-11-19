import { miniChapter } from "./mini-backstory";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { HERO_ABILITIES } from "./hero-abilities";
import { SOLO_STORIES, type HeroId } from "./solo-story";
import { createMini, stepMini, miniBonus, miniPoint, miniObjective, HOME, REPAIR_PARTS, MINI_RULES, type MiniInput } from "./mini-game";
import { drawMini } from "./mini-game-art";

const button: CSSProperties = {padding: "8px 16px", color: "white", background: "#51317c", border: "2px solid #b392e8", borderRadius: 8, cursor: "pointer", font: "bold 15px Trebuchet MS"};
export function MiniGame({hero, stage = 0, onComplete, onExit}: {
  hero: HeroId; stage?: number; onComplete: (bonus: number) => void; onExit: () => void;
}) {
  const lore = miniChapter(hero, stage);
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef(createMini(hero, stage));
  const [running, setRunning] = useState(false);
  const [version, setVersion] = useState(0);
  const snapshot = () => ({progress: state.current.progress, status: state.current.status, message: state.current.message,
    objective: miniObjective(state.current), part: state.current.part, carrying: state.current.carrying, skillCd: state.current.skillCd});
  const [view, setView] = useState(snapshot);
  const actions = useRef<Partial<MiniInput>[]>([]);
  const aim = useRef({x: 458, y: 225});
  const queue = (input: Partial<MiniInput>) => {
    if (running && state.current.status === "playing") actions.current.push({aimX: aim.current.x, aimY: aim.current.y, ...input});
  };
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const keys = new Set<string>();
    let raf = 0, last = performance.now(), lastView = 0;
    const clear = () => {keys.clear(); actions.current = [];};
    const keydown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLButtonElement && (e.code === "Space" || e.code === "Enter")) return;
      if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
      if (!e.repeat && (e.code === "KeyJ" || (e.code === "Space" && hero === 1))) queue({action: true});
      if (!e.repeat && e.code === "KeyK" && hero !== 2) queue({skill: true});
      keys.add(e.code);
    };
    const keyup = (e: KeyboardEvent) => keys.delete(e.code);
    const blur = () => {clear(); setRunning(false);};
    const draw = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      const s = state.current;
      if (running) stepMini(s, {x: Number(keys.has("KeyD") || keys.has("ArrowRight")) - Number(keys.has("KeyA") || keys.has("ArrowLeft")),
        y: Number(keys.has("KeyS") || keys.has("ArrowDown")) - Number(keys.has("KeyW") || keys.has("ArrowUp")),
        aimX: aim.current.x, aimY: aim.current.y, ...actions.current.shift()}, dt);
      drawMini(ctx, s, aim.current.x, aim.current.y);
      if (now - lastView > 80) {setView(snapshot()); lastView = now;}
      raf = requestAnimationFrame(draw);
    };
    const move = (e: PointerEvent) => {Object.assign(aim.current, miniPoint(canvas.current!.getBoundingClientRect(), e.clientX, e.clientY));};
    const click = (e: PointerEvent) => {move(e); keys.clear(); queue(hero === 1 ? {action: true} : {moveTo: true});};
    window.addEventListener("keydown", keydown); window.addEventListener("keyup", keyup); window.addEventListener("blur", blur);
    const node = canvas.current!; node.addEventListener("pointermove", move); node.addEventListener("pointerdown", click);
    raf = requestAnimationFrame(draw);
    return () => {cancelAnimationFrame(raf); clear(); window.removeEventListener("keydown", keydown); window.removeEventListener("keyup", keyup); window.removeEventListener("blur", blur); node.removeEventListener("pointermove", move); node.removeEventListener("pointerdown", click);};
  }, [hero, running, version]);
  const restart = () => {actions.current = []; aim.current = {x: 458, y: 225}; state.current = createMini(hero, stage); setView(snapshot()); setRunning(false); setVersion((n) => n + 1);};
  const walkTo = (point: {x: number; y: number}) => queue({moveTo: true, aimX: point.x, aimY: point.y});
  const disabled = !running || view.status !== "playing";
  return <div style={{position: "absolute", inset: 0, zIndex: 70, background: "#10091e", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 12, boxSizing: "border-box", overflow: "auto"}}>
    <h2 style={{margin: 0, color: HERO_ABILITIES[hero].color}}>{HERO_ABILITIES[hero].name} · {SOLO_STORIES[hero].game}</h2>
    <div style={{fontSize: 14, color: "#ead4ff", textAlign: "center"}}><b>Memory {stage + 1}/3 · {lore.place}</b> — {lore.objective}</div>
    <div style={{fontSize: 14, maxWidth: 900, textAlign: "center"}}>{MINI_RULES[hero]}</div>
    <div aria-live="polite" style={{color: "#ffd36a", fontWeight: "bold"}}>{view.progress}/{state.current.goal} {hero === 0 ? "sparks home" : hero === 1 ? "toys repaired" : "pages restored"} · {view.objective}</div>
    <canvas ref={canvas} width={960} height={480} aria-label={`${SOLO_STORIES[hero].game} playfield`} aria-describedby="mini-instruction" style={{width: "100%", flex: 1, minHeight: 100, objectFit: "contain", cursor: hero === 1 ? "crosshair" : "pointer", touchAction: "none"}} />
    <div id="mini-instruction" style={{fontSize: 14, color: "#ead4ff", textAlign: "center"}}>{view.status === "won" ? lore.ending : view.message || "Press Start mini-game when you are ready. Use the playfield or the buttons below."}</div>
    <div role="group" aria-label="Mini-game actions" style={{display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center"}}>
      {hero === 1 ? REPAIR_PARTS.map((p, i) => <button key={i} disabled={disabled} style={{...button, borderColor: view.part === i ? "#ffdc6a" : "#b392e8"}} onClick={() => queue({action: true, aimX: p.x, aimY: p.y})}>Hit part {i + 1}{view.part === i ? " · GOLD" : ""}</button>) : <>
        {hero === 0 ? state.current.sparks.map((p, i) => <button key={i} disabled={disabled || p.taken || p.following} style={button} onClick={() => walkTo(p)}>Find spark {i + 1}</button>) : state.current.pages.map((p, i) => <button key={i} disabled={disabled || p.taken || view.carrying !== null} style={button} onClick={() => walkTo(p)}>Collect page {i + 1}</button>)}
        <button disabled={disabled} style={button} onClick={() => hero === 2 ? queue({returnToBook: true}) : walkTo(HOME)}>{hero === 0 ? "Guide sparks HOME" : "Return to BOOK"}</button>
      </>}
    </div>
    <div role="group" aria-label="Grimoire moves" style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
      <button style={button} disabled={disabled || (hero === 2 && view.carrying !== null)} onClick={() => queue({action:true, ...(hero === 2 ? {aimX:(state.current.pages.find(p => !p.taken)?.x ?? aim.current.x), aimY:(state.current.pages.find(p => !p.taken)?.y ?? aim.current.y)} : {})})}>{HERO_ABILITIES[hero].primaryName} · J</button>
      {hero !== 2 && <button style={button} disabled={disabled || view.skillCd > 0} onClick={() => queue({skill:true, ...(hero === 1 ? {aimX:REPAIR_PARTS[state.current.part]!.x,aimY:REPAIR_PARTS[state.current.part]!.y} : {})})}>{HERO_ABILITIES[hero].skillName} · K{view.skillCd > 0 ? ` (${Math.ceil(view.skillCd)}s)` : ""}</button>}
    </div>
    <div role="status" style={{fontSize: 14}}>{view.status === "won" ? `Challenge complete! +${miniBonus(state.current)} bonus` : running ? "Playing · No time limit" : state.current.elapsed > 0 ? "Paused · Your progress is safe" : "Ready when you are"}</div>
    <div style={{display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center"}}>
      {view.status === "playing" && <button style={button} onClick={(e) => {e.currentTarget.blur(); setRunning((v) => !v);}}>{running ? "Pause mini-game" : state.current.elapsed > 0 ? "Resume mini-game" : "Start mini-game"}</button>}
      <button style={button} onClick={restart}>Restart mini-game</button>
      {view.status === "won" && <button style={button} onClick={() => onComplete(miniBonus(state.current))}>Continue tale</button>}
      <button style={button} onClick={onExit}>Back to Gravewick Tales</button>
    </div>
  </div>;
}
