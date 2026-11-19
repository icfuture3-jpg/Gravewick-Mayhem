import { drawHero } from "./art";
import { drawFigure } from "./heroes";
import { drawMeatMallet, drawMonsterToy, drawWhimsicalLibrary } from "./tale-props";
import { HOME, REPAIR_PARTS, miniObjective, shadowPosition, type MiniState } from "./mini-game";

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, color = "#fff2ca", size = 18) {
  ctx.fillStyle = color; ctx.font = `bold ${size}px Trebuchet MS`; ctx.textAlign = "center"; ctx.fillText(value, x, y);
}
function ring(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
}
function page(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save(); ctx.shadowColor = "#f3b8ff"; ctx.shadowBlur = 15;
  ctx.fillStyle = "#fff1cc"; ctx.strokeStyle = "#be76e6"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(x - 15, y - 20, 30, 40, 4); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0; ctx.strokeStyle = "#9550b0";
  for (let i = 0; i < 3; i++) {ctx.beginPath(); ctx.moveTo(x - 8, y - 9 + i * 9); ctx.lineTo(x + 8, y - 9 + i * 9); ctx.stroke();}
  ctx.restore();
}
export function drawMini(ctx: CanvasRenderingContext2D, s: MiniState, aimX: number, aimY: number) {
  ctx.clearRect(0, 0, 960, 480);
  if (s.hero === 2) {
    ctx.save(); ctx.scale(1, 480 / 360); drawWhimsicalLibrary(ctx, s.elapsed); ctx.restore();
    // Clear walkable reading floor beneath the decorative shelves.
    ctx.fillStyle = "rgba(31,19,48,0.78)"; ctx.beginPath(); ctx.roundRect(85, 105, 790, 350, 28); ctx.fill();
    for (const p of s.pages) if (!p.taken) {page(ctx, p.x, p.y + Math.sin(s.elapsed * 2) * 3); text(ctx, "PAGE", p.x, p.y + 40, "#f3c9ff", 15);}
  } else if (s.hero === 0) {
    ctx.fillStyle = "#102c30"; ctx.fillRect(0, 0, 960, 480);
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = "#253f46"; ctx.beginPath(); ctx.roundRect(30 + i * 106, 90, 40, 70, [20,20,0,0]); ctx.fill();
      text(ctx, "✦", 50 + i * 106, 120, "#637e78", 18);
    }
    ctx.fillStyle = "#1b3b39"; ctx.beginPath(); ctx.ellipse(480, 310, 440, 170, 0, 0, Math.PI * 2); ctx.fill();
    ring(ctx, s.px, s.py, 130, "#63885d");
    for (let i = 0; i < 3; i++) {
      const p = shadowPosition(i, s.elapsed);
      ctx.fillStyle = "#754269"; ctx.beginPath(); ctx.ellipse(p.x, p.y, 27, 22, Math.sin(s.elapsed + i) * 0.15, 0, Math.PI * 2); ctx.fill();
      for (const side of [-1, 1]) {ctx.fillStyle = "#e9a7df"; ctx.beginPath(); ctx.arc(p.x + side * 8, p.y - 4, 3, 0, Math.PI * 2); ctx.fill();}
    }
    for (const spark of s.sparks) if (!spark.taken) {
      if (spark.following) {
        ctx.setLineDash([5, 7]); ctx.strokeStyle = "#e5cc72"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(spark.x, spark.y); ctx.lineTo(s.px, s.py); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.save(); ctx.shadowColor = "#ffdf76"; ctx.shadowBlur = spark.found ? 20 : 0;
      text(ctx, spark.found ? "✦" : "?", spark.x, spark.y + 10, spark.found ? "#ffe68e" : "#9eb6a3", spark.found ? 34 : 24); ctx.restore();
    }
  } else {
    ctx.fillStyle = "#302035"; ctx.fillRect(0, 0, 960, 480);
    text(ctx, ["MARKET TOY REPAIR", "PROTOTYPE WORKSHOP", "NIGHTMARE MACHINE REPAIR"][s.stage]!, 480, 96, "#e7bb84", 20);
    for (let i = 0; i < 6; i++) {
      const x = 155 + i * 130;
      drawMonsterToy(ctx, i, x, 170, i < s.progress, s.elapsed);
      text(ctx, i < s.progress ? "FIXED ✓" : `Toy ${i + 1}`, x, 195, i < s.progress ? "#b7e68a" : "#c5b0ca", 14);
    }
    ctx.fillStyle = "#805c3f"; ctx.beginPath(); ctx.roundRect(280, 310, 420, 25, 8); ctx.fill();
    ctx.fillStyle = "#503824"; ctx.fillRect(305, 335, 20, 105); ctx.fillRect(655, 335, 20, 105);
    ctx.save(); ctx.translate(480, 280); ctx.scale(1.7, 1.7);
    drawMonsterToy(ctx, Math.min(5, s.progress), 0, 0, s.status === "won", s.elapsed); ctx.restore();
    if (s.status === "playing") for (let i = 0; i < REPAIR_PARTS.length; i++) {
      const p = REPAIR_PARTS[i]!;
      ring(ctx, p.x, p.y, i === s.part ? 24 : 16, i === s.part ? "#ffdc6a" : i < s.part ? "#a8dc8a" : "#7c687e");
      text(ctx, i < s.part ? "✓" : String(i + 1), p.x, p.y + 6, i === s.part ? "#fff5c7" : "#d1c4d7", 19);
    }
    const hit = s.swing > 0, part = hit ? {x: s.swingX, y: s.swingY} : REPAIR_PARTS[s.part]!;
    const hx = part.x - 49, hy = part.y - 8;
    drawFigure(ctx, 1, hx - 35, hy + 22, 0.65, 0, false, false, s.elapsed);
    drawMeatMallet(ctx, hx, hy, hit ? Math.sin((1 - s.swing / 0.28) * Math.PI) : 0);
    if (hit) ring(ctx, part.x, part.y, 28 + (0.28 - s.swing) * 20, "#fff1a1");
    ring(ctx, aimX, aimY, 7, "#ffffff");
  }
  if (s.hero !== 1) {
    const homeColor = s.hero === 0 ? "#ffdf8a" : "#e5a7ff";
    ring(ctx, HOME.x, HOME.y, 52, homeColor);
    if (s.hero === 0) {
      ctx.fillStyle = "#a17b3b"; ctx.fillRect(HOME.x - 14, HOME.y - 24, 28, 41);
      ctx.fillStyle = "#ffe68c"; ctx.fillRect(HOME.x - 9, HOME.y - 19, 18, 29);
    } else {
      ctx.fillStyle = "#fff0ce"; ctx.strokeStyle = "#b072da"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(HOME.x - 35, HOME.y - 21, 70, 42, 5); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(HOME.x, HOME.y - 21); ctx.lineTo(HOME.x, HOME.y + 21); ctx.stroke();
      for (let i = 0; i < s.progress; i++) text(ctx, "✦", HOME.x - 18 + i * 18, HOME.y + 8, "#a053be", 17);
    }
    text(ctx, s.hero === 0 ? "HOME" : "BOOK", HOME.x, HOME.y + 43, homeColor, 16);
    const look = s.destination ? Math.atan2(s.destination.y - s.py, s.destination.x - s.px) : 0;
    drawHero(ctx, s.hero, s.px, s.py, look, s.elapsed, s.invuln > 0, false, 0, s);
    if (s.carrying !== null) page(ctx, s.px + 30, s.py - 35);
    if (s.destination) ring(ctx, s.destination.x, s.destination.y, 12, "#e9d6fa");
    if (s.carrying !== null || s.sparks.some((spark) => spark.following)) {
      ctx.save(); ctx.setLineDash([8, 8]); ctx.strokeStyle = homeColor; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(s.px, s.py); ctx.lineTo(HOME.x, HOME.y); ctx.stroke(); ctx.restore();
    }
  }
  ctx.fillStyle = "rgba(14,8,24,0.92)"; ctx.fillRect(0, 0, 960, 60);
  text(ctx, miniObjective(s), 480, 36, "#ffdf8a", 20);
}
