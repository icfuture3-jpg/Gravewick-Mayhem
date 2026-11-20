import {CIRCUIT,MIRROR_ANGLES,MACHINE_LOCKS,SKY_STARS} from "./chapter-challenges";
import { expect, it } from "vitest";
import { createMini, stepMini, miniBonus, miniPoint, miniObjective, HOME, sparkControl, bookPose, REPAIR_PARTS, type MiniInput, type MiniState } from "./mini-game";
import { miniChapter } from "./mini-backstory";
const idle: MiniInput = {x: 0, y: 0, aimX: 480, aimY: 200};
const tick = (s: MiniState, frames: number) => {for (let i = 0; i < frames; i++) stepMini(s, idle, 0.05);};
const at = (s: MiniState, p: {x: number; y: number}) => {s.px = p.x; s.py = p.y; stepMini(s, idle, 0.05);};

it("Grimble catches falling shards on contact, without followers or HOME delivery", () => {
 const s=createMini(0),shard=s.sparks[0]!;
 s.px=shard.x;s.py=250;shard.fallY=200;
 stepMini(s,idle,0.05);expect(s.progress).toBe(0);
 tick(s,44);expect(shard.taken).toBe(true);expect(shard.following).toBe(false);expect(s.progress).toBe(1);
 at(s,HOME);expect(s.progress).toBe(1);
 expect(miniObjective(s)).toContain("Press 2");
});
it("missed shards fall again without resetting caught shards",()=>{
 const s=createMini(0),shard=s.sparks[0]!;s.sparks[1]!.taken=true;s.progress=1;
 shard.fallY=449;s.shardTime=2;s.px=900;s.py=400;tick(s,1);
 expect(shard.fallY).toBe(65);expect(s.progress).toBe(1);expect(s.sparks[1]!.taken).toBe(true);
});
it("Pip must hit the highlighted broken part; wrong hits are safe and cannot skip repairs", () => {
  const s = createMini(1);
  stepMini(s, {...idle, action: true, aimX: REPAIR_PARTS[1].x, aimY: REPAIR_PARTS[1].y}, 0.05);
  expect(s.part).toBe(0); expect(s.progress).toBe(0); expect(s.message).toContain("no penalty");
  tick(s, 6);
  stepMini(s, {...idle, action: true, aimX: REPAIR_PARTS[0].x, aimY: REPAIR_PARTS[0].y}, 0.05);
  expect(s.part).toBe(1); expect(s.progress).toBe(0);
  stepMini(s, {...idle, action: true, aimX: REPAIR_PARTS[1].x, aimY: REPAIR_PARTS[1].y}, 0.01);
  expect(s.part).toBe(1); // cannot claim another hit before the mallet finishes
});
it("Wisp carries one page at a time and restores it only at the book", () => {
  const s = createMini(2);
  at(s, s.pages[0]!); expect(s.carrying).toBe(0); expect(s.progress).toBe(0);
  expect(miniObjective(s)).toContain("Return to the glowing BOOK");
  at(s, s.pages[1]!); expect(s.pages[1]!.taken).toBe(false);
  at(s, HOME); expect(s.carrying).toBeNull(); expect(s.progress).toBe(1);
  at(s, HOME); expect(s.progress).toBe(1);
});
it.each([0, 2] as const)("hero %i can click to walk, keyboard overrides destination, bounds stay safe", (hero) => {
  const s = createMini(hero);
  stepMini(s, {...idle, moveTo: true, aimX: 700, aimY: 400}, 0.05);
  expect(s.px).toBeGreaterThan(HOME.x); tick(s, 60);
  expect(s.px).toBeCloseTo(700); expect(s.destination).toBeNull();
  stepMini(s, {...idle, moveTo: true, aimX: 900}, 0.05);
  stepMini(s, {...idle, x: -1}, 0.05); expect(s.destination).toBeNull();
  for (let i = 0; i < 200; i++) stepMini(s, {...idle, x: -1, y: -1}, 0.05);
  expect(s.px).toBeGreaterThanOrEqual(35); expect(s.py).toBeGreaterThanOrEqual(105);
});
it.each([0, 1, 2] as const)("hero %i has no countdown, cannot earn an early bonus, and restart is fresh", (hero) => {
  const s = createMini(hero); tick(s, 3000);
  expect(s.status).toBe("playing"); expect(miniBonus(s)).toBe(0);
  const fresh = createMini(hero); expect(fresh).toMatchObject({progress: 0, carrying: null, part: 0, elapsed: 0, destination: null});
});
it.each([0, 1, 2] as const)("hero %i completes all three story chapters with matching memories and freezes after winning", (hero) => {
  for (let stage = 0; stage < 3; stage++) {
    const s = createMini(hero, stage), lore = miniChapter(hero, stage);
    expect(lore.memories).toHaveLength(s.goal);
    if (hero === 0) for (const spark of s.sparks) {at(s, spark); if(stage===0) {spark.fallY=s.py;s.shardTime=2;stepMini(s,idle,0.05);} else stepMini(s,{...idle,action:true},0.05); expect(s.message).toContain(lore.memories[s.progress - 1]!);}
    else if(hero===1 && stage===1) for(const piece of CIRCUIT)stepMini(s,{...idle,interact:piece},0.05);
    else if(hero===1 && stage===2) for(const lock of MACHINE_LOCKS){s.tiny=6;at(s,lock);stepMini(s,{...idle,action:true},0.05);}
    else if(hero===2 && stage===1) for(let i=0;i<3;i++)for(let t=0;t<MIRROR_ANGLES[i]!;t++)stepMini(s,{...idle,interact:i},0.05);
    else if(hero===2 && stage===2) for(const star of SKY_STARS){stepMini(s,{...idle,action:true,aimX:star.x,aimY:star.y},0.05);tick(s,15);}
    else if (hero === 1) for (let toy = 0; toy < 6; toy++) {
      for (const p of REPAIR_PARTS) {stepMini(s, {...idle, action: true, aimX: p.x, aimY: p.y}, 0.05); tick(s, 6);}
      expect(s.progress).toBe(toy + 1); expect(s.message).toBe(lore.memories[toy]);
    }
    else for (const p of s.pages) {at(s, p); at(s, HOME); expect(s.message).toBe(lore.memories[s.progress - 1]);}
    expect(s.status).toBe("won"); expect(miniBonus(s)).toBeGreaterThan(500);
    const snapshot = structuredClone(s); tick(s, 40);
    expect({...s, bookArrival: snapshot.bookArrival,celebrationTime:snapshot.celebrationTime}).toEqual(snapshot);
  }
});
it("maps mouse input through letterboxing without changing the playfield hit areas", () => {
  expect(miniPoint({left: 0, top: 0, width: 1280, height: 480}, 160, 0)).toEqual({x: 0, y: 0});
  expect(miniPoint({left: 0, top: 0, width: 1280, height: 480}, 1120, 480)).toEqual({x: 960, y: 480});
  expect(miniPoint({left: 20, top: 50, width: 960, height: 600}, 500, 350)).toEqual({x: 480, y: 240});
});

