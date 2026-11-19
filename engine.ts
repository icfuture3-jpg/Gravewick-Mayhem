import { campaignObjective, type CampaignObjective } from "./campaign-objectives";
import { playCutsceneCues } from "./cutscene-effects";
import { soloScenes, SOLO_STORIES, type HeroId } from "./solo-story";
import { HERO_ABILITIES, GADGETS } from "./hero-abilities";
import type { PracticeOptions } from "./practice";
import { LESSONS, advanceLesson, type TutorialAction } from "./tutorial";
import { attractPickup, bounceAtWalls } from "./physics";
import {
  H,
  STAGE_NAMES,
  TAU,
  W,
  drawBackground,
  drawEnemy,
  drawHero,
  drawShadow,
  makeDecor,
  type Decor,
  type EnemyKind,
} from "./art";
import { createSound } from "./audio";
import { LORE, loreFor } from "./brawl/lore";
import { drawFigure } from "./heroes";
import { INTRO, arrival, bossEntrance, turningPoint, celebration, type Scene } from "./movie";
import { drawAction } from "./cinematic";

export type Mode = "story" | "endless";
export type Phase = "title" | "playing" | "paused" | "over" | "victory" | "challenge";
export interface Summary {
  score: number;
  kills: number;
  stage: number;
  wave: number;
  mode: Mode;
  practice: boolean;
  soloHero: HeroId | null;
  campaignObjective: CampaignObjective | null;
}
export interface Brawl {
  start(mode: Mode): void;
  startSolo(hero: HeroId): void;
  completeChallenge(bonus: number): void;
  startPractice(options: PracticeOptions): void;
  refill(): void;
  togglePause(): void;
  quit(): void;
  setMuted(muted: boolean): void;
  destroy(): void;
}

const PAD = 36;
const PLAYER_R = 14;

const HEROES = HERO_ABILITIES.map((hero, i) => ({
  ...hero,
  speed: [235, 215, 225][i]!,
  primaryCd: [0.38, 0.55, 0.28][i]!,
  barks: [
    ["Your time is up.", "Another soul for the pile.", "Boo-hoo."],
    ["Ham time!", "Whoa, I did that?", "Hee hee hee!"],
    ["Pathetic.", "Do as I say.", "Smile. Now."],
  ][i]!,
}));

const STAGE_CUTS: [number, string][][] = [
  [
    [0, "Well, well, well... what have we wandered into?"],
    [1, "Ooh, a spooky place! Can I whack something?"],
    [2, "Try to keep up, you two. I'll handle the thinking."],
  ],
  [[2, "These halls are colder than I expected."], [1, "Cold? I'm in shorts!"]],
  [[0, "The Hollow Court. Stay close, apprentices."], [2, "For once, I agree with you."]],
];
const BOSS_CUTS: [number, string][] = [
  [1, "That one is HUGE. I love it!"],
  [2, "Illusion time. Try to keep up!"],
  [0, "Last one. Make Gravewick proud!"],
];
const CLEAR_CUTS = ["Not bad, not bad at all.", "Hmph. Fine. I'm impressed.", "Another one down!"];

const ENEMY: Record<
  EnemyKind,
  { hp: number; r: number; speed: number; touch: number; name: string; score: number }
> = {
  clown: { hp: 40, r: 16, speed: 115, touch: 8, name: "Nightmare Clown", score: 100 },
  bat: { hp: 26, r: 13, speed: 95, touch: 5, name: "Eyeball Bat", score: 120 },
  ghoul: { hp: 130, r: 22, speed: 62, touch: 0, name: "Bone Ghoul", score: 250 },
  slime: { hp: 55, r: 20, speed: 55, touch: 7, name: "Ecto Slime", score: 130 },
  minislime: { hp: 20, r: 12, speed: 85, touch: 4, name: "Slimelet", score: 40 },
  boogeyman: { hp: 700, r: 44, speed: 45, touch: 12, name: "The Boogeyman", score: 2000 },
  nergal: { hp: 900, r: 46, speed: 38, touch: 12, name: "Lord Nergal", score: 3000 },
  meteor: { hp: 1100, r: 54, speed: 0, touch: 0, name: "Brain Meteor", score: 4000 },
};

const BOSSES: EnemyKind[] = ["boogeyman", "nergal", "meteor"];

interface Enemy {
  kind: EnemyKind;
  x: number;
  y: number;
  hp: number;
  max: number;
  r: number;
  kx: number;
  ky: number;
  freeze: number;
  flash: number;
  atk: number;
  t1: number;
  t2: number;
  state: number;
  phase: number;
  boss: boolean;
}

interface Shot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  dmg: number;
  friendly: boolean;
  life: number;
  kind: "bolt" | "pie" | "snot" | "laser" | "orb";
  bounces: number;
  gadget?: number;
}

interface Zone {
  kind: "rift" | "meteor" | "sweep";
  x: number;
  y: number;
  r: number;
  t: number;
  dur: number;
  ang: number;
  dealt: boolean;
  tick: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
}

interface Float {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

interface Slash {
  x: number;
  y: number;
  ang: number;
  arc: number;
  range: number;
  life: number;
  color: string;
}

interface HeroState {
  hp: number;
  cdPrimary: number;
  cdSkill: number;
}

export function makeWave(mode: Mode, stage: number, wave: number): EnemyKind[] {
  const list: EnemyKind[] = [];
  const s = mode === "story" ? stage + 1 : 1 + Math.floor(wave / 3);
  const w = mode === "story" ? wave : wave % 3;
  const clowns = mode === "story" ? 2 + s + w : 2 + Math.ceil((wave + 1) / 2);
  const bats = mode === "story" ? (w >= 1 ? s + w - 1 : 0) : Math.floor((wave + 1) / 2);
  const ghouls =
    mode === "story"
      ? (w >= 2 ? 1 : 0) + (s >= 2 ? s - 1 : 0)
      : Math.floor((wave + 1) / 3);
  const slimes = mode === "story" ? (w >= 1 ? w + s - 1 : 0) : Math.floor((wave + 2) / 3);
  for (let i = 0; i < clowns; i += 1) {
    list.push("clown");
  }
  for (let i = 0; i < bats; i += 1) {
    list.push("bat");
  }
  for (let i = 0; i < ghouls; i += 1) {
    list.push("ghoul");
  }
  for (let i = 0; i < slimes; i += 1) {
    list.push("slime");
  }
  return list.sort(() => Math.random() - 0.5);
}

export function createBrawl(
  canvas: HTMLCanvasElement,
  onPhase: (phase: Phase, summary: Summary) => void,
  onMuted?: (muted: boolean) => void,
): Brawl {
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    throw new Error("Canvas is not available");
  }
  const sound = createSound();
  let lesson = 0;
  let tutorial = false;
  let practice: PracticeOptions | null = null;
  let soloHero: HeroId | null = null;
  let objective: CampaignObjective | null = null;
  let ultimateCharges = [100,100,100];
  let ultimateHintUntil = 0;
  let cast: {hero: number; ultimate: boolean; t: number; x: number; y: number} | null = null;
  const learn = (action: TutorialAction) => { if (tutorial) lesson = advanceLesson(lesson, action); };
  const keys = new Set<string>();
  const pendingActions = new Set<"attack" | "skill" | "ultimate">();
  let lastMouseMove = -10;
  const bossTurns = new Set<number>();
  let movie: { scenes: Scene[]; i: number; t: number; done: () => void } | null = null;
  const mouse = { x: W * 0.7, y: H * 0.5, left: false, right: false };

