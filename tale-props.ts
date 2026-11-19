import { drawEnemy, type EnemyKind } from "./art";

const TOY_MONSTERS: readonly EnemyKind[] = ["clown", "bat", "ghoul", "slime", "boogeyman", "nergal"];
/** Miniatures of the actual enemies, mounted on wooden toy wheels. */
export function drawMonsterToy(ctx: CanvasRenderingContext2D, index: number, x: number, y: number, fixed: boolean, time: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(fixed ? Math.sin(time * 4 + index) * 0.05 : -0.12);
  ctx.fillStyle = "#b8824f"; ctx.strokeStyle = "#322139"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-24, -4, 48, 8, 4); ctx.fill(); ctx.stroke();
  const kind = TOY_MONSTERS[index % TOY_MONSTERS.length]!;
  drawEnemy(ctx, kind, 0, -12, kind === "boogeyman" || kind === "nergal" ? 20 : 16, fixed ? time : 0, Math.PI, false, false, 0);
  for (const side of [-1, 1]) {
    ctx.fillStyle = "#322139"; ctx.beginPath(); ctx.arc(side * 16, 7, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#edbe79"; ctx.beginPath(); ctx.arc(side * 16, 7, 3, 0, Math.PI * 2); ctx.fill();
  }
  if (fixed) {ctx.fillStyle = "#ffe492"; ctx.beginPath(); ctx.arc(22, -48, 3, 0, Math.PI * 2); ctx.fill();}
  ctx.restore();
}

/** A short bone-handled ham mallet; pivot stays in Pip's hand for the entire strike. */
export function drawMeatMallet(ctx: CanvasRenderingContext2D, handX: number, handY: number, swing: number) {
  ctx.save(); ctx.translate(handX, handY); ctx.rotate(-1.3 + swing * 1.65);
  ctx.strokeStyle = "#402333"; ctx.lineWidth = 3;
  ctx.fillStyle = "#e9d5ae"; ctx.beginPath(); ctx.roundRect(-5, -5, 48, 10, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#c95e78"; ctx.beginPath(); ctx.ellipse(45, 0, 23, 18, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#f49aac"; ctx.beginPath(); ctx.ellipse(53, 0, 12, 14, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#fff0ce"; ctx.beginPath(); ctx.arc(55, 0, 5, 0, Math.PI * 2); ctx.fill();
  // Fingers wrap over the handle, so it cannot read as a floating tool.
  ctx.fillStyle = "#a4b951"; ctx.beginPath(); ctx.ellipse(0, 0, 8, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}

/** Crooked bookcases, jewel-coloured books, floating candles and a moonlit window. */
export function drawWhimsicalLibrary(ctx: CanvasRenderingContext2D, time: number) {
  ctx.fillStyle = "#211934"; ctx.fillRect(0, 0, 960, 360);
  ctx.fillStyle = "#42304e"; ctx.fillRect(0, 300, 960, 60);
  ctx.strokeStyle = "#796078"; ctx.lineWidth = 1;
  for (let y = 305; y < 360; y += 16) {ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(960, y); ctx.stroke();}
  for (let x = -200; x < 1200; x += 100) {ctx.beginPath(); ctx.moveTo(480 + (x - 480) * 0.6, 300); ctx.lineTo(x, 360); ctx.stroke();}
  // Arched star window in the reading nook.
  ctx.fillStyle = "#171c48"; ctx.strokeStyle = "#c7a4d6"; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(377, 245); ctx.lineTo(377, 137); ctx.bezierCurveTo(377, 56, 523, 56, 523, 137); ctx.lineTo(523, 245); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#ffedb2"; ctx.beginPath(); ctx.arc(463, 125, 24, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#171c48"; ctx.beginPath(); ctx.arc(473, 116, 23, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 12; i++) {ctx.fillStyle = "#e6caf6"; ctx.beginPath(); ctx.arc(390 + (i * 29) % 120, 146 + (i * 19) % 85, 1.5, 0, Math.PI * 2); ctx.fill();}
  const colors = ["#b16991", "#60a19b", "#d4ad61", "#8278be", "#c07d59"];
  for (const [index, x] of [38, 207, 804].entries()) {
    ctx.save(); ctx.translate(x, 75); ctx.rotate(index === 1 ? 0.035 : -0.025);
    ctx.fillStyle = "#563951"; ctx.strokeStyle = "#b88767"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.roundRect(0, 0, 143, 230, [35, 35, 4, 4]); ctx.fill(); ctx.stroke();
    for (let shelf = 0; shelf < 3; shelf++) {
      const y = 66 + shelf * 70;
      ctx.fillStyle = "#2a1b34"; ctx.fillRect(10, y - 48, 123, 49);
      for (let book = 0; book < 8; book++) {
        const h = 28 + (book * 7 + shelf * 11) % 22, bx = 14 + book * 15;
        ctx.fillStyle = colors[(book + shelf + index) % colors.length]!;
        ctx.fillRect(bx, y - h, 12, h);
        ctx.fillStyle = "#e5c689"; ctx.fillRect(bx + 2, y - h + 6, 8, 2); ctx.fillRect(bx + 2, y - 6, 8, 2);
      }
      ctx.fillStyle = "#be8c68"; ctx.fillRect(6, y, 131, 6);
    }
    ctx.restore();
  }
  ctx.fillStyle = "#805c91"; ctx.beginPath(); ctx.ellipse(624, 321, 161, 23, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#d8ae76"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(624, 321, 147, 17, 0, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const x = 180 + i * 142, y = 88 + Math.sin(time * 0.8 + i) * 7;
    ctx.fillStyle = "#f3d2a5"; ctx.fillRect(x - 4, y, 8, 21);
    ctx.save(); ctx.shadowColor = "#ffdc8b"; ctx.shadowBlur = 16; ctx.fillStyle = "#ffe5a0";
    ctx.beginPath(); ctx.ellipse(x, y - 6, 4, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}