it("clicking the book or Return button directs Wisp home and restores her carried page", () => {
  for (const command of [{moveTo: true, aimX: HOME.x, aimY: HOME.y + 40}, {returnToBook: true}]) {
    const s = createMini(2); at(s, s.pages[0]!);
    stepMini(s, {...idle, x: 1, ...command}, 0.05);
    expect(s.destination).toEqual(HOME);
    tick(s, 60); expect(s.progress).toBe(1); expect(s.carrying).toBeNull();
  }
});
it("the restored book glows and floats to Wisp only after all pages are returned", () => {
  const s = createMini(2);
  expect(bookPose(s)).toMatchObject(HOME);
  for (const p of s.pages) {at(s, p); at(s, HOME);}
  const start = bookPose(s); tick(s, 16); const mid = bookPose(s); tick(s, 40);
  expect(mid.y).toBeLessThan(start.y);
  expect(bookPose(s)).toMatchObject({x: s.px + 55, y: s.py - 65, glow: 32});
  expect(s.progress).toBe(3); expect(s.bookArrival).toBe(1);
});

it("Lantern Sweep reveals beyond passive light; Portal respects 260px, cooldown and brings followers", () => {
  const s=createMini(0), spark=s.sparks[0]!;
  s.px=spark.x+160;s.py=spark.y;
  stepMini(s,{...idle,action:true},0.05);
  expect(spark.found).toBe(true);expect(s.effect?.move).toBe("sweep");
  spark.following=true;
  const x=s.px;stepMini(s,{...idle,skill:true,aimX:900,aimY:s.py},0.05);
  expect(s.px-x).toBe(260);expect(s.skillCd).toBe(9);expect(spark.x).toBe(s.px);
  stepMini(s,{...idle,skill:true,aimX:35,aimY:s.py},0.05);
  expect(s.px).toBe(x+260);
});
it("Gadget Pouch randomly selects a real gadget and repairs only the highlighted part after landing", () => {
  const s=createMini(1), p=REPAIR_PARTS[0]!;
  stepMini(s,{...idle,skill:true,aimX:p.x,aimY:p.y},0.05);
  expect(s.skillCd).toBe(5);expect(s.part).toBe(0);
  expect(s.projectile?.gadget).toBeGreaterThanOrEqual(0);expect(s.projectile?.gadget).toBeLessThan(3);
  tick(s,13);expect(s.part).toBe(1);expect(s.projectile).toBeNull();
  stepMini(s,{...idle,skill:true},0.05);expect(s.projectile).toBeNull();
});
it("Wisp personal memory ignores J/K/L and restores pages only by walking",()=>{
 const s=createMini(2),page=s.pages[1]!;s.px=300;s.py=300;
 for(let i=0;i<30;i++)stepMini(s,{...idle,action:true,skill:true,ultimate:true,aimX:page.x,aimY:page.y},0.05);
 expect(s.projectile).toBeNull();expect(s.illusions).toHaveLength(0);expect(s.carrying).toBeNull();expect(s.progress).toBe(0);expect(s.ultimateCd).toBe(0);
 at(s,page);at(s,HOME);expect(s.progress).toBe(1);
});
it("Grimoire actions cannot alter a completed mini-game", () => {
  const s=createMini(1);s.status="won";const before=structuredClone(s);
  stepMini(s,{...idle,action:true,skill:true},0.05);expect({...s,celebrationTime:before.celebrationTime}).toEqual(before);
});

