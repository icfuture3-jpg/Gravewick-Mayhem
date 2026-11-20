import {expect,it,vi} from "vitest";
import * as THREE from "three";
import {makePipHammer,setPipHammerFrame,pipHammerFrame} from "./pip-hammer";
import {drawMeatMallet} from "./tale-props";
import {disposeEnvironment} from "./environments";
it("builds a rounded shaded 3D ham mallet with a bone handle, grip, cut face and marrow",()=>{
 const hammer=makePipHammer(),names:string[]=[];
 hammer.traverse(item=>{if(item instanceof THREE.Mesh){names.push(item.name);expect(item.material).toBeInstanceOf(THREE.MeshStandardMaterial);expect(item.geometry.getAttribute("position").array.every(Number.isFinite)).toBe(true);}});
 expect(names).toEqual(["bone-handle","hand-grip","rounded-ham-head","cut-face","bone-centre"]);
 const size=new THREE.Box3().setFromObject(hammer).getSize(new THREE.Vector3());expect(size.z).toBeGreaterThan(0.8);disposeEnvironment(hammer);
});
it("draws the cached 3D prop at its hand pivot without flat substitute shapes",()=>{
 const old=pipHammerFrame,frame={} as HTMLCanvasElement;setPipHammerFrame(frame);
 try{
  const drawImage=vi.fn(),ellipse=vi.fn(),ctx=new Proxy({drawImage,ellipse},{get:(obj,key)=>Reflect.get(obj,key)??vi.fn()}) as unknown as CanvasRenderingContext2D;
  drawMeatMallet(ctx,490,220,1);expect(drawImage).toHaveBeenCalledWith(frame,-12.5,-30,100,60);expect(ellipse).not.toHaveBeenCalled();
 }finally{setPipHammerFrame(old);}
});
