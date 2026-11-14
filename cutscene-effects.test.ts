import {expect, it, vi} from "vitest";
import {cutsceneCues, drawCutsceneEffects, playCutsceneCues} from "./cutscene-effects";
import type {Sound} from "./audio";
const audio = (): Sound => ({tone: vi.fn(), noise: vi.fn(), music: vi.fn(), setMuted: vi.fn(), close: vi.fn()});
it("syncs the explosion to impact, not scene entry, and plays it only once", () => {
  const sound = audio(), impact = 3 * 0.62;
  playCutsceneCues(sound, "gadget", 3, 0, impact - 0.01);
  expect(sound.noise).not.toHaveBeenCalled();
  playCutsceneCues(sound, "gadget", 3, impact - 0.01, impact);
  expect(sound.noise).toHaveBeenCalledTimes(1);
  expect(sound.tone).toHaveBeenCalledWith(100, "sine", 0.55, 0.2, -70);
  playCutsceneCues(sound, "gadget", 3, impact, 3);
  expect(sound.noise).toHaveBeenCalledTimes(1);
});
it("plays three descending laser zaps and delayed thunder without timers", () => {
  const sound = audio();
  playCutsceneCues(sound, "illusion", 3, 0, 3);
  expect(sound.tone).toHaveBeenCalledTimes(6);
  const cues = cutsceneCues("portal", 7);
  expect(cues[1]!.time - cues[0]!.time).toBeCloseTo(0.18);
  playCutsceneCues(sound, "portal", 7, 0, 7);
  expect(sound.tone).toHaveBeenCalledWith(65, "triangle", 1.2, 0.15, -35);
  expect(cutsceneCues("victory", 7)).toEqual([]);
});
it("suppresses lightning flashes for reduced motion and doesn't repeat after the beat", () => {
  const fillRect = vi.fn(), stroke = vi.fn();
  const ctx = new Proxy({fillRect, stroke}, {get: (o,k) => Reflect.get(o,k) ?? vi.fn()}) as unknown as CanvasRenderingContext2D;
  drawCutsceneEffects(ctx, "portal", 7, 2.2, 960, 360, true);
  expect(fillRect).not.toHaveBeenCalled(); expect(stroke).not.toHaveBeenCalled();
  drawCutsceneEffects(ctx, "portal", 7, 2.2, 960, 360);
  expect(fillRect).toHaveBeenCalledTimes(1); expect(stroke).toHaveBeenCalledTimes(1);
  drawCutsceneEffects(ctx, "portal", 7, 20, 960, 360);
  expect(fillRect).toHaveBeenCalledTimes(1);
});