it.each([0,1] as const)("hero %i can activate L immediately, cannot spam, and restarts ready", hero => {
  const s=createMini(hero);stepMini(s,{...idle,ultimate:true},0.05);
  expect(s.ultimateCd).toBe(12);expect(s.message).toContain('activated');
  stepMini(s,{...idle,ultimate:true},0.05);expect(s.message).toContain('recharges');
  expect(s.ultimateCd).toBeCloseTo(11.95);expect(createMini(hero).ultimateCd).toBe(0);
});
it("Hidden Light reveals every spark, not just nearby ones",()=>{
  const s=createMini(0);stepMini(s,{...idle,ultimate:true},0.05);
  expect(s.sparks.every(p=>p.found)).toBe(true);expect(s.progress).toBe(0);
  expect(s.effect?.move).toBe('light');
});
it("Tiny Trouble lasts six seconds and speeds up the repair mallet",()=>{
  const s=createMini(1);stepMini(s,{...idle,ultimate:true},0.05);expect(s.tiny).toBe(6);
  const p=REPAIR_PARTS[0]!;stepMini(s,{...idle,action:true,aimX:p.x,aimY:p.y},0.05);
  expect(s.swing).toBe(0.14);tick(s,121);expect(s.tiny).toBe(0);
});
it("Wisp still uses illusions in campaign mirror objectives",()=>{
 const s=createMini(2,1);stepMini(s,{...idle,ultimate:true},0.05);
 expect(s.illusions).toHaveLength(2);tick(s,60);expect(s.progress).toBeGreaterThan(0);
});
it("L cannot change progress or create copies after completion",()=>{
  for(const hero of [0,1,2] as const){const s=createMini(hero);s.status='won';stepMini(s,{...idle,ultimate:true},0.05);expect(s.ultimateCd).toBe(0);expect(s.illusions).toHaveLength(0);}
});

