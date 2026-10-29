# Lists fonts referenced and embedded in a .pptx (QA).
# Usage: python pptx-fonts.py <deck.pptx>
import re, sys, zipfile

z = zipfile.ZipFile(sys.argv[1])
pres = z.read('ppt/presentation.xml').decode('utf-8')
embedded = re.findall(r'<p:embeddedFont><p:font typeface="([^"]+)"', pres)
used = set()
for n in z.namelist():
    if n.startswith('ppt/slides/slide') and n.endswith('.xml'):
        used.update(re.findall(r'typeface="([^"+]+)"', z.read(n).decode('utf-8')))
print('embedded :', embedded)
print('font parts:', [n for n in z.namelist() if n.startswith('ppt/fonts/')])
print('referenced in slides:', sorted(used))
