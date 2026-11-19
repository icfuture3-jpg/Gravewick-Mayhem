import { miniChapter } from "./mini-backstory";
import type { HeroId } from "./solo-story";

export interface MiniInput {x: number; y: number; aimX: number; aimY: number; action?: boolean; moveTo?: boolean}
interface Light {x: number; y: number; found: boolean; following: boolean; taken: boolean}
export interface MiniState {
  hero: HeroId; stage: number; elapsed: number; progress: number; goal: number;
  status: "playing" | "won"; px: number; py: number; invuln: number; message: string;
  destination: {x: number; y: number} | null;
  sparks: Light[]; pages: {x: number; y: number; taken: boolean}[]; carrying: number | null;
  part: number; swing: number; swingX: number; swingY: number;
}
export const HOME = {x: 480, y: 405};
export const REPAIR_PARTS = [{x: 458, y: 225}, {x: 505, y: 255}, {x: 480, y: 290}] as const;
export const MINI_RULES = [
  "Click the ground or use WASD/arrows to move. Your lantern reveals nearby star sparks automatically. Walk close to a spark so it follows you, then lead it to the glowing HOME lantern. Avoid the purple shadows. Rescue all 5. No time limit.",
  "Click the large golden broken part to hit it with Pip’s meat mallet. Repair the 3 highlighted parts in order, then fix the next monster toy. Fix all 6 toys. You can also aim with the mouse and press J or Space. No wrong-hit penalty or time limit.",
  "Click a glowing page or use WASD/arrows to walk to it. Pick it up by walking close, then return it to the open BOOK. Carry one page at a time. Restore all 3 pages. No patterns to remember and no time limit.",
] as const;
export function createMini(hero: HeroId, stage = 0): MiniState {
  return {hero, stage, elapsed: 0, progress: 0, goal: hero === 0 ? 5 : hero === 1 ? 6 : 3,
    status: "playing", px: HOME.x, py: HOME.y, invuln: 0, destination: null, message: "",
    sparks: [{x: 130, y: 150}, {x: 330, y: 260}, {x: 550, y: 120}, {x: 790, y: 230}, {x: 740, y: 390}].map((p) => ({...p, found: false, following: false, taken: false})),
    pages: [{x: 185, y: 180}, {x: 735, y: 180}, {x: 770, y: 350}].map((p) => ({...p, taken: false})), carrying: null,
    part: 0, swing: 0, swingX: REPAIR_PARTS[0].x, swingY: REPAIR_PARTS[0].y};
}
export function shadowPosition(index: number, time: number) {
  return {x: 230 + index * 250, y: 220 + Math.sin(time * 0.8 + index * 2) * 85};
}
const distance = (a: {x: number; y: number}, b: {x: number; y: number}) => Math.hypot(a.x - b.x, a.y - b.y);
export function miniObjective(s: MiniState): string {
  if (s.status === "won") return "All restored! Choose Continue tale to see what happens next.";
  if (s.hero === 1) return `Toy ${s.progress + 1}/6 · Hit golden part ${s.part + 1}/3`;
  if (s.hero === 2) return s.carrying === null ? "Find a glowing page — walk to it to pick it up" : "Page collected! Return to the glowing BOOK";
  const following = s.sparks.filter((spark) => spark.following && !spark.taken).length;
  return following ? `${following} ${following === 1 ? "spark is" : "sparks are"} following — guide them to HOME` : "Find star sparks — your lantern lights the way";
}
export function stepMini(s: MiniState, input: MiniInput, dt: number) {
  if (s.status !== "playing") return;
  dt = Math.max(0, Math.min(0.05, dt));
  s.elapsed += dt; s.invuln = Math.max(0, s.invuln - dt); s.swing = Math.max(0, s.swing - dt);
  const remember = () => {s.progress++; s.message = miniChapter(s.hero, s.stage).memories[s.progress - 1]!;};
  if (s.hero === 1) {
    if (input.action && s.swing === 0) {
      s.swing = 0.28; s.swingX = input.aimX; s.swingY = input.aimY;
      if (distance({x: input.aimX, y: input.aimY}, REPAIR_PARTS[s.part]!) <= 25) {
        s.part++;
        if (s.part === REPAIR_PARTS.length) {s.part = 0; remember();}
      } else s.message = "Aim for the large GOLD ring — no penalty. Try again!";
    }
  } else {
    if (input.moveTo) s.destination = {x: Math.max(35, Math.min(925, input.aimX)), y: Math.max(105, Math.min(445, input.aimY))};
    let dx = input.x, dy = input.y;
    if (dx || dy) s.destination = null;
    else if (s.destination) {
      dx = s.destination.x - s.px; dy = s.destination.y - s.py;
      if (Math.hypot(dx, dy) < 5) {s.px = s.destination.x; s.py = s.destination.y; s.destination = null; dx = 0; dy = 0;}
    }
    const len = Math.hypot(dx, dy), speed = s.invuln > 0 ? 150 : 220;
    if (len > 0) {
      const step = Math.min(speed * dt, s.destination ? len : speed * dt);
      s.px = Math.max(35, Math.min(925, s.px + dx / len * step));
      s.py = Math.max(105, Math.min(445, s.py + dy / len * step));
    }
    const player = {x: s.px, y: s.py};
    if (s.hero === 0) {
      for (const spark of s.sparks) {
        if (spark.taken) continue;
        const d = distance(player, spark);
        if (d < 130) spark.found = true;
        if (spark.found && d < 40) spark.following = true;
        if (spark.following) {
          if (distance(player, HOME) < 60) {
            spark.taken = true; spark.following = false; remember();
          } else if (d > 25) {
            const step = Math.min(d - 25, 250 * dt);
            spark.x += (s.px - spark.x) / d * step; spark.y += (s.py - spark.y) / d * step;
          }
        }
      }
      for (let i = 0; i < 3; i++) if (s.invuln === 0 && distance(player, shadowPosition(i, s.elapsed)) < 35) {
        s.invuln = 1.5; s.message = "A shadow slows your steps — your rescued lights are safe. Keep heading HOME!";
      }
    } else {
      if (s.carrying === null) {
        const page = s.pages.findIndex((p) => !p.taken && distance(player, p) < 35);
        if (page !== -1) {s.pages[page]!.taken = true; s.carrying = page; s.message = "A lost page! Bring it to the open BOOK at the bottom.";}
      } else if (distance(player, HOME) < 55) {s.carrying = null; remember();}
    }
  }
  if (s.progress >= s.goal) {s.status = "won"; s.destination = null;}
}
export const miniBonus = (s: MiniState) => s.status === "won" ? 500 + s.goal * 100 : 0;

/** Coordinates inside an object-fit:contain canvas, excluding its letterbox padding. */
export function miniPoint(rect: {left: number; top: number; width: number; height: number}, clientX: number, clientY: number) {
  const scale = Math.min(rect.width / 960, rect.height / 480);
  return {x: Math.max(0, Math.min(960, (clientX - rect.left - (rect.width - 960 * scale) / 2) / scale)),
    y: Math.max(0, Math.min(480, (clientY - rect.top - (rect.height - 480 * scale) / 2) / scale))};
}
