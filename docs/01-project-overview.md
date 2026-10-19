---
title: "Project Overview and Vision"
subtitle: "Amaranth v2 — newsroom and publishing system of Amaranth, VSU"
version: "1.0"
date: "2026-10-19"
---

# Document control

| Field | Value |
|---|---|
| Title | Project Overview and Vision |
| Document ID | AMR-DOC-01 |
| Version | 1.0 |
| Date | 2026-10-19 |
| Author | Amaranth development team [TO CONFIRM: names] |
| Adviser | [TO CONFIRM: name and title] |
| Status | Final draft for defense |
| Related documents | AMR-DOC-00 Audit Report, AMR-DOC-02 SRS, AMR-DOC-03 SDD |

# Contents

1. Background
2. Problem statement
3. Vision and product statement
4. Stakeholders and user classes
5. Objectives
6. Scope
7. Out of scope
8. Success criteria
9. Constraints and assumptions
10. Project at a glance

# 1. Background

**Amaranth** is the official student publication of Visayas State University (VSU) in Baybay City, Leyte. It publishes news, features, literary works, opinion and sports coverage, and covers **Salingkusog**, VSU's annual intramural games.

The first website (v1, git history from 2025-09-23) was a partial front end. The v2 rebuild started on 2026-10-17 (`docs/v2/PLAN.md`) and replaced it with a complete newsroom and publishing system. Phase 2 (`docs/v2/PLAN-PHASE2.md`) added the Salingkusog module and section-specific page layouts. A brand refresh ("Brand 2026") was approved by the Executive Editor on 2026-10-18 (`docs/v2/PROGRESS.md`).

# 2. Problem statement

The audit of the v1 site (`docs/v2/PLAN.md`, §1) found:

| # | Problem in v1 | Consequence |
|---|---|---|
| P1 | The styling was 5,170 lines of pre-compiled CSS from a design export; the styling tool itself was not installed | New styles could not be added safely |
| P2 | 15 near-identical hand-written section pages (~210 lines each) | Every change had to be made 15 times |
| P3 | A placeholder integration (`joomlaApi.ts`) that talked to nothing | Dead code and confusion |
| P4 | No lint, type-check or tests | Regressions went unnoticed |
| P5 | Database helper functions exposed in the public API; a storage policy let any writer delete any file; no safe way for readers to record article views | Security and data-integrity risks |
| P6 | No editorial workflow, revisions, comment moderation, homepage curation, staff invites or audit log | The newsroom could not be run inside the system |
| P7 | Slow pages: Lighthouse mobile performance 56, accessibility 91, about 1.6 MB transferred on the home page (`docs/v2/PERF.md`) | Poor experience on campus mobile data |
| P8 | Intramural results were not managed in the site | No live scores, medal table or official standings online |

# 3. Vision and product statement

> **For** the Amaranth editorial board, staff and the VSU community, **Amaranth v2** is a web newsroom and publishing system **that** lets staff write, review, schedule and publish stories under clear editorial roles, and lets the Salingkusog team run live scores, brackets, results and the official medal table. **Unlike** the v1 site, every permission is enforced by the database itself, the public site is fast and accessible on mobile, and intramural standings are computed automatically from recorded results.

# 4. Stakeholders and user classes

| Stakeholder | Interest | Role in the system (`public.app_role`) |
|---|---|---|
| Executive Editor (Editor-in-Chief) | Editorial control, final say on publishing, staff management | `editor_in_chief` |
| Technical administrator | Accounts, configuration, recovery | `super_admin` |
| Managing Editor | Daily publishing, front page, statistics, Salingkusog team | `managing_editor` |
| Business Manager | Publishing of paid or institutional notices [TO CONFIRM purpose] | `business_manager` |
| Section editors | Review and edit stories in assigned sections | `section_editor` |
| Staff writers and contributors | Write drafts and submit for review | `staff_writer`, `contributor` |
| Salingkusog team | Enter schedules, scores, results and awards during the games | any active role listed in `sk_team` |
| Readers (students, faculty, alumni, public) | Read news, follow Salingkusog live, submit stories and events, comment | anonymous |
| Story and event contributors from the public | Send story submissions and event reports | anonymous (through the public forms) |
| Adviser and university administration | Oversight, accountability, data privacy | [TO CONFIRM whether they need accounts] |
| Future maintainers | Understand and extend the system | developers |

# 5. Objectives

