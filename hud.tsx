import { HERO_ABILITIES } from "./hero-abilities";
import { PRACTICE_ENEMIES, type PracticeEnemy } from "./practice";
import type { BoardApi } from "./leaderboard";
import { HeroPreview } from "./preview";
import { LORE } from "./brawl/lore";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Row } from "./game";
import { createBrawl, type Brawl, type Mode, type Phase, type Summary } from "./engine";

const STAGE_LABEL = ["Backyard", "Crypts", "Citadel"];

type Screen = Phase | "grimoire" | "board" | "heroes" | "practice";

const BESTIARY = LORE.map((l) => [l.name, l.tip] as const);

const root: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "radial-gradient(circle at 50% 40%, #2a1850, #07030f)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "auto",
  fontFamily: "'Trebuchet MS', sans-serif",
  color: "#fff",
  zIndex: 50,
};
const stageBox: CSSProperties = {
  position: "relative",
  width: "min(100vw, calc(100vh * 16 / 9))",
  aspectRatio: "16 / 9",
};
const scrim: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  background: "rgba(7,3,15,0.72)",
  textAlign: "center",
};
const btn: CSSProperties = {
  font: "bold 20px 'Trebuchet MS', sans-serif",
  color: "#fff",
  background: "linear-gradient(#8a3ad8, #4a1a8a)",
  border: "3px solid #0a0612",
  borderRadius: 10,
  padding: "10px 28px",
  minWidth: 260,
  cursor: "pointer",
  boxShadow: "0 4px 0 #0a0612",
};
const heading: CSSProperties = {
  font: "900 56px Impact, 'Trebuchet MS', sans-serif",
  margin: 0,
  color: "#ffd36a",
  WebkitTextStroke: "3px #0a0612",
  paintOrder: "stroke fill",
  letterSpacing: 2,
};

