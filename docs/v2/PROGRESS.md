# AMARANTH v2 — Progress

> **Resume ("continue"):** read this file → `git status` → check out the branch in "Current branch" → finish uncommitted work → continue from the first unchecked item. Plan: `docs/v2/PLAN.md`. DB: `docs/v2/DB.md`. Figma file `jpKBeBp37twnW7eXj0Nk2S` (frames: Components 3:28, Home desktop 4:2, Home mobile 7:64, Admin dashboard 8:101).

**Current branch:** `develop` — **v2 build complete.** PR text for `develop` → `main`: `docs/v2/PR.md` (not opened).
**Last done:** `feature/perf-pass` merged — Lighthouse before/after in `docs/v2/PERF.md` (v1 `/` mobile 56 / desktop 83 → v2 79 / 99, a11y 91 → 100, 1.6 MB → 246 KB), eager public shell, CLS 0, editor vendor chunk, board photos 6.1 → 1.4 MB, Supabase preconnect.
**Next step (user):** paste `supabase/v2/schema.sql` + `seed.sql` into the new project, set env vars on Vercel, deploy a preview, run the manual checklist in `docs/v2/PR.md`, then open the PR. Open questions: Katalon tests in `Amaranth/`, v1 content export. (TipTap 3 / Vite 7 upgrades done.)

## Phase 2 (Salingkusog + section layouts) — see `docs/v2/PLAN-PHASE2.md`
**Rule:** one feature at a time; wait for the user's go before starting the next.
**Last done:** A13 `feature/salingkusog-social-cards` merged (Figma 20:2036 / 20:2067). **Track A (Salingkusog) is complete.**
- In the newsroom, Salingkusog → Awards → **Card** on each award opens a preview with **Download PNG**.
- MVP of the Day and Finals MVP use the 1080×1350 card: photo, name, faction, stat line, faction stripe, game footer.
- Athlete of the Day uses the 1080×1080 card: name, medal and event, big result, faction colour panel with the photo.
- Drawn with the Canvas API, so there is no new dependency. Fonts and token colours come from the page; photos load with CORS so the PNG can be exported.
- Fixture: `/dev/admin/salingkusog-cards`.

**Also done (2026-10-18):**
- `fix/nested-dialog-close`: choosing an image in the media picker closed the form it was opened from, so faction logos (and venue map, athlete and board photos) were never saved. Dropped SVG/HEIC files now get a clear message.
- `feature/salingkusog-countdown`:
  - Public Hunger Games–style countdown at `/salingkusog-2026/countdown`: days, hours, minutes and seconds in Asia/Manila time, a "The games have begun" state, and a Continue button that goes to `/salingkusog-2026`, which redirects to `/salingkusog`.
  - Link previews: OG/Twitter tags (middleware + client) with a 1200×630 image, `public/images/salingkusog/countdown-og.png`, built by `scripts/countdown-og.py`.
  - Newsroom → Salingkusog → Edition: a **Countdown page** card (Show Countdown Page + target time) for the three managing roles. The DB trigger enforces this.
  - When off, the page redirects to the hub. **The user must re-paste `supabase/v2/salingkusog.sql`** to add the new columns and function.
  - Fixtures: `/dev/countdown` and `/dev/countdown/done`.

- `feature/countdown-launch`: back to the first countdown design (the flat "official notice" redesign was reverted at the user's request). Clicking **Continue to Salingkusog** now plays a launch: cannon flash and screen shake, sparks from the button, a wall of fire rising, then a "Let the games begin" title card before the hub opens (~2.7 s). Click or Esc skips it, ctrl/cmd-click opens normally, and with reduced motion only the title card shows.
- `fix/sk-more-categories`: sport categories **Combat sports**, **Pageant** and **Others** added (enum values, re-runnable). New events default to an individual bracket for combat sports and to judged for pageants. The user should re-paste `salingkusog.sql`, then re-file Arnis/Taekwondo, GMBM, Laro ng Lahi and On-the-Spot Painting in the newsroom.

- `feature/statistics` (2026-10-18): first-party statistics, no third-party service. Docs: `docs/v2/STATS.md`.
  - `/admin/statistics` for Super admin, Executive Editor and Managing editor only (enforced by `app.can_view_stats()` in RLS and every RPC): range picker, summary cards, SVG trend chart, top articles, authors, sections, sources, referrers, devices, browsers, share channels, staff active time (H:MM:SS).
  - Tracker → Vercel route `/api/e` (bot filter, same-origin, no IP) → `stats_ingest` (service role only). Daily-rotating hashed ids, DNT/GPC counted without an id, staff and previews excluded.
  - Retention: raw 13 months, daily totals forever, staff activity 24 months (nightly pg_cron job).
  - Public `/privacy` page (footer link; `#staff` section linked from the newsroom sidebar).
  - **The user must** paste `supabase/v2/stats.sql` (and re-paste `schema.sql` once), and add `SUPABASE_SERVICE_ROLE_KEY` on Vercel Production. Open question: keep or remove Vercel Web Analytics (`@vercel/analytics`).
  - Fixtures: `/dev/admin/statistics`, `/dev/admin/statistics/empty`, `/dev/admin/statistics/loading`, `/dev/privacy`.

**Next:** Track B, starting with B1 `feature/nav-more-menu` (awaiting go).

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
| A13 | `feature/salingkusog-social-cards` | ✅ |
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
