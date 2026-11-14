// Cartoon canvas drawing: arenas, heroes, and monsters with chunky outlines.

import { CAMPAIGN_LOCATIONS } from "./locations";
import { drawFigure } from "./heroes";
import { spriteByName, tinted } from "./sprites";

export const W = 960;
export const H = 540;
export const TAU = Math.PI * 2;
const INK = "#0a0612";

export type EnemyKind =
  | "clown"
  | "bat"
  | "ghoul"
  | "slime"
  | "minislime"
  | "boogeyman"
  | "nergal"
  | "meteor";

export interface Decor {
  x: number;
  y: number;
  s: number;
  kind: number;
}

export function makeDecor(): Decor[] {
  const list: Decor[] = [];
  for (let i = 0; i < 26; i += 1) {
    list.push({
      x: 20 + Math.random() * (W - 40),
      y: 20 + Math.random() * (H - 40),
      s: 0.6 + Math.random() * 0.7,
      kind: Math.floor(Math.random() * 3),
    });
  }
  return list;
}

export const STAGE_NAMES = CAMPAIGN_LOCATIONS.map((location) => location.name);
const FLOORS = CAMPAIGN_LOCATIONS.map((location) => location.floor);

function blob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: string,
) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
}

function eye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  look: number,
  iris = INK,
) {
  blob(ctx, x, y, r, r, "#fff");
  ctx.fillStyle = iris;
  ctx.beginPath();
  ctx.arc(x + Math.cos(look) * r * 0.4, y + Math.sin(look) * r * 0.4, r * 0.5, 0, TAU);
  ctx.fill();
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  stage: number,
  decor: Decor[],
  time: number,
) {
  const [a, b] = FLOORS[stage] ?? FLOORS[0] ?? ["#222", "#111"];
  const grad = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, W * 0.7);
  grad.addColorStop(0, a);
  grad.addColorStop(1, b);
  ctx.fillStyle = grad;
  ctx.fillRect(-20, -20, W + 40, H + 40);
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 2;
  if (stage >= 1) {
    for (let x = 0; x < W; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }
  for (const d of decor) {
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.scale(d.s, d.s);
    if (stage === 0) {
      ctx.strokeStyle = "#3f7a4a";
      ctx.lineWidth = 3;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i * 5, 6);
        ctx.quadraticCurveTo(i * 8, -4, i * 12, -10);
        ctx.stroke();
      }
    } else if (stage === 1) {
      ctx.fillStyle = "#4a4766";
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-10, 12);
      ctx.lineTo(-10, -4);
      ctx.arc(0, -4, 10, Math.PI, 0);
      ctx.lineTo(10, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.strokeStyle = `rgba(255,${90 + 40 * Math.sin(time * 2 + d.x)},30,0.7)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(-4, 6);
      ctx.lineTo(4, -4);
      ctx.lineTo(14, 4);
      ctx.stroke();
    }
    ctx.restore();
  }
  // Arena rim.
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 4;
  ctx.setLineDash([14, 10]);
  ctx.strokeRect(24, 24, W - 48, H - 48);
  ctx.setLineDash([]);
}

export function drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.8, r * 0.95, r * 0.4, 0, 0, TAU);
  ctx.fill();
}

export function drawHero(
  ctx: CanvasRenderingContext2D,
  idx: number,
  x: number,
  y: number,
  aim: number,
  time: number,
  flash: boolean,
  spin: boolean,
  swing: number,
  key: object = {},
) {
  const mv = motionOf(key, x, y, time);
  const mvf = Math.min(1, mv.speed / 140);
  const bob = Math.sin(time * 3) * 1.5 - Math.abs(Math.sin(mv.phase * TAU * 2)) * 4 * mvf;
  ctx.save();
  ctx.translate(x, y + bob);
  if (flash) {
    ctx.globalAlpha = 0.5;
  }
  const look = aim;
  if (idx === 0) {
    // The lantern is both his weapon and the source of reveal/portal magic.
    ctx.save();
    ctx.rotate(aim + swing * 1.6 - 0.8);
    ctx.strokeStyle = "#9a7135"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(30, -12, 7, Math.PI, TAU); ctx.stroke();
    ctx.shadowColor = "#ffd36a"; ctx.shadowBlur = 24 + swing * 24;
    ctx.fillStyle = "#ffd36a"; ctx.fillRect(20, -12, 20, 28);
    ctx.strokeStyle = "#9a7135"; ctx.strokeRect(20, -12, 20, 28);
    ctx.beginPath(); ctx.moveTo(30, -12); ctx.lineTo(30, 16); ctx.stroke();
    ctx.restore();
  } else if (idx === 1) {
    // Pip's ham club.
    ctx.save();
    ctx.rotate(aim + swing * 1.8 - 0.9);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.fillStyle = "#f08aa0";
    ctx.beginPath();
    ctx.ellipse(34, 0, 17, 11, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(46, 0, 5, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else {
    // Wisp's spellbook floats beside her and glows when firing.
    ctx.save(); ctx.translate(Math.cos(aim) * 27, Math.sin(aim) * 20 - 12 + Math.sin(time * 4) * 4);
    ctx.rotate(Math.sin(time * 2) * 0.12);
    ctx.shadowColor = "#ff6fe0"; ctx.shadowBlur = 12 + swing * 18;
    ctx.fillStyle = "#e8d5ff"; ctx.strokeStyle = "#733db0"; ctx.lineWidth = 3;
    ctx.fillRect(-14, -9, 28, 18); ctx.strokeRect(-14, -9, 28, 18);
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(0, 9); ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.translate(0, 24);
  ctx.translate(Math.sin(mv.phase * TAU) * 2.5 * mvf, 0);
  ctx.rotate(mv.lean + Math.sin(mv.phase * TAU) * 0.06 * mvf);
  ctx.scale(1 + 0.05 * mvf * Math.abs(Math.sin(mv.phase * TAU * 2)), 1 - 0.04 * mvf * Math.abs(Math.sin(mv.phase * TAU * 2)));
  ctx.translate(0, -24);
  drawFigure(ctx, idx, 0, 6, 0.46, look, false, false, time, mv);
  ctx.restore();
  if (spin) {
    ctx.strokeStyle = "rgba(255,230,120,0.9)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 40, time * 14, time * 14 + 4);
    ctx.stroke();
  }
  ctx.restore();
}

export interface Motion {
  speed: number; // px/s, smoothed
  lean: number; // radians, tilt into travel direction
  phase: number; // walk-cycle phase in turns
  face: number; // -1 / 1, smoothed horizontal facing
}
const motions = new WeakMap<object, { x: number; y: number; t: number; vx: number; vy: number; phase: number; face: number }>();

/** Smoothed velocity-derived motion for a character, keyed by its object. */
export function motionOf(key: object, x: number, y: number, time: number): Motion {
  let m = motions.get(key);
  if (m === undefined) {
    m = { x, y, t: time, vx: 0, vy: 0, phase: 0, face: 1 };
    motions.set(key, m);
  }
  const dt = time - m.t;
  if (dt > 0.0001 && dt < 0.25) {
    const k = 1 - Math.exp(-dt * 12);
    m.vx += ((x - m.x) / dt - m.vx) * k;
    m.vy += ((y - m.y) / dt - m.vy) * k;
  } else if (dt >= 0.25) {
    m.vx = 0;
    m.vy = 0;
  }
  m.x = x;
  m.y = y;
  m.t = time;
  const speed = Math.hypot(m.vx, m.vy);
  m.phase = (m.phase + Math.max(dt, 0) * Math.min(speed, 400) / 118) % 1;
  if (Math.abs(m.vx) > 15) m.face += (Math.sign(m.vx) - m.face) * Math.min(1, Math.max(dt, 0) * 14);
  return { speed, lean: Math.max(-0.28, Math.min(0.28, m.vx * 0.0011)), phase: m.phase, face: m.face };
}

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  kind: EnemyKind,
  x: number,
  y: number,
  r: number,
  time: number,
  look: number,
  flash: boolean,
  frozen: boolean,
  windup: number,
  key: object = {},
) {
  const sp = spriteByName(kind === "minislime" ? "slime" : kind);
  if (sp !== null) {
    const n = sp.frames.length;
    const fi = Math.floor((((time / sp.dur + x * 0.01) % 1) + 1) % 1 * n);
    const frame = sp.frames[fi] ?? sp.frames[0];
    if (frame !== undefined) {
      const big = kind === "boogeyman" || kind === "nergal" || kind === "meteor";
      const hh = r * (big ? 3.2 : 4.2);
      const ww = hh * sp.aspect;
      const mv = motionOf(key, x, y, time);
      const mvf = Math.min(1, mv.speed / 120);
      const isBat = kind === "bat";
      const isSlime = kind === "slime" || kind === "minislime";
      const step = Math.sin(mv.phase * TAU * 2);
      const flap = isBat ? 1 + Math.sin(time * 18) * 0.12 : 1;
      const sq = isSlime ? 1 + Math.sin(time * 6 + x) * 0.06 + step * 0.12 * mvf : 1 + Math.abs(step) * 0.06 * mvf;
      const hop = isBat ? 0 : isSlime ? Math.abs(step) * r * 0.5 * mvf : Math.abs(step) * r * 0.22 * mvf;
      ctx.save();
      ctx.translate(x, y + r * 0.9 + (isBat ? -r * 0.9 : 0));
      ctx.rotate(mv.lean * 1.2 + (isBat ? 0 : step * 0.05 * mvf));
      if (Math.cos(look) < 0) ctx.scale(-1, 1);
      ctx.scale(flap / sq, sq);
      const bob = (isBat ? Math.sin(time * 6) * 4 : 0) - hop;
      ctx.drawImage(frame, -ww / 2, -hh + bob, ww, hh);
      if (frozen) ctx.drawImage(tinted(frame, "rgba(120,210,255,0.55)"), -ww / 2, -hh + bob, ww, hh);
      if (windup > 0) ctx.drawImage(tinted(frame, "rgba(255,40,40,0.4)"), -ww / 2, -hh + bob, ww, hh);
      if (flash) ctx.drawImage(tinted(frame, "rgba(255,255,255,0.85)"), -ww / 2, -hh + bob, ww, hh);
      ctx.restore();
      return;
    }
  }
  ctx.save();
  ctx.translate(x, y);
  const wob = Math.sin(time * 8 + x * 0.05) * 0.08;
  const tint = (c: string) => (flash ? "#ffffff" : frozen ? "#9fe3ff" : c);
  switch (kind) {
    case "clown": {
      ctx.rotate(wob);
      blob(ctx, 0, 8, r * 0.8, r * 0.9, tint("#e0457b"));
      blob(ctx, 0, -6, r * 0.85, r * 0.85, tint("#f4eee6"));
      ctx.fillStyle = tint("#5b2a9e");
      ctx.strokeStyle = INK;
      ctx.beginPath();
      ctx.moveTo(-10, -14);
      ctx.lineTo(0, -34);
      ctx.lineTo(10, -14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      eye(ctx, -6, -8, 4.5, look, "#c01818");
      eye(ctx, 6, -8, 4.5, look, "#c01818");
      blob(ctx, 0, -2, 4, 4, "#e32a2a");
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 2, 8, 0.2, Math.PI - 0.2);
      ctx.stroke();
      break;
    }
    case "bat": {
      const flap = Math.sin(time * 18) * 0.6;
      ctx.fillStyle = tint("#3a2552");
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * 8, 0);
        ctx.lineTo(s * 34, -14 + flap * 16);
        ctx.lineTo(s * 26, 6);
        ctx.lineTo(s * 14, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      blob(ctx, 0, 0, r, r, tint("#fff"));
      ctx.strokeStyle = "rgba(200,0,0,0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-r, 2);
      ctx.lineTo(-r * 0.5, -3);
      ctx.moveTo(r, -4);
      ctx.lineTo(r * 0.5, 2);
      ctx.stroke();
      ctx.fillStyle = windup > 0 ? "#ff2020" : "#7a2fd0";
      ctx.beginPath();
      ctx.arc(Math.cos(look) * 4, Math.sin(look) * 4, r * 0.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(Math.cos(look) * 5, Math.sin(look) * 5, r * 0.22, 0, TAU);
      ctx.fill();
      break;
    }
    case "ghoul": {
      blob(ctx, 0, 8, r * 0.85, r, tint("#cfc9b4"));
      for (let i = -2; i <= 2; i += 1) {
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-r * 0.6, 8 + i * 6);
        ctx.lineTo(r * 0.6, 8 + i * 6);
        ctx.stroke();
      }
      blob(ctx, 0, -10, r * 0.7, r * 0.7, tint("#ece7d6"));
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(-7, -12, 5, 0, TAU);
      ctx.arc(7, -12, 5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#ff6a2a";
      ctx.beginPath();
      ctx.arc(-7, -12, 1.8, 0, TAU);
      ctx.arc(7, -12, 1.8, 0, TAU);
      ctx.fill();
      ctx.save();
      ctx.translate(r * 0.8, 0);
      ctx.rotate(windup > 0 ? -1.9 : 0.5);
      ctx.fillStyle = "#9aa4b5";
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.fillRect(0, -4, 34, 14);
      ctx.strokeRect(0, -4, 34, 14);
      ctx.restore();
      break;
    }
    case "slime":
    case "minislime": {
      const sq = 1 + Math.sin(time * 6 + x) * 0.1;
      ctx.scale(sq, 2 - sq);
      blob(ctx, 0, 4, r, r * 0.85, tint("#6fd13a"));
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.arc(-r * 0.4, -r * 0.25, r * 0.18, 0, TAU);
      ctx.fill();
      eye(ctx, -r * 0.3, 0, r * 0.25, look);
      eye(ctx, r * 0.3, 0, r * 0.25, look);
      break;
    }
    case "boogeyman": {
      blob(ctx, 0, 6, r, r * 1.05, tint("#2b3a78"));
      eye(ctx, -14, -6, 9, look, "#d02020");
      eye(ctx, 14, -6, 9, look, "#d02020");
      ctx.fillStyle = tint("#171717");
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-r * 0.9, -r * 0.55);
      ctx.quadraticCurveTo(0, -r * 1.5, r * 0.9, -r * 0.55);
      ctx.lineTo(0, -r * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.fillRect(-4, -r * 0.98, 8, 8);
      ctx.save();
      ctx.rotate(look);
      ctx.fillStyle = "#4b4f5a";
      ctx.fillRect(r * 0.5, -9, 40, 18);
      ctx.strokeRect(r * 0.5, -9, 40, 18);
      ctx.fillStyle = "#7ee03a";
      ctx.fillRect(r * 0.5 + 38, -6, 8, 12);
      ctx.restore();
      ctx.strokeStyle = INK;
      ctx.beginPath();
      ctx.arc(0, 18, 14, 0.1, Math.PI - 0.1);
      ctx.stroke();
      break;
    }
    case "nergal": {
      ctx.strokeStyle = tint("#3a1560");
      ctx.lineWidth = 9;
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * TAU + time;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
        ctx.quadraticCurveTo(
          Math.cos(a + 0.5) * r * 1.2,
          Math.sin(a + 0.5) * r * 1.2,
          Math.cos(a + 1) * r * 1.5,
          Math.sin(a + 1) * r * 1.5,
        );
        ctx.stroke();
      }
      blob(ctx, 0, 0, r, r * 1.05, tint("#2a0f48"));
      ctx.fillStyle = "#ffd23a";
      ctx.beginPath();
      ctx.ellipse(-14, -6, 8, 4, 0.3, 0, TAU);
      ctx.ellipse(14, -6, 8, 4, -0.3, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "#ffd23a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 10, 18, 0.2, Math.PI - 0.2);
      ctx.stroke();
      break;
    }
    case "meteor": {
      ctx.fillStyle = "rgba(255,120,30,0.5)";
      ctx.beginPath();
      ctx.arc(0, -8, r * 1.2 + Math.sin(time * 10) * 3, 0, TAU);
      ctx.fill();
      blob(ctx, 0, 0, r, r * 0.9, tint("#e87a9a"));
      ctx.strokeStyle = "#a43a5e";
      ctx.lineWidth = 3;
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.arc(i * 16, -4, 12, 0.2, Math.PI + 0.4);
        ctx.stroke();
      }
      eye(ctx, -16, 4, 10, look, "#6a1a8a");
      eye(ctx, 16, 4, 10, look, "#6a1a8a");
      ctx.strokeStyle = INK;
      ctx.beginPath();
      ctx.arc(0, 22, 14, 0.2, Math.PI - 0.2);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}
