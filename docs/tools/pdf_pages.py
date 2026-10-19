"""Render PDF pages to PNG for visual QA. usage: python pdf_pages.py <pdf> <outdir> [pages like 1,3,5-7] [zoom]"""
import os
import sys

import pymupdf

pdf, outdir = sys.argv[1], sys.argv[2]
spec = sys.argv[3] if len(sys.argv) > 3 else ''
zoom = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
os.makedirs(outdir, exist_ok=True)
doc = pymupdf.open(pdf)
pages = set()
if spec:
    for part in spec.split(','):
        if '-' in part:
            a, b = part.split('-')
            pages.update(range(int(a), int(b) + 1))
        else:
            pages.add(int(part))
else:
    pages = set(range(1, doc.page_count + 1))
print('pages', doc.page_count)
for n in sorted(pages):
    if 1 <= n <= doc.page_count:
        pix = doc[n - 1].get_pixmap(matrix=pymupdf.Matrix(zoom, zoom))
        path = os.path.join(outdir, f'p{n:03d}.png')
        pix.save(path)
        print(path)
