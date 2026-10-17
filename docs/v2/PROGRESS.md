# AMARANTH v2 — Progress

> **Resume ("continue"):** read this file → `git status` → check out the branch in "Current branch" → finish uncommitted work → continue from the first unchecked item. Plan: `docs/v2/PLAN.md`. DB: `docs/v2/DB.md`. Figma file `jpKBeBp37twnW7eXj0Nk2S` (frames: Components 3:28, Home desktop 4:2, Home mobile 7:64, Admin dashboard 8:101).

**Current branch:** `develop` — **v2 build complete.** PR text for `develop` → `main`: `docs/v2/PR.md` (not opened).
**Last done:** `feature/perf-pass` merged — Lighthouse before/after in `docs/v2/PERF.md` (v1 `/` mobile 56 / desktop 83 → v2 79 / 99, a11y 91 → 100, 1.6 MB → 246 KB), eager public shell, CLS 0, editor vendor chunk, board photos 6.1 → 1.4 MB, Supabase preconnect.
**Next step (user):** paste `supabase/v2/schema.sql` + `seed.sql` into the new project, set env vars on Vercel, deploy a preview, run the manual checklist in `docs/v2/PR.md`, then open the PR. Open questions: Katalon tests in `Amaranth/`, v1 content export. (TipTap 3 / Vite 7 upgrades done.)

## Phase 2 (Salingkusog + section layouts) — see `docs/v2/PLAN-PHASE2.md`
**Rule:** one feature at a time; wait for the user's go before starting the next.
**Last done:** A12 `feature/sports-landing` merged: `/sports` page 1 with all categories (Figma 21:1963 / 22:2645).
- Latest-results strip: live games first, then recent finals, each linking to the recap.
- Chips: All Sports, a "Salingkusog 2026" chip that opens the hub, and the section's categories.
- Lead story beside a Salingkusog block: top 4 and "Open the Salingkusog hub".
- Latest in Sports.
- Athlete spotlight, from the newest award with a quote.
- More from the courts.

With no visible edition, the Salingkusog parts are left out. Category or page views keep the old section list. Fixtures: `/dev/sports` and `/dev/sports/no-salingkusog`.
**Next:** A13 `feature/salingkusog-social-cards` (awaiting go).

| # | Branch | Status |
|---|---|---|
| A1 | `feature/salingkusog-db` | ✅ |
| A2 | `feature/salingkusog-team-access` | ✅ |
| A3 | `feature/salingkusog-cms-setup` | ✅ |
| A4 | `feature/salingkusog-scorekeeper` | ✅ |
| A5 | `feature/salingkusog-medal-tally` | ✅ |
| A6 | `feature/salingkusog-schedule` | ✅ |
| A7 | `feature/salingkusog-winners` | ✅ |
| A8 | `feature/salingkusog-factions` | ✅ |
| A9 | `feature/salingkusog-sports-bracket` | ✅ |
| A10 | `feature/salingkusog-match-recap` | ✅ |
| A11 | `feature/salingkusog-venues` | ✅ |
| A12 | `feature/sports-landing` | ✅ |
| A13 | `feature/salingkusog-social-cards` | ⬜ |
| B1 | `feature/nav-more-menu` | ⬜ |
| B2–B12 | `feature/section-<slug>` (News, Feature, Literary, Blogs, Specials, Views, S&T, Investigative, Explainer, Bulletin, Stories) | ⬜ |

## Decisions log
- 2026-10-17 Upgrades: TipTap 3 and Vite 7. Vitest went to 5 (not 4): npm 11.2 crashes (`edgesOut`) resolving Vitest 4's optional peers; Vitest 5 installs cleanly and `npm ci` from the lockfile was verified in a scratch copy. Vite 7 needs Node ≥ 20.19.
- 2026-10-17 DB option **B** (fresh schema, user pastes `supabase/v2/schema.sql` then `seed.sql`).
- 2026-10-17 Pre-v2 uncommitted Dashboard/index.css saved as WIP commit on `feature/edit-article-restructure` (not merged).
- Branch order: DB first (user priority), then tooling.
- 2026-10-17 Content migration skipped (fresh DB). Katalon test project in `Amaranth/` left on disk, untracked — user to decide.

