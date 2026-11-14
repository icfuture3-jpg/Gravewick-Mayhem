import type { Scene, Action } from "./movie";
import { HERO_ABILITIES } from "./hero-abilities";
export type HeroId = 0 | 1 | 2;
export const SOLO_STORIES = [
  {title: "Keeper of the Lost Light", game: "Lantern Hunt", intro: "Before he became a mentor, Grimble was a lonely keeper. One night his lantern caught a fallen star—and showed him the souls trapped between worlds.",
    chapters: ["The first light flickers in his old backyard. Grimble must find its lost sparks before the shadows do.", "Beneath the crypts, he finds the names of keepers who vanished. Their lanterns still wait for someone to carry them home.", "At the citadel, the stolen star burns behind a sealed gate. Grimble raises his lantern: no one gets left in the dark."],
    ending: "Grimble frees the trapped lights. He returns to Gravewick not as a lonely keeper, but as a mentor—with a lantern bright enough for everyone."},
  {title: "The Smallest Big Hero", game: "Gadget Gallery", intro: "Pip grew up fixing broken toys behind Gravewick's market. Everyone called his inventions accidents—until one tiny gadget saved a whole street.",
    chapters: ["The market's spare parts have come alive! Pip tests his pouch of gadgets and sets out to prove that small can be mighty.", "In the crypt workshop, Pip finds his first failed invention. He rebuilds it, remembering that every mistake taught him something.", "The citadel's machines are too large to fight head-on. Pip grins, shrinks, and slips into the one gap nobody thought to guard."],
    ending: "Pip shuts down the nightmare machine. The town cheers for its smallest inventor. He keeps his very first broken toy—to remember where big ideas begin."},
  {title: "Beyond the Mirror", game: "Mirror Memory", intro: "Wisp discovered her spellbook in a library mirror. Its pages reflected who she might become—but only if she found the courage to step beyond her own shadow.",
    chapters: ["The library mirrors whisper a pattern. Wisp follows their lights, learning to tell a true memory from a clever illusion.", "Deep in the crypts, reflections repeat her old doubts. Wisp answers with two brave mirror doubles: fear does not get the last word.", "At the citadel, her darkest reflection guards the book's final page. Wisp stops hiding and writes her own ending."],
    ending: "The mirror shatters into harmless starlight. Wisp closes her spellbook, smiling. Her cleverest magic was never disappearing—it was choosing to be seen."},
] as const;

export function soloScenes(hero: HeroId, stage: number, moment: "arrival" | "boss" | "turn" | "win"): Scene[] {
  const story = SOLO_STORIES[hero];
  const action: Action = hero === 0 ? "portal" : hero === 1 ? "gadget" : "illusion";
  const scene = (caption: string, text: string, effect: Action = action): Scene => ({
    stage, soloHero: hero, action: effect, caption, text, who: hero,
    actors: [{idx: hero, x: 480, y: 270, s: 1.7, face: 1}],
    duration: Math.max(4, text.length / 32 + 0.6), tint: "rgba(18,6,42,0.25)", shake: effect === "gadget",
  });
  if (moment === "arrival") return [
    ...(stage === 0 ? [scene(story.title, story.intro)] : []),
    scene(`Chapter ${stage + 1} · ${HERO_ABILITIES[hero].name}`, story.chapters[stage]!),
  ];
  if (moment === "boss") return [scene("One hero. One showdown.", `${HERO_ABILITIES[hero].name} stands alone before the guardian. This is my story. Let's finish this!`)];
  if (moment === "turn") return [scene("A hero finds a way", ["Grimble opens a portal behind the guardian and floods the darkness with golden light!", "Pip shrinks under the attack and sends a bouncing gadget straight into the guardian's path!", "Wisp vanishes. Her mirror doubles draw the guardian away as her spellbook charges!"][hero]!)];
  return [scene(stage === 2 ? `${HERO_ABILITIES[hero].name}'s story complete` : "Chapter complete!", stage === 2 ? story.ending : `${HERO_ABILITIES[hero].name} wins the battle. A piece of the past is restored—but the next chapter still waits.`, "victory")];
}
