import {drawEnvironment} from "./environments";
import {drawEnemy} from "./art";
import {drawFigure} from "./heroes";
import {BOSS_DESIGNS} from "./boss-design";
import type {Scene} from "./movie";
/** Boss-specific shots show the actual boss and the mechanics players will face. */
export function drawBossScene(ctx:CanvasRenderingContext2D,scene:Scene,time:number) {
 const p=Math.min(1,time/scene.duration),defeat=scene.bossMoment==="defeat",turn=scene.bossMoment==="turn";
 const design=BOSS_DESIGNS[scene.stage]!,x=720,y=260;
 ctx.save();drawEnvironment(ctx,scene.stage===0?"town":scene.stage===1?"crypt":"citadel",960,540);ctx.strokeStyle=design.color;ctx.lineWidth=4;
 if(scene.boss==="boogeyman") {

  for(let i=-2;i<=2;i++){
   const d=(p*1.5)%1;ctx.fillStyle=design.color;ctx.beginPath();ctx.arc(x-d*480,220+i*d*65,9,0,Math.PI*2);ctx.fill();
  }
  for(const side of [-1,1])drawEnemy(ctx,"clown",500+side*90+(defeat?p*250:0),310,22,time,Math.PI,false,false,0);
 } else if(scene.boss==="nergal") {

  for(let i=0;i<12;i++){
   const angle=i*Math.PI/6+time*(turn?-1:1);ctx.fillStyle=design.color;ctx.beginPath();ctx.arc(x+Math.cos(angle)*100,210+Math.sin(angle)*75,8,0,Math.PI*2);ctx.fill();
  }
  ctx.beginPath();ctx.arc(x,y,220,Math.PI*0.75+p,Math.PI*1.25+p);ctx.stroke();
 } else {

  for(let i=0;i<(turn?2:1);i++){
   const cx=400+i*160;ctx.beginPath();ctx.ellipse(cx,320,65,25,0,0,Math.PI*2);ctx.stroke();
   ctx.beginPath();ctx.moveTo(cx,70);ctx.lineTo(cx,320);ctx.stroke();
  }
  for(let i=0;i<2;i++)drawEnemy(ctx,"slime",610+i*190,335,20,time,Math.PI,false,false,0);
 }
 ctx.save();ctx.globalAlpha=defeat?1-p:1;
 drawEnemy(ctx,scene.boss!,x,scene.boss==="meteor"?165:y,scene.boss==="meteor"?68:60,time,Math.PI,defeat&&p>0.6,false,0);ctx.restore();
 for(let i=0;i<3;i++){
  const hx=160+i*100+(defeat?p*100:0),hy=290+(i%2)*30;
  drawFigure(ctx,i,hx,hy,0.9,0,i!==1,false,time);
  if(defeat){ctx.strokeStyle=["#ffdf8a","#b9d96c","#e9a4ff"][i]!;ctx.beginPath();ctx.moveTo(hx,hy-30);ctx.lineTo(x,y);ctx.stroke();}
 }
 ctx.fillStyle=design.color;ctx.font="bold 22px Trebuchet MS";ctx.textAlign="center";ctx.fillText(design.name,720,65);
 ctx.font="14px Trebuchet MS";ctx.fillText(design.hint,480,400);
 ctx.restore();
}
