import type { HeroId } from "./solo-story";
import type { MiniState } from "./mini-game";

export const CHALLENGES = [
  ["Falling star-shard catch", "Keeper lantern vigil", "Star-gate seals"],
  ["Market toy repair", "Prototype circuit assembly", "Tiny machine infiltration"],
  ["Lost library pages", "Hall of turning mirrors", "Write the sky's final page"],
] as const;
export const CIRCUIT = [0,2,1,0,1,2] as const;
export const MIRROR_ANGLES = [1,3,2] as const;
export const MACHINE_LOCKS = [{x:230,y:170},{x:420,y:165},{x:650,y:165},{x:780,y:260},{x:620,y:350},{x:310,y:345}] as const;
export const SKY_STARS = [{x:240,y:190},{x:680,y:160},{x:490,y:315}] as const;
export const MIRRORS = [{x:250,y:230},{x:480,y:200},{x:710,y:230}] as const;
export function challengeName(hero:HeroId,stage:number) {return CHALLENGES[hero][stage]!;}
export function challengeRules(hero:HeroId,stage:number):string | null {
 if(hero===1&&stage===1)return "Build the prototype's power circuit. The blueprint shows the next socket's shape. Choose the matching gear (circle), spring (zigzag) or battery (bars), then connect six sockets. No hammering and no time limit. Wrong pieces do not erase your work. L shrinks Pip; while tiny, J fits the next socket directly.";
 if(hero===1&&stage===2)return "Enter the nightmare machine: press L to shrink, click the floor or use WASD/arrows to move through the tiny service passage, then press J beside each of six locks. Locks only open while Pip is tiny. Recharge L as needed. No timer or penalty.";
 if(hero===2&&stage===1)return "Turn the three mirrors to guide the beam across the hall. Click a mirror or its Rotate button until its arrow matches the GOLD arrow beside it. Targets stay visible: nothing to memorize. Aligned mirrors lock in place. L summons two illusions to help turn the mirrors.";
 if(hero===2&&stage===2)return "Write Wisp's ending in the night sky. Aim at the next GOLD numbered star and press J (or click the star). Connect 1 → 2 → 3 with spellbook bolts to inscribe the final page. No page-fetching or trips back to BOOK.";
 return null;
}
export function chapterObjective(s:MiniState):string | null {
 if(s.hero===1&&s.stage===1)return `Socket ${Math.min(6,s.progress+1)}/6 needs ${["GEAR ○","SPRING ϟ","BATTERY ▤"][CIRCUIT[s.progress]??0]}`;
 if(s.hero===1&&s.stage===2)return s.tiny>0 ? "Tiny Trouble active: approach a red lock and press J" : "Press L to shrink into the service passage";
 if(s.hero===2&&s.stage===1)return "Rotate each mirror until its arrow matches the visible GOLD target";
 if(s.hero===2&&s.stage===2)return `Aim at GOLD star ${Math.min(3,s.progress+1)} and fire Spellbook Bolt · J`;
 return null;
}
export function challengeHit(hero:HeroId,stage:number,x:number,y:number):number | undefined {
 const points=hero===2?(stage===1?MIRRORS:stage===2?SKY_STARS:[]):hero===1&&stage===1?[{x:300,y:330},{x:480,y:330},{x:660,y:330}]:[];
 const index=points.findIndex(p=>Math.hypot(x-p.x,y-p.y)<55);
 return index<0?undefined:index;
}
