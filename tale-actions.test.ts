import {expect, it, vi} from "vitest";
import {drawTaleAction, taleAction, talePose} from "./tale-actions";
import {drawFigure} from "./heroes";
vi.mock("./heroes", () => ({drawFigure: vi.fn()}));
it("assigns a unique action to each described chapter, not generic combat", () => {
  expect([0,1,2].map((i) => taleAction(0,i))).toEqual(["fallen-star","keeper-embers","star-gate"]);
  expect([0,1,2].map((i) => taleAction(1,i))).toEqual(["toy-repair","prototype","machine-locks"]);
  expect([0,1,2].map((i) => taleAction(2,i))).toEqual(["mirror-book","mirror-doubts","final-page"]);
});
it("moves the character through the scene, shrinks Pip under the scanner, and holds completed conclusions", () => {
  expect(talePose(0,0,5).heroX).toBeGreaterThan(talePose(0,0,0).heroX);
  expect(talePose(1,2,3.5).scale).toBeLessThan(talePose(1,2,0).scale);
  expect(talePose(0,2,10,true).progress).toBe(1);
  expect(talePose(2,2,0,true).progress).toBeGreaterThanOrEqual(0.8);
});
it.each([0,1,2] as const)("renders hero %i's three actions and conclusions at early/middle/end without invalid geometry", (hero) => {
  const labels: string[] = [];
  const context = new Proxy({fillText: (text: string) => labels.push(text)}, {get: (obj,key) => Reflect.get(obj,key) ?? ((...args: unknown[]) => {for(const arg of args) if(typeof arg === "number") expect(Number.isFinite(arg)).toBe(true);})});
  for (let chapter=0;chapter<3;chapter++) for (const time of [0,3.5,7]) {
    vi.mocked(drawFigure).mockClear();
    drawTaleAction(context as unknown as CanvasRenderingContext2D,hero,chapter,time);
    expect(vi.mocked(drawFigure).mock.calls.every((call) => call[1] === hero)).toBe(true);
    drawTaleAction(context as unknown as CanvasRenderingContext2D,hero,chapter,time,true);
  }
  expect(labels.length).toBeGreaterThan(10);
});
