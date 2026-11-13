// Story cutscenes: short scripted scenes with the three heroes.
export interface Actor {
  idx: number; // 0 Grimble, 1 Pip, 2 Wisp
  x: number;
  y: number;
  s: number;
  face: 1 | -1; // 1 = looks right
  hop?: boolean;
}
export interface Scene {
  stage: number; // arena backdrop
  tint: string; // overlay colour
  caption?: string;
  who: number; // speaker (-1 narrator)
  text: string;
  actors: Actor[];
  shake?: boolean;
  voice?: string; // spoken-line clip name
}

const G = (x: number, s = 1.7, face: 1 | -1 = 1, hop = false): Actor => ({ idx: 0, x, y: 330, s, face, hop });
const P = (x: number, s = 1.7, face: 1 | -1 = 1, hop = false): Actor => ({ idx: 1, x, y: 330, s, face, hop });
const W = (x: number, s = 1.7, face: 1 | -1 = 1, hop = false): Actor => ({ idx: 2, x, y: 330, s, face, hop });

export const INTRO: Scene[] = [
  { voice: "intro-narrator", stage: 0, tint: "rgba(20,10,60,0.45)", caption: "Gravewick, the town between worlds", who: -1, text: "Every night, lost stars slip out of the sky and fall into Gravewick.", actors: [] },
  { voice: "intro-grimble-1", stage: 0, tint: "rgba(20,10,60,0.35)", who: 0, text: "Well, well, well... what have we wandered into? My lantern says the portals are leaking.", actors: [G(480, 2.2)] },
  { voice: "intro-pip", stage: 0, tint: "rgba(20,10,60,0.3)", who: 1, text: "Monsters! Finally! I brought gadgets. Several. One of them might be a sandwich.", actors: [G(300, 1.6, 1), P(660, 2, -1, true)] },
  { voice: "intro-wisp", stage: 0, tint: "rgba(20,10,60,0.3)", who: 2, text: "Please stay behind me, both of you. I've read the book on this. Twice.", actors: [G(220, 1.5, 1), P(480, 1.6, 1), W(740, 2, -1)] },
  { voice: "intro-grimble-2", stage: 0, tint: "rgba(40,10,60,0.3)", who: 0, text: "Apprentices, the Masters of the Between never run from mayhem. Let's smash some monsters!", actors: [G(300, 2, 1, true), P(480, 1.7, 1, true), W(660, 1.7, -1, true)] },
];

export const ENDING: Scene[] = [
  { voice: "end-grimble", stage: 2, tint: "rgba(255,200,80,0.15)", who: 0, text: "The portals are closed, the stars are home, and Gravewick is quiet again.", actors: [G(480, 2.2)] },
  { voice: "end-wisp", stage: 2, tint: "rgba(255,200,80,0.15)", who: 2, text: "I'll admit it. That was... mildly impressive.", actors: [G(300, 1.6, 1), W(660, 2, -1)] },
  { voice: "end-pip", stage: 2, tint: "rgba(255,200,80,0.15)", who: 1, text: "I KNEW the sandwich gadget would save us!", actors: [P(480, 2.2, 1, true), W(740, 1.5, -1)] },
  { voice: "end-narrator", stage: 2, tint: "rgba(255,220,120,0.2)", caption: "Masters of the Between", who: -1, text: "Grimble, Pip and Wisp bow. Tomorrow, the lantern will light another adventure.", actors: [G(260, 1.9, 1, true), P(480, 1.9, 1, true), W(700, 1.9, -1, true)] },
];
