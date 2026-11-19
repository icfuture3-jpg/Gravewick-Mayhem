import type { Sound } from "./audio";
import type { HeroId } from "./solo-story";

/** Impact is halfway through each of the same seven-second repair swings used by the art. */
export function hammerImpactTimes(chapter: number): number[] {
  if (chapter !== 0) return [];
  const count = 6;
  return Array.from({length: count}, (_, i) => (i + 0.5) * 7 / count);
}
export function playHammerCues(sound: Sound, hero: HeroId, chapter: number, complete: boolean, previous: number, time: number) {
  if (hero !== 1 || complete) return;
  for (const impact of hammerImpactTimes(chapter)) {
    if (impact <= previous || impact > time) continue;
    sound.sample?.("wood", 0.75);
  }
}
