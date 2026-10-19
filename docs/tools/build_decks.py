"""Build the slide decks: python docs/tools/build_decks.py <repo> [deck-filter]
Writes docs/export/*.pptx and PNG previews (and contact sheets) to <preview root>."""
import importlib
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import deck_engine as E  # noqa: E402

repo = os.path.abspath(sys.argv[1])
flt = sys.argv[2] if len(sys.argv) > 2 else ''
preview_root = sys.argv[3] if len(sys.argv) > 3 else os.path.join(repo, 'docs', 'export', 'previews')
os.chdir(repo)
DECKS = [
    ('decks_main', 'Main System Defense', 'B1-Main-System-Defense-v1.0.pptx'),
    ('decks_tech', 'Technical Deep-Dive', 'B2-Technical-Deep-Dive-v1.0.pptx'),
    ('decks_sk', 'Salingkusog Module', 'B3-Salingkusog-Module-v1.0.pptx'),
    ('decks_training', 'Staff Training', 'B4-Staff-Training-v1.0.pptx'),
    ('decks_pitch', 'Executive Pitch', 'B5-Executive-Pitch-v1.0.pptx'),
]
for mod, title, fname in DECKS:
    if flt and flt not in mod:
        continue
    try:
        m = importlib.import_module(mod)
    except ModuleNotFoundError:
        print('skip', mod)
        continue
    pdir = os.path.join(preview_root, mod)
    for f in os.listdir(pdir) if os.path.isdir(pdir) else []:
        os.remove(os.path.join(pdir, f))
    deck = E.Deck(title, os.path.join(repo, 'docs', 'export', fname), pdir)
    for s in m.SLIDES:
        deck.add(s)
    n = deck.save()
    E.contact_sheet(pdir, os.path.join(preview_root, mod + '-sheet.png'))
    print(f'{fname}: {n} slides')
print('problems:', len(E.PROBLEMS))
for p in E.PROBLEMS:
    print(' -', p)
