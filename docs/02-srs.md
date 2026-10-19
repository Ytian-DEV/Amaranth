---
title: "Software Requirements Specification (SRS)"
subtitle: "Amaranth v2 — newsroom, public site and Salingkusog module"
version: "1.0"
date: "2026-10-19"
---

# Document control

| Field | Value |
|---|---|
| Title | Software Requirements Specification |
| Document ID | AMR-DOC-02 |
| Version | 1.0 |
| Date | 2026-10-19 |
| Author | Amaranth development team [TO CONFIRM: names] |
| Status | Final draft for defense |
| Basis | Implemented system at `develop` commit `d7f6f34`; structure adapted from IEEE 29148 |

# Contents

1. Introduction
2. Overall description
3. User classes and characteristics
4. Functional requirements
5. Non-functional requirements
6. External interface requirements
7. Constraints and assumptions
8. User stories with acceptance criteria
9. Requirement-to-design index

\newpage

# 1. Introduction

## 1.1 Purpose
This SRS states what Amaranth v2 must do and how well. It is written from the implemented system: every requirement names the code that satisfies it, so the document can be verified against the repository. Tests that cover each requirement are listed in AMR-DOC-08 (Test Documentation and Requirements Traceability Matrix).

## 1.2 Scope
Amaranth v2 consists of the public news site, the staff newsroom at `/admin`, and the Salingkusog intramurals module, backed by Supabase and hosted on Vercel (AMR-DOC-01 §6).

## 1.3 Definitions
| Term | Meaning |
|---|---|
| RLS | Row Level Security: PostgreSQL rules that decide which rows a user may read or change |
| RPC | Remote procedure call: a database function called from the app through Supabase |
| Live article | Status `published` or `scheduled`, with `published_at` in the past (`app.is_live`) |
| Publisher | A user for whom `app.can_publish_articles()` is true |
| Editor | A user for whom `app.is_editor()` is true (SA, EE, ME, SE) |
| Salingkusog team | Active staff listed in `sk_team`, plus SA, EE and ME |
| Edition, faction, event, placement, contest | See AMR-DOC-14 Glossary |

Requirement keywords: **shall** = mandatory and implemented; **should** = desirable.

## 1.4 Requirement ID scheme
| Prefix | Area |
|---|---|
| FR-001 – FR-009 | Authentication and accounts |
| FR-010 – FR-029 | Articles and editorial workflow |
| FR-030 – FR-039 | Public site and SEO |
| FR-040 – FR-049 | Public intake: submissions, events, contact, comments |
| FR-050 – FR-059 | Media library |
| FR-060 – FR-069 | Staff, contributors, editorial board |
| FR-070 – FR-079 | Settings and dashboard |
| FR-080 – FR-089 | Statistics |
| FR-100 – FR-139 | Salingkusog |
| NFR-xx | Non-functional requirements |

\newpage

# 2. Overall description

## 2.1 Product perspective
A single-page web application (React + TypeScript) that reads and writes Supabase directly with the signed-in user's token. Database triggers and RLS enforce every rule. A thin Vercel layer handles secrets, caching and SEO (AMR-DOC-03).

## 2.2 Product functions (summary)
1. Staff sign in by invitation and get role-based access.
2. Staff write, review, schedule and publish articles under an enforced workflow.
3. Readers browse sections, read and search articles, comment, and submit stories, event reports and messages.
4. Editors moderate comments and review public submissions.
5. Staff manage media, contributors, the editorial board and site settings.
6. Managers view privacy-preserving statistics.
7. The Salingkusog team runs the intramural games: setup, schedules, live scores, brackets, contests, results, medals and awards; readers follow along live.

## 2.3 Operating environment
Modern evergreen browsers on desktop and mobile; Supabase (PostgreSQL 15+, Auth, Storage, Realtime, pg_cron); Vercel (static hosting, Node serverless functions, routing middleware).

\newpage

# 3. User classes and characteristics

