import { expect, it } from "vitest";
import { createMini, stepMini, miniBonus, miniPoint, type MiniInput, type MiniState } from "./mini-game";
const idle: MiniInput = {x: 0, y: 0, aimX: 480, aimY: 200};
const tick = (s: MiniState, frames: number) => {for (let i = 0; i < frames; i++) stepMini(s, idle, 0.05);};

it("Grimble must reveal and collect all five lights; movement alone is not enough", () => {
  const s = createMini(0);
  const spark = s.sparks[0]!;
  s.px = spark.x; s.py = spark.y;
  stepMini(s, idle, 0.05);
  expect(s.progress).toBe(0);
  for (const target of s.sparks) {
    s.px = target.x; s.py = target.y;
    stepMini(s, {...idle, action: true}, 0.05);
  }
  expect(s.status).toBe("won"); expect(s.progress).toBe(5);
  expect(miniBonus(s)).toBeGreaterThan(500);
});
it("Grimble's portal respects range and cooldown; shadow contact costs time only once per invulnerability window", () => {
  const s = createMini(0);
  stepMini(s, {...idle, skill: true, aimX: 900, aimY: 390}, 0.05);
  expect(s.px).toBe(720);
  stepMini(s, {...idle, skill: true, aimX: 100}, 0.05);
  expect(s.px).toBe(720);
  s.px = 180; s.py = 240 + Math.sin((s.elapsed + 0.05) * 1.5) * 120;
  const time = s.time; stepMini(s, idle, 0.05);
  expect(s.time).toBeCloseTo(time - 3.05);
  const after = s.time; stepMini(s, idle, 0.05);
  expect(s.time).toBeCloseTo(after - 0.05);
});
it("Pip wins only by hitting all six targets with matching gadgets", () => {
  const s = createMini(1);
  for (const target of s.targets) {
    s.px = target.x;
    while (s.gadget !== target.kind) stepMini(s, {...idle, skill: true}, 0.05);
    stepMini(s, {...idle, action: true, aimX: target.x, aimY: target.y}, 0.05);
    tick(s, 19);
    expect(target.hit).toBe(true);
  }
  expect(s.status).toBe("won"); expect(s.progress).toBe(6);
});
it("Pip's wrong gadget costs time, while shrinking dodges the scanner", () => {
  const s = createMini(1);
  stepMini(s, {...idle, skill: true}, 0.05); // frost, target zero wants dynamite
  const target = s.targets[0]!; s.px = target.x;
  stepMini(s, {...idle, action: true, aimX: target.x, aimY: target.y}, 0.05); tick(s, 19);
  expect(target.hit).toBe(false); expect(s.progress).toBe(0); expect(s.time).toBeLessThan(42);
  const tiny = createMini(1); tiny.px = 90; tiny.py = 300;
  stepMini(tiny, {...idle, rune: 4}, 0.05);
  expect(tiny.tiny).toBeGreaterThan(0); expect(tiny.time).toBeCloseTo(44.95);
  expect(tiny.cooldown).toBeGreaterThan(4);
});
it.each([0, 1, 2])("Wisp completes three memory rounds in chapter %i and ignores input during previews", (stage) => {
  const s = createMini(2, stage);
  stepMini(s, {...idle, rune: s.sequence[0]}, 0.05);
  expect(s.index).toBe(0);
  for (let round = 0; round < 3; round++) {
    tick(s, 110);
    for (const rune of s.sequence.slice()) stepMini(s, {...idle, rune}, 0.05);
    expect(s.progress).toBe(round + 1);
  }
  expect(s.status).toBe("won");
});
it("Wisp can replay a pattern and wrong input costs time without advancing", () => {
  const s = createMini(2); tick(s, 70);
  const before = s.time;
  stepMini(s, {...idle, rune: (s.sequence[0]! + 1) % 4}, 0.05);
  expect(s.index).toBe(0); expect(s.time).toBeCloseTo(before - 3.05);
  stepMini(s, {...idle, skill: true}, 0.05);
  expect(s.show).toBeGreaterThan(0); expect(s.time).toBeLessThan(before - 8);
});
it.each([0, 1, 2] as const)("mini-game %i expires, never awards an unearned bonus, and stops simulation after a result", (hero) => {
  const s = createMini(hero); s.time = 0.01;
  stepMini(s, idle, 0.05);
  expect(s.status).toBe("lost"); expect(miniBonus(s)).toBe(0);
  const snapshot = structuredClone(s); tick(s, 30); expect(s).toEqual(snapshot);
  expect(createMini(hero)).toMatchObject({progress: 0, status: "playing"});
});

it("maps mouse aim correctly through canvas letterboxing at different viewport sizes", () => {
  expect(miniPoint({left: 0, top: 0, width: 1280, height: 480}, 160, 0)).toEqual({x: 0, y: 0});
  expect(miniPoint({left: 0, top: 0, width: 1280, height: 480}, 1120, 480)).toEqual({x: 960, y: 480});
  expect(miniPoint({left: 20, top: 50, width: 960, height: 600}, 500, 350)).toEqual({x: 480, y: 240});
});

it.each([0, 1, 2] as const)("hero %i unlocks the matching backstory through successful play, across all chapters", async (hero) => {
  const {miniChapter} = await import("./mini-backstory");
  for (let stage = 0; stage < 3; stage++) {
    const s = createMini(hero, stage);
    const lore = miniChapter(hero, stage);
    expect(lore.memories).toHaveLength(s.goal);
    expect(lore.ending.length).toBeGreaterThan(30);
    if (hero === 0) {
      for (const spark of s.sparks) {s.px = spark.x; s.py = spark.y; stepMini(s, {...idle, action: true}, 0.05); expect(s.message).toBe(lore.memories[s.progress - 1]);}
    } else if (hero === 1) {
      for (const target of s.targets) {s.px = target.x; s.gadget = target.kind; stepMini(s, {...idle, action: true, aimX: target.x, aimY: target.y}, 0.05); tick(s, 19); expect(s.message).toBe(lore.memories[s.progress - 1]);}
    } else {
      for (let round = 0; round < 3; round++) {tick(s, 110); for (const rune of s.sequence.slice()) stepMini(s, {...idle, rune}, 0.05); expect(s.message).toBe(lore.memories[round]);}
    }
    expect(s.status).toBe("won");
  }
});
