import {expect,it} from "vitest";
import * as THREE from "three";
import {makeWorkshopTable} from "./workshop-table";
it("builds a dimensional bevelled table with wooden legs, apron and metallic fasteners",()=>{
 const table=makeWorkshopTable(),bounds=new THREE.Box3().setFromObject(table),size=bounds.getSize(new THREE.Vector3());
 expect(size.x).toBeGreaterThan(5);expect(size.y).toBeGreaterThan(2);expect(size.z).toBeGreaterThan(1);
 const materials=new Set<THREE.Material>();let bevelled=0;
 table.traverse(object=>{if(object instanceof THREE.Mesh){
   const geometry=object.geometry;
   for(const n of geometry.getAttribute("position").array)expect(Number.isFinite(n)).toBe(true);
   if(geometry instanceof THREE.ExtrudeGeometry && geometry.parameters.options.bevelEnabled)bevelled++;
   for(const m of Array.isArray(object.material)?object.material:[object.material])materials.add(m);
   geometry.dispose();
 }});
 expect(bevelled).toBeGreaterThan(10);expect(materials.size).toBe(3);
 for(const m of materials){expect(m).toBeInstanceOf(THREE.MeshStandardMaterial);m.dispose();}
});
