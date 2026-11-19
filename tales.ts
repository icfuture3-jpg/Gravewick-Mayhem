import { SOLO_STORIES, soloScenes, type HeroId } from "./solo-story";
import { miniChapter } from "./mini-backstory";
import type { Scene } from "./movie";

export interface Tale {hero: HeroId; chapter: number; phase: "intro" | "game" | "outro" | "complete"; score: number}
export const startTale = (hero: HeroId): Tale => ({hero, chapter: 0, phase: "intro", score: 0});
/** Tales never transitions into the brawler or writes to its scoreboard. */
export function advanceTale(tale: Tale, event: "continue" | "win", bonus = 0): Tale {
  if (tale.phase === "intro" && event === "continue") return {...tale, phase: "game"};
  if (tale.phase === "game" && event === "win") return {...tale, phase: "outro", score: tale.score + Math.max(0, Math.min(1100, Number.isFinite(bonus) ? Math.floor(bonus) : 0))};
  if (tale.phase === "outro" && event === "continue") return {...tale, phase: "complete"};
  return tale;
}
export function taleScenes(tale: Tale): Scene[] {
  if (tale.phase === "intro") return soloScenes(tale.hero, tale.chapter, "arrival");
  const scene = soloScenes(tale.hero, tale.chapter, "win")[0]!;
  return [{...scene, caption: tale.chapter === 2 ? `${SOLO_STORIES[tale.hero].title} · The end` : "Memory restored",
    text: miniChapter(tale.hero, tale.chapter).ending, action: "victory"}];
}
