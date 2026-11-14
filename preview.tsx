import { HERO_ABILITIES } from "./hero-abilities";
import { useEffect, useRef, useState } from "react";
import { drawFigure } from "./heroes";

const CAST = HERO_ABILITIES;

export function HeroPreview({ onBack }: { onBack: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [picked, setPicked] = useState(0);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const draw = (now: number) => {
      const t = now / 1000;
      ctx.clearRect(0, 0, 960, 340);
      CAST.forEach((hero, i) => {
        const x = 220 + i * 260;
        ctx.fillStyle = hero.color;
        ctx.globalAlpha = i === picked ? 0.4 : 0.15;
        ctx.beginPath();
        ctx.ellipse(x, 285, 75, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        drawFigure(ctx, i, x, 220 + Math.sin(t * 2 + i) * 4, i === picked ? 2 : 1.7, 0.1, i !== 1, false, t);
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [picked]);

  const hero = CAST[picked]!;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", background: "radial-gradient(circle at 50% 35%, #3a2470, #0d0818 80%)", color: "#fff" }}>
      <h2 style={{ margin: "14px 0 0", fontFamily: "Impact, sans-serif", fontSize: 36, color: "#ffd36a" }}>Meet the heroes</h2>
      <canvas ref={canvas} width={960} height={340} aria-label="The three original animated character models" style={{ width: "100%", flex: 1, minHeight: 0, objectFit: "contain" }} />
      <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
        {CAST.map((h, i) => <button key={h.name} aria-pressed={i === picked} onClick={() => setPicked(i)} style={{ padding: "6px 18px", font: "bold 16px 'Trebuchet MS', sans-serif", color: "#fff", background: i === picked ? h.color : "#30204f", border: `2px solid ${h.color}`, borderRadius: 10, cursor: "pointer" }}>{h.name}</button>)}
      </div>
      <div style={{ maxWidth: 560, textAlign: "center", marginBottom: 8 }}>
        <b style={{ color: hero.color }}>{hero.name} — {hero.role}</b>
        <div style={{ fontSize: 14 }}>{hero.blurb}</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>
          <div><b>J · {hero.primaryName}:</b> {hero.primaryHint}</div>
          <div><b>K · {hero.skillName}:</b> {hero.skillHint}</div>
          <div><b>L · {hero.ultName}:</b> {hero.ultHint}</div>
        </div>
      </div>
      <button onClick={onBack} style={{ marginBottom: 14, padding: "6px 26px", font: "bold 16px 'Trebuchet MS', sans-serif", color: "#fff", background: "#6a3fc0", border: "2px solid #0a0612", borderRadius: 10, cursor: "pointer" }}>Back</button>
    </div>
  );
}
