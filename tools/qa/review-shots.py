# Downscaled review copies of captured PNGs (for visual QA only).
# Usage: python review.py <screenshotsDir> <outDir> [maxWidth] [maxHeight]
import sys, os, glob
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
max_w = int(sys.argv[3]) if len(sys.argv) > 3 else 1100
max_h = int(sys.argv[4]) if len(sys.argv) > 4 else 2400
for f in sorted(glob.glob(os.path.join(src, '**', '*.png'), recursive=True)):
    rel = os.path.relpath(f, src).replace(os.sep, '__').replace('.png', '.jpg')
    im = Image.open(f).convert('RGB')
    w, h = im.size
    scale = min(max_w / w, 1)
    im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    if im.height > max_h:
        im = im.crop((0, 0, im.width, max_h))
    os.makedirs(out, exist_ok=True)
    im.save(os.path.join(out, rel), quality=80)
    print(rel, (w, h))
