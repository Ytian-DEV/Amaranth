---
title: "Amaranth v2 — Repository Audit Report"
subtitle: "Phase 0: read-only audit of code, database and configuration"
version: "1.0"
date: "2026-10-19"
---

# Document control

| Field | Value |
|---|---|
| Title | Amaranth v2 — Repository Audit Report |
| Document ID | AMR-DOC-00 |
| Version | 1.0 |
| Date | 2026-10-19 |
| Author | Amaranth development team [TO CONFIRM: names] |
| Status | Final (baseline for all other documents) |
| Source revision | `develop` branch at commit `d7f6f34` (2026-10-19) |

**How to read this report.** Every statement points to a file, table or function in the repository. Facts that could not be checked in the code are marked **[TO CONFIRM]**. Live counts were read on 2026-10-19 from the Supabase project configured in the local `.env` with the public (anonymous) key; they count rows only and include no personal data.

# Contents

1. Executive summary
2. Technology stack
3. Hosting, deployment and environment
4. Repository structure and architecture
5. Routes and pages
6. Server endpoints (Vercel functions and middleware)
7. Database inventory
8. Roles and permissions (role × feature matrix)
9. Features and modules
10. Salingkusog module
11. Statistics module
12. Tests, CI and scripts
13. Known issues, TODOs and technical debt
14. Gaps against a typical publication CMS and sports-results system
15. Live data snapshot
16. Items to confirm

# 1. Executive summary

Amaranth v2 is a single-page web application (React 18 + TypeScript, built with Vite 7) that serves both the **public news site** of Amaranth, the official student publication of Visayas State University (VSU), and the **staff newsroom** at `/admin`. All data lives in **Supabase** (PostgreSQL with Row Level Security, Auth, Storage and Realtime). The site is hosted on **Vercel**, which also runs six small serverless functions under `/api` and one routing middleware for link previews.

The database is defined in three re-runnable SQL files: `supabase/v2/schema.sql` (newsroom), `supabase/v2/salingkusog.sql` (intramurals add-on) and `supabase/v2/stats.sql` (first-party statistics). Together they define **50 tables, 19 enums, 6 views, 76 functions, 40 triggers, 60 indexes, 97 row-level-security policies and 3 storage buckets**. Every table has RLS enabled; the database, not the UI, is the source of truth for permissions.

There are **8 account roles** (including the anonymous reader there are 9 user classes) and one extra permission group, the **Salingkusog team**. The newsroom covers articles with an enforced editorial workflow, submissions and event reports from the public, a media library, staff and editorial-board management, site settings, statistics and the **Salingkusog** intramurals module (editions, factions, sports and events, venues, athletes, schedule import, automatic brackets and round robins, contests, live scores, results and medals, awards, medal table, points race).

Quality gates exist and pass: **255 unit and component tests in 48 files** (Vitest) and **278 database checks in 6 SQL test files** run against a throwaway local PostgreSQL. There is **no CI pipeline**: the checks run on developers' machines before each merge.

# 2. Technology stack

| Layer | Technology (version from `package.json`) | Evidence |
|---|---|---|
| Language | TypeScript ^5.9.2 (strict) | `tsconfig.app.json`, `tsconfig.server.json` |
| UI library | React ^18.3.1, React DOM ^18.3.1 | `src/main.tsx` |
| Routing | React Router DOM ^7.9.1 (data router, lazy routes) | `src/app/router.tsx` |
| Server state | TanStack Query ^5.90.2 | `src/lib/queryClient.ts` |
| Styling | Tailwind CSS ^4.3.3 (`@theme` design tokens), clsx, tailwind-merge | `src/styles/tokens.css`, `src/lib/cn.ts` |
| Rich-text editor | TipTap ^3.32.0 (starter kit, image, link, YouTube) | `src/features/cms/articles/editor/` |
| HTML sanitising | DOMPurify ^3.4.17 | `src/lib/sanitize.ts` |
| Icons | lucide-react ^0.487.0 | components |
| Fonts | Montserrat Variable, Cinzel (self-hosted via Fontsource) | `@fontsource-variable/montserrat`, `@fontsource/cinzel` |
| Backend-as-a-service | Supabase JS ^2.58.0 (PostgreSQL, Auth, Storage, Realtime) | `src/lib/supabase.ts` |
| Hosting / functions | Vercel (static hosting, Node serverless functions, routing middleware) | `vercel.json`, `api/`, `middleware.ts` |
| Analytics | First-party statistics (`api/e.ts`, `stats.sql`) and Vercel Web Analytics ^1.5.0 | `src/app/RootLayout.tsx` |
| CAPTCHA | Cloudflare Turnstile | `src/lib/turnstile.ts`, `api/_lib/forms.ts` |
| Build | Vite ^7.3.7 with `@vitejs/plugin-react-swc` ^4.3.3 | `vite.config.ts` |
| Tests | Vitest ^5.0.5, Testing Library, jsdom ^27; PostgreSQL 16+ for SQL tests | `scripts/db-test.mjs` |
| Lint | ESLint ^9.37 with typescript-eslint, react-hooks, react-refresh | `eslint.config.js` |
| Runtime requirement | Node.js >= 20.19 | `package.json` → `engines` |