| Class | Role value | Characteristics | Typical tasks |
|---|---|---|---|
| Super admin (SA) | `super_admin` | Technical administrator; at least one must stay active | Accounts, all settings, recovery |
| Executive Editor (EE) | `editor_in_chief` | Head of the publication | Final editorial control, staff, settings |
| Managing Editor (ME) | `managing_editor` | Runs daily publishing | Publish, front page, statistics, Salingkusog team |
| Business Manager (BM) | `business_manager` | Publishes without editorial admin rights | Publish and schedule own articles |
| Section Editor (SE) | `section_editor` | Assigned to one or more sections | Review and edit articles in those sections |
| Staff Writer (SW) | `staff_writer` | Regular staff | Draft and submit articles |
| Contributor (CO) | `contributor` | Occasional writer | Draft and submit articles |
| Salingkusog team member (SKT) | any role + `sk_team` row | Works on phones during the games | Scores, results, awards |
| Reader | anonymous | Students, faculty, alumni, public; mostly on mobile | Read, search, comment, submit, follow live scores |

\newpage

# 4. Functional requirements

Each requirement lists its priority (M = must, S = should) and the implementing evidence.

## 4.1 Authentication and accounts (FR-001 – FR-009)

| ID | Requirement | Pri | Evidence |
|---|---|---|---|
| FR-001 | The system shall let staff sign in with email and password. | M | `LoginPage.tsx` (`auth.signInWithPassword`) |
| FR-002 | The system shall let staff reset a forgotten password by email and set a new password from the emailed link. | M | `ForgotPasswordPage.tsx`, `SetPasswordPage.tsx` |
| FR-003 | The system shall grant a role only to emails pre-authorised in `staff_invites`; any other new account shall be created inactive with no access. | M | `app.handle_new_user` |
| FR-004 | The system shall block inactive or uninvited users from the newsroom and show an "access pending" screen. | M | `RequireStaff` in `guards.tsx`, `app.current_role` |
| FR-005 | Only SA and EE shall change roles and activation; only SA shall grant or remove the super_admin role. | M | `app.guard_profile_update` |
| FR-006 | The system shall refuse to demote or deactivate the last active super admin. | M | `app.guard_profile_update` |
| FR-007 | The system shall record role, activation and publishing-access changes in the audit log. | M | `app.audit`, `audit_log` |
| FR-008 | The database shall let staff update their own display name, bio and avatar (but not role or access). A self-service profile screen is not built yet (AMR-DOC-13). | S | `profiles_update` policy, `profiles_guard` |

## 4.2 Articles and editorial workflow (FR-010 – FR-029)

| ID | Requirement | Pri | Evidence |
|---|---|---|---|
| FR-010 | Any active staff member shall be able to create a draft article with title, category, kicker, dek, body (rich text), cover image and caption, authors, tags, byline override, SEO title and description, and social image. | M | `ArticleEditorPage.tsx`, `articles` table |
| FR-011 | The section of an article shall always follow its category. | M | `app.article_before_write` |
| FR-012 | The system shall generate a unique URL slug from the title when none is given, and compute reading time at 220 words per minute. | M | `app.article_before_write` |
| FR-013 | The editor shall autosave changes 2.5 seconds after the last edit and keep the newest 50 revisions per article. | M | `AUTOSAVE_MS` in `ArticleEditorPage.tsx`; `app.prune_revisions` |
| FR-014 | The system shall enforce these status transitions: draft → submitted (owner or editor); submitted → in review, rejected (editor) or draft (owner or editor); in review → draft or rejected (editor); any of draft, submitted, in review → scheduled or published (publisher); scheduled → published or draft (publisher); published → archived or draft (publisher); archived → published or draft (publisher); rejected → draft or submitted (owner or editor). | M | `app.article_before_write`, `transition_article` |
| FR-015 | Owners who are not editors shall not edit an article while it is submitted, in review, scheduled, published or archived. | M | `app.article_before_write` ("locked while…") |
| FR-016 | Only publishers (SA, EE, ME, BM, or staff granted "Can publish") shall publish, schedule, reschedule or archive. | M | `app.can_publish_articles` |
| FR-017 | Only SA, EE and ME shall grant or remove another person's publishing access; changes shall be audited. | M | `set_publish_access`, `profiles_guard` |
| FR-018 | Scheduling shall require a future time; a scheduled article shall go live automatically when the time passes, without a background job. | M | `app.is_live`; trigger check "Pick a future time" |
| FR-019 | Every status change shall be logged with an optional note; staff shall be able to add notes without changing status. | M | `article_activity`, `transition_article`, `add_article_note` |
| FR-020 | Only editors of the article's section shall feature an article or change its editorial priority. | M | `app.article_before_write` |
| FR-021 | Categories marked not assignable shall be reserved for editors. | M | `categories.is_assignable`; trigger check |
| FR-022 | SA and EE shall delete any article; other staff shall delete only their own drafts. | M | `articles_delete` policy |
| FR-023 | Staff shall see their own articles, articles they co-author, and articles in sections they edit; publishers shall see all. | M | `articles` select policies |
| FR-024 | The article list shall filter by status, section, "mine" and "needs review", with pagination. | M | `ArticlesListPage.tsx`, `cms/articles/api.ts` |
| FR-025 | An article may be linked to a print issue and position. | S | `articles.issue_id`, `issue_position` |
| FR-026 | Readers shall see article view counts only through aggregated "most read" lists. | S | `most_read_articles` |

