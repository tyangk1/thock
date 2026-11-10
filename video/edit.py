"""THOCK promo edit for EffectCraft. usage: python edit.py reels|youtube -> edit-<v>.json
Look: brutalist colour blocks wipe across every cut, slams shake the frame, hero + footer run as
12 fps stop-motion (Posterize Time), punches on half bars, flat grade + fine grain.
Audio: the music cut (fade-out) + the keyboard SFX track from sfx.py."""
import glob
import json
import os
import subprocess
import sys

V = sys.argv[1]
ROOT = os.path.dirname(os.path.abspath(__file__)).replace('\\', '/')
FPS = 30
TL = json.load(open(f'{ROOT}/timeline-{V}.json'))
BAR = TL['frames_per_bar']
W, H = (1080, 1920) if V == 'reels' else (1920, 1080)
events = json.load(open(f'{ROOT}/frames/{V}/events.json'))

# music: video frame 0 = downbeat of track_start_bar; fade the tail
bar_s = BAR / FPS
start_s = TL['downbeat_s'] + TL['track_start_bar'] * bar_s
dur_s = round(TL['bars'] * BAR) / FPS
fade = TL['fade_out_bars'] * bar_s
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{start_s:.4f}', '-t', f'{dur_s:.4f}', '-i', f"{ROOT}/{TL['track']}",
                '-af', f'afade=t=in:d=0.02,afade=t=out:st={dur_s - fade:.3f}:d={fade:.3f}', '-ar', '48000', '-ac', '2',
                f'{ROOT}/audio/{V}-music.wav'], check=True)

cmds = []
def c(cmd, **p): cmds.append({'command': cmd, 'params': p})
def key(layer, path, f, val): c('prop.addKey', layer=layer, path=path, time=round(f / FPS, 5), timeBase='comp', value=val)

scenes, t = [], 0
for name, a, b in TL['scenes']:
    n = len(glob.glob(f'{ROOT}/frames/{V}/{name}/*.jpg'))
    scenes.append((name, t, n)); t += n
TOTAL = t
c('comp.new', name=V, width=W, height=H, frameRate=FPS, duration=round(TOTAL / FPS, 4), background='#F4EFE6', open=True)
item = 2
for name, s, n in scenes:
    c('file.import', paths=[f'{ROOT}/frames/{V}/{name}/0000.jpg'], sequence=True, frameRate=FPS)
    c('project.rename', item=item, name=name); item += 1
for wav in ('music', 'sfx'):
    c('file.import', paths=[f'{ROOT}/audio/{V}-{wav}.wav'])
    c('project.rename', item=item, name=wav); item += 1

for name, s, n in scenes:
    c('layer.addItem', item=name, time=round(s / FPS, 5))
    if name in TL.get('stopmo', []):
        c('effect.apply', effect='Posterize Time', layers=[name])
        c('prop.set', layer=name, path='effects/#1/frameRate', value=12)

# colour-block wipe over every cut: a full-frame solid slides in from the left, covers the cut, exits right
COLORS = ['#FF5A1F', '#FFD23F', '#3A5BFF', '#3DDC97', '#111111', '#FF8FB1']
for i, (name, s, n) in enumerate(scenes[1:]):
    blk = f'block{i}'
    c('layer.newSolid', name=blk, color=COLORS[i % len(COLORS)], width=W, height=H)
    key(blk, 'transform/opacity', 0, 0)
    key(blk, 'transform/opacity', s - 5, 0)
    key(blk, 'transform/opacity', s - 4, 100)
    key(blk, 'transform/position', s - 4, [-W / 2, H / 2])
    key(blk, 'transform/position', s, [W / 2, H / 2])
    key(blk, 'transform/position', s + 4, [W * 1.5, H / 2])
    key(blk, 'transform/opacity', s + 4, 100)
    key(blk, 'transform/opacity', s + 5, 0)

# punch (half bars in the drops) + shake (every slam) on one adjustment layer
c('layer.newAdjustment', name='punch')
c('effect.apply', effect='Transform', layers=['punch'])
cuts = {s for _, s, _ in scenes}
for b0, b1 in TL['drops']:
    for hb in range(int(b0 * 2), int(b1 * 2)):
        f = round(hb * BAR / 2)
        if any(abs(f - x) < 8 for x in cuts):
            continue
        key('punch', 'effects/#1/scaleHeight', f, 103.5)
        key('punch', 'effects/#1/scaleHeight', f + 7, 100)
cx, cy = W / 2, H / 2
for e in events:
    if e['type'] != 'slam':
        continue
    f = e['f']
    for df, (dx, dy) in enumerate([(0, 0), (-18, 10), (15, -12), (-10, 7), (6, -4), (0, 0)]):
        key('punch', 'effects/#1/position', f + df, [cx + dx, cy + dy])

# grade: flat and punchy, fine grain (print feel)
c('layer.newAdjustment', name='grade')
c('effect.apply', effect='Lumetri Color', layers=['grade'])
c('prop.set', layer='grade', path='effects/#1/basicCorrection/tone/contrast', value=8)
c('prop.set', layer='grade', path='effects/#1/creative/adjustments/vibrance', value=10)
c('effect.apply', effect='Add Grain', layers=['grade'])
c('prop.set', layer='grade', path='effects/#2/tweaking/intensity', value=0.1)

c('layer.addItem', item='music', time=0)
c('layer.addItem', item='sfx', time=0)
json.dump(cmds, open(f'{ROOT}/edit-{V}.json', 'w'), indent=1)
print(f'edit-{V}.json', len(cmds), 'commands', TOTAL, 'frames', f'{TOTAL / FPS:.2f}s', 'cuts', [s for _, s, _ in scenes])
