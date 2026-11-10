"""Contact sheet: N evenly spaced frames per scene. usage: python sheet.py reels|youtube out.jpg [N]"""
import glob
import os
import sys
from PIL import Image, ImageDraw

ver, out = sys.argv[1], sys.argv[2]
N = int(sys.argv[3]) if len(sys.argv) > 3 else 6
scenes = sorted(d for d in glob.glob(f'frames/{ver}/*') if os.path.isdir(d))
scenes.sort(key=lambda d: int(''.join(c for c in os.path.basename(d) if c.isdigit()) or 0))
W = 160 if ver == 'reels' else 320
rows = []
for d in scenes:
    fs = sorted(glob.glob(d + '/*.jpg'))
    pick = [fs[round(i * (len(fs) - 1) / (N - 1))] for i in range(N)]
    ims = [Image.open(p).convert('RGB') for p in pick]
    H = round(ims[0].height * W / ims[0].width)
    row = Image.new('RGB', (W * N + 70, H), 'white')
    dr = ImageDraw.Draw(row)
    dr.text((4, 4), os.path.basename(d), fill='black')
    for i, im in enumerate(ims):
        row.paste(im.resize((W, H)), (70 + i * W, 0))
    rows.append(row)
sheet = Image.new('RGB', (rows[0].width, sum(r.height + 6 for r in rows)), 'white')
y = 0
for r in rows:
    sheet.paste(r, (0, y))
    y += r.height + 6
sheet.save(out, quality=80)
print(out, sheet.size)
