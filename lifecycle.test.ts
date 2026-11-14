import { afterEach, expect, it, vi } from "vitest";
import { createBrawl } from "./engine";

const sound = vi.hoisted(() => ({ tone: vi.fn(), noise: vi.fn(), music: vi.fn(), setMuted: vi.fn(), close: vi.fn() }));
vi.mock("./audio", () => ({ createSound: () => sound }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
function setup() {
  const events = new EventTarget();
  vi.stubGlobal("window", events);
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  const canvas = Object.assign(new EventTarget(), { getContext: () => ({}) }) as unknown as HTMLCanvasElement;
  const muted = vi.fn();
  const game = createBrawl(canvas, vi.fn(), muted);
  const key = (code: string, repeat = false) => {
    const event = new Event("keydown");
    Object.assign(event, { code, repeat });
    events.dispatchEvent(event);
  };
  return { game, key, muted };
}
it("keeps keyboard and menu sound changes synchronized", () => {
  const {game, key, muted} = setup();
  game.start("endless");
  key("KeyM");
  expect(muted).toHaveBeenLastCalledWith(true);
  expect(sound.setMuted).toHaveBeenLastCalledWith(true);
  game.setMuted(false);
  expect(muted).toHaveBeenLastCalledWith(false);
  key("KeyM");
  expect(muted).toHaveBeenLastCalledWith(true);
  game.destroy();
});
it("does not repeatedly toggle mute on held keys and removes listeners on destroy", () => {
  const {game, key, muted} = setup();
  game.start("endless");
  key("KeyM"); key("KeyM", true);
  expect(muted).toHaveBeenCalledTimes(1);
  game.destroy();
  key("KeyM");
  expect(muted).toHaveBeenCalledTimes(1);
  expect(sound.close).toHaveBeenCalledOnce();
});
