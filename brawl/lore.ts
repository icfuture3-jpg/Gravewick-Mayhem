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
  { kind: "slime", name: "Ecto Slime", tip: "Splits into two slimelets when popped. Use the Lantern Portal or Gadget Pouch." },
  { kind: "boogeyman", name: "The Boogeyman", tip: "Snot cannon spreads and clown ambushes. Strafe the five-shot fan; below half health it widens to seven." },
  { kind: "nergal", name: "Lord Nergal", tip: "Sweeping beam and orb rings. Slip through gaps; below half health twelve orbs reverse their pattern and the sweep returns sooner." },
  { kind: "meteor", name: "Brain Meteor", tip: "Marks impacts on the floor and drops slime pods. Below half health paired circles appear together. Leave the marks before they land." },
];
export const loreFor = (kind: string): Lore | undefined => LORE.find((l) => l.kind === (kind === "minislime" ? "slime" : kind));
