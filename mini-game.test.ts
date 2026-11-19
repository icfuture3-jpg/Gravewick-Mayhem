import { expect, it } from "vitest";
import { createMini, stepMini, miniBonus, miniPoint, miniObjective, HOME, REPAIR_PARTS, shadowPosition, type MiniInput, type MiniState } from "./mini-game";
import { miniChapter } from "./mini-backstory";
const idle: MiniInput = {x: 0, y: 0, aimX: 480, aimY: 200};
const tick = (s: MiniState, frames: number) => {for (let i = 0; i < frames; i++) stepMini(s, idle, 0.05);};
const at = (s: MiniState, p: {x: number; y: number}) => {s.px = p.x; s.py = p.y; stepMini(s, idle, 0.05);};

it("Grimble reveals sparks, gains followers, and only scores when he guides them home", () => {
  const s = createMini(0), spark = s.sparks[0]!;
  at(s, {x: spark.x + 90, y: spark.y});
  expect(spark.found).toBe(true); expect(spark.following).toBe(false);
  at(s, spark);
  expect(spark.following).toBe(true); expect(s.progress).toBe(0);
  expect(miniObjective(s)).toContain("guide them to HOME");
  at(s, HOME);
  expect(spark.taken).toBe(true); expect(s.progress).toBe(1);
  at(s, HOME); expect(s.progress).toBe(1);
});
it("Grimble's followers move with him; shadows slow him without losing rescued sparks", () => {
  const s = createMini(0), spark = s.sparks[0]!;
  at(s, spark); const x = spark.x;
  s.px += 70; tick(s, 3); expect(spark.x).toBeGreaterThan(x);
  const shadow = shadowPosition(0, s.elapsed + 0.05); at(s, shadow);
  expect(s.invuln).toBeGreaterThan(0); expect(spark.following).toBe(true);
  const px = s.px; stepMini(s, {...idle, x: 1}, 0.05);
  expect(s.px - px).toBeCloseTo(7.5);
});
it("Pip must hit the highlighted broken part; wrong hits are safe and cannot skip repairs", () => {
  const s = createMini(1);
  stepMini(s, {...idle, action: true, aimX: REPAIR_PARTS[1].x, aimY: REPAIR_PARTS[1].y}, 0.05);
  expect(s.part).toBe(0); expect(s.progress).toBe(0); expect(s.message).toContain("no penalty");
  tick(s, 6);
  stepMini(s, {...idle, action: true, aimX: REPAIR_PARTS[0].x, aimY: REPAIR_PARTS[0].y}, 0.05);
  expect(s.part).toBe(1); expect(s.progress).toBe(0);
  stepMini(s, {...idle, action: true, aimX: REPAIR_PARTS[1].x, aimY: REPAIR_PARTS[1].y}, 0.01);
  expect(s.part).toBe(1); // cannot claim another hit before the mallet finishes
});
it("Wisp carries one page at a time and restores it only at the book", () => {
  const s = createMini(2);
  at(s, s.pages[0]!); expect(s.carrying).toBe(0); expect(s.progress).toBe(0);
  expect(miniObjective(s)).toContain("Return to the glowing BOOK");
  at(s, s.pages[1]!); expect(s.pages[1]!.taken).toBe(false);
  at(s, HOME); expect(s.carrying).toBeNull(); expect(s.progress).toBe(1);
  at(s, HOME); expect(s.progress).toBe(1);
});
it.each([0, 2] as const)("hero %i can click to walk, keyboard overrides destination, bounds stay safe", (hero) => {
  const s = createMini(hero);
  stepMini(s, {...idle, moveTo: true, aimX: 700, aimY: 400}, 0.05);
  expect(s.px).toBeGreaterThan(HOME.x); tick(s, 60);
  expect(s.px).toBeCloseTo(700); expect(s.destination).toBeNull();
  stepMini(s, {...idle, moveTo: true, aimX: 900}, 0.05);
  stepMini(s, {...idle, x: -1}, 0.05); expect(s.destination).toBeNull();
  for (let i = 0; i < 200; i++) stepMini(s, {...idle, x: -1, y: -1}, 0.05);
  expect(s.px).toBeGreaterThanOrEqual(35); expect(s.py).toBeGreaterThanOrEqual(105);
});
it.each([0, 1, 2] as const)("hero %i has no countdown, cannot earn an early bonus, and restart is fresh", (hero) => {
  const s = createMini(hero); tick(s, 3000);
  expect(s.status).toBe("playing"); expect(miniBonus(s)).toBe(0);
  const fresh = createMini(hero); expect(fresh).toMatchObject({progress: 0, carrying: null, part: 0, elapsed: 0, destination: null});
});
it.each([0, 1, 2] as const)("hero %i completes all three story chapters with matching memories and freezes after winning", (hero) => {
  for (let stage = 0; stage < 3; stage++) {
    const s = createMini(hero, stage), lore = miniChapter(hero, stage);
    expect(lore.memories).toHaveLength(s.goal);
    if (hero === 0) for (const spark of s.sparks) {at(s, spark); at(s, HOME); expect(s.message).toBe(lore.memories[s.progress - 1]);}
    else if (hero === 1) for (let toy = 0; toy < 6; toy++) {
      for (const p of REPAIR_PARTS) {stepMini(s, {...idle, action: true, aimX: p.x, aimY: p.y}, 0.05); tick(s, 6);}
      expect(s.progress).toBe(toy + 1); expect(s.message).toBe(lore.memories[toy]);
    }
    else for (const p of s.pages) {at(s, p); at(s, HOME); expect(s.message).toBe(lore.memories[s.progress - 1]);}
    expect(s.status).toBe("won"); expect(miniBonus(s)).toBeGreaterThan(500);
    const snapshot = structuredClone(s); tick(s, 30); expect(s).toEqual(snapshot);
  }
});
it("maps mouse input through letterboxing without changing the playfield hit areas", () => {
  expect(miniPoint({left: 0, top: 0, width: 1280, height: 480}, 160, 0)).toEqual({x: 0, y: 0});
  expect(miniPoint({left: 0, top: 0, width: 1280, height: 480}, 1120, 480)).toEqual({x: 960, y: 480});
  expect(miniPoint({left: 20, top: 50, width: 960, height: 600}, 500, 350)).toEqual({x: 480, y: 240});
});
