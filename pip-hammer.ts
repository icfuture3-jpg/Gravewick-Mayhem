import * as THREE from "three";
import {RoundedBoxGeometry} from "three/addons/geometries/RoundedBoxGeometry.js";

/** Rounded ham-mallet prop with the same Standard materials/light rig as Pip. Pivot is the grip. */
export function makePipHammer(){
 const root=new THREE.Group();root.name="pip-ham-mallet";
 const bone=new THREE.MeshStandardMaterial({color:0xedd8ad,roughness:0.6});
 const meat=new THREE.MeshStandardMaterial({color:0xc65c78,roughness:0.62});
 const cut=new THREE.MeshStandardMaterial({color:0xf39aaf,roughness:0.68});
 const grip=new THREE.MeshStandardMaterial({color:0x8e643e,roughness:0.8});
 const mesh=(geometry:THREE.BufferGeometry,material:THREE.Material,x:number,y:number,z:number,name:string)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.name=name;root.add(m);return m;};
 const handle=mesh(new THREE.CylinderGeometry(0.11,0.14,2,16),bone,0.85,0,0,"bone-handle");handle.rotation.z=Math.PI/2;
 mesh(new RoundedBoxGeometry(0.55,0.3,0.32,3,0.08),grip,0.05,0,0,"hand-grip");
 const head=mesh(new THREE.SphereGeometry(0.67,24,16),meat,2,0,0,"rounded-ham-head");head.scale.set(1.05,0.8,0.85);
 const face=mesh(new THREE.SphereGeometry(0.5,24,16),cut,2.25,0,0.4,"cut-face");face.scale.set(0.8,0.85,0.16);
 const marrow=mesh(new THREE.SphereGeometry(0.16,16,12),bone,2.25,0,0.49,"bone-centre");marrow.scale.z=0.25;
 return root;
}

export let pipHammerFrame:HTMLCanvasElement|null=null;
export function setPipHammerFrame(frame:HTMLCanvasElement|null){pipHammerFrame=frame;}

/** Cached prop only: the same pivot/strike is used in stories, toy repair and combat art. */
export function drawPipHammer(ctx:CanvasRenderingContext2D,handX:number,handY:number,swing:number){
 ctx.save();ctx.translate(handX,handY);ctx.rotate(-1.3+swing*1.65);
 if(pipHammerFrame)ctx.drawImage(pipHammerFrame,-12.5,-30,100,60);
 ctx.restore();
}
