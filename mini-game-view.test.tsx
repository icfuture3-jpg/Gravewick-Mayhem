import {expect, it, vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {MiniGame} from "./mini-game-view";
import {drawMini} from "./mini-game-art";
import {createMini} from "./mini-game";
vi.mock("./art", () => ({drawHero: vi.fn(), drawEnemy: vi.fn()}));
vi.mock("./heroes", () => ({drawFigure: vi.fn()}));
it.each([0,1,2] as const)("hero %i explains the goal, shows progress and starts safely paused", (hero) => {
  const html = renderToStaticMarkup(<MiniGame hero={hero} onComplete={() => {}} onExit={() => {}} />);
  expect(html).toContain("Start mini-game");
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
