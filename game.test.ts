import { startTestGame } from "@trhs/wildwood/testing";
import { expect, it } from "vitest";
import server from "./server";
import client from "./client";

it("lets a player join", () => {
  const test = startTestGame({ server, client, clients: 1 });
  test.settle();
  expect(test.clients.length).toBe(1);
  test.close();
});
