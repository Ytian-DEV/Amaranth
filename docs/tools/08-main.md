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

