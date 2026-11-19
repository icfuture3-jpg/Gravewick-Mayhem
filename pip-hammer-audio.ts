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
