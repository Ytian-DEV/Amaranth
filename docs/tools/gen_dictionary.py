"""Generate the data-dictionary appendix of docs/04-database-design.md from inventory.json."""
import json
import re
import sys

inv = json.load(open(sys.argv[1], encoding='utf-8'))
out = sys.argv[2]

DESC = {
    'profiles': 'One row per staff account (linked to `auth.users`). Holds the role, activation and publishing-access flag.',
    'staff_invites': 'Pre-authorised emails with the role (and sections) they receive when the invitation is accepted.',
    'sections': 'The 12 site sections (News, Sports, …) with navigation placement and order.',
    'profile_sections': 'Which sections a section editor may edit.',
    'categories': 'Categories inside a section; `is_assignable = false` reserves a category for editors.',
    'tags': 'Free-form tags for articles.',
    'media_assets': 'Uploaded files in Storage with metadata (alt text, caption, credit, size).',
    'contributors': 'Public bylines (staff, students, guests, faculty, alumni); optionally linked to a profile.',
    'publication_issues': 'Print issues with cover and PDF.',
    'articles': 'News stories and other pieces, with workflow status, schedule, SEO fields and full-text search vector.',
    'article_authors': 'Many-to-many link between articles and contributors (bylines).',
    'article_tags': 'Many-to-many link between articles and tags.',
    'article_media': 'Media used inside an article (inline, gallery, attachment).',
    'article_revisions': 'Snapshots of an article (autosave, manual, status); newest 50 kept.',
    'article_activity': 'Workflow history: creation, status changes and notes.',
    'article_daily_views': 'View counts per article per day (feeds "most read").',
    'article_comments': 'Reader comments with moderation status and optional parent (replies).',
    'article_comment_private': 'Commenter email, separated so only editors can read it.',
    'home_slots': 'Front-page curation: lead story and literary folio pick.',
    'article_submissions': 'Story submissions from the public, with review status.',
    'event_reports': 'Event reports from the public, with review status.',
    'intake_files': 'Attachments of submissions and event reports in the private `intake` bucket.',
    'contact_messages': 'Messages from the contact form, with handling status.',
    'team_terms': 'Editorial board terms (for example a school year).',
    'team_members': 'Members of the editorial board per term.',
    'department_contacts': 'Desk contacts shown on the contact page.',
    'site_settings': 'Key–value site configuration (site details, social links, ticker, comments switch).',
    'audit_log': 'Who changed access, publishing rights or the Salingkusog team, and when.',
    'rate_events': 'Internal log used by `app.rate_limit` (private `app` schema).',
    'sk_editions': 'One Salingkusog edition per year: dates, medal points, flags, schedule PDF, map, countdown.',
    'sk_factions': 'Competing teams of an edition (name, short name, motto, colour, logo).',
    'sk_venues': 'Venues with description and position on the venue map.',
    'sk_sports': 'Sports of an edition with a category.',
    'sk_events': 'An event inside a sport (division and format); `seeds` stores the seed order used by Build schedule.',
    'sk_athletes': 'Athletes per faction: name, program and optional photo only.',
    'sk_matches': 'Games and contest sessions: schedule, status, scores, periods, sources of generated sides, recap link.',
    'sk_entries': 'Contest line-up and results: one row per faction per session.',
    'sk_athlete_stats': 'Per-athlete box score values for a game (JSON of stat → value).',
    'sk_placements': 'Official places of an event; medal follows the place; feeds the medal table.',
    'sk_awards': 'Daily and finals awards with stat line and quote.',
    'sk_team': 'Staff allowed to enter Salingkusog data (besides SA, EE, ME).',
    'stats_salts': 'Daily random salts for hashing visitor ids; deleted after two days.',
    'stats_pageviews': 'Raw pageview events (hashed ids, source, device, reading time, scroll).',
    'stats_shares': 'Raw share-button events.',
    'staff_activity_daily': 'Newsroom active seconds per staff member per day.',
    'stats_daily_site': 'Daily site totals.',
    'stats_daily_articles': 'Daily totals per article.',
    'stats_daily_dims': 'Daily totals per dimension (source, referrer, device, browser, OS).',
    'stats_daily_shares': 'Daily share totals per channel.',
    'stats_rollup_log': 'Days already rolled up by the nightly job.',
}
FILE_TITLE = {'schema.sql': 'Newsroom (`schema.sql`)', 'salingkusog.sql': 'Salingkusog (`salingkusog.sql`)', 'stats.sql': 'Statistics (`stats.sql`)'}


