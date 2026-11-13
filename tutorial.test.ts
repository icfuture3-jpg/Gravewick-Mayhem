import { expect, it } from "vitest";
import { LESSONS, advanceLesson } from "./tutorial";
it("advances only when the current skill is practised", () => {
  expect(advanceLesson(0, "attack")).toBe(0);
  let step = 0;
  for (const lesson of LESSONS) step = advanceLesson(step, lesson.action);
  expect(step).toBe(LESSONS.length);
  expect(advanceLesson(step, "move")).toBe(step);
});
