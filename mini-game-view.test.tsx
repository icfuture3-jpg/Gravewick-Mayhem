import {expect, it, vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {MiniGame} from "./mini-game-view";
import {drawMini} from "./mini-game-art";
import {HERO_ABILITIES} from "./hero-abilities";
import {createMini} from "./mini-game";
vi.mock("./art", () => ({drawHero: vi.fn(), drawEnemy: vi.fn()}));
vi.mock("./heroes", () => ({drawFigure: vi.fn()}));
it.each([0,1,2] as const)("hero %i explains the goal, shows progress and starts safely paused", (hero) => {
  const html = renderToStaticMarkup(<MiniGame hero={hero} onComplete={() => {}} onExit={() => {}} />);
  expect(html).toContain("Start mini-game");
  expect(html).toContain(`${HERO_ABILITIES[hero].ultName} · L`);
  expect(html).toContain("Restart mini-game");
  expect(html).toContain("time limit");
  expect(html).not.toContain("Continue tale");
  expect(html).not.toContain("Replay pattern");
  expect(html).not.toContain("Change gadget");
  expect(html).toContain(hero === 0 ? "sparks home" : hero === 1 ? "toys repaired" : "pages restored");
});
it.each([0,1,2] as const)("renders hero %i's playing and completed mini-game without invalid geometry", (hero) => {
  const context = new Proxy({}, {get: () => (...args: unknown[]) => {
    for (const arg of args) if (typeof arg === "number") expect(Number.isFinite(arg)).toBe(true);
  }}) as CanvasRenderingContext2D;
  const s = createMini(hero);
  drawMini(context, s, 480, 225);
  s.status = "won"; s.progress = s.goal;
  drawMini(context, s, 480, 225);
});

it.each([1,2])("Grimble chapter %i has a different action and no misleading HOME control",stage=>{
 const html=renderToStaticMarkup(<MiniGame hero={0} stage={stage} onComplete={()=>{}} onExit={()=>{}}/>);
 expect(html).not.toContain("Guide sparks HOME");
 expect(html).toContain(stage===1?"Light nearby lantern":"Activate nearby seal");
 expect(html).toContain(stage===1?"Go to lantern 1":"Go to seal 1");
});

it.each([[0,1],[0,2],[1,1],[1,2],[2,1],[2,2]] as const)("labels moved hero %i stage %i as a campaign objective with a run exit", (hero, stage) => {
 const html = renderToStaticMarkup(<MiniGame hero={hero} stage={stage} campaign onComplete={()=>{}} onExit={()=>{}} />);
 expect(html).toContain("Mayhem objective");
 expect(html).toContain("Quit to main menu");
 expect(html).not.toContain("Back to Gravewick Tales");
 expect(html).not.toContain("Memory 2/3");
});