# 3. Hosting, deployment and environment

**Hosting.** Vercel builds with `npm run build` and serves `dist/` (`vercel.json`). Production URL in project notes: `amaranth-iota.vercel.app` (`docs/v2/PERF.md`) [TO CONFIRM: custom domain, if any]. Branch flow from project notes: feature branches → `develop` → pull request → `main` (`docs/v2/PROGRESS.md`).

**Rewrites and headers** (`vercel.json`):

- `/sitemap.xml` → `/api/sitemap`, `/rss.xml` → `/api/rss`, `/robots.txt` → `/api/robots`; every other non-asset path → `index.html` (single-page app).
- Long-lived cache for `/assets/*`; one-week cache for `/images`, `/fonts`, `/documents`.
- Security headers on all paths: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy`, `Strict-Transport-Security`, and a `Content-Security-Policy-Report-Only` header.

**Database deployment.** There is no migration tool. The SQL files are pasted into the Supabase SQL editor in the order `schema.sql` → `salingkusog.sql` → `stats.sql` → `seed.sql` (→ optional `seed_board.sql`). All files are idempotent ("re-runnable"); `scripts/db-test.mjs` proves this by applying them twice (`docs/v2/DB.md`).

**Scheduled jobs.** `stats.sql` schedules `amaranth-stats-nightly` with pg_cron (`15 16 * * *` UTC = 00:15 Manila). `docs/v2/DB.md` describes an optional `publish-due-articles` pg_cron job [TO CONFIRM: whether it is enabled in production].

**Environment variables** (names only; values are never stored in the repository):

| Name | Used by | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | browser, server fallback | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | browser, server fallback | Public anonymous key (RLS applies) |
| `VITE_SITE_URL` | browser, server fallback | Canonical site URL; statistics only run on this host |
| `VITE_TURNSTILE_SITE_KEY` | browser | Public Turnstile site key |
| `VITE_STATS_DEBUG` | browser | Optional statistics debug logging |
| `VITE_ENABLE_FIXTURES` | build | Keeps `/dev` fixture screens in a build (never on Vercel) |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SITE_URL` | `api/*`, `middleware.ts` | Server-side copies (fall back to the `VITE_` values) |
| `SUPABASE_SERVICE_ROLE_KEY` | `api/e.ts`, `api/submit.ts` | Server-only key for statistics ingest and public forms |
| `TURNSTILE_SECRET_KEY` | `api/submit.ts` | Server-only Turnstile verification secret |
| `PG_BIN`, `DB_TEST_PORT` | `scripts/db-test.mjs` | Local SQL test runner |

Template: `.env.example` (placeholders only).

**Third-party services:** Supabase, Vercel (hosting, functions, Web Analytics), Cloudflare Turnstile. Fonts and icons are bundled; no other external scripts are loaded (`vercel.json` CSP lists only Supabase, Cloudflare challenges and video embed hosts).

# 4. Repository structure and architecture

