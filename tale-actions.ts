import { drawMeatMallet, drawMonsterToy, drawWhimsicalLibrary } from "./tale-props";
import { drawFigure } from "./heroes";
import type { HeroId } from "./solo-story";

export type TaleAction = "fallen-star" | "keeper-embers" | "star-gate" | "toy-repair" | "prototype" | "machine-locks" | "mirror-book" | "mirror-doubts" | "final-page";
export const TALE_ACTIONS: readonly (readonly TaleAction[])[] = [
  ["fallen-star", "keeper-embers", "star-gate"],
  ["toy-repair", "prototype", "machine-locks"],
  ["mirror-book", "mirror-doubts", "final-page"],
];
export function taleAction(hero: HeroId, chapter: number): TaleAction {return TALE_ACTIONS[hero]![chapter]!;}
export interface TalePose {heroX: number; heroY: number; scale: number; progress: number; action: TaleAction}
/** Shared deterministic choreography; intro plays the task, outro shows the completed result. */
export function talePose(hero: HeroId, chapter: number, time: number, complete = false): TalePose {
  const progress = complete ? 0.8 + Math.min(1, time / 4) * 0.2 : Math.min(1, Math.max(0, time / 7));
  const approach = Math.min(1, progress / 0.7);
  return {action: taleAction(hero, chapter), progress,
    heroX: hero === 2 && chapter === 0 ? 250 + approach * 310 : 220 + progress * 280,
    heroY: hero === 2 && chapter === 0 ? 255 : hero === 1 && chapter < 2 ? 220 : 280,
    scale: hero === 1 && chapter === 2 ? 1.1 - Math.sin(progress * Math.PI) * 0.75 : 1.2};
}
const mix = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));
function star(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? size * 0.42 : size; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);}
  ctx.closePath(); ctx.fill();
}
function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {ctx.fillStyle = "#eadbff"; ctx.font = "bold 17px Trebuchet MS"; ctx.textAlign = "center"; ctx.fillText(text, x, y);}
export function drawTaleAction(ctx: CanvasRenderingContext2D, hero: HeroId, chapter: number, time: number, complete = false) {
  const pose = talePose(hero, chapter, time, complete), p = pose.progress;
  ctx.save();
  ctx.fillStyle = hero === 0 ? "#102d30" : hero === 1 ? "#36251d" : "#211737"; ctx.fillRect(0, 0, 960, 360);
  ctx.fillStyle = "#080911"; ctx.fillRect(0, 310, 960, 50);
  const libraryApproach = hero === 2 && chapter === 0;
  const figure = (x = pose.heroX, alpha = 1, scale = pose.scale) => {ctx.save(); ctx.globalAlpha = alpha; drawFigure(ctx, hero, x, pose.heroY, scale, 0, false, false, time, {speed: p < (libraryApproach ? 0.7 : 0.65) && !complete ? (libraryApproach ? 55 : 100) : 0, phase: time * (libraryApproach ? 0.65 : 1.4), side: libraryApproach}); ctx.restore();};
  if (hero === 0) {
    // Grimble carries an actual lantern; sparks visibly enter it, then illuminate the scene.
    const lx = pose.heroX + 45, ly = 240;
    figure(); ctx.fillStyle = "#6d5532"; ctx.fillRect(lx - 16, ly - 20, 32, 42);
    ctx.fillStyle = `rgba(255,211,106,${0.2 + p * 0.8})`; ctx.fillRect(lx - 12, ly - 16, 24, 34);
    if (chapter === 0) {
      ctx.fillStyle = "#ffd36a";
      const fall = Math.min(1, p * 2.5); star(ctx, mix(820, 650, fall), mix(20, 245, fall), 26 * (1 - p * 0.4));
      ctx.strokeStyle = "#a68b48"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(840, 10); ctx.lineTo(mix(820, 650, fall), mix(20, 245, fall)); ctx.stroke();
      for (let i = 0; i < 5; i++) {const t = Math.max(0, (p - 0.4 - i * 0.04) * 2.7); ctx.fillStyle = "#ffe697"; star(ctx, mix(650 + Math.cos(i) * 60, lx, t), mix(245 + Math.sin(i) * 40, ly, t), 6);}
      label(ctx, p < 0.4 ? "A fallen star lights the night" : "Grimble catches its lost sparks in his lantern", 500, 50);
    } else if (chapter === 1) {
      for (let i = 0; i < 5; i++) {const x = 550 + i * 70; ctx.fillStyle = "#485351"; ctx.fillRect(x - 22, 180, 44, 115); label(ctx, "Keeper", x, 170); ctx.fillStyle = i / 5 < p ? "#ffd36a" : "#595449"; ctx.fillRect(x - 8, 210, 16, 24);}
      label(ctx, "Grimble relights the missing keepers' lanterns", 480, 50);
    } else {
      ctx.fillStyle = "#536063"; ctx.fillRect(640, 90, 190, 220);
      const open = Math.max(0, (p - 0.6) * 2.5); ctx.fillStyle = "#0b101a"; ctx.fillRect(735 - open * 75, 110, open * 150, 200);
      for (let i = 0; i < 5; i++) {ctx.fillStyle = "#ffd36a"; star(ctx, mix(560 + i * 55, 735, p), mix(90 + i * 22, 190, p), 10);}
      ctx.strokeStyle = "#ffd36a"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(735, 190); ctx.stroke();
      label(ctx, open > 0.4 ? "The star-key opens the gate" : "Five fragments form a key of golden light", 480, 50);
    }
  } else if (hero === 1) {
    if (chapter < 2) {
      ctx.fillStyle = "#795135"; ctx.fillRect(440, 255, 410, 18); ctx.fillRect(470, 270, 18, 60); ctx.fillRect(800, 270, 18, 60);
      const count = chapter === 0 ? 6 : 4;
      const beat = Math.min(count - 0.001, p * count), current = Math.floor(beat), swing = Math.sin((beat % 1) * Math.PI);
      const handX = 490 + current * (320 / count);
      // Pip stays alongside the current toy, with a short mallet held at hand height.
      figure(handX - 55);
      for (let i = 0; i < count; i++) {
        const fixed = complete || i < current || (i === current && beat % 1 > 0.5);
        drawMonsterToy(ctx, i, 505 + i * (320 / count), 245, fixed, time);
      }
      drawMeatMallet(ctx, handX, 220, complete || p === 1 ? 0.2 : swing);
      label(ctx, chapter === 0 ? "Pip repairs the market's broken toys" : "Pip rebuilds his first failed prototype", 480, 50);
      if (p > 0.8) label(ctx, chapter === 0 ? "Six toys spring back to life!" : "The old engine hums again!", 650, 110);
    } else {
      ctx.fillStyle = "#566166"; ctx.fillRect(540, 70, 320, 240);
      ctx.fillStyle = "#10131d"; ctx.fillRect(540, 255, 320, 55);
      const scanner = 570 + Math.sin(time * 2) * 25; ctx.fillStyle = "#f75d60"; ctx.fillRect(scanner, 120, 5, 180);
      for (let i = 0; i < 6; i++) {ctx.fillStyle = p > (i + 1) / 7 ? "#738850" : "#ff605e"; ctx.fillRect(590 + i * 37, 170, 20, 26);}
      figure(mix(220, 700, p));
      label(ctx, p < 0.7 ? "Pip shrinks and slips beneath the scanner" : "His gadgets disable the nightmare machine's locks", 480, 50);
    }
  } else {
    drawWhimsicalLibrary(ctx, time);
    // An arched, gilt mirror anchors the magical reading nook.
    ctx.fillStyle = "#48366b"; ctx.strokeStyle = "#dfbe86"; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(600, 303); ctx.lineTo(600, 152); ctx.bezierCurveTo(600, 61, 770, 61, 770, 152); ctx.lineTo(770, 303); ctx.closePath(); ctx.fill(); ctx.stroke();
    figure();
    if (chapter === 0) {
      const bx = mix(685, pose.heroX + 70, Math.max(0, (p - 0.7) / 0.3));
      ctx.fillStyle = "#efdfff"; ctx.fillRect(bx - 28, 190 + Math.sin(time * 3) * 4, 56, 38); ctx.strokeStyle = "#a96deb"; ctx.lineWidth = 3; ctx.strokeRect(bx - 28, 190 + Math.sin(time * 3) * 4, 56, 38);
      ctx.fillStyle = "#a96deb"; ctx.fillRect(bx - 2, 190 + Math.sin(time * 3) * 4, 4, 38);
      label(ctx, p < 0.4 ? "Wisp discovers a book inside the library mirror" : "She reaches through: the spellbook floats to her side", 480, 50);
    } else if (chapter === 1) {
      // Show the doubt fading as mist, never as extra Wisp figures.
      ctx.save(); ctx.globalAlpha = (1 - p) * 0.5; ctx.fillStyle = "#161020";
      ctx.beginPath(); ctx.ellipse(685, 210, 65, 80, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      label(ctx, "Wisp trusts her own voice; the doubtful mirror clears", 480, 50);
    } else {
      ctx.save(); ctx.globalAlpha = 1 - p; ctx.fillStyle = "#151023"; ctx.fillRect(610, 120, 150, 180); ctx.restore();
      ctx.fillStyle = "#f4e6ce"; ctx.fillRect(545, 210, 100, 75);
      ctx.strokeStyle = "#ac61d1"; ctx.lineWidth = 3;
      for (let i = 0; i < Math.floor(p * 6); i++) {ctx.beginPath(); ctx.moveTo(558, 224 + i * 8); ctx.lineTo(620, 224 + i * 8); ctx.stroke();}
      ctx.strokeStyle = "#e5c785"; ctx.beginPath(); ctx.moveTo(pose.heroX + 40, 230); ctx.lineTo(590, 250); ctx.stroke();
      if (p > 0.7) for (let i = 0; i < 16; i++) {ctx.fillStyle = "#eed6ff"; star(ctx, 680 + Math.cos(i * 2.4) * p * 95, 190 + Math.sin(i * 2.4) * p * 90, 4);}
      label(ctx, "Wisp writes her own ending; the dark mirror turns to starlight", 480, 50);
    }
  }
  ctx.restore();
}
