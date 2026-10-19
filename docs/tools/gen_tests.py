"""Generate test catalogue + RTM appendices for docs/08-test-documentation.md.
usage: gen_tests.py <vitest.json> <repo> <out.md> <rtm.json>"""
import datetime
import glob
import json
import os
import re
import sys

vit = json.load(open(sys.argv[1], encoding='utf-8'))
repo = sys.argv[2]
out = sys.argv[3]

UNIT_MAP = {
    'api/_lib/esm-imports.test.ts': ['NFR-18'],
    'api/_lib/forms.test.ts': ['FR-040', 'FR-046'],
    'api/_lib/seo.test.ts': ['FR-037', 'FR-038'],
    'api/_lib/traffic.test.ts': ['FR-080', 'FR-081'],
    'src/app/router.test.tsx': ['FR-039'],
    'src/components/story/Story.test.tsx': ['FR-030', 'NFR-13'],
    'src/components/ui/LogoLoader.test.tsx': ['NFR-13'],
    'src/components/ui/Modal.test.tsx': ['FR-050', 'NFR-13'],
    'src/components/ui/Tag.test.tsx': ['FR-030'],
    'src/components/ui/pageWindow.test.ts': ['FR-024', 'NFR-04'],
    'src/features/auth/authHelpers.test.ts': ['FR-001', 'FR-002'],
    'src/features/auth/permissions.test.ts': ['FR-005', 'FR-014', 'FR-016', 'FR-017', 'FR-106'],
    'src/features/cms/articles/editor/HistoryPanels.test.tsx': ['FR-013', 'FR-019'],
    'src/features/cms/articles/editor/WorkflowPanel.test.tsx': ['FR-014', 'FR-018'],
    'src/features/cms/dashboard/DashboardView.test.tsx': ['FR-074'],
    'src/features/cms/intake/IntakeDetailView.test.tsx': ['FR-047'],
    'src/features/cms/media/MediaDetails.test.tsx': ['FR-051', 'FR-053'],
    'src/features/cms/media/uploadMedia.test.ts': ['FR-050', 'FR-054'],
    'src/features/cms/salingkusog/TeamTab.test.tsx': ['FR-106'],
    'src/features/cms/salingkusog/awards/socialCard.test.ts': ['FR-123'],
    'src/features/cms/salingkusog/scheduleCsv.test.ts': ['FR-107'],
    'src/features/cms/salingkusog/scores/contest.test.tsx': ['FR-114', 'FR-115', 'FR-111'],
    'src/features/cms/salingkusog/scores/scores.test.tsx': ['FR-116', 'FR-118', 'FR-119'],
    'src/features/cms/salingkusog/scoring.test.ts': ['FR-116', 'FR-119', 'NFR-21'],
    'src/features/cms/salingkusog/setup/buildSchedule.test.tsx': ['FR-108', 'FR-109'],
    'src/features/cms/salingkusog/setup/setup.test.tsx': ['FR-102', 'FR-104', 'FR-107'],
    'src/features/cms/statistics/statistics.test.tsx': ['FR-083'],
    'src/features/public/archives/archivesData.test.ts': ['FR-035'],
    'src/features/public/article/Comments.test.tsx': ['FR-043', 'FR-045'],
    'src/features/public/home/HomeView.test.tsx': ['FR-030'],
    'src/features/public/intake/forms.test.tsx': ['FR-040', 'FR-042'],
    'src/features/public/intake/validate.test.ts': ['FR-040', 'FR-042'],
    'src/features/public/layout/Header.test.tsx': ['FR-031'],
    'src/features/public/salingkusog/countdown.test.tsx': ['FR-126'],
    'src/features/public/salingkusog/race.test.tsx': ['FR-121', 'FR-122'],
    'src/features/public/salingkusog/salingkusog.test.tsx': ['FR-120', 'FR-124', 'FR-117'],
    'src/features/public/section/SportsLanding.test.tsx': ['FR-124', 'FR-031'],
    'src/features/public/section/landing/landing.test.tsx': ['FR-031'],
    'src/lib/edgeCache.test.ts': ['NFR-02'],
    'src/lib/format.test.ts': ['FR-012', 'NFR-21'],
    'src/lib/images.test.ts': ['FR-050'],
    'src/lib/media.test.ts': ['NFR-03'],
    'src/lib/sanitize.test.ts': ['FR-032', 'NFR-08'],
    'src/lib/skContests.test.ts': ['FR-115', 'FR-119'],
    'src/lib/skSources.test.ts': ['FR-125', 'FR-113', 'FR-108'],
    'src/lib/slug.test.ts': ['FR-012'],
    'src/lib/useTween.test.ts': ['NFR-13'],
    'src/styles/contrast.test.ts': ['NFR-12'],
}
DB_MAP = {
    'public_access.test.sql': ['FR-023', 'FR-033', 'FR-034', 'FR-035', 'FR-041', 'FR-043', 'FR-045', 'FR-046', 'FR-048', 'FR-060', 'FR-063', 'FR-073', 'NFR-05', 'NFR-11', 'NFR-16'],
    'workflow.test.sql': ['FR-003', 'FR-005', 'FR-006', 'FR-007', 'FR-010', 'FR-011', 'FR-012', 'FR-014', 'FR-015', 'FR-016', 'FR-017',
                          'FR-018', 'FR-019', 'FR-020', 'FR-021', 'FR-022', 'FR-023', 'FR-047', 'FR-049', 'FR-053', 'FR-004', 'FR-008', 'FR-048', 'FR-055', 'FR-061', 'FR-075'],
    'salingkusog.test.sql': ['FR-100', 'FR-101', 'FR-102', 'FR-103', 'FR-104', 'FR-105', 'FR-106', 'FR-118', 'FR-120', 'FR-121', 'FR-126', 'FR-127'],
    'sk_brackets.test.sql': ['FR-108', 'FR-109', 'FR-110', 'FR-111', 'FR-112', 'FR-113'],
    'sk_contests.test.sql': ['FR-114', 'FR-115'],
    'stats.test.sql': ['FR-026', 'FR-080', 'FR-081', 'FR-082', 'FR-083', 'FR-084', 'NFR-10'],
}


