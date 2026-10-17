# AMARANTH v2 — Database

**Decision (2026-10-17): option B — fresh schema** pasted into a new or emptied Supabase project.
The v1 schema is kept at `supabase/legacy/schema-v1.sql` for reference only; don't paste it.

## 1. Files
| File | What |
|---|---|
| `supabase/v2/schema.sql` | Types, tables, indexes, triggers, helpers (`app` schema), RPCs, RLS, storage buckets + policies |
| `supabase/v2/seed.sql` | Reference data: 12 sections, categories, department contacts, home slots, site settings |
| `supabase/v2/seed_board.sql` | Optional: the current editorial board from the v1 site (18 people, photos from `/public/images`) |
| `supabase/tests/00_supabase_stub.sql` | Local stand-in for `auth`, `storage`, roles (never run on Supabase) |
| `supabase/tests/01_helpers.sql` | `tests.login`, `tests.expect_error`, `tests.expect_count`, `tests.expect_ok`, `tests.expect_eq` |
| `supabase/tests/02_fixtures.sql` | Test staff (one per role), articles in each state |
| `supabase/tests/*.test.sql` | RLS / trigger / RPC tests |
| `scripts/db-test.mjs` | Runner (`npm run db:test`) |

## 2. Deploy day (paste in this order)
1. **Backup / empty.** New project: nothing to do. Re-using the old project: Dashboard → Database → Backups (download), then in the SQL editor:
   ```sql
   drop schema public cascade;
   create schema public;
   grant usage on schema public to postgres, anon, authenticated, service_role;
   grant all on schema public to postgres, service_role;
   alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
   alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
   alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
   ```
   (Empty or delete the old storage buckets from the Storage page if you don't need the files.)
2. Paste **`supabase/v2/schema.sql`** → Run.
3. Paste **`supabase/v2/seed.sql`** → Run.
   Optional: edit the term label/date at the top of **`supabase/v2/seed_board.sql`**, then paste → Run (fills the Editorial Board page).
4. **Invite the first admin** (role comes only from this table; nobody can make themselves admin):
   ```sql
   insert into public.staff_invites (email, role) values ('you@vsu.edu.ph', 'super_admin');
   ```
   Then Dashboard → Authentication → Users → **Invite user** with that email. Accepting the invite creates an active `super_admin` profile.
   (If the auth user already exists: `update public.profiles set role = 'super_admin', is_active = true where email = 'you@vsu.edu.ph';`)
5. **Auth settings** (Dashboard → Authentication):
   - Sign In / Providers → Email: **disable "Allow new users to sign up"** (staff are invited).
   - URL Configuration: Site URL = production URL; Redirect URLs add `https://<site>/admin/reset-password` and `http://localhost:5173/**`.
6. **Optional — pg_cron** (Database → Extensions → enable `pg_cron`), so scheduled articles also flip to `published` in the CMS list (the public site already shows them on time without it):
   ```sql
   select cron.schedule('publish-due-articles', '*/5 * * * *', $$select app.publish_due_articles()$$);
   ```
7. Re-running `schema.sql` / `seed.sql` later is safe (no data changes besides re-asserting seed rows).

## 3. Model summary
- **Staff only have accounts.** `profiles.role` + `is_active`; `staff_invites` pre-authorises emails (with optional `section_slugs` for section editors → `profile_sections`).
- **Roles:** super_admin, editor_in_chief (admin: staff, settings, sections) · managing_editor (publish) · section_editor (review/edit own sections) · staff_writer / contributor (own drafts).
- **Workflow** (enforced by trigger `app.article_before_write`, so it holds for direct updates too):
  draft → submitted → in_review → scheduled/published → archived; reject/return with notes via `transition_article(id, status, note, scheduled_for)`. History in `article_activity`, snapshots in `article_revisions` (newest 50).
- **Scheduling** sets `published_at = scheduled_for`; public reads use `app.is_live(status, published_at)`, so scheduled pieces go live by themselves.
- **Public writes only through RPCs** with validation, honeypot (`p_website`) and rate limits: `submit_comment`, `submit_article`, `submit_event_report`, `send_contact_message`, `record_article_view`.
- **Public reads:** tables under RLS plus `article_cards` view (security invoker), `most_read_articles(days, limit)`, `search_articles(query, section, from, to, limit, offset)`.
- **Staff RPCs:** `transition_article`, `add_article_note`, `convert_intake_to_article`, `dashboard_stats`, `media_usage`.
- **Storage:** `media` (public images ≤10 MB), `archives` (public PDFs ≤60 MB, publishers write), `intake` (private ≤20 MB; anyone may upload under `submissions/` or `events/`, only editors read).
- Commenter emails live in `article_comment_private` (editors only).

## 4. How it's tested
```bash
npm run db:test
```
Creates a throwaway Postgres cluster (PostgreSQL 16+ binaries; set `PG_BIN` if not in `C:/Program Files/PostgreSQL/<v>/bin`), loads the Supabase stub, applies schema + seed **twice**, loads fixtures twice, runs every `*.test.sql`, then deletes the cluster. It only talks to `127.0.0.1`.
Current result: **95 checks pass** (public access, intake, rate limits, storage, writer / section editor / EIC / super admin workflow, scheduling, comments moderation, conversion, last-super-admin guard, media in-use guard).
