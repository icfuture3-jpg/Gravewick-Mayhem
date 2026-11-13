import { runSchema, type Mode, type Row, type Run } from "./game";

export interface BoardApi {
  submit(mode: Mode, run: Run): void;
  view(mode: Mode): void;
  listen(listener: ((mode: Mode, rows: Row[], saved: boolean | null) => void) | null): void;
}

type ScoreStorage = Pick<Storage, "getItem" | "setItem">;
const scoresSchema = runSchema.array().max(10);
const key = (mode: Mode) => `gravewick-mayhem:scores:v1:${mode}`;

/** Local-only scores: never contacts Treehouse or requires an account. */
export function createLocalBoard(getStorage: () => ScoreStorage = () => window.localStorage): BoardApi {
  let listener: Parameters<BoardApi["listen"]>[0] = null;
  const scores: Partial<Record<Mode, Run[]>> = {};
  const read = (mode: Mode): Run[] => {
    if (scores[mode] === undefined) {
      let runs: Run[] = [];
      try {
        const parsed = scoresSchema.safeParse(JSON.parse(getStorage().getItem(key(mode)) ?? "[]"));
        if (parsed.success) runs = parsed.data;
      } catch {
        // Storage can be blocked or contain invalid JSON. The game still works in memory.
      }
      scores[mode] = runs.sort((a, b) => b.score - a.score);
    }
    return scores[mode];
  };
  const notify = (mode: Mode, saved: boolean | null) => {
    listener?.(mode, read(mode).map((run) => ({ ...run, name: "You", you: true })), saved);
  };
  return {
    listen(next) { listener = next; },
    view(mode) { notify(mode, null); },
    submit(mode, input) {
      const run = runSchema.parse(input);
      scores[mode] = [...read(mode), run].sort((a, b) => b.score - a.score).slice(0, 10);
      let saved = false;
      try {
        getStorage().setItem(key(mode), JSON.stringify(scores[mode]));
        saved = true;
      } catch {
        // Keep the session scores and explicitly warn that they won't survive a reload.
      }
      notify(mode, saved);
    },
  };
}
