// Hero artwork: soft, toy-like figures drawn in code.
// 0 Grimble (purple-hooded skull), 1 Pip (green beanie-and-hoodie imp), 2 Wisp (blue-hooded witch girl).
import { sprites } from "./sprites";

const TAU = Math.PI * 2;

function shade(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  light: string,
  dark: string,
  line = "rgba(20,8,40,0.55)",
) {
  const g = ctx.createRadialGradient(x - rx * 0.35, y - ry * 0.4, 1, x, y, Math.max(rx, ry) * 1.15);
  g.addColorStop(0, light);
  g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fill();
  if (line !== "") {
    ctx.strokeStyle = line;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function fillPath(ctx: CanvasRenderingContext2D, fill: string | CanvasGradient, line = "rgba(20,8,40,0.55)") {
  ctx.fillStyle = fill;
  ctx.fill();
  if (line !== "") {
    ctx.strokeStyle = line;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function vGrad(ctx: CanvasRenderingContext2D, y0: number, y1: number, a: string, b: string) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  return g;
}

export function drawGrimble(ctx: CanvasRenderingContext2D, look: number, prop: boolean) {
  // Cloak with scalloped hem.
  ctx.beginPath();
  ctx.moveTo(-30, 2);
  ctx.bezierCurveTo(-40, 14, -40, 26, -46, 40);
  const n = 7;
  for (let i = 0; i < n; i++) {
    const x0 = -46 + (92 / n) * i;
    const x1 = -46 + (92 / n) * (i + 1);
    ctx.quadraticCurveTo((x0 + x1) / 2, 50, x1, 40);
  }
  ctx.bezierCurveTo(40, 26, 40, 14, 30, 2);
  ctx.closePath();
  fillPath(ctx, vGrad(ctx, 0, 48, "#9a78e0", "#6d4cb8"));
  // Cloak trim.
  ctx.strokeStyle = "#c2aaf2";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-14, 4);
  ctx.quadraticCurveTo(0, 26, 34, 24);
  ctx.stroke();
  // Hands.
  shade(ctx, -37, 22, 8, 8, "#c6f6fb", "#6fc9d8");
  shade(ctx, 38, 22, 8, 8, "#c6f6fb", "#6fc9d8");
  // Hood.
  ctx.beginPath();
  ctx.moveTo(6, -80);
  ctx.bezierCurveTo(42, -72, 52, -30, 42, -2);
  ctx.quadraticCurveTo(0, 14, -42, -2);
  ctx.bezierCurveTo(-52, -34, -42, -72, 6, -80);
  ctx.closePath();
  fillPath(ctx, vGrad(ctx, -80, 10, "#a283e8", "#6a49b4"));
  // Hood lining.
  ctx.beginPath();
  ctx.moveTo(4, -70);
  ctx.bezierCurveTo(34, -64, 40, -30, 33, -8);
  ctx.quadraticCurveTo(0, 6, -33, -8);
  ctx.bezierCurveTo(-40, -34, -30, -64, 4, -70);
  ctx.closePath();
  fillPath(ctx, "#c9b3f5");
  // Skull face.
  ctx.beginPath();
  ctx.moveTo(2, -62);
  ctx.bezierCurveTo(26, -58, 30, -30, 24, -12);
  ctx.quadraticCurveTo(0, 2, -24, -12);
  ctx.bezierCurveTo(-30, -32, -22, -58, 2, -62);
  ctx.closePath();
  fillPath(ctx, vGrad(ctx, -62, 0, "#b4f3fa", "#7fd6e4"), "rgba(20,60,80,0.4)");
  // Eyes.
  const lx = Math.cos(look) * 1.5;
  for (const ex of [-13, 13]) {
    shade(ctx, ex, -28, 9.5, 10.5, "#2a2a30", "#050508", "");
    ctx.fillStyle = "#f6e6a8";
    ctx.beginPath();
    ctx.arc(ex + 3 + lx, -31, 2.6, 0, TAU);
    ctx.fill();
  }
  // Nose and stitched teeth.
  ctx.fillStyle = "#3c8294";
  ctx.beginPath();
  ctx.moveTo(-3, -11);
  ctx.lineTo(0, -16);
  ctx.lineTo(3, -11);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#16161c";
  ctx.fillRect(-12, -8, 24, 7);
  ctx.strokeStyle = "#8ee0ec";
  ctx.lineWidth = 1.6;
  for (let i = -10; i <= 10; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, -9);
    ctx.lineTo(i, 0);
    ctx.stroke();
  }
  // Brooch.
  ctx.fillStyle = "#9a9aa8";
  ctx.beginPath();
  ctx.arc(18, 10, 6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#e0488c";
  ctx.beginPath();
  ctx.arc(18, 10, 3.6, 0, TAU);
  ctx.fill();
  if (prop) {
    ctx.strokeStyle = "#8b8d9a";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-54, 46);
    ctx.lineTo(-10, 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-4, -2);
    ctx.quadraticCurveTo(-2, 20, -20, 44);
    ctx.quadraticCurveTo(-18, 20, -14, 6);
    ctx.closePath();
    fillPath(ctx, "#f1deaa");
    shade(ctx, -37, 22, 8, 8, "#c6f6fb", "#6fc9d8");
  }
}

export function drawPip(ctx: CanvasRenderingContext2D, look: number) {
  // Glossy one-colour clay figure: yellow-green with bright highlights.
  const light = "#e2f05c";
  const base = "#a9ba2a";
  const dark = "#5f6e10";
  const line = "rgba(45,55,0,0.6)";
  const hi = "rgba(255,255,220,0.55)";
  // Legs and boots.
  ctx.fillStyle = dark;
  ctx.fillRect(-16, 52, 6, 8);
  ctx.fillRect(10, 52, 6, 8);
  for (const bx of [-14, 15]) {
    shade(ctx, bx, 65, 12, 7, light, base, line);
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(bx - 3, 64);
    ctx.lineTo(bx - 3, 71);
    ctx.moveTo(bx + 3, 64);
    ctx.lineTo(bx + 3, 71);
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(bx - 9, 55, 18, 5, 2);
    fillPath(ctx, light, line);
  }
  // Shorts with turned-up cuffs.
  ctx.beginPath();
  ctx.moveTo(-24, 38);
  ctx.lineTo(24, 38);
  ctx.lineTo(27, 56);
  ctx.lineTo(-27, 56);
  ctx.closePath();
  fillPath(ctx, vGrad(ctx, 38, 56, base, dark), line);
  ctx.fillStyle = light;
  ctx.fillRect(-27, 52, 18, 4);
  ctx.fillRect(9, 52, 18, 4);
  // Hoodie body and hood collar.
  shade(ctx, 0, 6, 30, 9, base, dark, line);
  ctx.beginPath();
  ctx.roundRect(-27, 8, 54, 36, 13);
  fillPath(ctx, vGrad(ctx, 8, 44, light, base), line);
  // Sleeves going down into the pocket, ribbed cuffs.
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 24, 10);
    ctx.quadraticCurveTo(s * 42, 20, s * 36, 40);
    ctx.lineTo(s * 24, 40);
    ctx.quadraticCurveTo(s * 28, 24, s * 20, 16);
    ctx.closePath();
    fillPath(ctx, vGrad(ctx, 10, 40, light, base), line);
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.6;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(s * 25, 33 + k * 3);
      ctx.lineTo(s * 36, 33 + k * 3);
      ctx.stroke();
    }
  }
  // Kangaroo pocket.
  ctx.beginPath();
  ctx.moveTo(-16, 28);
  ctx.lineTo(16, 28);
  ctx.lineTo(22, 44);
  ctx.quadraticCurveTo(0, 50, -22, 44);
  ctx.closePath();
  fillPath(ctx, vGrad(ctx, 28, 48, base, dark), line);
  // Heart patch and drawstrings.
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(13, 24);
  ctx.bezierCurveTo(7, 18, 16, 14, 13, 20);
  ctx.bezierCurveTo(10, 14, 19, 18, 13, 24);
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-5, 12);
  ctx.quadraticCurveTo(-8, 20, -5, 27);
  ctx.moveTo(4, 12);
  ctx.quadraticCurveTo(7, 20, 4, 27);
  ctx.stroke();
  // Big round head.
  shade(ctx, 0, -16, 38, 36, light, base, line);
  // Face plate.
  shade(ctx, 0, -6, 31, 25, "#9aab22", "#6f7e14", line);
  // Beanie with a slanted bobble and thick ribbed rim.
  ctx.beginPath();
  ctx.moveTo(-38, -18);
  ctx.bezierCurveTo(-46, -54, -30, -70, -26, -86);
  ctx.bezierCurveTo(-22, -96, -8, -92, -4, -82);
  ctx.bezierCurveTo(30, -74, 46, -48, 38, -18);
  ctx.quadraticCurveTo(0, -36, -38, -18);
  ctx.closePath();
  fillPath(ctx, vGrad(ctx, -92, -18, light, base), line);
  ctx.beginPath();
  ctx.moveTo(-38, -20);
  ctx.quadraticCurveTo(0, -38, 38, -20);
  ctx.lineTo(37, -28);
  ctx.quadraticCurveTo(0, -46, -37, -28);
  ctx.closePath();
  fillPath(ctx, base, line);
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1.8;
  for (let x = -34; x <= 34; x += 4) {
    const ym = -29 + 18 * (1 - (x / 38) ** 2) * -0.0;
    const top = -41 + (x / 38) ** 2 * 13;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + 8);
    ctx.stroke();
    void ym;
  }
  ctx.strokeStyle = hi;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-24, -74);
  ctx.quadraticCurveTo(-30, -52, -32, -40);
  ctx.stroke();
  // Hollow angry eyes with heavy brow ridges.
  const lx = Math.cos(look) * 1.5;
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(s * 15, -8);
    ctx.rotate(s * -0.26);
    ctx.fillStyle = "#3f4a08";
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 9.5, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = light;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#87981e";
    ctx.beginPath();
    ctx.ellipse(lx, 2, 8, 5.5, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = light;
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-13, -8);
    ctx.lineTo(13, -8);
    ctx.stroke();
    ctx.restore();
  }
  // Nose hole.
  ctx.fillStyle = "#3f4a08";
  ctx.beginPath();
  ctx.arc(0, 6, 2.2, 0, TAU);
  ctx.fill();
  // Zipper grin along the lower edge of the face.
  ctx.strokeStyle = "#3f4a08";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-30, 10);
  ctx.quadraticCurveTo(0, 26, 30, 10);
  ctx.stroke();
  ctx.lineWidth = 1.8;
  for (let i = -26; i <= 26; i += 5) {
    const y = 10 + 8 * (1 - (i / 30) ** 2);
    ctx.beginPath();
    ctx.moveTo(i, y);
    ctx.lineTo(i, y + 5);
    ctx.stroke();
  }
}