## Conventions (read before building)
- v2 code: `src/app` (router, layouts), `src/components/ui` (atoms), `src/components/story` (Figma story components), `src/lib` (supabase, types, format, media), `src/dev` (fixtures + `/dev/*`, dev builds only), feature folders `src/features/<area>`.
- `src/legacy` = v1 app, mounted by the router's `*` route until every page is rebuilt; excluded from lint/typecheck. Delete in `feature/v2-polish`.
- Tokens: `src/styles/tokens.css` (`@theme static`) → utilities like `bg-paper text-ink font-serif text-headline-m text-kicker`. No hex in components (lint rule). `npm run check:contrast`.
- Types: `src/lib/database.types.ts` is hand-written; update it with any schema change.
- Gate before each feature's last commit: `npm run check` (lint, typecheck, test, build; trust its exit code) + `npm run db:test` for DB changes.
- UI checks: run `window.__domCheck()` (dev builds, `src/dev/domCheck.ts`) at 375/768/1024/1440 on the `/dev/<screen>` fixture route; open `/dev` then `window.__startSweep()` and read `window.__sweepResult` to check every screen. Claude's preview server: `.claude/launch.json` → port 5174 (the user may have their own dev server on 3000; leave it alone).

## Features
| # | Branch | Status | Next step |
|---|---|---|---|
| 0 | — planning | ✅ | — |
| 2 | `feature/db-v2-schema` | ✅ merged | Types are hand-written in tooling branch (no Supabase CLI/Docker locally) |
| 1 | `feature/tooling-design-system` | ✅ merged | — |
| 3 | `feature/auth-staff` | ✅ merged | Login not exercised against a live v2 project yet (needs schema pasted + invited user) |
| 4 | `feature/public-shell-home` | ✅ merged | Header links to `/submit`, `/search`, `/about` … still served by legacy until their features land |
| 5 | `feature/section-pages` | ✅ merged | Legacy pages still routed: see `legacyRoutes` in router.tsx |
| 6 | `feature/article-page` | ✅ merged | Tag links go to `/search?tag=` (handled in feature 7) |
| 7 | `feature/search-archives` | ✅ merged | Schema gained `archive_months()` (in schema.sql) |
| 8 | `feature/submissions-contact` | ✅ merged | Legacy still serves `/about`, `/editorial-board` |
| 9 | `feature/cms-shell-dashboard` | ✅ merged | Legacy v1 Dashboard is no longer routed (`/dashboard` → `/admin`) |
| 10 | `feature/cms-article-editor` | ✅ merged | Not exercised against a live v2 project yet |
| 11 | `feature/cms-editorial-workflow` | ✅ merged | Workflow rules live in the DB trigger; UI mirrors them |
| 12 | `feature/cms-media-library` | ✅ merged | |
| 13 | `feature/cms-people-board` | ✅ merged | Board photos in /public/images are 2048px JPEGs — compress in perf pass |
| 14 | `feature/cms-site-settings` | ✅ merged | |
| 15 | `feature/seo-sharing` | ✅ merged | Verify on a Vercel preview (OG debugger, /sitemap.xml, /rss.xml) |
| 16 | `feature/content-migration` | ⏭ skipped | Fresh DB chosen. If production v1 has articles to keep, build an export/import script (ask user) |
| 17 | `feature/v2-polish` | ✅ merged | |
| 19 | `feature/upgrade-tiptap-3` | ✅ merged | TipTap 3.32; toolbar via `useEditorState`; editor chunk 108 → 134 KB gz (CMS only) |
| 20 | `feature/upgrade-vite-7` | ✅ merged | Vite 7.3.7, Vitest 5.0.5, plugin-react-swc 4.3.3, Tailwind 4.3.3, @types/node 22 — `npm audit`: 0 vulnerabilities |
| 18 | `feature/perf-pass` | ✅ merged | See docs/v2/PERF.md |
