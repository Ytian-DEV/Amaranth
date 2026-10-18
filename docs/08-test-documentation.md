---
title: "Test Documentation"
subtitle: "Amaranth v2 — test plan, strategy, cases, traceability and results"
version: "1.0"
date: "2026-10-19"
---

# Document control

| Field | Value |
|---|---|
| Title | Test Documentation (plan, cases, RTM, results) |
| Document ID | AMR-DOC-08 |
| Version | 1.0 |
| Date | 2026-10-19 |
| Author | Amaranth development team [TO CONFIRM: names] |
| Status | Final draft for defense |
| Basis | IEEE 829 / ISO 29119-3 structure; results from runs on 2026-10-19 |

# Contents

1. Test plan
2. Test strategy and levels
3. Test environment and tools
4. Entry and exit criteria
5. Sample test data
6. Results summary
7. Manual test cases (not yet run)
8. Defects found and fixed during development
9. Gaps and recommendations
- Appendix A — Automated test suites
- Appendix B — Requirements traceability matrix
- Appendix C — Unit and component test cases (255)
- Appendix D — Database test checks (278)

\newpage

# 1. Test plan

| Item | Plan |
|---|---|
| Objective | Show that Amaranth v2 meets the requirements in AMR-DOC-02, with emphasis on permissions, the editorial workflow and Salingkusog results |
| Scope | Front-end logic and components, server functions, database rules (RLS, triggers, RPCs, views), accessibility and responsive layout |
| Out of scope | Load testing; penetration testing by a third party; browser automation end-to-end (not yet set up) |
| Approach | Automated unit/component tests (Vitest), automated database tests (SQL harness), automated layout and accessibility checks (`/dev` sweep, contrast script), manual checks for the rest |
| Responsibilities | Developers write tests with each feature; the reviewer runs `npm run check` and `npm run db:test` before each merge (`docs/v2/PROGRESS.md`) |
| Schedule | Continuous during development (2026-10-17 → 2026-10-19); manual acceptance on the Vercel preview before merging to `main` [TO CONFIRM date] |
| Risks | No CI (tests depend on discipline); no browser end-to-end tests; live Supabase behaviour (Realtime, Auth emails) tested manually only |

# 2. Test strategy and levels

| Level | What is tested | Tool | Location |
|---|---|---|---|
| Unit | Pure helpers: formatting, slugs, permissions mirror, Salingkusog ranking, CSV parsing, contest ranking, sanitising, edge-cache routing, ticket signing | Vitest | `src/lib/*.test.ts`, `api/_lib/*.test.ts`, feature helpers |
| Component | React views rendered with Testing Library and fixtures: forms, comments, workflow panel, scorekeeper, results, build schedule, public hub | Vitest + Testing Library + jsdom | `src/features/**/*.test.tsx` |
| Database (integration) | RLS per role, workflow trigger, RPCs, views, Salingkusog advancement, contests, statistics privacy and retention | PostgreSQL 16+ via `scripts/db-test.mjs` | `supabase/tests/*.test.sql` |
| Static | Lint, strict type-check, production build | ESLint, TypeScript, Vite | `npm run check` |
| Accessibility and layout | One `h1`, heading order, named controls, alt text, no overflow at 375/768/1024/1440 px; colour contrast | `src/dev/domCheck.ts` sweep; `scripts/check-contrast.mjs`; Lighthouse | `/dev` fixture screens |
| Manual / acceptance | Flows that need live services (Auth emails, Realtime, Turnstile, Storage) and role walkthroughs | Checklist | §7 and `docs/v2/PR.md` |

