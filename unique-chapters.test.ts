import {expect,it,vi} from "vitest";
import {CHALLENGES,CIRCUIT,MIRROR_ANGLES,MACHINE_LOCKS,SKY_STARS,challengeHit} from "./chapter-challenges";
import {createMini,stepMini} from "./mini-game";
import {drawMini} from "./mini-game-art";
import {drawTaleAction} from "./tale-actions";
import {drawPrologue} from "./story-tableaux";
vi.mock("./heroes",()=>({drawFigure:vi.fn()}));
vi.mock("./art",()=>({drawHero:vi.fn(),drawEnemy:vi.fn()}));
const idle={x:0,y:0,aimX:0,aimY:0};
it("all nine playable chapters have distinct objectives",()=>{expect(new Set(CHALLENGES.flat()).size).toBe(9);});
it("circuit assembly cannot be won by repeating toy hammering",()=>{
 const s=createMini(1,1);for(let i=0;i<10;i++)stepMini(s,{...idle,action:true},0.05);expect(s.progress).toBe(0);
 stepMini(s,{...idle,interact:2},0.05);expect(s.progress).toBe(0);
 for(const piece of CIRCUIT)stepMini(s,{...idle,interact:piece},0.05);
 expect(s.status).toBe("won");expect(s.hammerHits).toBe(0);
});
it("machine infiltration needs shrinking and proximity, not repeated remote hits",()=>{
 const s=createMini(1,2);stepMini(s,{...idle,action:true},0.05);expect(s.progress).toBe(0);
 for(const lock of MACHINE_LOCKS){s.px=lock.x;s.py=lock.y;stepMini(s,{...idle,action:true},0.05);expect(s.status).toBe("playing");s.tiny=6;stepMini(s,{...idle,action:true},0.05);s.tiny=0;}
 expect(s.status).toBe("won");
});
it("mirror arrows must match visible targets; page walking cannot score",()=>{
 const s=createMini(2,1);s.px=s.pages[0]!.x;s.py=s.pages[0]!.y;stepMini(s,idle,0.05);expect(s.carrying).toBeNull();
 for(let i=0;i<3;i++)for(let turn=0;turn<MIRROR_ANGLES[i]!;turn++)stepMini(s,{...idle,interact:i},0.05);
 expect(s.status).toBe("won");expect(s.aligned).toEqual([true,true,true]);
});
it("the constellation requires ordered bolt hits and never collects library pages",()=>{
 const s=createMini(2,2);
 stepMini(s,{...idle,action:true,aimX:SKY_STARS[2].x,aimY:SKY_STARS[2].y},0.05);
 for(let i=0;i<16;i++)stepMini(s,idle,0.05);expect(s.progress).toBe(0);
 for(const star of SKY_STARS){stepMini(s,{...idle,action:true,aimX:star.x,aimY:star.y},0.05);for(let i=0;i<16;i++)stepMini(s,idle,0.05);}
 expect(s.status).toBe("won");expect(s.pages.every(p=>!p.taken)).toBe(true);
 expect(challengeHit(2,2,SKY_STARS[0].x,SKY_STARS[0].y)).toBe(0);
});
function drawing(draw:(ctx:CanvasRenderingContext2D)=>void){
 const calls:unknown[]=[];
 const ctx=new Proxy({}, {get:(_obj,key)=>(...args:unknown[])=>{calls.push([key,...args]);}}) as CanvasRenderingContext2D;
 draw(ctx);return JSON.stringify(calls);
}
it("every prologue, chapter action and conclusion draws a different composition",()=>{
 const scenes:string[]=[];
 for(const hero of [0,1,2] as const){
  scenes.push(drawing(ctx=>drawPrologue(ctx,hero,3)));
  for(let chapter=0;chapter<3;chapter++)for(const complete of [false,true])scenes.push(drawing(ctx=>drawTaleAction(ctx,hero,chapter,3,complete)));
 }
 expect(new Set(scenes).size).toBe(21);
});
it("all nine playfields render different layouts and do not restart an intro after it ends",()=>{
 const scenes:string[]=[];
 for(const hero of [0,1,2] as const)for(let stage=0;stage<3;stage++)scenes.push(drawing(ctx=>drawMini(ctx,createMini(hero,stage),0,0)));
 expect(new Set(scenes).size).toBe(9);
 expect(drawing(ctx=>drawTaleAction(ctx,1,0,8))).toBe(drawing(ctx=>drawTaleAction(ctx,1,0,30)));
});
it("L stays useful in the new circuit and mirror puzzles without replaying the old mini-games",()=>{
 const pip=createMini(1,1);stepMini(pip,{...idle,ultimate:true},0.05);stepMini(pip,{...idle,action:true},0.05);
 expect(pip.progress).toBe(1);expect(pip.hammerHits).toBe(0);
 const wisp=createMini(2,1);stepMini(wisp,{...idle,ultimate:true},0.05);
 for(let i=0;i<100;i++)stepMini(wisp,idle,0.05);
 expect(wisp.progress).toBeGreaterThan(0);expect(wisp.carrying).toBeNull();
});
