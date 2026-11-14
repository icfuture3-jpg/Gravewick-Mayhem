import { afterEach, expect, it, vi } from "vitest";
import { createBrawl } from "./engine";
import { drawHero, drawEnemy } from "./art";
import { GADGETS } from "./hero-abilities";

vi.mock("./audio", () => ({createSound: () => ({tone() {}, noise() {}, music() {}, setMuted() {}, close() {}})}));
vi.mock("./art", async (original) => ({...await original<typeof import("./art")>(), drawHero: vi.fn(), drawEnemy: vi.fn()}));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.clearAllMocks(); });

function setup(hero: 0 | 1 | 2, enemy: "ghoul" | "clown" | "boogeyman" = "ghoul") {
  const events = new EventTarget();
  vi.stubGlobal("window", events);
  let frame: FrameRequestCallback = () => {};
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frame = callback; return 1; });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  const texts: string[] = [];
  const history: string[] = [];
  const noop = () => {};
  const scale = vi.fn();
  const context = new Proxy({
    fillText: (text: string) => {texts.push(text); history.push(text);},
    measureText: () => ({width: 20}), scale,
    createRadialGradient: () => ({addColorStop: noop}),
    createLinearGradient: () => ({addColorStop: noop}),
  }, {get: (target, key) => Reflect.get(target, key) ?? noop});
  const canvas = Object.assign(new EventTarget(), {getContext: () => context});
  const game = createBrawl(canvas as unknown as HTMLCanvasElement, () => {});
  let time = performance.now();
  const tick = (count = 1) => {for (let i = 0; i < count; i++) {texts.length = 0; time += 50; frame(time);}};
  const dispatch = (type: string, code: string) => {const event = new Event(type); Object.assign(event, {code}); events.dispatchEvent(event);};
  const key = (code: string, frames = 1) => {dispatch("keydown", code); tick(frames); dispatch("keyup", code);};
  const player = () => {
    const args = vi.mocked(drawHero).mock.lastCall!;
    return {...args[9] as {px: number; py: number; shrink: number; invisible: number; ult: number}};
  };
  const foe = () => {
    const args = vi.mocked(drawEnemy).mock.lastCall!;
    return {...args[10] as {x: number; y: number; hp: number; freeze: number; kx: number; ky: number}};
  };
  game.startPractice({hero, enemy});
  tick();
  return {game, tick, key, dispatch, texts, history, player, foe, scale};
}

it("Grimble reveals real supplies, teleports within range, obeys cooldown, and reveals all with his lantern ultimate", () => {
  const s = setup(0);
  s.key("KeyJ");
  expect(s.history).toContain("Hidden supply revealed!");
  expect(s.texts).toContain("2 hidden supplies");
  const before = s.player();
  s.key("KeyK");
  const after = s.player();
  expect(Math.hypot(after.px - before.px, after.py - before.py)).toBeCloseTo(Math.min(260, Math.hypot(672 - before.px, 270 - before.py)));
  s.key("KeyK");
  expect(s.player().py).toBe(after.py);
  s.game.refill();
  s.key("KeyL");
  expect(s.texts).toContain("0 hidden supplies");
  expect(s.foe().hp).toBeLessThanOrEqual(40);
  s.game.startPractice({hero: 0, enemy: "ghoul"}); s.tick();
  expect(s.texts).toContain("3 hidden supplies");
  s.game.destroy();
});

it.each([0, 1, 2])("Pip gadget %i has its own damage/status effect, not just a different name", (index) => {
  const s = setup(1);
  vi.spyOn(Math, "random").mockReturnValue((index + 0.1) / 3);
  s.key("KeyK");
  expect(s.history).toContain(GADGETS[index]!.name);
  s.tick(15);
  expect(s.foe().hp).toBe(130 - GADGETS[index]!.damage);
  expect(s.foe().freeze > 0).toBe(index === 1);
  s.game.destroy();
});