**Database harness.** `npm run db:test` creates a temporary PostgreSQL cluster on `127.0.0.1`, loads `00_supabase_stub.sql` (stand-ins for Supabase's `auth`, `storage`, roles), applies `schema.sql`, `salingkusog.sql`, `stats.sql` and `seed.sql` **twice** (proving they are re-runnable), loads fixtures twice, runs each `*.test.sql` inside a transaction that is rolled back, and deletes the cluster. Helpers `tests.login(email)`, `tests.as_service()`, `tests.expect_ok`, `tests.expect_error`, `tests.expect_count`, `tests.expect_eq` (`01_helpers.sql`).

# 3. Test environment and tools

| Item | Value |
|---|---|
| Developer machine | Windows 11, Node.js ≥ 20.19, PostgreSQL 18 binaries for the SQL harness |
| Unit test runner | Vitest 5.0.5, jsdom 27, Testing Library |
| Browser for layout checks | Chromium-based browser pane, Lighthouse 12.2.1 (`docs/v2/PERF.md`) |
| Staging | Vercel preview deployment of `develop` (behind Vercel sign-in) |
| Data | Fixtures in `supabase/tests/02_fixtures.sql` and `src/dev/*Fixtures.ts` (anonymised) |

# 4. Entry and exit criteria

| | Criteria |
|---|---|
| Entry | Feature code complete on its branch; fixtures updated |
| Exit (per merge) | `npm run check` passes (0 lint errors, 0 type errors, all unit tests, build) and, for database changes, `npm run db:test` passes |
| Exit (release to `main`) | All automated tests pass; manual cases MT-01 – MT-20 executed on the preview with no open critical defects [TO CONFIRM] |

# 5. Sample test data

All test data is fictitious. Database fixtures (`02_fixtures.sql`) create one account per role with `@test.local` addresses:

| Fixture account | Role |
|---|---|
| `admin@test.local` | super_admin |
| `eic@test.local` | editor_in_chief |
| `pub.me@test.local` | managing_editor |
| `bm@test.local` | business_manager |
| `news.editor@test.local` | section_editor (News) |
| `writer@test.local`, `writer2@test.local` | staff_writer |
| `stranger@test.local` | signed up, not invited (no access) |

Plus five articles in different states (published, draft, submitted) across News and Sports, and an intake file. Salingkusog tests create their own editions with anonymised factions ("Tiamat", "Vanguard", "Dragons", "Moirai") and athletes ("Ana Swimmer", "Ben Swimmer").

Sample CSV for schedule import (FR-107):

```csv
date,time,sport,event,round,side_a,side_b,venue
2026-10-26,08:00,Basketball,Men,Semifinal 1,Faction A,Faction D,Main Gym
2026-10-26,9:30 AM,Basketball,Men,Semifinal 2,Faction B,Faction C,Main Gym
```

Sample `sk_set_placements` rows (FR-118):

```json
[{ "place": 1, "faction_id": "<faction A>", "result": "78–71", "awarded_on": "2026-10-27" },
 { "place": 2, "faction_id": "<faction B>" },
 { "place": 3, "faction_id": "<faction C>" }]
```

\newpage

# 6. Results summary

Runs executed on **2026-10-19** at commit `d7f6f34` (branch `develop`):

| Run | Result |
|---|---|
| `npm run test` (Vitest) | **255 / 255 passed** in 48 suites |
| `npm run db:test` | **278 / 278 checks passed** in 6 suites (public access 39, Salingkusog 71, brackets 28, contests 17, statistics 48, workflow 75) |
| `npm run lint`, `npm run typecheck`, `npm run build` | Passed (part of `npm run check`) |
| `npm run check:contrast` | All design-token text pairs pass WCAG AA |
| `/dev` layout and accessibility sweep | 53 screens, no issues at 375 px and 1024 px |
| `npm audit --omit=dev` | 0 vulnerabilities |
| Lighthouse (production, mobile, 2026-10-18) | Performance 67–72, Accessibility 100, Best practices 100, SEO 100 on `/`, `/news`, `/salingkusog` (`docs/v2/PERF.md`) |
| Manual cases MT-01 – MT-20 | **Not yet run** (scheduled for the preview acceptance) |

Requirement coverage (Appendix B): **115 requirements; 98 have automated tests, 17 rely on manual cases; none are uncovered.**

# 7. Manual test cases (not yet run)

Status for all: **Not yet run**. Execute on the Vercel preview with test accounts (AMR-DOC-20 demo script) and record pass/fail with date and tester.

| ID | Req. | Steps | Expected result |
|---|---|---|---|
| MT-01 | FR-025 | Edit an article; set print issue and position; save | Issue and position saved; article listed in the issue |
| MT-02 | FR-036 | Open `/about`, `/editorial-board`, `/privacy` | Pages load with current content; privacy sections for readers, forms, staff, rights |
| MT-03 | FR-044 | Submit the contact form normally; then send a request to `/api/submit` without a token | First succeeds; second answers 403 "Please complete the security check" |
| MT-04 | FR-052 | Media library: search by caption, toggle "mine", page through | Results filter correctly; pagination works |
| MT-05 | FR-062 | As an editor, add a contributor byline; as a writer, edit own byline only | Editor can add; writer can edit only their own |
| MT-06 | FR-070 | As ME, set the lead story and folio pick with pull quote | Home page shows them |
| MT-07 | FR-071 | As EE, add a category and move a section to "More" | Navigation updates; category selectable in the editor |
| MT-08 | FR-072 | As EE, add a desk contact | Contact page lists it |
| MT-09 | NFR-01 | Open DevTools Network; navigate between pages | Route chunks load on demand; vendor chunks cached |
| MT-10 | NFR-06 | In the SQL editor, inspect `app` functions; try calling one via REST | Functions in `app` with `search_path=''`; REST call not found |
| MT-11 | NFR-07 | Search the production JS bundle for "service_role" and the Turnstile secret | Not found |
| MT-12 | NFR-09 | `curl -I` the production home page | HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, CSP-Report-Only present |
| MT-13 | NFR-14 | Open key screens at 375 px width on a phone | No horizontal scroll; controls usable |
| MT-14 | NFR-15 | Keep score for a full game on a phone with one hand | Buttons reachable; actions bar sticky |
| MT-15 | NFR-17 | Unset `SUPABASE_SERVICE_ROLE_KEY` on a preview; browse | `/api/e` answers 501; site works normally |
| MT-16 | NFR-19 | Try a forbidden change (e.g. writer publishes) through the REST API directly | Refused by the database, same message as in the UI |
| MT-17 | NFR-20 | Run the public site and newsroom smoke test on Chrome, Edge, Firefox, Safari (desktop and mobile) | Works on all [TO CONFIRM matrix] |
| MT-18 | FR-117 | Open `/salingkusog` on two devices; record a score and confirm a medal | Both update within seconds without reload |
| MT-19 | FR-001 | Sign in with a valid and an invalid password; reset password by email | Valid opens newsroom; invalid shows a friendly error; reset email arrives and works |
| MT-20 | FR-122 | Finish all games of a test edition | Tally reads "Official and final medal tally" and names champion and runners-up |

\newpage

# 8. Defects found and fixed during development

Taken from `docs/v2/PROGRESS.md` and commit history (examples):

| Defect | Found by | Fix |
|---|---|---|
| Final shown in the same bracket column as the semifinals | User report (screenshot) | Column order inferred from round names (`bracketColumns`) |
| Out-of-range page number showed a raw database error | Security review | `pastLastPage` treats PostgREST 416 as an empty page |
| Anonymous users could reach `set_publish_access` | Live probe | Execute revoked from `anon` |
| Anonymous uploads to `intake` were unlimited | Security review | Signed upload links through `/api/submit` |
| Generated games' teams editable but overwritten | Pre-release review | Team fields locked in the game form |
| Build schedule could place games after the edition | Pre-release review | Warning and refusal in the modal |
| Production build failed on server imports without `.js` | Build check | `.js` extensions; regression test `esm-imports.test.ts` |

# 9. Gaps and recommendations

1. Add CI (GitHub Actions) to run `npm run check` and `npm run db:test` on every push.
2. Add browser end-to-end tests (for example Playwright) for login, publish, submit form, and live score.
3. Execute and record MT-01 – MT-20 before release to `main`.
4. Add load testing for event days (many readers on `/salingkusog`).

\newpage

# Appendix A. Automated test suites

Unit and component tests (Vitest): **255 cases in 48 suites**, run on 2026-10-19 — 255 passed, 0 failed.

| Suite | File | Cases | Passed | Requirements |
|---|---|---|---|---|
| TS-U-01 | `api/_lib/esm-imports.test.ts` | 1 | 1 | NFR-18 |
| TS-U-02 | `api/_lib/forms.test.ts` | 4 | 4 | FR-040, FR-046 |
| TS-U-03 | `api/_lib/seo.test.ts` | 5 | 5 | FR-037, FR-038 |
| TS-U-04 | `api/_lib/traffic.test.ts` | 9 | 9 | FR-080, FR-081 |
| TS-U-05 | `src/app/router.test.tsx` | 5 | 5 | FR-039 |
| TS-U-06 | `src/components/story/Story.test.tsx` | 3 | 3 | FR-030, NFR-13 |
| TS-U-07 | `src/components/ui/LogoLoader.test.tsx` | 1 | 1 | NFR-13 |
| TS-U-08 | `src/components/ui/Modal.test.tsx` | 3 | 3 | FR-050, NFR-13 |
| TS-U-09 | `src/components/ui/Tag.test.tsx` | 3 | 3 | FR-030 |
| TS-U-10 | `src/components/ui/pageWindow.test.ts` | 4 | 4 | FR-024, NFR-04 |
| TS-U-11 | `src/features/auth/authHelpers.test.ts` | 2 | 2 | FR-001, FR-002 |
| TS-U-12 | `src/features/auth/permissions.test.ts` | 12 | 12 | FR-005, FR-014, FR-016, FR-017, FR-106 |
| TS-U-13 | `src/features/cms/articles/editor/HistoryPanels.test.tsx` | 3 | 3 | FR-013, FR-019 |
| TS-U-14 | `src/features/cms/articles/editor/WorkflowPanel.test.tsx` | 3 | 3 | FR-014, FR-018 |
| TS-U-15 | `src/features/cms/dashboard/DashboardView.test.tsx` | 4 | 4 | FR-074 |
| TS-U-16 | `src/features/cms/intake/IntakeDetailView.test.tsx` | 3 | 3 | FR-047 |
| TS-U-17 | `src/features/cms/media/MediaDetails.test.tsx` | 2 | 2 | FR-051, FR-053 |
| TS-U-18 | `src/features/cms/media/uploadMedia.test.ts` | 3 | 3 | FR-050, FR-054 |
| TS-U-19 | `src/features/cms/salingkusog/TeamTab.test.tsx` | 4 | 4 | FR-106 |
| TS-U-20 | `src/features/cms/salingkusog/awards/socialCard.test.ts` | 4 | 4 | FR-123 |
| TS-U-21 | `src/features/cms/salingkusog/scheduleCsv.test.ts` | 12 | 12 | FR-107 |
| TS-U-22 | `src/features/cms/salingkusog/scores/contest.test.tsx` | 7 | 7 | FR-114, FR-115, FR-111 |
| TS-U-23 | `src/features/cms/salingkusog/scores/scores.test.tsx` | 7 | 7 | FR-116, FR-118, FR-119 |
| TS-U-24 | `src/features/cms/salingkusog/scoring.test.ts` | 8 | 8 | FR-116, FR-119, NFR-21 |
| TS-U-25 | `src/features/cms/salingkusog/setup/buildSchedule.test.tsx` | 4 | 4 | FR-108, FR-109 |
| TS-U-26 | `src/features/cms/salingkusog/setup/setup.test.tsx` | 4 | 4 | FR-102, FR-104, FR-107 |
| TS-U-27 | `src/features/cms/statistics/statistics.test.tsx` | 13 | 13 | FR-083 |
| TS-U-28 | `src/features/public/archives/archivesData.test.ts` | 3 | 3 | FR-035 |
| TS-U-29 | `src/features/public/article/Comments.test.tsx` | 4 | 4 | FR-043, FR-045 |
| TS-U-30 | `src/features/public/home/HomeView.test.tsx` | 3 | 3 | FR-030 |
| TS-U-31 | `src/features/public/intake/forms.test.tsx` | 3 | 3 | FR-040, FR-042 |
| TS-U-32 | `src/features/public/intake/validate.test.ts` | 2 | 2 | FR-040, FR-042 |
| TS-U-33 | `src/features/public/layout/Header.test.tsx` | 2 | 2 | FR-031 |
| TS-U-34 | `src/features/public/salingkusog/countdown.test.tsx` | 11 | 11 | FR-126 |
| TS-U-35 | `src/features/public/salingkusog/race.test.tsx` | 6 | 6 | FR-121, FR-122 |
| TS-U-36 | `src/features/public/salingkusog/salingkusog.test.tsx` | 22 | 22 | FR-120, FR-124, FR-117 |
| TS-U-37 | `src/features/public/section/SportsLanding.test.tsx` | 3 | 3 | FR-124, FR-031 |
| TS-U-38 | `src/features/public/section/landing/landing.test.tsx` | 26 | 26 | FR-031 |
| TS-U-39 | `src/lib/edgeCache.test.ts` | 7 | 7 | NFR-02 |
| TS-U-40 | `src/lib/format.test.ts` | 5 | 5 | FR-012, NFR-21 |
| TS-U-41 | `src/lib/images.test.ts` | 3 | 3 | FR-050 |
| TS-U-42 | `src/lib/media.test.ts` | 2 | 2 | NFR-03 |
| TS-U-43 | `src/lib/sanitize.test.ts` | 4 | 4 | FR-032, NFR-08 |
| TS-U-44 | `src/lib/skContests.test.ts` | 5 | 5 | FR-115, FR-119 |
| TS-U-45 | `src/lib/skSources.test.ts` | 5 | 5 | FR-125, FR-113, FR-108 |
| TS-U-46 | `src/lib/slug.test.ts` | 3 | 3 | FR-012 |
| TS-U-47 | `src/lib/useTween.test.ts` | 2 | 2 | NFR-13 |
| TS-U-48 | `src/styles/contrast.test.ts` | 1 | 1 | NFR-12 |

Database tests (`npm run db:test`): **278 checks in 6 suites**, run on 2026-10-19 — all passed (the runner stops at the first failure).

| Suite | File | Checks | Requirements |
|---|---|---|---|
| TS-D-01 | `supabase/tests/public_access.test.sql` | 39 | FR-023, FR-033, FR-034, FR-035, FR-041, FR-043, FR-045, FR-046, FR-048, FR-060, FR-063, FR-073, NFR-05, NFR-11, NFR-16 |
| TS-D-02 | `supabase/tests/salingkusog.test.sql` | 71 | FR-100, FR-101, FR-102, FR-103, FR-104, FR-105, FR-106, FR-118, FR-120, FR-121, FR-126, FR-127 |
| TS-D-03 | `supabase/tests/sk_brackets.test.sql` | 28 | FR-108, FR-109, FR-110, FR-111, FR-112, FR-113 |
| TS-D-04 | `supabase/tests/sk_contests.test.sql` | 17 | FR-114, FR-115 |
| TS-D-05 | `supabase/tests/stats.test.sql` | 48 | FR-026, FR-080, FR-081, FR-082, FR-083, FR-084, NFR-10 |
| TS-D-06 | `supabase/tests/workflow.test.sql` | 75 | FR-003, FR-005, FR-006, FR-007, FR-010, FR-011, FR-012, FR-014, FR-015, FR-016, FR-017, FR-018, FR-019, FR-020, FR-021, FR-022, FR-023, FR-047, FR-049, FR-053, FR-004, FR-008, FR-048, FR-055, FR-061, FR-075 |

\newpage

# Appendix B. Requirements traceability matrix (RTM)

Requirement → automated suites (Appendix A) → manual cases (§7). Design references: AMR-DOC-02 §9 and AMR-DOC-03 §5.

| Requirement | Summary | Automated suites | Manual case | Status |
|---|---|---|---|---|
| FR-001 | The system shall let staff sign in with email and password. | TS-U-11 | MT-19 | Automated — passing |
| FR-002 | The system shall let staff reset a forgotten password by email and set a new password from the … | TS-U-11 |  | Automated — passing |
| FR-003 | The system shall grant a role only to emails pre-authorised in `staff_invites`; any other new a… | TS-D-06 |  | Automated — passing |
| FR-004 | The system shall block inactive or uninvited users from the newsroom and show an "access pendin… | TS-D-06 |  | Automated — passing |
| FR-005 | Only SA and EE shall change roles and activation; only SA shall grant or remove the super_admin… | TS-U-12, TS-D-06 |  | Automated — passing |
| FR-006 | The system shall refuse to demote or deactivate the last active super admin. | TS-D-06 |  | Automated — passing |
| FR-007 | The system shall record role, activation and publishing-access changes in the audit log. | TS-D-06 |  | Automated — passing |
| FR-008 | The database shall let staff update their own display name, bio and avatar (but not role or acc… | TS-D-06 |  | Automated — passing |
| FR-010 | Any active staff member shall be able to create a draft article with title, category, kicker, d… | TS-D-06 |  | Automated — passing |
| FR-011 | The section of an article shall always follow its category. | TS-D-06 |  | Automated — passing |
| FR-012 | The system shall generate a unique URL slug from the title when none is given, and compute read… | TS-U-40, TS-U-46, TS-D-06 |  | Automated — passing |
| FR-013 | The editor shall autosave changes 2.5 seconds after the last edit and keep the newest 50 revisi… | TS-U-13 |  | Automated — passing |
| FR-014 | The system shall enforce these status transitions: draft → submitted (owner or editor); submitt… | TS-U-12, TS-U-14, TS-D-06 |  | Automated — passing |
| FR-015 | Owners who are not editors shall not edit an article while it is submitted, in review, schedule… | TS-D-06 |  | Automated — passing |
| FR-016 | Only publishers (SA, EE, ME, BM, or staff granted "Can publish") shall publish, schedule, resch… | TS-U-12, TS-D-06 |  | Automated — passing |
| FR-017 | Only SA, EE and ME shall grant or remove another person's publishing access; changes shall be a… | TS-U-12, TS-D-06 |  | Automated — passing |
| FR-018 | Scheduling shall require a future time; a scheduled article shall go live automatically when th… | TS-U-14, TS-D-06 |  | Automated — passing |
| FR-019 | Every status change shall be logged with an optional note; staff shall be able to add notes wit… | TS-U-13, TS-D-06 |  | Automated — passing |
| FR-020 | Only editors of the article's section shall feature an article or change its editorial priority… | TS-D-06 |  | Automated — passing |
| FR-021 | Categories marked not assignable shall be reserved for editors. | TS-D-06 |  | Automated — passing |
| FR-022 | SA and EE shall delete any article; other staff shall delete only their own drafts. | TS-D-06 |  | Automated — passing |
| FR-023 | Staff shall see their own articles, articles they co-author, and articles in sections they edit… | TS-D-01, TS-D-06 |  | Automated — passing |
| FR-024 | The article list shall filter by status, section, "mine" and "needs review", with pagination. | TS-U-10 |  | Automated — passing |
| FR-025 | An article may be linked to a print issue and position. |  | MT-01 | Manual — not yet run |
| FR-026 | Readers shall see article view counts only through aggregated "most read" lists. | TS-D-05 |  | Automated — passing |
| FR-030 | The home page shall show the lead story, latest ticker, most read, latest stories, literary fol… | TS-U-06, TS-U-09, TS-U-30 |  | Automated — passing |
| FR-031 | Each of the 12 sections shall have a landing page with its own layout and a paginated "all stor… | TS-U-33, TS-U-37, TS-U-38 |  | Automated — passing |
| FR-032 | Article pages shall show sanitised body HTML, authors, tags, related stories, share buttons and… | TS-U-43 |  | Automated — passing |
| FR-033 | The system shall count at most one view per visitor, per article, per 30 minutes. | TS-D-01 |  | Automated — passing |
| FR-034 | Readers shall search live articles by text, section and date range, and browse by tag. | TS-D-01 |  | Automated — passing |
| FR-035 | Readers shall browse archives by month and download published print issues. | TS-U-28, TS-D-01 |  | Automated — passing |
| FR-036 | The site shall provide About, Editorial Board and Privacy pages. |  | MT-02 | Manual — not yet run |
| FR-037 | Link previews on social media shall show the article's or section's title, description and imag… | TS-U-03 |  | Automated — passing |
| FR-038 | The site shall publish `sitemap.xml`, `rss.xml` and `robots.txt`. | TS-U-03 |  | Automated — passing |
| FR-039 | Old v1 addresses shall redirect to their v2 equivalents. | TS-U-05 |  | Automated — passing |
| FR-040 | Readers shall submit a story with name, email, affiliation, section, title, summary, body and u… | TS-U-02, TS-U-31, TS-U-32 |  | Automated — passing |
| FR-041 | Readers shall report an event with organisation, contact, title, date, venue, summary and attac… | TS-D-01 |  | Automated — passing |
| FR-042 | Readers shall send a contact message with a topic category. | TS-U-31, TS-U-32 |  | Automated — passing |
| FR-043 | Readers shall comment on live articles that allow comments; comments shall stay hidden until an… | TS-U-29, TS-D-01 |  | Automated — passing |
| FR-044 | Every public form shall pass a Cloudflare Turnstile check on the server before anything is save… |  | MT-03 | Manual — not yet run |
| FR-045 | Public forms shall be rate-limited per email: comments 5 per 10 minutes, submissions 3 per hour… | TS-U-29, TS-D-01 |  | Automated — passing |
| FR-046 | Attachments shall upload only through one-time signed links issued after the CAPTCHA, and the s… | TS-U-02, TS-D-01 |  | Automated — passing |
| FR-047 | Editors shall review submissions and event reports (submitted, reviewing, accepted, declined) w… | TS-U-16, TS-D-06 |  | Automated — passing |
| FR-048 | Editors shall manage the contact inbox (unread, in progress, resolved, spam). | TS-D-01, TS-D-06 |  | Automated — passing |
| FR-049 | Editors shall moderate comments (pending, approved, rejected, spam) and the site may switch com… | TS-D-06 |  | Automated — passing |
| FR-050 | Staff shall upload images that are compressed in the browser to WebP and stored with sizes 320,… | TS-U-08, TS-U-18, TS-U-41 |  | Automated — passing |
| FR-051 | Each asset shall have alt text, caption and credit. | TS-U-17 |  | Automated — passing |
| FR-052 | The library shall be searchable, filterable to "mine", and paginated. |  | MT-04 | Manual — not yet run |
| FR-053 | An asset in use (cover, social image, logo, issue, etc.) shall not be deletable; the library sh… | TS-U-17, TS-D-06 |  | Automated — passing |
| FR-054 | Editors shall generate missing web sizes for older images ("Make web sizes"). | TS-U-18 |  | Automated — passing |
| FR-055 | Only publishers shall upload to the `archives` bucket (print-issue PDFs). | TS-D-06 |  | Automated — passing |
| FR-060 | SA and EE shall invite staff by email with a role and, for section editors, sections. | TS-D-01 |  | Automated — passing |
| FR-061 | SA and EE shall change a member's role, active status and assigned sections; SA, EE and ME shal… | TS-D-06 |  | Automated — passing |
| FR-062 | Editors shall manage contributor bylines (staff, student, guest, faculty, alumni); staff may ed… |  | MT-05 | Manual — not yet run |
| FR-063 | Publishers (SA, EE, ME) shall manage editorial board terms and members shown on the public Edit… | TS-D-01 |  | Automated — passing |
| FR-070 | SA, EE and ME shall choose the home page lead story and literary folio pick (with pull quote). |  | MT-06 | Manual — not yet run |
| FR-071 | SA and EE shall manage sections (name, description, navigation placement and order, accepts sub… |  | MT-07 | Manual — not yet run |
| FR-072 | SA and EE shall manage desk contacts shown on the contact page. |  | MT-08 | Manual — not yet run |
| FR-073 | SA and EE shall edit general settings (site details, social links, comments switch); SA, EE and… | TS-D-01 |  | Automated — passing |
| FR-074 | The dashboard shall show the counts the user may see: published, published this week, scheduled… | TS-U-15 |  | Automated — passing |
| FR-075 | SA and EE shall read the audit log. | TS-D-06 |  | Automated — passing |
| FR-080 | The public site shall record pageviews, reading time, scroll depth and share clicks without coo… | TS-U-04, TS-D-05 |  | Automated — passing |
| FR-081 | The ingest endpoint shall drop bots and other origins, never store IP addresses, and hash visit… | TS-U-04, TS-D-05 |  | Automated — passing |
| FR-082 | Do Not Track and Global Privacy Control shall limit tracking to an anonymous pageview. | TS-D-05 |  | Automated — passing |
| FR-083 | SA, EE and ME shall view statistics by date range: summary with change versus the previous peri… | TS-U-27, TS-D-05 |  | Automated — passing |
| FR-084 | Raw events shall be kept 13 months, staff activity 24 months, daily totals indefinitely. | TS-D-05 |  | Automated — passing |
| FR-100 | The team shall manage editions: year, title, dates, medal points (default 5/3/1), current and p… | TS-D-02 |  | Automated — passing |
| FR-101 | Only one edition shall be current at a time; readers shall see an edition only once it is publi… | TS-D-02 |  | Automated — passing |
| FR-102 | The team shall manage factions (name, short name, motto, colour, logo, order). | TS-U-26, TS-D-02 |  | Automated — passing |
| FR-103 | The team shall manage venues with a description and map position. | TS-D-02 |  | Automated — passing |
| FR-104 | The team shall manage sports (category) and events (division, format, team or individual, resul… | TS-U-26, TS-D-02 |  | Automated — passing |
| FR-105 | The team shall manage athletes (name, program, photo) per faction. | TS-D-02 |  | Automated — passing |
| FR-106 | Only SA, EE and ME shall add or remove Salingkusog team members; changes shall be audited. | TS-U-12, TS-U-19, TS-D-02 |  | Automated — passing |
| FR-107 | The team shall import the schedule from CSV (date, time, sport, event, round, side A, side B, v… | TS-U-21, TS-U-26 |  | Automated — passing |
| FR-108 | "Build schedule" shall create an event's games for single elimination (with bronze game and bye… | TS-U-25, TS-U-45, TS-D-03 |  | Automated — passing |
| FR-109 | Build schedule shall refuse to rebuild an event with games played and shall warn when the last … | TS-U-25, TS-D-03 |  | Automated — passing |
| FR-110 | After each result, the system shall fill the next games automatically: winners and losers of kn… | TS-D-03 |  | Automated — passing |
| FR-111 | A game that has started shall never change teams automatically; an edit that would change it sh… | TS-U-22, TS-D-03 |  | Automated — passing |
| FR-112 | A knockout game shall not be finished as a tie. | TS-D-03 |  | Automated — passing |
| FR-113 | Round-robin standings shall rank by wins, point difference, head-to-head among tied teams, poin… | TS-U-45, TS-D-03 |  | Automated — passing |
| FR-114 | "Create contest" shall create one session with every chosen faction for timed or judged events,… | TS-U-22, TS-D-04 |  | Automated — passing |
| FR-115 | The contest scorekeeper shall take each entry's result (time, distance or points; unit "s" mean… | TS-U-22, TS-U-44, TS-D-04 |  | Automated — passing |
| FR-116 | The scorekeeper shall update scores, periods, a live note, team statistics and athlete box scor… | TS-U-23, TS-U-24 |  | Automated — passing |
| FR-117 | Score changes, results and contest entries shall reach open public pages in real time. | TS-U-36 | MT-18 | Automated — passing |
| FR-118 | The team shall enter results per event (places, faction, athlete, result, day awarded); medals … | TS-U-23, TS-D-02 |  | Automated — passing |
| FR-119 | When an event's last game is final, the system shall suggest the podium from the games and staf… | TS-U-23, TS-U-24, TS-U-44 |  | Automated — passing |
| FR-120 | The medal table shall be computed: gold, silver, bronze, total, points and rank (by points, the… | TS-U-36, TS-D-02 |  | Automated — passing |
| FR-121 | The points race shall show cumulative points by day, or in 1, 3, 6 or 12-hour steps. | TS-U-35, TS-D-02 |  | Automated — passing |
| FR-122 | The tally shall show "results in: X of Y matches" and, once every match is final, read "Officia… | TS-U-35 | MT-20 | Automated — passing |
| FR-123 | The team shall record awards (MVP of the day, athlete of the day, finals MVP) with stat lines a… | TS-U-20 |  | Automated — passing |
| FR-124 | The public hub shall provide medal tally, schedule and results (day tabs, filters by sport, fac… | TS-U-36, TS-U-37 |  | Automated — passing |
| FR-125 | Upcoming generated games shall say where each side comes from ("Winner of Semifinal 1", "2nd in… | TS-U-45 |  | Automated — passing |
| FR-126 | SA, EE and ME shall control a public countdown page that works before the edition is published. | TS-U-34, TS-D-02 |  | Automated — passing |
| FR-127 | The system shall compute head-to-head records, event completion and stat leaders. | TS-D-02 |  | Automated — passing |
| NFR-01 | Performance |  | MT-09 | Manual — not yet run |
| NFR-02 | Performance | TS-U-39 |  | Automated — passing |
| NFR-03 | Performance | TS-U-42 |  | Automated — passing |
| NFR-04 | Performance | TS-U-10 |  | Automated — passing |
| NFR-05 | Security | TS-D-01 |  | Automated — passing |
| NFR-06 | Security |  | MT-10 | Manual — not yet run |
| NFR-07 | Security |  | MT-11 | Manual — not yet run |
| NFR-08 | Security | TS-U-43 |  | Automated — passing |
| NFR-09 | Security |  | MT-12 | Manual — not yet run |
| NFR-10 | Privacy | TS-D-05 |  | Automated — passing |
| NFR-11 | Privacy | TS-D-01 |  | Automated — passing |
| NFR-12 | Accessibility | TS-U-48 |  | Automated — passing |
| NFR-13 | Accessibility | TS-U-06, TS-U-07, TS-U-08, TS-U-47 |  | Automated — passing |
| NFR-14 | Usability |  | MT-13 | Manual — not yet run |
| NFR-15 | Usability |  | MT-14 | Manual — not yet run |
| NFR-16 | Reliability | TS-D-01 |  | Automated — passing |
| NFR-17 | Reliability |  | MT-15 | Manual — not yet run |
| NFR-18 | Maintainability | TS-U-01 |  | Automated — passing |
| NFR-19 | Maintainability |  | MT-16 | Manual — not yet run |
| NFR-20 | Compatibility |  | MT-17 | Manual — not yet run |
| NFR-21 | Time | TS-U-24, TS-U-40 |  | Automated — passing |

Coverage: 115 requirements — 98 with automated tests, 17 with manual cases only, 0 not covered.

\newpage

# Appendix C. Unit and component test cases

| ID | Suite | Test (describe › it) | Result | ms |
|---|---|---|---|---|
| TC-U-001 | TS-U-01 | server code imports › uses .js extensions on every relative import | passed | 40 |
| TC-U-002 | TS-U-02 | form api › keeps only the form’s own fields | passed | 15 |
| TC-U-003 | TS-U-02 | form api › checks attachments like the form and the bucket do | passed | 3 |
| TC-U-004 | TS-U-02 | form api › names upload paths safely inside the folder | passed | 3 |
| TC-U-005 | TS-U-02 | form api › accepts its own ticket only for the same content, before it expires | passed | 13 |
| TC-U-006 | TS-U-03 | injectMeta › replaces title/description and adds Open Graph tags | passed | 11 |
| TC-U-007 | TS-U-03 | crawler detection › matches Facebook/Messenger and X but not browsers | passed | 2 |
| TC-U-008 | TS-U-03 | feeds › builds a sitemap with absolute URLs | passed | 1 |
| TC-U-009 | TS-U-03 | feeds › builds escaped RSS | passed | 2 |
| TC-U-010 | TS-U-03 | feeds › builds public storage URLs and skips site-relative paths | passed | 1 |
| TC-U-011 | TS-U-04 | bots › drops facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php) | passed | 46 |
| TC-U-012 | TS-U-04 | bots › drops Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html) | passed | 2 |
| TC-U-013 | TS-U-04 | bots › drops Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/126.0 Safari/537.36 | passed | 1 |
| TC-U-014 | TS-U-04 | bots › drops curl/8.4.0 | passed | 2 |
| TC-U-015 | TS-U-04 | bots › drops  | passed | 1 |
| TC-U-016 | TS-U-04 | bots › keeps real browsers | passed | 2 |
| TC-U-017 | TS-U-04 | classifyUa › reduces the user-agent to families | passed | 11 |
| TC-U-018 | TS-U-04 | traffic source › classifies referrers | passed | 8 |
| TC-U-019 | TS-U-04 | shapeEvents › keeps known events, drops the rest and never forwards a full referrer | passed | 8 |
| TC-U-020 | TS-U-05 | router › redirects old URL /features to /feature | passed | 879 |
| TC-U-021 | TS-U-05 | router › redirects old URL /blog to /blogs | passed | 101 |
| TC-U-022 | TS-U-05 | router › redirects old URL /s&t to /science-technology | passed | 100 |
| TC-U-023 | TS-U-05 | router › redirects old URL /home to / | passed | 627 |
| TC-U-024 | TS-U-05 | router › sends unknown deep paths to the public 404 | passed | 756 |
| TC-U-025 | TS-U-06 | story components › StoryCard links the headline to the article and shows meta | passed | 649 |
| TC-U-026 | TS-U-06 | story components › StoryRow pads the number | passed | 25 |
| TC-U-027 | TS-U-06 | story components › SectionHeader gives the see-all link an accessible name | passed | 146 |
| TC-U-028 | TS-U-07 | LogoLoader › announces loading and spins the Amaranth mark | passed | 635 |
| TC-U-029 | TS-U-08 | Modal › ignores a nested dialog closing (the media picker inside a form) | passed | 525 |
| TC-U-030 | TS-U-08 | Modal › still closes when its own dialog closes | passed | 75 |
| TC-U-031 | TS-U-08 | mediaProblem › accepts the types the media bucket stores and explains the rest | passed | 7 |
| TC-U-032 | TS-U-09 | CategoryPill › puts the specific category first, heavy, then the section | passed | 150 |
| TC-U-033 | TS-U-09 | CategoryPill › shows a single label on its own | passed | 32 |
| TC-U-034 | TS-U-09 | article byline chip › reads "via names \| Amaranth" | passed | 342 |
| TC-U-035 | TS-U-10 | pageWindow › shows everything for short lists | passed | 20 |
| TC-U-036 | TS-U-10 | pageWindow › collapses long ranges with gaps | passed | 2 |
| TC-U-037 | TS-U-10 | pageWindow › fills a single missing page instead of a gap | passed | 2 |
| TC-U-038 | TS-U-10 | parsePage › defaults to 1 for junk | passed | 4 |
| TC-U-039 | TS-U-11 | auth helpers › translates Supabase auth errors | passed | 6 |
| TC-U-040 | TS-U-11 | auth helpers › validates new passwords | passed | 1 |
| TC-U-041 | TS-U-12 | roles › ranks roles like the database | passed | 11 |
| TC-U-042 | TS-U-12 | roles › only super admins grant super admin | passed | 11 |
| TC-U-043 | TS-U-12 | Salingkusog › only super admin, Executive Editor and managing editor choose the team | passed | 2 |
| TC-U-044 | TS-U-12 | Salingkusog › team members of any role can enter data | passed | 1 |
| TC-U-045 | TS-U-12 | allowedTransitions › writer: draft → submitted only | passed | 3 |
| TC-U-046 | TS-U-12 | allowedTransitions › writer can withdraw a submission but not review it | passed | 2 |
| TC-U-047 | TS-U-12 | allowedTransitions › section editor reviews, returns and rejects but cannot publish | passed | 3 |
| TC-U-048 | TS-U-12 | allowedTransitions › publisher can publish, schedule, archive and unpublish | passed | 2 |
| TC-U-049 | TS-U-12 | allowedTransitions › locks content for owners once submitted | passed | 3 |
| TC-U-050 | TS-U-12 | publishing access › staff without access only save drafts and submit for review | passed | 2 |
| TC-U-051 | TS-U-12 | publishing access › the Business Manager and granted staff publish and schedule | passed | 3 |
| TC-U-052 | TS-U-12 | publishing access › only the three managing roles give access; the Business Manager does not | passed | 1 |
| TC-U-053 | TS-U-13 | ActivityPanel › describes workflow steps in plain words with notes | passed | 180 |
| TC-U-054 | TS-U-13 | ActivityPanel › adds a note | passed | 777 |
| TC-U-055 | TS-U-13 | RevisionsPanel › restores after confirmation | passed | 93 |
| TC-U-056 | TS-U-14 | WorkflowPanel › requires a note to reject | passed | 963 |
| TC-U-057 | TS-U-14 | WorkflowPanel › needs a time to schedule | passed | 311 |
| TC-U-058 | TS-U-14 | WorkflowPanel › explains when nothing is allowed | passed | 46 |
| TC-U-059 | TS-U-15 | DashboardView › greets by first name and shows the four stats | passed | 1267 |
| TC-U-060 | TS-U-15 | DashboardView › lists recent articles with edit links and the submission queue | passed | 1303 |
| TC-U-061 | TS-U-15 | DashboardView › hides editor-only blocks for writers | passed | 233 |
| TC-U-062 | TS-U-15 | DashboardView › greets by Manila time | passed | 4 |
| TC-U-063 | TS-U-16 | IntakeDetailView › converts to a draft in the chosen category | passed | 1055 |
| TC-U-064 | TS-U-16 | IntakeDetailView › declines with the internal note | passed | 528 |
| TC-U-065 | TS-U-16 | IntakeDetailView › links to the draft once converted | passed | 278 |
| TC-U-066 | TS-U-17 | MediaDetails › flags missing alt text and saves edits | passed | 1112 |
| TC-U-067 | TS-U-17 | MediaDetails › blocks deleting images that are in use | passed | 199 |
| TC-U-068 | TS-U-18 | missingWidths › lists the standard sizes smaller than the original that are missing | passed | 6 |
| TC-U-069 | TS-U-18 | missingWidths › matches by file name, so portrait variants (smaller actual width) count as present | passed | 1 |
| TC-U-070 | TS-U-18 | missingWidths › skips GIFs, documents and images with no known size | passed | 1 |
| TC-U-071 | TS-U-19 | buildTeam › splits members, always-allowed roles and people who can be added | passed | 104 |
| TC-U-072 | TS-U-19 | TeamView › lets managers add and remove members | passed | 1344 |
| TC-U-073 | TS-U-19 | TeamView › is read-only for team members | passed | 34 |
| TC-U-074 | TS-U-19 | Salingkusog nav item › shows for the managing roles and team members only | passed | 3 |
| TC-U-075 | TS-U-20 | social cards › MVP of the Day: portrait, stats and game footer | passed | 19 |
| TC-U-076 | TS-U-20 | social cards › Athlete of the Day: square, medal line and big result | passed | 2 |
| TC-U-077 | TS-U-20 | social cards › Finals MVP uses the portrait layout | passed | 1 |
| TC-U-078 | TS-U-20 | social cards › wraps long names and builds a file name | passed | 10 |
| TC-U-079 | TS-U-21 | parseCsv › handles quotes, commas inside quotes, CRLF and blank lines | passed | 16 |
| TC-U-080 | TS-U-21 | parseTime › 14:30 → 14:30 | passed | 2 |
| TC-U-081 | TS-U-21 | parseTime › 2:30 PM → 14:30 | passed | 1 |
| TC-U-082 | TS-U-21 | parseTime › 12 am → 00:00 | passed | 2 |
| TC-U-083 | TS-U-21 | parseTime › 7 → 07:00 | passed | 1 |
| TC-U-084 | TS-U-21 | parseTime › 25:00 → null | passed | 1 |
| TC-U-085 | TS-U-21 | parseTime › noon → null | passed | 1 |
| TC-U-086 | TS-U-21 | resolveSchedule › turns the template into matches in Philippine time | passed | 15 |
| TC-U-087 | TS-U-21 | resolveSchedule › accepts header aliases, a single-event sport and the event venue as default | passed | 10 |
| TC-U-088 | TS-U-21 | resolveSchedule › reports every problem on a line | passed | 3 |
| TC-U-089 | TS-U-21 | resolveSchedule › marks games already in the schedule or repeated in the file | passed | 5 |
| TC-U-090 | TS-U-21 | resolveSchedule › needs a header with date, time and sport | passed | 1 |
| TC-U-091 | TS-U-22 | contest scorekeeper › lists the line-up in order and places the results as they come in | passed | 1290 |
| TC-U-092 | TS-U-22 | contest scorekeeper › won’t finish while a result is missing | passed | 334 |
| TC-U-093 | TS-U-22 | contest scorekeeper › judged events take places, not results | passed | 185 |
| TC-U-094 | TS-U-22 | Create contest › is offered for timed and judged events | passed | 712 |
| TC-U-095 | TS-U-22 | game details form › locks the teams of a generated game | passed | 482 |
| TC-U-096 | TS-U-22 | game details form › has no sides for a contest | passed | 298 |
| TC-U-097 | TS-U-22 | game details form › sends timed and judged events to Create contest | passed | 455 |
| TC-U-098 | TS-U-23 | ScoresView › shows one day: live, then upcoming, then finished | passed | 1379 |
| TC-U-099 | TS-U-23 | ScorekeeperView › basketball gets +1/+2/+3 and the live actions | passed | 719 |
| TC-U-100 | TS-U-23 | ScorekeeperView › a final game is locked until reopened | passed | 445 |
| TC-U-101 | TS-U-23 | results › validates the form rows | passed | 3 |
| TC-U-102 | TS-U-23 | results › fills the podium from finished games and saves | passed | 502 |
| TC-U-103 | TS-U-23 | AwardsView groups awards by day | passed | 199 |
| TC-U-104 | TS-U-23 | stat lines round-trip | passed | 5 |
| TC-U-105 | TS-U-24 | Manila time › converts instants to the Philippine calendar day and back | passed | 13 |
| TC-U-106 | TS-U-24 | Manila time › lists edition days and picks today when inside | passed | 6 |
| TC-U-107 | TS-U-24 | orders a day: live first, then by time | passed | 2 |
| TC-U-108 | TS-U-24 | score steps and period labels follow the sport | passed | 3 |
| TC-U-109 | TS-U-24 | status actions | passed | 2 |
| TC-U-110 | TS-U-24 | podiumFromGames › final + bronze game | passed | 3 |
| TC-U-111 | TS-U-24 | podiumFromGames › no bronze game: both semifinal losers share third | passed | 2 |
| TC-U-112 | TS-U-24 | podiumFromGames › nothing finished: no suggestion | passed | 1 |
| TC-U-113 | TS-U-25 | Build schedule › is offered for team brackets and round robins only | passed | 1573 |
| TC-U-114 | TS-U-25 | Build schedule › is offered for individual events too (chess, arnis, taekwondo) | passed | 385 |
| TC-U-115 | TS-U-25 | Build schedule › orders the seeds and says how many games it creates | passed | 1279 |
| TC-U-116 | TS-U-25 | Build schedule › won’t rebuild once games are played | passed | 281 |
| TC-U-117 | TS-U-26 | FactionsView › lists factions with short names and edit/delete per row | passed | 1142 |
| TC-U-118 | TS-U-26 | SportsView › groups events under their sport | passed | 726 |
| TC-U-119 | TS-U-26 | ImportView › previews pasted rows and imports only the ready ones | passed | 192 |
| TC-U-120 | TS-U-26 | parseCsv drops a byte-order mark | passed | 4 |
| TC-U-121 | TS-U-27 | statsFormat › formats active time as H:MM:SS without capping hours | passed | 8 |
| TC-U-122 | TS-U-27 | statsFormat › formats read time as M:SS | passed | 2 |
| TC-U-123 | TS-U-27 | statsFormat › compares with the previous period | passed | 5 |
| TC-U-124 | TS-U-27 | statsFormat › reads the range from the URL, falling back to the last 30 days | passed | 6 |
| TC-U-125 | TS-U-27 | who can see statistics › is only Super admin, Executive Editor and Managing editor | passed | 1 |
| TC-U-126 | TS-U-27 | tracker helpers › tracks only on the production host | passed | 2 |
| TC-U-127 | TS-U-27 | tracker helpers › respects Do Not Track and Global Privacy Control | passed | 1 |
| TC-U-128 | TS-U-27 | tracker helpers › starts a new session after 30 minutes away | passed | 2 |
| TC-U-129 | TS-U-27 | tracker helpers › measures scroll depth through the article body | passed | 3 |
| TC-U-130 | TS-U-27 | staff heartbeat › beats only for a visible, recently used tab | passed | 2 |
| TC-U-131 | TS-U-27 | StatisticsView › shows the summary, top articles, shares and staff time | passed | 1221 |
| TC-U-132 | TS-U-27 | StatisticsView › explains an empty range | passed | 177 |
| TC-U-133 | TS-U-27 | StatisticsView › renders while loading | passed | 368 |
| TC-U-134 | TS-U-28 | archive months › builds Manila-time ranges | passed | 10 |
| TC-U-135 | TS-U-28 | archive months › rejects junk | passed | 1 |
| TC-U-136 | TS-U-28 | archive months › labels months | passed | 61 |
| TC-U-137 | TS-U-29 | Comments › threads replies under their parent | passed | 818 |
| TC-U-138 | TS-U-29 | Comments › submits and shows the moderation notice | passed | 1128 |
| TC-U-139 | TS-U-29 | Comments › shows RPC errors such as rate limits | passed | 621 |
| TC-U-140 | TS-U-29 | Comments › hides the form when comments are closed | passed | 19 |
| TC-U-141 | TS-U-30 | HomeView › renders the lead story as the page h1 and every Figma block | passed | 1642 |
| TC-U-142 | TS-U-30 | HomeView › shows the ticker with links | passed | 789 |
| TC-U-143 | TS-U-30 | HomeView › has an empty state before anything is published | passed | 22 |
| TC-U-144 | TS-U-31 | SubmitArticleForm › requires a body or attachment and consent | passed | 1954 |
| TC-U-145 | TS-U-31 | SubmitArticleForm › sends a complete submission | passed | 1151 |
| TC-U-146 | TS-U-31 | ContactForm › validates email and shows server errors | passed | 1163 |
| TC-U-147 | TS-U-32 | validate › checks required, email and length | passed | 10 |
| TC-U-148 | TS-U-32 | validate › passes valid input | passed | 3 |
| TC-U-149 | TS-U-33 | More menu › shows each section with its pitch and latest story, plus the Also links | passed | 1537 |
| TC-U-150 | TS-U-33 | More menu › opens from the header and closes with Escape, returning focus | passed | 1160 |
| TC-U-151 | TS-U-34 | countdown maths (Asia/Manila target, same for everyone) › splits the time left and stops at zero | passed | 27 |
| TC-U-152 | TS-U-34 | countdown maths (Asia/Manila target, same for everyone) › says it in words for screen readers | passed | 5 |
| TC-U-153 | TS-U-34 | CountdownView › shows days, hours, minutes, seconds and an accessible timer | passed | 938 |
| TC-U-154 | TS-U-34 | CountdownView › switches to "The games have begun" at zero | passed | 266 |
| TC-U-155 | TS-U-34 | Continue launch › plays the launch, then opens the hub | passed | 654 |
| TC-U-156 | TS-U-34 | Continue launch › a click on the launch skips straight to the hub | passed | 480 |
| TC-U-157 | TS-U-34 | Continue launch › ctrl/cmd-click opens normally (no animation) | passed | 254 |
| TC-U-158 | TS-U-34 | CountdownPage › switched off: sends visitors to the Salingkusog hub | passed | 59 |
| TC-U-159 | TS-U-34 | CountdownPage › switched on: shows the countdown | passed | 170 |
| TC-U-160 | TS-U-34 | newsroom setting › only the managing roles see "Show Countdown Page" | passed | 97 |
| TC-U-161 | TS-U-34 | newsroom setting › team members do not | passed | 30 |
| TC-U-162 | TS-U-35 | points race steps › labels step ends in Manila time | passed | 13 |
| TC-U-163 | TS-U-35 | points race steps › turns hour-step rows into ordered steps per faction | passed | 5 |
| TC-U-164 | TS-U-35 | points race steps › offers 1h, 3h, 6h, 12h and Day, and reports the choice | passed | 1353 |
| TC-U-165 | TS-U-35 | official tally › counts finished matches, leaving cancelled ones out | passed | 3 |
| TC-U-166 | TS-U-35 | official tally › declares the champions once every match is final | passed | 427 |
| TC-U-167 | TS-U-35 | official tally › shows results in while matches are left | passed | 464 |
| TC-U-168 | TS-U-36 | hub helpers › knows where the edition stands | passed | 9 |
| TC-U-169 | TS-U-36 | hub helpers › writes the podium headline | passed | 2 |
| TC-U-170 | TS-U-36 | hub helpers › live games first, then the next ones | passed | 1 |
| TC-U-171 | TS-U-36 | hub helpers › points race stops at the current day | passed | 2 |
| TC-U-172 | TS-U-36 | hub helpers › picks readable text on faction colours | passed | 2 |
| TC-U-173 | TS-U-36 | hub helpers › formats times in Philippine time | passed | 4 |
| TC-U-174 | TS-U-36 | Medal Tally › header shows the edition, live count and day | passed | 768 |
| TC-U-175 | TS-U-36 | Medal Tally › podium, table and live games | passed | 693 |
| TC-U-176 | TS-U-36 | Schedule & Results › opens on today during the games, else the first or last day | passed | 3 |
| TC-U-177 | TS-U-36 | Schedule & Results › groups a day into live, later, completed and postponed | passed | 9 |
| TC-U-178 | TS-U-36 | Schedule & Results › day tabs, filters and the PDF button | passed | 842 |
| TC-U-179 | TS-U-36 | Winners per game › builds one card per event with results, newest first | passed | 4 |
| TC-U-180 | TS-U-36 | Winners per game › filters by category and links the recap | passed | 192 |
| TC-U-181 | TS-U-36 | Faction profile › computes recent results, head-to-head, medals and top athletes | passed | 4 |
| TC-U-182 | TS-U-36 | Faction profile › renders the hero, switcher and panels | passed | 686 |
| TC-U-183 | TS-U-36 | Sports and bracket › splits knockout games into columns and keeps the bronze game apart | passed | 11 |
| TC-U-184 | TS-U-36 | Sports and bracket › round-robin table and leaders | passed | 3 |
| TC-U-185 | TS-U-36 | Sports and bracket › renders the bracket, champion, division toggle and top scorers | passed | 884 |
| TC-U-186 | TS-U-36 | Match recap › helpers: record, title, stat bars | passed | 2 |
| TC-U-187 | TS-U-36 | Match recap › renders the scoreboard, periods, MVP, team and player stats, and the article | passed | 974 |
| TC-U-188 | TS-U-36 | Venue guide › says what is on at each venue | passed | 3 |
| TC-U-189 | TS-U-36 | Venue guide › pins venues with a map position and links them to the list | passed | 214 |
| TC-U-190 | TS-U-37 | results strip helpers | passed | 8 |
| TC-U-191 | TS-U-37 | SportsLanding › shows results, the Salingkusog block, latest stories and the spotlight | passed | 2147 |
| TC-U-192 | TS-U-37 | SportsLanding › works without a Salingkusog edition | passed | 370 |
| TC-U-193 | TS-U-38 | landing helpers › hands out each story once | passed | 13 |
| TC-U-194 | TS-U-38 | landing helpers › formats brief times in Manila | passed | 4 |
| TC-U-195 | TS-U-38 | literary folio cover › shows the featured work’s photo in the green cover, or the drawn art without one | passed | 249 |
| TC-U-196 | TS-U-38 | bulletin calendar › lays out the month with today and posting days marked | passed | 876 |
| TC-U-197 | TS-U-38 | news landing › renders every story once, linked to the article, with one h1 | passed | 2047 |
| TC-U-198 | TS-U-38 | news landing › shows an empty state with no stories | passed | 39 |
| TC-U-199 | TS-U-38 | feature landing › renders every story once, linked to the article, with one h1 | passed | 881 |
| TC-U-200 | TS-U-38 | feature landing › shows an empty state with no stories | passed | 18 |
| TC-U-201 | TS-U-38 | literary landing › renders every story once, linked to the article, with one h1 | passed | 763 |
| TC-U-202 | TS-U-38 | literary landing › shows an empty state with no stories | passed | 50 |
| TC-U-203 | TS-U-38 | blogs landing › renders every story once, linked to the article, with one h1 | passed | 779 |
| TC-U-204 | TS-U-38 | blogs landing › shows an empty state with no stories | passed | 13 |
| TC-U-205 | TS-U-38 | specials landing › renders every story once, linked to the article, with one h1 | passed | 697 |
| TC-U-206 | TS-U-38 | specials landing › shows an empty state with no stories | passed | 21 |
| TC-U-207 | TS-U-38 | views landing › renders every story once, linked to the article, with one h1 | passed | 853 |
| TC-U-208 | TS-U-38 | views landing › shows an empty state with no stories | passed | 7 |
| TC-U-209 | TS-U-38 | science-technology landing › renders every story once, linked to the article, with one h1 | passed | 840 |
| TC-U-210 | TS-U-38 | science-technology landing › shows an empty state with no stories | passed | 32 |
| TC-U-211 | TS-U-38 | investigative landing › renders every story once, linked to the article, with one h1 | passed | 610 |
| TC-U-212 | TS-U-38 | investigative landing › shows an empty state with no stories | passed | 21 |
| TC-U-213 | TS-U-38 | explainer landing › renders every story once, linked to the article, with one h1 | passed | 860 |
| TC-U-214 | TS-U-38 | explainer landing › shows an empty state with no stories | passed | 61 |
| TC-U-215 | TS-U-38 | bulletin landing › renders every story once, linked to the article, with one h1 | passed | 885 |
| TC-U-216 | TS-U-38 | bulletin landing › shows an empty state with no stories | passed | 11 |
| TC-U-217 | TS-U-38 | stories landing › renders every story once, linked to the article, with one h1 | passed | 908 |
| TC-U-218 | TS-U-38 | stories landing › shows an empty state with no stories | passed | 15 |
| TC-U-219 | TS-U-39 | edgeUrl › routes anonymous public reads through /api/r | passed | 48 |
| TC-U-220 | TS-U-39 | edgeUrl › keeps everything else direct | passed | 3 |
| TC-U-221 | TS-U-39 | edgeUrl › uses the same list as the server | passed | 3 |
| TC-U-222 | TS-U-39 | edgeCachedFetch › falls back to Supabase when the proxy is missing | passed | 10 |
| TC-U-223 | TS-U-39 | api/r › forwards whitelisted reads with the anon key and caches successes for a minute | passed | 28 |
| TC-U-224 | TS-U-39 | api/r › refuses other tables and never caches errors | passed | 15 |
| TC-U-225 | TS-U-39 | liveCutoff › rounds down to the minute so readers share cache entries | passed | 2 |
| TC-U-226 | TS-U-40 | format › formats dates in Manila time | passed | 9 |
| TC-U-227 | TS-U-40 | format › formats reading time with a minimum of one minute | passed | 2 |
| TC-U-228 | TS-U-40 | format › formats relative time | passed | 4 |
| TC-U-229 | TS-U-40 | format › formats compact numbers | passed | 12 |
| TC-U-230 | TS-U-40 | format › joins meta parts | passed | 1 |
| TC-U-231 | TS-U-41 | images › fits within a max dimension keeping the ratio | passed | 9 |
| TC-U-232 | TS-U-41 | images › makes storage-safe file names | passed | 8 |
| TC-U-233 | TS-U-41 | images › formats sizes | passed | 1 |
| TC-U-234 | TS-U-42 | media › builds public storage URLs | passed | 6 |
| TC-U-235 | TS-U-42 | media › builds srcset from variants plus the original | passed | 2 |
| TC-U-236 | TS-U-43 | sanitizeArticleHtml › removes scripts, handlers and inline styles | passed | 125 |
| TC-U-237 | TS-U-43 | sanitizeArticleHtml › keeps known embeds and drops unknown iframes | passed | 47 |
| TC-U-238 | TS-U-43 | sanitizeArticleHtml › opens external links in a new tab safely | passed | 44 |
| TC-U-239 | TS-U-43 | sanitizeArticleHtml › blocks javascript: URLs | passed | 15 |
| TC-U-240 | TS-U-44 | contest results › reads and writes times, distances and points | passed | 29 |
| TC-U-241 | TS-U-44 | contest results › times: fastest first, ties share a place, DNF last | passed | 7 |
| TC-U-242 | TS-U-44 | contest results › distances: longest first | passed | 1 |
| TC-U-243 | TS-U-44 | contest results › judged: the places staff enter, shared places allowed | passed | 2 |
| TC-U-244 | TS-U-44 | contest results › suggests medals once every entry has a result | passed | 3 |
| TC-U-245 | TS-U-45 | generated games › says where a side comes from | passed | 13 |
| TC-U-246 | TS-U-45 | generated games › puts a final saved with the semifinals’ round order in its own column | passed | 6 |
| TC-U-247 | TS-U-45 | generated games › counts the games a build creates | passed | 2 |
| TC-U-248 | TS-U-45 | round-robin standings and medals › breaks a tie on wins and difference by the head-to-head game | passed | 3 |
| TC-U-249 | TS-U-45 | round-robin standings and medals › suggests medals only when every game is final | passed | 3 |
| TC-U-250 | TS-U-46 | slugify › matches the database rules | passed | 9 |
| TC-U-251 | TS-U-46 | autoExcerpt › cuts at a word boundary | passed | 2 |
| TC-U-252 | TS-U-46 | autoExcerpt › keeps short text | passed | 1 |
| TC-U-253 | TS-U-47 | useTweenedNumbers › counts up from 0 to the data, then moves to new values | passed | 133 |
| TC-U-254 | TS-U-47 | useTweenedNumbers › shows the data at once when the reader prefers reduced motion | passed | 11 |
| TC-U-255 | TS-U-48 | design tokens › meet WCAG AA for every text pair | passed | 32 |

\newpage

# Appendix D. Database test checks

Kinds: **ok** = the statement must succeed; **error** = it must be refused; **count** = an exact row count (often 0 to prove a row is hidden); **eq** = an exact value.

| ID | Suite | Check | Kind | Result |
|---|---|---|---|---|
| TC-D-001 | TS-D-01 | anon sees only live articles | count | passed |
| TC-D-002 | TS-D-01 | anon card view shows live articles | count | passed |
| TC-D-003 | TS-D-01 | card byline from authors | eq | passed |
| TC-D-004 | TS-D-01 | anon reads sections | count | passed |
| TC-D-005 | TS-D-01 | anon reads authors of live article only | count | passed |
| TC-D-006 | TS-D-01 | anon cannot read submissions | count | passed |
| TC-D-007 | TS-D-01 | anon cannot read contact inbox | count | passed |
| TC-D-008 | TS-D-01 | anon cannot read profiles | count | passed |
| TC-D-009 | TS-D-01 | anon cannot read staff invites | count | passed |
| TC-D-010 | TS-D-01 | anon cannot read private site settings | count | passed |
| TC-D-011 | TS-D-01 | anon cannot insert articles | error | passed |
| TC-D-012 | TS-D-01 | anon cannot insert submissions directly | error | passed |
| TC-D-013 | TS-D-01 | anon cannot call staff RPC | error | passed |
| TC-D-014 | TS-D-01 | view counted on live article | eq | passed |
| TC-D-015 | TS-D-01 | most read lists live article | count | passed |
| TC-D-016 | TS-D-01 | search finds live article | count | passed |
| TC-D-017 | TS-D-01 | search hides drafts | count | passed |
| TC-D-018 | TS-D-01 | archive months lists live months only | count | passed |
| TC-D-019 | TS-D-01 | board seed: one current term with 18 members | count | passed |
| TC-D-020 | TS-D-01 | anon cannot call the comment form directly | error | passed |
| TC-D-021 | TS-D-01 | anon cannot call the contact form directly | error | passed |
| TC-D-022 | TS-D-01 | anon cannot upload to intake (signed links only) | error | passed |
| TC-D-023 | TS-D-01 | form api can comment | ok | passed |
| TC-D-024 | TS-D-01 | pending comment is hidden | count | passed |
| TC-D-025 | TS-D-01 | commenter email is private | count | passed |
| TC-D-026 | TS-D-01 | cannot comment on a draft | error | passed |
| TC-D-027 | TS-D-01 | bad email rejected | error | passed |
| TC-D-028 | TS-D-01 | form api can submit an article | ok | passed |
| TC-D-029 | TS-D-01 | submission file must exist | error | passed |
| TC-D-030 | TS-D-01 | form api can send event report | ok | passed |
| TC-D-031 | TS-D-01 | form api can send contact message | ok | passed |
| TC-D-032 | TS-D-01 | rate limit allows 3 | ok | passed |
| TC-D-033 | TS-D-01 | rate limit allows 3 (3rd) | ok | passed |
| TC-D-034 | TS-D-01 | rate limit blocks the 4th | error | passed |
| TC-D-035 | TS-D-01 | honeypot silently accepted | ok | passed |
| TC-D-036 | TS-D-01 | anon cannot upload to media | error | passed |
| TC-D-037 | TS-D-01 | anon cannot list intake files | count | passed |
| TC-D-038 | TS-D-01 | honeypot stored nothing | count | passed |
| TC-D-039 | TS-D-01 | submission file attached | count | passed |
| TC-D-040 | TS-D-02 | readers cannot see an unpublished edition | count | passed |
| TC-D-041 | TS-D-02 | readers cannot see its factions | count | passed |
| TC-D-042 | TS-D-02 | readers cannot write | error | passed |
| TC-D-043 | TS-D-02 | staff can preview an unpublished edition | count | passed |
| TC-D-044 | TS-D-02 | staff outside the team cannot enter data | error | passed |
| TC-D-045 | TS-D-02 | staff outside the team cannot add themselves | error | passed |
| TC-D-046 | TS-D-02 | section editor cannot pick the team | error | passed |
| TC-D-047 | TS-D-02 | managing editor adds a writer to the team | ok | passed |
| TC-D-048 | TS-D-02 | managing editor can enter data too | ok | passed |
| TC-D-049 | TS-D-02 | executive editor (editor_in_chief) adds a member | ok | passed |
| TC-D-050 | TS-D-02 | executive editor removes a member | ok | passed |
| TC-D-051 | TS-D-02 | super admin manages the team | ok | passed |
| TC-D-052 | TS-D-02 | team changes are audited | count | passed |
| TC-D-053 | TS-D-02 | team members cannot remove others from the team | count | passed |
| TC-D-054 | TS-D-02 | team member adds a sport | ok | passed |
| TC-D-055 | TS-D-02 | team member adds a venue | ok | passed |
| TC-D-056 | TS-D-02 | team member adds events (edition filled in from the sport) | ok | passed |
| TC-D-057 | TS-D-02 | event inherited its edition | eq | passed |
| TC-D-058 | TS-D-02 | team member schedules a semifinal and the final | ok | passed |
| TC-D-059 | TS-D-02 | a faction cannot play itself | error | passed |
| TC-D-060 | TS-D-02 | scorekeeper starts the game | ok | passed |
| TC-D-061 | TS-D-02 | start time recorded when it went live | count | passed |
| TC-D-062 | TS-D-02 | a final needs both scores | error | passed |
| TC-D-063 | TS-D-02 | scorekeeper finishes both games | ok | passed |
| TC-D-064 | TS-D-02 | winner computed from the score | eq | passed |
| TC-D-065 | TS-D-02 | finish clears the live note and records the end | count | passed |
| TC-D-066 | TS-D-02 | athletes and box scores | ok | passed |
| TC-D-067 | TS-D-02 | results and medals | ok | passed |
| TC-D-068 | TS-D-02 | a gold must be first place | error | passed |
| TC-D-069 | TS-D-02 | award: athlete of the day | ok | passed |
| TC-D-070 | TS-D-02 | medal table: Tiamat 1 gold + 1 silver = 8 pts, rank 1 | eq | passed |
| TC-D-071 | TS-D-02 | medal table: Dragons 6 pts, rank 2 | eq | passed |
| TC-D-072 | TS-D-02 | medal table: Vanguard 3 pts, rank 3 | eq | passed |
| TC-D-073 | TS-D-02 | points race is cumulative by day (Tiamat: 0,3,8,8,8,8) | eq | passed |
| TC-D-074 | TS-D-02 | points race has 6 days for each of 3 factions | count | passed |
| TC-D-075 | TS-D-02 | timeline 1 h: latest day with results, 24 steps, Tiamat 3 → 8 | eq | passed |
| TC-D-076 | TS-D-02 | timeline 6 h: 4 steps | eq | passed |
| TC-D-077 | TS-D-02 | timeline 12 h: whole edition, 12 steps for Tiamat (0,0,0,3,3,8,8,8,8,8,8,8) | eq | passed |
| TC-D-078 | TS-D-02 | timeline: only 1, 3, 6 or 12 hours | error | passed |
| TC-D-079 | TS-D-02 | head-to-head: Tiamat beat Vanguard once | eq | passed |
| TC-D-080 | TS-D-02 | events completed (gold awarded) | count | passed |
| TC-D-081 | TS-D-02 | top scorer totals across games | eq | passed |
| TC-D-082 | TS-D-02 | publish the edition | ok | passed |
| TC-D-083 | TS-D-02 | readers now see the medal table | count | passed |
| TC-D-084 | TS-D-02 | readers see box scores of the edition | count | passed |
| TC-D-085 | TS-D-02 | readers cannot see who is on the team | count | passed |
| TC-D-086 | TS-D-02 | managing editor removes the writer from the team | ok | passed |
| TC-D-087 | TS-D-02 | removed member can no longer enter scores | error | passed |
| TC-D-088 | TS-D-02 | …and score updates change nothing | count | passed |
| TC-D-089 | TS-D-02 | set_placements replaces the 100m results | eq | passed |
| TC-D-090 | TS-D-02 | medals follow the place; blank result is null | eq | passed |
| TC-D-091 | TS-D-02 | set_placements rolls back on a bad row | error | passed |
| TC-D-092 | TS-D-02 | …leaving the previous results | count | passed |
| TC-D-093 | TS-D-02 | set_placements needs Salingkusog access | error | passed |
| TC-D-094 | TS-D-02 | readers cannot call set_placements | error | passed |
| TC-D-095 | TS-D-02 | countdown is off by default: nothing public | count | passed |
| TC-D-096 | TS-D-02 | managing editor adds a team member | ok | passed |
| TC-D-097 | TS-D-02 | team member still edits the edition | ok | passed |
| TC-D-098 | TS-D-02 | team member cannot switch the countdown on | error | passed |
| TC-D-099 | TS-D-02 | team member cannot move the countdown time | error | passed |
| TC-D-100 | TS-D-02 | section editor cannot switch it either | error | passed |
| TC-D-101 | TS-D-02 | executive editor switches the countdown on | ok | passed |
| TC-D-102 | TS-D-02 | readers get the default time: first day 8:00 AM Manila | eq | passed |
| TC-D-103 | TS-D-02 | super admin sets the time | ok | passed |
| TC-D-104 | TS-D-02 | readers see the new time | eq | passed |
| TC-D-105 | TS-D-02 | managing editor switches it off | ok | passed |
| TC-D-106 | TS-D-02 | off: nothing public | count | passed |
| TC-D-107 | TS-D-02 | combat sports, pageant and others can be used | ok | passed |
| TC-D-108 | TS-D-02 | …and are saved | count | passed |
| TC-D-109 | TS-D-02 | a new current edition replaces the old one | ok | passed |
| TC-D-110 | TS-D-02 | only one current edition | count | passed |
| TC-D-111 | TS-D-03 | only the Salingkusog team builds schedules | error | passed |
| TC-D-112 | TS-D-03 | a faction can only be picked once | error | passed |
| TC-D-113 | TS-D-03 | 4 factions: 2 semifinals, a final and a bronze game | eq | passed |
| TC-D-114 | TS-D-03 | seeds 1 v 4 and 2 v 3 meet in the semifinals | eq | passed |
| TC-D-115 | TS-D-03 | final and bronze game wait for the semifinals | count | passed |
| TC-D-116 | TS-D-03 | a knockout game cannot end in a tie | error | passed |
| TC-D-117 | TS-D-03 | the semifinal winner moves into the final | eq | passed |
| TC-D-118 | TS-D-03 | the semifinal loser goes to the bronze game | eq | passed |
| TC-D-119 | TS-D-03 | final is set | eq | passed |
| TC-D-120 | TS-D-03 | a corrected score keeps the same winner | eq | passed |
| TC-D-121 | TS-D-03 | a corrected result changes the final while it hasn't started | eq | passed |
| TC-D-122 | TS-D-03 | once the final starts, the semifinal result is locked | error | passed |
| TC-D-123 | TS-D-03 | a started event can't be rebuilt | error | passed |
| TC-D-124 | TS-D-03 | 3 factions: the top seed gets a bye | eq | passed |
| TC-D-125 | TS-D-03 | the bye seed waits in the final | eq | passed |
| TC-D-126 | TS-D-03 | 4 factions: 3 rounds of 2 games | eq | passed |
| TC-D-127 | TS-D-03 | everyone meets everyone once | count | passed |
| TC-D-128 | TS-D-03 | round 1 is filled in | count | passed |
| TC-D-129 | TS-D-03 | round 2 waits for round 1 | count | passed |
| TC-D-130 | TS-D-03 | still waiting while a round 1 game is left | count | passed |
| TC-D-131 | TS-D-03 | round robin games may be drawn, and round 2 is filled in | count | passed |
| TC-D-132 | TS-D-03 | round 3 still waits | count | passed |
| TC-D-133 | TS-D-03 | round robin + final: 6 games, then bronze and final | eq | passed |
| TC-D-134 | TS-D-03 | final waits for the last round | count | passed |
| TC-D-135 | TS-D-03 | top 2 of the table play the final | eq | passed |
| TC-D-136 | TS-D-03 | 3rd and 4th play the bronze game | eq | passed |
| TC-D-137 | TS-D-03 | readers see where sides come from | count | passed |
| TC-D-138 | TS-D-03 | readers cannot build schedules | error | passed |
| TC-D-139 | TS-D-04 | only the Salingkusog team creates contests | error | passed |
| TC-D-140 | TS-D-04 | contests are for timed or judged events | error | passed |
| TC-D-141 | TS-D-04 | hip-hop: one session with every faction | ok | passed |
| TC-D-142 | TS-D-04 | performance order follows the faction order | eq | passed |
| TC-D-143 | TS-D-04 | the session has no sides and is called Final | eq | passed |
| TC-D-144 | TS-D-04 | swimming: only the chosen factions | ok | passed |
| TC-D-145 | TS-D-04 | in the order given | eq | passed |
| TC-D-146 | TS-D-04 | one entry per faction | error | passed |
| TC-D-147 | TS-D-04 | the athlete must be from the entry's faction | error | passed |
| TC-D-148 | TS-D-04 | times are entered per athlete | ok | passed |
| TC-D-149 | TS-D-04 | a contest can finish without scores | ok | passed |
| TC-D-150 | TS-D-04 | entries only go into contest sessions | error | passed |
| TC-D-151 | TS-D-04 | a contest session has no sides | error | passed |
| TC-D-152 | TS-D-04 | judged places are entered, and two factions can share one | ok | passed |
| TC-D-153 | TS-D-04 | did not start / finish / disqualified only | error | passed |
| TC-D-154 | TS-D-04 | readers see contest entries | count | passed |
| TC-D-155 | TS-D-04 | readers cannot change them | count | passed |
| TC-D-156 | TS-D-05 | readers cannot call the ingest function | error | passed |
| TC-D-157 | TS-D-05 | readers cannot insert pageviews | error | passed |
| TC-D-158 | TS-D-05 | readers cannot read pageviews | error | passed |
| TC-D-159 | TS-D-05 | readers cannot read the overview | error | passed |
| TC-D-160 | TS-D-05 | a batch is recorded | eq | passed |
| TC-D-161 | TS-D-05 | the same visitor reading again within 30 min is not a new view | eq | passed |
| TC-D-162 | TS-D-05 | pageviews stored (bad id skipped; the draft page is a plain pageview) | count | passed |
| TC-D-163 | TS-D-05 | draft articles are not linked or counted | eq | passed |
| TC-D-164 | TS-D-05 | counted views: first read, other visitor, DNT visitor | count | passed |
| TC-D-165 | TS-D-05 | no raw ids are stored (hashed) | eq | passed |
| TC-D-166 | TS-D-05 | engagement attached to the pageview | eq | passed |
| TC-D-167 | TS-D-05 | DNT pageview has no id or engagement | eq | passed |
| TC-D-168 | TS-D-05 | shares: known channel, unknown becomes other, DNT dropped | eq | passed |
| TC-D-169 | TS-D-05 | referrer host lower-cased | eq | passed |
| TC-D-170 | TS-D-05 | "Most read" counter still updated (3 counted views) | eq | passed |
| TC-D-171 | TS-D-05 | replayed pageview id not stored twice | count | passed |
| TC-D-172 | TS-D-05 | staff writer cannot read the overview | error | passed |
| TC-D-173 | TS-D-05 | staff writer sees no raw pageviews (RLS) | count | passed |
| TC-D-174 | TS-D-05 | section editor cannot read staff usage | error | passed |
| TC-D-175 | TS-D-05 | managing editor reads the overview | eq | passed |
| TC-D-176 | TS-D-05 | overview: counted views and shares | eq | passed |
| TC-D-177 | TS-D-05 | overview series has one row per day | eq | passed |
| TC-D-178 | TS-D-05 | top article: views, avg read, finish rate, shares | eq | passed |
| TC-D-179 | TS-D-05 | author breakdown | eq | passed |
| TC-D-180 | TS-D-05 | sources | eq | passed |
| TC-D-181 | TS-D-05 | devices | eq | passed |
| TC-D-182 | TS-D-05 | share channels | eq | passed |
| TC-D-183 | TS-D-05 | unknown breakdown rejected | error | passed |
| TC-D-184 | TS-D-05 | date range limited | error | passed |
| TC-D-185 | TS-D-05 | executive editor can read too | count | passed |
| TC-D-186 | TS-D-05 | super admin reads raw rows (RLS) | count | passed |
| TC-D-187 | TS-D-05 | readers cannot send heartbeats | error | passed |
| TC-D-188 | TS-D-05 | first beat of a session credits nothing | eq | passed |
| TC-D-189 | TS-D-05 | a beat 30 s after the last one credits 30 s | eq | passed |
| TC-D-190 | TS-D-05 | credit is capped at 45 s per beat | eq | passed |
| TC-D-191 | TS-D-05 | after idling (no beats for minutes) the gap is not counted | eq | passed |
| TC-D-192 | TS-D-05 | staff cannot read their own usage | count | passed |
| TC-D-193 | TS-D-05 | staff cannot use the usage report | error | passed |
| TC-D-194 | TS-D-05 | staff cannot write their own time | error | passed |
| TC-D-195 | TS-D-05 | managing editor sees the writer's active time (75 s) and last active | eq | passed |
| TC-D-196 | TS-D-05 | yesterday rolled up | eq | passed |
| TC-D-197 | TS-D-05 | article totals rolled up | eq | passed |
| TC-D-198 | TS-D-05 | dimension totals rolled up | count | passed |
| TC-D-199 | TS-D-05 | overview reads the daily totals once raw data is gone | eq | passed |
| TC-D-200 | TS-D-05 | top articles read the daily totals | eq | passed |
| TC-D-201 | TS-D-05 | breakdowns read the daily totals | eq | passed |
| TC-D-202 | TS-D-05 | staff activity older than 24 months is deleted | count | passed |
| TC-D-203 | TS-D-05 | old daily salts are deleted | count | passed |
| TC-D-204 | TS-D-06 | writer sees own + live articles | count | passed |
| TC-D-205 | TS-D-06 | writer cannot see writer2 drafts | count | passed |
| TC-D-206 | TS-D-06 | writer creates a draft | ok | passed |
| TC-D-207 | TS-D-06 | slug generated from title | eq | passed |
| TC-D-208 | TS-D-06 | section derived from category | eq | passed |
| TC-D-209 | TS-D-06 | creator credited as author | count | passed |
| TC-D-210 | TS-D-06 | writer cannot create published | error | passed |
| TC-D-211 | TS-D-06 | writer cannot file an editorial | error | passed |
| TC-D-212 | TS-D-06 | writer cannot publish own draft | error | passed |
| TC-D-213 | TS-D-06 | writer cannot feature | error | passed |
| TC-D-214 | TS-D-06 | writer submits for review | ok | passed |
| TC-D-215 | TS-D-06 | submitted article is locked for writer | error | passed |
| TC-D-216 | TS-D-06 | writer can withdraw to draft | ok | passed |
| TC-D-217 | TS-D-06 | writer resubmits | ok | passed |
| TC-D-218 | TS-D-06 | activity logged with note | count | passed |
| TC-D-219 | TS-D-06 | writer saves an autosave revision | ok | passed |
| TC-D-220 | TS-D-06 | writer cannot change own role | error | passed |
| TC-D-221 | TS-D-06 | writer edits own bio | ok | passed |
| TC-D-222 | TS-D-06 | writer delete of published is a no-op | count | passed |
| TC-D-223 | TS-D-06 | writer cannot read inbox | count | passed |
| TC-D-224 | TS-D-06 | writer uploads media | ok | passed |
| TC-D-225 | TS-D-06 | writer cannot write archives | error | passed |
| TC-D-226 | TS-D-06 | writer dashboard stats limited to own drafts | eq | passed |
| TC-D-227 | TS-D-06 | news editor sees news submissions | count | passed |
| TC-D-228 | TS-D-06 | news editor cannot see sports submissions | count | passed |
| TC-D-229 | TS-D-06 | section editor moves to in_review | ok | passed |
| TC-D-230 | TS-D-06 | section editor edits in review | ok | passed |
| TC-D-231 | TS-D-06 | section editor cannot publish | error | passed |
| TC-D-232 | TS-D-06 | section editor returns with note | ok | passed |
| TC-D-233 | TS-D-06 | section editor rejects | ok | passed |
| TC-D-234 | TS-D-06 | section editor cannot touch sports | error | passed |
| TC-D-235 | TS-D-06 | section editor cannot change the ticker | error | passed |
| TC-D-236 | TS-D-06 | section editor reads submissions intake | count | passed |
| TC-D-237 | TS-D-06 | eic publishes directly from draft | ok | passed |
| TC-D-238 | TS-D-06 | eic schedules sports piece | ok | passed |
| TC-D-239 | TS-D-06 | eic cannot schedule in the past | error | passed |
| TC-D-240 | TS-D-06 | eic archives | ok | passed |
| TC-D-241 | TS-D-06 | eic restores | ok | passed |
| TC-D-242 | TS-D-06 | eic features an article | ok | passed |
| TC-D-243 | TS-D-06 | publisher can change the ticker | ok | passed |
| TC-D-244 | TS-D-06 | eic sets lead slot | ok | passed |
| TC-D-245 | TS-D-06 | eic cannot grant super_admin | error | passed |
| TC-D-246 | TS-D-06 | eic promotes writer to section editor | ok | passed |
| TC-D-247 | TS-D-06 | role change audited | count | passed |
| TC-D-248 | TS-D-06 | scheduled article hidden before time | count | passed |
| TC-D-249 | TS-D-06 | published + restored articles visible | count | passed |
| TC-D-250 | TS-D-06 | scheduled article visible after time | count | passed |
| TC-D-251 | TS-D-06 | cron flips due scheduled rows | eq | passed |
| TC-D-252 | TS-D-06 | eic sees pending comments | count | passed |
| TC-D-253 | TS-D-06 | eic approves comment | ok | passed |
| TC-D-254 | TS-D-06 | approved comment is public | count | passed |
| TC-D-255 | TS-D-06 | eic converts submission to draft | ok | passed |
| TC-D-256 | TS-D-06 | converted submission marked | count | passed |
| TC-D-257 | TS-D-06 | eic reads stats | ok | passed |
| TC-D-258 | TS-D-06 | super admin grants super admin | ok | passed |
| TC-D-259 | TS-D-06 | super admin demotes the other super admin | ok | passed |
| TC-D-260 | TS-D-06 | last super admin cannot step down | error | passed |
| TC-D-261 | TS-D-06 | uninvited user sees only live articles | count | passed |
| TC-D-262 | TS-D-06 | uninvited user has no contributor byline | count | passed |
| TC-D-263 | TS-D-06 | uninvited user cannot write | error | passed |
| TC-D-264 | TS-D-06 | uninvited user cannot upload media | error | passed |
| TC-D-265 | TS-D-06 | uninvited user cannot read stats | error | passed |
| TC-D-266 | TS-D-06 | writer drafts another story | ok | passed |
| TC-D-267 | TS-D-06 | writer without access cannot publish | error | passed |
| TC-D-268 | TS-D-06 | writer cannot give self publishing access | error | passed |
| TC-D-269 | TS-D-06 | writer cannot call the grant | error | passed |
| TC-D-270 | TS-D-06 | business manager cannot give publishing access | error | passed |
| TC-D-271 | TS-D-06 | business manager drafts a story | ok | passed |
| TC-D-272 | TS-D-06 | business manager publishes | ok | passed |
| TC-D-273 | TS-D-06 | managing editor gives the writer publishing access | ok | passed |
| TC-D-274 | TS-D-06 | writer with access publishes own story | ok | passed |
| TC-D-275 | TS-D-06 | managing editor takes the access back | ok | passed |
| TC-D-276 | TS-D-06 | writer without access cannot unpublish | error | passed |
| TC-D-277 | TS-D-06 | publishing access changes are audited | count | passed |
| TC-D-278 | TS-D-06 | used cover cannot be deleted | error | passed |
