"""Original nonverbal toy squeaks, spring chirps and soft applause. No recordings."""
import math
import random
import struct
import wave
from pathlib import Path

rate = 22050
duration = 0.82
rng = random.Random(417)
frames = []
for i in range(int(rate * duration)):
    t = i / rate
    value = 0.0
    # A tiny chorus of upward toy whistles, deliberately not intelligible speech.
    for start, length, pitch in [(0.0, 0.25, 510), (0.09, 0.28, 680), (0.24, 0.32, 570), (0.4, 0.3, 850)]:
        u = t - start
        if 0 <= u < length:
            envelope = math.sin(math.pi * u / length) ** 1.5
            phase = 2 * math.pi * (pitch * u + 350 * u * u)
            value += envelope * (math.sin(phase) + 0.22 * math.sin(phase * 2)) * 0.12
    for start in [0.04, 0.17, 0.3, 0.43, 0.56, 0.67]:
        u = t - start
        if 0 <= u < 0.065:
            value += rng.uniform(-1, 1) * math.exp(-u * 65) * 0.12
    frames.append(struct.pack('<h', round(max(-1, min(1, value)) * 26000)))
path = Path(__file__).resolve().parents[1] / 'public/audio/toy-cheer.wav'
with wave.open(str(path), 'wb') as audio:
    audio.setnchannels(1)
    audio.setsampwidth(2)
    audio.setframerate(rate)
    audio.writeframes(b''.join(frames))