it("frost gadgets do not freeze bosses", () => {
  const s = setup(1, "boogeyman");
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  s.key("KeyK"); s.tick(15);
  expect(s.foe().hp).toBe(675);
  expect(s.foe().freeze).toBe(0);
  s.game.destroy();
});

it("Pip really shrinks, moves faster, takes half damage, expires and cannot transfer shrinking to another hero", () => {
  const s = setup(1, "clown");
  const before = s.player();
  s.key("KeyD");
  const normalStep = s.player().px - before.px;
  s.key("KeyL"); s.tick(4); // ultimate hitstop
  s.scale.mockClear();
  const start = s.player().px;
  s.key("KeyD");
  expect(s.player().px - start).toBeCloseTo(normalStep * 1.5);
  expect(s.scale).toHaveBeenCalledWith(0.45, 0.45);
  s.tick(90);
  expect(s.history).toContain("-4");
  s.tick(50);
  expect(s.player().shrink).toBe(0);
  s.game.refill(); s.key("KeyL"); s.tick(4);
  s.key("Digit1");
  expect(s.player().shrink).toBe(0);
  s.game.destroy();
});

it("Wisp loses enemy aggro while invisible, but attacking or switching ends the veil", () => {
  const s = setup(2);
  s.key("KeyK");
  const before = s.foe();
  s.tick(30);
  expect(s.foe().y).toBe(before.y);
  expect(s.player().invisible).toBeGreaterThan(0);
  s.key("KeyJ");
  expect(s.player().invisible).toBe(0);
  expect(s.foe().y).toBeGreaterThan(before.y);
  s.game.refill(); s.key("KeyK"); s.tick(105);
  expect(s.player().invisible).toBe(0);
  s.game.refill(); s.key("KeyK"); s.key("Digit1");
  expect(s.player().invisible).toBe(0);
  s.game.destroy();
});

it("Wisp's illusions draw enemy movement, fire damaging bolts, expire and reset between runs", () => {
  const s = setup(2);
  s.key("KeyL"); s.tick(18);
  expect(s.texts).toContain("2 ILLUSIONS");
  expect(Math.abs(s.foe().x - 480)).toBeGreaterThan(1);
  expect(s.foe().hp).toBeLessThan(130);
  s.tick(140);
  expect(s.texts.some((text) => text.startsWith("Illusion ·"))).toBe(false);
  s.game.refill(); s.key("KeyL"); s.tick(4);
  s.game.startPractice({hero: 0, enemy: "ghoul"}); s.tick();
  expect(s.texts.some((text) => text.startsWith("Illusion ·"))).toBe(false);
  s.game.destroy();
});

it("Pip's tiny hitbox lets an enemy get closer before contact damage", () => {
  vi.spyOn(Math, "random").mockReturnValue(0.1);
  const firstContact = (tiny: boolean) => {
    const s = setup(1, "clown");
    if (tiny) s.key("KeyL");
    for (let i = 0; i < 110; i++) {
      s.tick();
      if (s.texts.includes(tiny ? "-4" : "-8")) {
        const p = s.player(); const e = s.foe();
        s.game.destroy();
        return Math.hypot(p.px - e.x, p.py - e.y);
      }
    }
    s.game.destroy();
    throw new Error("Enemy never made contact");
  };
  const normal = firstContact(false);
  const tiny = firstContact(true);
  expect(normal).toBeGreaterThan(24);
  expect(tiny).toBeLessThan(23);
});

// Input can arrive and be released in the gap between two requestAnimationFrame callbacks.
it("does not drop quick J/K/L taps between frames", () => {
  const s = setup(2);
  const tap = (code: string) => {s.dispatch("keydown", code); s.dispatch("keyup", code); s.tick();};
  tap("KeyK");
  expect(s.player().invisible).toBeGreaterThan(0);
  tap("KeyJ");
  expect(s.player().invisible).toBe(0);
  tap("KeyL");
  expect(s.texts).toContain("2 ILLUSIONS");
  s.game.destroy();
});
