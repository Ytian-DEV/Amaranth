"""Parse supabase/v2/*.sql into a JSON inventory (tables, columns, enums, views, functions, triggers, indexes, policies)."""
import json
import re
import sys

ROOT = sys.argv[1]
OUT = sys.argv[2]
FILES = ['schema.sql', 'salingkusog.sql', 'stats.sql']


def strip_comments(sql):
    # keep -- comments for column notes: return both
    return sql


def split_top(body):
    """Split a CREATE TABLE body on top-level commas."""
    parts, depth, cur, i = [], 0, '', 0
    in_str = False
    while i < len(body):
        ch = body[i]
        if ch == "'" and not in_str:
            in_str = True
        elif ch == "'" and in_str:
            in_str = False
        if not in_str:
            if ch == '(':
                depth += 1
            elif ch == ')':
                depth -= 1
            elif ch == ',' and depth == 0:
                parts.append(cur)
                cur = ''
                i += 1
                continue
        cur += ch
        i += 1
    if cur.strip():
        parts.append(cur)
    return parts


def find_matching(s, start):
    depth = 0
    in_str = False
    in_comment = False
    for i in range(start, len(s)):
        ch = s[i]
        if in_comment:
            if ch == '\n':
                in_comment = False
            continue
        if not in_str and ch == '-' and s[i:i + 2] == '--':
            in_comment = True
            continue
        if ch == "'":
            in_str = not in_str
        if in_str:
            continue
        if ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
            if depth == 0:
                return i
    return -1


inv = {'files': {}, 'tables': {}, 'enums': {}, 'views': {}, 'functions': {}, 'triggers': [], 'indexes': [], 'policies': [], 'grants': [], 'buckets': []}

