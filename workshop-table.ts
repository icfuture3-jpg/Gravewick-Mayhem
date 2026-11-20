import * as THREE from "three";

/** Chunky bevelled wood, baked with the same lights and renderer as Pip. */
export function makeWorkshopTable() {
  const table = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({color: 0x9b683e, roughness: 0.65});
  const edge = new THREE.MeshStandardMaterial({color: 0x63452e, roughness: 0.75});
  const brass = new THREE.MeshStandardMaterial({color: 0xd5ad67, roughness: 0.5, metalness: 0.2});
  function plank(w: number, h: number, d: number, x: number, y: number, z: number, material = wood) {
    const shape = new THREE.Shape();
    shape.moveTo(-w/2,-h/2); shape.lineTo(w/2,-h/2); shape.lineTo(w/2,h/2); shape.lineTo(-w/2,h/2); shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {depth: d, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 3, steps: 1});
    geometry.translate(0,0,-d/2);
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x,y,z); table.add(mesh);
  }
  for (const z of [-0.5,0,0.5]) plank(5.8,0.22,0.46,0,2.2,z);
  plank(5.3,0.38,0.15,0,1.88,0.65,edge);
  for (const x of [-2.35,2.35]) for (const z of [-0.5,0.5]) {
    plank(0.28,1.9,0.28,x,1,z);
    plank(0.38,0.12,0.38,x,0.14,z,edge);
    const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.07,12,8),brass);
    bolt.position.set(x,1.9,0.76); table.add(bolt);
  }
  plank(4.8,0.2,0.18,0,0.6,0,edge);
  return table;
}