## 4.3 Public site and SEO (FR-030 – FR-039)

| ID | Requirement | Pri | Evidence |
|---|---|---|---|
| FR-030 | The home page shall show the lead story, latest ticker, most read, latest stories, literary folio, sports and views blocks, and a call to contribute. | M | `features/public/home/*`, `home_slots` |
| FR-031 | Each of the 12 sections shall have a landing page with its own layout and a paginated "all stories" view filterable by category. | M | `features/public/section/*`, `sectionLandings` |
| FR-032 | Article pages shall show sanitised body HTML, authors, tags, related stories, share buttons and approved comments. | M | `ArticleView.tsx`, `src/lib/sanitize.ts` |
| FR-033 | The system shall count at most one view per visitor, per article, per 30 minutes. | M | `record_article_view`; `docs/v2/STATS.md` |
| FR-034 | Readers shall search live articles by text, section and date range, and browse by tag. | M | `search_articles`, `SearchPage.tsx` |
| FR-035 | Readers shall browse archives by month and download published print issues. | M | `archive_months`, `ArchivesPage.tsx`, `archives` bucket |
| FR-036 | The site shall provide About, Editorial Board and Privacy pages. | M | `features/public/about/*` |
| FR-037 | Link previews on social media shall show the article's or section's title, description and image. | M | `middleware.ts`, `api/_lib/seo.ts` |
| FR-038 | The site shall publish `sitemap.xml`, `rss.xml` and `robots.txt`. | M | `api/sitemap.ts`, `api/rss.ts`, `api/robots.ts` |
| FR-039 | Old v1 addresses shall redirect to their v2 equivalents. | S | `redirects` in `router.tsx` |

## 4.4 Public intake: submissions, events, contact, comments (FR-040 – FR-049)

| ID | Requirement | Pri | Evidence |
|---|---|---|---|
| FR-040 | Readers shall submit a story with name, email, affiliation, section, title, summary, body and up to 5 attachments of up to 20 MB each (JPG, PNG, WebP, PDF, Word, text). | M | `SubmitArticlePage.tsx`, `api/_lib/forms.ts`, `submit_article` |
| FR-041 | Readers shall report an event with organisation, contact, title, date, venue, summary and attachments. | M | `SubmitEventPage.tsx`, `submit_event_report` |
| FR-042 | Readers shall send a contact message with a topic category. | M | `ContactPage.tsx`, `send_contact_message` |
| FR-043 | Readers shall comment on live articles that allow comments; comments shall stay hidden until an editor approves them; replies shall be allowed only to approved comments; commenter emails shall be visible to editors only. | M | `submit_comment`, `article_comments`, `article_comment_private` |
| FR-044 | Every public form shall pass a Cloudflare Turnstile check on the server before anything is saved. | M | `api/submit.ts` |
| FR-045 | Public forms shall be rate-limited per email: comments 5 per 10 minutes, submissions 3 per hour, event reports 3 per hour, contact 3 per 10 minutes; a hidden honeypot field shall silently drop bots. | M | `app.rate_limit` calls in `schema.sql` |
| FR-046 | Attachments shall upload only through one-time signed links issued after the CAPTCHA, and the submission shall be saved only with a valid signed ticket for the same content. | M | `api/submit.ts`, `makeTicket`/`readTicket` |
| FR-047 | Editors shall review submissions and event reports (submitted, reviewing, accepted, declined) with notes, open attachments, and convert one into a draft article. | M | `IntakePage.tsx`, `convert_intake_to_article` |
| FR-048 | Editors shall manage the contact inbox (unread, in progress, resolved, spam). | M | `ModerationTabs.tsx`, `contact_messages` |
| FR-049 | Editors shall moderate comments (pending, approved, rejected, spam) and the site may switch comments off globally. | M | `site_settings` key `comments`, `ModerationTabs.tsx` |

