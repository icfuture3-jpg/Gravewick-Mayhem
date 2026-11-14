import { drawFigure } from "./heroes";
import { drawEnemy, TAU } from "./art";
import type { Scene } from "./movie";

// Cutscene-only animation. No gameplay positions, health, cooldowns or damage change here.
export function drawAction(ctx: CanvasRenderingContext2D, scene: Scene, time: number) {
  const p = Math.min(1, Math.max(0, time / scene.duration));
  const impact = Math.max(0, 1 - Math.abs(p - 0.62) * 7);
  const hero = (idx: number, x: number, y: number, scale = 1, alpha = 1) => {
    ctx.save(); ctx.globalAlpha *= alpha;
    drawFigure(ctx, idx, x, y, scale, 0, idx !== 1, false, time,
      {speed: p < 0.6 ? 200 : 0, phase: time * 1.8});
    ctx.restore();
  };
  const line = (x: number, y: number, tx: number, ty: number, color: string, width = 5) => {
    ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
  };
  const portal = (x: number, y: number, radius: number) => {
    ctx.strokeStyle = "#ffd36a"; ctx.lineWidth = 7;
    ctx.shadowColor = "#ffd36a"; ctx.shadowBlur = 24;
    ctx.beginPath(); ctx.ellipse(x, y, radius * 0.55, radius, 0, 0, TAU); ctx.stroke();
    ctx.shadowBlur = 0;
  };
  // Motion lines, shockwaves and enemy silhouettes make these action shots, not dialogue poses.
  ctx.save();
  for (let i = 0; i < 14; i++) {
    const x = ((i * 137 - time * 230) % 1100 + 1100) % 1100 - 70;
    line(x, 90 + i * 21, x + 80, 90 + i * 21, "rgba(200,180,255,0.18)", 2);
  }
  if (scene.action !== "victory") {
    const retreat = p > 0.6 ? (p - 0.6) * 520 : 0;
    drawEnemy(ctx, "clown", 750 + retreat, 265, 30, time, Math.PI, impact > 0, false, 0);
    drawEnemy(ctx, "ghoul", 855 + retreat, 300, 38, time, Math.PI, impact > 0, false, 0);
  }
  if (scene.action === "portal") {
    portal(270, 230, 80 * Math.min(1, p * 5));
    portal(620, 230, 80 * Math.min(1, p * 5));
    hero(0, 220 + p * 350, 270, 1.5);
    hero(1, 80 + p * 360, 300 - Math.sin(p * Math.PI) * 80, 1.1);
    hero(2, 150 + p * 320, 220 - Math.sin(p * Math.PI) * 50, 1.2);
    // Lantern beam reveals the ambushers.
    line(260 + p * 350, 230, 850, 265, `rgba(255,211,106,${0.3 + impact * 0.6})`, 14);
  } else if (scene.action === "gadget") {
    const tiny = 1.4 - Math.sin(p * Math.PI) * 0.9;
    hero(0, 170, 275, 1.1); hero(2, 300, 245, 1.1);
    hero(1, 330 + p * 300, 305 - Math.sin(p * Math.PI) * 45, tiny);
    const flight = Math.min(1, p / 0.62);
    ctx.fillStyle = "#c4d443";
    ctx.beginPath(); ctx.arc(400 + flight * 360, 260 - Math.sin(flight * Math.PI) * 140, 15, 0, TAU); ctx.fill();
    line(390 + flight * 360, 240 - Math.sin(flight * Math.PI) * 140, 400 + flight * 360, 250 - Math.sin(flight * Math.PI) * 140, "#ff703a");
  } else if (scene.action === "illusion") {
    hero(0, 160, 285, 1.1); hero(1, 270, 305, 1.1);
    hero(2, 440, 260, 1.45, p < 0.3 ? 1 - p * 2.6 : 0.2);
    for (const side of [-1, 1]) {
      const x = 430 + side * 110;
      hero(2, x, 260 + side * 35, 1.25, 0.6);
      const bolt = (p * 3) % 1;
      line(x + bolt * (800 - x), 240, x + bolt * (800 - x) + 45, 240, "#ff8fe8", 8);
    }
  } else if (scene.action === "team") {
    portal(170, 240, 68);
    hero(0, 230 + p * 120, 250, 1.5);
    hero(1, 400 + p * 140, 300 - Math.sin(p * Math.PI) * 75, 0.6);
    hero(2, 540, 245, 1.3);
    hero(2, 620, 220, 1.1, 0.4);
    for (let i = 0; i < 3; i++) {
      line(300 + i * 130, 220 + i * 25, 790, 270, ["#ffd36a", "#c4d443", "#ff8fe8"][i]!, 5 + impact * 12);
    }
  } else {
    for (let i = 0; i < 3; i++) hero(i, 300 + i * 180, 280 - Math.abs(Math.sin(time * 5 + i)) * 38, 1.6);
    portal(830, 210, 80 * (1 - p));
    for (let i = 0; i < 36; i++) {
      ctx.fillStyle = ["#ffd36a", "#c4d443", "#ff8fe8"][i % 3]!;
      ctx.fillRect((i * 79) % 960, (time * (60 + i % 5 * 15) + i * 37) % 340 + 55, 5, 9);
    }
  }
  if (scene.action !== "victory" && impact > 0) {
    ctx.globalAlpha *= impact; ctx.strokeStyle = "#fff2b0"; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.arc(770, 250, 30 + (p - 0.48) * 260, 0, TAU); ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12 + time;
      line(770 + Math.cos(a) * 50, 250 + Math.sin(a) * 50, 770 + Math.cos(a) * 135, 250 + Math.sin(a) * 135, "#ffd36a", 4);
    }
  }
  ctx.restore();
}
