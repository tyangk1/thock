"""THOCK logo concepts + final marks, drawn in DesignCraft (headless CLI).

usage: python tools/logo.py board            -> work/logo-board.png (3 concepts side by side)
       python tools/logo.py final <concept>  -> assets/brand/* (mark, wordmark, favicon sizes)

DesignCraft ids are deterministic: a shape frame takes 1 id, a text frame 2 (frame + story),
place.load 1, place.drop 1. The first object on a fresh doc gets id 7 (after the doc's own items).
"""
import json
import os
import subprocess
import sys

D = os.path.expandvars(r'%LOCALAPPDATA%\Programs\DesignCraft\designcraft-cli.exe')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))).replace('\\', '/')
FONT = ('Arial', 'Black')  # family, style (system Arial Black)
SW = {'Ink': '#111111', 'Paper': '#F4EFE6', 'Orange': '#FF5A1F', 'Yellow': '#FFD23F', 'Blue': '#3A5BFF', 'Mint': '#3DDC97', 'Cream': '#E8DFCF'}


class Doc:
    def __init__(self, w, h):
        self.args = ['run', '--cmd', 'file.new=' + json.dumps({'intent': 'web', 'units': 'pixels', 'width': w, 'height': h, 'pages': 1, 'facingPages': False, 'margins': 0})]
        for n, c in SW.items():
            self.cmd('swatch.create', name=n, color=c)
        self.next = 7

    def cmd(self, cid, **p):
        self.args += ['--cmd', f'{cid}=' + json.dumps(p)]

    def shape(self, rect, fill, shape='rectangle', stroke=None, sw=6, radius=0, rot=0, corners=None):
        self.cmd('frame.create', rect=rect, shape=shape, content='unassigned')
        i = self.next; self.next += 1
        self.cmd('object.fill', swatch=fill, ids=[i])
        self.cmd('object.stroke', swatch=stroke or 'Ink', weight=sw if stroke else 0, ids=[i])
        if radius or corners:
            self.cmd('object.cornerOptions', shape='rounded', size=radius, ids=[i], **({'corners': corners} if corners else {}))
        if rot:
            self.cmd('transform.set', rotation=rot, ref=4, ids=[i])
        return i

    def text(self, rect, s, size, fill='Ink', align='center', font=FONT, tracking=0):
        self.cmd('frame.create', rect=rect, content='text', text=s)
        i = self.next; self.next += 2
        self.cmd('text.selectStory', frame=i)
        fam, sty = font if isinstance(font, tuple) else (font, 'Regular')
        self.cmd('type.char', attrs={'fontFamily': fam, 'fontStyle': sty, 'size': size, 'fill': fill, 'tracking': tracking})
        self.cmd({'center': 'type.alignCenter', 'left': 'type.alignLeft', 'right': 'type.alignRight'}[align])
        return i

    def keycap(self, x, y, s, top='Orange', letter='T', lfill='Ink', shadow=10):
        """a brutalist keycap: hard shadow, body, dished top face, legend"""
        r = s * .2
        self.shape([x + shadow, y + shadow, x + s + shadow, y + s + shadow], 'Ink', radius=r)
        self.shape([x, y, x + s, y + s], top, stroke='Ink', sw=max(4, s * .05), radius=r)
        inset = s * .12
        self.shape([x + inset, y + inset * .8, x + s - inset, y + s - inset * 1.6], 'Paper' if top != 'Paper' else 'Cream', radius=r * .7)
        self.text([x, y + s * .18, x + s, y + s * .8], letter, s * .46, fill=lfill)

    def export(self, path, scale=None):
        if scale:
            self.args += ['--scale', str(scale)]
        self.args += ['--export', path]
        r = subprocess.run([D] + self.args, capture_output=True, text=True)
        if r.returncode:
            print(r.stdout[-800:], r.stderr[-800:])
            raise SystemExit(1)
        print('wrote', path)


def concept_a(d, ox, oy, s=1.0):
    """A: the keycap T — the mark is one pressed-ready keycap"""
    d.keycap(ox + 200 * s, oy + 110 * s, 200 * s, 'Orange', 'T')
    d.text([ox, oy + 380 * s, ox + 600 * s, oy + 500 * s], 'THOCK', 92 * s)


def concept_b(d, ox, oy, s=1.0):
    """B: the knob O — the rotary knob of the board replaces the O"""
    cx, cy, r = ox + 300 * s, oy + 262 * s, 54 * s
    d.text([ox, oy + 205 * s, cx - r - 16 * s, oy + 340 * s], 'TH', 96 * s, align='right')
    d.shape([cx - r + 8 * s, cy - r + 8 * s, cx + r + 8 * s, cy + r + 8 * s], 'Ink', shape='ellipse')
    d.shape([cx - r, cy - r, cx + r, cy + r], 'Orange', shape='ellipse', stroke='Ink', sw=7 * s)
    d.shape([cx - 6 * s, cy - r + 10 * s, cx + 6 * s, cy - 8 * s], 'Ink', radius=5 * s)  # indicator line
    d.text([cx + r + 16 * s, oy + 205 * s, ox + 600 * s, oy + 340 * s], 'CK', 96 * s, align='left')
    d.text([ox, oy + 420 * s, ox + 600 * s, oy + 470 * s], 'MECHANICAL KEYBOARDS', 22 * s, font=('Consolas', 'Bold'), tracking=200)