## 4.5 Media library (FR-050 – FR-059)

| ID | Requirement | Pri | Evidence |
|---|---|---|---|
| FR-050 | Staff shall upload images that are compressed in the browser to WebP and stored with sizes 320, 640, 960 and 1280 px. | M | `src/lib/images.ts`, `docs/v2/PERF.md` |
| FR-051 | Each asset shall have alt text, caption and credit. | M | `media_assets` |
| FR-052 | The library shall be searchable, filterable to "mine", and paginated. | M | `MediaLibraryPage.tsx`, `mediaApi.ts` |
| FR-053 | An asset in use (cover, social image, logo, issue, etc.) shall not be deletable; the library shall show where it is used. | M | `media_usage()`, foreign keys `on delete restrict` |
| FR-054 | Editors shall generate missing web sizes for older images ("Make web sizes"). | S | `cms/media/*` |
| FR-055 | Only publishers shall upload to the `archives` bucket (print-issue PDFs). | M | storage policy on `archives` |

## 4.6 Staff, contributors and editorial board (FR-060 – FR-069)

| ID | Requirement | Pri | Evidence |
|---|---|---|---|
| FR-060 | SA and EE shall invite staff by email with a role and, for section editors, sections. | M | `InvitesTab.tsx`, `staff_invites` |
| FR-061 | SA and EE shall change a member's role, active status and assigned sections; SA, EE and ME shall see the Accounts tab to manage publishing access. | M | `StaffTab.tsx`, `PeoplePage.tsx` |
| FR-062 | Editors shall manage contributor bylines (staff, student, guest, faculty, alumni); staff may edit their own byline. | M | `ContributorsTab.tsx`, `contributors` policies |
| FR-063 | Publishers (SA, EE, ME) shall manage editorial board terms and members shown on the public Editorial Board page. | M | `BoardTab.tsx`, `team_terms`, `team_members` |

## 4.7 Settings and dashboard (FR-070 – FR-079)

| ID | Requirement | Pri | Evidence |
|---|---|---|---|
| FR-070 | SA, EE and ME shall choose the home page lead story and literary folio pick (with pull quote). | M | `home_slots`, `HomeTab` |
| FR-071 | SA and EE shall manage sections (name, description, navigation placement and order, accepts submissions) and categories. | M | `sections`, `categories` |
| FR-072 | SA and EE shall manage desk contacts shown on the contact page. | M | `department_contacts` |
| FR-073 | SA and EE shall edit general settings (site details, social links, comments switch); SA, EE and ME shall edit the latest-news ticker. | M | `site_settings` policy |
| FR-074 | The dashboard shall show the counts the user may see: published, published this week, scheduled, drafts, in review, and article views this month versus last month (writers see their own drafts only). | M | `dashboard_stats()` |
| FR-075 | SA and EE shall read the audit log. | S | `audit_log` select policy |

## 4.8 Statistics (FR-080 – FR-089)

