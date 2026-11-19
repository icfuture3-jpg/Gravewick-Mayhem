import { chapterObjective, CIRCUIT, MIRROR_ANGLES, MACHINE_LOCKS, SKY_STARS, MIRRORS } from "./chapter-challenges";
import { HERO_ABILITIES } from "./hero-abilities";
import type { StoryMove } from "./story-moves";
import { miniChapter } from "./mini-backstory";
import type { HeroId } from "./solo-story";

export interface MiniInput {x: number; y: number; aimX: number; aimY: number; action?: boolean; moveTo?: boolean; returnToBook?: boolean; skill?: boolean; ultimate?: boolean; findSpark?: number; guideHome?: boolean; interact?: number}
interface Light {x: number; y: number; found: boolean; following: boolean; taken: boolean; fallY: number}
export interface MiniState {
  hero: HeroId; stage: number; elapsed: number; progress: number; goal: number;
  status: "playing" | "won"; px: number; py: number; invuln: number; message: string;
  destination: {x: number; y: number} | null; guidingHome: boolean;
  sparks: Light[]; pages: {x: number; y: number; taken: boolean}[]; carrying: number | null;
  bookArrival: number; mirrorAngles: number[]; aligned: boolean[];
  primaryCd: number; skillCd: number; ultimateCd: number; tiny: number;
  illusions: {x:number; y:number; remaining:number; shotCd:number}[];
  illusionBolts: {x:number;y:number;tx:number;ty:number;age:number}[];
  effect: {move: StoryMove; x: number; y: number; tx: number; ty: number; age: number} | null;
  projectile: {x: number; y: number; tx: number; ty: number; age: number; gadget: number; move: "bolt" | "gadget"; repairToy?: number; repairPart?: number} | null;
  hammerHits: number; part: number; swing: number; swingX: number; swingY: number;
}
export const HOME = {x: 480, y: 405};
export const REPAIR_PARTS = [{x: 458, y: 225}, {x: 505, y: 255}, {x: 480, y: 290}] as const;
export const MINI_RULES = [
  "Catch five falling star shards in Grimble’s lantern. Click the ground or use WASD/arrows to move beneath a glowing shard, or use Catch shard to walk to its landing spot. Missed shards fall again: no lost progress or HOME trips. J: Lantern Sweep lights nearby shards; K: Lantern Portal teleports toward your mouse (260px, 9s cooldown). No time limit.",
  "Click the large golden broken part to hit it with Pip’s meat mallet. Repair the 3 highlighted parts in order, then fix the next monster toy. Fix all 6 toys. You can also aim with the mouse and press J or Space. K: Gadget Pouch launches a random bouncing dynamite, frost or shock gadget to repair the part it hits (5s cooldown). No wrong-hit penalty or time limit.",
  "Click a glowing page or use WASD/arrows to walk to it. Pick it up by walking close, then return it to the open BOOK. Carry one page at a time. Restore all 3 pages. J: Spellbook Bolt retrieves a page at your mouse aim; its button targets the next page. No patterns to remember and no time limit.",
] as const;
export function createMini(hero: HeroId, stage = 0): MiniState {
  return {hero, stage, elapsed: 0, progress: 0, goal: hero === 0 ? 5 : hero === 1 ? 6 : 3,
    status: "playing", px: HOME.x, py: HOME.y, invuln: 0, destination: null, guidingHome: false, message: "",
    sparks: [{x: 130, y: 150}, {x: 330, y: 260}, {x: 550, y: 120}, {x: 790, y: 230}, {x: 740, y: 390}].map((p) => ({...p, found: false, following: false, taken: false, fallY: 65 - p.x * 0.2})),
    pages: [{x: 185, y: 180}, {x: 735, y: 180}, {x: 770, y: 350}].map((p) => ({...p, taken: false})), carrying: null,
    bookArrival: 0, mirrorAngles: [0,0,0], aligned:[false,false,false], primaryCd: 0, skillCd: 0, ultimateCd: 0, tiny: 0, illusions: [], illusionBolts: [], effect: null, projectile: null, hammerHits: 0, part: 0, swing: 0, swingX: REPAIR_PARTS[0].x, swingY: REPAIR_PARTS[0].y};
}
export function sparkControl(spark: {taken: boolean}, index: number) {
  return {label: spark.taken ? `Shard ${index + 1} · CAUGHT ✓` : `Catch shard ${index + 1}`, rescued: spark.taken};
}
export function grimbleRules(stage: number) {
  return stage === 0 ? MINI_RULES[0] : stage === 1
    ? "Relight the five keeper lanterns. Walk beside each lantern, then press J or Light nearby lantern. No escorts or HOME trips. K portals; L reveals the crypt. No time limit."
    : "Open the star gate. Walk to the numbered seal highlighted GOLD, then press J or Activate nearby seal. Follow 1 → 2 → 3 → 4 → 5. No escorts or HOME trips. K portals; L reveals the gate. No time limit.";
}
export function shadowPosition(index: number, time: number) {
  return {x: 230 + index * 250, y: 220 + Math.sin(time * 0.8 + index * 2) * 85};
}
const distance = (a: {x: number; y: number}, b: {x: number; y: number}) => Math.hypot(a.x - b.x, a.y - b.y);
export function miniObjective(s: MiniState): string {
  if (s.status === "won") return "All restored! Choose Continue tale to see what happens next.";
  const chapter = chapterObjective(s); if(chapter) return chapter;
  if (s.hero === 1) return `Toy ${s.progress + 1}/6 · Hit golden part ${s.part + 1}/3`;
  if (s.hero === 2) return s.carrying === null ? "Find a glowing page — walk to it to pick it up" : "Page collected! Return to the glowing BOOK";
  if(s.stage === 1) return "Walk beside an unlit lantern, then use Lantern Sweep · J to relight it";
  if(s.stage === 2) return `Activate golden seal ${Math.min(5,s.progress+1)}/5 with Lantern Sweep · J`;
  return "Move beneath the falling star shards to catch them in your lantern";
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
  const finish = () => {
    if(s.progress < s.goal) return false;
    s.status="won"; s.destination=null; s.guidingHome=false;
    s.illusions=[]; s.illusionBolts=[]; s.projectile=null; s.tiny=0; s.effect=null; s.swing=0;
    return true;
  };
  const repair = () => {if(s.progress>=s.goal) return; s.part++; if (s.part === REPAIR_PARTS.length) {s.part = 0; remember();}};
  if (s.projectile) {
    const shot = s.projectile; shot.age += dt;
    if (shot.age >= 0.6) {
      if (s.stage === 0 && shot.move === "gadget" && shot.repairToy === s.progress && shot.repairPart === s.part && distance({x:shot.tx,y:shot.ty}, REPAIR_PARTS[s.part]!) <= 25) repair();
      if(shot.move==="bolt" && s.hero===2 && s.stage===2) {
        const star=SKY_STARS[s.progress];
        if(star && distance(star,{x:shot.tx,y:shot.ty})<45) remember();
        else s.message="Aim for the next GOLD star. Your completed lines are safe.";
      }
      if (s.stage===0 && shot.move === "bolt" && s.carrying === null) {
        const page = s.pages.findIndex(p => !p.taken && distance(p, {x:shot.tx,y:shot.ty}) < 40);
        if (page !== -1) {s.pages[page]!.taken = true; s.carrying = page; s.message = "Spellbook Bolt retrieved a page! Return to BOOK.";}
      }
      s.projectile = null;
      // A final gadget impact must finish before another input can alter the repaired toy.
      if(finish()) return;
    }
  }
  for(const illusion of s.illusions) if(illusion.shotCd <= 0) {
    const mirror = s.stage===1 ? s.aligned.findIndex(aligned=>!aligned) : -1;
    const page = s.stage===0 ? s.pages.find(p => !p.taken) : s.stage===2 ? SKY_STARS[s.progress] : mirror>=0 ? MIRRORS[mirror] : undefined;
    if(mirror>=0){s.mirrorAngles[mirror]=(s.mirrorAngles[mirror]!+1)%4;if(s.mirrorAngles[mirror]===MIRROR_ANGLES[mirror]){s.aligned[mirror]=true;remember();}}
    if(page) {
      s.illusionBolts.push({x:illusion.x+20,y:illusion.y-20,tx:page.x,ty:page.y,age:0});
      if(s.stage!==1 && s.carrying === null && !s.projectile) s.projectile = {x:illusion.x+20,y:illusion.y-20,tx:page.x,ty:page.y,age:0,gadget:0,move:"bolt"};
    }
    illusion.shotCd = 0.8;
  }
  if (s.hero === 1 && s.stage===0 && input.skill && s.skillCd === 0 && !s.projectile) {
    s.skillCd = HERO_ABILITIES[1].skillCd;
    s.projectile = {x:400,y:250,tx:input.aimX,ty:input.aimY,age:0,gadget:Math.floor(Math.random()*3),move:"gadget",repairToy:s.progress,repairPart:s.part};
    s.message = "Gadget Pouch — a bouncing gadget repairs the part it hits.";
  }
  if (s.hero === 2 && s.stage!==1 && input.action && s.primaryCd === 0 && !s.projectile && s.carrying === null) {
    s.primaryCd = 0.35;
    s.projectile = {x:bookPose(s).x,y:bookPose(s).y,tx:input.aimX,ty:input.aimY,age:0,gadget:0,move:"bolt"};
    s.message = s.stage===2 ? "Spellbook Bolt — connect the next GOLD star." : "Spellbook Bolt — aim at a glowing page to retrieve it.";
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
      s.destination=null; s.guidingHome=false; s.skillCd=HERO_ABILITIES[0].skillCd;
      s.effect={move:"portal",x,y,tx:s.px,ty:s.py,age:0};
      for (const spark of s.sparks) if(spark.following) {spark.x=s.px;spark.y=s.py;}
      s.message="Lantern Portal carries you and your following sparks toward your aim.";
    }
  }
  if(s.hero===1 && s.stage===1) {
    if(input.interact!==undefined || (input.action && s.tiny>0)) {
      if((input.action && s.tiny>0) || input.interact===CIRCUIT[s.progress]) remember();
      else s.message="That piece does not match the blueprint. Try the shown shape — no reset.";
    }
  } else if (s.hero === 1 && s.stage===0) {
    if (input.action && s.swing === 0) {
      s.hammerHits++;
      s.swing = s.tiny > 0 ? 0.14 : 0.28; s.swingX = input.aimX; s.swingY = input.aimY;
      if (distance({x: input.aimX, y: input.aimY}, REPAIR_PARTS[s.part]!) <= 25) {
        repair();
      } else s.message = "Aim for the large GOLD ring — no penalty. Try again!";
    }
  } else {
    const selectedSpark = s.hero === 0 && input.findSpark !== undefined ? s.sparks[input.findSpark] : undefined;
    const sparkTarget = selectedSpark && !selectedSpark.taken ? selectedSpark : null;
    if (sparkTarget) {
      s.guidingHome = false;
      s.destination = {x:sparkTarget.x,y:sparkTarget.y};
      s.message = s.stage===0 ? `Walking beneath shard ${input.findSpark!+1}. It will fall again if missed.` : `Walking to marker ${input.findSpark!+1}.`;
    }
    const bookClick = s.hero === 2 && input.moveTo && Math.hypot(input.aimX - HOME.x, input.aimY - HOME.y) <= 75;
    const returning = s.hero === 2 && (input.returnToBook || bookClick);
    if (input.moveTo) s.destination = {x: Math.max(35, Math.min(925, input.aimX)), y: Math.max(105, Math.min(445, input.aimY))};
    if (returning) s.destination = {...HOME};
    let dx = returning || sparkTarget || s.guidingHome ? 0 : input.x, dy = returning || sparkTarget || s.guidingHome ? 0 : input.y;
    if (dx || dy) s.destination = null;
    else if (s.destination) {
      dx = s.destination.x - s.px; dy = s.destination.y - s.py;
      if (Math.hypot(dx, dy) < 5) {s.px = s.destination.x; s.py = s.destination.y; s.destination = null; s.guidingHome = false; dx = 0; dy = 0;}
    }
    const len = Math.hypot(dx, dy), speed = s.tiny>0 ? 330 : s.invuln > 0 ? 150 : 220;
    if (len > 0) {
      const step = Math.min(speed * dt, s.destination ? len : speed * dt);
      s.px = Math.max(35, Math.min(925, s.px + dx / len * step));
      s.py = Math.max(105, Math.min(445, s.py + dy / len * step));
    }
    const player = {x: s.px, y: s.py};
    if(s.hero===1 && s.stage===2) {
      if(input.action) {
        const lock=MACHINE_LOCKS[s.progress];
        if(s.tiny>0 && lock && distance(player,lock)<65) remember();
        else s.message=s.tiny<=0?"Press L: only tiny Pip fits inside the lock housing.":"Move beside the next red lock, then press J.";
      }
    } else if(s.hero===2 && s.stage===1) {
      if(input.interact!==undefined && input.interact>=0 && input.interact<3 && !s.aligned[input.interact]) {
        const i=input.interact;s.mirrorAngles[i]=(s.mirrorAngles[i]!+1)%4;
        if(s.mirrorAngles[i]===MIRROR_ANGLES[i]) {s.aligned[i]=true;remember();}
      }
    } else if(s.hero===2 && s.stage===2) {
      // Stars are inscribed by projectile impacts, not by walking over pages.
    } else if (s.hero === 0 && s.stage > 0) {
      for(let i=0;i<s.sparks.length;i++) {
        const lantern=s.sparks[i]!;
        if(input.action && !lantern.taken && distance(player,lantern)<80) {
          if(s.stage===1 || i===s.progress) {lantern.taken=true;lantern.found=true;remember();}
          else s.message=`Follow the GOLD seal: number ${s.progress+1} is next. No penalty.`;
        }
      }
    } else if (s.hero === 0) {
      for (const shard of s.sparks) {
        if (shard.taken) continue;
        shard.fallY += 115 * dt;
        if(shard.fallY > 450) shard.fallY = 65;
        shard.found = true;
        // The lantern catches on contact; no following or delivery state.
        if (distance(player,{x:shard.x,y:shard.fallY}) < 44) {
          shard.taken=true; shard.following=false; remember();
        }
      }
    } else {
      if (s.carrying === null) {
        const page = s.pages.findIndex((p) => !p.taken && distance(player, p) < 35);
        if (page !== -1) {s.pages[page]!.taken = true; s.carrying = page; s.message = "A lost page! Bring it to the open BOOK at the bottom.";}
      } else if (distance(player, HOME) < 55) {s.carrying = null; remember();}
    }
  }
  finish();
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