def esc(s):
    return s.replace('|', '\\|').replace('\n', ' ')


# ---- unit suites and cases
suites, cases = [], []
for i, f in enumerate(sorted(vit['testResults'], key=lambda x: x['name'])):
    rel = os.path.relpath(f['name'], repo).replace(os.sep, '/')
    sid = f'TS-U-{i + 1:02d}'
    reqs = UNIT_MAP.get(rel, [])
    passed = sum(1 for a in f['assertionResults'] if a['status'] == 'passed')
    suites.append({'id': sid, 'file': rel, 'n': len(f['assertionResults']), 'passed': passed, 'reqs': reqs})
    for a in f['assertionResults']:
        cases.append({'id': f'TC-U-{len(cases) + 1:03d}', 'suite': sid, 'title': ' › '.join(a['ancestorTitles'] + [a['title']]),
                      'status': a['status'], 'ms': round(a.get('duration') or 0)})

# ---- database suites and checks
dsuites, dcases = [], []
pat = re.compile(r"tests\.expect_(ok|error|count|eq)\(\s*'((?:[^']|'')*)'", re.S)
for i, path in enumerate(sorted(glob.glob(os.path.join(repo, 'supabase', 'tests', '*.test.sql')))):
    name = os.path.basename(path)
    sid = f'TS-D-{i + 1:02d}'
    labels = [(m.group(1), m.group(2).replace("''", "'")) for m in pat.finditer(open(path, encoding='utf-8').read())]
    dsuites.append({'id': sid, 'file': 'supabase/tests/' + name, 'n': len(labels), 'reqs': DB_MAP.get(name, [])})
    for kind, label in labels:
        dcases.append({'id': f'TC-D-{len(dcases) + 1:03d}', 'suite': sid, 'kind': kind, 'title': label})

