# Shows which characters a PDF sets in a given font (QA for unexpected fallbacks).
# Usage: python pdf-font-chars.py <file.pdf> <fontNameFragment>
import sys
import pdfplumber

frag = sys.argv[2].lower()
found = {}
with pdfplumber.open(sys.argv[1]) as pdf:
    for i, page in enumerate(pdf.pages, 1):
        for ch in page.chars:
            if frag in ch['fontname'].lower():
                found.setdefault(ch['text'], set()).add(i)
for t, pages in found.items():
    print(ascii(t), 'U+%04X' % ord(t[0]) if t else '', 'pages', sorted(pages)[:12])
