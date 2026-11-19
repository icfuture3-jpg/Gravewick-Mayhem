import { HERO_ABILITIES } from "./hero-abilities";
import type { StoryMove } from "./story-moves";
import { miniChapter } from "./mini-backstory";
import type { HeroId } from "./solo-story";

export interface MiniInput {x: number; y: number; aimX: number; aimY: number; action?: boolean; moveTo?: boolean; returnToBook?: boolean; skill?: boolean}
export interface MiniInput {x: number; y: number; aimX: number; aimY: number; action?: boolean; moveTo?: boolean; returnToBook?: boolean; skill?: boolean; ultimate?: boolean}
interface Light {x: number; y: number; found: boolean; following: boolean; taken: boolean}
export interface MiniState {
  hero: HeroId; stage: number; elapsed: number; progress: number; goal: number;
  status: "playing" | "won"; px: number; py: number; invuln: number; message: string;
  destination: {x: number; y: number} | null;
  sparks: Light[]; pages: {x: number; y: number; taken: boolean}[]; carrying: number | null;
  bookArrival: number;
  primaryCd: number; skillCd: number;
  primaryCd: number; skillCd: number; ultimateCd: number; tiny: number;
  illusions: {x:number; y:number; remaining:number; shotCd:number}[];
  illusionBolts: {x:number;y:number;tx:number;ty:number;age:number}[];
  effect: {move: StoryMove; x: number; y: number; tx: number; ty: number; age: number} | null;
  projectile: {x: number; y: number; tx: number; ty: number; age: number; gadget: number; move: "bolt" | "gadget"} | null;
  part: number; swing: number; swingX: number; swingY: number;
}
export const HOME = {x: 480, y: 405};
export const REPAIR_PARTS = [{x: 458, y: 225}, {x: 505, y: 255}, {x: 480, y: 290}] as const;
export const MINI_RULES = [
  "Click the ground or use WASD/arrows to move. Your lantern reveals nearby star sparks automatically. Walk close to a spark so it follows you, then lead it to the glowing HOME lantern. Avoid the purple shadows. Rescue all 5. J: Lantern Sweep reveals nearby sparks; K: Lantern Portal teleports toward your mouse (260px, 9s cooldown). No time limit.",
  "Click the large golden broken part to hit it with Pip’s meat mallet. Repair the 3 highlighted parts in order, then fix the next monster toy. Fix all 6 toys. You can also aim with the mouse and press J or Space. K: Gadget Pouch launches a random bouncing dynamite, frost or shock gadget to repair the part it hits (5s cooldown). No wrong-hit penalty or time limit.",
  "Click a glowing page or use WASD/arrows to walk to it. Pick it up by walking close, then return it to the open BOOK. Carry one page at a time. Restore all 3 pages. J: Spellbook Bolt retrieves a page at your mouse aim; its button targets the next page. No patterns to remember and no time limit.",
] as const;
export function createMini(hero: HeroId, stage = 0): MiniState {
  return {hero, stage, elapsed: 0, progress: 0, goal: hero === 0 ? 5 : hero === 1 ? 6 : 3,
    status: "playing", px: HOME.x, py: HOME.y, invuln: 0, destination: null, message: "",
    sparks: [{x: 130, y: 150}, {x: 330, y: 260}, {x: 550, y: 120}, {x: 790, y: 230}, {x: 740, y: 390}].map((p) => ({...p, found: false, following: false, taken: false})),
    pages: [{x: 185, y: 180}, {x: 735, y: 180}, {x: 770, y: 350}].map((p) => ({...p, taken: false})), carrying: null,
    bookArrival: 0, primaryCd: 0, skillCd: 0, effect: null, projectile: null, part: 0, swing: 0, swingX: REPAIR_PARTS[0].x, swingY: REPAIR_PARTS[0].y};
    bookArrival: 0, primaryCd: 0, skillCd: 0, ultimateCd: 0, tiny: 0, illusions: [], illusionBolts: [], effect: null, projectile: null, part: 0, swing: 0, swingX: REPAIR_PARTS[0].x, swingY: REPAIR_PARTS[0].y};
}
export function shadowPosition(index: number, time: number) {
  return {x: 230 + index * 250, y: 220 + Math.sin(time * 0.8 + index * 2) * 85};
}
const distance = (a: {x: number; y: number}, b: {x: number; y: number}) => Math.hypot(a.x - b.x, a.y - b.y);
export function miniObjective(s: MiniState): string {
  if (s.status === "won") return "All restored! Choose Continue tale to see what happens next.";
  if (s.hero === 1) return `Toy ${s.progress + 1}/6 · Hit golden part ${s.part + 1}/3`;
  if (s.hero === 2) return s.carrying === null ? "Find a glowing page — walk to it to pick it up" : "Page collected! Return to the glowing BOOK";
  const following = s.sparks.filter((spark) => spark.following && !spark.taken).length;
  return following ? `${following} ${following === 1 ? "spark is" : "sparks are"} following — guide them to HOME` : "Find star sparks — your lantern lights the way";
}
export function stepMini(s: MiniState, input: MiniInput, dt: number) {
  dt = Math.max(0, Math.min(0.05, dt));
  if (s.status !== "playing") {
    if (s.hero === 2) s.bookArrival = Math.min(1, s.bookArrival + dt / 1.6);
    return;
  }
  s.ultimateCd = Math.max(0,s.ultimateCd-dt); s.tiny = Math.max(0,s.tiny-dt);
  s.illusionBolts = s.illusionBolts.filter(b => (b.age += dt) < 0.6);
  for(const illusion of s.illusions) {illusion.remaining -= dt; illusion.shotCd -= dt;}
  s.illusions = s.illusions.filter(i => i.remaining > 0);
  if(input.ultimate) {
    if(s.ultimateCd > 0) s.message = `${HERO_ABILITIES[s.hero].ultName} recharges in ${Math.ceil(s.ultimateCd)}s.`;
    else {
      s.ultimateCd = 12;
      s.message = `${HERO_ABILITIES[s.hero].ultName} activated!`;
      if(s.hero === 0) {
        for(const spark of s.sparks) spark.found = true;
        s.invuln = 0;
        s.effect = {move:"light",x:s.px,y:s.py,tx:s.px,ty:s.py,age:0};
      } else if(s.hero === 1) s.tiny = 6;
      else s.illusions = [-1,1].map(side => ({x:Math.max(50,Math.min(910,s.px+side*100)),y:s.py-60,remaining:6,shotCd:0}));
    }
  }
  s.primaryCd = Math.max(0, s.primaryCd - dt); s.skillCd = Math.max(0, s.skillCd - dt);
  if (s.effect) {s.effect.age += dt; if (s.effect.age >= 0.7) s.effect = null;}
  s.elapsed += dt; s.invuln = Math.max(0, s.invuln - dt); s.swing = Math.max(0, s.swing - dt);
  const remember = () => {s.progress++; s.message = miniChapter(s.hero, s.stage).memories[s.progress - 1]!;};
  const repair = () => {s.part++; if (s.part === REPAIR_PARTS.length) {s.part = 0; remember();}};
  if (s.projectile) {
    const shot = s.projectile; shot.age += dt;
    if (shot.age >= 0.6) {
      if (shot.move === "gadget" && distance({x:shot.tx,y:shot.ty}, REPAIR_PARTS[s.part]!) <= 25) repair();
      if (shot.move === "bolt" && s.carrying === null) {
        const page = s.pages.findIndex(p => !p.taken && distance(p, {x:shot.tx,y:shot.ty}) < 40);
        if (page !== -1) {s.pages[page]!.taken = true; s.carrying = page; s.message = "Spellbook Bolt retrieved a page! Return to BOOK.";}
      }
      s.projectile = null;
    }
  }
  for(const illusion of s.illusions) if(illusion.shotCd <= 0) {
    const page = s.pages.find(p => !p.taken);
    if(page) {
      s.illusionBolts.push({x:illusion.x+20,y:illusion.y-20,tx:page.x,ty:page.y,age:0});
      if(s.carrying === null && !s.projectile) s.projectile = {x:illusion.x+20,y:illusion.y-20,tx:page.x,ty:page.y,age:0,gadget:0,move:"bolt"};
    }
    illusion.shotCd = 0.8;
  }
  if (s.hero === 1 && input.skill && s.skillCd === 0 && !s.projectile) {
    s.skillCd = HERO_ABILITIES[1].skillCd;
    s.projectile = {x:400,y:250,tx:input.aimX,ty:input.aimY,age:0,gadget:Math.floor(Math.random()*3),move:"gadget"};
    s.message = "Gadget Pouch — a bouncing gadget repairs the part it hits.";
  }
  if (s.hero === 2 && input.action && s.primaryCd === 0 && !s.projectile && s.carrying === null) {
    s.primaryCd = 0.35;
    s.projectile = {x:bookPose(s).x,y:bookPose(s).y,tx:input.aimX,ty:input.aimY,age:0,gadget:0,move:"bolt"};
    s.message = "Spellbook Bolt — aim at a glowing page to retrieve it.";
  }
  if (s.hero === 0 && input.action && s.primaryCd === 0) {
    s.primaryCd = 0.4;
    s.effect = {move:"sweep",x:s.px,y:s.py,tx:s.px,ty:s.py,age:0};
    for (const spark of s.sparks) if (distance({x:s.px,y:s.py},spark)<180) spark.found = true;
    s.message = "Lantern Sweep reveals nearby lost lights.";
  }
  if (s.hero === 0 && input.skill && s.skillCd === 0) {
    const x=s.px,y=s.py,dx=input.aimX-x,dy=input.aimY-y,d=Math.hypot(dx,dy);
    if (d>0) {
      s.px=Math.max(35,Math.min(925,x+dx/d*Math.min(260,d))); s.py=Math.max(105,Math.min(445,y+dy/d*Math.min(260,d)));
      s.destination=null; s.skillCd=HERO_ABILITIES[0].skillCd;
      s.effect={move:"portal",x,y,tx:s.px,ty:s.py,age:0};
      for (const spark of s.sparks) if(spark.following) {spark.x=s.px;spark.y=s.py;}
      s.message="Lantern Portal carries you and your following sparks toward your aim.";
    }
  }
  if (s.hero === 1) {
    if (input.action && s.swing === 0) {
      s.swing = s.tiny > 0 ? 0.14 : 0.28; s.swingX = input.aimX; s.swingY = input.aimY;
      if (distance({x: input.aimX, y: input.aimY}, REPAIR_PARTS[s.part]!) <= 25) {
        repair();
      } else s.message = "Aim for the large GOLD ring — no penalty. Try again!";
    }
  } else {
    const bookClick = s.hero === 2 && input.moveTo && Math.hypot(input.aimX - HOME.x, input.aimY - HOME.y) <= 75;
    const returning = s.hero === 2 && (input.returnToBook || bookClick);
    if (input.moveTo) s.destination = {x: Math.max(35, Math.min(925, input.aimX)), y: Math.max(105, Math.min(445, input.aimY))};
    if (returning) s.destination = {...HOME};
    let dx = returning ? 0 : input.x, dy = returning ? 0 : input.y;
    if (dx || dy) s.destination = null;
    else if (s.destination) {
      dx = s.destination.x - s.px; dy = s.destination.y - s.py;
      if (Math.hypot(dx, dy) < 5) {s.px = s.destination.x; s.py = s.destination.y; s.destination = null; dx = 0; dy = 0;}
    }
    const len = Math.hypot(dx, dy), speed = s.invuln > 0 ? 150 : 220;
    if (len > 0) {
      const step = Math.min(speed * dt, s.destination ? len : speed * dt);
      s.px = Math.max(35, Math.min(925, s.px + dx / len * step));
      s.py = Math.max(105, Math.min(445, s.py + dy / len * step));
    }
    const player = {x: s.px, y: s.py};
    if (s.hero === 0) {
      for (const spark of s.sparks) {
        if (spark.taken) continue;
        const d = distance(player, spark);
        if (d < 130) spark.found = true;
        if (spark.found && d < 40) spark.following = true;
        if (spark.following) {
          if (distance(player, HOME) < 60) {
            spark.taken = true; spark.following = false; remember();
          } else if (d > 25) {
            const step = Math.min(d - 25, 250 * dt);
            spark.x += (s.px - spark.x) / d * step; spark.y += (s.py - spark.y) / d * step;
          }
        }
      }
      for (let i = 0; i < 3; i++) if (s.invuln === 0 && distance(player, shadowPosition(i, s.elapsed)) < 35) {
        s.invuln = 1.5; s.message = "A shadow slows your steps — your rescued lights are safe. Keep heading HOME!";
      }
    } else {
      if (s.carrying === null) {
        const page = s.pages.findIndex((p) => !p.taken && distance(player, p) < 35);
        if (page !== -1) {s.pages[page]!.taken = true; s.carrying = page; s.message = "A lost page! Bring it to the open BOOK at the bottom.";}
      } else if (distance(player, HOME) < 55) {s.carrying = null; remember();}
    }
  }
  if (s.progress >= s.goal) {
    s.status = "won"; s.destination = null;
    s.illusions=[];s.illusionBolts=[];s.projectile=null;s.tiny=0;s.effect=null;
  }
}
export function bookPose(s: MiniState) {
  const p = s.bookArrival, ease = p * p * (3 - 2 * p);
  return {x: HOME.x + (s.px + 55 - HOME.x) * ease,
    y: HOME.y + (s.py - 65 - HOME.y) * ease - Math.sin(p * Math.PI) * 45,
    glow: s.status === "won" ? 32 : s.carrying !== null ? 22 : 12};
}
export function bookPose(s: MiniState) {
  const p = s.bookArrival, ease = p * p * (3 - 2 * p);
  return {x: HOME.x + (s.px + 55 - HOME.x) * ease,
    y: HOME.y + (s.py - 65 - HOME.y) * ease - Math.sin(p * Math.PI) * 45,
    glow: s.status === "won" ? 32 : s.carrying !== null ? 22 : 12};
}
export const miniBonus = (s: MiniState) => s.status === "won" ? 500 + s.goal * 100 : 0;

/** Coordinates inside an object-fit:contain canvas, excluding its letterbox padding. */
export function miniPoint(rect: {left: number; top: number; width: number; height: number}, clientX: number, clientY: number) {
  const scale = Math.min(rect.width / 960, rect.height / 480);
  return {x: Math.max(0, Math.min(960, (clientX - rect.left - (rect.width - 960 * scale) / 2) / scale)),
    y: Math.max(0, Math.min(480, (clientY - rect.top - (rect.height - 480 * scale) / 2) / scale))};
}
