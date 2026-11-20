import * as THREE from "three";
import {RoundedBoxGeometry} from "three/addons/geometries/RoundedBoxGeometry.js";

export const ENVIRONMENTS = ["town","workshop","library","crypt","citadel","machine","mirrors","observatory"] as const;
export type Environment = typeof ENVIRONMENTS[number];
export const environmentFrames: Partial<Record<Environment,HTMLCanvasElement>> = {};
const CHAPTER_ENVIRONMENTS: readonly (readonly Environment[])[] = [
  ["town","crypt","citadel"],["workshop","workshop","machine"],["library","mirrors","observatory"],
];
export const chapterEnvironment = (hero:number,stage:number):Environment => CHAPTER_ENVIRONMENTS[hero]![stage]!;

/** Every backdrop is a genuine 3D set, rendered once alongside the character bakes. */
export function makeEnvironment(kind:Environment) {
  const root=new THREE.Group();root.name=kind;
  const materials=new Map<number,THREE.MeshStandardMaterial>();
  const material=(color:number,glow=false)=>{
    const id=color+(glow?0x1000000:0);
    if(!materials.has(id))materials.set(id,new THREE.MeshStandardMaterial({color,roughness:0.72,metalness:0.04,...(glow?{emissive:color,emissiveIntensity:0.65}:{})}));
    return materials.get(id)!;
  };
  function mesh(geometry:THREE.BufferGeometry,color:number,x:number,y:number,z:number,name:string,glow=false){
    const item=new THREE.Mesh(geometry,material(color,glow));item.position.set(x,y,z);item.name=name;item.castShadow=true;item.receiveShadow=true;root.add(item);return item;
  }
  function box(w:number,h:number,d:number,color:number,x:number,y:number,z:number,name:string,r=0.08){return mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/4,h/4,d/4)),color,x,y,z,name);}
  function orb(r:number,color:number,x:number,y:number,z:number,name:string,glow=false){return mesh(new THREE.SphereGeometry(r,16,10),color,x,y,z,name,glow);}
  function post(x:number,z:number,color=0x71617f){
    box(0.7,0.25,0.7,color,x,0.15,z,"pillar-foot");box(0.4,2.6,0.4,color,x,1.55,z,"pillar");box(0.75,0.3,0.75,color,x,2.9,z,"pillar-cap");
  }
  function lantern(x:number,y:number,z:number){
    box(0.32,0.55,0.32,0x664c36,x,y,z,"lantern-frame");
    mesh(new RoundedBoxGeometry(0.25,0.38,0.34,2,0.04),0xffd988,x,y,z+0.04,"lantern-glass",true);
    const light=new THREE.PointLight(0xffc66c,3,3,2);light.position.set(x,y,z+0.25);root.add(light);
  }
  const outdoor=["town","citadel","observatory"].includes(kind);
  const ground=kind==="town"?0x324d45:kind==="workshop"?0x70513f:kind==="library"?0x514261:0x414052;
  box(19,0.4,14,ground,0,-0.25,0,"ground",0.14);
  // Low-contrast paving supplies volume without obscuring moving hazards or collectibles.
  for(let row=0;row<8;row++)for(let col=0;col<12;col++){
    const color=new THREE.Color(ground).multiplyScalar(0.9+((row*7+col*3)%5)*0.035);
    box(1.43,0.045,1.5,color.getHex(),-8.4+col*1.52,-0.015,-5.4+row*1.6,"floor-tile",0.03);
  }
  if(!outdoor)box(19,5,0.35,kind==="workshop"?0x665044:0x4b405d,0,2.2,-5.5,"back-wall");
  if(kind==="town"){
    for(let i=0;i<7;i++){
      const x=-8+i*2.7,h=1.7+(i%3)*0.3;
      box(2.25,h,1.8,i%2?0x617588:0x727086,x,h/2,-4.8,"sleeping-house");
      const roof=mesh(new THREE.ConeGeometry(1.85,1.2,4),0x423e64,x,h+0.5,-4.8,"sloped-roof");roof.rotation.y=Math.PI/4;
      box(0.32,0.8,0.4,0x575367,x+0.65,h+0.9,-5,"chimney");
      box(0.5,1,0.1,0x333447,x,0.5,-3.85,"door");
      for(const side of [-1,1])box(0.45,0.55,0.1,0xa5adad,x+side*0.66,h*0.65,-3.84,"moonlit-window");
    }
    for(const x of [-8,8])for(const z of [-1,3]){
      box(0.3,1.8,0.3,0x5c463a,x,0.9,z,"tree-trunk");
      for(let i=0;i<3;i++)orb(0.7,0x3f6252,x+(i-1)*0.4,1.9+(i%2)*0.4,z,"round-tree-canopy");
    }
    for(const x of [-6,6]){post(x,-2,0x565262);lantern(x,2.75,-2);}
    orb(0.65,0xc7d8dc,-6,5,-7,"moon",true);
  } else if(kind==="workshop" || kind==="library"){
    const library=kind==="library";
    for(const x of [-7,-4,4,7]){
      box(2.3,3.5,0.65,0x594038,x,1.75,-4.9,"shelf-back");
      for(let level=0;level<4;level++){
        const y=0.25+level*0.8;box(2.5,0.16,0.95,0x9e754e,x,y,-4.6,"wood-shelf");
        for(let i=0;i<6;i++){
          const colors=[0x9c759f,0x6a9c94,0xb6985d,0xb4786a,0x7277a1,0x9aa75b];
          const item=box(library?0.24:0.3,library?0.48+(i%3)*0.09:0.35,0.35,colors[i]!,x-0.9+i*0.35,y+0.34,-4.35,library?"book":"parts-bin");
          if(library)item.rotation.z=(i%3-1)*0.06;
        }
      }
    }
    if(library){
      box(2.2,2.6,0.25,0xc4a674,0,2.7,-5.2,"window-frame");
      box(1.8,2.2,0.28,0x464875,0,2.7,-5,"window-glass");orb(0.42,0xf5d9a4,0.2,3,-4.8,"window-moon",true);
      const rug=mesh(new THREE.CylinderGeometry(3,3,0.025,48),0x77618e,0,0.035,0,"reading-rug");rug.scale.z=0.6;
    }else{
      box(3.5,1.9,0.18,0xa17b50,0,2.2,-5.1,"tool-pegboard");
      for(let i=0;i<7;i++){
        const x=-1.3+i*0.44;box(0.09,0.85,0.12,0xc6bca2,x,2.2,-4.9,"tool-shaft");box(0.3,0.18,0.15,0x78927c,x,2.65,-4.87,"tool-head");
      }
      for(const x of [-7.6,7.6]){box(1.4,0.9,0.9,0x9c724a,x,0.45,-2,"drawer-cabinet");for(let y=0.2;y<0.9;y+=0.3)box(0.4,0.05,0.1,0xcfb276,x,y,-1.5,"drawer-pull");}
    }
    lantern(-2.4,3.6,-4);lantern(2.4,3.6,-4);
  } else if(kind==="crypt" || kind==="mirrors"){
    for(const x of [-8,-5,0,5,8]){
      post(x,-4.5);
      const arch=mesh(new THREE.TorusGeometry(1.3,0.18,8,24,Math.PI),0x9686a8,x+1.3,2.9,-4.6,"vault-arch");arch.rotation.z=0;
    }
    for(const x of [-7.5,7.5])for(const z of [-2,1,4]){
      if(kind==="crypt")box(0.9,1.1,0.45,0x7d7887,x,0.55,z,"keeper-headstone");
      else {box(1.1,1.9,0.22,0xc8ad7c,x,1,z,"mirror-frame");box(0.85,1.6,0.25,0x7796ab,x,1,z+0.04,"mirror-glass");}
    }
    lantern(-6,2,-3.8);lantern(6,2,-3.8);
  } else if(kind==="citadel"){
    for(let i=0;i<13;i++){const x=-9+i*1.5;box(1.4,2.4,0.9,0x635b71,x,1.2,-5,"fortress-wall");box(0.8,0.6,1,0x807080,x,2.65,-5,"battlement");}
    for(const x of [-7,7]){post(x,-3,0x897786);lantern(x,2.8,-3);}
    box(3.3,3.7,0.6,0x9a7b6e,0,1.8,-5,"citadel-gate-frame");box(2.6,3.3,0.65,0x373547,0,1.6,-4.9,"citadel-gate");
    for(const x of [-8,8])for(const z of [0,3])orb(0.4,0xe0a260,x,0.5,z,"ember-stone",true);
  } else if(kind==="machine"){
    for(const x of [-7.5,-4.5,4.5,7.5]){
      box(2.2,3.5,1,0x59737b,x,1.75,-4.7,"engine-housing");
      const gear=mesh(new THREE.TorusGeometry(0.65,0.18,6,12),0xaf9b76,x,2,-4,"gear");gear.rotation.z=x;
      for(let i=0;i<4;i++)box(0.15,0.15,0.08,0xb1d6bd,x-0.55+i*0.35,0.75,-4.1,"status-light");
    }
    for(const x of [-8,8])mesh(new THREE.CylinderGeometry(0.25,0.25,5,12),0x8d9397,x,2.4,-1,"service-pipe");
  } else {
    for(let i=0;i<11;i++){const x=-8+i*1.6;box(1.4,0.8,0.5,0x82718d,x,0.4,-4.5,"observatory-parapet");}
    mesh(new THREE.TorusGeometry(3.4,0.2,10,48,Math.PI),0xb5a484,0,1.5,-5,"observatory-dome");
    for(let i=0;i<26;i++)orb(0.035,0xd7d2ef,-9+(i*1.37)%18,3+(i*0.43)%3,-7,"star",true);
    const scope=mesh(new THREE.CylinderGeometry(0.22,0.35,2,16),0xc0a66e,7,1.8,-3,"telescope");scope.rotation.z=-0.8;
    post(7,-3,0x66647c);
  }
  root.userData.background=outdoor?0x1b2439:0x2b2536;
  return root;
}

export function disposeEnvironment(root:THREE.Object3D){
  const materials=new Set<THREE.Material>();
  root.traverse(item=>{if(item instanceof THREE.Mesh){item.geometry.dispose();for(const m of Array.isArray(item.material)?item.material:[item.material])materials.add(m);}});
  for(const m of materials)m.dispose();
}

/** Cache read only: no geometry, WebGL context or render work during gameplay. */
export function drawEnvironment(ctx:CanvasRenderingContext2D,kind:Environment,width=960,height=360){
  const frame=environmentFrames[kind];
  if(frame){ctx.drawImage(frame,0,0,width,height);return true;}
  ctx.fillStyle="#29283d";ctx.fillRect(0,0,width,height);return false;
}
