import {SlimeTitle} from "./slime-title";
import { useEffect, useState } from "react";
import { loadSprites } from "./sprites";
import { createRoot } from "react-dom/client";
import { GameHud } from "./hud";
import { createLocalBoard } from "./leaderboard";

const container = document.getElementById("root");
if (container === null) throw new Error("Game root is missing");
const board = createLocalBoard();
function App() {
  const [status, setStatus] = useState("loading");
  useEffect(() => { void loadSprites().then(() => setStatus("ready"), () => setStatus("error")); }, []);
  if (status === "ready") return <GameHud board={board} />;
  return <main style={{ color: "white", fontFamily: "sans-serif", textAlign: "center", padding: "max(24px, 16vh) 12px" }}>
    <SlimeTitle />
    <p role="status">{status === "error" ? "Models could not load. Check your connection and WebGL support, then reload." : "Loading original character models…"}</p>
    {status === "error" && <button onClick={() => location.reload()}>Reload</button>}
  </main>;
}
createRoot(container).render(<App />);
