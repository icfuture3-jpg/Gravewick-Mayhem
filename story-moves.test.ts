import {expect,it} from "vitest";
import {STORY_MOVES,moveName,drawStoryMove} from "./story-moves";
import {HERO_ABILITIES} from "./hero-abilities";
it("uses the Grimoire's exact primary, skill and ultimate names in story scenes",()=>{
  for(const hero of [0,1,2] as const) {
    expect(moveName(STORY_MOVES[hero]![0]!)).toBe(HERO_ABILITIES[hero].primaryName);
    expect(moveName(STORY_MOVES[hero]![1]!)).toBe(HERO_ABILITIES[hero].skillName);
    if(hero!==2) expect(moveName(STORY_MOVES[hero]![2]!)).toBe(HERO_ABILITIES[hero].ultName);
  }
});
it("renders all signature effects without invalid geometry",()=>{
  const ctx=new Proxy({}, {get:()=> (...args:unknown[])=>{for(const a of args)if(typeof a==="number")expect(Number.isFinite(a)).toBe(true);}}) as CanvasRenderingContext2D;
  for(const move of STORY_MOVES.flat())for(const p of [0,0.5,1]) drawStoryMove(ctx,move,200,250,700,200,p);
});
