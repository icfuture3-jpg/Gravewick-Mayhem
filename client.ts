import { defineClient } from "@trhs/wildwood/client";
import { createFrameRoot } from "@trhs/wildwood/react";
import { createElement } from "react";
import { BoardProtocol, game, type Row } from "./game";
import { GameHud, type BoardApi } from "./hud";

type Mode = "story" | "endless";
type Listener = (mode: Mode, rows: Row[], saved: boolean | null) => void;

// The brawl itself is simulated and drawn by the full-screen canvas inside the HUD.
export default defineClient(game, {
  simulate(ctx) {
    let listener: Listener | null = null;
    ctx.onMessage(BoardProtocol.toClient.board, (b) => listener?.(b.mode, b.rows, b.saved));
    return {
      submit: (mode: Mode, run: { score: number; kills: number; wave: number }) =>
        ctx.send(BoardProtocol.toServer.submit, { mode, run }),
      view: (mode: Mode) => ctx.send(BoardProtocol.toServer.view, { mode }),
      listen: (l: Listener | null) => {
        listener = l;
      },
    };
  },
  present(ctx, simulation) {
    const root = createFrameRoot(ctx);
    const api: BoardApi = { ...simulation, openSignup: () => ctx.treehouse.signup(null) };
    root.render(createElement(GameHud, { board: api }));
    return { render() {} };
  },
});