for fname in FILES:
    raw = open(f'{ROOT}/{fname}', encoding='utf-8').read().replace('\r\n', '\n')
    inv['files'][fname] = {'lines': raw.count('\n') + 1}
    # remove $$ bodies for structural scanning but keep for functions
    # ---- enums
    for m in re.finditer(r"create type (public\.\w+) as enum \(([^)]*)\)", raw, re.S):
        vals = re.findall(r"'([^']+)'", m.group(2))
        inv['enums'].setdefault(m.group(1), {'file': fname, 'values': vals})
    for m in re.finditer(r"alter type (public\.\w+) add value if not exists '([^']+)'", raw):
        inv['enums'].setdefault(m.group(1), {'file': fname, 'values': []})
        if m.group(2) not in inv['enums'][m.group(1)]['values']:
            inv['enums'][m.group(1)]['values'].append(m.group(2))
    # ---- tables
    for m in re.finditer(r"create table if not exists ((?:public|app)\.\w+) \(", raw):
        name = m.group(1)
        start = m.end() - 1
        end = find_matching(raw, start)
        body = raw[start + 1:end]
        cols, cons = [], []
        notes, pending, code_lines = {}, [], []
        for line in body.split(chr(10)):
            code, _, com = line.partition('--')
            code_s = code.strip()
            com = com.strip()
            if not code_s:
                if com:
                    pending.append(com)
                continue
            first = code_s.split()[0]
            if re.match(r'^[a-z_][a-z0-9_]*$', first) and first not in ('constraint', 'unique', 'primary', 'foreign', 'check', 'exclude') and not code_s.startswith(')'):
                n = ' '.join(pending + ([com] if com else []))
                if n:
                    notes[first] = n
            pending = []
            code_lines.append(code)
        for part in split_top(chr(10).join(code_lines)):
            text = ' '.join(part.split())
            if not text:
                continue
            first = text.split()[0].lower()
            if first in ('constraint', 'unique', 'primary', 'foreign', 'check', 'exclude'):
                cons.append(text)
                continue
            cm = re.match(r'(\w+)\s+(.+)', text)
            if not cm:
                continue
            col, rest = cm.group(1), cm.group(2)
            tm = re.match(r"((?:public\.)?\w+(?:\s*\([^)]*\))?(?:\[\])?(?:\s+with time zone)?)(.*)", rest)
            ctype, extra = (tm.group(1), tm.group(2).strip()) if tm else (rest, '')
            cols.append({'name': col, 'type': ctype.strip(), 'extra': extra, 'note': notes.get(col, '')})
        # comment lines inside body that precede a column: attach roughly
        inv['tables'][name] = {'file': fname, 'columns': cols, 'constraints': cons}
    for m in re.finditer(r"alter table ((?:public|app)\.\w+) add column if not exists (\w+) ([^;]+);", raw):
        t, col, rest = m.group(1), m.group(2), m.group(3)
        tm = re.match(r"((?:public\.)?\w+(?:\s*\([^)]*\))?(?:\[\])?)(.*)", rest)
        inv['tables'].setdefault(t, {'file': fname, 'columns': [], 'constraints': []})
        if not any(c['name'] == col for c in inv['tables'][t]['columns']):
            inv['tables'][t]['columns'].append({'name': col, 'type': tm.group(1), 'extra': tm.group(2).strip(), 'note': f'added in {fname}'})
    for m in re.finditer(r"alter table ((?:public|app)\.\w+) add constraint (\w+)\s+(check[^;]+);", raw, re.S):
        inv['tables'].setdefault(m.group(1), {'file': fname, 'columns': [], 'constraints': []})
        inv['tables'][m.group(1)]['constraints'].append(f'constraint {m.group(2)} ' + ' '.join(m.group(3).split()))
    # ---- views
    for m in re.finditer(r"create or replace view (public\.\w+)\s*(?:with \(([^)]*)\))?\s*as", raw):
        inv['views'][m.group(1)] = {'file': fname, 'options': m.group(2) or ''}
    # ---- functions
    for m in re.finditer(r"create or replace function ((?:public|app)\.\w+)\(([^)]*(?:\([^)]*\)[^)]*)*)\)\s*returns\s+(.+?)\n\s*language (\w+)(.*?)as \$\$", raw, re.S):
        name, args, ret, lang, opts = m.group(1), ' '.join(m.group(2).split()), ' '.join(m.group(3).split()), m.group(4), m.group(5)
        sec = 'definer' if 'security definer' in opts else 'invoker'
        # preceding comment block
        before = raw[:m.start()].rstrip('\n').split('\n')
        notes = []
        for l in reversed(before[-8:]):
            if l.startswith('--') and not l.startswith('-- ---'):
                notes.insert(0, l[2:].strip())
            elif l.strip() == '' or l.startswith('-- ---'):
                if notes:
                    break
                continue
            else:
                break
        inv['functions'][name] = {'file': fname, 'args': args, 'returns': ret, 'language': lang, 'security': sec, 'stable': 'stable' in opts, 'note': ' '.join(notes)}
    # ---- triggers
    for m in re.finditer(r"create trigger (\w+)\s+(before|after)\s+(.+?)\s+on (public\.\w+)\s+for each (row|statement)(?: when \(.*?\))?\s+execute function ((?:public|app)\.\w+)", raw, re.S):
        inv['triggers'].append({'file': fname, 'name': m.group(1), 'timing': m.group(2), 'events': ' '.join(m.group(3).split()), 'table': m.group(4), 'level': m.group(5), 'function': m.group(6)})
    # dynamic triggers created in loops
    for m in re.finditer(r"foreach t in array array\[([^\]]+)\] loop\s+execute format\('drop trigger if exists %I on public\.%I', t \|\| '(_\w+)', t\);\s+execute format\('create trigger %I (before|after) ([^']+?) on public\.%I for each (row|statement) execute function ((?:public|app)\.\w+)\(\)'", raw):
        for t in re.findall(r"'(\w+)'", m.group(1)):
            inv['triggers'].append({'file': fname, 'name': t + m.group(2), 'timing': m.group(3), 'events': m.group(4), 'table': 'public.' + t, 'level': m.group(5), 'function': m.group(6), 'dynamic': True})
    # ---- indexes
    for m in re.finditer(r"create (unique )?index if not exists (\w+)\s+on ((?:public|app)\.\w+)\s*(?:using (\w+)\s*)?\(([^;]*?)\)(\s*where [^;]+)?;", raw):
        inv['indexes'].append({'file': fname, 'name': m.group(2), 'table': m.group(3), 'unique': bool(m.group(1)), 'method': m.group(4) or 'btree', 'columns': ' '.join(m.group(5).split()), 'where': (m.group(6) or '').strip()})
    # ---- policies
    for m in re.finditer(r"create policy (\w+) on ((?:public|storage)\.\w+)(?: as (\w+))? for (\w+)(?: to ([\w, ]+?))?\s+(using \((.*?)\))?\s*(with check \((.*?)\))?;", raw, re.S):
        inv['policies'].append({'file': fname, 'name': m.group(1), 'table': m.group(2), 'command': m.group(4), 'roles': (m.group(5) or 'public').strip(), 'using': ' '.join((m.group(7) or '').split()), 'check': ' '.join((m.group(9) or '').split())})
    for m in re.finditer(r"execute format\('create policy %I on public\.%I for (\w+) to ([\w, ]+?) using \(([^']*)\)(?: with check \(([^']*)\))?', t \|\| '(_\w+)', t\)", raw):
        # find the array in the enclosing loop
        loop = raw.rfind('foreach t in array array[', 0, m.start())
        arr = re.findall(r"'(\w+)'", raw[loop:raw.find(']', loop)])
        for t in arr:
            inv['policies'].append({'file': fname, 'name': t + m.group(5), 'table': 'public.' + t, 'command': m.group(1), 'roles': m.group(2), 'using': m.group(3), 'check': m.group(4) or '', 'dynamic': True})
    # ---- grants
    for m in re.finditer(r"grant execute on function ((?:public|app)\.\w+)\(([^)]*)\) to ([\w, ]+);", raw):
        inv['grants'].append({'file': fname, 'function': m.group(1), 'args': m.group(2), 'to': m.group(3)})
    for m in re.finditer(r"\('(\w+)', '\w+', (true|false), (\d+),\s*array\[([^\]]*)\]\)", raw):
        inv['buckets'].append({'file': fname, 'id': m.group(1), 'public': m.group(2) == 'true', 'size_limit': int(m.group(3)), 'mime': re.findall(r"'([^']+)'", m.group(4))})

json.dump(inv, open(OUT, 'w', encoding='utf-8'), indent=1)
print('tables', len(inv['tables']), 'enums', len(inv['enums']), 'views', len(inv['views']), 'functions', len(inv['functions']),
      'triggers', len(inv['triggers']), 'indexes', len(inv['indexes']), 'policies', len(inv['policies']), 'buckets', len(inv['buckets']))
for f in FILES:
    print(f, inv['files'][f]['lines'], 'lines;',
          'tables', sum(1 for t in inv['tables'].values() if t['file'] == f),
          'functions', sum(1 for t in inv['functions'].values() if t['file'] == f),
          'views', sum(1 for t in inv['views'].values() if t['file'] == f),
          'policies', sum(1 for t in inv['policies'] if t['file'] == f))
