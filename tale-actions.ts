import { drawConclusion } from "./story-tableaux";
import { drawStoryMove, storyMove, moveName } from "./story-moves";
import { drawMeatMallet, drawMonsterToy, drawWhimsicalLibrary, drawWorkshopTable, drawWorkshop } from "./tale-props";
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
    heroX: hero===0 && chapter===0 ? 640 : hero === 2 && chapter === 0 ? 250 + approach * 310 : hero === 0 && chapter === 1 ? (progress < 0.45 ? 220 : 480) : 220 + progress * 280,
    heroY: hero === 2 && chapter === 0 ? 255 : hero === 1 && chapter < 2 ? 220 : 280,
    scale: hero === 1 && chapter === 2 && time >= 0.2 && time < 6.2 && !complete ? 0.45 : 1.2};
}
/** Walk in profile to the bench, then take short steps between toys and stop to hammer. */
export function workshopPose(time: number) {
  const t=Math.max(0,Math.min(7,time)), approach=1.4, beat=(7-approach)/6;
  const toy=Math.min(5,Math.floor(Math.max(0,t-approach)/beat));
  const local=Math.max(0,t-approach-toy*beat), target=450+toy*(320/6);
  const walking=t<approach || (toy>0 && local<0.25);
  const heroX=t<approach ? 220+(450-220)*(t/approach) : toy>0 && local<0.25 ? target-320/6+(320/6)*(local/0.25) : target;
  const strike=Math.max(0,(local-(toy>0?0.25:0))/(beat-(toy>0?0.25:0)));
  return {toy,heroX,walking,swing:t>=7?0.2:Math.sin(Math.min(1,strike)*Math.PI),fixed:strike>=0.5};
}
const mix = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));
function star(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? size * 0.42 : size; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);}
  ctx.closePath(); ctx.fill();
}
function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {ctx.fillStyle = "#eadbff"; ctx.font = "bold 17px Trebuchet MS"; ctx.textAlign = "center"; ctx.fillText(text, x, y);}
export function drawTaleAction(ctx: CanvasRenderingContext2D, hero: HeroId, chapter: number, time: number, complete = false) {
  time=Math.min(7,Math.max(0,time));
  if(complete){drawConclusion(ctx,hero,chapter,time);return;}
  const pose = talePose(hero, chapter, time, complete), p = pose.progress;
  ctx.save();
  ctx.fillStyle = hero === 0 ? "#102d30" : hero === 1 ? "#36251d" : "#211737"; ctx.fillRect(0, 0, 960, 360);
  ctx.fillStyle = "#080911"; ctx.fillRect(0, 310, 960, 50);
  const libraryApproach = hero === 2 && chapter === 0;
  const figure = (x = pose.heroX, alpha = 1, scale = pose.scale) => {ctx.save(); ctx.globalAlpha = alpha * (hero === 2 && chapter === 1 && time < 5 && !complete ? 0.18 : 1); drawFigure(ctx, hero, x, pose.heroY, scale, 0, false, false, time, {speed: p < (libraryApproach ? 0.7 : 0.65) && !complete ? (libraryApproach ? 55 : 100) : 0, phase: time * (libraryApproach ? 0.65 : 1.4), side: libraryApproach}); ctx.restore();};
  if (hero === 0) {
    // Grimble carries an actual lantern; sparks visibly enter it, then illuminate the scene.
    const lx = pose.heroX + 45, ly = 240;
    figure(); ctx.fillStyle = "#6d5532"; ctx.fillRect(lx - 16, ly - 20, 32, 42);
    ctx.fillStyle = `rgba(255,211,106,${0.2 + p * 0.8})`; ctx.fillRect(lx - 12, ly - 16, 24, 34);
    if (chapter === 0) {
      ctx.fillStyle = "#ffd36a";
      // Continue from the patrol's starfall: a close-up catch, not a second falling star.
      ctx.fillStyle="rgba(255,225,141,0.22)";ctx.beginPath();ctx.arc(760,180,130,0,Math.PI*2);ctx.fill();
      for(let i=0;i<5;i++){
        const t=Math.min(1,Math.max(0,(p-i*0.12)*2.5));
        ctx.fillStyle="#fff0ac";star(ctx,mix(780+i*10,lx,t),mix(100+i*18,ly,t),7);
      }
      label(ctx,"The five star shards settle safely inside his lantern",480,50);
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
    if(chapter===1){
      ctx.fillStyle="#183744";ctx.fillRect(0,65,960,245);
      for(let i=0;i<6;i++){ctx.fillStyle=i/6<p?"#a7ecc4":"#576d7d";ctx.fillRect(430+i*65,140+(i%2)*45,38,38);}
      ctx.strokeStyle="#98d5d1";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(390,170);ctx.lineTo(850,220);ctx.stroke();
      figure(310);drawStoryMove(ctx,"gadget",350,240,760,180,p,1);
      label(ctx,"Pip wires a circuit into his forgotten prototype",480,50);
    } else if (chapter === 0) {
      drawWorkshop(ctx);
      drawWorkshopTable(ctx,390,190,500,200);
      const repair = workshopPose(time);
      drawFigure(ctx,1,repair.heroX,220,0.9,0,false,false,time,{side:true,speed:repair.walking?55:0,phase:time*0.65});
      for (let i = 0; i < 6; i++) drawMonsterToy(ctx,i,505+i*(320/6),245,i<repair.toy || (i===repair.toy && repair.fixed),time);
      if(!repair.walking) drawMeatMallet(ctx,repair.heroX+55,220,repair.swing);
      label(ctx,"Pip walks to the toys and repairs them",480,50);
      if(time>=7) label(ctx,"Six toys spring back to life!",650,110);
    } else {
      ctx.fillStyle = "#566166"; ctx.fillRect(540, 70, 320, 240);
      ctx.fillStyle = "#10131d"; ctx.fillRect(540, 255, 320, 55);
      const scanner = 570 + Math.sin(time * 2) * 25; ctx.fillStyle = "#f75d60"; ctx.fillRect(scanner, 120, 5, 180);
      for (let i = 0; i < 6; i++) {ctx.fillStyle = p > (i + 1) / 7 ? "#738850" : "#ff605e"; ctx.fillRect(590 + i * 37, 170, 20, 26);}
      figure(mix(220, 700, p));
      label(ctx, p < 0.7 ? "Pip shrinks and slips beneath the scanner" : "His gadgets disable the nightmare machine's locks", 480, 50);
    }
  } else {
    if(chapter===0) drawWhimsicalLibrary(ctx,time);
    else if(chapter===1){ctx.fillStyle="#252b49";ctx.fillRect(0,0,960,360);for(let i=0;i<5;i++){ctx.fillStyle="#676589";ctx.fillRect(i*220,70,25,240);}}
    else {ctx.fillStyle="#10142d";ctx.fillRect(0,0,960,360);for(let i=0;i<35;i++){ctx.fillStyle="#dcc8ff";ctx.fillRect(100+(i*137)%780,70+(i*59)%220,3,3);}ctx.strokeStyle="#79749b";ctx.lineWidth=12;ctx.beginPath();ctx.arc(480,340,300,Math.PI,0);ctx.stroke();}
    // An arched, gilt mirror anchors the magical reading nook.
    if(chapter<2){
    ctx.fillStyle = "#48366b"; ctx.strokeStyle = "#dfbe86"; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(600, 303); ctx.lineTo(600, 152); ctx.bezierCurveTo(600, 61, 770, 61, 770, 152); ctx.lineTo(770, 303); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
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
  const move = storyMove(hero, chapter);
  const bookDiscovery = hero === 2 && chapter === 0;
  const castX = bookDiscovery ? mix(685, pose.heroX + 70, Math.max(0, (p - 0.7) / 0.3)) : hero === 0 && chapter === 1 ? 220 : pose.heroX + 35;
  if (!complete && time <= 7 && (!bookDiscovery || p >= 0.7)) drawStoryMove(ctx, move, castX, bookDiscovery ? 210 : pose.heroY-25,
    hero === 0 && chapter === 1 ? 480 : 800, hero === 0 && chapter === 1 ? pose.heroY-25 : 230, bookDiscovery ? (p-0.7)/0.3 : p, chapter % 3);
  if (hero === 2 && chapter === 2 && !complete && p > 0.3) {
    // The floating book, not a second Wisp, launches the bolt.
    ctx.fillStyle="#f4e6ce";ctx.fillRect(pose.heroX+25,pose.heroY-48,40,26);
  }
  label(ctx, `${moveName(move)}${move === "tiny" ? " · 6 seconds" : move === "veil" ? " · 5 seconds" : ""}`, 480, 340);
  ctx.restore();
}