| ID | Requirement | Pri | Evidence |
|---|---|---|---|
| FR-080 | The public site shall record pageviews, reading time, scroll depth and share clicks without cookies, only on the production host and not for signed-in staff. | M | `features/public/analytics/*` |
| FR-081 | The ingest endpoint shall drop bots and other origins, never store IP addresses, and hash visitor ids with a daily salt deleted after two days. | M | `api/e.ts`, `stats.sql` |
| FR-082 | Do Not Track and Global Privacy Control shall limit tracking to an anonymous pageview. | M | `docs/v2/STATS.md` |
| FR-083 | SA, EE and ME shall view statistics by date range: summary with change versus the previous period, trend, top articles, authors, sections, sources, referrers, devices, browsers, share channels, and staff active time. | M | `StatisticsPage.tsx`, `stats_*` RPCs |
| FR-084 | Raw events shall be kept 13 months, staff activity 24 months, daily totals indefinitely. | M | `app.stats_nightly` |

## 4.9 Salingkusog (FR-100 – FR-139)

| ID | Requirement | Pri | Evidence |
|---|---|---|---|
| FR-100 | The team shall manage editions: year, title, dates, medal points (default 5/3/1), current and published flags, schedule PDF and venue map. | M | `sk_editions`, `EditionTab.tsx` |
| FR-101 | Only one edition shall be current at a time; readers shall see an edition only once it is published. | M | `sk_single_current`, `app.sk_edition_visible` |
| FR-102 | The team shall manage factions (name, short name, motto, colour, logo, order). | M | `sk_factions`, `FactionsTab.tsx` |
| FR-103 | The team shall manage venues with a description and map position. | M | `sk_venues`, `VenuesTab.tsx` |
| FR-104 | The team shall manage sports (category) and events (division, format, team or individual, result unit, venue). Formats: bracket, round robin, round robin + final, timed or measured, judged. | M | `sk_sports`, `sk_events`, `SportsTab.tsx` |
| FR-105 | The team shall manage athletes (name, program, photo) per faction. | M | `sk_athletes`, `AthletesTab.tsx` |
| FR-106 | Only SA, EE and ME shall add or remove Salingkusog team members; changes shall be audited. | M | `sk_team` policies, `sk_team_audit` |
| FR-107 | The team shall import the schedule from CSV (date, time, sport, event, round, side A, side B, venue) with validation and duplicate detection before saving. | M | `scheduleCsv.ts`, `ImportTab.tsx` |
| FR-108 | "Build schedule" shall create an event's games for single elimination (with bronze game and byes), round robin, or round robin + final, from factions in seed order, a first-game time and gaps between rounds and games. | M | `sk_build_schedule`, `BuildScheduleModal.tsx` |
| FR-109 | Build schedule shall refuse to rebuild an event with games played and shall warn when the last round falls after the edition ends. | M | `sk_build_schedule`; `BuildScheduleModal.tsx` |
| FR-110 | After each result, the system shall fill the next games automatically: winners and losers of knockout games, the next round-robin round once the previous one is finished, and the final from the round-robin standings. | M | `app.sk_resolve`, `app.sk_source_side`, trigger `sk_matches_advance` |
| FR-111 | A game that has started shall never change teams automatically; an edit that would change it shall be refused with a message. | M | `app.sk_resolve` |
| FR-112 | A knockout game shall not be finished as a tie. | M | `app.sk_knockout_needs_winner`; `Scorekeeper.tsx` |
| FR-113 | Round-robin standings shall rank by wins, point difference, head-to-head among tied teams, points scored, then seed. | M | `app.sk_rr_table`, `roundRobinTable()` |
| FR-114 | "Create contest" shall create one session with every chosen faction for timed or judged events, in faction order or a random draw. | M | `sk_create_contest`, `CreateContestModal.tsx` |
| FR-115 | The contest scorekeeper shall take each entry's result (time, distance or points; unit "s" means lowest wins) or, for judged events, the announced place; entries may be marked did not start, did not finish or disqualified; equal results share a place; finishing shall require every competing entry to have a result. | M | `ContestScorekeeper.tsx`, `src/lib/skContests.ts`, `sk_entries` |
| FR-116 | The scorekeeper shall update scores, periods, a live note, team statistics and athlete box scores, and move a game through not started, live, final, postponed and cancelled. | M | `Scorekeeper.tsx`, `BoxScore.tsx`, `statusActions()` |
| FR-117 | Score changes, results and contest entries shall reach open public pages in real time. | M | Realtime publication; `useLiveGames()` |
| FR-118 | The team shall enter results per event (places, faction, athlete, result, day awarded); medals follow the place (1 gold, 2 silver, 3 bronze). | M | `sk_set_placements`, `ResultsTab.tsx` |
| FR-119 | When an event's last game is final, the system shall suggest the podium from the games and staff shall confirm it before it counts. | M | `suggestedPodium()`, Results "Ready to confirm" |
| FR-120 | The medal table shall be computed: gold, silver, bronze, total, points and rank (by points, then gold, then silver). | M | `sk_medal_table` |
| FR-121 | The points race shall show cumulative points by day, or in 1, 3, 6 or 12-hour steps. | M | `sk_points_by_day`, `sk_points_timeline` |
| FR-122 | The tally shall show "results in: X of Y matches" and, once every match is final, read "Official and final medal tally" and name the champion and runners-up. | M | `resultsProgress()`, `finalHeadline()` |
| FR-123 | The team shall record awards (MVP of the day, athlete of the day, finals MVP) with stat lines and quotes, and download social cards as PNG (1080×1350 and 1080×1080). | M | `sk_awards`, `AwardsTab.tsx`, `socialCard.ts` |
| FR-124 | The public hub shall provide medal tally, schedule and results (day tabs, filters by sport, faction and venue), winners, factions and profiles, sport pages (bracket, standings or contest results), match recaps and a venue guide. | M | `features/public/salingkusog/*` |
| FR-125 | Upcoming generated games shall say where each side comes from ("Winner of Semifinal 1", "2nd in the standings"). | M | `pendingSide()` |
| FR-126 | SA, EE and ME shall control a public countdown page that works before the edition is published. | M | `sk_countdown()`, `CountdownCard.tsx`, `sk_countdown_guard` |
| FR-127 | The system shall compute head-to-head records, event completion and stat leaders. | S | `sk_head_to_head`, `sk_event_status`, `sk_event_leaders` |

