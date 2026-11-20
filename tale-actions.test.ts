import {expect, it, vi} from "vitest";
import {drawTaleAction, taleAction, talePose, workshopPose} from "./tale-actions";
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

it("walks Wisp sideways toward the book, then stops at the mirror", () => {
  const context = new Proxy({}, {get: () => vi.fn()}) as CanvasRenderingContext2D;
  vi.mocked(drawFigure).mockClear();
  drawTaleAction(context, 2, 0, 2);
  expect(vi.mocked(drawFigure).mock.calls[0]![9]).toMatchObject({side: true, speed: 55});
  const start = talePose(2, 0, 0), arrival = talePose(2, 0, 4.9);
  expect(arrival.heroX).toBeGreaterThan(start.heroX);
  expect(arrival.heroY).toBe(start.heroY);
  expect(talePose(2, 0, 7).heroX).toBe(arrival.heroX);
  vi.mocked(drawFigure).mockClear();
  drawTaleAction(context, 2, 0, 7);
  expect(vi.mocked(drawFigure).mock.calls[0]![9]).toMatchObject({side: true, speed: 0});
});

it("shows only one Wisp in every personal story chapter and conclusion", () => {
  const ctx = new Proxy({}, {get: () => vi.fn()}) as CanvasRenderingContext2D;
  for (let chapter = 0; chapter < 3; chapter++) for (const time of [0, 2, 5, 8]) for (const complete of [false, true]) {
    vi.mocked(drawFigure).mockClear();
    drawTaleAction(ctx, 2, chapter, time, complete);
    expect(drawFigure).toHaveBeenCalledTimes(1);
  }
});

it("Grimble teleports between portal positions rather than walking through the gap", () => {
  expect(talePose(0,1,2).heroX).toBe(220);
  expect(talePose(0,1,4).heroX).toBe(480);
});
it("Tiny Trouble holds Pip small for six seconds instead of a looping size wobble", () => {
  expect(talePose(1,2,0).scale).toBe(1.2);
  expect(talePose(1,2,0.2).scale).toBe(0.45);
  expect(talePose(1,2,6.1).scale).toBe(0.45);
  expect(talePose(1,2,6.3).scale).toBe(1.2);
});

it("walks Pip in profile toward the toys and stops running while hammering the sixth toy",()=>{
 const ctx=new Proxy({}, {get:()=>vi.fn()}) as CanvasRenderingContext2D;
 for(const time of [0.4,1,3,6.5,7]) {
  vi.mocked(drawFigure).mockClear();drawTaleAction(ctx,1,0,time);
  const pose=workshopPose(time),call=vi.mocked(drawFigure).mock.calls[0]!;
  expect(call[2]).toBe(pose.heroX);expect(call[9]).toMatchObject({side:true,speed:pose.walking?55:0});
 }
 expect(workshopPose(1).heroX).toBeGreaterThan(workshopPose(0.4).heroX);
 expect(workshopPose(6.5)).toMatchObject({toy:5,walking:false});
 expect(workshopPose(7)).toMatchObject({toy:5,walking:false,fixed:true});
});
