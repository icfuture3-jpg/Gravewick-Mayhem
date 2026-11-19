import {afterEach, expect, it, vi} from "vitest";
import {createSound} from "./audio";
afterEach(() => vi.unstubAllGlobals());
it("plays bundled recordings, honors mute and stops every sample on exit", () => {
  const clips: {src: string; muted: boolean; volume: number; currentTime: number; play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn>; removeAttribute: ReturnType<typeof vi.fn>; load: ReturnType<typeof vi.fn>}[] = [];
  vi.stubGlobal("Audio", class {
    muted = false; volume = 1; currentTime = 0;
    play = vi.fn().mockResolvedValue(undefined); pause = vi.fn(); removeAttribute = vi.fn(); load = vi.fn();
    constructor(public src: string) {clips.push(this);}
  });
  vi.stubGlobal("window", {clearInterval: vi.fn()});
  const sound = createSound();
  sound.sample!("explosion", 0.7);
  const explosion = clips.find((clip) => clip.src.endsWith("explosion.wav"))!;
  expect(explosion.play).toHaveBeenCalledTimes(1);expect(explosion.volume).toBe(0.7);
  sound.setMuted(true);expect(clips.every((clip) => clip.muted)).toBe(true);
  sound.sample!("thunder", 0.8);
  const thunder = clips.find((clip) => clip.src.endsWith("thunder.ogg"))!;
  expect(thunder.play).not.toHaveBeenCalled();
  sound.setMuted(false);sound.sample!("thunder", 0.8);expect(thunder.play).toHaveBeenCalledTimes(1);
  sound.sample!("wood",0.75);expect(clips.find(c=>c.src.endsWith("wood-knock.wav"))!.play).toHaveBeenCalledTimes(1);
  sound.close();expect(clips.every((clip) => clip.pause.mock.calls.length === 1)).toBe(true);
  sound.sample!("thunder", 0.8);expect(thunder.play).toHaveBeenCalledTimes(1);
});