```
/                     Vite + React app, Vercel config
├─ api/               Vercel serverless functions (Node ESM): r, e, submit, sitemap, rss, robots
│  └─ _lib/           shared server code: seo, forms, traffic, supabaseRest
├─ middleware.ts      Vercel routing middleware: Open Graph tags for link-preview crawlers
├─ src/
│  ├─ app/            router, root layout, error boundary
│  ├─ components/     shared UI kit (ui/) and story cards (story/)
│  ├─ features/
│  │  ├─ auth/        login, password reset, guards, role helpers (permissions.ts)
│  │  ├─ public/      public site: home, sections, article, search, archives, about, intake forms, salingkusog, analytics
│  │  └─ cms/         newsroom: dashboard, articles, intake, media, people, settings, statistics, salingkusog
│  ├─ lib/            Supabase client, sanitising, images, formatting, Salingkusog helpers, Turnstile, edge cache
│  ├─ styles/         design tokens (tokens.css) and global CSS
│  └─ dev/            /dev fixture screens and checks (development builds only)
├─ supabase/
│  ├─ v2/             schema.sql, salingkusog.sql, stats.sql, seed.sql, seed_board.sql
│  └─ tests/          SQL test harness and *.test.sql
├─ scripts/           db-test.mjs, check-contrast.mjs, countdown-og.py
└─ docs/              v2 planning docs and this documentation package
```

Size: 206 source files (`.ts`/`.tsx`, excluding tests) and about 27,700 lines of TypeScript including tests; 4,082 lines of SQL in `supabase/v2`.

**Architecture style.** A thick client talks directly to Supabase through PostgREST with the user's JWT; Row Level Security and database triggers enforce every rule. A thin server layer on Vercel handles only what must not run in the browser: secret-key operations (`api/submit.ts`, `api/e.ts`), edge-cached public reads (`api/r.ts`), SEO documents (`api/sitemap.ts`, `api/rss.ts`, `api/robots.ts`) and crawler previews (`middleware.ts`). There are no server actions (this is not a Next.js project).

Layers:

| Layer | Responsibility | Main files |
|---|---|---|
| Presentation | React pages, layouts, components | `src/features/**`, `src/components/**` |
| Client data access | TanStack Query hooks per feature | `*Api.ts`, `*Data.ts` files |
| Edge / server | Caching proxy, form gateway, stats ingest, SEO | `api/*.ts`, `middleware.ts` |
| Data and rules | Tables, RLS, triggers, RPCs, views | `supabase/v2/*.sql` |
| Platform | Auth, Storage, Realtime, pg_cron | Supabase |

# 5. Routes and pages

From `src/app/router.tsx` and the nested routers.

**Public site** (layout `PublicLayout`):

| Route | Page |
|---|---|
| `/` | Home (`HomePage`) |
| `/:section` | Section landing or list (12 sections, `SectionPage`) |
| `/latest` | Latest stories |
| `/article/:slug` | Article page with comments |
| `/search` | Full-text search and tag pages |
| `/archives`, `/archives/:month` | Print issues and monthly archive |
| `/about`, `/editorial-board`, `/privacy` | About, editorial board, privacy notice |
| `/submit`, `/submit/event` | Story submission, event report forms |
| `/contact` | Contact form and desk directory |
| `/salingkusog` | Medal tally (index) |
| `/salingkusog/schedule` | Schedule and results |
| `/salingkusog/winners` | Winners per event |
| `/salingkusog/factions`, `/salingkusog/factions/:slug` | Factions and faction profile |
| `/salingkusog/sports`, `/salingkusog/sports/:slug` | Sport page (bracket, standings or contest results) |
| `/salingkusog/match/:id` | Match recap |
| `/salingkusog/venues` | Venue guide |
| `/salingkusog-2026/countdown` | Full-screen countdown (outside the site layout) |
| `*` | Not found |

Legacy redirects: `/home`, `/features`, `/blog`, `/s&t`, `/submit-article`, `/dashboard`, `/salingkusog-2026`.

**Newsroom** (guard `RequireStaff`, layout `AdminLayout`):

| Route | Page |
|---|---|
| `/admin/login`, `/admin/forgot-password`, `/admin/set-password` | Authentication |
| `/admin` | Dashboard |
| `/admin/articles`, `/admin/articles/new`, `/admin/articles/:id` | Article list and editor |
| `/admin/submissions`, `/admin/submissions/:id` | Story submissions (intake) |
| `/admin/events`, `/admin/events/:id` | Event reports (intake) |
| `/admin/media` | Media library |
| `/admin/staff` (+ `/invites`, `/contributors`, `/board`) | Accounts, invites, contributors, editorial board |
| `/admin/settings` (+ `/home`, `/comments`, `/inbox`, `/sections`, `/contacts`, `/general`) | Front page, comments, inbox, sections, desks, general |
| `/admin/statistics` | Statistics |
| `/admin/salingkusog` (+ `scores`, `scores/:matchId`, `results`, `results/:eventId`, `awards`, `athletes`, `edition`, `factions`, `sports`, `venues`, `import`, `team`) | Salingkusog newsroom |

