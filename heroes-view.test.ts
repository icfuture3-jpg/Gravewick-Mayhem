import {expect, it, vi} from "vitest";
import {drawFigure} from "./heroes";
import {sprites} from "./sprites";
vi.mock("./sprites", () => ({sprites: [null, null, null]}));
it("uses Wisp's profile frames only when a story explicitly requests that view", () => {
  const front = {} as HTMLCanvasElement, side = {} as HTMLCanvasElement, walking = {} as HTMLCanvasElement;
  sprites[2] = {frames: [front], walk: [front], side: {frames: [side], walk: [walking]}, aspect: 1, dur: 1, walkDur: 1};
  const drawImage = vi.fn();
  const context = new Proxy({drawImage}, {get: (obj, key) => Reflect.get(obj, key) ?? vi.fn()}) as unknown as CanvasRenderingContext2D;
  drawFigure(context, 2, 100, 100, 1, 0, false, false, 0, {side: true, speed: 100, phase: 0});
  expect(drawImage.mock.calls[0]![0]).toBe(walking);
  drawImage.mockClear();
  drawFigure(context, 2, 100, 100, 1, 0, false, false, 0, {side: true, speed: 0, phase: 0});
  expect(drawImage.mock.calls[0]![0]).toBe(side);
  drawImage.mockClear();
  drawFigure(context, 2, 100, 100, 1, 0, false, false, 0);
  expect(drawImage.mock.calls[0]![0]).toBe(front);
  sprites[2] = null;
});
