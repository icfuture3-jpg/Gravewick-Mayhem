import {readFileSync} from "node:fs";
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
  sound.sample!("cheer",0.55);const cheer=clips.find(c=>c.src.endsWith("toy-cheer.wav"))!;
  expect(cheer.play).toHaveBeenCalledTimes(1);sound.setMuted(true);sound.sample!("cheer",0.55);expect(cheer.play).toHaveBeenCalledTimes(1);
  sound.setMuted(false);sound.stopSample!("cheer");expect(cheer.currentTime).toBe(0);expect(cheer.pause).toHaveBeenCalledTimes(1);
  // StopSample is additional to universal cleanup.
  cheer.pause.mockClear();
  sound.close();expect(clips.every((clip) => clip.pause.mock.calls.length === 1)).toBe(true);
  sound.sample!("thunder", 0.8);expect(thunder.play).toHaveBeenCalledTimes(1);
});

it("ships a nonempty original toy sound with valid PCM duration and no clipped samples",()=>{
 const wav=readFileSync(new URL("./public/audio/toy-cheer.wav",import.meta.url));
 expect(wav.toString("ascii",0,4)).toBe("RIFF");expect(wav.toString("ascii",8,12)).toBe("WAVE");
 expect(wav.readUInt16LE(22)).toBe(1);expect(wav.readUInt16LE(34)).toBe(16);
 const seconds=wav.readUInt32LE(40)/(wav.readUInt32LE(24)*2);expect(seconds).toBeCloseTo(0.82,2);
 let energy=0,peak=0;for(let i=44;i<wav.length;i+=2){const sample=wav.readInt16LE(i);energy+=sample*sample;peak=Math.max(peak,Math.abs(sample));}
 expect(energy).toBeGreaterThan(1000000);expect(peak).toBeLessThan(32767);
});