def concept_c(d, ox, oy, s=1.0):
    """C: the stem + — the cross-shaped switch stem every mech fan knows"""
    cx, cy, r = ox + 300 * s, oy + 210 * s, 110 * s
    d.shape([cx - r + 10 * s, cy - r + 10 * s, cx + r + 10 * s, cy + r + 10 * s], 'Ink', shape='ellipse')
    d.shape([cx - r, cy - r, cx + r, cy + r], 'Mint', shape='ellipse', stroke='Ink', sw=8 * s)
    a, b = 92 * s, 26 * s  # arm length / thickness of the + stem
    d.shape([cx - b, cy - a, cx + b, cy + a], 'Ink', radius=8 * s)
    d.shape([cx - a, cy - b, cx + a, cy + b], 'Ink', radius=8 * s)
    d.text([ox, oy + 360 * s, ox + 600 * s, oy + 480 * s], 'THOCK', 92 * s)


CONCEPTS = {'a': concept_a, 'b': concept_b, 'c': concept_c}


def key_white(src, dst_sizes, out_base, keep=None):
    """DesignCraft exports on a white page: turn white into alpha (the marks are flat colours
    with black outlines), then write the requested sizes."""
    import numpy as np
    from PIL import Image
    im = Image.open(src).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    dist = (255 * 3 - a.sum(2)) / 3          # 0 on pure white
    alpha = np.clip(dist / 40, 0, 1)
    # un-premultiply the white fringe so edges stay their own colour
    rgb = np.where(alpha[..., None] > 0, (a - 255 * (1 - alpha[..., None])) / np.maximum(alpha[..., None], 1e-3), 0)
    out = Image.fromarray(np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype(np.uint8), 'RGBA')
    out = out.crop(out.getbbox())
    paths = []
    for name, size in dst_sizes:
        im2 = out.copy()
        if isinstance(size, int):  # square icon: pad to square, then resize
            side = max(im2.size)
            sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
            sq.paste(im2, ((side - im2.width) // 2, (side - im2.height) // 2))
            im2 = sq.resize((size, size), Image.LANCZOS)
        else:
            w = size[0]
            im2 = im2.resize((w, round(im2.height * w / im2.width)), Image.LANCZOS)
        p = f'{out_base}/{name}'
        im2.save(p)
        paths.append(p)
    return paths


def final():
    from PIL import Image
    brand = f'{ROOT}/assets/brand'
    os.makedirs(brand, exist_ok=True)
    # mark C (stem +) for favicon / app icon, drawn big and keyed
    d = Doc(600, 600)
    concept_c_mark(d, 300, 300, 1.0)
    d.export(f'{ROOT}/work/mark.png', scale=2)
    key_white(f'{ROOT}/work/mark.png', [('icon-512.png', 512), ('apple-touch-icon.png', 180), ('icon-32.png', 32), ('icon-16.png', 16)], brand)
    Image.open(f'{brand}/icon-512.png').save(f'{brand}/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    # wordmark B (knob O) for the header
    d = Doc(640, 200)
    concept_b(d, 20, -160, 1.0)
    d.export(f'{ROOT}/work/wordmark.png', scale=3)
    key_white(f'{ROOT}/work/wordmark.png', [('wordmark.png', (900,)), ('wordmark-small.png', (360,))], brand)
    # light version for dark backgrounds: ink -> paper, orange knob stays
    import numpy as np
    w = np.asarray(Image.open(f'{brand}/wordmark.png').convert('RGBA')).copy()
    dark = (w[..., :3].astype(int).sum(2) < 150)
    w[dark, :3] = (244, 239, 230)
    Image.fromarray(w, 'RGBA').save(f'{brand}/wordmark-light.png')
    # OG / share image 1200x630
    d = Doc(1200, 630)
    d.shape([0, 0, 1200, 630], 'Yellow')
    d.cmd('place.load', path=f'{ROOT}/work/cut/kb-pop-top.png'); d.next += 1
    d.cmd('place.drop', x=430, y=250, rect=[430, 240, 1230, 600]); d.next += 1
    concept_b(d, 30, -150, 1.0)
    d.text([60, 300, 560, 470], 'THE KEYBOARD PAGE YOU CAN TYPE ON.', 46, align='left')
    d.shape([60, 520, 420, 580], 'Orange', stroke='Ink', sw=5, radius=14)
    d.text([60, 530, 420, 575], 'TYPE ANYTHING.', 28)
    d.export(f'{ROOT}/assets/og.png')
    Image.open(f'{ROOT}/assets/og.png').convert('RGB').save(f'{ROOT}/assets/og.jpg', quality=88)
    os.remove(f'{ROOT}/assets/og.png')
    print('brand assets in', brand)


def concept_c_mark(d, cx, cy, s):
    r = 240 * s
    d.shape([cx - r + 18 * s, cy - r + 18 * s, cx + r + 18 * s, cy + r + 18 * s], 'Ink', shape='ellipse')
    d.shape([cx - r, cy - r, cx + r, cy + r], 'Mint', shape='ellipse', stroke='Ink', sw=22 * s)
    a, b = 200 * s, 58 * s
    d.shape([cx - b, cy - a, cx + b, cy + a], 'Ink', radius=18 * s)
    d.shape([cx - a, cy - b, cx + a, cy + b], 'Ink', radius=18 * s)

if __name__ == '__main__':
    mode = sys.argv[1]
    os.makedirs(f'{ROOT}/work', exist_ok=True)
    if mode == 'board':
        d = Doc(1800, 620)
        for i, bg in enumerate(['Yellow', 'Paper', 'Blue']):
            d.shape([i * 600, 0, i * 600 + 600, 620], bg)
        concept_a(d, 0, 20)
        concept_b(d, 600, 20)
        concept_c(d, 1200, 20)
        d.export(f'{ROOT}/work/logo-board.png')
    elif mode == 'final':
        final()
