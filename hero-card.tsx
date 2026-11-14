import { useEffect, useRef } from "react";
import { drawFigure } from "./heroes";
import { HERO_ABILITIES } from "./hero-abilities";
import type { HeroId } from "./solo-story";

/** Native button makes the animated character itself pointer- and keyboard-selectable. */
export function HeroCard({hero, selected, onClick}: {hero: HeroId; selected: boolean; onClick: () => void}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    let raf = 0;
    const frame = (now: number) => {
      ctx.clearRect(0, 0, 240, 170);
      drawFigure(ctx, hero, 120, 120 + Math.sin(now / 600) * 4, 1.1, 0, hero !== 1, false, now / 1000);
      raf = requestAnimationFrame(frame);
    }; raf = requestAnimationFrame(frame); return () => cancelAnimationFrame(raf);
  }, [hero]);
  const info = HERO_ABILITIES[hero];
  return <button aria-label={`Select ${info.name}`} aria-pressed={selected} onClick={onClick}
    style={{flex: 1, minWidth: 0, maxWidth: 250, padding: 4, border: `${selected ? 3 : 2}px solid ${info.color}`, borderRadius: 12, background: selected ? "#513478" : "#21152f", color: "white", cursor: "pointer", font: "bold 17px Trebuchet MS"}}>
    <canvas ref={canvas} width={240} height={170} aria-hidden="true" style={{display: "block", width: "100%", height: "clamp(70px, 15vh, 150px)", objectFit: "contain"}} />
    {info.name}
  </button>;
}