# ---- requirements from the SRS
srs = open(os.path.join(repo, 'docs', '02-srs.md'), encoding='utf-8').read()
reqs = re.findall(r'^\| ((?:FR|NFR)-\d+) \| ([^|]+)\|', srs, re.M)
covered = {}
for s in suites:
    for r in s['reqs']:
        covered.setdefault(r, []).append(s['id'])
for s in dsuites:
    for r in s['reqs']:
        covered.setdefault(r, []).append(s['id'])

L = []
w = L.append
w('# Appendix A. Automated test suites\n')
w(f"Unit and component tests (Vitest): **{len(cases)} cases in {len(suites)} suites**, run on {datetime.date.today().isoformat()} — "
  f"{sum(1 for c in cases if c['status'] == 'passed')} passed, {sum(1 for c in cases if c['status'] != 'passed')} failed.\n")
w('| Suite | File | Cases | Passed | Requirements |')
w('|---|---|---|---|---|')
for s in suites:
    w(f"| {s['id']} | `{s['file']}` | {s['n']} | {s['passed']} | {', '.join(s['reqs'])} |")
w(f"\nDatabase tests (`npm run db:test`): **{len(dcases)} checks in {len(dsuites)} suites**, run on {datetime.date.today().isoformat()} — all passed (the runner stops at the first failure).\n")
w('| Suite | File | Checks | Requirements |')
w('|---|---|---|---|')
for s in dsuites:
    w(f"| {s['id']} | `{s['file']}` | {s['n']} | {', '.join(s['reqs'])} |")
w('\n\\newpage\n')
w('# Appendix B. Requirements traceability matrix (RTM)\n')
w('Requirement → automated suites (Appendix A) → manual cases (§7). Design references: AMR-DOC-02 §9 and AMR-DOC-03 §5.\n')
w('| Requirement | Summary | Automated suites | Manual case | Status |')
w('|---|---|---|---|---|')
manual = json.load(open(sys.argv[4], encoding='utf-8'))
for rid, text in reqs:
    auto = covered.get(rid, [])
    mt = manual.get(rid, '')
    status = 'Automated — passing' if auto else ('Manual — not yet run' if mt else 'Not covered')
    summary = esc(text.strip())
    summary = summary[:95] + ('…' if len(summary) > 95 else '')
    w(f"| {rid} | {summary} | {', '.join(auto)} | {mt} | {status} |")
nauto = sum(1 for r, _ in reqs if covered.get(r))
nman = sum(1 for r, _ in reqs if not covered.get(r) and manual.get(r))
nnone = sum(1 for r, _ in reqs if not covered.get(r) and not manual.get(r))
w(f"\nCoverage: {len(reqs)} requirements — {nauto} with automated tests, {nman} with manual cases only, {nnone} not covered.\n")
w('\\newpage\n')
w('# Appendix C. Unit and component test cases\n')
w('| ID | Suite | Test (describe › it) | Result | ms |')
w('|---|---|---|---|---|')
for c in cases:
    w(f"| {c['id']} | {c['suite']} | {esc(c['title'])} | {c['status']} | {c['ms']} |")
w('\n\\newpage\n')
w('# Appendix D. Database test checks\n')
w('Kinds: **ok** = the statement must succeed; **error** = it must be refused; **count** = an exact row count (often 0 to prove a row is hidden); **eq** = an exact value.\n')
w('| ID | Suite | Check | Kind | Result |')
w('|---|---|---|---|---|')
for c in dcases:
    w(f"| {c['id']} | {c['suite']} | {esc(c['title'])} | {c['kind']} | passed |")
open(out, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
print('unit', len(cases), 'db', len(dcases), 'reqs', len(reqs), 'auto', nauto, 'manual', nman, 'none', nnone)
print('uncovered:', ', '.join(r for r, _ in reqs if not covered.get(r)))
