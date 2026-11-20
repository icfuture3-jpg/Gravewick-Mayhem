import {drawEnvironment} from "./environments";
import { drawChapterChallenge } from "./chapter-art";
import { drawStoryMove } from "./story-moves";
import { drawHero } from "./art";
import { drawFigure } from "./heroes";
import { drawMeatMallet, drawMonsterToy, drawWhimsicalLibrary, drawWorkshopTable } from "./tale-props";
import { HOME, bookPose, REPAIR_PARTS, miniObjective, shadowPosition, type MiniState } from "./mini-game";

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
  const uniqueChapter=drawChapterChallenge(ctx,s);
  if(uniqueChapter) { /* Dedicated chapter layout already drawn. */ } else if (s.hero === 2) {
    ctx.save(); ctx.scale(1, 480 / 360); drawWhimsicalLibrary(ctx, s.elapsed); ctx.restore();

    for (const p of s.pages) if (!p.taken) {page(ctx, p.x, p.y + Math.sin(s.elapsed * 2) * 3); text(ctx, "PAGE", p.x, p.y + 40, "#f3c9ff", 15);}
  } else if (s.hero === 0) {
    drawEnvironment(ctx,s.stage===0?"town":s.stage===1?"crypt":"citadel",960,480);
    ring(ctx, s.px, s.py, 130, "#63885d");
    for (let i = 0; s.stage>0 && i < 3; i++) {
      const p = shadowPosition(i, s.elapsed);
      ctx.fillStyle = "#754269"; ctx.beginPath(); ctx.ellipse(p.x, p.y, 27, 22, Math.sin(s.elapsed + i) * 0.15, 0, Math.PI * 2); ctx.fill();
      for (const side of [-1, 1]) {ctx.fillStyle = "#e9a7df"; ctx.beginPath(); ctx.arc(p.x + side * 8, p.y - 4, 3, 0, Math.PI * 2); ctx.fill();}
    }
    if(s.stage>0) {
      if(s.stage===2) {ctx.fillStyle="#56456c";ctx.fillRect(390,90,180,210);ctx.fillStyle="#d9b269";ctx.fillRect(470,105,20,s.progress*35);}
      s.sparks.forEach((point,i)=>{
        ctx.fillStyle=point.taken ? "#ffe78d" : s.stage===2 && i===s.progress ? "#bb8d3b" : "#394a50";
        ctx.fillRect(point.x-18,point.y-24,36,48);
        ring(ctx,point.x,point.y,30,point.taken || (s.stage===2 && i===s.progress) ? "#ffe78d" : "#82988f");
        text(ctx,`${s.stage===1 ? "LANTERN" : "SEAL"} ${i+1}`,point.x,point.y+52,"#fff1c5",14);
      });
    }
    for (const shard of s.sparks) if (s.stage===0 && !shard.taken && s.sparks.indexOf(shard)===s.progress) {
      ring(ctx,shard.x,shard.y,30,"#ffdf76");
      text(ctx,`Press ${s.progress+1}`,shard.x,shard.y+50,"#ffe697",16);
      ctx.save(); ctx.shadowColor="#ffdf76"; ctx.shadowBlur=20;
      ctx.strokeStyle="#ffe7a2"; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(shard.x,shard.fallY-32); ctx.lineTo(shard.x,shard.fallY-12); ctx.stroke();
      ctx.fillStyle="#ffe697"; ctx.beginPath();
      ctx.moveTo(shard.x,shard.fallY-15); ctx.lineTo(shard.x+10,shard.fallY); ctx.lineTo(shard.x,shard.fallY+15); ctx.lineTo(shard.x-10,shard.fallY); ctx.closePath(); ctx.fill();
      ctx.strokeStyle="#fff7d4"; ctx.beginPath();ctx.moveTo(shard.x,shard.fallY-12);ctx.lineTo(shard.x,shard.fallY+11);ctx.stroke();
      ctx.restore();
    }
  } else {
    drawEnvironment(ctx,"workshop",960,480);
    text(ctx, ["MARKET TOY REPAIR", "PROTOTYPE WORKSHOP", "NIGHTMARE MACHINE REPAIR"][s.stage]!, 480, 96, "#e7bb84", 20);
    for (let i = 0; i < 6; i++) {
      const x = 155 + i * 130;
      drawMonsterToy(ctx, i, x, 170, i < s.progress, s.elapsed+s.celebrationTime);
      text(ctx, i < s.progress ? "FIXED ✓" : `Toy ${i + 1}`, x, 195, i < s.progress ? "#b7e68a" : "#c5b0ca", 14);
    }
    drawWorkshopTable(ctx,225,240,540,210);
    ctx.save(); ctx.translate(480, 280); ctx.scale(1.7, 1.7);
    drawMonsterToy(ctx, Math.min(5, s.progress), 0, 0, s.status === "won", s.elapsed+s.celebrationTime); ctx.restore();
    if (s.status === "playing") for (let i = 0; i < REPAIR_PARTS.length; i++) {
      const p = REPAIR_PARTS[i]!;
      ring(ctx, p.x, p.y, i === s.part ? 24 : 16, i === s.part ? "#ffdc6a" : i < s.part ? "#a8dc8a" : "#7c687e");
      text(ctx, i < s.part ? "✓" : String(i + 1), p.x, p.y + 6, i === s.part ? "#fff5c7" : "#d1c4d7", 19);
    }
    const hit = s.swing > 0, part = hit ? {x: s.swingX, y: s.swingY} : REPAIR_PARTS[s.part]!;
    const hx = part.x - 49, hy = part.y - 8;
    drawFigure(ctx, 1, hx - 35, hy + 22, s.tiny > 0 ? 0.29 : 0.65, 0, false, false, s.elapsed, {side:true,speed:0,phase:0});
    ctx.save();
    if(s.tiny>0) {ctx.translate(hx,hy);ctx.scale(0.6,0.6);ctx.translate(-hx,-hy);}
    drawMeatMallet(ctx, hx, hy, hit ? Math.sin((1 - s.swing / (s.tiny > 0 ? 0.14 : 0.28)) * Math.PI) : 0);
    ctx.restore();
    if (hit) ring(ctx, part.x, part.y, 28 + (0.28 - s.swing) * 20, "#fff1a1");
    ring(ctx, aimX, aimY, 7, "#ffffff");
  }
  if (!uniqueChapter && s.hero !== 1) {
    const homeColor = s.hero === 0 ? "#ffdf8a" : "#e5a7ff";
    if(s.hero!==0) ring(ctx, HOME.x, HOME.y, 52, homeColor);
    if(s.hero===2) {
      const book = bookPose(s);
      ctx.save(); ctx.translate(book.x - HOME.x, book.y - HOME.y);
      ctx.shadowColor = "#f2acff"; ctx.shadowBlur = book.glow;
      ctx.fillStyle = "#fff0ce"; ctx.strokeStyle = "#b072da"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(HOME.x - 35, HOME.y - 21, 70, 42, 5); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(HOME.x, HOME.y - 21); ctx.lineTo(HOME.x, HOME.y + 21); ctx.stroke();
      for (let i = 0; i < s.progress; i++) text(ctx, "✦", HOME.x - 18 + i * 18, HOME.y + 8, "#a053be", 17);
      ctx.restore();
    }
    if(s.hero!==0) text(ctx, "BOOK", HOME.x, HOME.y + 43, homeColor, 16);
    const look = s.destination ? Math.atan2(s.destination.y - s.py, s.destination.x - s.px) : 0;
    // Wisp has no extra combat spellbook: the only book is the clickable quest book above.
    if (s.hero === 2) drawFigure(ctx, 2, s.px, s.py + 3, 0.46, look, false, false, s.elapsed);
    else drawHero(ctx, s.hero, s.px, s.py, look, s.elapsed, s.invuln > 0, false, 0, s);
    if (s.carrying !== null) page(ctx, s.px + 30, s.py - 35);
    if (s.destination) ring(ctx, s.destination.x, s.destination.y, 12, "#e9d6fa");
    if (s.carrying !== null) {
      ctx.save(); ctx.setLineDash([8, 8]); ctx.strokeStyle = homeColor; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(s.px, s.py); ctx.lineTo(HOME.x, HOME.y); ctx.stroke(); ctx.restore();
    }
  }
  for(const illusion of s.illusions) {
    ctx.save();ctx.globalAlpha=0.45;
    drawFigure(ctx,2,illusion.x,illusion.y,0.46,0,false,false,s.elapsed);ctx.restore();
    text(ctx,"ILLUSION",illusion.x,illusion.y+45,"#eeb6ff",12);
  }
  for(const bolt of s.illusionBolts) drawStoryMove(ctx,"bolt",bolt.x,bolt.y,bolt.tx,bolt.ty,bolt.age/0.6);
  if (s.effect) {const e=s.effect;drawStoryMove(ctx,e.move,e.x,e.y,e.tx,e.ty,e.age/0.7);}
  if (s.projectile) {const p=s.projectile;drawStoryMove(ctx,p.move,p.x,p.y,p.tx,p.ty,p.age/0.6,p.gadget);}
  ctx.fillStyle = "rgba(14,8,24,0.92)"; ctx.fillRect(0, 0, 960, 60);
  text(ctx, miniObjective(s), 480, 36, "#ffdf8a", 20);
}
