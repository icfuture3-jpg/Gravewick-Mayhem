import {expect,it,vi} from "vitest";
import {BOSS_DESIGNS,bossPattern} from "./boss-design";
import {bossEntrance,turningPoint,celebration} from "./movie";
import {drawAction} from "./cinematic";
import {drawEnemy} from "./art";
vi.mock("./heroes",()=>({drawFigure:vi.fn()}));
vi.mock("./art",()=>({drawEnemy:vi.fn(),TAU:Math.PI*2}));
it("gives each boss its own entrance, half-health and defeat shot with its actual model",()=>{
 const scenes=[];
 for(let stage=0;stage<3;stage++){
  const boss=BOSS_DESIGNS[stage]!;
  for(const scene of [bossEntrance(stage)[0]!,turningPoint(stage)[0]!,celebration(stage)[0]!]){
   expect(scene.boss).toBe(boss.kind);scenes.push(scene.caption);
   vi.mocked(drawEnemy).mockClear();
   const ctx=new Proxy({}, {get:()=>vi.fn()}) as CanvasRenderingContext2D;
   drawAction(ctx,scene,2);
   expect(vi.mocked(drawEnemy).mock.calls.some(call=>call[1]===boss.kind)).toBe(true);
  }
 }
 expect(new Set(scenes).size).toBe(9);
});
it("changes each boss's signature attack at half health, not its identity",()=>{
 expect(bossPattern(0,1)).toMatchObject({kind:"boogeyman",fan:5});expect(bossPattern(0,0.5)).toMatchObject({kind:"boogeyman",fan:7});
 expect(bossPattern(1,1)).toMatchObject({orbs:10,orbDirection:1});expect(bossPattern(1,0.5)).toMatchObject({orbs:12,orbDirection:-1});
 expect(bossPattern(2,1).impacts).toBe(1);expect(bossPattern(2,0.5).impacts).toBe(2);
});
