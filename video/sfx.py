"""Keyboard SFX track from frames/<v>/events.json (one-shots placed on their exact video frames),
plus a short 'block swoosh' on every scene cut. usage: python sfx.py reels|youtube"""
import json
import os
import sys
import wave
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
FPS = 30
rng = np.random.default_rng(3)
V = sys.argv[1]
ROOT = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(f'{ROOT}/timeline-{V}.json'))
BAR = TL['frames_per_bar']
events = json.load(open(f'{ROOT}/frames/{V}/events.json'))
dur = round(TL['bars'] * BAR) / FPS + .5
buf = np.zeros(int(dur * SR))


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, min(hi, SR / 2 - 100)], 'band', fs=SR, output='sos'), x)


def env(n, d):
    return np.exp(-np.arange(n) / SR / d)


def thock(pitch=1.0, deep=1.0, bright=0.0, gain=1.0):
    n = int(.16 * SR)
    t = np.arange(n) / SR
    f = (90 + 140 * np.exp(-t / .012)) * pitch * deep
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .03) * .9
    knock = bp(rng.standard_normal(n), 420 * pitch * deep, 1100 * pitch * deep) * env(n, .018) * 1.4
    clack = bp(rng.standard_normal(n), 1700 * pitch, 3600 * pitch) * env(n, .006) * .6
    x = body + knock + clack
    if bright:
        x += bp(rng.standard_normal(n), 4000, 7500) * env(n, .004) * bright
    i = int((.07 + rng.random() * .02) * SR)  # top-out on release
    x[i:] += bp(rng.standard_normal(n - i), 1200, 2600) * env(n - i, .006) * .25
    return np.tanh(x * 1.2) * gain


def tick():
    n = int(.05 * SR)
    return bp(rng.standard_normal(n), 2500, 6000) * env(n, .004) * .7


def slam():
    n = int(.6 * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(40 + 90 * np.exp(-t / .05)) / SR) * env(n, .18)
    clack = np.pad(thock(.7, .7, gain=1.2), (0, n - int(.16 * SR)))  # a giant key bottoming out
    return np.tanh(boom * 1.6 + clack) * .9


def swoosh(d=.22):
    n = int(d * SR)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    hop = 256
    win = np.hanning(hop * 2)
    for s in range(0, n - hop * 2, hop):  # overlap-add sweep: no zipper at chunk edges
        k = s / n
        fc = 500 + 5000 * np.sin(np.pi * k)
        out[s:s + hop * 2] += bp(x[s:s + hop * 2], fc * .7, fc * 1.4) * win
    return out * np.sin(np.pi * np.arange(n) / n) * .45


def place(sig, f, g=1.0):
    i = int(f / FPS * SR)
    if i >= len(buf):
        return
    s = sig[:len(buf) - i]
    buf[i:i + len(s)] += s * g


for e in events:
    t, f = e['type'], e['f']
    p = .94 + rng.random() * .12
    if t == 'key': place(thock(p), f, .9)
    elif t == 'key-soft': place(thock(p * 1.05, gain=.55), f, .7)
    elif t == 'space': place(thock(p, deep=.75), f, .95)
    elif t == 'tick': place(tick(), f, .5)
    elif t == 'slam': place(slam(), f, 1.0)
    elif t.startswith('sw-'):
        kind = t[3:]
        for j, df in enumerate((0, 4, 8)):
            place(thock(p, bright=(1.2 if kind == 'clicky' else 0), deep=(1 if kind != 'linear' else .9)), f + df, .8)
            if kind == 'tactile': place(tick(), f + df - .3, .4)
# a swoosh on every cut (the colour-block wipe)
for name, a, b in TL['scenes'][1:]:
    place(swoosh(), round(a * BAR) - 4, .8)

peak = np.max(np.abs(buf)) or 1
buf = buf / peak * .7
pcm = (np.stack([buf, buf], 1) * 32767).astype('<i2')
with wave.open(f'{ROOT}/audio/{V}-sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('sfx', len(events), 'events,', f'{dur:.1f}s')
