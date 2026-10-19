---
title: "One-Page Cheat Sheets"
subtitle: "Architecture, roles, database and features at a glance"
version: "1.0"
date: "2026-10-19"
---

# Document control

| Field | Value |
|---|---|
| Title | One-Page Cheat Sheets |
| Document ID | AMR-DOC-22 |
| Version | 1.0 |
| Date | 2026-10-19 |
| Status | Final draft |

\newpage

# Cheat sheet 1 — Architecture

| Layer | What | Key files |
|---|---|---|
| Browser | React 18 + TypeScript SPA (Vite 7), TanStack Query, Tailwind v4 tokens | `src/app/router.tsx`, `src/features/*` |
| Edge | Vercel CDN; `/api/r` edge cache (60 s) | `api/r.ts`, `src/lib/edgeCache.ts` |
| Server | `/api/submit` (Turnstile + signed uploads + service RPCs), `/api/e` (stats), sitemap/RSS/robots, crawler middleware | `api/*.ts`, `middleware.ts` |
| Data and rules | PostgreSQL: 50 tables, 97 RLS policies, 40 triggers, 76 functions, 6 views | `supabase/v2/*.sql` |
| Platform | Supabase Auth, Storage (media, archives, intake), Realtime, pg_cron | Supabase |

Principles: the database is the security boundary · secrets only in `/api` · computed standings · re-runnable SQL · one feature per branch.

![Layers](diagrams/arch-1-layers.png)

\newpage

# Cheat sheet 2 — Roles

| Role | Write | Review | Publish | Staff & settings | Front page | Stats | Salingkusog |
|---|---|---|---|---|---|---|---|
| Super admin | ✔ | ✔ | ✔ | ✔ (+ grant SA) | ✔ | ✔ | ✔ + team |
| Executive Editor | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ + team |
| Managing Editor | ✔ | ✔ | ✔ | publishing access only | ✔ | ✔ | ✔ + team |
| Business Manager | ✔ | — | ✔ | — | — | — | if in team |
| Section editor | ✔ | own sections | if granted | — | — | — | if in team |
| Staff writer / Contributor | ✔ | — | if granted | — | — | — | if in team |
| Reader | — | — | — | — | — | — | view published |

Helpers: `is_staff` · `is_admin` (SA, EE) · `can_publish` (SA, EE, ME) · `can_publish_articles` (+ BM, granted) · `is_editor` (+ SE) · `can_view_stats` · `can_edit_sk` (+ team).

\newpage

# Cheat sheet 3 — Database

| Group | Tables |
|---|---|
| People | profiles, staff_invites, profile_sections, contributors, team_terms, team_members, audit_log |
| Content | sections, categories, tags, articles, article_authors, article_tags, article_media, article_revisions, article_activity, article_daily_views, publication_issues, media_assets, home_slots |
| Public input | article_comments, article_comment_private, article_submissions, event_reports, intake_files, contact_messages |
| Settings | site_settings, department_contacts |
| Salingkusog | sk_editions, sk_factions, sk_venues, sk_sports, sk_events, sk_athletes, sk_matches, sk_entries, sk_athlete_stats, sk_placements, sk_awards, sk_team |
| Statistics | stats_pageviews, stats_shares, staff_activity_daily, stats_daily_site, stats_daily_articles, stats_daily_dims, stats_daily_shares, stats_rollup_log (+ app.stats_salts) |

Article workflow: draft → submitted → in_review → scheduled/published → archived (rejected → draft). Medal table: points = 5·gold + 3·silver + 1·bronze; rank by points, gold, silver.

\newpage

# Cheat sheet 4 — Features

| Area | Features |
|---|---|
| Public site | Home, 12 section landings, article, search, archives, about, board, privacy, submit story, report event, contact, comments |
| Newsroom | Dashboard, article editor (autosave, revisions, notes, workflow, scheduling), submissions and events, media library (WebP sizes, in-use guard), staff and publishing access, settings, statistics |
| Salingkusog | Edition, factions, venues, sports and events, athletes, team; CSV import, Build schedule (bracket, round robin, RR + final), contests; live scorekeeper; results and medals (suggest + confirm); awards and social cards; medal tally, points race (1/3/6/12 h, day), official final tally, schedule, winners, factions, brackets, recaps, venues, countdown |
| Security | Invite-only accounts, RLS everywhere, workflow trigger, Turnstile gateway, signed uploads, rate limits, sanitising, security headers |
| Quality | 255 unit tests, 278 SQL checks, 53-screen accessibility sweep, WCAG AA contrast, Lighthouse a11y 100 |
