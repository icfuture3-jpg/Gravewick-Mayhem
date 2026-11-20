import {ENVIRONMENTS,environmentFrames,makeEnvironment,disposeEnvironment} from "./environments";
// Pre-renders the 3D hero models into 2D sprite frames so the canvas game draws the same
// characters as the "Meet the heroes" screen.
import { makeWorkshopTable } from "./workshop-table";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";

export interface Sprite {
  frames: HTMLCanvasElement[];
  side?: {frames: HTMLCanvasElement[]; walk?: HTMLCanvasElement[]};
  walk?: HTMLCanvasElement[]; // heroes: a walk cycle
  aspect: number; // width / height
  dur: number; // idle/loop clip seconds
  walkDur: number;
}

const NAMES = ["grimble", "pip", "wisp", "clown", "bat", "ghoul", "slime", "boogeyman", "nergal", "meteor"];
const URLS = NAMES.map((n) => `${import.meta.env.BASE_URL}assets/${n}.glb`);

/** A flat-coloured copy of a frame (white hit flash, icy freeze), cached. */
export function tinted(frame: HTMLCanvasElement, color: string): HTMLCanvasElement {
  const key = frame as HTMLCanvasElement & { _t?: Record<string, HTMLCanvasElement> };
  key._t ??= {};
  let c = key._t[color];
  if (c === undefined) {
    c = document.createElement("canvas");
    c.width = frame.width;
    c.height = frame.height;
    const g = c.getContext("2d");
    if (g !== null) {
      g.drawImage(frame, 0, 0);
      g.globalCompositeOperation = "source-atop";
      g.fillStyle = color;
      g.fillRect(0, 0, c.width, c.height);
    }
    key._t[color] = c;
  }
  return c;
}
export function spriteByName(n: string): Sprite | null {
  return sprites[NAMES.indexOf(n)] ?? null;
}
const FRAMES = 16;
const PX = 320;

export let workshopTable: HTMLCanvasElement | null = null;

export const sprites: (Sprite | null)[] = NAMES.map(() => null);

let loading: Promise<void> | null = null;
export function loadSprites(): Promise<void> {
  return loading ??= bakeSprites();
}

async function bakeSprites(): Promise<void> {
  const loader = new GLTFLoader();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6a4a9a, 1.7));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 5, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xb08cff, 1.2);
  rim.position.set(-4, 3, -3);
  scene.add(rim);

  const bake = (i: number, gltf: { scene: THREE.Object3D; animations: THREE.AnimationClip[] }) => {
    const root = clone(gltf.scene);
    root.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (m !== undefined && m.isMeshStandardMaterial && i === 1) {
        m.metalness = Math.min(m.metalness, 0.05);
        m.roughness = Math.max(m.roughness, 0.55);
      }
    });
    scene.add(root);
    const clip = gltf.animations.find((c) => c.name === (i < 3 ? "idle" : "walk")) ?? gltf.animations[0];
    const mixer = new THREE.AnimationMixer(root);
    if (clip !== undefined) mixer.clipAction(clip).play();
    mixer.update(0);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const h = size.y * 1.3;
    const w = Math.max(size.x * 1.4, h * 0.6);
    const aspect = w / h;
    const cw = Math.round(PX * aspect);
    renderer.setSize(cw, PX, false);
    const cam = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 100);
    cam.position.set(center.x, center.y, center.z + 20);
    cam.lookAt(center);
    const renderClip = (c: THREE.AnimationClip | undefined, n: number) => {
      const out: HTMLCanvasElement[] = [];
      const m = new THREE.AnimationMixer(root);
      if (c !== undefined) m.clipAction(c).play();
      for (let f = 0; f < n; f += 1) {
        m.setTime((f / n) * (c?.duration ?? 1));
        renderer.render(scene, cam);
        const cv = document.createElement("canvas");
        cv.width = cw;
        cv.height = PX;
        cv.getContext("2d")?.drawImage(renderer.domElement, 0, 0);
        out.push(cv);
      }
      return out;
    };
    const frames = renderClip(clip, i < 3 ? FRAMES : 10);
    const walkClip = gltf.animations.find((c) => c.name === "run") ?? gltf.animations.find((c) => c.name === "walk");
    const walk = i < 3 && walkClip !== undefined ? renderClip(walkClip, 16) : undefined;
    // Personal approaches use real profile walk clips, not front-facing runs.
    let side: Sprite["side"];
    if (i < 3) {
      cam.position.set(center.x - 20, center.y, center.z);
      cam.lookAt(center);
      const sideWalkClip = gltf.animations.find((c) => c.name === "walk") ?? walkClip;
      side = {frames: renderClip(clip, FRAMES), walk: sideWalkClip ? renderClip(sideWalkClip, FRAMES) : undefined};
    }
    scene.remove(root);
    sprites[i] = { frames, aspect, side, walk, dur: clip?.duration ?? 1, walkDur: walkClip?.duration ?? 1 };
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
        material.dispose();
      }
    });
  };

  try {
    // Reuse the characters' light rig and renderer; dispose each set after its one-time bake.
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    key.castShadow=true;key.shadow.mapSize.set(1024,1024);
    Object.assign(key.shadow.camera,{left:-12,right:12,top:10,bottom:-10,near:0.1,far:40});
    key.shadow.camera.updateProjectionMatrix();key.shadow.bias=-0.001;
    const environmentCamera=new THREE.OrthographicCamera(-10,10,5.625,-5.625,0.1,70);
    environmentCamera.position.set(0,10,15);environmentCamera.lookAt(0,0,-0.5);
    for(const kind of ENVIRONMENTS){
      const set=makeEnvironment(kind);scene.add(set);scene.background=new THREE.Color(set.userData.background);
      renderer.setSize(1280,720,false);renderer.render(scene,environmentCamera);
      const frame=document.createElement("canvas");frame.width=1280;frame.height=720;
      frame.getContext("2d")!.drawImage(renderer.domElement,0,0);environmentFrames[kind]=frame;
      scene.remove(set);disposeEnvironment(set);
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    scene.background=null;key.castShadow=false;renderer.shadowMap.enabled=false;
    const table = makeWorkshopTable(); scene.add(table);
    renderer.setSize(960,360,false);
    const camera = new THREE.OrthographicCamera(-3.7,3.7,2.3,-2.3,0.1,100);
    camera.position.set(1.5,4.2,10); camera.lookAt(0,1.2,0);
    renderer.render(scene,camera);
    workshopTable = document.createElement("canvas"); workshopTable.width=960; workshopTable.height=360;
    workshopTable.getContext("2d")?.drawImage(renderer.domElement,0,0);
    scene.remove(table);
    const materials = new Set<THREE.Material>();
    table.traverse(object => {if(object instanceof THREE.Mesh){object.geometry.dispose(); for(const material of Array.isArray(object.material)?object.material:[object.material]) materials.add(material);}});
    for(const material of materials) material.dispose();
    for (let i = 0; i < URLS.length; i += 1) {
      const gltf = await loader.loadAsync(URLS[i]!);
      bake(i, gltf);
      // Yield between models to keep the loading screen responsive.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  } finally {
    renderer.dispose();
  }
}
