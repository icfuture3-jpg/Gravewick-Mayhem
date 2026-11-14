import { useEffect, useState } from "react";
import { voicesAvailable, setVoicesEnabled, replayVoices } from "./voices";
export function VoiceControls() {
  const [enabled, setEnabled] = useState(true);
  const [available, setAvailable] = useState(false);
  useEffect(() => {setAvailable(voicesAvailable());}, []);
  return <div style={{position: "fixed", top: 4, right: 8, zIndex: 100, display: "flex", gap: 6, background: "#10091e", padding: 4, borderRadius: 6, fontSize: 12}}>
    <button disabled={!available} aria-pressed={enabled} onClick={() => {setEnabled(!enabled); setVoicesEnabled(!enabled);}}>{available ? `Voices: ${enabled ? "on" : "off"}` : "Device speech unavailable"}</button>
    <button disabled={!available || !enabled} onClick={replayVoices}>Replay voice</button>
  </div>;
}
