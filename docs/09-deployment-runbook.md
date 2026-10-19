---
title: "Deployment and Operations Runbook"
subtitle: "Amaranth v2 — environments, setup, database changes, backups, monitoring, incidents and event week"
version: "1.0"
date: "2026-10-19"
---

# Document control

| Field | Value |
|---|---|
| Title | Deployment and Operations Runbook |
| Document ID | AMR-DOC-09 |
| Version | 1.0 |
| Date | 2026-10-19 |
| Author | Amaranth development team [TO CONFIRM: names] |
| Status | Final draft for defense |
| Sources | `docs/v2/DB.md`, `docs/v2/STATS.md`, `vercel.json`, `.env.example`, `scripts/` |

# Contents

1. Environments
2. Environment variables
3. Setting up from scratch
4. Releasing a new version
5. Database changes ("migrations")
6. Backup and restore
7. Monitoring
8. Routine operations
9. Incident response
10. Salingkusog event-week checklist
11. Contacts and access [TO CONFIRM]

\newpage

# 1. Environments

| Environment | Front end | Database | Who uses it |
|---|---|---|---|
| Local | `npm run dev` (Vite, port 3000; the dev server also runs `/api/submit` with Cloudflare test keys) | The Supabase project in `.env.local`; SQL tests use a throwaway local PostgreSQL | Developers |
| Preview | Vercel preview deployment of any pushed branch (e.g. `develop`), protected by Vercel sign-in | Same Supabase project as production unless configured otherwise [TO CONFIRM] | Developers, reviewers |
| Production | Vercel production deployment of `main` (`amaranth-iota.vercel.app` [TO CONFIRM domain]) | Production Supabase project | Public and staff |

Branch flow: `feature/*` → merge into `develop` (after `npm run check` and, for SQL, `npm run db:test`) → pull request `develop` → `main` → Vercel deploys production.

# 2. Environment variables

Set in Vercel → Project → Settings → Environment Variables (Production and Preview), and in `.env.local` for local development. Never commit real values; `.env.example` lists the names.

| Name | Scope | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | browser + server | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | browser + server | Public anonymous key |
| `VITE_SITE_URL` | browser + server | Canonical URL; statistics run only on this host |
| `VITE_TURNSTILE_SITE_KEY` | browser | Turnstile site key (public) |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SITE_URL` | server | Optional server copies (fall back to the `VITE_` values) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Statistics ingest (`/api/e`) and public forms (`/api/submit`) |
| `TURNSTILE_SECRET_KEY` | server only | Turnstile verification |
| `VITE_STATS_DEBUG` | browser (optional) | Log statistics events to the console |
| `VITE_ENABLE_FIXTURES` | build (never on Vercel) | Keep `/dev` screens in a build for performance testing |

After changing a variable, **redeploy** so the new value is used.

# 3. Setting up from scratch

## 3.1 Supabase

1. Create a Supabase project (region close to the Philippines, e.g. Singapore) [TO CONFIRM region].
2. SQL editor → paste and run, in order: `supabase/v2/schema.sql`, `supabase/v2/salingkusog.sql`, `supabase/v2/stats.sql`, `supabase/v2/seed.sql`; optionally `supabase/v2/seed_board.sql` (edit the term label first).
3. Database → Extensions → enable **pg_cron** (needed by the nightly statistics job; optional `publish-due-articles` job):
   `select cron.schedule('publish-due-articles', '*/5 * * * *', $$select app.publish_due_articles()$$);`
4. Authentication → Providers → Email: **disable "Allow new users to sign up"**. URL configuration: Site URL = production URL; add redirect URLs for `/admin/set-password` on production and `http://localhost:3000/**`.
5. Invite the first administrator:
   `insert into public.staff_invites (email, role) values ('<admin email>', 'super_admin');`
   then Authentication → Users → Invite user with that email.
6. Recommended: enable leaked-password protection and MFA for administrators (AMR-DOC-06 R-03, R-04).

## 3.2 Cloudflare Turnstile

Cloudflare dashboard → Turnstile → Add widget: name "Amaranth forms", hostnames = production domain, the `*.vercel.app` domain and `localhost`; mode **Managed**; pre-clearance **No**. Copy the site key (public) and the secret key (server only).