| ID | Objective | Measured by |
|---|---|---|
| OBJ-1 | Run the whole editorial process in the system: draft → submitted → in review → scheduled/published → archived, with notes and history | Workflow trigger `app.article_before_write`; 75 checks in `supabase/tests/workflow.test.sql` |
| OBJ-2 | Enforce permissions in the database for every role | RLS on all 50 tables; 97 policies; role helpers in `schema.sql` |
| OBJ-3 | Give readers a fast, accessible, mobile-first public site | Lighthouse accessibility 100, best practices 100, SEO 100 on production (`docs/v2/PERF.md`) |
| OBJ-4 | Accept stories, event reports, comments and messages from the public safely | `/api/submit` with Turnstile, rate limits, honeypot, moderation |
| OBJ-5 | Run Salingkusog in the system: setup, schedule, live scores, brackets, contests, results, medals and awards | `salingkusog.sql`; 116 checks in the three Salingkusog SQL test files |
| OBJ-6 | Compute the medal table, points and rankings automatically from results | Views `sk_medal_table`, `sk_points_by_day`; RPC `sk_points_timeline` |
| OBJ-7 | Measure readership without third-party trackers or cookies | `stats.sql`, `api/e.ts`, `/privacy` page |
| OBJ-8 | Keep the code maintainable and tested | TypeScript strict, ESLint, 255 unit tests, 278 SQL checks |

# 6. Scope

In scope (all implemented in the repository):

- **Public site:** home, 12 sections with their own landing layouts, article pages, search, archives, about, editorial board, privacy notice, story submission, event report and contact forms, comments.
- **Newsroom (`/admin`):** dashboard, articles and editor, editorial workflow, submissions and event reports, media library, staff and editorial board, settings, statistics.
- **Salingkusog:** public hub (medal tally, schedule and results, winners, factions, sports, match recaps, venues, countdown) and newsroom tools (edition, factions, sports and events, venues, athletes, schedule import, build schedule, contests, scorekeeper, results and medals, awards and social cards, team access).
- **Platform concerns:** link previews for social media, sitemap, RSS, security headers, form CAPTCHA, statistics with privacy safeguards.

# 7. Out of scope

| Item | Reason |
|---|---|
| Reader accounts and paywalls | Readers stay anonymous (`docs/v2/PLAN.md`, decision 7) |
| Native mobile apps | The responsive web app serves phones |
| Email notifications | Not built (see AMR-DOC-13) |
| Print layout and press production | Print issues are uploaded as PDFs only |
| Advertising management | Not part of the brief |
| Athlete eligibility verification | Not modelled; the system stores only athlete name, program and optional photo |
| Qualifying heats and multiple entries per faction in contests | Straight finals and one entry per faction were chosen for Salingkusog 2026 |
| Migration of v1 content | A fresh database was chosen (option B, `docs/v2/DB.md`) |

# 8. Success criteria

| ID | Criterion | Status (2026-10-19) | Evidence |
|---|---|---|---|
| SC-1 | Every table protected by RLS | Met: 50 of 50 | `schema.sql`, `salingkusog.sql`, `stats.sql` |
| SC-2 | All automated tests pass before release | Met: 255 unit tests, 278 SQL checks | `npm run check`, `npm run db:test` |
| SC-3 | Accessibility score 100 on key public pages | Met on `/`, `/news`, `/salingkusog` | `docs/v2/PERF.md` (2026-10-18) |
| SC-4 | Colour contrast meets WCAG 2.1 AA for all design tokens | Met | `scripts/check-contrast.mjs` |
| SC-5 | No secrets in the browser bundle | Met: service and Turnstile secrets used only in `api/` | `api/e.ts`, `api/submit.ts` |
| SC-6 | Salingkusog standings need no manual tallying | Met: computed views and RPC | `sk_medal_table`, `sk_points_by_day` |
| SC-7 | The newsroom is usable by all roles during the 2026 edition (Oct 26–30) | [TO CONFIRM after the event] | — |
| SC-8 | Mobile Lighthouse performance ≥ 70 on the home page with real data | Partly met (68–72 on 2026-10-18; image-size fixes deployed after) | `docs/v2/PERF.md` |

# 9. Constraints and assumptions

- **Platforms:** Supabase and Vercel managed services (no own servers).
- **Budget:** free or low-cost tiers [TO CONFIRM plans and costs].
- **Time zone:** Philippine time (UTC+8) for all Salingkusog days and schedules (`src/lib/manila.ts`, `app.manila_today()`).
- **Language:** English user interface.
- **Connectivity:** staff and scorekeepers need an internet connection.
- **Assumption:** staff accounts are created by invitation only and the Supabase "allow new users to sign up" setting is off (`docs/v2/DB.md`) [TO CONFIRM].

# 10. Project at a glance

| Measure | Value | Source |
|---|---|---|
| Source files (TypeScript, excluding tests) | 206 | repository |
| Lines of TypeScript (incl. tests) | ≈ 27,700 | repository |
| Lines of SQL (`supabase/v2`) | 4,082 | repository |
| Database tables / views / functions | 50 / 6 / 76 | AMR-DOC-04 |
| Roles | 7 account roles + anonymous reader | `public.app_role` |
| Public routes / newsroom screens | 24 public paths (+ 7 legacy redirects) / 35 newsroom paths and tabs | `src/app/router.tsx` and nested routers |
| Automated tests | 255 unit + 278 SQL checks | AMR-DOC-08 |
| Commits | 183 (2025-09-23 → 2026-10-19) | git history |
| Salingkusog 2026 setup | 4 factions, 27 sports, 74 events, 21 venues, 169 games and sessions | live snapshot, AMR-DOC-00 §15 |
