import {drawEnvironment,chapterEnvironment} from "./environments";
import {drawFigure} from "./heroes";
import {CIRCUIT,MIRROR_ANGLES,MIRRORS,MACHINE_LOCKS,SKY_STARS} from "./chapter-challenges";
import type {MiniState} from "./mini-game";

const TAU=Math.PI*2;
function label(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,color="#ffdf8a") {ctx.fillStyle=color;ctx.font="bold 18px Trebuchet MS";ctx.textAlign="center";ctx.fillText(value,x,y);}
function line(ctx:CanvasRenderingContext2D,x:number,y:number,tx:number,ty:number,color:string,width=4){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(tx,ty);ctx.stroke();}
/** These are distinct spaces, not palette swaps of one playfield. */
export function drawChapterChallenge(ctx:CanvasRenderingContext2D,s:MiniState):boolean {
 if(s.stage===0 || s.hero===0)return false;
 drawEnvironment(ctx,chapterEnvironment(s.hero,s.stage),960,480);
 if(s.hero===1 && s.stage===1) {
  // A blueprint desk and six-socket circuit with a growing powered route.
  ctx.fillStyle="#214b60";ctx.fillRect(100,85,760,215);
  ctx.strokeStyle="#3d6c7d";ctx.lineWidth=1;
  for(let x=100;x<860;x+=25)line(ctx,x,85,x,300,"#3d6c7d",1);
  for(let y=85;y<300;y+=25)line(ctx,100,y,860,y,"#3d6c7d",1);
  for(let i=0;i<6;i++) {
   const x=180+i*120,y=190+(i%2)*40;
   if(i>0)line(ctx,x-120,190+((i-1)%2)*40,x,y,i<s.progress?"#9fedb0":"#a7bbbf",6);
   ctx.fillStyle=i<s.progress?"#72b995":"#172c39";ctx.beginPath();ctx.arc(x,y,27,0,TAU);ctx.fill();
   label(ctx,i<s.progress?"✓":String(i+1),x,y+6);
  }
  label(ctx,`BLUEPRINT → ${["GEAR ○","SPRING ϟ","BATTERY ▤"][CIRCUIT[Math.min(5,s.progress)]!]}`,480,120);
  ["○","ϟ","▤"].forEach((shape,i)=>{ctx.fillStyle="#795733";ctx.fillRect(245+i*180,310,110,65);label(ctx,shape,300+i*180,352,"#f9df9d");});
  drawFigure(ctx,1,150,390,s.tiny>0?0.25:0.55,0,false,false,s.elapsed);
 } else if(s.hero===1) {
  // Cross-section of the nightmare engine: winding small service passage and lock housings.
  ctx.fillStyle="#49545e";ctx.fillRect(90,90,780,335);
  line(ctx,230,170,420,165,"#14232a",60);line(ctx,420,165,650,165,"#14232a",60);
  line(ctx,650,165,780,260,"#14232a",60);line(ctx,780,260,620,350,"#14232a",60);line(ctx,620,350,310,345,"#14232a",60);
  for(let i=0;i<6;i++){const p=MACHINE_LOCKS[i]!;ctx.fillStyle=i<s.progress?"#7ee09e":"#d96d58";ctx.beginPath();ctx.roundRect(p.x-20,p.y-22,40,44,6);ctx.fill();label(ctx,i<s.progress?"✓":String(i+1),p.x,p.y+6,"#14232a");}
  for(let x=130;x<900;x+=150){ctx.strokeStyle="#89979c";ctx.lineWidth=7;ctx.beginPath();ctx.arc(x,115,26,s.elapsed,s.elapsed+5);ctx.stroke();}
  drawFigure(ctx,1,s.px,s.py,s.tiny>0?0.25:0.55,0,false,false,s.elapsed);
  label(ctx,s.tiny>0?"TINY SERVICE PASSAGE":"L → SHRINK TO OPEN LOCKS",480,455);
 } else if(s.stage===1) {
  // A vaulted reflection hall, no library shelves or page pickups.

  MIRRORS.forEach((p,i)=>{
   ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle=s.aligned[i]?"#8fe3db":"#41527b";ctx.strokeStyle="#d8c0f3";ctx.lineWidth=5;
   ctx.beginPath();ctx.ellipse(0,0,50,75,0,0,TAU);ctx.fill();ctx.stroke();
   const angle=s.mirrorAngles[i]!*Math.PI/2;line(ctx,0,0,Math.cos(angle)*38,Math.sin(angle)*38,"#ffffff",6);ctx.restore();
   label(ctx,`TARGET ${["→","↓","←","↑"][MIRROR_ANGLES[i]!]}`,p.x,p.y+105);
   label(ctx,s.aligned[i]?"ALIGNED ✓":`MIRROR ${i+1}`,p.x,p.y-90,"#dac5f5");
   if(s.aligned[i])line(ctx,p.x,p.y,i<2?MIRRORS[i+1]!.x:880,i<2?MIRRORS[i+1]!.y:160,"#f6dc8c",5);
  });
  drawFigure(ctx,2,100,365,0.48,0,false,false,s.elapsed);
 } else {
  // An observatory roof and open final page beneath the constellation.
  let previous={x:480,y:405};
  SKY_STARS.forEach((p,i)=>{
   if(i<s.progress)line(ctx,previous.x,previous.y,p.x,p.y,"#fbc6ff",5);
   ctx.fillStyle=i<s.progress?"#ebc5ff":i===s.progress?"#ffdf7d":"#77759a";ctx.beginPath();ctx.arc(p.x,p.y,18,0,TAU);ctx.fill();label(ctx,String(i+1),p.x,p.y+6,"#261b39");previous=p;
  });
  ctx.fillStyle="#fff1d2";ctx.fillRect(440,370,80,55);line(ctx,480,370,480,425,"#a56ec8",3);
  drawFigure(ctx,2,375,390,0.48,0,false,false,s.elapsed);
  label(ctx,"INSCRIBE THE CONSTELLATION",480,458);
 }
 return true;
}
