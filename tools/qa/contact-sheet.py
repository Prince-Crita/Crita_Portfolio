# Contact sheets of every screenshot referenced by content/portfolio.json (visual QA).
# Usage: python contact-sheet.py <portfolioRoot> <outDir>
import json, os, re, sys
from PIL import Image, ImageDraw

root, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
content = json.load(open(os.path.join(root, 'content', 'portfolio.json'), encoding='utf-8'))
refs = []
def collect(v):
    if isinstance(v, str) and re.match(r'^[a-z-]+/[a-z]+-(desktop|mobile)/', v):
        if v not in refs: refs.append(v)
    elif isinstance(v, list): [collect(x) for x in v]
    elif isinstance(v, dict): [collect(x) for x in v.values()]
collect(content)

tiles = []
for k in refs:
    im = Image.open(os.path.join(root, 'screenshots', k + '.png')).convert('RGB')
    mobile = '-mobile/' in k
    if not mobile: im = im.crop((0, 0, im.width, min(im.height, int(im.width * 0.625))))
    im.thumbnail((480, 300) if not mobile else (180, 390))
    tile = Image.new('RGB', (490, 420), (255, 255, 255))
    tile.paste(im, ((490 - im.width) // 2, 0))
    ImageDraw.Draw(tile).text((6, 400), k, fill=(0, 0, 0))
    tiles.append(tile)

per = 12
for s in range(0, len(tiles), per):
    chunk = tiles[s:s + per]
    sheet = Image.new('RGB', (490 * 4, 420 * 3), (230, 230, 230))
    for i, t in enumerate(chunk): sheet.paste(t, ((i % 4) * 490, (i // 4) * 420))
    sheet.save(os.path.join(out, f'refs-{s // per}.jpg'), quality=82)
print(len(refs), 'referenced screenshots')