\newpage

# 5. Non-functional requirements

| ID | Category | Requirement | Evidence / verification |
|---|---|---|---|
| NFR-01 | Performance | Public pages shall load routes lazily and split vendor code into chunks. | `router.tsx`, `vite.config.ts` |
| NFR-02 | Performance | Public, slow-changing reads by signed-out readers shall be served from an edge cache (60 s, stale-while-revalidate 300 s); live scores shall bypass it. | `api/r.ts`, `src/lib/edgeCache.ts` |
| NFR-03 | Performance | Images shall be served at the smallest suitable size (`srcset`, 320–1280 px) and lazy-loaded below the fold. | `Img.tsx`, `src/lib/media.ts` |
| NFR-04 | Performance | Long lists shall be paginated (12–24 items per page). | `docs/v2/PERF.md` |
| NFR-05 | Security | Every table shall have RLS enabled; no table shall be writable by anonymous users. | 97 policies; `public_access.test.sql` |
| NFR-06 | Security | Database helper functions shall live in the private `app` schema and use `set search_path = ''`. | `schema.sql` |
| NFR-07 | Security | Secret keys (service role, Turnstile secret) shall be used only in server functions. | `api/e.ts`, `api/submit.ts` |
| NFR-08 | Security | Article and recap HTML shall be sanitised; only YouTube, Vimeo, Facebook and Spotify iframes allowed. | `src/lib/sanitize.ts` |
| NFR-09 | Security | Responses shall carry HSTS, X-Frame-Options, nosniff, Referrer-Policy and Permissions-Policy headers, and a Content-Security-Policy (currently report-only). | `vercel.json` |
| NFR-10 | Privacy | No third-party trackers or cookies for statistics; IP addresses not stored; data retention limits enforced. | `stats.sql`, `/privacy` |
| NFR-11 | Privacy | Commenter and submitter emails shall be visible to editors only. | `article_comment_private`; intake policies |
| NFR-12 | Accessibility | Design-token colour pairs shall meet WCAG 2.1 AA contrast. | `scripts/check-contrast.mjs` |
| NFR-13 | Accessibility | Pages shall have one `h1`, ordered headings, named controls and alt text; motion shall respect reduced-motion settings. | `src/dev/domCheck.ts`; `useTween.ts` |
| NFR-14 | Usability | Every screen shall work at 375 px width without horizontal scrolling. | `/dev` sweep (53 screens) |
| NFR-15 | Usability | The scorekeeper shall be usable one-handed on a phone (large buttons, sticky actions). | `Scorekeeper.tsx` |
| NFR-16 | Reliability | SQL files shall be idempotent and safe to re-run in any order after the first deploy. | `scripts/db-test.mjs` applies them twice |
| NFR-17 | Reliability | Statistics failures shall never break the site; `/api/e` answers 501 when not configured. | `api/e.ts` |
| NFR-18 | Maintainability | TypeScript strict mode, ESLint, and `npm run check` (lint, typecheck, tests, build) shall pass before every merge. | `package.json`, `docs/v2/PROGRESS.md` |
| NFR-19 | Maintainability | Business rules shall live in the database so that the UI and direct API calls behave the same. | triggers and RLS |
| NFR-20 | Compatibility | The system shall support current Chrome, Edge, Firefox and Safari on desktop and mobile. | [TO CONFIRM browser test matrix] |
| NFR-21 | Time | All Salingkusog dates and times shall use Philippine time (UTC+8). | `src/lib/manila.ts`, `app.manila_today()` |

