"""Build the documentation exports.

usage: python build_docs.py <repo> [docx|pdf|all] [name-filter]
  docx: docs/NN-*.md -> docs/export/NN-*-v1.0.docx   (pandoc + styled reference.docx)
  pdf : all docs -> docs/export/Amaranth-v2-Documentation-v1.0.pdf (pandoc HTML + Chrome print)
"""
import glob
import os
import re
import subprocess
import sys

import pypandoc

REPO = os.path.abspath(sys.argv[1])
MODE = sys.argv[2] if len(sys.argv) > 2 else 'all'
FILTER = sys.argv[3] if len(sys.argv) > 3 else ''
HERE = os.path.dirname(os.path.abspath(__file__))
PANDOC = pypandoc.get_pandoc_path()
DOCS = os.path.join(REPO, 'docs')
EXPORT = os.path.join(DOCS, 'export')
os.makedirs(EXPORT, exist_ok=True)
VERSION = 'v1.0'


def sources():
    files = sorted(glob.glob(os.path.join(DOCS, '[0-9][0-9]*-*.md')))
    return [f for f in files if FILTER in os.path.basename(f)]


def run(args, cwd=DOCS):
    r = subprocess.run(args, cwd=cwd, capture_output=True, text=True, encoding='utf-8')
    if r.returncode != 0:
        print(r.stderr)
        raise SystemExit(f'failed: {args[:4]}')
    if r.stderr.strip():
        print('  ', r.stderr.strip()[:400])
    return r.stdout


def build_docx(md):
    name = os.path.splitext(os.path.basename(md))[0]
    out = os.path.join(EXPORT, f'{name}-{VERSION}.docx')
    run([PANDOC, md, '-o', out, '--from', 'markdown-tex_math_dollars-raw_tex+pipe_tables+grid_tables+yaml_metadata_block',
         f'--reference-doc={os.path.join(HERE, "reference.docx")}', f'--lua-filter={os.path.join(HERE, "pagebreak.lua")}',
         '--resource-path', DOCS, '--wrap=none'])
    print('docx', os.path.basename(out))


CSS = r"""
@page { size: A4; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; color: #111a14; font-size: 10.5pt; line-height: 1.45; margin: 0; }
h1 { color: #14361f; font-size: 19pt; margin: 18pt 0 8pt; border-bottom: 2px solid #b5f000; padding-bottom: 4pt; page-break-after: avoid; }
h2 { color: #14361f; font-size: 14pt; margin: 14pt 0 6pt; page-break-after: avoid; }
h3 { color: #3f6a00; font-size: 12pt; margin: 12pt 0 4pt; page-break-after: avoid; }
h4 { color: #14361f; font-size: 10.5pt; margin: 10pt 0 4pt; }
p, li { orphans: 3; widows: 3; }
table { border-collapse: collapse; width: 100%; margin: 6pt 0 10pt; font-size: 8.6pt; page-break-inside: auto; }
tr { page-break-inside: avoid; }
th { background: #e8f1e9; color: #14361f; text-align: left; }
th, td { border: 1px solid #c9d3cb; padding: 3pt 5pt; vertical-align: top; overflow-wrap: anywhere; }
code { font-family: Consolas, monospace; font-size: 8.6pt; background: #f2f5f1; padding: 0 2px; overflow-wrap: anywhere; }
pre { background: #f2f5f1; padding: 6pt 8pt; font-size: 8pt; white-space: pre-wrap; overflow-wrap: anywhere; border-left: 3px solid #b5f000; page-break-inside: avoid; }
pre code { background: none; padding: 0; }
img { max-width: 100%; max-height: 225mm; display: block; margin: 6pt auto; page-break-inside: avoid; }
figure { margin: 8pt 0; page-break-inside: avoid; }
figcaption { font-size: 8.5pt; color: #556058; text-align: center; font-style: italic; }
blockquote { border-left: 3px solid #c9d3cb; margin: 6pt 0; padding: 2pt 10pt; color: #3a463e; }
.pagebreak { page-break-after: always; }
.doc { page-break-before: always; }
.cover { height: 250mm; display: flex; flex-direction: column; justify-content: center; }
.cover .mark { color: #3f6a00; font-weight: bold; letter-spacing: 2px; font-size: 10pt; }
.cover h1 { border: none; font-size: 30pt; margin: 6pt 0; }
.cover .sub { font-size: 14pt; color: #3f6a00; }
.cover .meta { margin-top: 30pt; color: #556058; font-size: 10pt; }
.titleblock { margin: 0 0 10pt; padding: 10pt 12pt; background: #14361f; color: #fff; border-left: 6px solid #b5f000; }
.titleblock .t { font-size: 18pt; font-weight: bold; }
.titleblock .s { font-size: 11pt; color: #d9e8b0; }
.toc a { color: #14361f; text-decoration: none; }
.toc li { margin: 2pt 0; }
"""


