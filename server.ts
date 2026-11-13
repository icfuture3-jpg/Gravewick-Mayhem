import { defineServer } from "@trhs/wildwood/server";
import { createLeaderboard } from "@trhs/wildwood/leaderboard";
import { game, BoardProtocol, runSchema, type Row, type Run } from "./game";

// The brawl is simulated by the page; the server only keeps the boards.
export default defineServer(game, (ctx) => {
  const options = { schema: runSchema, rankBy: "score", order: "highest" } as const;
  // Built on first use so the server starts even where no platform is attached.
  let made: Record<"story" | "endless", ReturnType<typeof createLeaderboard<"score", Run>>> | null = null;
  const boards = (mode: "story" | "endless") => {
    made ??= {
      story: createLeaderboard(ctx.platform, { name: "story-score", ...options }),
      endless: createLeaderboard(ctx.platform, { name: "endless-score", ...options }),
    };
    return made[mode];
  };

  const rows = async (mode: "story" | "endless", userId: string | null): Promise<Row[]> =>
    (await boards(mode).read()).slice(0, 10).map((s) => ({
      name: s.displayName,
      score: s.entry.score,
      kills: s.entry.kills,
      wave: s.entry.wave,
      you: s.userId === userId,
    }));

  ctx.onMessage(BoardProtocol.toServer.submit, (player, { mode, run }) => {
    void (async () => {
      let saved: boolean | null = false;
      if (player.userId !== null) {
        saved = (await boards(mode).submit(player.userId, run)).type === "saved";
      }
      ctx.send(player, BoardProtocol.toClient.board, { mode, rows: await rows(mode, player.userId), saved });
    })();
  });

  ctx.onMessage(BoardProtocol.toServer.view, (player, { mode }) => {
    void (async () => {
      ctx.send(player, BoardProtocol.toClient.board, { mode, rows: await rows(mode, player.userId), saved: null });
    })();
  });
});