# 6. External interface requirements

| Interface | Description |
|---|---|
| User interface | Responsive web UI; brand tokens in `src/styles/tokens.css`; Montserrat and Cinzel fonts |
| Supabase REST (PostgREST) | Table reads/writes and RPCs with the user's JWT |
| Supabase Auth | Password sign-in, reset email, invitations |
| Supabase Storage | Buckets `media`, `archives`, `intake` |
| Supabase Realtime | Changes to `sk_matches`, `sk_placements`, `sk_entries` |
| Cloudflare Turnstile | Browser widget and server verification (`siteverify`) |
| Vercel | Functions under `/api`, routing middleware, CDN cache, Web Analytics |
| Crawlers | Open Graph HTML via `middleware.ts`; `sitemap.xml`, `rss.xml`, `robots.txt` |

Details of every endpoint and RPC: AMR-DOC-07.

# 7. Constraints and assumptions

- C1: Managed services only (Supabase, Vercel); no custom servers.
- C2: Database changes are delivered as re-runnable SQL pasted in the Supabase SQL editor (no migration tool).
- C3: English user interface.
- A1: Staff have internet access during work and during the games.
- A2: The Supabase "allow sign-ups" setting is disabled in production [TO CONFIRM].
- A3: Factions, sports and events for each edition are configured before the games start.

\newpage

# 8. User stories with acceptance criteria

