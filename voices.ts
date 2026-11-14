// Device-provided speech, not recorded voice acting. No credentials or external audio assets.
export const VOICE_STYLES = [
  {name: "Grimble", pitch: 1.05, rate: 1.04},
  {name: "Pip", pitch: 1.6, rate: 1.2},
  {name: "Wisp", pitch: 1.3, rate: 1.1},
  {name: "Narrator", pitch: 1.15, rate: 1.08},
] as const;
export interface VoiceLine {who: number; text: string}
let enabled = true;
let muted = false;
let current: VoiceLine[] = [];
let generation = 0;
let speaking = false;
export const voicePlaying = () => speaking;
const synth = () => typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
export function stopVoices() {generation++; speaking = false; synth()?.cancel();}
export function voicesAvailable() {return synth() !== null && typeof SpeechSynthesisUtterance !== "undefined";}
export function setVoicesEnabled(value: boolean) {enabled = value; if (!value) stopVoices();}
export function muteVoices(value: boolean) {muted = value; if (value) stopVoices();}
export function speakLines(lines: VoiceLine[]) {
  current = lines;
  stopVoices();
  const speech = synth();
  if (!speech || !voicesAvailable() || !enabled || muted) return;
  speaking = true;
  const token = generation;
  const next = (i: number) => {
    if (token !== generation) return;
    if (i >= lines.length) {speaking = false; return;}
    const line = lines[i]!;
    const index = line.who >= 0 && line.who < 3 ? line.who : 3;
    const style = VOICE_STYLES[index]!;
    const utterance = new SpeechSynthesisUtterance(line.text);
    const english = speech.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
    if (english.length) utterance.voice = english[index % english.length]!;
    utterance.lang = "en-US"; utterance.pitch = style.pitch; utterance.rate = style.rate; utterance.volume = 0.9;
    utterance.onend = () => next(i + 1);
    utterance.onerror = () => {if (token === generation) speaking = false;}; // Missing device voice must never block the game.
    speech.speak(utterance);
  };
  next(0);
}
export function speakScene(scene: {caption?: string; who: number; text: string}) {
  speakLines([...(scene.caption ? [{who: -1, text: scene.caption}] : []), {who: scene.who, text: scene.text}]);
}
export function replayVoices() {speakLines(current);}
