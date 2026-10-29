# Renders PDF pages to JPEG contact sheets for visual QA.
# Usage: python pdf-pages.py <pdf> <outDir> [scale]
import sys, os
import pypdfium2 as pdfium
from PIL import Image

pdf_path, out = sys.argv[1], sys.argv[2]
scale = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
os.makedirs(out, exist_ok=True)
pdf = pdfium.PdfDocument(pdf_path)
imgs = []
for i in range(len(pdf)):
    im = pdf[i].render(scale=scale).to_pil().convert('RGB')
    im.save(os.path.join(out, f'page-{i + 1:02d}.jpg'), quality=85)
    imgs.append(im)
# 2-up sheets for quick review
for s in range(0, len(imgs), 4):
    chunk = imgs[s:s + 4]
    w, h = chunk[0].size
    sheet = Image.new('RGB', (w * 2 + 10, h * 2 + 10), (120, 120, 120))
    for j, im in enumerate(chunk):
        sheet.paste(im, ((j % 2) * (w + 10), (j // 2) * (h + 10)))
    sheet.thumbnail((1800, 1300))
    sheet.save(os.path.join(out, f'sheet-{s // 4 + 1:02d}.jpg'), quality=82)
print(len(imgs), 'pages')
