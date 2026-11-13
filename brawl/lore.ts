// Grimoire entries: monsters get written into the book the first time you meet them.
export interface Lore {
  kind: string;
  name: string;
  tip: string;
}
export const LORE: Lore[] = [
  { kind: "clown", name: "Nightmare Clown", tip: "Erratic rusher that swarms you. Fragile: sweep it away with area attacks." },
  { kind: "bat", name: "Eyeball Bat", tip: "Floats at range and fires tracking lasers. Its eye glows red just before it shoots." },
  { kind: "ghoul", name: "Bone Ghoul", tip: "Heavy and armored. A red ring shows its cleaver slam: step out of the ring." },
  { kind: "slime", name: "Ecto Slime", tip: "Splits into two slimelets when popped. Use the Rift or Dynamite Pie." },
  { kind: "boogeyman", name: "The Boogeyman", tip: "Snot cannon spreads and clown illusions. Keep moving sideways." },
  { kind: "nergal", name: "Lord Nergal", tip: "Sweeping tentacle beam and rings of orbs. Run with the sweep, then slip through gaps." },
  { kind: "meteor", name: "Brain Meteor", tip: "Marks the floor before meteors land and drops slime pods. Never stand in red circles." },
];
export const loreFor = (kind: string): Lore | undefined => LORE.find((l) => l.kind === (kind === "minislime" ? "slime" : kind));