## 3.3 Vercel

1. Import the GitHub repository; framework preset Vite; build command `npm run build`; output `dist` (already in `vercel.json`).
2. Add the environment variables in §2 for Production and Preview.
3. Deploy. Check: home page loads, `/sitemap.xml`, `/rss.xml`, `/robots.txt` respond, `/admin/login` works.

## 3.4 Local development

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Run the gates before merging:

```bash
npm run check
npm run db:test
```

`npm run db:test` needs PostgreSQL 16+ binaries (set `PG_BIN` if they are not in `C:/Program Files/PostgreSQL/<v>/bin`). If a previous run left a cluster on port 54329, stop it first.

# 4. Releasing a new version

1. Make sure `develop` passes `npm run check` and `npm run db:test`.
2. Open a pull request `develop` → `main` with the description from `docs/v2/PR.md`.
3. If the release includes SQL changes: **deploy the code first when the SQL removes access the old code relies on** (for example, closing the form RPCs required the new `/api/submit` to be live first), otherwise paste SQL first. The release notes say which.
4. Run the manual checklist on the preview (AMR-DOC-08 §7).
5. Merge; Vercel deploys production automatically.
6. Paste the changed SQL files in the Supabase SQL editor (they are re-runnable).
7. Smoke test production: home, an article, search, `/salingkusog`, sign in, open an article in the editor.

**Rollback (front end):** Vercel → Deployments → choose the previous production deployment → "Promote to production". **Rollback (database):** re-run the previous version of the SQL file from git (functions and policies are replaced); data changes cannot be undone this way, so take a backup first (§6).

# 5. Database changes ("migrations")

The project uses **re-runnable SQL files** instead of a migration tool.

Rules for writing changes (AMR-DOC-10 §6):

- `create table if not exists`, `alter table … add column if not exists`, `create or replace function`, `drop policy if exists` + `create policy`, `create index if not exists`, enum values with `alter type … add value if not exists`.
- Never drop data in these files.
- Keep `security definer` functions with `set search_path = ''`.
- Add or update SQL tests; run `npm run db:test` (it applies every file twice).

Applying in production: SQL editor → paste the whole file → Run. Order when several change: `schema.sql` → `salingkusog.sql` → `stats.sql` → `seed.sql`. Re-running `schema.sql` does not remove the Salingkusog or statistics policies.

# 6. Backup and restore

| What | How | Frequency |
|---|---|---|
| Database | Supabase automatic daily backups (plan-dependent) [TO CONFIRM plan and retention]; manual export: Dashboard → Database → Backups, or `pg_dump` with the connection string | Before every SQL change and before event week |
| Storage files | Supabase Storage (buckets `media`, `archives`, `intake`); download important files or copy with the Storage API [TO CONFIRM procedure] | Before event week; monthly |
| Code | GitHub repository (`main`, `develop`) | Every push |
| Configuration | Environment variable names in this runbook; values in a password manager held by the Executive Editor and the technical lead [TO CONFIRM] | When changed |

**Restore drill (recommended once per semester):** restore the latest backup into a new Supabase project, point a preview deployment at it, and verify sign-in and a few pages.

# 7. Monitoring

| Signal | Where |
|---|---|
| Front-end errors, function logs (`/api/*`) | Vercel → Project → Logs / Functions |
| Traffic | Vercel Web Analytics; newsroom Statistics (`/admin/statistics`) |
| Database health, slow queries, API errors | Supabase → Reports and Logs |
| Auth problems | Supabase → Authentication → Logs |
| Form spam or CAPTCHA failures | Cloudflare → Turnstile analytics; 403 responses in `/api/submit` logs |
| Scheduled jobs | `select * from cron.job;` and `cron.job_run_details` |
| CSP violations (report-only) | Browser console on the preview |

# 8. Routine operations