Development only: `/dev/*` fixture screens (`src/dev/DevRoutes.tsx`), removed from production builds.

# 6. Server endpoints (Vercel functions and middleware)

| Endpoint | Method | Who | Purpose | File |
|---|---|---|---|---|
| `/api/r` | GET | anyone | Edge-cached (60 s) proxy for a fixed list of public, slow-changing reads (`CACHEABLE` set); anon key, RLS applies | `api/r.ts` |
| `/api/e` | POST | site pages (same origin) | Statistics ingest: drops bots, classifies device/source, never forwards the IP; calls `stats_ingest` with the service key | `api/e.ts`, `api/_lib/traffic.ts` |
| `/api/submit` | POST | anyone with a Turnstile token | The only entry for comments, story submissions, event reports and contact messages; issues one-time signed upload links for attachments; saves via service-role RPCs | `api/submit.ts`, `api/_lib/forms.ts` |
| `/api/sitemap` (`/sitemap.xml`) | GET | anyone | Sitemap of live articles and sections | `api/sitemap.ts` |
| `/api/rss` (`/rss.xml`) | GET | anyone | RSS feed | `api/rss.ts` |
| `/api/robots` (`/robots.txt`) | GET | anyone | robots.txt | `api/robots.ts` |
| middleware | GET | crawlers only | Injects Open Graph tags for articles and sections | `middleware.ts`, `api/_lib/seo.ts` |

# 7. Database inventory

Counts were extracted with a parser and cross-checked with `grep` against the SQL files.

| Object | schema.sql | salingkusog.sql | stats.sql | Total |
|---|---|---|---|---|
| Tables | 29 | 12 | 9 | **50** |
| Enums | 13 | 6 | 0 | **19** |
| Views | 1 | 5 | 0 | **6** |
| Functions | 39 | 18 | 19 | **76** |
| Triggers | 19 | 21 | 0 | **40** |
| Indexes | 35 | 18 | 7 | **60** |
| RLS policies (incl. storage) | 64 | 25 | 8 | **97** |
| Storage buckets | 3 | — | — | **3** |

**Tables.**

- *Newsroom (`schema.sql`, 28 in `public` + 1 in `app`):* `profiles`, `staff_invites`, `sections`, `profile_sections`, `categories`, `tags`, `media_assets`, `contributors`, `publication_issues`, `articles`, `article_authors`, `article_tags`, `article_media`, `article_revisions`, `article_activity`, `article_daily_views`, `article_comments`, `article_comment_private`, `home_slots`, `article_submissions`, `event_reports`, `intake_files`, `contact_messages`, `team_terms`, `team_members`, `department_contacts`, `site_settings`, `audit_log`, `app.rate_events`.
- *Salingkusog (`salingkusog.sql`):* `sk_editions`, `sk_factions`, `sk_venues`, `sk_sports`, `sk_events`, `sk_athletes`, `sk_matches`, `sk_entries`, `sk_athlete_stats`, `sk_placements`, `sk_awards`, `sk_team`.
- *Statistics (`stats.sql`):* `app.stats_salts`, `stats_pageviews`, `stats_shares`, `staff_activity_daily`, `stats_daily_site`, `stats_daily_articles`, `stats_daily_dims`, `stats_daily_shares`, `stats_rollup_log`.

**Enums (19):** `app_role` (7 values), `article_status` (7), `nav_placement`, `contributor_type`, `asset_kind`, `article_media_usage`, `revision_kind`, `comment_status`, `intake_status`, `contact_category`, `contact_status`, `issue_type`, `team_role_group`, `sk_category` (10), `sk_division` (4), `sk_format` (5), `sk_match_status` (5), `sk_medal` (3), `sk_award_kind` (3).

**Views (6, all `security_invoker`):** `article_cards`, `sk_medal_table`, `sk_points_by_day`, `sk_head_to_head`, `sk_event_status`, `sk_event_leaders`.

**Public RPCs (callable from the browser):**

- anonymous and staff: `record_article_view`, `most_read_articles`, `search_articles`, `archive_months`, `sk_countdown`, `sk_points_timeline`;
- staff: `transition_article`, `add_article_note`, `convert_intake_to_article`, `dashboard_stats`, `media_usage`, `set_publish_access`, `sk_set_placements`, `sk_build_schedule`, `sk_create_contest`, `staff_heartbeat`, and the seven `stats_*` readers;
- service role only (through `/api`): `submit_comment`, `submit_article`, `submit_event_report`, `send_contact_message`, `stats_ingest`.