def build_pdf(files):
    parts = []
    toc = []
    for i, md in enumerate(files):
        name = os.path.splitext(os.path.basename(md))[0]
        text = open(md, encoding='utf-8').read()
        meta = dict(re.findall(r'^(title|subtitle|version|date):\s*"?(.*?)"?\s*$', text.split('---', 2)[1] if text.startswith('---') else '', re.M))
        html = run([PANDOC, md, '--from', 'markdown-tex_math_dollars-raw_tex+pipe_tables+grid_tables+yaml_metadata_block', '--to', 'html5',
                    f'--lua-filter={os.path.join(HERE, "pagebreak.lua")}', '--resource-path', DOCS, '--wrap=none',
                    '--id-prefix', f'd{i}-'])
        # images: make paths absolute for Chrome
        html = re.sub(r'src="((?:diagrams|screenshots)/[^"]+)"', lambda m: 'src="file:///' + os.path.join(DOCS, m.group(1)).replace('\\', '/') + '"', html)
        title = meta.get('title', name)
        anchor = f'doc-{i}'
        toc.append(f'<li><a href="#{anchor}">{title}</a></li>')
        parts.append(f'<section class="doc" id="{anchor}"><div class="titleblock"><div class="t">{title}</div>'
                     f'<div class="s">{meta.get("subtitle", "")} · {meta.get("version", VERSION)} · {meta.get("date", "")}</div></div>{html}</section>')
    cover = ('<div class="cover"><div class="mark">AMARANTH · VISAYAS STATE UNIVERSITY</div>'
             '<h1>Amaranth v2</h1><div class="sub">Software Engineering Documentation Package</div>'
             f'<div class="meta">Version {VERSION} · 2026-10-19<br>Newsroom, public site and Salingkusog intramurals module<br>'
             'Prepared by the Amaranth development team [TO CONFIRM: names]</div></div>')
    toc_html = '<div class="doc"><h1>Contents</h1><ol class="toc">' + ''.join(toc) + '</ol></div>'
    full = f'<!doctype html><html><head><meta charset="utf-8"><title>Amaranth v2 Documentation</title><style>{CSS}</style></head><body>{cover}{toc_html}{"".join(parts)}</body></html>'
    html_path = os.path.join(HERE, 'combined.html')
    open(html_path, 'w', encoding='utf-8').write(full)
    out = os.path.join(EXPORT, f'Amaranth-v2-Documentation-{VERSION}.pdf')
    printer = os.path.join(HERE, 'print-pdf.mjs')
    if not os.path.exists(os.path.join(HERE, 'node_modules')) and os.path.exists(os.path.join(HERE, 'node', 'print-pdf.mjs')):
        printer = os.path.join(HERE, 'node', 'print-pdf.mjs')  # scratch build layout
    subprocess.run(['node', printer, html_path, out], check=True)
    return out


def build_single_pdf(md):
    """One document as its own PDF (used for QA of a single file)."""
    out = build_pdf([md])
    single = os.path.join(HERE, 'qa', os.path.splitext(os.path.basename(md))[0] + '.pdf')
    os.makedirs(os.path.dirname(single), exist_ok=True)
    os.replace(out, single)
    return single


if __name__ == '__main__':
    files = sources()
    if MODE in ('docx', 'all'):
        for f in files:
            build_docx(f)
    if MODE in ('pdf', 'all'):
        if FILTER:
            print('qa pdf', build_single_pdf(files[0]))
        else:
            print('pdf', build_pdf(files))
