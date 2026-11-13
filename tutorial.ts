export const LESSONS = [
  { action: "move", text: "Move with WASD or the arrow keys" },
  { action: "attack", text: "Aim with the mouse. Press J or left click to attack" },
  { action: "skill", text: "Press K or right click to use your hero's skill" },
  { action: "swap", text: "Press Q or 1–3 to switch heroes" },
  { action: "dash", text: "Hold a direction and press Shift to dash" },
] as const;
export type TutorialAction = typeof LESSONS[number]["action"];
export function advanceLesson(step: number, action: TutorialAction): number {
  return LESSONS[step]?.action === action ? Math.min(step + 1, LESSONS.length) : step;
}
