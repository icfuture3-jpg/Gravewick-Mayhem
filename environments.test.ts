import {expect,it,vi} from "vitest";
import * as THREE from "three";
import {ENVIRONMENTS,makeEnvironment,disposeEnvironment,environmentFrames,drawEnvironment,chapterEnvironment} from "./environments";
it.each(ENVIRONMENTS)("%s is a dimensional lit set with finite geometry and reusable materials",kind=>{
 const set=makeEnvironment(kind),names=new Set<string>(),materials=new Set<THREE.Material>();let meshes=0;
 const bounds=new THREE.Box3().setFromObject(set),size=bounds.getSize(new THREE.Vector3());
 expect(size.x).toBeGreaterThan(15);expect(size.z).toBeGreaterThan(10);expect(size.y).toBeGreaterThan(2);
 set.traverse(item=>{if(item instanceof THREE.Mesh){meshes++;names.add(item.name);expect(item.castShadow&&item.receiveShadow).toBe(true);
  expect(item.geometry.getAttribute("position").array.every(Number.isFinite)).toBe(true);
  for(const m of Array.isArray(item.material)?item.material:[item.material]){expect(m).toBeInstanceOf(THREE.MeshStandardMaterial);materials.add(m);}
 }});
 expect(meshes).toBeGreaterThan(100);expect(materials.size).toBeLessThan(30);expect(names.has("ground")).toBe(true);
 const signature:Record<string,string>={town:"sleeping-house",workshop:"tool-pegboard",library:"book",crypt:"keeper-headstone",citadel:"battlement",machine:"engine-housing",mirrors:"mirror-glass",observatory:"telescope"};
 expect(names.has(signature[kind]!)).toBe(true);
 const disposals=[...materials].map(m=>vi.spyOn(m,"dispose"));disposeEnvironment(set);
 for(const spy of disposals)expect(spy).toHaveBeenCalledTimes(1);
});
it("draws cached images at the requested aspect without allocating another set or mutating gameplay",()=>{
 const frame={} as HTMLCanvasElement,ctx={drawImage:vi.fn(),fillRect:vi.fn()} as unknown as CanvasRenderingContext2D;
 environmentFrames.workshop=frame;
 try{expect(drawEnvironment(ctx,"workshop",960,480)).toBe(true);expect(ctx.drawImage).toHaveBeenCalledWith(frame,0,0,960,480);}finally{delete environmentFrames.workshop;}
 expect(drawEnvironment(ctx,"workshop")).toBe(false);expect(ctx.fillRect).toHaveBeenCalledWith(0,0,960,360);
 expect([0,1,2].map(stage=>chapterEnvironment(0,stage))).toEqual(["town","crypt","citadel"]);
 expect([0,1,2].map(stage=>chapterEnvironment(2,stage))).toEqual(["library","mirrors","observatory"]);
});

it("the workshop is a separate repair-garage layout, not the library with different shelf contents",()=>{
 const workshop=makeEnvironment("workshop"),library=makeEnvironment("library");
 const names=(root:THREE.Object3D)=>{const result:string[]=[];root.traverse(item=>result.push(item.name));return result;};
 const w=names(workshop),l=names(library);
 for(const name of ["handsaw-blade","saw-tooth","circular-saw","drill-motor","bench-vice","repair-bench","roof-beam","spare-gear"])expect(w).toContain(name);
 expect(w.filter(name=>name==="tool-shaft")).toHaveLength(18);
 for(const name of ["book","shelf-back","reading-rug","window-moon"]){expect(w).not.toContain(name);expect(l).toContain(name);}
 expect(l).not.toContain("handsaw-blade");disposeEnvironment(workshop);disposeEnvironment(library);
});
