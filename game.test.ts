import { startTestGame } from "@trhs/wildwood/testing";
import { expect, it } from "vitest";
import server from "./server";
import client from "./client";
import { makeWave } from "./brawl/engine";

it("lets a player join", () => {
  const test = startTestGame({ server, client, clients: 1 });
  test.settle();
  expect(test.clients.length).toBe(1);
  test.close();
});

it("builds growing waves and keeps bosses out of them", () => {
  const early = makeWave("story", 0, 0);
  const late = makeWave("story", 2, 2);
  expect(late.length).toBeGreaterThan(early.length);
  expect(makeWave("endless", 0, 7).length).toBeGreaterThan(3);
});
