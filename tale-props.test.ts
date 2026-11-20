import { expect, it, vi } from "vitest";
import { drawEnemy } from "./art";
import { drawMonsterToy, drawMeatMallet } from "./tale-props";
vi.mock("./art", () => ({drawEnemy: vi.fn()}));

it("renders toys from the actual enemy cast rather than box placeholders", () => {
  const context = new Proxy({}, {get: () => vi.fn()}) as CanvasRenderingContext2D;
  vi.mocked(drawEnemy).mockClear();
  for (let i = 0; i < 6; i++) drawMonsterToy(context, i, 500 + i * 50, 245, true, 3);
  expect(vi.mocked(drawEnemy).mock.calls.map((call) => call[1])).toEqual(["clown", "bat", "ghoul", "slime", "boogeyman", "nergal"]);
});
it("pivots the mallet at the same hand position through wind-up and impact", () => {
  const translate = vi.fn(), rotate = vi.fn();
  const context = new Proxy({translate, rotate}, {get: (obj, key) => Reflect.get(obj, key) ?? vi.fn()}) as unknown as CanvasRenderingContext2D;
  drawMeatMallet(context, 490, 220, 0);
  drawMeatMallet(context, 490, 220, 1);
  expect(translate.mock.calls).toEqual([[490, 220], [490, 220]]);
  expect(rotate.mock.calls[0]).not.toEqual(rotate.mock.calls[1]);
});

it("fixed toy podiums have no wheel circles or words above the models",()=>{
 const arc=vi.fn(),fillText=vi.fn();const context=new Proxy({arc,fillText},{get:(obj,key)=>Reflect.get(obj,key)??vi.fn()}) as unknown as CanvasRenderingContext2D;
 drawMonsterToy(context,1,500,245,true,1);
 expect(fillText).not.toHaveBeenCalled();
 expect(arc.mock.calls.some(call=>call[2]===7)).toBe(false);
 expect(arc.mock.calls.filter(call=>call[2]===3)).toHaveLength(1); // Single repair glint, not two wheel hubs.
});