**Storage buckets:** `media` (public, 10 MB, images), `archives` (public, 60 MB, PDF and images, publishers write), `intake` (private, 20 MB, images, PDF, text and Word; written only through signed upload links from `/api/submit`).

**Realtime publication:** `sk_matches`, `sk_placements`, `sk_entries` (`salingkusog.sql`).

The full data dictionary is in `04-database-design.md`.

# 8. Roles and permissions

**Roles** (enum `public.app_role`): `super_admin`, `editor_in_chief` (shown as **Executive Editor**), `managing_editor`, `business_manager`, `section_editor`, `staff_writer`, `contributor`. A profile counts only while `profiles.is_active` is true (`app.current_role()`). Anonymous readers have no account. Accounts are created only for emails pre-authorised in `staff_invites`; anyone else who signs up gets an inactive profile with no access (`app.handle_new_user`).

**Permission helpers** (`schema.sql`, `salingkusog.sql`, `stats.sql`):

| Helper | True for |
|---|---|
| `app.is_staff()` | any active role |
| `app.is_admin()` | super_admin, editor_in_chief |
| `app.can_publish()` | super_admin, editor_in_chief, managing_editor |
| `app.can_publish_articles()` | `can_publish()`, business_manager, or a profile with `can_publish = true` |
| `app.is_editor()` | super_admin, editor_in_chief, managing_editor, section_editor |
| `app.can_edit_section(s)` | `can_publish()`, or a section_editor assigned to section `s` (`profile_sections`) |
| `app.can_view_stats()` | super_admin, editor_in_chief, managing_editor |
| `app.can_manage_sk_team()` | super_admin, editor_in_chief, managing_editor |
| `app.can_edit_sk()` | `can_manage_sk_team()`, or active staff listed in `sk_team` |

**Role × feature matrix** (✔ = allowed, ○ = only own or assigned items, — = not allowed). SA = super_admin, EE = editor_in_chief (Executive Editor), ME = managing_editor, BM = business_manager, SE = section_editor, SW = staff_writer, CO = contributor, SKT = Salingkusog team member (any active role listed in `sk_team`), Pub = anonymous reader.

| Feature (rule source) | SA | EE | ME | BM | SE | SW | CO | Pub |
|---|---|---|---|---|---|---|---|---|
| Read live articles, sections, published Salingkusog data (RLS `*_read`) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Create article drafts (`articles` insert: `is_staff`) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | — |
| Edit articles (`articles` update + `article_before_write`) | ✔ | ✔ | ✔ | ○ own | ○ own + assigned sections | ○ own | ○ own | — |
| Submit for review (draft → submitted) | ✔ | ✔ | ✔ | ○ | ✔ section | ○ | ○ | — |
| Review, reject, return (in_review / rejected) | ✔ | ✔ | ✔ | — | ✔ section | — | — | — |
| Publish, schedule, archive (`can_publish_articles`) | ✔ | ✔ | ✔ | ✔ | granted | granted | granted | — |
| Grant "Can publish" (`set_publish_access`) | ✔ | ✔ | ✔ | — | — | — | — | — |
| Feature / prioritise articles | ✔ | ✔ | ✔ | — | ✔ section | — | — | — |
| Delete articles (`articles` delete) | ✔ | ✔ | ○ drafts | ○ drafts | ○ drafts | ○ drafts | ○ drafts | — |
| Staff accounts, roles, invites (`is_admin`; super_admin only grants super_admin) | ✔ | ✔ (not SA) | — | — | — | — | — | — |
| Sections, categories, desk contacts, general settings (`is_admin`) | ✔ | ✔ | — | — | — | — | — | — |
| Front page slots, ticker, print issues, editorial board (`can_publish`) | ✔ | ✔ | ✔ | — | — | — | — | — |
| Media library upload (`media` bucket: `is_staff`) / delete others' (`is_editor`) | ✔ | ✔ | ✔ | ○ | ✔ | ○ | ○ | — |
| Comment moderation, submissions, event reports, inbox (`is_editor`) | ✔ | ✔ | ✔ | — | ✔ | — | — | — |
| Contributors (bylines) manage (`is_editor`) / own byline | ✔ | ✔ | ✔ | ○ | ✔ | ○ | ○ | — |
| Audit log read (`is_admin`) | ✔ | ✔ | — | — | — | — | — | — |
| Statistics (`can_view_stats`) | ✔ | ✔ | ✔ | — | — | — | — | — |
| Salingkusog data entry (`can_edit_sk`) | ✔ | ✔ | ✔ | SKT | SKT | SKT | SKT | — |
| Salingkusog team membership and countdown settings | ✔ | ✔ | ✔ | — | — | — | — | — |
| Comment, submit stories and events, contact (via `/api/submit` + Turnstile) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |

Notes: "granted" means the profile's `can_publish` flag, set in Staff → Accounts by SA, EE or ME. The newsroom UI mirrors these rules in `src/features/auth/permissions.ts`, but the database enforces them (`docs/v2/DB.md`).

# 9. Features and modules

| Module | What it does | Routes | Key code | Key tables / RPCs |
|---|---|---|---|---|
| Authentication | Password sign-in, password reset, invite acceptance; `RequireStaff` guard shows an "access pending" screen to inactive or uninvited accounts; `RequireRole` limits screens by role | `/admin/login`, `/admin/forgot-password`, `/admin/set-password` | `src/features/auth/*` | `profiles`, `staff_invites`, `app.handle_new_user` |
| Dashboard | Counts and shortcuts per role | `/admin` | `cms/dashboard/*` | `dashboard_stats()` |
| Articles | List, TipTap editor, autosave, revisions, notes, workflow, scheduling, SEO fields, featured flag | `/admin/articles*` | `cms/articles/*` | `articles`, `article_*`, `transition_article`, `add_article_note` |
| Submissions and events (intake) | Review public story submissions and event reports; convert to a draft article | `/admin/submissions*`, `/admin/events*` | `cms/intake/*` | `article_submissions`, `event_reports`, `intake_files`, `convert_intake_to_article` |
| Media library | Upload (compressed WebP, 4 sizes), search, usage check, "Make web sizes" backfill | `/admin/media` | `cms/media/*`, `src/lib/images.ts` | `media_assets`, `media_usage()` |
| Staff | Accounts (roles, activation, publishing access), invites, contributors, editorial board | `/admin/staff*` | `cms/people/*` | `profiles`, `staff_invites`, `contributors`, `team_terms`, `team_members`, `set_publish_access` |
| Settings | Front page, comments moderation, inbox, sections and categories, desks, general (social links, ticker…) | `/admin/settings*` | `cms/settings/*` | `home_slots`, `article_comments`, `contact_messages`, `sections`, `categories`, `department_contacts`, `site_settings` |
| Statistics | Pageviews, readers, read time, shares, top articles, authors, sections, sources, devices, staff active time | `/admin/statistics` | `cms/statistics/*`, `api/e.ts` | `stats_*` tables and RPCs |
| Salingkusog | See section 10 | `/admin/salingkusog*`, `/salingkusog*` | `cms/salingkusog/*`, `public/salingkusog/*` | `sk_*` |
| Public site | Home, 12 sections with custom landings, article, search, archives, about, board, privacy, forms | public routes | `src/features/public/*` | `article_cards`, `search_articles`, `most_read_articles` |
| SEO and sharing | Open Graph for crawlers, sitemap, RSS, robots, canonical URLs | — | `middleware.ts`, `api/*` | `article_cards` |
| Form security | Turnstile gateway, signed uploads, rate limits, honeypot | — | `api/submit.ts`, `src/lib/sendForm.ts` | `app.rate_limit`, form RPCs |

# 10. Salingkusog module

Salingkusog is VSU's intramural games. The module models one **edition** per year (`sk_editions`: dates, medal points 5/3/1 by default, `is_current`, `is_published`, countdown settings). Everything else belongs to an edition: **factions** (teams), **venues**, **sports** (category from `sk_category`), **events** (a sport + division + format), **athletes**, **matches** (games), **entries** (contest line-ups), **athlete stats**, **placements** (official places and medals) and **awards** (MVP of the day, athlete of the day, finals MVP).

