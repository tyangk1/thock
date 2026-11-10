"""THOCK: encode processed images (work/) to display-size WebP in assets/img + exploded layers."""
import json
import os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'img')
os.makedirs(OUT, exist_ok=True)
rep = []


def save(im, name, width, q=80):
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    p = os.path.join(OUT, name + '.webp')
    if im.mode == 'RGBA':
        a = np.asarray(im).copy()
        a[a[..., 3] < 6] = 0
        Image.fromarray(a, 'RGBA').save(p, 'WEBP', quality=q, alpha_quality=90, method=6)
    else:
        im.convert('RGB').save(p, 'WEBP', quality=q, method=6)
    rep.append((name, os.path.getsize(p)))


def both(im, name, dw, mw, q=80):
    save(im, name, dw, q)
    save(im, name + '-m', mw, q)


cut = lambda n: Image.open(os.path.join(ROOT, 'work', 'cut', n + '.png')).convert('RGBA')
clean = lambda n: Image.open(os.path.join(ROOT, 'work', 'clean', n + '.png')).convert('RGB')

# keyboards: crop to a shared box so the colorways stay aligned
kbs = ['kb-bone-top', 'kb-ink-top', 'kb-pop-top']
boxes = [cut(n).getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox() for n in kbs]
ub = (min(b[0] for b in boxes) - 20, min(b[1] for b in boxes) - 20, max(b[2] for b in boxes) + 20, max(b[3] for b in boxes) + 40)
for n in kbs:
    both(cut(n).crop(ub), n, 1600, 820, 84)
b = cut('box')
both(b.crop(b.getbbox()), 'box', 1100, 640)

for n in ['sw-linear', 'sw-tactile', 'sw-clicky']:
    both(clean(n), n, 900, 560, 82)
for n in ['life-desk', 'life-hands', 'life-night', 'macro-keycap', 'macro-pcb']:
    both(clean(n), n, 1600, 900, 76)
    both(Image.open(os.path.join(ROOT, 'work', 'clean', n + '-ht.png')).convert('L'), n + '-ht', 1100, 700, 55)

# exploded view: full image (X-ray scan section) + riso halftone twin
both(clean('kb-exploded'), 'kb-exploded', 1500, 820, 80)
both(Image.open(os.path.join(ROOT, 'work', 'clean', 'kb-exploded-ht.png')).convert('L'), 'kb-exploded-ht', 1500, 820, 55)

tot = sum(s for _, s in rep)
for nme, s in rep:
    print(f'{nme:22s} {s / 1024:7.0f} KB')
print(f'TOTAL {tot / 1048576:.1f} MB, {len(rep)} files')
