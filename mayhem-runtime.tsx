import { useEffect, useRef, type RefObject } from "react";
import { createBrawl, type Brawl, type Mode, type Phase, type Summary } from "./engine";
import type { PracticeOptions } from "./practice";

export interface MayhemSession {mode: Mode; practice?: PracticeOptions}

/** The canvas, input listeners, animation loop and audio belong to one Mayhem run. */
export default function MayhemRuntime({session, muted, onMuted, onPhase, brawlRef}: {
  session: MayhemSession;
  muted: boolean;
  onMuted: (muted: boolean) => void;
  onPhase: (phase: Phase, summary: Summary) => void;
  brawlRef: RefObject<Brawl | null>;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    const brawl = createBrawl(canvas.current!, onPhase, onMuted);
    brawlRef.current = brawl;
    brawl.setMuted(mutedRef.current);
    if (session.practice) brawl.startPractice(session.practice);
    else brawl.start(session.mode);
    return () => {
      brawl.destroy();
      brawlRef.current = null;
    };
  }, [session, onPhase, onMuted, brawlRef]);

  useEffect(() => {brawlRef.current?.setMuted(muted);}, [muted, brawlRef]);

  return <canvas ref={canvas} aria-label="Gravewick Mayhem arena" width={960} height={540}
    style={{width: "100%", height: "100%", display: "block", cursor: "none"}} />;
}
