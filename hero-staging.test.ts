import {expect,it,vi} from "vitest";
import {watchPose,drawPrologue,drawConclusion} from "./story-tableaux";
import {drawFigure} from "./heroes";
import {drawMonsterToy} from "./tale-props";
vi.mock("./heroes",()=>({drawFigure:vi.fn()}));
vi.mock("./art",()=>({drawEnemy:vi.fn()}));
const context=()=>new Proxy({}, {get:()=>vi.fn()}) as CanvasRenderingContext2D;
it("patrols the sleeping town, notices the bright fall, approaches and catches shards in order",()=>{
 expect(watchPose(1).x).toBeGreaterThan(watchPose(0).x);
 expect(watchPose(1).seesStar).toBe(false);expect(watchPose(2.5)).toMatchObject({seesStar:true,walking:false});
 expect(watchPose(4).x).toBeGreaterThan(watchPose(3).x);
 expect(watchPose(6)).toMatchObject({catching:true,walking:false,glow:1});
 expect(watchPose(7)).toEqual(watchPose(30));
 const colors:unknown[]=[];
 const ctx=new Proxy({}, {get:()=>vi.fn(),set:(_obj,key,value)=>{if(key==="fillStyle")colors.push(value);return true;}}) as CanvasRenderingContext2D;
 drawPrologue(ctx,0,2.5);expect(colors).toContain("rgba(255,225,141,0.28)");
});
it("Pip's prologue draws one profile character and the fixed toys visibly cheer",()=>{
 const ctx=context();vi.mocked(drawFigure).mockClear();drawPrologue(ctx,1,2);
 expect(drawFigure).toHaveBeenCalledTimes(1);expect(vi.mocked(drawFigure).mock.calls[0]![9]).toMatchObject({side:true});
 const fillText=vi.fn();const cheering=new Proxy({fillText},{get:(obj,key)=>Reflect.get(obj,key)??vi.fn()}) as unknown as CanvasRenderingContext2D;
 drawMonsterToy(cheering,0,100,200,true,1);expect(fillText).toHaveBeenCalledWith("HOORAY!",0,-82);
 drawConclusion(cheering,1,0,2);expect(fillText).toHaveBeenCalledWith("The toys cheer for Pip!",480,45);
});
