import type { Sound } from "./audio";
import type { HeroId } from "./solo-story";

/** Impact is halfway through each of the same seven-second repair swings used by the art. */
export function hammerImpactTimes(chapter: number): number[] {
  if (chapter > 1) return [];
  const count = chapter === 0 ? 6 : 4;
  return Array.from({length: count}, (_, i) => (i + 0.5) * 7 / count);
}
export function playHammerCues(sound: Sound, hero: HeroId, chapter: number, complete: boolean, previous: number, time: number) {
  if (hero !== 1 || complete) return;
  for (const impact of hammerImpactTimes(chapter)) {
    if (impact <= previous || impact > time) continue;
    // Short woody knock with a higher mallet click, not a sustained buzz or explosion.
    sound.tone(190, "sine", 0.075, 0.13, -100);
    sound.tone(780, "triangle", 0.025, 0.045, -300);
  }
}
