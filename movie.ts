// Short, automatically advancing action beats using the original animated models.
export type Action = "portal" | "gadget" | "illusion" | "team" | "victory";
export interface Actor {
  idx: number;
  x: number;
  y: number;
  s: number;
  face: 1 | -1;
  hop?: boolean;
}
export interface Scene {
  stage: number;
  tint: string;
  caption?: string;
  who: number;
  text: string;
  actors: Actor[];
  action: Action;
  duration: number;
  shake?: boolean;
}

const trio = (): Actor[] => [0, 1, 2].map((idx) => ({idx, x: 240 + idx * 230, y: 270, s: 1.7, face: 1}));
const beat = (stage: number, action: Action, caption: string, text: string, who: number, duration = 3): Scene => ({
  stage, action, caption, text, who, duration, actors: trio(),
  tint: "rgba(18,6,42,0.22)", shake: action === "gadget" || action === "team",
});
const places = ["Backyard breach", "Into the crypts", "Storm the citadel"];

export function arrival(stage: number): Scene[] {
  return [
    beat(stage, "portal", places[stage] ?? "Into the fray", "Grimble tears open a golden portal. The team dives through!", 0),
    beat(stage, "gadget", "Small hero. BIG trouble.", "Pip shrinks under a charging monster and launches a live gadget!", 1),
    beat(stage, "illusion", "Now you see three of me!", "Wisp vanishes. Her mirror doubles unleash a storm of spellbook bolts!", 2),
  ];
}
export function bossEntrance(stage: number): Scene[] {
  return [beat(stage, "team", "Boss incoming!", "Lantern ready. Gadgets armed. Spellbook open. Together!", 0, 3.5)];
}
export function turningPoint(stage: number): Scene[] {
  return [
    beat(stage, "portal", "Turn the tide!", "Grimble opens a flanking portal as the monster strikes!", 0, 2.6),
    beat(stage, "team", "Triple threat!", "Tiny Pip slides in. Wisp's doubles cover him. The heroes counterattack!", 2, 3),
  ];
}
export function celebration(stage: number): Scene[] {
  return [
    beat(stage, "team", "Finishing move!", "Golden light, a gadget blast, and a volley of magic drive the darkness back!", 1, 3),
    beat(stage, "victory", stage === 2 ? "GRAVEWICK SAVED!" : "VICTORY!", stage === 2
      ? "The portal seals. Grimble, Pip and Wisp celebrate: Gravewick is safe!"
      : "The team lands together. One triumphant pose—then on to the next fight!", -1, 3.5),
  ];
}
export const INTRO = arrival(0);
