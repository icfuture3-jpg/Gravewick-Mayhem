import { HERO_ABILITIES } from "./hero-abilities";
import { afterEach, expect, it, vi } from "vitest";
import { createBrawl } from "./engine";
import { PRACTICE_ENEMIES } from "./practice";

vi.mock("./audio", () => ({createSound: () => ({tone() {}, noise() {}, music() {}, setMuted() {}, close() {}})}));
afterEach(() => vi.unstubAllGlobals());
function setup() {
  const events = new EventTarget();
  vi.stubGlobal("window", events);
  let frame: FrameRequestCallback = () => {};
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {frame = callback; return 1;});
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  const texts: string[] = [];
  const noop = () => {};
  const context = new Proxy({
    fillText: (text: string) => texts.push(text),
    measureText: () => ({width: 20}),
    createRadialGradient: () => ({addColorStop: noop}),
    createLinearGradient: () => ({addColorStop: noop}),
  }, {get: (target, key) => Reflect.get(target, key) ?? noop});
  const canvas = Object.assign(new EventTarget(), {getContext: () => context});
  const phase = vi.fn();
  const game = createBrawl(canvas as unknown as HTMLCanvasElement, phase);
  let time = performance.now();
  const tick = (count = 1) => { for (let i = 0; i < count; i++) {time += 50; frame(time);} };
  const key = (code: string) => { const e = new Event("keydown"); Object.assign(e, {code}); events.dispatchEvent(e); tick(); const up = new Event("keyup"); Object.assign(up, {code}); events.dispatchEvent(up); };
  return {game, tick, key, phase, texts};
}
it.each(PRACTICE_ENEMIES)("runs all three heroes against %s with skills and ultimates", (enemy) => {
  const {game, tick, key, phase, texts} = setup();
  for (const hero of [0, 1, 2] as const) {
    game.startPractice({hero, enemy});
    tick(10);
    game.refill();
    key("KeyJ");
    key("KeyK");
    expect(texts).toContain(`K · ${HERO_ABILITIES[hero].skillName}`);
    key("KeyL");
    expect(texts).toContain(`L · ${HERO_ABILITIES[hero].ultName}`);
    tick(100);
    expect(texts).toContain("Practice arena");
    game.quit();
    expect(phase.mock.lastCall![1].practice).toBe(true);
  }
  game.start("endless");
  expect(phase.mock.lastCall![1].practice).toBe(false);
  game.destroy();
});