| Task | Who | How |
|---|---|---|
| Invite staff / change roles | SA, EE | Newsroom → Staff → Invites / Accounts |
| Give publishing access | SA, EE, ME | Staff → Accounts → "Can publish and schedule articles" |
| Deactivate a leaving member | SA, EE | Staff → Accounts → untick Active |
| Moderate comments, inbox, submissions | Editors | Settings → Comments / Inbox; Submissions; Events |
| Front page and ticker | SA, EE, ME | Settings → Front page / General |
| Review statistics | SA, EE, ME | Statistics |
| Generate missing image sizes | Editors | Media → "Make web sizes" |
| Rotate secrets | Technical lead | Regenerate in Supabase / Cloudflare, update Vercel, redeploy |

\newpage

# 9. Incident response

| Severity | Examples | Response time |
|---|---|---|
| S1 Critical | Site down; data breach; wrong official results published | Immediately |
| S2 High | Newsroom unusable for a role; forms failing; live scores not updating | Within hours |
| S3 Normal | Layout bug; one page failing | Next working day |

**Steps:**

1. **Detect and record** time, symptoms, affected users.
2. **Contain:** for a compromised account, deactivate it (Staff → Accounts) and reset its password; for a leaked key, rotate it and redeploy; for wrong results, correct the placement (the medal table recomputes) and post a correction.
3. **Diagnose** with Vercel and Supabase logs; reproduce on a preview.
4. **Fix** on a branch; run the gates; deploy (or roll back, §4).
5. **Communicate:** inform the Executive Editor; for personal-data breaches, follow the VSU Data Protection Officer's procedure and the National Privacy Commission's 72-hour notification rule where it applies [TO CONFIRM contacts].
6. **Review:** write a short post-incident note and add a test that would have caught it.

Common problems:

| Symptom | Likely cause | Fix |
|---|---|---|
| Forms say "Forms aren't set up yet" | `SUPABASE_SERVICE_ROLE_KEY` or `TURNSTILE_SECRET_KEY` missing | Add in Vercel, redeploy |
| Forms say "Please complete the security check" | Turnstile hostname not listed | Add the domain to the widget |
| Statistics empty | Service key missing or `VITE_SITE_URL` not the production host | Set variables, redeploy |
| Live scores not updating | Realtime publication missing a table | Re-run `salingkusog.sql` |
| "permission denied for function …" after an SQL change | Grant missing | Re-run the full SQL file (grants are at the end) |
| Staff member sees "access pending" | No invite, or inactive | Add invite / activate in Staff |

# 10. Salingkusog event-week checklist

**Two weeks before**

- [ ] Edition created with correct dates, medal points and venue map; `is_current` on, `is_published` off until ready.
- [ ] Factions (names, colours, logos), venues, sports and events (division, format, team/individual, unit) entered.
- [ ] Salingkusog team members added (Salingkusog → Team) and trained (AMR-DOC-11c).
- [ ] Schedule imported (CSV) or built (Build schedule / Create contest); check the Scores tab day by day.
- [ ] Athletes entered (name, program, photo with consent) [TO CONFIRM consent process].
- [ ] Countdown page switched on if wanted.
- [ ] Backup taken; manual test MT-18 (live updates on two devices) passed.

**Day before**

- [ ] Publish the edition (`is_published`); check `/salingkusog`, schedule, sports pages.
- [ ] Scorekeepers signed in on their phones; test a score on a test event, then reopen and reset it.
- [ ] Contact list of scorekeepers and the duty editor [TO CONFIRM].

**Each competition day**

- [ ] Start games on time (Scores → Start game); finish with both scores.
- [ ] For contests, enter every result or place before Finish.
- [ ] After each event's last game, confirm medals in Results ("Ready to confirm").
- [ ] Record MVP / Athlete of the Day; download social cards for posting.
- [ ] Watch Vercel and Supabase logs for errors; check the medal tally after each confirmation.

**After the games**

- [ ] All games final → tally reads "Official and final medal tally"; verify champion and runners-up with the organisers.
- [ ] Finals MVP recorded; recaps linked to games.
- [ ] Take a backup; switch off the countdown; remove temporary team members.

# 11. Contacts and access [TO CONFIRM]

| Role | Name | Access |
|---|---|---|
| Technical lead | [TO CONFIRM] | Vercel, Supabase, GitHub, Cloudflare |
| Executive Editor | [TO CONFIRM] | Newsroom (EE), secrets vault |
| Adviser | [TO CONFIRM] | — |
| VSU Data Protection Officer | [TO CONFIRM] | — |
