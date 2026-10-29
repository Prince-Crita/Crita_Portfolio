# Lists the fonts in a PDF: name, subtype and whether the font program is embedded (QA).
# Usage: python pdf-fonts.py <file.pdf>
import sys
from pypdf import PdfReader

fonts = {}
for page in PdfReader(sys.argv[1]).pages:
    res = page.get('/Resources') or {}
    for f in (res.get('/Font') or {}).values():
        f = f.get_object()
        sub = str(f.get('/Subtype'))
        desc = f.get('/FontDescriptor')
        if desc is None and '/DescendantFonts' in f:
            desc = f['/DescendantFonts'][0].get_object().get('/FontDescriptor')
        desc = desc.get_object() if desc is not None else {}
        embedded = any(k in desc for k in ('/FontFile', '/FontFile2', '/FontFile3'))
        name = str(f.get('/BaseFont') or desc.get('/FontName') or '(unnamed)')
        fonts[(name, sub)] = embedded or sub == '/Type3'
for (name, sub), emb in sorted(fonts.items()):
    print(f'{name:44} {sub:14} embedded={emb}')
