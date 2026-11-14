// Tiny procedural audio: blips, noise bursts, and a spooky looping theme.

const BASS = [55, 55, 65.41, 49, 55, 55, 73.42, 61.74];
const SCALE = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];

export interface Sound {
  tone(freq: number, type: OscillatorType, dur: number, vol: number, slide?: number): void;
  noise(dur: number, vol: number): void;
  music(playing: boolean): void;
  setMuted(muted: boolean): void;
  close(): void;
  sample?(kind: "explosion" | "thunder", volume: number): void;
}

export function createSound(): Sound {
  let ctx: AudioContext | null = null;
  let muted = false;
  let nextBeat = 0;
  let beat = 0;
  let timer = 0;
  let closed = false;
  const recordings = new Map<string, HTMLAudioElement>();
  // Real audio files replace broadband noise for cinematic explosions and thunder.
  for (const [kind, file] of [["explosion", "explosion.wav"], ["thunder", "thunder.ogg"]]) {
    const audio = new Audio(`${import.meta.env.BASE_URL}audio/${file}`);
    audio.preload = "auto";
    recordings.set(kind!, audio);
  }

  const ensure = (): AudioContext => {
    if (ctx === null) {
      ctx = new AudioContext();
    }
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    return ctx;
  };

  const tone: Sound["tone"] = (freq, type, dur, vol, slide = 0) => {
    if (muted) {
      return;
    }
    const c = ensure();
    const o = c.createOscillator();
    const gain = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide !== 0) {
      o.frequency.exponentialRampToValueAtTime(
        Math.max(20, freq + slide),
        c.currentTime + dur,
      );
    }
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(gain);
    gain.connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur);
  };

  const noise: Sound["noise"] = (dur, vol) => {
    if (muted) {
      return;
    }
    const c = ensure();
    const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = c.createBufferSource();
    const gain = c.createGain();
    src.buffer = buffer;
    gain.gain.value = vol;
    src.connect(gain);
    gain.connect(c.destination);
    src.start();
  };

  const scheduleMusic = () => {
    if (ctx === null || muted) {
      return;
    }
    while (nextBeat < ctx.currentTime + 0.25) {
      const when = Math.max(nextBeat, ctx.currentTime);
      const bass = BASS[beat % BASS.length] ?? 55;
      const o = ctx.createOscillator();
      const gain = ctx.createGain();
      o.type = "sawtooth";
      o.frequency.value = bass;
      gain.gain.setValueAtTime(0.05, when);
      gain.gain.exponentialRampToValueAtTime(0.001, when + 0.4);
      o.connect(gain);
      gain.connect(ctx.destination);
      o.start(when);
      o.stop(when + 0.42);
      if (beat % 2 === 1 || Math.random() < 0.3) {
        const note = SCALE[Math.floor(Math.random() * SCALE.length)] ?? 220;
        const m = ctx.createOscillator();
        const mg = ctx.createGain();
        m.type = "triangle";
        m.frequency.value = note;
        mg.gain.setValueAtTime(0.035, when);
        mg.gain.exponentialRampToValueAtTime(0.001, when + 0.3);
        m.connect(mg);
        mg.connect(ctx.destination);
        m.start(when);
        m.stop(when + 0.32);
      }
      beat += 1;
      nextBeat = when + 0.3;
    }
  };

  return {
    tone,
    noise,
    sample(kind, volume) {
      if (muted || closed) return;
      const audio = recordings.get(kind)!;
      audio.volume = Math.min(1, Math.max(0, volume));
      audio.currentTime = 0;
      // No static fallback. Autoplay restrictions are recoverable with a Sound toggle.
      void audio.play().catch(() => {});
    },
    music(playing) {
      window.clearInterval(timer);
      if (playing) {
        const c = ensure();
        nextBeat = c.currentTime;
        timer = window.setInterval(scheduleMusic, 100);
      }
    },
    setMuted(value) {
      muted = value;
      for (const audio of recordings.values()) audio.muted = value;
    },
    close() {
      closed = true;
      for (const audio of recordings.values()) {audio.pause(); audio.removeAttribute("src"); audio.load();}
      recordings.clear();
      window.clearInterval(timer);
      if (ctx !== null) {
        void ctx.close();
        ctx = null;
      }
    },
  };
}
