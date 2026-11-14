import {afterEach, expect, it, vi} from "vitest";
import {speakScene, stopVoices, setVoicesEnabled, muteVoices, voicePlaying, voicesAvailable, VOICE_STYLES} from "./voices";
afterEach(() => {stopVoices(); setVoicesEnabled(true); muteVoices(false); vi.unstubAllGlobals();});
function setup() {
  const speak = vi.fn(); const cancel = vi.fn();
  vi.stubGlobal("window", {speechSynthesis: {speak, cancel, getVoices: () => [{lang: "en-US", name: "Local"}]}});
  vi.stubGlobal("SpeechSynthesisUtterance", class {text: string; constructor(text: string) {this.text = text;}});
  return {speak, cancel};
}
it("speaks narrator then hero in distinct upbeat-cartoon styles", () => {
  const {speak} = setup(); speakScene({caption: "Into the crypt", who: 1, text: "Gadget time!"});
  expect(speak.mock.calls[0]![0]).toMatchObject({text: "Into the crypt", pitch: VOICE_STYLES[3].pitch});
  expect(voicePlaying()).toBe(true);
  speak.mock.calls[0]![0].onend();
  expect(speak.mock.calls[1]![0]).toMatchObject({text: "Gadget time!", pitch: VOICE_STYLES[1].pitch});
  speak.mock.calls[1]![0].onend(); expect(voicePlaying()).toBe(false);
});
it("cancel and voice-off prevent old lines continuing into the next screen", () => {
  const {speak} = setup(); speakScene({caption: "Old scene", who: 0, text: "Old line"});
  const old = speak.mock.calls[0]![0]; setVoicesEnabled(false); old.onend();
  expect(speak).toHaveBeenCalledTimes(1); expect(voicePlaying()).toBe(false);
  speakScene({who: 2, text: "Muted"}); expect(speak).toHaveBeenCalledTimes(1);
});
it("global sound mute stops voices and a missing speech engine is harmless", () => {
  const {speak} = setup(); muteVoices(true); speakScene({who: -1, text: "Muted"}); expect(speak).not.toHaveBeenCalled();
  vi.stubGlobal("window", {}); expect(voicesAvailable()).toBe(false);
  expect(() => speakScene({who: 0, text: "No voice"})).not.toThrow();
});

it("keeps every speaker brighter and brisker than the spooky delivery", () => {
  const {speak} = setup();
  for (const who of [0, 1, 2, -1]) {
    speakScene({who, text: "Well, that was a spectacularly silly idea!"});
    expect(speak.mock.lastCall![0].pitch).toBeGreaterThanOrEqual(1);
    expect(speak.mock.lastCall![0].rate).toBeGreaterThanOrEqual(1);
    expect(speak.mock.lastCall![0].rate).toBeLessThanOrEqual(1.2);
  }
  expect(new Set(VOICE_STYLES.map((s) => s.pitch)).size).toBe(4);
});
