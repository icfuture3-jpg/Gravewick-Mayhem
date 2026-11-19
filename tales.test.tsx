import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { startTale, advanceTale, taleScenes } from "./tales";
import { StorySelect } from "./story-select";
import { Tales } from "./tales-view";
import { GameHud } from "./hud";
import { SOLO_STORIES } from "./solo-story";
import { miniChapter } from "./mini-backstory";

it.each([0, 1, 2] as const)("runs hero %i's three mini-game chapters without any brawler phase", (hero) => {
  let tale = startTale(hero);
  expect(taleScenes(tale)[0]!.soloHero).toBe(hero);
  for (let chapter = 0; chapter < 3; chapter++) {
    expect(tale).toMatchObject({hero, chapter, phase: "intro"});
    expect(taleScenes(tale).every((s) => s.soloHero === hero)).toBe(true);
    tale = advanceTale(tale, "continue");
    expect(tale.phase).toBe("game");
    expect(advanceTale(tale, "continue")).toBe(tale); // cannot skip a challenge into combat
    tale = advanceTale(tale, "win", 800);
    expect(tale.phase).toBe("outro");
    expect(tale.score).toBe((chapter + 1) * 800);
    expect(taleScenes(tale)[0]!.text).toBe(miniChapter(hero, chapter).ending);
    expect(advanceTale(tale, "win", 800)).toBe(tale); // no duplicate score claim
    tale = advanceTale(tale, "continue");
  }
  expect(tale).toMatchObject({hero, chapter: 2, phase: "complete", score: 2400});
  expect(advanceTale(tale, "continue")).toBe(tale);
  expect(startTale(hero)).toMatchObject({chapter: 0, score: 0, phase: "intro"});
});

it("keeps Mayhem on the main menu without a Gravewick Tales button", () => {
  const board = {submit: vi.fn(), view: vi.fn(), listen: vi.fn()};
  const html = renderToStaticMarkup(<GameHud board={board} />);
  expect(html).toContain("Play Gravewick Mayhem");
  expect(html).not.toContain("Practice arena");
  expect(html).not.toContain("Start practice");
  expect(html).not.toContain("Refill health");
  expect(html).not.toContain(">Gravewick Tales</button>");
  expect(html).not.toContain("Hero stories &amp; mini-games");
  expect(board.submit).not.toHaveBeenCalled();
});

it("offers all three personal tales on clickable characters without a team-campaign launch inside Tales", () => {
  const html = renderToStaticMarkup(<StorySelect onStory={() => {}} onBack={() => {}} />);
  expect(html).toContain("Gravewick Tales");
  for (const name of ["Grimble", "Pip", "Wisp"]) {
    expect(html).toContain(`aria-label="Select ${name}"`);
    expect(html).toContain(`Play ${name}&#x27;s tale`);
  }
  expect(html).not.toContain("Team story");
  expect(html).not.toContain("Continue to battle");
});

it.each([0, 1, 2] as const)("starts hero %i with their personal backstory and a Tales-only exit", (hero) => {
  const html = renderToStaticMarkup(<Tales hero={hero} onExit={() => {}} />);
  expect(html).toContain("Gravewick Tales");
  expect(html).toContain(SOLO_STORIES[hero].title);
  expect(html).toContain("Back to Gravewick Tales");
  expect(html).not.toContain("Skip to battle");
});