it("Catch shard controls remain usable until caught and restart resets every shard",()=>{
 const s=createMini(0);s.sparks[0]!.taken=true;s.progress=1;expect(sparkControl(s.sparks[1]!,1)).toEqual({label:"Catch shard 2",rescued:false});
 stepMini(s,{...idle,findSpark:1},0.05);tick(s,180);
 expect(s.sparks[1]!.taken).toBe(true);
 expect(sparkControl(s.sparks[1]!,1)).toEqual({label:"Shard 2 · CAUGHT ✓",rescued:true});
 expect(createMini(0).sparks.every(shard=>!shard.taken)).toBe(true);
});
it("crypt lanterns require a nearby sweep, never escorting HOME",()=>{
  const s=createMini(0,1);at(s,s.sparks[0]!);at(s,HOME);expect(s.progress).toBe(0);
  at(s,s.sparks[0]!);stepMini(s,{...idle,action:true},0.05);
  expect(s.progress).toBe(1);expect(s.sparks[0]!.following).toBe(false);
});
it("the star gate requires numbered seals in order without resetting a wrong attempt",()=>{
  const s=createMini(0,2);at(s,s.sparks[1]!);stepMini(s,{...idle,action:true},0.05);expect(s.progress).toBe(0);
  for(const seal of s.sparks){at(s,seal);stepMini(s,{...idle,action:true},0.05);}
  expect(s.status).toBe("won");
});

it("wood knocks count actual Pip swings, not frame redraws, gadgets or blocked cooldown inputs",()=>{
 const s=createMini(1),p=REPAIR_PARTS[0]!;
 stepMini(s,{...idle,action:true,aimX:p.x,aimY:p.y},0.05);expect(s.hammerHits).toBe(1);
 stepMini(s,{...idle,action:true},0.05);expect(s.hammerHits).toBe(1);
 tick(s,8);expect(s.hammerHits).toBe(1);
 stepMini(s,{...idle,action:true},0.05);expect(s.hammerHits).toBe(2);
 expect(createMini(1).hammerHits).toBe(0);
});

it("the last gadget repair finishes before a simultaneous hammer input can reset the last toy",()=>{
 const s=createMini(1);s.progress=5;s.part=2;
 const last=REPAIR_PARTS[2];
 s.projectile={x:400,y:250,tx:last.x,ty:last.y,age:0.59,gadget:0,move:"gadget",repairToy:5,repairPart:2};
 stepMini(s,{...idle,action:true,aimX:last.x,aimY:last.y},0.05);
 expect(s).toMatchObject({status:"won",progress:6,part:0,hammerHits:0,message:miniChapter(1,0).memories[5]});
 expect(s.projectile).toBeNull();
 const completed=structuredClone(s);stepMini(s,{...idle,action:true,skill:true},0.05);expect({...s,celebrationTime:completed.celebrationTime}).toEqual(completed);
});
it("a gadget launched at an earlier toy cannot repair or interfere with the last toy",()=>{
 const s=createMini(1);s.progress=4;s.part=2;const p=REPAIR_PARTS[2];
 stepMini(s,{...idle,skill:true,aimX:p.x,aimY:p.y},0.05);
 stepMini(s,{...idle,action:true,aimX:p.x,aimY:p.y},0.05);expect(s.progress).toBe(5);
 for(const part of REPAIR_PARTS.slice(0,2)){tick(s,6);stepMini(s,{...idle,action:true,aimX:part.x,aimY:part.y},0.05);}
 tick(s,15);expect(s).toMatchObject({progress:5,part:2,status:"playing"});
 stepMini(s,{...idle,action:true,aimX:p.x,aimY:p.y},0.05);expect(s).toMatchObject({status:"won",progress:6});
});

it("shards preview for two seconds and never descend simultaneously",()=>{
 const s=createMini(0);s.px=900;s.py=445;
 tick(s,38);expect(s.sparks.every(item=>item.fallY===65)).toBe(true);
 tick(s,10);expect(s.sparks[0]!.fallY).toBeGreaterThan(65);expect(s.sparks.slice(1).every(item=>item.fallY===65)).toBe(true);
 // A distant catch position is reachable during the preview + slow descent.
 for(let i=0;i<5;i++){stepMini(s,{...idle,findSpark:i},0.05);tick(s,180);expect(s.sparks[i]!.taken).toBe(true);}
 expect(s.status).toBe("won");
});

it("completed toys keep cheering without allowing more score or repair progress",()=>{
 const s=createMini(1);s.status="won";s.progress=6;const score=miniBonus(s);
 tick(s,20);expect(s.celebrationTime).toBeGreaterThan(0.9);expect(s.progress).toBe(6);expect(miniBonus(s)).toBe(score);
});
