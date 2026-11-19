import {drawFigure} from "./heroes";
import {drawMonsterToy,drawWhimsicalLibrary,drawWorkshopTable} from "./tale-props";
import type {HeroId} from "./solo-story";

const TITLES=[['The lonely night watch','The keeper lights remember','A town finds its way home'],['Behind the market stall','The first engine wakes','The nightmare machine sleeps'],['Before the mirror answered','Doubt gives way to courage','An ending written in starlight']] as const;
function caption(ctx:CanvasRenderingContext2D,text:string){ctx.fillStyle="#ffe3a0";ctx.font="bold 23px Trebuchet MS";ctx.textAlign="center";ctx.fillText(text,480,45);}
/** Separate opening tableaux, not a replay of the chapter's action shot. */
export function drawPrologue(ctx:CanvasRenderingContext2D,hero:HeroId,time:number){
 const p=Math.min(1,time/5);ctx.fillStyle=['#101e31','#3c2530','#2a2347'][hero];ctx.fillRect(0,0,960,360);
 if(hero===0){
  ctx.fillStyle="#d2d7bb";ctx.beginPath();ctx.arc(760,95,40,0,Math.PI*2);ctx.fill();
  for(let i=0;i<8;i++){ctx.fillStyle="#344751";ctx.fillRect(i*130,225,60,135);}
  ctx.fillStyle="#786144";ctx.fillRect(320,280,180,14);ctx.fillRect(335,294,12,55);ctx.fillRect(470,294,12,55);
  drawFigure(ctx,0,410,245,0.8,0,false,false,p*4);caption(ctx,"Grimble keeps watch while the town sleeps");
 }else if(hero===1){
  for(let i=0;i<7;i++){ctx.fillStyle=i%2?'#9b5747':'#c69a66';ctx.fillRect(110+i*105,90,105,45);}
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
 caption(ctx,TITLES[hero][chapter]!);
 if(hero===0){
  if(chapter===0){ctx.fillStyle="#ffd675";for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(480+Math.cos(i*1.25)*65,180+Math.sin(i*1.25)*55,9,0,Math.PI*2);ctx.fill();}}
  else if(chapter===1)for(let i=0;i<5;i++){ctx.fillStyle="#625371";ctx.fillRect(360+i*95,140,55,155);ctx.fillStyle="#ffdc89";ctx.fillRect(375+i*95,165,25,45);}
  else{ctx.fillStyle="#b9bd96";for(let i=0;i<7;i++)ctx.fillRect(80+i*125,250-(i%2)*35,80,110);ctx.fillStyle="#ffe19c";ctx.fillRect(630,105,115,185);}
 }else if(hero===1){
  if(chapter===0){for(let i=0;i<6;i++)drawMonsterToy(ctx,i,380+i*75,260,true,p);}
  else if(chapter===1){ctx.strokeStyle="#a2f7b7";ctx.lineWidth=8;ctx.strokeRect(425,120,280,170);ctx.fillStyle="#8ae4cc";ctx.beginPath();ctx.arc(565,205,52,0,Math.PI*2);ctx.fill();caption(ctx,"The prototype powers the workshop");}
  else {ctx.fillStyle="#4d5c62";ctx.fillRect(400,90,400,220);ctx.fillStyle="#153b32";ctx.fillRect(445,120,310,145);ctx.fillStyle="#91e6ac";ctx.font="bold 30px sans-serif";ctx.fillText("MACHINE OFF",595,200);}
 }else{
  if(chapter===0){ctx.fillStyle="#bda275";ctx.fillRect(520,210,180,16);ctx.fillStyle="#fff0cb";ctx.fillRect(555,150-p*25,90,55);}
  else if(chapter===1){for(let i=0;i<3;i++){ctx.fillStyle="#c3e9e7";ctx.beginPath();ctx.ellipse(440+i*140,210,44,85,0,0,Math.PI*2);ctx.fill();}ctx.strokeStyle="#ffdc94";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(430,210);ctx.lineTo(790,135);ctx.stroke();}
  else {ctx.strokeStyle="#e9c5ff";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(400,230);ctx.lineTo(570,105);ctx.lineTo(760,200);ctx.lineTo(530,280);ctx.stroke();for(let i=0;i<30;i++){ctx.fillStyle="#f4d8ff";ctx.fillRect(340+(i*79)%510,75+(i*43)%240,3,3);}}
 }
 drawFigure(ctx,hero,hero===0&&chapter===0?300:240,255,1,0,false,false,p*4);
}
