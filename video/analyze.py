"""Tempo / beat-grid / energy analysis of a music file (numpy + scipy only).

usage: python analyze.py audio/trackA.mp3
Prints BPM, first downbeat (s), frames per bar at 30 fps, and an energy map per bar
(loudness + low-end) so the edit can put the hook and the drops on the right bars.
"""
import json
import subprocess
import sys
import numpy as np
from scipy.signal import stft, find_peaks

SR = 22050
path = sys.argv[1]
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                     capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32)
dur = len(x) / SR

hop = 256
f, t, Z = stft(x, fs=SR, nperseg=1024, noverlap=1024 - hop, boundary=None)
mag = np.log1p(np.abs(Z) * 100)
flux = np.maximum(0, np.diff(mag, axis=1)).sum(0)
flux = (flux - flux.mean()) / (flux.std() + 1e-9)
low = np.abs(Z[f < 150]).sum(0)[1:]
fps_env = SR / hop

# tempo by autocorrelation of the onset envelope
ac = np.correlate(flux, flux, 'full')[len(flux) - 1:]
lags = np.arange(len(ac)) / fps_env
bpms = 60 / np.maximum(lags, 1e-9)
mask = (bpms > 70) & (bpms < 180)
cand = np.argsort(ac * mask)[::-1][:8]
best_lag = cand[0]
bpm = 60 / lags[best_lag]
# refine around the peak with parabolic interpolation
i = best_lag
if 1 <= i < len(ac) - 1:
    a, b, c = ac[i - 1], ac[i], ac[i + 1]
    p = 0.5 * (a - c) / (a - 2 * b + c + 1e-12)
    bpm = 60 / ((i + p) / fps_env)
# prefer the 120-170 range (trap/phonk often reads half or double)
while bpm < 110:
    bpm *= 2
while bpm > 175:
    bpm /= 2
beat = 60 / bpm

# beat phase: offset that maximises onset strength on the grid
best = (-1e9, 0)
for off in np.arange(0, beat, 0.005):
    idx = ((np.arange(off, dur, beat)) * fps_env).astype(int)
    idx = idx[idx < len(flux)]
    s = flux[idx].sum()
    if s > best[0]:
        best = (s, off)
phase = best[1]
# downbeat: of the 4 beat phases, the one with the most low-end (kick) on bar starts
bar = 4 * beat
scores = []
for k in range(4):
    off = phase + k * beat
    idx = (np.arange(off, dur, bar) * fps_env).astype(int)
    idx = idx[idx < len(low)]
    scores.append(low[idx].mean())
down = phase + int(np.argmax(scores)) * beat

# energy per bar
rms_hop = int(SR * 0.05)
rms = np.sqrt(np.convolve(x ** 2, np.ones(rms_hop) / rms_hop, 'same'))[::rms_hop]
lowband = np.interp(np.arange(len(rms)) * 0.05, t[1:], low)
bars = []
tb = down
while tb + bar <= dur + 1e-6:
    a, b = int(tb / 0.05), int((tb + bar) / 0.05)
    bars.append({'t': round(tb, 2), 'rms': round(float(rms[a:b].mean()), 4), 'low': round(float(lowband[a:b].mean()), 1)})
    tb += bar
mx = max(b['rms'] for b in bars)
mxl = max(b['low'] for b in bars)
out = {'file': path, 'duration': round(dur, 2), 'bpm': round(bpm, 2), 'downbeat_s': round(down, 3),
       'bar_s': round(bar, 4), 'frames_per_bar_30fps': round(bar * 30, 3), 'bars_total': len(bars)}
print(json.dumps(out))
print('bar  time   energy(rms)            low-end')
for i, b in enumerate(bars):
    print(f"{i:3d} {b['t']:6.2f}  {'#' * int(30 * b['rms'] / mx):30s} {'=' * int(20 * b['low'] / mxl)}")
json.dump({**out, 'bars': bars}, open(path.rsplit('.', 1)[0] + '.analysis.json', 'w'), indent=1)