| ID | Story | Acceptance criteria | Req. |
|---|---|---|---|
| US-01 | As a staff writer, I want to save my draft automatically so that I never lose work. | Given an open draft, when I stop typing for 2.5 s, then the change is saved and appears in the revision history. | FR-013 |
| US-02 | As a staff writer, I want to submit my article for review. | Given my draft, when I choose "Submit for review", then its status becomes submitted, I can no longer edit it, and the activity log shows the step. | FR-014, FR-015, FR-019 |
| US-03 | As a section editor, I want to return an article with a note. | Given a submitted article in my section, when I choose "Return to draft" with a note, then it becomes a draft and the writer sees the note. | FR-014, FR-019 |
| US-04 | As the Managing Editor, I want to schedule an article. | Given a reviewed article, when I pick a future time and schedule it, then it becomes public at that time without further action; a past time is refused. | FR-016, FR-018 |
| US-05 | As a staff writer without publishing access, I must not be able to publish. | When I try to publish (in the UI or by calling the API), then the database refuses with "You cannot move this article…". | FR-016 |
| US-06 | As the Managing Editor, I want to give a trusted writer publishing access. | When I switch on "Can publish and schedule articles" for them, then they can publish their own articles and the change is in the audit log. | FR-017, FR-007 |
| US-07 | As a reader, I want to search for an article. | When I enter words and optionally a section and dates, then live articles matching them are listed, newest first, paginated. | FR-034 |
| US-08 | As a reader, I want to submit a story with a photo. | Given I pass the security check, when I attach up to 5 files of ≤ 20 MB and send, then the editors receive the submission with the files; a 6th file or a wrong type is refused. | FR-040, FR-044, FR-046 |
| US-09 | As an editor, I want to approve a comment. | Given a pending comment, when I approve it, then it appears under the article; until then readers do not see it. | FR-043, FR-049 |
| US-10 | As an editor, I want to turn a good submission into a draft article. | When I choose "Convert to article" and a category, then a draft with the submission's content exists and the submission is marked converted. | FR-047 |
| US-11 | As a Salingkusog team member, I want to build a bracket once. | Given 4 factions in seed order, when I build a single elimination with a bronze game, then 2 semifinals, a final and a bronze game exist; seeds 1 v 4 and 2 v 3 meet first. | FR-108 |
| US-12 | As a scorekeeper, I want the final to fill itself in. | When I finish both semifinals, then the winners appear in the final and the losers in the bronze game. | FR-110 |
| US-13 | As a scorekeeper, I must not finish a knockout game tied. | When the score is level and I press Finish, then the system refuses and asks for the tiebreak. | FR-112 |
| US-14 | As a scorekeeper, I want to record a swimming race. | Given a contest with 4 entries, when I enter times, then places update (fastest first, ties shared); DNF entries get no place; Finish is refused while a time is missing. | FR-114, FR-115 |
| US-15 | As the Managing Editor, I want to confirm medals. | When an event's last game is final, then Results shows "Ready to confirm" with the suggested podium; nothing counts until I save. | FR-118, FR-119 |
| US-16 | As a reader, I want the medal tally to update live. | When a result is saved, then open tally pages update within seconds without reloading. | FR-117, FR-120 |
| US-17 | As a reader, I want to know whether the tally is final. | When every match is final, then the page reads "Official and final medal tally" and names the champion and runners-up. | FR-122 |
| US-18 | As the Executive Editor, I want readership numbers without tracking people. | When I open Statistics, then I see totals and trends; no cookies are set on readers and no IP address is stored. | FR-080 – FR-084 |
| US-19 | As the Super admin, I want to invite a new staff member. | When I add their email and role to Invites and they accept the email invitation, then they get an active profile with that role. | FR-003, FR-060 |
| US-20 | As a section editor, I want to see only what I am responsible for. | When I open Articles, then I see my own articles and those in my sections, but not other sections' drafts. | FR-023 |

# 9. Requirement-to-design index

| Requirement group | Design section (AMR-DOC-03) | Data (AMR-DOC-04) | Diagrams (AMR-DOC-05) |
|---|---|---|---|
| FR-001 – FR-008 | §5.1 Authentication and authorisation | `profiles`, `staff_invites`, `audit_log` | SEQ-1 login and role check |
| FR-010 – FR-026 | §5.2 Editorial workflow | `articles`, `article_*` | ACT-1, SEQ-2, STATE-1 |
| FR-030 – FR-039 | §5.3 Public site and SEO | `article_cards`, `sections` | DFD-1 |
| FR-040 – FR-049 | §5.4 Public intake gateway | intake tables, `article_comments` | SEQ-6 public form |
| FR-050 – FR-055 | §5.5 Media pipeline | `media_assets`, buckets | — |
| FR-060 – FR-075 | §5.6 Administration | people and settings tables | UC-1 … UC-3 |
| FR-080 – FR-084 | §5.7 Statistics | `stats_*` | DFD-1 |
| FR-100 – FR-127 | §5.8 Salingkusog engine | `sk_*` tables and views | ACT-2, SEQ-3 – SEQ-5, STATE-2 |