export function GameHud({ board }: { board: BoardApi }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const brawlRef = useRef<Brawl | null>(null);
  const [screen, setScreen] = useState<Screen>("title");
  const [info, setInfo] = useState<Summary | null>(null);
  const [practiceHero, setPracticeHero] = useState<0 | 1 | 2>(0);
  const [practiceEnemy, setPracticeEnemy] = useState<PracticeEnemy>("clown");
  const [practising, setPractising] = useState(false);
  const [muted, setMuted] = useState(false);
  const [boardMode, setBoardMode] = useState<Mode>("endless");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [saved, setSaved] = useState<boolean | null>(null);
  const boardRef = useRef(board);
  boardRef.current = board;

  useEffect(() => {
    board.listen((mode, r, s) => {
      setBoardMode(mode);
      setRows(r);
      setSaved(s);
    });
    return () => board.listen(null);
  }, [board]);

  const openBoard = (mode: Mode) => {
    setBoardMode(mode);
    setRows(null);
    setSaved(null);
    board.view(mode);
    setScreen("board");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) {
      return undefined;
    }
    const brawl = createBrawl(canvas, (phase, summary) => {
      setScreen(phase);
      setInfo(summary);
      if (summary.practice) return;
      if ((phase === "over" || phase === "victory") && summary.score > 0) {
        setRows(null);
        setSaved(null);
        boardRef.current.submit(summary.mode, {
          score: summary.score,
          kills: summary.kills,
          wave: summary.mode === "story" ? summary.stage + 1 : summary.wave,
        });
      } else if (phase === "over" || phase === "victory") {
        boardRef.current.view(summary.mode);
      }
    });
    brawlRef.current = brawl;
    return () => {
      brawl.destroy();
      brawlRef.current = null;
    };
  }, []);

  const begin = (mode: Mode) => { setPractising(false); brawlRef.current?.start(mode); };
  const beginPractice = () => {
    setPractising(true);
    brawlRef.current?.startPractice({hero: practiceHero, enemy: practiceEnemy});
  };

  return (
    <div style={root}>
      <div style={stageBox}>
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          style={{ width: "100%", height: "100%", display: "block", cursor: "none" }}
        />
        {screen === "title" && (
          <div style={scrim}>
            <svg width="640" height="150" viewBox="0 0 640 150" role="img" aria-label="Gravewick Mayhem">
              <text x="320" y="62" textAnchor="middle" fontFamily="Impact, sans-serif" fontSize="64" fill="#ffd36a" stroke="#0a0612" strokeWidth="8" paintOrder="stroke">
                GRAVEWICK
              </text>
              <text x="320" y="132" textAnchor="middle" fontFamily="Impact, sans-serif" fontSize="64" fill="#b05cf0" stroke="#0a0612" strokeWidth="8" paintOrder="stroke">
                MAYHEM
              </text>
            </svg>
            <button style={btn} onClick={() => begin("story")}>Story + training</button>
            <button style={btn} onClick={() => begin("endless")}>Endless arena</button>
            <button style={btn} onClick={() => setScreen("practice")}>Practice arena</button>
            <button style={btn} onClick={() => openBoard("endless")}>Local high scores</button>
            <button style={btn} onClick={() => setScreen("grimoire")}>Grimoire</button>
            <button style={btn} onClick={() => setScreen("heroes")}>Meet the heroes</button>
            <div style={{ fontSize: 14, opacity: 0.85, marginTop: 8 }}>
              WASD move · Mouse aim · J / left click attack · K / right click skill · L / Space ultimate · Shift dash · Q or 1-2-3 swap hero · G Grimoire · P pause · M mute
            </div>
          </div>
        )}
        {screen === "practice" && (
          <div style={scrim}>
            <h2 style={{...heading, fontSize: 36}}>Practice arena</h2>
            <label>Hero <select value={practiceHero} onChange={(e) => setPracticeHero(Number(e.target.value) as 0 | 1 | 2)}>
              {HERO_ABILITIES.map(({name}, index) => <option key={name} value={index}>{name}</option>)}
            </select></label>
            <label>Enemy <select value={practiceEnemy} onChange={(e) => setPracticeEnemy(e.target.value as PracticeEnemy)}>
              {PRACTICE_ENEMIES.map((kind) => <option key={kind} value={kind}>{LORE.find((l) => l.kind === kind)?.name}</option>)}
            </select></label>
            <p>All heroes available · Ultimate starts full · Defeated enemies respawn · No high scores</p>
            <button style={btn} onClick={beginPractice}>Start practice</button>
            <button style={btn} onClick={() => setScreen("title")}>Back</button>
          </div>
        )}
        {practising && screen === "playing" && <button style={{position: "absolute", top: 80, left: 16, zIndex: 60}} onClick={() => brawlRef.current?.refill()}>Refill health, skills &amp; ultimate</button>}
        {screen === "heroes" && <HeroPreview onBack={() => setScreen("title")} />}
        {screen === "grimoire" && (
          <div style={{ ...scrim, justifyContent: "flex-start", padding: "20px 40px", overflow: "auto", gap: 6 }}>
            <h2 style={{ ...heading, fontSize: 36 }}>Grimoire</h2>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              {HERO_ABILITIES.map(({name, color, primaryHint, skillName, skillHint, ultName, ultHint}) => (
                <div key={name} style={{ width: 250, padding: 8, border: `2px solid ${color}`, borderRadius: 8, background: "rgba(0,0,0,0.4)", fontSize: 13 }}>
                  <b style={{ color }}>{name}</b>
                  <div>{primaryHint} K · {skillName}: {skillHint} L · {ultName}: {ultHint}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, maxWidth: 780, fontSize: 13, textAlign: "left" }}>
              {BESTIARY.map(([name, text]) => (
                <div key={name} style={{ padding: 8, border: "2px solid #4a3a7a", borderRadius: 8, background: "rgba(0,0,0,0.4)" }}>
                  <b style={{ color: "#ffd36a" }}>{name}</b>
                  <div>{text}</div>
                </div>
              ))}
            </div>
            <button style={{ ...btn, minWidth: 160, padding: "6px 20px", fontSize: 16 }} onClick={() => setScreen("title")}>Back</button>
          </div>
        )}
        {screen === "board" && (
          <div style={{ ...scrim, justifyContent: "flex-start", padding: "20px 40px", gap: 8 }}>
            <h2 style={{ ...heading, fontSize: 36 }}>Local high scores</h2>
            <div style={{ display: "flex", gap: 10 }}>
              {(["endless", "story"] as const).map((m) => (
                <button
                  key={m}
                  style={{ ...btn, minWidth: 160, padding: "6px 20px", fontSize: 16, opacity: boardMode === m ? 1 : 0.55 }}
                  onClick={() => openBoard(m)}
                >
                  {m === "endless" ? "Endless arena" : "Story campaign"}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 14 }}>Saved in this browser only. No account or online leaderboard.</div>
            <BoardTable rows={rows} mode={boardMode} />
            <button style={{ ...btn, minWidth: 160, padding: "6px 20px", fontSize: 16 }} onClick={() => setScreen("title")}>Back</button>
          </div>
        )}
        {screen === "paused" && (
          <div style={scrim}>
            <h1 style={heading}>Paused</h1>
            <button style={btn} onClick={() => brawlRef.current?.togglePause()}>Resume</button>
            <button
              style={btn}
              onClick={() => {
                const next = !muted;
                setMuted(next);
                brawlRef.current?.setMuted(next);
              }}
            >
              Sound: {muted ? "off" : "on"}
            </button>
            <button style={btn} onClick={() => brawlRef.current?.quit()}>Quit to title</button>
          </div>
        )}
        {(screen === "over" || screen === "victory") && info !== null && (
          <div style={scrim}>
            <h1 style={heading}>{screen === "victory" ? "Underworld conquered!" : "Heroes down"}</h1>
            <div style={{ fontSize: 22 }}>Score {info.score}</div>
            <div style={{ fontSize: 16, opacity: 0.85 }}>
              {info.kills} monsters beaten · {info.mode === "story" ? STAGE_LABEL[info.stage] : `Reached wave ${info.wave}`}
            </div>
            {!info.practice && saved === false && <div role="status">Browser storage is unavailable. Scores last only for this session.</div>}
            {!info.practice && saved === true && <div role="status">High scores saved on this device.</div>}
            {!info.practice && <BoardTable rows={rows} mode={info.mode} compact />}
            <button style={btn} onClick={() => info.practice ? beginPractice() : begin(info.mode)}>Play again</button>
            <button style={btn} onClick={() => brawlRef.current?.quit()}>Title</button>
          </div>
        )}
      </div>
    </div>
  );
}

function BoardTable({ rows, mode, compact = false }: { rows: Row[] | null; mode: Mode; compact?: boolean }) {
  const shown = rows === null ? null : rows.slice(0, compact ? 5 : 10);
  const cell: CSSProperties = { padding: "2px 10px", textAlign: "right" };
  return (
    <div style={{ background: "rgba(0,0,0,0.45)", border: "2px solid #4a3a7a", borderRadius: 8, padding: 8, minWidth: 460, fontSize: compact ? 14 : 16 }}>
      {shown === null ? (
        <div style={{ padding: 8 }}>Loading…</div>
      ) : shown.length === 0 ? (
        <div style={{ padding: 8 }}>No scores on this device yet. Play a round!</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ color: "#ffd36a" }}>
              <th style={{ ...cell, textAlign: "left" }}>#  Player</th>
              <th style={cell}>Score</th>
              <th style={cell}>{mode === "story" ? "Stage" : "Wave"}</th>
              <th style={cell}>Kills</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={i} style={{ color: r.you ? "#7dffb0" : "#fff", fontWeight: r.you ? "bold" : "normal" }}>
                <td style={{ ...cell, textAlign: "left" }}>{i + 1}.  {r.name}</td>
                <td style={cell}>{r.score}</td>
                <td style={cell}>{r.wave}</td>
                <td style={cell}>{r.kills}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