| Capability | How it works | Evidence |
|---|---|---|
| Team access | SA/EE/ME always; other active staff while listed in `sk_team`; changes audited | `app.can_edit_sk`, `sk_team_audit` |
| Schedule import | CSV of date, time, sport, event, round, sides, venue; validated before insert | `cms/salingkusog/scheduleCsv.ts`, `ImportTab.tsx` |
| Build schedule | Single elimination (bronze game, byes), round robin, round robin + final; games know where their sides come from (`source_a/_b`) | `sk_build_schedule`, `BuildScheduleModal.tsx` |
| Auto-advance | After each result, `app.sk_resolve` fills the next games; started games never change; knockout ties are refused | triggers `sk_matches_advance`, `sk_matches_knockout` |
| Contests | One session with every faction (dance, swimming, athletics…); results or judged places per entry; DNS/DNF/DQ | `sk_create_contest`, `sk_entries`, `ContestScorekeeper.tsx`, `src/lib/skContests.ts` |
| Live scores | Phone-friendly scorekeeper with periods, live note, box score; Realtime pushes to readers | `Scorekeeper.tsx`, publication `supabase_realtime` |
| Results and medals | Staff confirm places 1–3 (medals follow the place); suggestions come from the games | `sk_set_placements`, `ResultsTab.tsx`, `suggestedPodium` |
| Medal table | Computed: gold, silver, bronze, total, points, rank | view `sk_medal_table` |
| Points race | Cumulative points per day, or in 1/3/6/12-hour steps | view `sk_points_by_day`, RPC `sk_points_timeline` |
| Head-to-head, event status, leaders | Computed views | `sk_head_to_head`, `sk_event_status`, `sk_event_leaders` |
| Awards and social cards | Daily awards; downloadable PNG cards | `cms/salingkusog/awards/*` |
| Public hub | Medal tally, schedule, winners, factions, sports (bracket / standings / contest results), match recaps, venues, countdown | `src/features/public/salingkusog/*` |

There is **no field for birth dates, student numbers or eligibility documents**: `sk_athletes` stores name, slug, program (course/year) and an optional photo only.

# 11. Statistics module

First-party, cookie-less statistics (`docs/v2/STATS.md`). The browser tracker (`src/features/public/analytics/*`) batches events to `/api/e`, which strips bots and identifying data and calls `stats_ingest` with the service key. Visitor ids are hashed with a daily salt that is deleted after two days; Do Not Track and Global Privacy Control are honoured; raw events are kept 13 months, daily totals indefinitely, staff activity 24 months (`app.stats_nightly`). Only SA, EE and ME can read statistics (`app.can_view_stats`).

# 12. Tests, CI and scripts

| Item | Status | Evidence |
|---|---|---|
| Unit and component tests | 48 files, **255 tests**, all passing on 2026-10-19 | `npm run test` (Vitest) |
| Database tests | 6 files, **278 checks**, all passing on 2026-10-19 | `npm run db:test` → `supabase/tests/*.test.sql` |
| Per-file database checks | public_access 39 · salingkusog 71 · sk_brackets 28 · sk_contests 17 · stats 48 · workflow 75 | `supabase/tests/` |
| Lint, typecheck, build | Part of `npm run check` | `package.json` |
| Contrast check | All design-token colour pairs meet WCAG AA | `scripts/check-contrast.mjs` |
| Dev screen checks | `/dev` sweep: 53 screens, no overflow or naming issues at 375 px and 1024 px (2026-10-19) | `src/dev/domCheck.ts` |
| Dependency audit | `npm audit --omit=dev`: 0 vulnerabilities (2026-10-19) | npm |
| Continuous integration | **None.** `.github/` holds prompts only; no workflow files | `.github/` |
| End-to-end browser tests | **None in the repository.** An old Katalon Studio project exists in the untracked, git-ignored `Amaranth/` folder | `.gitignore` line 25 |
| Performance | Lighthouse results recorded in `docs/v2/PERF.md` (production, 2026-10-18: performance 67–72, accessibility 100, best practices 100, SEO 100 on mobile) | `docs/v2/PERF.md` |

# 13. Known issues, TODOs and technical debt

No `TODO`, `FIXME` or `HACK` comments exist in `src`, `api`, `supabase`, `middleware.ts` or `scripts`. Issues found during this audit:

