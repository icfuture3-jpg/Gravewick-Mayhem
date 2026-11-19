import { CAMPAIGN_OBJECTIVES } from "./campaign-objectives";
import { afterEach, expect, it, vi } from "vitest";
import { soloScenes } from "./solo-story";
import { createBrawl } from "./engine";
import { drawHero, drawEnemy } from "./art";
import { drawAction } from "./cinematic";
import { arrival, bossEntrance, turningPoint, celebration } from "./movie";

vi.mock("./audio", () => ({createSound: () => ({tone() {}, noise() {}, music() {}, setMuted() {}, close() {}})}));
vi.mock("./art", async (original) => ({...await original<typeof import("./art")>(), drawHero: vi.fn(), drawEnemy: vi.fn()}));
vi.mock("./cinematic", () => ({drawAction: vi.fn()}));
afterEach(() => {vi.unstubAllGlobals(); vi.clearAllMocks();});

function setup() {
  const events = new EventTarget();
  vi.stubGlobal("window", events);
  let frame: FrameRequestCallback = () => {};
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {frame = callback; return 1;});
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  const texts: string[] = [];
  const noop = () => {};
  const context = new Proxy({fillText: (text: string) => texts.push(text), measureText: () => ({width: 20}),
    createRadialGradient: () => ({addColorStop: noop}), createLinearGradient: () => ({addColorStop: noop})},
  {get: (target, key) => Reflect.get(target, key) ?? noop});
  const canvas = Object.assign(new EventTarget(), {getContext: () => context});
  const phase = vi.fn();
  const game = createBrawl(canvas as unknown as HTMLCanvasElement, phase);
  let time = performance.now();
  const tick = (count = 1) => {for (let i = 0; i < count; i++) {time += 50; frame(time);}};
  const key = (code: string) => {
    const down = new Event("keydown"); Object.assign(down, {code}); events.dispatchEvent(down); tick();
    const up = new Event("keyup"); Object.assign(up, {code}); events.dispatchEvent(up);
  };
  type State = {px: number; py: number; wave: number; stage: number; queue: string[]; ult: number; banner: {t: number}; score: number; active: number; invuln: number};
  const state = () => vi.mocked(drawHero).mock.lastCall![9] as State;
  const enemy = () => vi.mocked(drawEnemy).mock.lastCall![10] as {hp: number; max: number; x: number; y: number};
  return {game, tick, key, state, enemy, phase, texts};
}

it("scripts every stage with portal, gadget, illusion, boss counterattack and victory action", () => {
  for (let stage = 0; stage < 3; stage++) {
    expect(arrival(stage).map((s) => s.action)).toEqual(["portal", "gadget", "illusion"]);
    for (const scene of [...arrival(stage), ...bossEntrance(stage), ...turningPoint(stage), ...celebration(stage)]) {
      expect(scene.stage).toBe(stage);
      expect(scene.actors.map((a) => a.idx)).toEqual([0, 1, 2]);
      expect(scene.duration).toBeGreaterThan(scene.text.length / 40);
    }
  }
});

it("auto-plays the opener without input and lets Escape skip the whole sequence", () => {
  const s = setup(); s.game.start("story"); s.tick();
  expect(vi.mocked(drawAction).mock.lastCall![1].action).toBe("portal");
  s.tick(65);
  expect(vi.mocked(drawAction).mock.lastCall![1].action).toBe("gadget");
  s.tick(65);
  expect(vi.mocked(drawAction).mock.lastCall![1].action).toBe("illusion");
  s.tick(65);
  vi.mocked(drawAction).mockClear(); s.tick(10);
  expect(drawAction).not.toHaveBeenCalled();
  s.game.start("story"); s.tick(); s.key("Escape");
  vi.mocked(drawAction).mockClear(); s.tick(10);
  expect(drawAction).not.toHaveBeenCalled();
  s.game.destroy();
});

it("stages boss arrivals, freezes combat for one half-health counterattack, then celebrates and enters the next stage", () => {
  const s = setup(); s.game.start("story"); s.tick(); s.key("Escape"); s.key("KeyT");
  // Position the simulation at the wave-three boundary without playing an entire campaign.
  Object.assign(s.state(), {wave: 3, queue: []}); s.state().banner.t = 0;
  s.tick();
  expect(vi.mocked(drawAction).mock.lastCall![1].caption).toBe("Boss incoming!");
  s.tick(95);
  const boss = s.enemy();
  boss.hp = boss.max / 2;
  s.tick();
  expect(vi.mocked(drawAction).mock.lastCall![1].caption).toBe("Turn the tide!");
  const before = {x: boss.x, y: boss.y, hp: boss.hp};
  s.tick(30);
  expect(boss).toMatchObject(before);
  s.key("Escape");
  vi.mocked(drawAction).mockClear(); s.tick(5);
  expect(drawAction).not.toHaveBeenCalled(); // same half-health boss cannot retrigger
  boss.hp = 1; s.state().ult = 100; s.key("KeyL"); s.tick(5);
  expect(vi.mocked(drawAction).mock.lastCall![1].caption).toBe("Finishing move!");
  s.tick(200);
  expect(s.state().stage).toBe(1);
  expect(vi.mocked(drawAction).mock.lastCall![1].stage).toBe(1);
  expect(s.phase.mock.lastCall![0]).toBe("playing");
  s.game.destroy();
});

