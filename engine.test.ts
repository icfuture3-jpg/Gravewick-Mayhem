import { expect, it } from "vitest";
import { makeWave } from "./engine";

it("builds growing waves and keeps bosses out of them", () => {
  const early = makeWave("story", 0, 0);
  const late = makeWave("story", 2, 2);
  expect(late.length).toBeGreaterThan(early.length);
  expect(makeWave("endless", 0, 7).length).toBeGreaterThan(3);

  const bosses = ["boogeyman", "nergal", "meteor"];
  for (const mode of ["story", "endless"] as const) {
    for (let stage = 0; stage < 3; stage += 1) {
      for (let wave = 0; wave < 12; wave += 1) {
        const enemies = makeWave(mode, stage, wave);
        expect(enemies.length).toBeGreaterThan(0);
        expect(enemies.some((kind) => bosses.includes(kind))).toBe(false);
      }
    }
  }
});
