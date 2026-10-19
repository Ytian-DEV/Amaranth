"""Generate Mermaid ER diagrams from inventory.json (PK/FK columns only, so they stay legible)."""
import json
import os
import re
import sys

inv = json.load(open(sys.argv[1], encoding='utf-8'))
outdir = sys.argv[2]

GROUPS = {
    'erd-1-content': ['sections', 'categories', 'articles', 'article_authors', 'contributors', 'article_tags', 'tags', 'article_media',
                      'media_assets', 'article_revisions', 'article_activity', 'article_comments', 'article_comment_private',
                      'publication_issues', 'home_slots', 'profiles', 'article_daily_views'],
    'erd-2-people-intake': ['profiles', 'staff_invites', 'profile_sections', 'sections', 'contributors', 'team_terms', 'team_members',
                            'article_submissions', 'event_reports', 'intake_files', 'contact_messages', 'department_contacts',
                            'site_settings', 'audit_log', 'articles', 'media_assets'],
    'erd-3-salingkusog': ['sk_editions', 'sk_factions', 'sk_venues', 'sk_sports', 'sk_events', 'sk_athletes', 'sk_matches', 'sk_entries',
                          'sk_athlete_stats', 'sk_placements', 'sk_awards', 'sk_team', 'media_assets', 'profiles', 'articles'],
    'erd-4-statistics': ['stats_pageviews', 'stats_shares', 'staff_activity_daily', 'stats_daily_site', 'stats_daily_articles',
                         'stats_daily_dims', 'stats_daily_shares', 'stats_rollup_log', 'articles', 'profiles'],
}
FOCUS = {  # tables whose columns are drawn (others appear as plain boxes)
    'erd-1-content': GROUPS['erd-1-content'][:-2] + ['article_daily_views'],
    'erd-2-people-intake': GROUPS['erd-2-people-intake'][:-2],
    'erd-3-salingkusog': GROUPS['erd-3-salingkusog'][:12],
    'erd-4-statistics': GROUPS['erd-4-statistics'][:8],
}


def table(name):
    return inv['tables'].get('public.' + name) or inv['tables'].get('app.' + name)


def fks(name):
    t = table(name)
    out = []
    for c in t['columns']:
        m = re.search(r'references (?:public\.)?(\w+)', c['extra'])
        if m:
            out.append((c['name'], m.group(1)))
    for con in t['constraints']:
        m = re.search(r'foreign key \(([^)]*)\) references (?:public\.)?(\w+)', con)
        if m:
            cols = [x.strip() for x in m.group(1).split(',')]
            col = [x for x in cols if x != 'edition_id'] or cols
            out.append((col[0], m.group(2)))
    seen, uniq = set(), []
    for col, ref in out:
        if (col, ref) not in seen:
            seen.add((col, ref))
            uniq.append((col, ref))
    return uniq


def ctype(t):
    t = t.replace('public.', '').replace(' ', '')
    t = re.sub(r'\(.*\)', '', t)
    return t.replace('[]', '_array')


for gname, tables in GROUPS.items():
    lines = ['erDiagram']
    focus = set(FOCUS[gname])
    for name in tables:
        t = table(name)
        if t is None:
            continue
        if name not in focus:
            lines.append(f'  {name} {{\n    uuid id PK\n  }}')
            continue
        fkcols = {c for c, _ in fks(name)}
        rows = []
        for c in t['columns']:
            is_pk = 'primary key' in c['extra'] or any(con.startswith('primary key') and c['name'] in con for con in t['constraints'])
            if is_pk or c['name'] in fkcols or c['name'] in ('status', 'role', 'format', 'medal', 'place', 'slug', 'day', 'kind', 'key'):
                tag = ' PK' if is_pk else (' FK' if c['name'] in fkcols else '')
                rows.append(f'    {ctype(c["type"])} {c["name"]}{tag}')
        lines.append(f'  {name} {{\n' + '\n'.join(rows) + '\n  }')
    for name in tables:
        if name not in focus or table(name) is None:
            continue
        for col, ref in fks(name):
            if ref in tables and ref != name:
                lines.append(f'  {ref} ||--o{{ {name} : "{col}"')
            elif ref == name:
                lines.append(f'  {name} ||--o{{ {name} : "{col}"')
    open(os.path.join(outdir, gname + '.mmd'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print(gname, len(tables), 'tables')