it("finishes the final victory sequence before reporting victory and preserves score when skipped", () => {
  const s = setup(); s.game.start("story"); s.tick(); s.key("Escape"); s.key("KeyT");
  Object.assign(s.state(), {wave: 4, stage: 2, queue: []}); s.state().banner.t = 0;
  s.tick();
  expect(s.phase.mock.lastCall![0]).toBe("playing");
  s.tick(150);
  expect(s.phase.mock.lastCall![0]).toBe("victory");
  expect(s.texts).toContain("GRAVEWICK SAVED!");
  expect(s.phase.mock.lastCall![1].score).toBe(5000);
  s.game.start("story"); s.tick(); s.key("Escape"); s.key("KeyT");
  Object.assign(s.state(), {wave: 4, stage: 2, queue: []}); s.state().banner.t = 0;
  s.tick(); s.key("Escape");
  expect(s.phase.mock.lastCall![0]).toBe("victory");
  expect(s.phase.mock.lastCall![1].score).toBe(5000);
  s.game.destroy();
});

it("keeps endless and practice free of cinematic interruptions", () => {
  const s = setup(); s.game.start("endless"); s.tick(40);
  expect(drawAction).not.toHaveBeenCalled();
  s.game.startPractice({hero: 2, enemy: "boogeyman"}); s.tick(5);
  s.enemy().hp = 100; s.tick(5);
  expect(drawAction).not.toHaveBeenCalled();
  s.game.destroy();
});

it.each([0, 1, 2] as const)("gives hero %i an isolated solo campaign, chapter challenges and a personal ending", (hero) => {
  const s = setup(); s.game.startSolo(hero); s.tick();
  expect(vi.mocked(drawAction).mock.lastCall![1].soloHero).toBe(hero);
  expect(s.state().active).toBe(hero);
  s.key("Escape");
  expect(s.phase.mock.lastCall![0]).toBe("challenge");
  expect(s.phase.mock.lastCall![1].soloHero).toBe(hero);
  const before = s.state().wave; s.tick(100); expect(s.state().wave).toBe(before);
  s.game.completeChallenge(750); s.tick();
  expect(s.phase.mock.lastCall![0]).toBe("playing");
  expect(s.state().score).toBe(750);
  s.game.completeChallenge(750); expect(s.state().score).toBe(750); // one claim per challenge
  for (const code of ["Digit1", "Digit2", "Digit3", "KeyQ"]) s.key(code);
  expect(s.state().active).toBe(hero);
  expect(s.texts.some((t) => t.startsWith("Training "))).toBe(false);
  for (let stage = 0; stage < 3; stage++) {
    Object.assign(s.state(), {wave: 4, queue: []}); s.state().banner.t = 0;
    s.tick();
    expect(vi.mocked(drawAction).mock.lastCall![1].soloHero).toBe(hero);
    if (stage < 2) {
      s.tick(500);
      expect(s.state().stage).toBe(stage + 1);
      expect(s.phase.mock.lastCall![0]).toBe("challenge");
      s.game.completeChallenge(0); s.tick();
      expect(s.state().active).toBe(hero);
    } else {
      s.tick(500);
      expect(s.phase.mock.lastCall![0]).toBe("victory");
      expect(s.texts).toContain(soloScenes(hero, 2, "win")[0]!.caption);
    }
  }
  s.game.start("endless"); s.tick();
  expect(s.phase.mock.lastCall![1].soloHero).toBe(null);
  s.game.startPractice({hero: 1, enemy: "ghoul"}); s.tick(); s.game.quit();
  expect(s.phase.mock.lastCall![1]).toMatchObject({soloHero: null, practice: true});
  s.game.destroy();
});

it("ends a solo run when its hero dies rather than silently swapping to a teammate", () => {
  const s = setup(); s.game.startSolo(2); s.tick(); s.key("Escape"); s.game.completeChallenge(0);
  s.state().banner.t = 0; s.tick(55);
  s.tick(2200);
  expect(s.phase.mock.calls.some(([phase]) => phase === "over")).toBe(true);
  expect(s.state().active).toBe(2);
  s.game.destroy();
});

it("plays all six relocated objectives between team waves, freezes combat, and resumes exactly once", () => {
  expect(new Set(CAMPAIGN_OBJECTIVES.flat().map(({hero, stage}) => `${hero}-${stage}`)).size).toBe(6);
  const s = setup(); s.game.start("story"); s.tick(); s.key("Escape"); s.key("KeyT");
  for (let stage = 0; stage < 3; stage++) {
    for (let wave = 1; wave <= 2; wave++) {
      Object.assign(s.state(), {stage, wave, queue: []}); s.state().banner.t = 0;
      s.tick();
      expect(s.phase.mock.lastCall).toMatchObject(["challenge", {campaignObjective: CAMPAIGN_OBJECTIVES[stage]![wave - 1], stage, wave}]);
      const before = {...s.state()};
      s.tick(200);
      expect(s.state()).toMatchObject({wave, score: before.score, px: before.px, py: before.py});
      s.game.completeChallenge(800);
      expect(s.phase.mock.lastCall).toMatchObject(["playing", {campaignObjective: null, wave: wave + 1}]);
      expect(s.state().score).toBe(before.score + 800);
      s.game.completeChallenge(800);
      expect(s.state().score).toBe(before.score + 800);
    }
  }
  s.game.start("endless"); s.tick();
  expect(s.phase.mock.lastCall![1].campaignObjective).toBeNull();
  s.game.quit(); s.game.start("story"); s.tick(); s.key("Escape"); s.key("KeyT");
  Object.assign(s.state(), {stage: 0, wave: 1, queue: []}); s.state().banner.t = 0; s.tick();
  expect(s.phase.mock.lastCall![0]).toBe("challenge");
  s.game.quit();
  expect(s.phase.mock.lastCall![0]).toBe("title");
  s.game.start("endless"); s.tick();
  expect(s.phase.mock.lastCall![1]).toMatchObject({campaignObjective: null, score: 0});
  s.game.destroy();
});
