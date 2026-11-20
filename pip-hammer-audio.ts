import type { Sound } from "./audio";
import type { HeroId } from "./solo-story";

/** Impacts follow the profile approach and the six stopped repair swings used by the art. */
export function hammerImpactTimes(chapter: number): number[] {
  if (chapter !== 0) return [];
  const count = 6;
  return Array.from({length: count}, (_, i) => 1.4 + i * (5.6 / count) + (i > 0 ? 0.25 : 0) + ((5.6 / count) - (i > 0 ? 0.25 : 0)) / 2);
}
export function playHammerCues(sound: Sound, hero: HeroId, chapter: number, complete: boolean, previous: number, time: number) {
  if (hero !== 1 || complete) return;
  for (const impact of hammerImpactTimes(chapter)) {
    if (impact <= previous || impact > time) continue;
    sound.sample?.("wood", 0.75);
  }
}

/** One cheer per newly repaired toy, never on redraws, pauses or other objectives. */
export function playToyRepairCheer(sound:Sound,hero:HeroId,stage:number,before:number,after:number){
 if(hero===1 && stage===0 && after>before)sound.sample?.("cheer",0.55);
}
/** Story repairs and the reward have one-shot cues, not a loop while reading. */
export function playToyStoryCheers(sound:Sound,hero:HeroId,chapter:number,complete:boolean,previous:number,time:number){
 if(hero!==1 || chapter!==0)return;
 const times=complete?[0.2]:hammerImpactTimes(chapter).map(impact=>impact+0.12);
 for(const cue of times)if(previous<cue && time>=cue)sound.sample?.("cheer",0.5);
}
