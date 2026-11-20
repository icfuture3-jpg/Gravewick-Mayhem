import { challengeName, challengeRules, challengeHit, MACHINE_LOCKS, SKY_STARS } from "./chapter-challenges";
import { createSound } from "./audio";
import { miniChapter } from "./mini-backstory";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { HERO_ABILITIES } from "./hero-abilities";
import { SOLO_STORIES, type HeroId } from "./solo-story";
import { createMini, stepMini, miniBonus, miniPoint, miniObjective, sparkControl, grimbleRules, REPAIR_PARTS, MINI_RULES, type MiniInput } from "./mini-game";
import { drawMini } from "./mini-game-art";

const button: CSSProperties = {padding: "8px 16px", color: "white", background: "#51317c", border: "2px solid #b392e8", borderRadius: 8, cursor: "pointer", font: "bold 15px Trebuchet MS"};
export function MiniGame({hero, stage = 0, onComplete, onExit, muted = false, onMuted, campaign = false}: {
  hero: HeroId; stage?: number; campaign?: boolean; onComplete: (bonus: number) => void; onExit: () => void; muted?: boolean; onMuted?: (muted: boolean) => void;
}) {
  const collectionOnly = hero===2 && stage===0;
  const lore = miniChapter(hero, stage);
  const sound = useRef<ReturnType<typeof createSound> | null>(null);
  useEffect(() => {
    if(hero !== 1) return;
    sound.current = createSound(); sound.current.setMuted(muted);
    return () => {sound.current?.close();sound.current=null;};
  }, [hero]);
  useEffect(() => {sound.current?.setMuted(muted);}, [muted]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef(createMini(hero, stage));
  const [running, setRunning] = useState(false);
  const [version, setVersion] = useState(0);
  const snapshot = () => ({progress: state.current.progress, status: state.current.status, message: state.current.message,
    objective: campaign && state.current.status === "won" ? "Objective complete! Return to battle when ready." : miniObjective(state.current), part: state.current.part, carrying: state.current.carrying, skillCd: state.current.skillCd, ultimateCd: state.current.ultimateCd, tiny: state.current.tiny, illusions: state.current.illusions.length});
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
      if(!e.repeat && hero===0 && stage===0 && /^(Digit|Numpad)[1-5]$/.test(e.code)) {
        e.preventDefault();queue({findSpark:Number(e.code.slice(-1))-1});return;
      }
      if (!e.repeat && (e.code === "KeyJ" || (e.code === "Space" && hero === 1))) queue({action: true});
      if (!e.repeat && e.code === "KeyL") queue({ultimate:true});
      if (!e.repeat && e.code === "KeyK" && hero !== 2) queue({skill: true});
      keys.add(e.code);
    };
    const keyup = (e: KeyboardEvent) => keys.delete(e.code);
    const blur = () => {clear(); setRunning(false);};
    const draw = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      const s = state.current;
      const hitsBefore = s.hammerHits;
      // Preserve quick repair clicks until the mallet is ready instead of discarding them.
      if (running) stepMini(s, {x: Number(keys.has("KeyD") || keys.has("ArrowRight")) - Number(keys.has("KeyA") || keys.has("ArrowLeft")),
        y: Number(keys.has("KeyS") || keys.has("ArrowDown")) - Number(keys.has("KeyW") || keys.has("ArrowUp")),
        aimX: aim.current.x, aimY: aim.current.y, ...(hero===1 && stage===0 && actions.current[0]?.action && s.swing>dt ? {} : actions.current.shift())}, dt);
      if(s.hammerHits > hitsBefore) sound.current?.sample?.("wood",0.75);
      drawMini(ctx, s, aim.current.x, aim.current.y);
      if (now - lastView > 80) {setView(snapshot()); lastView = now;}
      raf = requestAnimationFrame(draw);
    };
    const move = (e: PointerEvent) => {Object.assign(aim.current, miniPoint(canvas.current!.getBoundingClientRect(), e.clientX, e.clientY));};
    const click = (e: PointerEvent) => {
      move(e); keys.clear();
      const interact=challengeHit(hero,stage,aim.current.x,aim.current.y);
      if(stage===1 && (hero===1 || hero===2)) {if(interact!==undefined) queue({interact});}
      else if(hero===2 && stage===2) queue({action:true});
      else queue(hero===1 && stage===0 ? {action:true}:{moveTo:true});
    };
    window.addEventListener("keydown", keydown); window.addEventListener("keyup", keyup); window.addEventListener("blur", blur);
    const node = canvas.current!; node.addEventListener("pointermove", move); node.addEventListener("pointerdown", click);
    raf = requestAnimationFrame(draw);
    return () => {cancelAnimationFrame(raf); clear(); window.removeEventListener("keydown", keydown); window.removeEventListener("keyup", keyup); window.removeEventListener("blur", blur); node.removeEventListener("pointermove", move); node.removeEventListener("pointerdown", click);};
  }, [hero, running, version]);
  const restart = () => {actions.current = []; aim.current = {x: 458, y: 225}; state.current = createMini(hero, stage); setView(snapshot()); setRunning(false); setVersion((n) => n + 1);};
  const walkTo = (point: {x: number; y: number}) => queue({moveTo: true, aimX: point.x, aimY: point.y});
  const disabled = !running || view.status !== "playing";
  return <div style={{position: "absolute", inset: 0, zIndex: 70, background: "#10091e", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 12, boxSizing: "border-box", overflow: "auto"}}>
    {campaign && <small>Combat paused · Complete this objective to continue your run.</small>}
    <h2 style={{margin: 0, color: HERO_ABILITIES[hero].color}}>{HERO_ABILITIES[hero].name} · {challengeName(hero,stage)}</h2>
    <div style={{fontSize: 14, color: "#ead4ff", textAlign: "center"}}><b>{campaign ? "Mayhem objective" : "Personal memory"} · {lore.place}</b> — {lore.objective}</div>
    <div style={{fontSize: 14, maxWidth: 900, textAlign: "center"}}>{challengeRules(hero,stage) ?? (hero === 0 ? grimbleRules(stage) : MINI_RULES[hero])}</div>
    <div aria-live="polite" style={{color: "#ffd36a", fontWeight: "bold"}}>{view.progress}/{state.current.goal} {hero === 0 ? stage === 0 ? "shards caught" : stage === 1 ? "lanterns relit" : "gate seals activated" : hero === 1 ? stage===0 ? "toys repaired" : stage===1 ? "sockets connected" : "locks opened" : stage===0 ? "pages restored" : stage===1 ? "mirrors aligned" : "stars inscribed"} · {view.objective}</div>
    <canvas ref={canvas} width={960} height={480} aria-label={`${campaign ? challengeName(hero,stage) : SOLO_STORIES[hero].game} playfield`} aria-describedby="mini-instruction" style={{width: "100%", flex: 1, minHeight: 100, objectFit: "contain", cursor: hero === 1 ? "crosshair" : "pointer", touchAction: "none"}} />
    <div id="mini-instruction" style={{fontSize: 14, color: "#ead4ff", textAlign: "center"}}>{view.status === "won" ? lore.ending : view.message || "Press Start mini-game when you are ready. Use the playfield or the buttons below."}</div>
    <div role="group" aria-label="Mini-game actions" style={{display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center"}}>
      {hero===1 && stage===1 ? ["Gear ○","Spring ϟ","Battery ▤"].map((name,i)=><button key={name} style={button} disabled={disabled} onClick={()=>queue({interact:i})}>Fit {name}</button>)
      : hero===1 && stage===2 ? <><button style={button} disabled={disabled} onClick={()=>walkTo(MACHINE_LOCKS[Math.min(5,state.current.progress)]!)}>Go to next lock</button><button style={button} disabled={disabled} onClick={()=>queue({action:true})}>Open nearby lock · J</button></>
      : hero===2 && stage===1 ? [0,1,2].map(i=><button key={i} style={button} disabled={disabled || state.current.aligned[i]} onClick={()=>queue({interact:i})}>Rotate mirror {i+1}{state.current.aligned[i]?" · ALIGNED":""}</button>)
      : hero===2 && stage===2 ? SKY_STARS.map((p,i)=><button key={i} style={button} disabled={disabled || i<view.progress} onClick={()=>queue({action:true,aimX:p.x,aimY:p.y})}>Inscribe star {i+1}</button>)
      : hero === 1 ? REPAIR_PARTS.map((p, i) => <button key={i} disabled={disabled} style={{...button, borderColor: view.part === i ? "#ffdc6a" : "#b392e8"}} onClick={() => queue({action: true, aimX: p.x, aimY: p.y})}>Hit part {i + 1}{view.part === i ? " · GOLD" : ""}</button>) : <>
        {hero === 0 ? state.current.sparks.map((p, i) => {
          const control = hero === 0 && stage > 0
            ? {label:p.taken ? `${stage===1 ? "Lantern" : "Seal"} ${i+1} · DONE ✓` : `Go to ${stage===1 ? "lantern" : "seal"} ${i+1}`,rescued:p.taken}
            : sparkControl(p, i);
          return <button key={i} disabled={disabled || control.rescued} style={button} onClick={() => queue({findSpark:i})}>{control.label}</button>;
        }) : state.current.pages.map((p, i) => <button key={i} disabled={disabled || p.taken || view.carrying !== null} style={button} onClick={() => walkTo(p)}>Collect page {i + 1}</button>)}
        {hero !== 0 ? <button disabled={disabled} style={button} onClick={() => queue({returnToBook: true})}>Return to BOOK</button>
        : stage > 0 ? <button disabled={disabled} style={button} onClick={() => queue({action:true})}>{stage===1 ? "Light nearby lantern" : "Activate nearby seal"} · J</button> : null}
      </>}
    </div>
    {!collectionOnly && <div role="group" aria-label="Grimoire moves" style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
      <button style={button} disabled={disabled || (stage===1 && hero===2) || (hero === 2 && view.carrying !== null)} onClick={() => queue({action:true, ...(hero === 2 && stage===0 ? {aimX:(state.current.pages.find(p => !p.taken)?.x ?? aim.current.x), aimY:(state.current.pages.find(p => !p.taken)?.y ?? aim.current.y)} : {})})}>{HERO_ABILITIES[hero].primaryName} · J</button>
      {(hero===0 || (hero===1 && stage===0)) && <button style={button} disabled={disabled || view.skillCd > 0} onClick={() => queue({skill:true, ...(hero === 1 ? {aimX:REPAIR_PARTS[state.current.part]!.x,aimY:REPAIR_PARTS[state.current.part]!.y} : {})})}>{HERO_ABILITIES[hero].skillName} · K{view.skillCd > 0 ? ` (${Math.ceil(view.skillCd)}s)` : ""}</button>}
      <button style={button} disabled={disabled || view.ultimateCd > 0} onClick={() => queue({ultimate:true})}>{HERO_ABILITIES[hero].ultName} · L{view.ultimateCd > 0 ? ` (${Math.ceil(view.ultimateCd)}s)` : " · Ready"}</button>
    </div>}
    {!collectionOnly && <div aria-live="polite" style={{fontSize:14,color:"#ffd36a"}}>{view.tiny > 0 ? `Tiny Trouble active · ${Math.ceil(view.tiny)}s · ${stage===2 ? "faster movement" : "faster mallet"}` : view.illusions > 0 ? `${view.illusions} Mirror Illusions active · ${stage===0?"retrieving pages":stage===1?"lighting the mirror targets":"casting constellation bolts"}` : "L ultimate: ready at chapter start, 12s recharge. Pausing freezes recharge."}</div>}
    {onMuted && <button style={button} onClick={() => onMuted(!muted)}>Sound: {muted ? "off" : "on"}</button>}
    <div role="status" style={{fontSize: 14}}>{view.status === "won" ? `Challenge complete! +${miniBonus(state.current)} bonus` : running ? "Playing · No time limit" : state.current.elapsed > 0 ? "Paused · Your progress is safe" : "Ready when you are"}</div>
    <div style={{display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center"}}>
      {view.status === "playing" && <button style={button} onClick={(e) => {e.currentTarget.blur(); setRunning((v) => !v);}}>{running ? "Pause mini-game" : state.current.elapsed > 0 ? "Resume mini-game" : "Start mini-game"}</button>}
      <button style={button} onClick={restart}>Restart mini-game</button>
      {view.status === "won" && <button style={button} onClick={() => onComplete(miniBonus(state.current))}>{campaign ? "Return to battle" : "Continue tale"}</button>}
      <button style={button} onClick={onExit}>{campaign ? "Quit to main menu" : "Back to Gravewick Tales"}</button>
    </div>
  </div>;
}