export function drawWisp(ctx: CanvasRenderingContext2D, look: number, prop: boolean, blink = false) {
  const ink = "#1a1038";
  // Cape.
  ctx.beginPath();
  ctx.moveTo(-34, 6);
  ctx.quadraticCurveTo(-52, 26, -50, 44);
  ctx.lineTo(50, 44);
  ctx.quadraticCurveTo(52, 26, 34, 6);
  ctx.closePath();
  fillPath(ctx, "#2f2fb0", ink);
  // Dress.
  ctx.beginPath();
  ctx.moveTo(-22, 10);
  ctx.lineTo(22, 10);
  ctx.lineTo(30, 46);
  ctx.lineTo(-30, 46);
  ctx.closePath();
  fillPath(ctx, vGrad(ctx, 10, 46, "#e56fb4", "#b3408c"), ink);
  ctx.fillStyle = "#f3ead8";
  for (const by of [26, 38]) {
    ctx.beginPath();
    ctx.arc(0, by, 3.4, 0, TAU);
    ctx.fill();
  }
  // Hands.
  shade(ctx, -30, 24, 7, 8, "#e6c6f2", "#b88ad0", ink);
  shade(ctx, 31, 22, 7, 8, "#e6c6f2", "#b88ad0", ink);
  // Hood back.
  ctx.beginPath();
  ctx.moveTo(0, -78);
  ctx.bezierCurveTo(30, -76, 52, -50, 46, -14);
  ctx.quadraticCurveTo(0, 16, -46, -14);
  ctx.bezierCurveTo(-52, -50, -30, -76, 0, -78);
  ctx.closePath();
  fillPath(ctx, vGrad(ctx, -80, 10, "#4a4ae0", "#2a2aa0"), ink);
  // Face.
  shade(ctx, 0, -18, 33, 30, "#e8c4f2", "#c08ad8", ink);
  // Hood peak over brow.
  ctx.beginPath();
  ctx.moveTo(-34, -34);
  ctx.quadraticCurveTo(-14, -52, 0, -42);
  ctx.quadraticCurveTo(14, -52, 34, -34);
  ctx.lineTo(36, -52);
  ctx.quadraticCurveTo(0, -78, -36, -52);
  ctx.closePath();
  fillPath(ctx, "#3a3ad0", ink);
  // Eyes.
  const lx = Math.cos(look) * 1.5;
  for (const s of [-1, 1]) {
    const ex = s * 15;
    if (blink) {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ex, -22, 9, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else {
      shade(ctx, ex, -20, 11, 12, "#ff9af0", "#e03cc8", ink);
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(ex - 3 + lx, -24, 3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#e8c4f2";
      ctx.beginPath();
      ctx.ellipse(ex, -28, 12, 5, 0, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ex, -23, 11, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(ex + s * 11, -24);
    ctx.lineTo(ex + s * 17, -28);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,110,170,0.45)";
    ctx.beginPath();
    ctx.ellipse(s * 22, -4, 6, 4, 0, 0, TAU);
    ctx.fill();
  }
  // Smirk.
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6, -3);
  ctx.quadraticCurveTo(0, 2, 7, -4);
  ctx.stroke();
  // Bow and skull brooch.
  ctx.fillStyle = "#3a3ad0";
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(s * 20, 3);
    ctx.lineTo(s * 20, 21);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  shade(ctx, 0, 12, 7, 7, "#ffc84a", "#e08a1c", ink);
  ctx.fillStyle = "#8a4a10";
  ctx.beginPath();
  ctx.arc(-2.4, 11, 1.4, 0, TAU);
  ctx.arc(2.4, 11, 1.4, 0, TAU);
  ctx.fill();
  if (prop) {
    ctx.strokeStyle = "#6a4020";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(52, 50);
    ctx.lineTo(46, -4);
    ctx.stroke();
    shade(ctx, 46, -14, 11, 12, "#fff6e0", "#d8c8a0", ink);
    ctx.fillStyle = "#e870e8";
    ctx.beginPath();
    ctx.arc(43, -15, 3.2, 0, TAU);
    ctx.arc(50, -15, 3.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#f0a030";
    ctx.beginPath();
    ctx.moveTo(40, -24);
    ctx.lineTo(44, -34);
    ctx.lineTo(48, -24);
    ctx.closePath();
    ctx.fill();
    shade(ctx, 40, 22, 7, 8, "#e6c6f2", "#b88ad0", ink);
  }
}

/** Draws a hero figure centred on x,y (y = body centre). `s` scales the 130-unit-tall figure. */
export function drawFigure(
  ctx: CanvasRenderingContext2D,
  idx: number,
  x: number,
  y: number,
  s: number,
  look: number,
  prop: boolean,
  blink = false,
  t = 0,
  mv?: { speed: number; phase: number },
) {
  const sp = sprites[idx];
  if (sp !== null && sp !== undefined) {
    // Baked 3D model frame (same look as "Meet the heroes").
    const idleFrame = sp.frames[Math.floor((((t / sp.dur) % 1) + 1) % 1 * sp.frames.length)] ?? sp.frames[0];
    const wk = sp.walk;
    // Blend smoothly between idle and walk by speed so starting/stopping never snaps.
    const blend = mv !== undefined && wk !== undefined ? Math.max(0, Math.min(1, (mv.speed - 12) / 70)) : 0;
    const walkFrame = blend > 0 && mv !== undefined && wk !== undefined ? wk[Math.floor((((mv.phase % 1) + 1) % 1) * wk.length)] : undefined;
    const frame = blend > 0.5 && walkFrame !== undefined ? walkFrame : idleFrame;
    const under = blend > 0 && blend < 1 ? (blend > 0.5 ? idleFrame : walkFrame) : undefined;
    if (frame !== undefined) {
      const hh = 185 * s;
      if (under !== undefined) {
        ctx.globalAlpha = 1 - Math.abs(blend - 0.5) * 2 + 0.0;
        ctx.drawImage(under, x - (hh * sp.aspect) / 2, y + 78 * s - hh, hh * sp.aspect, hh);
        ctx.globalAlpha = 1;
      }
      ctx.drawImage(frame, x - (hh * sp.aspect) / 2, y + 78 * s - hh, hh * sp.aspect, hh);
      ctx.fillStyle = idx === 0 ? "rgba(214,190,255,0.85)" : idx === 1 ? "rgba(226,240,92,0.85)" : "rgba(255,150,240,0.85)";
      for (let i = 0; i < 4; i++) {
        const ang = t * 0.8 + i * 1.6 + idx;
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + i);
        ctx.beginPath();
        ctx.arc(x + Math.cos(ang) * 58 * s, y - 10 * s + Math.sin(ang * 1.3) * 50 * s, 2.2, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      return;
    }
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineJoin = "round";
  const hover = Math.sin(t * 3 + idx) * 2.5;
  if (idx === 0) {
    // Floating feet below the hem.
    for (const fx of [-16, 16]) {
      shade(ctx, fx, 52 + hover, 7, 6, "#c6f6fb", "#6fc9d8");
    }
    drawGrimble(ctx, look, prop);
    drawLantern(ctx, -40, 30 + Math.sin(t * 2.4) * 2, t);
  } else if (idx === 1) {
    drawPip(ctx, look);
    drawPouch(ctx, 24, 44);
  } else {
    drawWisp(ctx, look, prop, blink);
    drawSpellbook(ctx, -54 + Math.cos(t * 1.7) * 3, -6 + Math.sin(t * 2.2) * 5, t);
    drawStar(ctx, 30, -48, 6, "#dfe6f2");
  }
  // Magic sparkles drifting around.
  ctx.fillStyle = idx === 0 ? "rgba(214,190,255,0.85)" : idx === 1 ? "rgba(226,240,92,0.85)" : "rgba(255,150,240,0.85)";
  for (let i = 0; i < 4; i++) {
    const a = t * 0.8 + i * 1.6 + idx;
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + i);
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 58, -10 + Math.sin(a * 1.3) * 50, 2.2, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  fillPath(ctx, fill, "rgba(20,8,40,0.5)");
}

function drawLantern(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const glow = ctx.createRadialGradient(x, y + 10, 2, x, y + 10, 30);
  glow.addColorStop(0, `rgba(255,230,140,${0.55 + 0.15 * Math.sin(t * 5)})`);
  glow.addColorStop(1, "rgba(255,230,140,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y + 10, 30, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "#d9a428";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 6, 4, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(x - 7, y, 14, 18, 4);
  fillPath(ctx, "#ffe9a0", "#c8901c");
  ctx.fillStyle = "#e8b53a";
  ctx.fillRect(x - 8, y - 2, 16, 4);
  ctx.fillRect(x - 8, y + 16, 16, 4);
}

function drawPouch(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = "#6a4020";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-26, 40);
  ctx.lineTo(x, y - 2);
  ctx.stroke();
  // Gadgets poking out.
  ctx.fillStyle = "#7cff6a";
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 14, 5, 12, 2);
  fillPath(ctx, "#8cff70", "rgba(20,40,0,0.6)");
  ctx.strokeStyle = "#9aa0a8";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 2);
  ctx.lineTo(x + 8, y - 16);
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(x - 9, y - 4, 20, 16, 4);
  fillPath(ctx, "#8a5a2c", "rgba(30,15,0,0.6)");
  ctx.fillStyle = "#e8b53a";
  ctx.beginPath();
  ctx.arc(x + 1, y + 3, 2.4, 0, TAU);
  ctx.fill();
}

function drawSpellbook(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 2) * 0.12 - 0.1);
  ctx.beginPath();
  ctx.roundRect(-13, -10, 26, 20, 3);
  fillPath(ctx, "#2f4fd0", "rgba(10,10,50,0.7)");
  ctx.fillStyle = "#f6ecd0";
  ctx.fillRect(-11, -8, 10, 16);
  ctx.fillRect(1, -8, 10, 16);
  drawStar(ctx, 0, 0, 5, "#ffc84a");
  ctx.restore();
}
