import { expect, it, vi } from "vitest";
import { createLocalBoard } from "./leaderboard";

function memoryStorage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
}
const run = (score: number) => ({ score, kills: 3, wave: 2 });

it("keeps a sorted top ten, persists on reload, and isolates modes", () => {
  const storage = memoryStorage();
  const board = createLocalBoard(() => storage);
  const listener = vi.fn();
  board.listen(listener);
  board.view("endless");
  expect(listener).toHaveBeenLastCalledWith("endless", [], null);
  for (let score = 1; score <= 12; score += 1) board.submit("endless", run(score));
  const rows = listener.mock.lastCall![1];
  expect(rows.map((r: { score: number }) => r.score)).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3]);
  expect(listener.mock.lastCall![2]).toBe(true);
  board.submit("story", run(100));
  const reloaded = createLocalBoard(() => storage);
  reloaded.listen(listener);
  reloaded.view("endless");
  expect(listener.mock.lastCall![1]).toEqual(rows);
  reloaded.view("story");
  expect(listener.mock.lastCall![1][0].score).toBe(100);
});

it("keeps playing with in-memory scores when browser storage is blocked", () => {
  const board = createLocalBoard(() => { throw new Error("Blocked"); });
  const listener = vi.fn();
  board.listen(listener);
  board.submit("endless", run(42));
  expect(listener.mock.lastCall![1][0].score).toBe(42);
  expect(listener.mock.lastCall![2]).toBe(false);
  board.view("endless");
  expect(listener.mock.lastCall![1][0].score).toBe(42);
});

it.each(["not json", '{"score":1}', '[{"score":-1,"kills":0,"wave":0}]'])("recovers from corrupt saved scores: %s", (value) => {
  const storage = memoryStorage();
  storage.setItem("gravewick-mayhem:scores:v1:story", value);
  const board = createLocalBoard(() => storage);
  const listener = vi.fn();
  board.listen(listener);
  board.view("story");
  expect(listener).toHaveBeenLastCalledWith("story", [], null);
  board.submit("story", run(12));
  expect(listener.mock.lastCall![1][0].score).toBe(12);
});

it("rejects invalid scores and detaches listeners", () => {
  const board = createLocalBoard(memoryStorage);
  const listener = vi.fn();
  board.listen(listener);
  expect(() => board.submit("story", run(-1))).toThrow();
  expect(() => board.submit("story", run(NaN))).toThrow();
  expect(listener).not.toHaveBeenCalled();
  board.listen(null);
  board.view("story");
  expect(listener).not.toHaveBeenCalled();
});
