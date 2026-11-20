import {drawPipHammer} from "./pip-hammer";
import {drawEnvironment} from "./environments";
import { workshopTable } from "./sprites";
import { drawEnemy, type EnemyKind } from "./art";

const TOY_MONSTERS: readonly EnemyKind[] = ["clown", "bat", "ghoul", "slime", "boogeyman", "nergal"];
/** Miniatures of the actual enemies, resting on fixed podiums, without wheels or speech labels. */
export function drawMonsterToy(ctx: CanvasRenderingContext2D, index: number, x: number, y: number, fixed: boolean, time: number) {
  ctx.save();
  // A tiny solid podium stays planted while the repaired toy hops above it.
  ctx.fillStyle="#685077";ctx.fillRect(x-30,y+10,60,14);
  ctx.fillStyle="#cbb17b";ctx.beginPath();ctx.ellipse(x,y+10,30,9,0,0,Math.PI*2);ctx.fill();
  ctx.translate(x, y-(fixed?Math.abs(Math.sin(time*5+index))*12:0));
  ctx.rotate(fixed ? Math.sin(time * 4 + index) * 0.05 : -0.12);
  ctx.fillStyle = "#b8824f"; ctx.strokeStyle = "#322139"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-24, -4, 48, 8, 4); ctx.fill(); ctx.stroke();
  const kind = TOY_MONSTERS[index % TOY_MONSTERS.length]!;
  drawEnemy(ctx, kind, 0, -12, kind === "boogeyman" || kind === "nergal" ? 20 : 16, fixed ? time : 0, Math.PI, false, false, 0);
  if (fixed) {ctx.fillStyle="#ffe492";ctx.beginPath();ctx.arc(22,-48,3,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}

/** A short bone-handled ham mallet; pivot stays in Pip's hand for the entire strike. */
export function drawMeatMallet(ctx: CanvasRenderingContext2D, handX: number, handY: number, swing: number) {
  drawPipHammer(ctx,handX,handY,swing);
}

/** Crooked bookcases, jewel-coloured books, floating candles and a moonlit window. */
export function drawWhimsicalLibrary(ctx: CanvasRenderingContext2D, time: number) {
  if(drawEnvironment(ctx,"library"))return;
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

/** The furniture is a lit 3D bake, like the character sprites, not a flat rectangle. */
export function drawWorkshopTable(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  if (workshopTable) ctx.drawImage(workshopTable,x,y,width,height);
}

/** Shelves, pegboard tools, spare parts, drawers and a window make the room a workshop. */
export function drawWorkshop(ctx: CanvasRenderingContext2D) {
  if(drawEnvironment(ctx,"workshop"))return;
  ctx.fillStyle="#302633";ctx.fillRect(0,0,960,360);
  ctx.fillStyle="#604635";ctx.fillRect(0,290,960,70);
  ctx.strokeStyle="#846047";ctx.lineWidth=2;
  for(let x=0;x<960;x+=80){ctx.beginPath();ctx.moveTo(x,290);ctx.lineTo(x-90,360);ctx.stroke();}
  ctx.fillStyle="#765638";ctx.beginPath();ctx.roundRect(350,65,260,120,8);ctx.fill();
  for(let x=365;x<600;x+=20)for(let y=80;y<180;y+=20){ctx.fillStyle="#392e2b";ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill();}
  for(let i=0;i<5;i++){
    const x=375+i*48;ctx.strokeStyle="#d7c1a0";ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x,100);ctx.lineTo(x,150);ctx.stroke();
    ctx.fillStyle=i%2?"#a7b85d":"#bf7856";ctx.fillRect(x-10,92,20,12);
  }
  for(const x of [50,700]) {
    ctx.fillStyle="#44323a";ctx.fillRect(x,80,200,180);
    for(let row=0;row<3;row++){
      for(let i=0;i<4;i++){ctx.fillStyle=["#a7b85d","#c89c68","#7bafaa","#b97587"][i]!;ctx.beginPath();ctx.roundRect(x+12+i*45,100+row*50,30,30,5);ctx.fill();}
      ctx.fillStyle="#a57549";ctx.fillRect(x,135+row*50,200,10);
    }
  }
  ctx.fillStyle="#8d6544";ctx.fillRect(65,260,190,45);
  for(let i=0;i<3;i++){ctx.strokeStyle="#382d29";ctx.strokeRect(70+i*60,265,55,35);ctx.fillStyle="#d5b36b";ctx.fillRect(90+i*60,278,14,5);}
  ctx.fillStyle="#c8a96c";ctx.font="bold 19px Trebuchet MS";ctx.textAlign="center";ctx.fillText("PIP'S WORKSHOP",480,35);
}