| ID | Issue | Impact | Evidence |
|---|---|---|---|
| KI-01 | No CI: tests only run locally | A regression could reach `main` if a step is skipped | `.github/` |
| KI-02 | `docs/v2/DB.md` is out of date (says anyone may upload to `intake`; quotes 95 checks; Realtime only on `sk_matches`) | Misleading for maintainers | `docs/v2/DB.md` vs `schema.sql` |
| KI-03 | Content-Security-Policy is in report-only mode | Browser does not yet block injected scripts | `vercel.json` |
| KI-04 | `src/lib/database.types.ts` is hand-written, not generated | Types can drift from the schema | file header |
| KI-05 | Games created before "Build schedule" (CSV or by hand) have no sources, so they do not advance automatically | Staff must fill later rounds by hand for those events | `sk_matches.source_a/_b` |
| KI-06 | Opening `/salingkusog/match/:id` for a contest session shows a two-sided recap with empty sides | Cosmetic; contest cards do not link there | `RecapView.tsx` |
| KI-07 | Faction profile lists only two-sided games, not contest results (medals are counted) | Incomplete history on faction pages | `public/salingkusog/factions.ts` |
| KI-08 | Supabase Auth hardening (sign-ups off, leaked-password protection, MFA) depends on dashboard settings | Account takeover risk if left at defaults | `docs/v2/DB.md` §2.6 [TO CONFIRM current settings] |
| KI-09 | Public reads through `/api/r` can be up to 60 s (stale up to 300 s) old | Expected trade-off for performance; live scores bypass it | `api/r.ts` |
| KI-10 | No email notifications (for example "article submitted for review") | Staff must check the newsroom | no mail library in `package.json` |
| KI-11 | Old Katalon test project in `Amaranth/` (ignored) | Clutter; not run | `.gitignore` |

# 14. Gaps against a typical publication CMS and sports-results system

| Area | Typical expectation | Amaranth v2 status |
|---|---|---|
| Editorial workflow | Draft → review → publish with roles | Present and database-enforced |
| Revision history | Versions and restore | Present (newest 50 revisions per article) |
| Notifications | Email or in-app alerts on workflow changes | **Missing** (KI-10) |
| Two-factor authentication | MFA for admins | **Not configured in code** (Supabase supports it) |
| Automated testing in CI | Tests on every push | **Missing** (KI-01) |
| End-to-end tests | Browser tests of key flows | **Missing** |
| Backups | Scheduled, tested restores | Platform default [TO CONFIRM Supabase plan and backup policy] |
| Multilingual content | English and Filipino/Waray | English UI only [TO CONFIRM need] |
| Sports: heats and finals | Qualifying heats feeding a final | Not supported by design (straight finals chosen) |
| Sports: officials, protests, appeals | Officials list, protest workflow | **Missing** |
| Sports: athlete eligibility | Eligibility records and checks | **Not modelled**: no eligibility data in the system |
| Sports: audit of score edits | Who changed which score | Partial: `sk_matches.updated_by`; no full history |
| Offline scorekeeping | Works without signal, syncs later | **Missing** (needs connection) |

# 15. Live data snapshot (2026-10-19)

Read with the anonymous key from the project configured in `.env` [TO CONFIRM it is the production project].

| Item | Count |
|---|---|
| Sections / categories | 12 / 35 |
| Live articles (`article_cards`) | 10 |
| Editorial board members | 19 |
| Salingkusog editions | 1 (2026, Oct 26–30; medal points 5 / 3 / 1; published) |
| Factions | 4 |
| Sports | 27 (ball games 9, dance & cheer 5, racket 3, combat 2, esports 2, others 2, aquatics 1, athletics 1, mind games 1, pageant 1) |
| Events | 74 (timed 33, round robin + final 25, judged 10, bracket 6) |
| Venues | 21 |
| Scheduled games and contest sessions | 169 |
| Contest entries | 68 |
| Placements (medals) | 0 (the games have not started) |

# 16. Items to confirm

1. Team member names, roles and student numbers to show on title pages (never personal data beyond names).
2. Institution unit (college/department), adviser name and title.
3. Audience and date of the defense presentation.
4. Production domain (custom domain or `amaranth-iota.vercel.app`).
5. Whether the `.env` Supabase project is production.
6. Supabase plan and backup policy; whether pg_cron `publish-due-articles` is enabled.
7. Current Supabase Auth settings (sign-ups disabled, leaked-password protection, MFA).
8. Whether athlete eligibility forms are collected outside the system, and by whom.
9. Project start date and milestone dates for the timeline (git history starts 2025-09-23; v2 rebuild started 2026-10-17).
10. Hosting and domain costs, if any.
