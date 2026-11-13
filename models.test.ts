import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const names = ["grimble", "pip", "wisp", "clown", "bat", "ghoul", "slime", "boogeyman", "nergal", "meteor"];
it.each(names)("ships a self-contained binary model for %s", (name) => {
  const bytes = readFileSync(new URL(`./public/assets/${name}.glb`, import.meta.url));
  expect(bytes.toString("ascii", 0, 4)).toBe("glTF");
  expect(bytes.readUInt32LE(4)).toBe(2);
  expect(bytes.readUInt32LE(8)).toBe(bytes.length);
  const jsonLength = bytes.readUInt32LE(12);
  const model = JSON.parse(bytes.toString("utf8", 20, 20 + jsonLength));
  expect(model.meshes.length).toBeGreaterThan(0);
  for (const resource of [...(model.buffers ?? []), ...(model.images ?? [])]) expect(resource.uri).toBeUndefined();
  if (name !== "bat") expect(model.animations.map((clip: {name: string}) => clip.name)).toEqual(expect.arrayContaining(["idle", "walk"]));
});