def esc(s):
    return s.replace('|', '\\|').replace('\n', ' ').strip()


def short_constraint(extra):
    e = extra
    e = re.sub(r'generated always as \(.*', 'generated (computed)', e)
    e = re.sub(r'\s+', ' ', e)
    return e[:150] + ('…' if len(e) > 150 else '')


lines = []
w = lines.append
w('# Appendix A. Data dictionary\n')
w('Generated from `supabase/v2/schema.sql`, `salingkusog.sql` and `stats.sql` on 2026-10-19. Types are PostgreSQL types; `timestamptz` is a timestamp with time zone. "Notes" come from comments in the SQL files.\n')
n = 0
for f in ['schema.sql', 'salingkusog.sql', 'stats.sql']:
    w(f'## A.{["schema.sql","salingkusog.sql","stats.sql"].index(f) + 1} {FILE_TITLE[f]}\n')
    for tname, t in inv['tables'].items():
        if t['file'] != f:
            continue
        n += 1
        short = tname.split('.')[1]
        w(f'### {tname}\n')
        w(DESC.get(short, '') + '\n')
        w('| Column | Type | Constraints / default | Notes |')
        w('|---|---|---|---|')
        for c in t['columns']:
            w(f"| `{c['name']}` | {esc(c['type'])} | {esc(short_constraint(c['extra']))} | {esc(c['note'])} |")
        if t['constraints']:
            w('\nTable constraints: ' + '; '.join('`' + esc(re.sub(r"\s+", " ", x))[:180] + '`' for x in t['constraints']) + '\n')
        else:
            w('')
w('\\newpage\n')
w('# Appendix B. Enumerated types\n')
w('| Enum | Values | File |')
w('|---|---|---|')
for k, v in inv['enums'].items():
    w(f"| `{k}` | {', '.join('`'+x+'`' for x in v['values'])} | {v['file']} |")
w('\n# Appendix C. Functions and RPCs\n')
w('Security: **definer** runs with the owner\'s rights (used for helpers that must read protected tables); **invoker** runs with the caller\'s rights, so RLS applies.\n')
w('| Function | Arguments | Returns | Security | File | Purpose (from SQL comments) |')
w('|---|---|---|---|---|---|')
for k, v in inv['functions'].items():
    w(f"| `{k}` | {esc(v['args'])} | {esc(v['returns'])} | {v['security']} | {v['file']} | {esc(v['note'])[:200]} |")
w('\n# Appendix D. Triggers\n')
w('| Trigger | Table | Timing / events | Function |')
w('|---|---|---|---|')
for t in inv['triggers']:
    w(f"| `{t['name']}` | `{t['table']}` | {t['timing']} {esc(t['events'])} | `{t['function']}` |")
w('\n# Appendix E. Indexes\n')
w('| Index | Table | Columns | Unique | Condition |')
w('|---|---|---|---|---|')
for i in inv['indexes']:
    w(f"| `{i['name']}` | `{i['table']}` | {esc(i['columns'])[:90]} | {'yes' if i['unique'] else ''} | {esc(i['where'])[:70]} |")
w('\n# Appendix F. Row Level Security policies\n')
w('`using` decides which existing rows a command can see or affect; `with check` decides which new or changed rows are accepted.\n')
w('| Table | Policy | Command | Roles | Using | With check |')
w('|---|---|---|---|---|---|')
for p in inv['policies']:
    u = p['using']
    c = p['check']
    if ') with check (' in u:  # dynamic loop policies captured as one string
        u, c = u.split(') with check (')
    w(f"| `{p['table'].replace('public.', '')}` | `{p['name']}` | {p['command']} | {p['roles']} | {esc(u)[:140]} | {esc(c)[:110]} |")
w('\n# Appendix G. Storage buckets\n')
w('| Bucket | Public | Size limit | Allowed types |')
w('|---|---|---|---|')
for b in inv['buckets']:
    w(f"| `{b['id']}` | {'yes' if b['public'] else 'no'} | {b['size_limit'] // 1048576} MB | {', '.join(b['mime'])} |")
open(out, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print('tables', n, 'columns', sum(len(t['columns']) for t in inv['tables'].values()))
