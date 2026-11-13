import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";

const CAST = [
  { id: "grimble", name: "Grimble", role: "The Master", color: "#a283e8", blurb: "Mysterious mentor. His golden lantern reveals hidden things and opens portals.", url: new URL("./assets/grimble.glb", import.meta.url).href },
  { id: "pip", name: "Pip", role: "The Mischief Maker", color: "#c4d443", blurb: "Hyperactive apprentice with a pouch of unpredictable gadgets. Can shrink tiny.", url: new URL("./assets/pip.glb", import.meta.url).href },
  { id: "wisp", name: "Wisp", role: "The Clever Apprentice", color: "#ff6fe0", blurb: "Brainy and brave. Turns invisible, makes illusions, and her spellbook floats along.", url: new URL("./assets/wisp.glb", import.meta.url).href },
];

interface Slot {
  root: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  current: THREE.AnimationAction | null;
}

export function HeroPreview({ onBack }: { onBack: () => void }) {
  const mount = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState(0);
  const pickedRef = useRef(0);
  const cheerRef = useRef<(i: number) => void>(() => {});
  const [status, setStatus] = useState("Loading heroes…");

  useEffect(() => {
    pickedRef.current = picked;
  }, [picked]);

  useEffect(() => {
    const host = mount.current;
    if (host === null) return undefined;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, host.clientWidth / host.clientHeight, 0.1, 50);
    camera.position.set(0, 1.3, 8.5);
    camera.lookAt(0, 1.1, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x6a4a9a, 1.7));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 5, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xb08cff, 1.2);
    rim.position.set(-4, 3, -3);
    scene.add(rim);
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.9, 0.08, 32),
      new THREE.MeshStandardMaterial({ color: 0x3a2a66 }),
    );
    const slots: (Slot | null)[] = [null, null, null];
    const discs: THREE.Mesh[] = [];
    const loader = new GLTFLoader();
    let alive = true;
    let loaded = 0;
    CAST.forEach((c, i) => {
      const d = disc.clone();
      d.position.set((i - 1) * 2.4, -0.04, 0);
      scene.add(d);
      discs.push(d);
      loader.load(
        c.url,
        (gltf) => {
          if (!alive) return;
          const root = clone(gltf.scene);
          const box = new THREE.Box3().setFromObject(root);
          const sc = 2.1 / (box.max.y - box.min.y);
          root.scale.setScalar(sc);
          root.position.set((i - 1) * 2.4 - ((box.max.x + box.min.x) / 2) * sc, -box.min.y * sc, 0);
          // Keep skin and cloth matte so Pip's face stays lime green instead of metallic gold.
          root.traverse((o) => {
            const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
            if (m !== undefined && m.isMeshStandardMaterial && c.id === "pip") {
              m.metalness = Math.min(m.metalness, 0.05);
              m.roughness = Math.max(m.roughness, 0.55);
            }
          });
          scene.add(root);
          const mixer = new THREE.AnimationMixer(root);
          const actions = new Map(gltf.animations.map((clip) => [clip.name, mixer.clipAction(clip)]));
          const idle = actions.get("idle") ?? [...actions.values()][0] ?? null;
          idle?.play();
          slots[i] = { root, mixer, actions, current: idle };
          loaded += 1;
          if (loaded === CAST.length) setStatus("");
        },
        undefined,
        () => setStatus("A hero could not be loaded."),
      );
    });
    const play = (s: Slot, name: string) => {
      const next = s.actions.get(name);
      if (next === undefined || next === s.current) return;
      s.current?.fadeOut(0.2);
      next.reset().fadeIn(0.2).play();
      s.current = next;
    };
    cheerRef.current = (i) => {
      const s = slots[i];
      if (s === null || s === undefined) return;
      play(s, "cheer");
      window.setTimeout(() => play(s, "idle"), 2600);
    };
    const clock = new THREE.Clock();
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = clock.getDelta();
      const t = clock.elapsedTime;
      slots.forEach((s, i) => {
        if (s === null) return;
        s.mixer.update(dt);
        const sel = i === pickedRef.current;
        const target = sel ? Math.sin(t * 1.2) * 0.35 : 0;
        s.root.rotation.y += (target - s.root.rotation.y) * 0.1;
        const k = sel ? 1.12 : 1;
        s.root.scale.x += 0;
        discs[i]?.scale.setScalar(sel ? 1.15 : 1);
        void k;
      });
      renderer.render(scene, camera);
    };
    loop();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      slots.forEach((s) => {
        if (s === null) return;
        s.mixer.stopAllAction();
        s.mixer.uncacheRoot(s.root);
      });
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry !== undefined) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const c = CAST[picked];
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", background: "radial-gradient(circle at 50% 35%, #3a2470, #0d0818 80%)", color: "#fff", fontFamily: "'Trebuchet MS', sans-serif" }}>
      <h2 style={{ margin: "14px 0 0", fontFamily: "Impact, sans-serif", fontSize: 36, color: "#ffd36a", letterSpacing: 1 }}>Meet the heroes</h2>
      <div ref={mount} style={{ width: "100%", flex: 1, minHeight: 0 }} />
      {status !== "" && <div style={{ position: "absolute", top: "45%" }}>{status}</div>}
      <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
        {CAST.map((h, i) => (
          <button
            key={h.id}
            onClick={() => {
              setPicked(i);
              cheerRef.current(i);
            }}
            style={{ padding: "6px 18px", font: "bold 16px 'Trebuchet MS', sans-serif", color: "#fff", background: i === picked ? h.color : "rgba(255,255,255,0.12)", border: `2px solid ${h.color}`, borderRadius: 10, cursor: "pointer" }}
          >
            {h.name}
          </button>
        ))}
      </div>
      {c !== undefined && (
        <div style={{ maxWidth: 560, textAlign: "center", marginBottom: 8 }}>
          <b style={{ color: c.color }}>{c.name} — {c.role}</b>
          <div style={{ fontSize: 14, opacity: 0.9 }}>{c.blurb}</div>
        </div>
      )}
      <button onClick={onBack} style={{ marginBottom: 14, padding: "6px 26px", font: "bold 16px 'Trebuchet MS', sans-serif", color: "#fff", background: "#6a3fc0", border: "2px solid #0a0612", borderRadius: 10, cursor: "pointer" }}>
        Back
      </button>
    </div>
  );
}
