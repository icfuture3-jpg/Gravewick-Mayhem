import {drawEnvironment,chapterEnvironment} from "./environments";
import {drawFigure} from "./heroes";
import {drawMonsterToy,drawWhimsicalLibrary,drawWorkshopTable,drawWorkshop} from "./tale-props";
import type {HeroId} from "./solo-story";

const TITLES=[['The lonely night watch','The keeper lights remember','A town finds its way home'],['Behind the market stall','The first engine wakes','The nightmare machine sleeps'],['Before the mirror answered','Doubt gives way to courage','An ending written in starlight']] as const;
function caption(ctx:CanvasRenderingContext2D,text:string){ctx.fillStyle="#ffe3a0";ctx.font="bold 23px Trebuchet MS";ctx.textAlign="center";ctx.fillText(text,480,45);}
export function watchPose(time:number) {
 const t=Math.max(0,Math.min(7,time));
 return {x:t<2?180+t*90:t<3?360:t<5?360+(t-3)*140:640,
   walking:t<2 || (t>=3&&t<5), seesStar:t>=2, catching:t>=5, glow:t<2?0:Math.min(1,(t-2)*2)};
}
function drawNightWatch(ctx:CanvasRenderingContext2D,time:number) {
 const pose=watchPose(time),t=Math.min(7,time);
 drawEnvironment(ctx,"town");
 if(pose.seesStar){
  ctx.fillStyle=`rgba(255,225,141,${pose.glow*0.28})`;ctx.beginPath();ctx.arc(735,160,150,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=`rgba(255,244,193,${pose.glow*0.5})`;ctx.beginPath();ctx.arc(735,160,75,0,Math.PI*2);ctx.fill();
  const fall=Math.min(1,(t-2)/2),x=840-fall*130,y=55+fall*140;
  ctx.strokeStyle="#ffe7a2";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x+60,y-45);ctx.lineTo(x,y);ctx.stroke();
  ctx.fillStyle="#fff2ae";ctx.font="bold 38px sans-serif";ctx.fillText("✦",x,y);
 }
 drawFigure(ctx,0,pose.x,270,0.8,0,false,false,t,{side:true,speed:pose.walking?85:0,phase:t*0.7});
 ctx.fillStyle="#8e713e";ctx.fillRect(pose.x+24,237,24,35);ctx.fillStyle="#ffe494";ctx.fillRect(pose.x+28,241,16,26);
 if(pose.catching)for(let i=0;i<5;i++){
  const p=Math.min(1,Math.max(0,(t-5-i*0.2)*1.6));
  ctx.fillStyle="#fff0ac";ctx.beginPath();ctx.arc(710+(pose.x+36-710)*p,195+(253-195)*p,5,0,Math.PI*2);ctx.fill();
 }
 caption(ctx,t<2?"Grimble patrols while the town sleeps":t<3?"A bright light! A star is falling!":t<5?"He walks toward the fallen star":"Grimble catches the shining shards");
}
/** Separate opening tableaux, not a replay of the chapter's action shot. */
export function drawPrologue(ctx:CanvasRenderingContext2D,hero:HeroId,time:number){
 const p=Math.min(1,time/5);ctx.fillStyle=['#101e31','#3c2530','#2a2347'][hero];ctx.fillRect(0,0,960,360);
 if(hero===0){
  drawNightWatch(ctx,time);
 }else if(hero===1){
  drawWorkshop(ctx);
  drawWorkshopTable(ctx,110,195,740,175);
  for(let i=0;i<3;i++)drawMonsterToy(ctx,i,500+i*85,250,false,0);
  drawFigure(ctx,1,270+p*90,250,0.9,0,false,false,p*4,{side:true,speed:p<1?55:0,phase:p*2.6});caption(ctx,"Pip saves the toys nobody else wanted");
 }else{
  drawWhimsicalLibrary(ctx,p*4);ctx.fillStyle="#574071";ctx.fillRect(420,170,115,155);ctx.fillStyle="#b9a4d7";ctx.fillRect(450,200,55,95);
  drawFigure(ctx,2,220+p*60,250,0.9,0,false,false,p*4);caption(ctx,"A whisper leads Wisp down a forgotten aisle");
 }
}
/** Each reward is a new composition; finished tasks are never re-enacted. */
export function drawConclusion(ctx:CanvasRenderingContext2D,hero:HeroId,chapter:number,time:number){
 const p=Math.min(1,time/4);ctx.fillStyle=[['#153e40','#27213c','#213950'],['#49352c','#15373c','#263846'],['#302348','#414268','#11132d']][hero]![chapter]!;ctx.fillRect(0,0,960,360);
 drawEnvironment(ctx,chapterEnvironment(hero,chapter));
 caption(ctx,TITLES[hero][chapter]!);
 if(hero===0){
  if(chapter===0){ctx.fillStyle="#ffd675";for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(480+Math.cos(i*1.25)*65,180+Math.sin(i*1.25)*55,9,0,Math.PI*2);ctx.fill();}}
  else if(chapter===1)for(let i=0;i<5;i++){ctx.fillStyle="#625371";ctx.fillRect(360+i*95,140,55,155);ctx.fillStyle="#ffdc89";ctx.fillRect(375+i*95,165,25,45);}
  else{ctx.fillStyle="#b9bd96";for(let i=0;i<7;i++)ctx.fillRect(80+i*125,250-(i%2)*35,80,110);ctx.fillStyle="#ffe19c";ctx.fillRect(630,105,115,185);}
 }else if(hero===1){
  if(chapter===0){drawWorkshop(ctx);caption(ctx,"The workshop is restored!");for(let i=0;i<6;i++)drawMonsterToy(ctx,i,380+i*75,260,true,p);}
  else if(chapter===1){ctx.strokeStyle="#a2f7b7";ctx.lineWidth=8;ctx.strokeRect(425,120,280,170);ctx.fillStyle="#8ae4cc";ctx.beginPath();ctx.arc(565,205,52,0,Math.PI*2);ctx.fill();caption(ctx,"The prototype powers the workshop");}
  else {ctx.fillStyle="#4d5c62";ctx.fillRect(400,90,400,220);ctx.fillStyle="#153b32";ctx.fillRect(445,120,310,145);ctx.fillStyle="#91e6ac";ctx.font="bold 30px sans-serif";ctx.fillText("MACHINE OFF",595,200);}
 }else{
  if(chapter===0){ctx.fillStyle="#bda275";ctx.fillRect(520,210,180,16);ctx.fillStyle="#fff0cb";ctx.fillRect(555,150-p*25,90,55);}
  else if(chapter===1){for(let i=0;i<3;i++){ctx.fillStyle="#c3e9e7";ctx.beginPath();ctx.ellipse(440+i*140,210,44,85,0,0,Math.PI*2);ctx.fill();}ctx.strokeStyle="#ffdc94";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(430,210);ctx.lineTo(790,135);ctx.stroke();}
  else {ctx.strokeStyle="#e9c5ff";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(400,230);ctx.lineTo(570,105);ctx.lineTo(760,200);ctx.lineTo(530,280);ctx.stroke();for(let i=0;i<30;i++){ctx.fillStyle="#f4d8ff";ctx.fillRect(340+(i*79)%510,75+(i*43)%240,3,3);}}
 }
 drawFigure(ctx,hero,hero===0&&chapter===0?300:240,255,1,0,false,false,p*4);
}
