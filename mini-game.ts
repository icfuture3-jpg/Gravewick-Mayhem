import { miniChapter } from "./mini-backstory";
import type { HeroId } from "./solo-story";

export interface MiniInput {x: number; y: number; aimX: number; aimY: number; action?: boolean; skill?: boolean; rune?: number}
export interface MiniState {
  hero: HeroId; stage: number; time: number; elapsed: number; progress: number; goal: number;
  status: "playing" | "won" | "lost"; px: number; py: number; cooldown: number; invuln: number;
  gadget: number; tiny: number; show: number; index: number; sequence: number[]; message: string;
  sparks: {x: number; y: number; found: boolean; taken: boolean}[];
  targets: {x: number; y: number; kind: number; hit: boolean}[];
  shots: {x: number; y: number; vx: number; vy: number; kind: number; life: number}[];
}
export const MINI_RULES = [
  "WASD/arrows move. Hold J or Space to shine your lantern; walk over revealed lights. K opens a portal toward your mouse (2s cooldown). Gather all 5 lights. Red shadows steal 3 seconds.",
  "Mouse aims · J/click throws · K cycles dynamite/frost/shock. Match each target's numbered gadget. WASD/arrows move. Space shrinks for 2s to dodge the red scanner (5s cooldown). Hit all 6 targets.",
  "Watch the glowing runes, then repeat their order with 1–4 or the rune buttons. Complete three patterns. A wrong rune costs 3 seconds; K replays the pattern at a 5-second cost.",
] as const;
const sequence = (stage: number, round: number) => Array.from({length: 3 + round}, (_, i) => (stage + i * 3 + round * 2 + Math.floor(i / 2)) % 4);
export function createMini(hero: HeroId, stage = 0): MiniState {
  return {hero, stage, time: hero === 2 ? 60 : 45, elapsed: 0, progress: 0, goal: hero === 0 ? 5 : hero === 1 ? 6 : 3,
    status: "playing", px: 480, py: 390, cooldown: 0, invuln: 0, gadget: 0, tiny: 0,
    show: hero === 2 ? 3.2 : 0, index: 0, sequence: sequence(stage, 0), message: "",
    sparks: [{x: 130, y: 150}, {x: 330, y: 260}, {x: 550, y: 120}, {x: 790, y: 230}, {x: 690, y: 390}].map((p) => ({...p, found: false, taken: false})),
    targets: Array.from({length: 6}, (_, i) => ({x: 130 + i * 140, y: 105 + (i % 2) * 80, kind: (i + stage) % 3, hit: false})), shots: []};
}
export function stepMini(s: MiniState, input: MiniInput, dt: number) {
  if (s.status !== "playing") return;
  dt = Math.max(0, Math.min(0.05, dt));
  s.time -= dt; s.elapsed += dt; s.cooldown = Math.max(0, s.cooldown - dt); s.invuln = Math.max(0, s.invuln - dt); s.tiny = Math.max(0, s.tiny - dt);
  const len = Math.hypot(input.x, input.y);
  if (s.hero !== 2 && len > 0) {
    s.px = Math.max(24, Math.min(936, s.px + input.x / len * 250 * dt));
    s.py = Math.max(80, Math.min(450, s.py + input.y / len * 250 * dt));
  }
  if (s.hero === 0) {
    if (input.skill && s.cooldown === 0) {
      const dx = input.aimX - s.px, dy = input.aimY - s.py, d = Math.hypot(dx, dy);
      if (d > 0) {s.px += dx / d * Math.min(240, d); s.py += dy / d * Math.min(240, d);}
      s.px = Math.max(24, Math.min(936, s.px)); s.py = Math.max(80, Math.min(450, s.py)); s.cooldown = 2;
    }
    for (const spark of s.sparks) {
      const d = Math.hypot(s.px - spark.x, s.py - spark.y);
      if (input.action && d < 120) spark.found = true;
      if (spark.found && !spark.taken && d < 30) {spark.taken = true; s.progress++; s.message = miniChapter(s.hero, s.stage).memories[s.progress - 1]!;}
    }
    for (let i = 0; i < 3; i++) {
      const x = 180 + i * 270, y = 240 + Math.sin(s.elapsed * 1.5 + i * 2) * 120;
      if (s.invuln === 0 && Math.hypot(s.px - x, s.py - y) < 38) {s.time -= 3; s.invuln = 2; s.message = "A shadow stole 3 seconds!";}
    }
  } else if (s.hero === 1) {
    if (input.skill) s.gadget = (s.gadget + 1) % 3;
    if (input.rune === 4 && s.cooldown === 0) {s.tiny = 2; s.cooldown = 5;}
    if (input.action && s.shots.length < 3) {
      const a = Math.atan2(input.aimY - s.py, input.aimX - s.px);
      s.shots.push({x: s.px, y: s.py, vx: Math.cos(a) * 550, vy: Math.sin(a) * 550, kind: s.gadget, life: 2});
    }
    for (const shot of s.shots) {
      shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.life -= dt;
      if (shot.x < 10 || shot.x > 950) {shot.vx *= -1; shot.x = Math.max(10, Math.min(950, shot.x));}
      if (shot.y < 70 || shot.y > 460) {shot.vy *= -1; shot.y = Math.max(70, Math.min(460, shot.y));}
      const target = s.targets.find((t) => !t.hit && Math.hypot(t.x - shot.x, t.y - shot.y) < 30);
      if (target && shot.life > 0) {
        shot.life = 0;
        if (target.kind === shot.kind) {target.hit = true; s.progress++; s.message = miniChapter(s.hero, s.stage).memories[s.progress - 1]!;}
        else {s.time -= 2; s.message = "Wrong gadget! Match the target number. −2s";}
      }
    }
    s.shots = s.shots.filter((shot) => shot.life > 0);
    const scanner = 90 + (s.elapsed * 65) % 780;
    if (Math.abs(s.px - scanner) < 20 && s.tiny === 0 && s.invuln === 0) {s.time -= 3; s.invuln = 2; s.message = "Scanner spotted Pip! Shrink with Space. −3s";}
  } else {
    const showing = s.show > 0;
    s.show = Math.max(0, s.show - dt);
    if (input.skill && s.show === 0) {s.time -= 5; s.index = 0; s.show = s.sequence.length * 0.8 + 0.8; s.message = "Watch the mirrors again. −5s";}
    else if (input.rune !== undefined && !showing) {
      if (input.rune === s.sequence[s.index]) {
        s.index++; s.message = "A true reflection!";
        if (s.index === s.sequence.length) {
          s.progress++; s.index = 0;
          s.message = miniChapter(s.hero, s.stage).memories[s.progress - 1]!;
          if (s.progress < s.goal) {s.sequence = sequence(s.stage, s.progress); s.show = s.sequence.length * 0.8 + 0.8;}
        }
      } else {s.index = 0; s.time -= 3; s.message = "That was an illusion. Start the pattern again. −3s";}
    }
  }
  if (s.progress >= s.goal) s.status = "won";
  else if (s.time <= 0) {s.time = 0; s.status = "lost";}
}
export const miniBonus = (s: MiniState) => s.status === "won" ? 500 + Math.ceil(s.time) * 10 : 0;

/** Coordinates inside an object-fit:contain canvas, excluding its letterbox padding. */
export function miniPoint(rect: {left: number; top: number; width: number; height: number}, clientX: number, clientY: number) {
  const scale = Math.min(rect.width / 960, rect.height / 480);
  return {x: Math.max(0, Math.min(960, (clientX - rect.left - (rect.width - 960 * scale) / 2) / scale)),
    y: Math.max(0, Math.min(480, (clientY - rect.top - (rect.height - 480 * scale) / 2) / scale))};
}