  const g = {
    phase: "title" as Phase,
    mode: "story" as Mode,
    stage: 0,
    wave: 0,
    time: 0,
    score: 0,
    kills: 0,
    combo: 0,
    comboT: 0,
    ult: 0,
    hitstop: 0,
    shake: 0,
    active: 0,
    swing: 0,
    invuln: 0,
    shrink: 0,
    invisible: 0,
    swapT: 0,
    px: W / 2,
    py: H / 2 + 60,
    aim: 0,
    hitCount: 0,
    banner: { text: "", sub: "", t: 0 },
    bark: { text: "", t: 0, who: 0 },
    cuts: [] as { idx: number; text: string }[],
    cutT: 0,
    stageClearT: 0,
    queue: [] as EnemyKind[],
    spawnT: 0,
    decor: makeDecor() as Decor[],
    lastEnemyName: "",
    dashT: 0,
    dashCd: 0,
    dx: 1,
    dy: 0,
    chain: 0,
    chainT: 0,
    zoom: 0,
    flashT: 0,
    flashColor: "#fff",
    moving: 0,
  };
  let portals: {x: number; y: number; t: number}[] = [];
  let hidden: {x: number; y: number}[] = [];
  let decoys: {x: number; y: number; t: number; hp: number; shotCd: number}[] = [];
  const playerRadius = () => PLAYER_R * (g.shrink > 0 ? 0.45 : 1);
  const enemyTarget = (x: number, y: number) => {
    const targets = [...decoys.filter((d) => d.hp > 0 && d.t > 0), ...(g.invisible > 0 ? [] : [{x: g.px, y: g.py}])];
    return targets.sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
  };
  const reveal = (x: number, y: number, radius: number) => {
    hidden = hidden.filter((supply) => {
      if (Math.hypot(supply.x - x, supply.y - y) > radius) return true;
      pickups.push({...supply, t: 0});
      floats.push({...supply, text: "Hidden supply revealed!", life: 1.8, color: "#ffd36a"});
      return false;
    });
  };
  let heroes: HeroState[] = [];
  let enemies: Enemy[] = [];
  let shots: Shot[] = [];
  let zones: Zone[] = [];
  let parts: Particle[] = [];
  let floats: Float[] = [];
  let slashes: Slash[] = [];
  let rings: { x: number; y: number; r: number; max: number; life: number; color: string }[] = [];
  let pickups: { x: number; y: number; t: number }[] = [];
  const embers = Array.from({ length: 40 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 0.5 + Math.random() * 1.5, p: Math.random() * 6 }));
  let raf = 0;
  let last = performance.now();

  const summary = (): Summary => ({
    score: Math.floor(g.score),
    kills: g.kills,
    stage: g.stage,
    wave: g.wave,
    mode: g.mode,
    practice: practice !== null,
    soloHero,
    campaignObjective: objective,
  });

  const setPhase = (phase: Phase) => {
    g.phase = phase;
    bookOpen = false;
    if (phase !== "playing" && phase !== "paused") {
      g.shake = 0;
      g.zoom = 0;
      g.flashT = 0;
    }
    onPhase(phase, summary());
  };

  const say = (who: number, text: string) => {
    if (soloHero !== null && who !== soloHero) return;
    g.bark = { text, t: 2.2, who };
  };

  const burst = (x: number, y: number, color: string, n: number, speed = 200) => {
    for (let i = 0; i < n; i += 1) {
      const a = Math.random() * TAU;
      const v = speed * (0.3 + Math.random() * 0.8);
      parts.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0.5 + Math.random() * 0.4,
        max: 0.9,
        color,
        size: 2 + Math.random() * 4,
      });
    }
  };

  const ring = (x: number, y: number, max: number, color: string, life = 0.45) => {
    rings.push({ x, y, r: 0, max, life, color });
  };

  const discovered = new Set<string>();
  let bookOpen = false;
  let toast: { name: string; tip: string; t: number } | null = null;
  const discover = (kind: EnemyKind) => {
    const lore = loreFor(kind);
    if (lore === undefined || discovered.has(lore.kind)) return;
    discovered.add(lore.kind);
    toast = { name: lore.name, tip: lore.tip, t: 5.5 };
    g.ult = Math.min(100, g.ult + 15);
    g.score += 50;
    sound.tone(660, "sine", 0.25, 0.1, 400);
  };
  const spawnEnemy = (kind: EnemyKind, x: number, y: number) => {
    discover(kind);
    const def = ENEMY[kind];
    const boss = BOSSES.includes(kind);
    enemies.push({
      kind,
      x,
      y,
      hp: def.hp * (soloHero === null ? 1 : 0.7),
      max: def.hp * (soloHero === null ? 1 : 0.7),
      r: def.r,
      kx: 0,
      ky: 0,
      freeze: 0,
      flash: 0,
      atk: 0.5,
      t1: 1.5 + Math.random(),
      t2: 4,
      state: 0,
      phase: 0,
      boss,
    });
  };

  const edgeSpawn = (kind: EnemyKind) => {
    const side = Math.floor(Math.random() * 4);
    const x = side === 0 ? PAD : side === 1 ? W - PAD : PAD + Math.random() * (W - PAD * 2);
    const y = side === 2 ? PAD : side === 3 ? H - PAD : PAD + Math.random() * (H - PAD * 2);
    spawnEnemy(kind, x, y);
    burst(x, y, "#b07aff", 10, 120);
  };

  const clampPlayer = () => {
    g.px = Math.min(W - PAD, Math.max(PAD, g.px));
    g.py = Math.min(H - PAD, Math.max(PAD, g.py));
  };

  const heal = (idx: number, amount: number) => {
    const h = heroes[idx];
    if (h !== undefined && h.hp > 0) {
      h.hp = Math.min(100, h.hp + amount);
    }
  };

  const killEnemy = (e: Enemy) => {
    enemies = enemies.filter((o) => o !== e);
    g.kills += 1;
    g.combo += 1;
    g.comboT = 2.5;
    g.score += ENEMY[e.kind].score * (1 + Math.min(g.combo, 40) * 0.05);
    burst(e.x, e.y, e.kind === "slime" || e.kind === "minislime" ? "#7ee03a" : "#ffd36a", e.boss ? 60 : 16);
    g.hitstop = Math.max(g.hitstop, e.boss ? 0.25 : 0.05);
    g.shake = Math.max(g.shake, e.boss ? 18 : 5);
    sound.tone(180, "square", 0.18, 0.12, -120);
    ring(e.x, e.y, e.r * 2.6, e.boss ? "#ffd36a" : "#ffffff", e.boss ? 0.8 : 0.35);
    g.zoom = Math.max(g.zoom, e.boss ? 0.08 : 0.015);
    if (e.boss) {
      g.flashT = 0.35;
      g.flashColor = "#ffe9a0";
    }
    if (Math.random() < (e.boss ? 1 : 0.14)) {
      pickups.push({ x: e.x, y: e.y, t: 0 });
    }
    if (e.kind === "slime") {
      spawnEnemy("minislime", e.x - 14, e.y);
      spawnEnemy("minislime", e.x + 14, e.y);
    }
    if (g.combo === 8 || g.combo === 20) {
      say(g.active, g.combo === 8 ? "Combo!" : "Mayhem!");
    }
  };

  const hurtEnemy = (e: Enemy, dmg: number, fromX: number, fromY: number, knock: number) => {
    if (!enemies.includes(e)) {
      return;
    }
    e.hp -= dmg;
    e.flash = 0.1;
    const a = Math.atan2(e.y - fromY, e.x - fromX);
    const k = e.boss ? knock * 0.15 : knock;
    e.kx += Math.cos(a) * k;
    e.ky += Math.sin(a) * k;
    g.ult = Math.min(100, g.ult + dmg * 0.18);
    floats.push({ x: e.x, y: e.y - e.r, text: String(Math.round(dmg)), life: 0.7, color: "#fff7b0" });
    burst(e.x, e.y, "#fff", 4, 140);
    burst(e.x, e.y, "#ffd36a", 3, 260);
    g.zoom = Math.max(g.zoom, 0.01);
    if (dmg >= 25) {
      g.hitstop = Math.max(g.hitstop, 0.06);
      g.shake = Math.max(g.shake, 6);
    }
    g.hitCount += 1;
    if (e.hp <= 0) {
      killEnemy(e);
    }
  };

  const allDead = () => heroes.every((h) => h.hp <= 0);

  const hurtPlayer = (dmg: number) => {
    if (g.invuln > 0 || g.phase !== "playing") {
      return;
    }
    const h = heroes[g.active];
    if (h === undefined) {
      return;
    }
    if (g.shrink > 0) dmg *= 0.5;
    if (soloHero !== null) dmg *= 0.7;
    h.hp = Math.max(0, h.hp - dmg);
    g.invuln = 0.45;
    g.shake = Math.max(g.shake, 9);
    g.combo = 0;
    burst(g.px, g.py, "#ff4a4a", 8, 160);
    floats.push({ x: g.px, y: g.py - 26, text: `-${Math.round(dmg)}`, life: 0.7, color: "#ff6a6a" });
    sound.tone(120, "sawtooth", 0.2, 0.15, -60);
    if (h.hp <= 0) {
      if (allDead()) {
        sound.music(false);
        setPhase("over");
        return;
      }
      const next = heroes.findIndex((o) => o.hp > 0);
      g.shrink = 0;
      g.invisible = 0;
      ultimateCharges[g.active] = g.ult;
      g.active = next;
      g.ult = ultimateCharges[next]!;
      g.swapT = 0.5;
      say(next, "I got this!");
    }
  };

  const swapTo = (idx: number) => {
    const h = heroes[idx];
    if (soloHero !== null || h === undefined || h.hp <= 0 || idx === g.active) {
      return;
    }
    g.shrink = 0;
    g.invisible = 0;
    ultimateCharges[g.active] = g.ult;
    g.active = idx;
    g.ult = ultimateCharges[idx]!;
    learn("swap");
    g.invuln = Math.max(g.invuln, 0.5);
    g.swapT = 0.35;
    burst(g.px, g.py, HEROES[idx]?.color ?? "#fff", 14, 160);
    sound.tone(520, "triangle", 0.15, 0.12, 400);
    say(idx, HEROES[idx]?.barks[0] ?? "");
  };

    const primary = () => {
    const def = HEROES[g.active];
    const h = heroes[g.active];
    if (def === undefined || h === undefined || h.cdPrimary > 0) {
      return;
    }
    g.invisible = 0;
    if (g.active === 0) reveal(g.px, g.py, 180);
    h.cdPrimary = def.primaryCd;
    learn("attack");
    const a = g.aim;
    g.swing = 1;
    if (g.active === 2) {
      const speed = 560;
      shots.push({
        x: g.px + Math.cos(a) * 20,
        y: g.py + Math.sin(a) * 20,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        r: 9,
        dmg: 15,
        friendly: true,
        life: 1.1,
        kind: "bolt",
        bounces: 0,
      });
      sound.tone(700, "sine", 0.15, 0.1, -300);
      return;
    }
    const heavy = g.active === 1;
    g.chain = g.chainT > 0 ? (g.chain + 1) % 3 : 0;
    g.chainT = 0.7;
    const finisher = g.chain === 2;
    const range = (heavy ? 78 : 105) * (finisher ? 1.3 : 1);
    const arc = (heavy ? 1.3 : 1.0) * (finisher ? 1.5 : 1);
    const dmg = (heavy ? 26 : 18) * (finisher ? 1.7 : 1);
    g.px += Math.cos(a) * (finisher ? 34 : 14);
    g.py += Math.sin(a) * (finisher ? 34 : 14);
    clampPlayer();
    if (finisher) {
      ring(g.px, g.py, range, "#ffffff", 0.3);
      g.shake = Math.max(g.shake, 7);
    }
    slashes.push({ x: g.px, y: g.py, ang: a + (g.chain === 1 ? 0.25 : 0), arc, range, life: finisher ? 0.28 : 0.18, color: heavy ? "#ffd0e0" : "#d6c4ff" });
    sound.noise(0.12, 0.12);
    sound.tone(heavy ? 150 : 300, "square", 0.1, 0.07, -80);
    for (const e of [...enemies]) {
      const d = Math.hypot(e.x - g.px, e.y - g.py);
      if (d > range + e.r) {
        continue;
      }
      let diff = Math.atan2(e.y - g.py, e.x - g.px) - a;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      if (Math.abs(diff) <= arc || d < e.r + 20) {
        hurtEnemy(e, dmg, g.px, g.py, heavy ? 520 : 380);
      }
    }
  };

  const skill = () => {
    const def = HEROES[g.active];
    const h = heroes[g.active];
    if (def === undefined || h === undefined || h.cdSkill > 0) {
      return;
    }
    cast = {hero: g.active, ultimate: false, t: 0.7, x: g.px, y: g.py};
    h.cdSkill = def.skillCd;
    learn("skill");
    const a = g.aim;
    if (g.active === 0) {
      const d = Math.min(260, Math.hypot(mouse.x - g.px, mouse.y - g.py));
      portals = [{x: g.px, y: g.py, t: 1.4}];
      g.px += Math.cos(a) * d;
      g.py += Math.sin(a) * d;
      clampPlayer();
      portals.push({x: g.px, y: g.py, t: 1.4});
      reveal(g.px, g.py, 180);
      g.invuln = Math.max(g.invuln, 0.4);
      zones.push({
        kind: "rift",
        x: g.px,
        y: g.py,
        r: 120,
        t: 0,
        dur: 3,
        ang: 0,
        dealt: false,
        tick: 0,
      });
      sound.tone(90, "sawtooth", 0.6, 0.15, 60);
    } else if (g.active === 1) {
      const gadget = Math.floor(Math.random() * GADGETS.length);
      floats.push({x: g.px, y: g.py - 35, text: GADGETS[gadget]!.name, life: 1.5, color: GADGETS[gadget]!.color});
      shots.push({
        x: g.px,
        y: g.py,
        vx: Math.cos(a) * 400,
        vy: Math.sin(a) * 400,
        r: 12,
        dmg: 0,
        friendly: true,
        life: 2.2,
        kind: "pie",
        gadget,
        bounces: 2,
      });
      sound.tone(400, "square", 0.15, 0.1, 200);
    } else {
      g.invisible = 5;
      burst(g.px, g.py, "#b8caff", 24, 220);
      sound.tone(900, "sine", 0.5, 0.12, -600);
    }
  };

  const ultimate = () => {
    if (g.ult < 100) {
      return;
    }
    g.ult = 0;
    ultimateCharges[g.active] = 0;
    const idx = g.active;
    cast = {hero: idx, ultimate: true, t: 1.1, x: g.px, y: g.py};
    say(idx, HEROES[idx]?.ultName ?? "");
    g.shake = 26;
    g.hitstop = 0.12;
    g.zoom = 0.1;
    g.flashT = 0.3;
    g.flashColor = HEROES[idx]?.color ?? "#fff";
    g.invisible = 0;
    if (idx === 0) {
      reveal(g.px, g.py, Infinity);
      for (const e of [...enemies]) hurtEnemy(e, 90, g.px, g.py, 300);
      sound.tone(260, "triangle", 0.7, 0.18, 400);
      burst(g.px, g.py, "#ffd36a", 40, 500);
    } else if (idx === 1) {
      g.shrink = 6;
      sound.tone(600, "square", 0.4, 0.12, 600);
      burst(g.px, g.py, "#c4d443", 20, 250);
    } else {
      decoys = [-1, 1].map((side) => ({
        x: Math.min(W - PAD, Math.max(PAD, g.px + side * 100)),
        y: Math.min(H - PAD, Math.max(PAD, g.py - 70)),
        t: 6, hp: 3, shotCd: 0,
      }));
      sound.tone(800, "sine", 0.8, 0.14, -650);
      burst(g.px, g.py, "#ff8fe8", 24, 150);
    }
  };

  const startStage = (stage: number) => {
    g.stage = stage;
    portals = [];
    decoys = [];
    hidden = [{x: 180, y: 200}, {x: W - 180, y: 200}, {x: W / 2, y: H - 130}];
    g.wave = 0;
    g.decor = makeDecor();
    enemies = [];
    shots = [];
    zones = [];
    g.queue = [];
    g.banner = { text: STAGE_NAMES[stage] ?? "Endless Mayhem", sub: "Stage " + (stage + 1), t: 2.6 };
    g.cuts = [];
    g.cutT = 3;
    if (g.mode === "story" && soloHero === null) {
      const lines = STAGE_CUTS[stage] ?? [];
      g.cuts = lines.map(([idx, text]) => ({ idx, text }));
    }
  };

  const nextWave = () => {
    g.wave += 1;
    if (soloHero !== null) heal(soloHero, 15);
    g.spawnT = 0.8;
    if (g.mode === "story") {
      if (g.wave <= 3) {
        g.queue = makeWave("story", g.stage, g.wave - 1);
        g.banner = { text: `Wave ${g.wave}`, sub: STAGE_NAMES[g.stage] ?? "", t: 1.6 };
      } else {
        const boss = BOSSES[g.stage] ?? "boogeyman";
        g.queue = [boss];
        g.banner = { text: ENEMY[boss].name, sub: "Boss fight", t: 2.4 };
        const [bi, bt] = BOSS_CUTS[g.stage] ?? BOSS_CUTS[0] ?? [0, ""];
        g.cuts = soloHero === null ? [{ idx: bi, text: bt }] : [];
        g.cutT = 3;
        playMovie(soloHero === null ? bossEntrance(g.stage) : soloScenes(soloHero, g.stage, "boss"), () => {});
      }
    } else if (g.wave % 6 === 0) {
      const boss = BOSSES[(g.wave / 6 - 1) % 3] ?? "boogeyman";
      g.queue = [boss];
      g.banner = { text: ENEMY[boss].name, sub: `Wave ${g.wave}`, t: 2.4 };
    } else {
      g.queue = makeWave("endless", 0, g.wave);
      g.banner = { text: `Wave ${g.wave}`, sub: "Endless mayhem", t: 1.6 };
    }
  };

  const movieSound = (scene: Scene | undefined) => {
    if (scene === undefined) return;
    if (scene.action === "gadget" || scene.action === "team") sound.noise(0.3, 0.12);
    sound.tone(scene.action === "victory" ? 660 : scene.action === "portal" ? 180 : 440,
      "triangle", 0.6, 0.1, scene.action === "victory" ? 330 : 120);
  };
  const playMovie = (scenes: Scene[], done: () => void) => {
    movie = { scenes, i: 0, t: 0, done };
    movieSound(scenes[0]);
    mv.camX = 0;
    mv.zoom = 1;
    mv.last = g.time;
    keys.clear();
    pendingActions.clear();
    mouse.left = false;
    mouse.right = false;
  };
  const advanceMovie = () => {
    if (movie === null) return;
    const full = (movie.scenes[movie.i]?.text.length ?? 0) / 40;
    if (movie.t < full) {
      movie.t = full;
      return;
    }
    movie.i += 1;
    movie.t = 0;
    if (movie.i >= movie.scenes.length) endMovie();
    else movieSound(movie.scenes[movie.i]);
  };
  const endMovie = () => {
    const m = movie;
    movie = null;
    keys.clear();
    pendingActions.clear();
    mouse.left = false;
    mouse.right = false;
    last = performance.now();
    m?.done();
  };

  const start = (mode: Mode, hero: HeroId | null = null) => {
    soloHero = hero;
    objective = null;
    practice = null;
    movie = null;
    bossTurns.clear();
    cast = null;
    keys.clear();
    pendingActions.clear();
    mouse.left = false;
    mouse.right = false;
    g.mode = mode;
    tutorial = mode === "story" && soloHero === null;
    lesson = 0;
    g.score = 0;
    g.kills = 0;
    g.combo = 0;
    ultimateCharges = [100,100,100];
    ultimateHintUntil = 0;
    g.ult = 100;
    g.active = soloHero ?? 0;
    g.px = W / 2;
    g.py = H / 2 + 60;
    g.invuln = 1;
    g.shrink = 0;
    g.invisible = 0;
    g.stageClearT = 0;
    heroes = HEROES.map((_, i) => ({ hp: soloHero === null || soloHero === i ? 100 : 0, cdPrimary: 0, cdSkill: 0 }));
    parts = [];
    rings = [];
    pickups = [];
    floats = [];
    slashes = [];
    startStage(0);
    sound.music(true);
    say(0, "Let's make some mayhem.");
    setPhase("playing");
    if (mode === "story") {
      if (soloHero === null) playMovie(INTRO, () => {});
      else playMovie(soloScenes(soloHero, 0, "arrival"), () => setPhase("challenge"));
    }
  };

  const chase = (e: Enemy, speed: number, dt: number, tx: number, ty: number) => {
    const a = Math.atan2(ty - e.y, tx - e.x);
    e.x += Math.cos(a) * speed * dt;
    e.y += Math.sin(a) * speed * dt;
  };

  const fire = (
    x: number,
    y: number,
    a: number,
    speed: number,
    dmg: number,
    kind: Shot["kind"],
    r = 8,
  ) => {
    shots.push({
      x,
      y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      r,
      dmg,
      friendly: false,
      life: 5,
      kind,
      bounces: 0,
    });
  };

  // Early waves are gentler: enemies move and attack more slowly.
  const earlyEase = () => {
    const early = g.mode === "story" ? g.stage === 0 : true;
    if (!early) return 1;
    return g.wave <= 1 ? 0.65 : g.wave === 2 ? 0.8 : 1;
  };

  const updateEnemy = (e: Enemy, rawDt: number) => {
    const dt = e.boss ? rawDt : rawDt * earlyEase();
    e.flash -= dt;
    e.atk -= dt;
    e.x += e.kx * dt;
    e.y += e.ky * dt;
    const decay = Math.pow(0.0005, dt);
    e.kx *= decay;
    e.ky *= decay;
    if (e.freeze > 0) {
      e.freeze -= dt;
      return;
    }
    const target = enemyTarget(e.x, e.y);
    if (target === undefined) return;
    const dx = target.x - e.x;
    const dy = target.y - e.y;
    const dist = Math.hypot(dx, dy);
    const toward = Math.atan2(dy, dx);
    const def = ENEMY[e.kind];
    e.t1 -= dt;
    e.t2 -= dt;
    switch (e.kind) {
      case "clown": {
        const wobble = 1 + 0.4 * Math.sin(g.time * 4 + e.hp);
        chase(e, def.speed * wobble, dt, target.x, target.y);
        break;
      }
      case "slime":
      case "minislime":
        chase(e, def.speed, dt, target.x, target.y);
        break;
      case "bat": {
        const side = e.hp % 2 > 1 ? 1 : -1;
        if (dist > 270) {
          chase(e, def.speed, dt, target.x, target.y);
        } else if (dist < 190) {
          chase(e, -def.speed, dt, target.x, target.y);
        } else {
          e.x += Math.cos(toward + side * 1.57) * def.speed * 0.6 * dt;
          e.y += Math.sin(toward + side * 1.57) * def.speed * 0.6 * dt;
        }
        if (e.t1 <= 0.4 && e.state === 0) {
          e.state = 1;
        }
        if (e.t1 <= 0) {
          fire(e.x, e.y, toward, 330, 7, "laser", 5);
          e.t1 = 2 + Math.random();
          e.state = 0;
        }
        break;
      }
      case "ghoul": {
        if (e.state === 0) {
          chase(e, def.speed, dt, target.x, target.y);
          if (dist < 85 && e.t1 <= 0) {
            e.state = 1;
            e.t2 = 0.75;
          }
        } else {
          if (e.t2 <= 0) {
            for (const d of decoys) { if (Math.hypot(e.x - d.x, e.y - d.y) < 100 + PLAYER_R) d.hp -= 1; }
            if (Math.hypot(e.x - g.px, e.y - g.py) < 100 + playerRadius()) {
              hurtPlayer(24);
            }
            burst(e.x + Math.cos(toward) * 60, e.y + Math.sin(toward) * 60, "#ffd36a", 14, 220);
            g.shake = Math.max(g.shake, 8);
            e.state = 0;
            e.t1 = 1.4;
          }
        }
        break;
      }
      case "boogeyman": {
        if (dist > 190) {
          chase(e, def.speed, dt, target.x, target.y);
        }
        if (e.t1 <= 0) {
          for (let i = -2; i <= 2; i += 1) {
            fire(e.x, e.y, toward + i * 0.22, 240, 9, "snot", 10);
          }
          e.t1 = 2.4;
          sound.tone(110, "square", 0.25, 0.14, -40);
        }
        if (e.t2 <= 0) {
          edgeSpawn("clown");
          edgeSpawn("clown");
          e.t2 = 9;
          say(0, "Illusions!");
        }
        break;
      }
      case "nergal": {
        if (dist > 230) {
          chase(e, def.speed, dt, target.x, target.y);
        }
        if (e.t1 <= 0) {
          for (let i = 0; i < 10; i += 1) {
            fire(e.x, e.y, (i / 10) * TAU + g.time, 170, 8, "orb", 9);
          }
          e.t1 = 3.6;
        }
        if (e.t2 <= 0) {
          zones.push({
            kind: "sweep",
            x: e.x,
            y: e.y,
            r: 330,
            t: 0,
            dur: 1.8,
            ang: toward - 1.1,
            dealt: false,
            tick: 0,
          });
          e.t2 = 5;
        }
        break;
      }
      case "meteor": {
        if (e.t1 <= 0) {
          zones.push({
            kind: "meteor",
            x: target.x,
            y: target.y,
            r: 80,
            t: 0,
            dur: 1.1,
            ang: 0,
            dealt: false,
            tick: 0,
          });
          e.t1 = 2.1;
        }
        if (e.t2 <= 0) {
          edgeSpawn("slime");
          edgeSpawn("slime");
          e.t2 = 10;
          say(0, "Brain pods!");
        }
        break;
      }
    }
    const decoy = decoys.find((d) => Math.hypot(e.x - d.x, e.y - d.y) < e.r + PLAYER_R);
    if (def.touch > 0 && decoy !== undefined && e.atk <= 0) { decoy.hp -= 1; e.atk = 0.9; }
    if (def.touch > 0 && Math.hypot(e.x - g.px, e.y - g.py) < e.r + playerRadius() && e.atk <= 0) {
      hurtPlayer(def.touch);
      e.atk = 0.9;
    }
    e.x = Math.min(W - 10, Math.max(10, e.x));
    e.y = Math.min(H - 10, Math.max(10, e.y));
  };

  const updateShots = (dt: number) => {
    for (const s of [...shots]) {
      if (s.kind === "laser" && !s.friendly) {
        const angle = Math.atan2(s.vy, s.vx);
        const focus = enemyTarget(s.x, s.y);
        const target = focus === undefined ? angle : Math.atan2(focus.y - s.y, focus.x - s.x);
        const difference = Math.atan2(Math.sin(target - angle), Math.cos(target - angle));
        const turn = Math.max(-dt * 0.7, Math.min(dt * 0.7, difference));
        const speed = Math.hypot(s.vx, s.vy);
        s.vx = Math.cos(angle + turn) * speed;
        s.vy = Math.sin(angle + turn) * speed;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      const out = s.x < 10 || s.x > W - 10 || s.y < 10 || s.y > H - 10;
      const explode = () => {
        shots = shots.filter((o) => o !== s);
        const gadget = GADGETS[s.gadget ?? 0]!;
        burst(s.x, s.y, gadget.color, 30, 320);
        ring(s.x, s.y, 105, gadget.color, 0.5);
        g.shake = Math.max(g.shake, 14);
        g.hitstop = Math.max(g.hitstop, 0.05);
        sound.noise(0.4, 0.22);
        for (const e of [...enemies]) {
          if (Math.hypot(e.x - s.x, e.y - s.y) < 105 + e.r) {
            if (!e.boss) e.freeze = Math.max(e.freeze, gadget.freeze);
            hurtEnemy(e, gadget.damage, s.x, s.y, gadget.knock);
          }
        }
      };
      if (s.kind === "pie") {
        const exhausted = bounceAtWalls(s, W, H);
        if (enemies.some((e) => Math.hypot(e.x - s.x, e.y - s.y) < e.r + s.r) || s.life <= 0 || exhausted) {
          explode();
        }
        continue;
      }
      if (s.life <= 0 || out) {
        shots = shots.filter((o) => o !== s);
        continue;
      }
      if (s.friendly) {
        const hit = enemies.find((e) => Math.hypot(e.x - s.x, e.y - s.y) < e.r + s.r);
        if (hit !== undefined) {
          shots = shots.filter((o) => o !== s);
          hurtEnemy(hit, s.dmg, s.x - s.vx * 0.01, s.y - s.vy * 0.01, 260);
        }
      } else if (decoys.some((d) => {
        if (Math.hypot(d.x - s.x, d.y - s.y) >= PLAYER_R + s.r) return false;
        d.hp -= 1;
        return true;
      })) {
        shots = shots.filter((o) => o !== s);
      } else if (Math.hypot(g.px - s.x, g.py - s.y) < playerRadius() + s.r) {
        shots = shots.filter((o) => o !== s);
        hurtPlayer(s.dmg);
      }
    }
  };

  const updateZones = (dt: number) => {
    for (const z of [...zones]) {
      z.t += dt;
      if (z.kind === "rift") {
        z.tick -= dt;
        for (const e of enemies) {
          const d = Math.hypot(z.x - e.x, z.y - e.y);
          if (d < z.r * 1.8 && d > 4) {
            const pull = e.boss ? 40 : 190;
            e.x += ((z.x - e.x) / d) * pull * dt;
            e.y += ((z.y - e.y) / d) * pull * dt;
          }
        }
        if (z.tick <= 0) {
          z.tick = 0.25;
          for (const e of [...enemies]) {
            if (Math.hypot(z.x - e.x, z.y - e.y) < z.r + e.r) {
              hurtEnemy(e, 8, z.x, z.y, 0);
            }
          }
        }
      } else if (z.kind === "meteor" && z.t >= z.dur && !z.dealt) {
        z.dealt = true;
        burst(z.x, z.y, "#ff7a2a", 30, 300);
        g.shake = Math.max(g.shake, 12);
        sound.noise(0.4, 0.2);
        for (const d of decoys) { if (Math.hypot(d.x - z.x, d.y - z.y) < z.r + PLAYER_R) d.hp -= 1; }
        if (Math.hypot(g.px - z.x, g.py - z.y) < z.r + playerRadius()) {
          hurtPlayer(20);
        }
      } else if (z.kind === "sweep" && z.t > 0.8 && !z.dealt) {
        const a = z.ang + (z.t - 0.8) * 2.2;
        const rel = (g.px - z.x) * Math.cos(a) + (g.py - z.y) * Math.sin(a);
        const perp = Math.abs(-(g.px - z.x) * Math.sin(a) + (g.py - z.y) * Math.cos(a));
        if (rel > 0 && rel < z.r && perp < 12 + playerRadius()) {
          z.dealt = true;
          hurtPlayer(18);
        }
      }
      if (z.t >= z.dur + (z.kind === "meteor" ? 0.2 : 0)) {
        zones = zones.filter((o) => o !== z);
      }
    }
  };

  const update = (dt: number) => {
    g.time += dt;
    if (bookOpen && g.phase === "playing") return;
    if (movie !== null) {
      const previous = movie.t;
      movie.t += dt;
      const scene = movie.scenes[movie.i];
      if (scene) playCutsceneCues(sound, scene.action, scene.duration, previous, movie.t);
      if (scene !== undefined && movie.t >= scene.duration) {
        movie.i += 1;
        movie.t = 0;
        if (movie.i >= movie.scenes.length) endMovie();
        else movieSound(movie.scenes[movie.i]);
      }
      return;
    }
    if (cast !== null) { cast.t -= dt; if (cast.t <= 0) cast = null; }
    if (toast !== null) {
      toast.t -= dt;
      if (toast.t <= 0) toast = null;
    }
    if (g.phase !== "playing") {
      return;
    }
    if (g.hitstop > 0) {
      g.hitstop -= dt;
      return;
    }
    if (g.mode === "story" && practice === null && !bossTurns.has(g.stage) &&
      enemies.some((e) => e.boss && e.hp > 0 && e.hp <= e.max / 2)) {
      bossTurns.add(g.stage);
      playMovie(soloHero === null ? turningPoint(g.stage) : soloScenes(soloHero, g.stage, "turn"), () => {});
      return;
    }
    // Independent hero meters recharge only during active gameplay, never in menus/cutscenes.
    g.ult = Math.min(100,g.ult + dt * (100 / 12));
    for(let i=0;i<ultimateCharges.length;i++) if(i!==g.active) ultimateCharges[i] = Math.min(100,ultimateCharges[i]! + dt * (100 / 12));
    // Input.
    let mx = 0;
    let my = 0;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) mx -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) mx += 1;
    if (keys.has("KeyW") || keys.has("ArrowUp")) my -= 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) my += 1;
    const len = Math.hypot(mx, my);
    const def = HEROES[g.active];
    g.moving = len > 0 ? 1 : 0;
    if (len > 0) learn("move");
    if (len > 0) {
      g.dx = mx / len;
      g.dy = my / len;
    }
    g.dashCd -= dt;
    if ((keys.has("ShiftLeft") || keys.has("ShiftRight")) && g.dashCd <= 0 && g.dashT <= 0) {
      g.dashT = 0.17;
      learn("dash");
      g.dashCd = 0.8;
      g.invuln = Math.max(g.invuln, 0.3);
      sound.noise(0.15, 0.1);
      sound.tone(500, "triangle", 0.15, 0.08, -300);
    }
    if (g.dashT > 0) {
      g.dashT -= dt;
      g.px += g.dx * 720 * dt;
      g.py += g.dy * 720 * dt;
      clampPlayer();
      parts.push({ x: g.px, y: g.py, vx: 0, vy: 0, life: 0.3, max: 0.3, color: HEROES[g.active]?.color ?? "#fff", size: 14 });
    } else if (len > 0 && def !== undefined) {
      const spd = g.shrink > 0 ? def.speed * 1.5 : def.speed;
      g.px += (mx / len) * spd * dt;
      g.py += (my / len) * spd * dt;
      clampPlayer();
    }
    g.chainT -= dt;
    g.zoom = Math.max(0, g.zoom - dt * 0.25);
    g.flashT -= dt;
    g.aim = Math.atan2(mouse.y - g.py, mouse.x - g.px);
    // Aim assist: snap to a nearby enemy in the aim direction; with the
    // keyboard only (mouse idle), face the closest enemy.
    const keyAttack = pendingActions.size > 0 || keys.has("KeyJ") || keys.has("KeyK") || keys.has("KeyL") || keys.has("Space");
    const mouseIdle = g.time - lastMouseMove > 1.5;
    let best: Enemy | null = null;
    let bestScore = Infinity;
    for (const e of enemies) {
      const d = Math.hypot(e.x - g.px, e.y - g.py);
      const diff = Math.abs(Math.atan2(Math.sin(Math.atan2(e.y - g.py, e.x - g.px) - g.aim), Math.cos(Math.atan2(e.y - g.py, e.x - g.px) - g.aim)));
      const ok = keyAttack && mouseIdle ? true : d < 300 && diff < 0.5;
      if (ok && d + diff * 200 < bestScore) {
        best = e;
        bestScore = d + diff * 200;
      }
    }
    if (best !== null) {
      g.aim = Math.atan2(best.y - g.py, best.x - g.px);
    }
    if (keys.has("KeyJ") || mouse.left || pendingActions.has("attack")) primary();
    if (keys.has("KeyK") || mouse.right || pendingActions.has("skill")) skill();
    if (pendingActions.has("ultimate")) ultimate();
    pendingActions.clear();

    g.invuln -= dt;
    g.swing = Math.max(0, g.swing - dt * 5);
    g.swapT -= dt;
    g.comboT -= dt;
    if (g.comboT <= 0) g.combo = 0;
    g.shake = Math.max(0, g.shake - dt * 40);
    g.bark.t -= dt;
    g.banner.t -= dt;
    if (g.cuts.length > 0) {
      g.cutT -= dt;
      if (g.cutT <= 0) {
        g.cuts.shift();
        g.cutT = g.cuts.length > 0 ? 3 : 0;
      }
    }
    heroes.forEach((h, i) => {
      h.cdPrimary -= dt;
      h.cdSkill -= dt;
      if (i !== g.active && h.hp > 0) {
        h.hp = Math.min(100, h.hp + dt * 2);
      }
    });
    g.shrink = Math.max(0, g.shrink - dt);
    g.invisible = Math.max(0, g.invisible - dt);
    portals.forEach((p) => {p.t -= dt;});
    portals = portals.filter((p) => p.t > 0);
    decoys = decoys.filter((d) => d.t > dt && d.hp > 0);
    for (const d of decoys) {
      d.t -= dt;
      d.shotCd -= dt;
      const target = enemies.reduce<Enemy | undefined>((best, e) =>
        best === undefined || Math.hypot(e.x - d.x, e.y - d.y) < Math.hypot(best.x - d.x, best.y - d.y) ? e : best, undefined);
      if (target !== undefined && d.shotCd <= 0) {
        const a = Math.atan2(target.y - d.y, target.x - d.x);
        shots.push({x: d.x, y: d.y, vx: Math.cos(a) * 450, vy: Math.sin(a) * 450,
          r: 7, dmg: 8, friendly: true, life: 1.5, kind: "bolt", bounces: 0});
        d.shotCd = 0.7;
      }
    }
    decoys = decoys.filter((d) => d.t > 0 && d.hp > 0);

    // Let new players practise before the first story wave.
    const training = tutorial && lesson < LESSONS.length && g.wave === 0;

    // Spawning and waves.
    if (practice !== null) {
      if (enemies.length === 0) spawnEnemy(practice.enemy, W / 2, PAD + 70);
    } else if (training) {
      // Effects and projectiles still update while enemy spawning waits.
    } else if (g.stageClearT > 0) {
      g.stageClearT -= dt;
      if (g.stageClearT <= 0) {
        heroes.forEach((h, i) => {
          if (soloHero !== null && i !== soloHero) return;
          if (h.hp <= 0) {
            h.hp = 60;
            burst(g.px, g.py, HEROES[i]?.color ?? "#fff", 24, 260);
          } else heal(i, 35);
        });
        startStage(g.stage + 1);
        playMovie(soloHero === null ? arrival(g.stage) : soloScenes(soloHero, g.stage, "arrival"), () => {if (soloHero !== null) setPhase("challenge");});
      }
    } else if (g.queue.length > 0) {
      g.spawnT -= dt;
      if (g.spawnT <= 0) {
        const kind = g.queue.pop();
        if (kind !== undefined) {
          if (BOSSES.includes(kind)) {
            spawnEnemy(kind, W / 2, PAD + 70);
            sound.tone(60, "sawtooth", 1, 0.25, -20);
          } else {
            edgeSpawn(kind);
          }
        }
        g.spawnT = 0.45;
      }
    } else if (enemies.length === 0 && g.banner.t < 1.2) {
      const storyDone = g.mode === "story" && g.wave >= 4;
      if (storyDone) {
        if (g.stage >= 2) {
          sound.music(false);
          g.score += 5000;
          playMovie(soloHero === null ? celebration(g.stage) : soloScenes(soloHero, g.stage, "win"), () => setPhase("victory"));
        } else {
          playMovie(soloHero === null ? celebration(g.stage) : soloScenes(soloHero, g.stage, "win"), () => { g.stageClearT = 0.05; });
          g.banner = { text: "Stage clear!", sub: "Fallen heroes come back!", t: 3 };
          g.cuts = soloHero === null ? [{ idx: g.stage % 3, text: CLEAR_CUTS[g.stage % 3] ?? "" }] : [];
          g.cutT = 3;
          g.score += 1000;
        }
      } else {
        objective = g.mode === "story" && soloHero === null ? campaignObjective(g.stage, g.wave) : null;
        if (objective) {
          keys.clear(); pendingActions.clear(); mouse.left = false; mouse.right = false;
          sound.music(false);
          setPhase("challenge");
          return;
        }
        nextWave();
      }
    }

    if (movie !== null) return;
    for (const e of [...enemies]) {
      updateEnemy(e, dt);
    }
    // Soft separation so crowds do not stack.
    for (let i = 0; i < enemies.length; i += 1) {
      for (let j = i + 1; j < enemies.length; j += 1) {
        const a = enemies[i];
        const b = enemies[j];
        if (a === undefined || b === undefined) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const min = a.r + b.r - 6;
        if (d < min && d > 0.01) {
          const push = ((min - d) / 2) * Math.min(1, dt * 10);
          const nx = (a.x - b.x) / d;
          const ny = (a.y - b.y) / d;
          if (!a.boss) {
            a.x += nx * push;
            a.y += ny * push;
          }
          if (!b.boss) {
            b.x -= nx * push;
            b.y -= ny * push;
          }
        }
      }
    }
    updateShots(dt);
    updateZones(dt);
    for (const p of parts) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life -= dt;
    }
    parts = parts.filter((p) => p.life > 0);
    for (const r of rings) {
      r.life -= dt;
      r.r += (r.max / 0.45) * dt;
    }
    rings = rings.filter((r) => r.life > 0 && r.r < r.max * 1.6);
    for (const k of [...pickups]) {
      k.t += dt;
      const d = attractPickup(k, g.px, g.py, dt);
      if (d < 22) {
        pickups = pickups.filter((o) => o !== k);
        heal(g.active, 14);
        burst(k.x, k.y, "#5be07a", 10, 160);
        sound.tone(660, "sine", 0.15, 0.1, 500);
      } else if (k.t > 12) {
        pickups = pickups.filter((o) => o !== k);
      }
    }
    for (const m of embers) {
      m.y -= m.s * 18 * dt;
      m.x += Math.sin(g.time + m.p) * 10 * dt;
      if (m.y < -4) {
        m.y = H + 4;
      }
    }
    for (const f of floats) {
      f.y -= 40 * dt;
      f.life -= dt;
    }
    floats = floats.filter((f) => f.life > 0);
    for (const s of slashes) s.life -= dt;
    slashes = slashes.filter((s) => s.life > 0);
  };

  // ---- Rendering ----

  const drawZones = () => {
    for (const z of zones) {
      if (z.kind === "rift") {
        const spin = g.time * 5;
        ctx.strokeStyle = "rgba(160,90,255,0.9)";
        ctx.lineWidth = 4;
        for (let i = 0; i < 3; i += 1) {
          ctx.beginPath();
          ctx.arc(z.x, z.y, z.r * (1 - i * 0.28), spin + i, spin + i + 4);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(20,0,40,0.8)";
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.r * 0.35, 0, TAU);
        ctx.fill();
      } else if (z.kind === "meteor") {
        const k = Math.min(1, z.t / z.dur);
        ctx.fillStyle = `rgba(255,60,30,${0.15 + 0.2 * k})`;
        ctx.strokeStyle = "rgba(255,90,40,0.9)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.r, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(255,160,60,0.6)";
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.r * k, 0, TAU);
        ctx.fill();
      } else {
        const live = z.t > 0.8;
        const a = z.ang + Math.max(0, z.t - 0.8) * 2.2;
        ctx.strokeStyle = live ? "rgba(190,60,255,0.95)" : "rgba(255,80,80,0.5)";
        ctx.lineWidth = live ? 20 : 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(z.x, z.y);
        ctx.lineTo(z.x + Math.cos(a) * z.r, z.y + Math.sin(a) * z.r);
        ctx.stroke();
        ctx.lineCap = "butt";
      }
    }
  };

  const drawShots = () => {
    for (const s of shots) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = s.friendly ? "#e0a0ff" : "#ff7a5a";
      ctx.lineWidth = s.r;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 0.05, s.y - s.vy * 0.05);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(s.x, s.y);
      if (s.kind === "bolt") {
        ctx.fillStyle = "#e0a0ff";
        ctx.shadowColor = "#b05cf0";
        ctx.shadowBlur = 14;
      } else if (s.kind === "pie") {
        ctx.fillStyle = GADGETS[s.gadget ?? 0]!.color;
        ctx.strokeStyle = "#0a0612";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, s.r, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#ff3a3a";
        ctx.fillRect(-2, -s.r - 7, 4, 7);
        ctx.restore();
        continue;
      } else if (s.kind === "snot") {
        ctx.fillStyle = "#8fe03a";
      } else if (s.kind === "laser") {
        ctx.fillStyle = "#ff3a5a";
        ctx.shadowColor = "#ff0030";
        ctx.shadowBlur = 10;
      } else {
        ctx.fillStyle = "#c27aff";
        ctx.shadowColor = "#8a3aff";
        ctx.shadowBlur = 12;
      }
      ctx.beginPath();
      ctx.arc(0, 0, s.r, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  };

  const drawHud = () => {
    if (tutorial && lesson < LESSONS.length && movie === null) {
      ctx.save();
      ctx.fillStyle = "rgba(10,6,24,0.94)";
      ctx.fillRect(130, 100, 700, 82);
      ctx.strokeStyle = "#ffd36a";
      ctx.strokeRect(130, 100, 700, 82);
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffd36a";
      ctx.font = "bold 16px Trebuchet MS, sans-serif";
      ctx.fillText(`Training ${lesson + 1}/${LESSONS.length} · T to skip`, W / 2, 125);
      ctx.fillStyle = "white";
      ctx.font = "18px Trebuchet MS, sans-serif";
      ctx.fillText(LESSONS[lesson]!.text, W / 2, 156);
      ctx.restore();
    }
    if (cast !== null) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.font = "bold 22px Trebuchet MS, sans-serif";
      ctx.fillStyle = ["#d6c4ff", "#ffd36a", "#ff8fe8"][cast.hero]!;
      ctx.strokeStyle = "#090311"; ctx.lineWidth = 5;
      const name = cast.ultimate ? HEROES[cast.hero]!.ultName : HEROES[cast.hero]!.skillName;
      ctx.strokeText(`${cast.ultimate ? "L" : "K"} · ${name}`, W / 2, 105);
      ctx.fillText(`${cast.ultimate ? "L" : "K"} · ${name}`, W / 2, 105);
      ctx.restore();
    }
    // Hero cards.
    heroes.forEach((h, i) => {
      if (soloHero !== null && i !== soloHero) return;
      const def = HEROES[i];
      if (def === undefined) return;
      const x = 14 + (soloHero === null ? i * 150 : 0);
      const y = 12;
      const act = i === g.active;
      ctx.fillStyle = act ? "rgba(20,10,40,0.85)" : "rgba(10,6,20,0.6)";
      ctx.strokeStyle = act ? def.color : "rgba(255,255,255,0.2)";
      ctx.lineWidth = act ? 3 : 2;
      ctx.beginPath();
      ctx.roundRect(x, y, 142, 50, 8);
      ctx.fill();
      ctx.stroke();
      ctx.save();
      ctx.globalAlpha = h.hp > 0 ? 1 : 0.35;
      drawFigure(ctx, i, x + 24, y + 33, 0.3, 0, false);
      ctx.restore();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px Trebuchet MS, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${i + 1} ${def.name}`, x + 46, y + 18);
      ctx.fillStyle = "#222";
      ctx.fillRect(x + 46, y + 26, 86, 9);
      ctx.fillStyle = h.hp > 30 ? "#5be07a" : "#ff5a5a";
      ctx.fillRect(x + 46, y + 26, 86 * (h.hp / 100), 9);
      ctx.fillStyle = "#222";
      ctx.fillRect(x + 46, y + 38, 86, 4);
      ctx.fillStyle = "#6ab8ff";
      ctx.fillRect(x + 46, y + 38, 86 * (1 - Math.max(0, h.cdSkill) / def.skillCd), 4);
    });
    // Score.
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px Trebuchet MS, sans-serif";
    ctx.fillText(String(Math.floor(g.score)).padStart(7, "0"), W - 16, 34);
    ctx.font = "13px Trebuchet MS, sans-serif";
    ctx.fillStyle = "#cbb8ff";
    ctx.fillText(
      soloHero !== null ? `${HEROES[soloHero]!.name} · Chapter ${g.stage + 1} · Wave ${g.wave}/4` : g.mode === "story"
        ? `${STAGE_NAMES[g.stage] ?? ""}  ·  ${g.wave >= 4 ? "Boss" : `Wave ${g.wave}/3`}`
        : `Endless  ·  Wave ${g.wave}`,
      W - 16,
      54,
    );
    if (g.combo >= 3) {
      ctx.fillStyle = "#ffd36a";
      ctx.font = "bold 20px Trebuchet MS, sans-serif";
      ctx.fillText(`${g.combo} combo!`, W - 16, 80);
    }
    // Ability bar.
    const def = HEROES[g.active];
    const h = heroes[g.active];
    if (def !== undefined && h !== undefined) {
      const bx = 16;
      const by = H - 46;
      ctx.textAlign = "left";
      ctx.font = "bold 12px Trebuchet MS, sans-serif";
      ctx.fillStyle = "rgba(10,6,20,0.85)";
      ctx.fillRect(bx - 8, by - 10, 750, 52);
      ctx.fillStyle = "#fff";
      ctx.fillText(`J · ${def.primaryName}`, bx, by + 4);
      ctx.fillText(`K · ${def.skillName}`, bx + 180, by + 4);
      ctx.fillText(`L · ${def.ultName}`, bx + 390, by + 4);
      ctx.fillStyle = "#9fe3ff";
      ctx.fillText("Shift · Dash", bx, by + 24);
      ctx.fillText(h.cdSkill > 0 ? `${Math.ceil(h.cdSkill)}s cooldown` : "Ready", bx + 180, by + 24);
      ctx.fillStyle = g.ult >= 100 ? "#ffd36a" : "#c27aff";
      ctx.fillText(g.ult >= 100 ? "L / Space: READY" : `${Math.floor(g.ult)}% · ready in ≤${Math.ceil((100-g.ult)*12/100)}s`, bx + 390, by + 24);
      const status = g.shrink > 0 ? `TINY · ${g.shrink.toFixed(1)}s` : g.invisible > 0 ? `INVISIBLE · ${g.invisible.toFixed(1)}s` :
        decoys.length > 0 ? `${decoys.length} ILLUSIONS` : g.active === 0 ? `${hidden.length} hidden supplies` : "";
      ctx.fillStyle = "#ffd36a";
      ctx.fillText(status, bx + 580, by + 24);
    }

    if(g.time < ultimateHintUntil) {
      ctx.fillStyle="rgba(10,6,20,0.92)";ctx.fillRect(180,112,600,48);
      ctx.fillStyle="#ffd36a";ctx.font="bold 16px Trebuchet MS";ctx.textAlign="center";
      ctx.fillText(`${HERO_ABILITIES[g.active]!.ultName} recharging · ≤${Math.ceil((100-g.ult)*12/100)}s`,W/2,132);
      ctx.fillText("Each hero has their own L move. Switch heroes or wait; hits recharge faster.",W/2,152);
    }
    // Grimoire: book icon, new-entry toast, and the open book.
    {
      const bx2 = W - 150;
      const by2 = H - 44;
      ctx.fillStyle = "rgba(10,6,20,0.7)";
      ctx.fillRect(bx2 - 8, by2 - 8, 140, 40);
      ctx.fillStyle = toast !== null ? "#ffd36a" : "#c9b8ff";
      ctx.textAlign = "left";
      ctx.font = "bold 12px Trebuchet MS, sans-serif";
      ctx.fillText(`G Grimoire ${discovered.size}/${LORE.length}`, bx2 + 24, by2 + 12);
      ctx.save();
      ctx.translate(bx2 + 4, by2 + 6);
      ctx.fillStyle = "#2b3a9e";
      ctx.strokeStyle = "#ffd36a";
      ctx.lineWidth = 1.5;
      ctx.fillRect(0, 0, 16, 18);
      ctx.strokeRect(0, 0, 16, 18);
      ctx.fillStyle = "#ffd36a";
      ctx.fillRect(7, 3, 2, 12);
      ctx.restore();
    }
    if (toast !== null) {
      const slide = Math.min(1, (5.5 - toast.t) * 4, toast.t * 4);
      ctx.save();
      ctx.globalAlpha = Math.max(0, slide);
      ctx.translate((1 - Math.max(0, slide)) * 40, 0);
      ctx.fillStyle = "rgba(24,12,48,0.94)";
      ctx.strokeStyle = "#ffd36a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(W - 400, 96, 384, 86, 14);
      ctx.fill();
      ctx.stroke();
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffd36a";
      ctx.font = "bold 13px Trebuchet MS, sans-serif";
      ctx.fillText("GRIMOIRE UPDATED  +50  +15% ULT", W - 384, 118);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 17px Trebuchet MS, sans-serif";
      ctx.fillText(toast.name, W - 384, 140);
      ctx.fillStyle = "#d8ccf5";
      ctx.font = "12px Trebuchet MS, sans-serif";
      let ln = "";
      let ly = 158;
      for (const w of toast.tip.split(" ")) {
        if (ctx.measureText(ln + w).width > 352) {
          ctx.fillText(ln, W - 384, ly);
          ln = "";
          ly += 14;
        }
        ln += w + " ";
      }
      ctx.fillText(ln, W - 384, ly);
      ctx.restore();
    }
    if (bookOpen) {
      ctx.fillStyle = "rgba(6,3,14,0.82)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#ffd36a";
      ctx.textAlign = "center";
      ctx.font = "bold 36px Impact, Trebuchet MS, sans-serif";
      ctx.fillText(`Grimoire  ${discovered.size}/${LORE.length}`, W / 2, 70);
      ctx.textAlign = "left";
      LORE.forEach((l, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const px = 90 + col * 400;
        const py = 100 + row * 96;
        const got = discovered.has(l.kind);
        ctx.fillStyle = "rgba(40,24,80,0.9)";
        ctx.strokeStyle = got ? "#ffd36a" : "#4a3a7a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(px, py, 380, 86, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = got ? "#ffd36a" : "#8a7ab8";
        ctx.font = "bold 16px Trebuchet MS, sans-serif";
        ctx.fillText(got ? l.name : "??? (not met yet)", px + 14, py + 26);
        ctx.fillStyle = "#e8e0ff";
        ctx.font = "12px Trebuchet MS, sans-serif";
        if (got) {
          let ln = "";
          let ly = py + 46;
          for (const w of l.tip.split(" ")) {
            if (ctx.measureText(ln + w).width > 350) {
              ctx.fillText(ln, px + 14, ly);
              ln = "";
              ly += 15;
            }
            ln += w + " ";
          }
          ctx.fillText(ln, px + 14, ly);
        }
      });
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.textAlign = "center";
      ctx.font = "13px Trebuchet MS, sans-serif";
      ctx.fillText("Meet a new monster to write it in the book (+50 points, +15% ultimate). G or Esc: close", W / 2, H - 24);
    }
    // Boss bar.
    const boss = enemies.find((e) => e.boss);
    if (boss !== undefined) {
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(10,6,20,0.75)";
      ctx.fillRect(W / 2 - 170, 66, 340, 30);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px Trebuchet MS, sans-serif";
      ctx.fillText(ENEMY[boss.kind].name, W / 2, 80);
      ctx.fillStyle = "#222";
      ctx.fillRect(W / 2 - 160, 85, 320, 7);
      ctx.fillStyle = "#e0453a";
      ctx.fillRect(W / 2 - 160, 85, 320 * Math.max(0, boss.hp / boss.max), 7);
    }
    // Bark.
    if (g.bark.t > 0 && g.cuts.length === 0) {
      const def2 = HEROES[g.bark.who];
      ctx.textAlign = "center";
      ctx.font = "bold 18px Trebuchet MS, sans-serif";
      ctx.fillStyle = "rgba(10,6,20,0.7)";
      const tw = ctx.measureText(g.bark.text).width;
      ctx.fillRect(W / 2 - tw / 2 - 12, H - 92, tw + 24, 28);
      ctx.fillStyle = def2?.color ?? "#fff";
      ctx.fillText(g.bark.text, W / 2, H - 72);
    }
    // Cutscene card: big portrait with a speech panel.
    const cut = g.cuts[0];
    if (cut !== undefined && !bookOpen) {
      const cd = HEROES[cut.idx];
      const a = Math.min(1, g.cutT * 3, (3 - g.cutT) * 4 + 0.2);
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, a));
      const bx = 190;
      const by = H - 150;
      ctx.fillStyle = "rgba(24,12,48,0.92)";
      ctx.strokeStyle = cd?.color ?? "#fff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(bx, by, W - 2 * bx + 90, 96, 18);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = cd?.color ?? "#fff";
      ctx.font = "bold 18px Trebuchet MS, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(cd?.name ?? "", bx + 100, by + 28);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 20px Trebuchet MS, sans-serif";
      ctx.fillText(cut.text, bx + 100, by + 62, W - 2 * bx - 100 + 60);
      ctx.beginPath();
      ctx.arc(bx + 50, by + 48, 62, 0, TAU);
      ctx.clip();
      const sway = Math.sin(g.time * 3) * 2;
      drawFigure(ctx, cut.idx, bx + 50, by + 74 + sway, 1.15, 0, cut.idx !== 1, Math.sin(g.time * 1.3) > 0.97, g.time);
      ctx.restore();
    }
    // Banner.
    if (g.banner.t > 0 && !bookOpen) {
      ctx.globalAlpha = Math.min(1, g.banner.t);
      ctx.textAlign = "center";
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#0a0612";
      ctx.font = "bold 54px Impact, Trebuchet MS, sans-serif";
      ctx.strokeText(g.banner.text, W / 2, H / 2 - 60);
      ctx.fillStyle = "#ffd36a";
      ctx.fillText(g.banner.text, W / 2, H / 2 - 60);
      ctx.font = "bold 20px Trebuchet MS, sans-serif";
      ctx.fillStyle = "#fff";
      ctx.fillText(g.banner.sub, W / 2, H / 2 - 30);
      ctx.globalAlpha = 1;
    }
    // Aim reticle.
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 9, 0, TAU);
    ctx.moveTo(mouse.x - 14, mouse.y);
    ctx.lineTo(mouse.x + 14, mouse.y);
    ctx.moveTo(mouse.x, mouse.y - 14);
    ctx.lineTo(mouse.x, mouse.y + 14);
    ctx.stroke();
  };

  const drawVignette = () => {
    const grd = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
    grd.addColorStop(0, "rgba(0,0,0,0)");
    grd.addColorStop(1, "rgba(0,0,10,0.6)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
  };

  const render = () => {
    ctx.save();
    if (g.shake > 0) {
      ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);
    }
    if (g.zoom > 0) {
      ctx.translate(W / 2, H / 2);
      ctx.scale(1 + g.zoom, 1 + g.zoom);
      ctx.translate(-W / 2, -H / 2);
    }
    drawBackground(ctx, g.stage, g.decor, g.time);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    for (const m of embers) {
      ctx.globalAlpha = 0.25 + 0.25 * Math.sin(g.time * 2 + m.p);
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.s, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (g.phase === "title") {
      const bob = Math.sin(g.time * 2) * 4;
      drawFigure(ctx, 0, 120, 300 + bob, 1.5, 0.3, true, false, g.time);
      drawFigure(ctx, 2, 840, 300 - bob, 1.5, Math.PI - 0.3, true, Math.sin(g.time * 1.3) > 0.96, g.time);
      drawFigure(ctx, 1, 760, 430 + bob, 1.0, Math.PI - 0.3, false, false, g.time);
      ctx.restore();
      drawVignette();
      return;
    }
    drawZones();
    for (const p of portals) {
      ctx.save(); ctx.strokeStyle = "#ffd36a"; ctx.lineWidth = 6;
      ctx.globalAlpha = Math.min(1, p.t * 2);
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 28, 52, g.time * 2, 0, TAU); ctx.stroke(); ctx.restore();
    }
    for (const d of decoys) {
      ctx.save(); ctx.globalAlpha = 0.45;
      drawFigure(ctx, 2, d.x, d.y, 0.46, g.aim, true, false, g.time);
      ctx.restore();
      ctx.fillStyle = "#ff8fe8"; ctx.textAlign = "center"; ctx.font = "12px Trebuchet MS";
      ctx.fillText(`Illusion · ${Math.ceil(d.t)}s`, d.x, d.y - 65);
    }
    for (const k of pickups) {
      ctx.save();
      ctx.translate(k.x, k.y + Math.sin(g.time * 6 + k.x) * 3);
      ctx.shadowColor = "#5be07a";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#5be07a";
      ctx.strokeStyle = "#0a0612";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.fillRect(-1.5, -5, 3, 10);
      ctx.fillRect(-5, -1.5, 10, 3);
      ctx.restore();
    }
    // Characters sorted by depth.
    type Item = { y: number; draw: () => void };
    const items: Item[] = enemies.map((e) => ({
      y: e.y,
      draw: () => {
        drawShadow(ctx, e.x, e.y, e.r);
        const windup = e.kind === "ghoul" && e.state === 1 ? 1 : e.kind === "bat" && e.state === 1 ? 1 : 0;
        if ((e.kind === "bat" && e.t1 < 0.4) || (e.boss && e.t1 < 0.65)) {
          ctx.save();
          ctx.strokeStyle = "#ffcc66";
          ctx.lineWidth = 3;
          ctx.setLineDash([8, 8]);
          const aim = Math.atan2(g.py - e.y, g.px - e.x);
          ctx.beginPath(); ctx.moveTo(e.x, e.y);
          ctx.lineTo(e.x + Math.cos(aim) * 320, e.y + Math.sin(aim) * 320);
          ctx.stroke(); ctx.restore();
        }
        drawEnemy(
          ctx,
          e.kind,
          e.x,
          e.y,
          e.r,
          g.time,
          Math.atan2(g.py - e.y, g.px - e.x),
          e.flash > 0,
          e.freeze > 0,
          windup,
          e,
        );
        if (e.kind === "ghoul" && e.state === 1) {
          ctx.strokeStyle = "rgba(255,70,70,0.7)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(e.x, e.y, 100, 0, TAU);
          ctx.stroke();
        }
        if (!e.boss && e.hp < e.max) {
          ctx.fillStyle = "#222";
          ctx.fillRect(e.x - 16, e.y - e.r - 14, 32, 4);
          ctx.fillStyle = "#e0453a";
          ctx.fillRect(e.x - 16, e.y - e.r - 14, 32 * (e.hp / e.max), 4);
        }
      },
    }));
    items.push({
      y: g.py,
      draw: () => {
        drawShadow(ctx, g.px, g.py, 16);
        const sq = g.dashT > 0 ? 1.25 : 1 + g.moving * Math.sin(g.time * 18) * 0.04;
        ctx.save();
        ctx.translate(g.px, g.py + 18);
        ctx.scale(g.dashT > 0 ? 1.3 : 1 / sq, sq);
        ctx.translate(-g.px, -g.py - 18);
        if (g.invisible > 0) ctx.globalAlpha = 0.22;
        if (g.shrink > 0) { ctx.translate(g.px, g.py); ctx.scale(0.45, 0.45); ctx.translate(-g.px, -g.py); }
        drawHero(
          ctx,
          g.active,
          g.px,
          g.py,
          g.aim,
          g.time,
          g.invuln > 0 && Math.floor(g.time * 20) % 2 === 0,
          false,
          g.swing,
          g,
        );
        ctx.restore();
      },
    });
    items.sort((a, b) => a.y - b.y).forEach((i) => i.draw());
    for (const s of slashes) {
      ctx.strokeStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 20;
      ctx.globalAlpha = Math.min(1, s.life / 0.15);
      ctx.lineCap = "round";
      ctx.lineWidth = 6 + s.life * 70;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.range * 0.8, s.ang - s.arc, s.ang + s.arc);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.lineCap = "butt";
    }
    if (cast?.ultimate && cast.hero === 0) {
      ctx.save(); ctx.strokeStyle = "#ffd36a"; ctx.lineWidth = 8;
      ctx.globalAlpha = Math.min(1, cast.t * 2);
      ctx.beginPath(); ctx.arc(cast.x, cast.y, 40 + (1 - cast.t / 1.1) * 950, 0, TAU); ctx.stroke(); ctx.restore();
    }

    drawShots();
    ctx.globalCompositeOperation = "lighter";
    for (const p of parts) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (p.size / 2) * (0.5 + p.life / p.max), 0, TAU);
      ctx.fill();
    }
    for (const r of rings) {
      ctx.globalAlpha = Math.max(0, r.life * 2);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 6 * Math.max(0.2, 1 - r.r / (r.max * 1.6));
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.font = "bold 16px Trebuchet MS, sans-serif";
    ctx.textAlign = "center";
    for (const f of floats) {
      ctx.globalAlpha = Math.min(1, f.life * 2);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    if (g.flashT > 0) {
      ctx.globalAlpha = Math.min(0.4, g.flashT);
      ctx.fillStyle = g.flashColor;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    drawVignette();
    const hp = heroes[g.active]?.hp ?? 100;
    if (hp < 30) {
      const pulse = 0.12 + 0.08 * Math.sin(g.time * 8);
      const grd = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.6);
      grd.addColorStop(0, "rgba(255,0,0,0)");
      grd.addColorStop(1, `rgba(255,0,0,${pulse * 3})`);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
    }
    drawHud();
    if (g.phase === "paused") {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, W, H);
    }
    if (movie !== null) drawMovie(movie.scenes[movie.i], movie.i, movie.scenes.length, movie.t);
  };

  const mv = { last: 0, camX: 0, zoom: 1 };
  const drawMovie = (sc: Scene | undefined, i: number, n: number, t: number) => {
    if (sc === undefined) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#07030f";
    ctx.fillRect(0, 0, W, H);
    // --- Smooth cinematic camera: eases toward the speaker instead of cutting.
    const now = g.time;
    const md = Math.min(0.05, Math.max(0, now - mv.last));
    mv.last = now;
    const ease = (k: number) => 1 - Math.exp(-md * k);
    const speaker = sc.actors.find((a) => a.idx === sc.who);
    const focusX = speaker?.x ?? W / 2;
    mv.camX += ((W / 2 - focusX) * 0.12 - mv.camX) * ease(1.6);
    mv.zoom += (1.03 + Math.min(t, 8) * 0.01 + (speaker !== undefined ? 0.03 : 0) - mv.zoom) * ease(1.2);
    ctx.translate(W / 2 + mv.camX, H / 2);
    ctx.scale(mv.zoom, mv.zoom);
    ctx.translate(-W / 2, -H / 2);
    drawBackground(ctx, sc.stage, g.decor, g.time);
    ctx.fillStyle = sc.tint;
    ctx.fillRect(-60, -60, W + 120, H + 120);
    if (sc.shake) {
      const punch = Math.max(0, 1 - Math.abs(t / sc.duration - 0.62) * 9) * 9;
      ctx.translate(Math.sin(t * 80) * punch, Math.cos(t * 95) * punch * 0.5);
    }
    drawAction(ctx, sc, t);
    // Soft dip in at the start of each line.
    if (t < 0.3) {
      ctx.fillStyle = `rgba(5,2,10,${0.35 * (1 - t / 0.3)})`;
      ctx.fillRect(-60, -60, W + 120, H + 120);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    // Letterbox bars.
    ctx.fillStyle = "#050208";
    ctx.fillRect(0, 0, W, 54);
    ctx.fillRect(0, H - 150, W, 150);
    if (sc.caption !== undefined) {
      ctx.fillStyle = "#ffd36a";
      ctx.font = "bold 26px Impact, Trebuchet MS, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(sc.caption, W / 2, 36);
    }
    const def = sc.who >= 0 ? HEROES[sc.who] : undefined;
    ctx.textAlign = "left";
    ctx.fillStyle = def?.color ?? "#cbb8ff";
    ctx.font = "bold 20px Trebuchet MS, sans-serif";
    ctx.fillText(def?.name ?? "Narrator", 60, H - 112);
    ctx.fillStyle = "#fff";
    ctx.font = "22px Trebuchet MS, sans-serif";
    const shown = sc.text.slice(0, Math.floor(t * 40));
    const words = shown.split(" ");
    let line = "";
    let y = H - 80;
    for (const w of words) {
      if (ctx.measureText(line + w).width > W - 120) {
        ctx.fillText(line, 60, y);
        line = "";
        y += 28;
      }
      line += w + " ";
    }
    ctx.fillText(line, 60, y);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "13px Trebuchet MS, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${i + 1}/${n}   Auto-play · Click / Space: next · Esc: skip`, W - 24, H - 18);
  };

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (g.phase !== "paused") {
      update(dt);
    }
    render();
    raf = requestAnimationFrame(frame);
  };

  // ---- Input ----

  const toLogical = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    lastMouseMove = g.time;
    mouse.x = ((event.clientX - rect.left) / rect.width) * W;
    mouse.y = ((event.clientY - rect.top) / rect.height) * H;
  };
  const muteState = { on: false };
  const toggle = () => {
    if (g.phase === "playing") {
      setPhase("paused");
    } else if (g.phase === "paused") {
      last = performance.now();
      setPhase("playing");
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.code === "Space" || event.code.startsWith("Arrow")) {
      event.preventDefault();
    }
    if (movie !== null) {
      if (event.code === "Escape") endMovie();
      else if (event.code === "Space" || event.code === "Enter" || event.code === "KeyJ") advanceMovie();
      return;
    }
    if (event.code === "KeyT") lesson = LESSONS.length;
    keys.add(event.code);
    if (g.phase !== "playing" && g.phase !== "paused") {
      return;
    }
    if (g.phase === "playing" && !bookOpen) {
      if (event.code === "KeyJ") pendingActions.add("attack");
      if (event.code === "KeyK") pendingActions.add("skill");
      if (!event.repeat && (event.code === "KeyL" || event.code === "Space")) {
        pendingActions.add("ultimate");
        if (!event.repeat && g.ult < 100) ultimateHintUntil = g.time + 2.5;
      }
    }
    if (event.code === "KeyQ") {
      for (let i = 1; i <= 2; i += 1) {
        const idx = (g.active + i) % 3;
        if ((heroes[idx]?.hp ?? 0) > 0) {
          swapTo(idx);
          break;
        }
      }
    } else if (event.code === "Digit1") swapTo(0);
    else if (event.code === "Digit2") swapTo(1);
    else if (event.code === "Digit3") swapTo(2);
    else if (event.code === "KeyG" && g.phase === "playing") bookOpen = !bookOpen;
    else if (event.code === "Escape" && bookOpen) bookOpen = false;
    else if (event.code === "Escape" || event.code === "KeyP") toggle();
    else if (event.code === "KeyM") {
      muteState.on = !muteState.on;
      sound.setMuted(muteState.on);
      onMuted?.(muteState.on);
    }
  };
  const onKeyUp = (event: KeyboardEvent) => keys.delete(event.code);
  const onMove = (event: MouseEvent) => toLogical(event);
  const onDown = (event: MouseEvent) => {
    toLogical(event);
    if (movie !== null) {
      if (event.button === 0) advanceMovie();
      return;
    }
    if (event.button === 0) { mouse.left = true; if (g.phase === "playing" && !bookOpen) pendingActions.add("attack"); }
    if (event.button === 2) { mouse.right = true; if (g.phase === "playing" && !bookOpen) pendingActions.add("skill"); }
  };
  const onUp = (event: MouseEvent) => {
    if (event.button === 0) mouse.left = false;
    if (event.button === 2) mouse.right = false;
  };
  const onMenu = (event: Event) => event.preventDefault();
  const onBlur = () => {
    keys.clear();
    pendingActions.clear();
    mouse.left = false;
    mouse.right = false;
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  canvas.addEventListener("mousemove", onMove);
  canvas.addEventListener("mousedown", onDown);
  window.addEventListener("mouseup", onUp);
  canvas.addEventListener("contextmenu", onMenu);
  raf = requestAnimationFrame(frame);

  return {
    start,
    startSolo(hero) { start("story", hero); },
    completeChallenge(bonus) {
      if (g.phase !== "challenge") return;
      if (objective !== null) {
        g.score += Math.max(0, Math.min(1100, Math.floor(Number.isFinite(bonus) ? bonus : 0)));
        objective = null;
        keys.clear(); pendingActions.clear(); mouse.left = false; mouse.right = false;
        // Advance here so this cleared-wave boundary cannot replay the same objective.
        nextWave();
        last = performance.now();
        sound.music(true);
        setPhase("playing");
        return;
      }
      if (soloHero === null) return;
      g.score += Math.max(0, Math.min(1100, Math.floor(Number.isFinite(bonus) ? bonus : 0)));
      g.ult = Math.max(50, g.ult);
      heroes[soloHero]!.hp = 100;
      keys.clear(); pendingActions.clear(); mouse.left = false; mouse.right = false;
      g.banner = {text: SOLO_STORIES[soloHero].title, sub: `Chapter ${g.stage + 1} · Solo · No hero switching`, t: 2};
      last = performance.now();
      setPhase("playing");
    },
    startPractice(options) {
      start("endless");
      practice = options;
      g.active = options.hero;
      g.ult = 100;
      g.banner = { text: "Practice arena", sub: ENEMY[options.enemy].name, t: 2 };
      spawnEnemy(options.enemy, W / 2, PAD + 70);
    },
    refill() {
      if (practice === null) return;
      for (const hero of heroes) { hero.hp = 100; hero.cdSkill = 0; hero.cdPrimary = 0; }
      g.ult = 100;
      g.invuln = 1;
    },
    togglePause: toggle,
    quit() {
      movie = null;
      keys.clear(); pendingActions.clear();
      sound.music(false);
      setPhase("title");
    },
    setMuted(muted) {
      muteState.on = muted;
      sound.setMuted(muted);
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("contextmenu", onMenu);
      sound.close();
    },
  };
}
