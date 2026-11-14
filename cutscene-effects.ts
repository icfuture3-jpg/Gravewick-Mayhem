import type { Sound } from "./audio";
import type { Action } from "./movie";

export type CutsceneCue = {time: number; kind: "laser" | "explosion" | "lightning" | "thunder"};
/** One-shot cues in scene time, not repeating wall-clock timers. */
export function cutsceneCues(action: Action, duration: number): CutsceneCue[] {
  if (action === "victory") return [];
  const impact = duration * 0.62;
  if (action === "gadget") return [{time: impact, kind: "explosion"}];
  if (action === "illusion") return [0.3, 0.63, 0.96].map((p) => ({time: duration * p, kind: "laser"}));
  if (action === "portal") return [{time: duration * 0.3, kind: "lightning"}, {time: duration * 0.3 + 0.18, kind: "thunder"}];
  return [{time: duration * 0.3, kind: "laser"}, {time: impact, kind: "lightning"},
    {time: impact, kind: "explosion"}, {time: impact + 0.18, kind: "thunder"}];
}
export function playCutsceneCues(sound: Sound, action: Action, duration: number, previous: number, time: number) {
  for (const cue of cutsceneCues(action, duration)) {
    if (cue.time <= previous || cue.time > time) continue;
    if (cue.kind === "laser") {sound.tone(1500, "sawtooth", 0.18, 0.075, -1400); sound.tone(720, "sine", 0.12, 0.045, -600);}
    if (cue.kind === "explosion") sound.sample?.("explosion", 0.7);
    // The recorded thunder contains the natural crack and rolling tail.
    if (cue.kind === "thunder") sound.sample?.("thunder", 0.8);
  }
}
/** Restrained, non-looping light bursts; reduced motion suppresses flashes. */
export function drawCutsceneEffects(ctx: CanvasRenderingContext2D, action: Action, duration: number, time: number, width: number, height: number, reducedMotion = false) {
  ctx.save();
  for (const cue of cutsceneCues(action, duration)) {
    const age = time - cue.time;
    if (age < 0 || age > 0.55 || cue.kind === "thunder") continue;
    const fade = Math.max(0, 1 - age / 0.55);
    ctx.globalAlpha = fade;
    if (cue.kind === "lightning" && !reducedMotion) {
      ctx.fillStyle = `rgba(180,205,255,${0.12 * fade})`; ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "#d6edff"; ctx.lineWidth = 4; ctx.shadowColor = "#88bfff"; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.moveTo(width * 0.8, height * 0.08); ctx.lineTo(width * 0.74, height * 0.3);
      ctx.lineTo(width * 0.8, height * 0.3); ctx.lineTo(width * 0.7, height * 0.7); ctx.stroke();
    } else if (cue.kind === "laser") {
      ctx.strokeStyle = "#ff9bf7"; ctx.lineWidth = 7 * fade + 1; ctx.shadowColor = "#ee53ff"; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.moveTo(width * 0.55, height * 0.62); ctx.lineTo(width * 0.82, height * 0.55); ctx.stroke();
    } else if (cue.kind === "explosion") {
      ctx.strokeStyle = "#ffb85e"; ctx.fillStyle = "rgba(255,158,56,0.18)"; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(width * 0.8, height * 0.62, 18 + age * 140, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }
  ctx.restore();
}
