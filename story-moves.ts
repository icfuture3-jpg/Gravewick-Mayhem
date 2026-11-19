import { HERO_ABILITIES, GADGETS } from "./hero-abilities";
import type { HeroId } from "./solo-story";

export type StoryMove = "sweep" | "portal" | "light" | "ham" | "gadget" | "tiny" | "bolt" | "veil";
export const STORY_MOVES: readonly (readonly StoryMove[])[] = [["sweep", "portal", "light"], ["ham", "gadget", "tiny"], ["bolt", "veil", "bolt"]];
export function storyMove(hero: HeroId, chapter: number) {return STORY_MOVES[hero]![chapter]!;}
export function moveName(move: StoryMove): string {
  const [g,p,w] = HERO_ABILITIES;
  return {sweep:g.primaryName, portal:g.skillName, light:g.ultName, ham:p.primaryName, gadget:p.skillName, tiny:p.ultName, bolt:w.primaryName, veil:w.skillName}[move];
}
/** A single visual vocabulary shared by the story scenes and playable moves. */
export function drawStoryMove(ctx: CanvasRenderingContext2D, move: StoryMove, x: number, y: number, tx: number, ty: number, progress: number, gadget = 0) {
  const p = Math.max(0, Math.min(1, progress));
  ctx.save(); ctx.lineWidth = 5;
  ctx.strokeStyle = move === "gadget" ? GADGETS[gadget]!.color : move === "bolt" || move === "veil" ? "#ff9cf1" : "#ffdc79";
  ctx.fillStyle = ctx.strokeStyle; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 15;
  if (move === "portal") {
    for (const point of [{x,y},{x:tx,y:ty}]) {ctx.beginPath(); ctx.ellipse(point.x, point.y, 18, 40, 0, 0, Math.PI*2); ctx.stroke();}
  } else if (move === "sweep" || move === "light") {
    ctx.globalAlpha *= 1-p*0.6;
    ctx.beginPath(); ctx.arc(x, y, 25+p*(move === "light" ? 600 : 155), move === "light" ? 0 : -1.2, move === "light" ? Math.PI*2 : 1.2); ctx.stroke();
  } else if (move === "bolt") {
    const bx=x+(tx-x)*p, by=y+(ty-y)*p;
    ctx.beginPath();ctx.moveTo(bx-16,by+4);ctx.lineTo(bx+12,by-3);ctx.stroke();
    ctx.beginPath();ctx.arc(bx+12,by-3,5,0,Math.PI*2);ctx.fill();
  } else if (move === "gadget") {
    const bx=x+(tx-x)*p, by=y+(ty-y)*p-Math.abs(Math.sin(p*Math.PI*3))*35;
    ctx.beginPath();ctx.arc(bx,by,11,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle="#322039";ctx.font="bold 12px sans-serif";ctx.textAlign="center";ctx.fillText(["D","F","S"][gadget]!,bx,by+4);
  } else if (move === "veil") {
    ctx.globalAlpha*=0.45;ctx.beginPath();ctx.ellipse(x,y,48+p*25,70,0,0,Math.PI*2);ctx.stroke();
  } else if (move === "tiny") {
    ctx.setLineDash([4,6]);ctx.beginPath();ctx.ellipse(x,y,35,22,0,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}
