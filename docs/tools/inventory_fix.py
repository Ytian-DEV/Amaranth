"""Post-process inventory.json: triggers the regex cannot see (auth trigger, profiles guard, schema touch loop)."""
import json
import sys

p = sys.argv[1]
inv = json.load(open(p, encoding='utf-8'))
inv['triggers'] = [t for t in inv['triggers'] if t['name'] not in ('on_auth_user_created', 'profiles_guard') and t['table'] != 'public.profiles' or t['name'].endswith('_touch')]
inv['triggers'][:0] = [
    {'file': 'schema.sql', 'name': 'on_auth_user_created', 'timing': 'after', 'events': 'insert', 'table': 'auth.users', 'level': 'row', 'function': 'app.handle_new_user'},
    {'file': 'schema.sql', 'name': 'profiles_guard', 'timing': 'before', 'events': 'update', 'table': 'public.profiles', 'level': 'row', 'function': 'app.guard_profile_update'},
]
have = {t['name'] for t in inv['triggers']}
for t in ['profiles', 'sections', 'categories', 'media_assets', 'contributors', 'publication_issues', 'article_submissions', 'event_reports',
          'contact_messages', 'team_terms', 'team_members', 'department_contacts', 'site_settings', 'home_slots']:
    if t + '_touch' not in have:
        inv['triggers'].append({'file': 'schema.sql', 'name': t + '_touch', 'timing': 'before', 'events': 'update', 'table': 'public.' + t,
                                'level': 'row', 'function': 'app.touch_updated_at', 'dynamic': True})
json.dump(inv, open(p, 'w', encoding='utf-8'), indent=1)
print('triggers', len(inv['triggers']))
