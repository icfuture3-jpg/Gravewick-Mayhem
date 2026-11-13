import { expect, it } from "vitest";
import { attractPickup, bounceAtWalls } from "./physics";

it("lets a pie survive two wall bounces, then explode", () => {
  const pie = { x: 961, y: 100, vx: 400, vy: 80, bounces: 2 };
  expect(bounceAtWalls(pie, 960, 540)).toBe(false);
  expect(pie).toMatchObject({ x: 950, vx: -400, bounces: 1 });
  pie.x = 0;
  expect(bounceAtWalls(pie, 960, 540)).toBe(false);
  expect(pie).toMatchObject({ x: 10, vx: 400, bounces: 0 });
  pie.y = 541;
  expect(bounceAtWalls(pie, 960, 540)).toBe(true);
});
it("reflects both axes on corner contact without spending two bounces", () => {
  const pie = {x: -1, y: -1, vx: -50, vy: -60, bounces: 2};
  expect(bounceAtWalls(pie, 960, 540)).toBe(false);
  expect(pie).toEqual({x: 10, y: 10, vx: 50, vy: 60, bounces: 1});
});
it("does not change a pie away from the walls", () => {
  const pie = {x: 100, y: 100, vx: 10, vy: 20, bounces: 2};
  expect(bounceAtWalls(pie, 960, 540)).toBe(false);
  expect(pie.bounces).toBe(2);
});
it("keeps pickups finite at zero distance and prevents overshoot", () => {
  const pickup = {x: 20, y: 20};
  expect(attractPickup(pickup, 20, 20, 0.05)).toBe(0);
  expect(pickup).toEqual({x: 20, y: 20});
  expect(attractPickup(pickup, 21, 20, 0.05)).toBe(0);
  expect(pickup).toEqual({x: 21, y: 20});
  expect(attractPickup(pickup, 1000, 1000, 0.05)).toBeGreaterThan(90);
  expect(pickup).toEqual({x: 21, y: 20});
});
