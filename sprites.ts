// The export contains host-only model URLs, not models. Use the procedural canvas art.
export interface Sprite {
  frames: HTMLCanvasElement[];
  walk?: HTMLCanvasElement[]; // heroes: a walk cycle
  aspect: number; // width / height
  dur: number; // idle/loop clip seconds
  walkDur: number;
}

const NAMES = ["grimble", "pip", "wisp", "clown", "bat", "ghoul", "slime", "boogeyman", "nergal", "meteor"];
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

export const sprites: (Sprite | null)[] = NAMES.map(() => null);
