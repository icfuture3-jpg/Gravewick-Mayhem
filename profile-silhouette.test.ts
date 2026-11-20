import {expect,it,vi} from "vitest";
import {drawFigure} from "./heroes";
import {sprites} from "./sprites";
it("never double-draws Pip's side-walking sprite at a blended speed",()=>{
 const frame={} as HTMLCanvasElement,side={} as HTMLCanvasElement;
 const old=sprites[1];sprites[1]={frames:[frame],walk:[frame],side:{frames:[side],walk:[side]},dur:1,walkDur:1,aspect:0.6};
 try {
  const drawImage=vi.fn(),ctx=new Proxy({drawImage},{get:(obj,key)=>Reflect.get(obj,key)??vi.fn()}) as unknown as CanvasRenderingContext2D;
  drawFigure(ctx,1,300,250,1,0,false,false,0.5,{side:true,speed:55,phase:0.3});
  expect(drawImage).toHaveBeenCalledTimes(1);expect(drawImage.mock.calls[0]![0]).toBe(side);
 }finally{sprites[1]=old!;}
});
