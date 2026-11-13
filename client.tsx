import { createRoot } from "react-dom/client";
import { GameHud } from "./hud";
import { createLocalBoard } from "./leaderboard";

const container = document.getElementById("root");
if (container === null) throw new Error("Game root is missing");
createRoot(container).render(<GameHud board={createLocalBoard()} />);
