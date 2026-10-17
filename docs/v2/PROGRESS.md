# AMARANTH v2 — Progress

> **Resume ("continue"):** read this file → `git status` → check out the branch in "Current branch" → finish uncommitted work → continue from the first unchecked item. Plan: `docs/v2/PLAN.md`. DB: `docs/v2/DB.md`. Figma file `jpKBeBp37twnW7eXj0Nk2S` (frames: Components 3:28, Home desktop 4:2, Home mobile 7:64, Admin dashboard 8:101).

**Current branch:** `develop` (next: decide `feature/content-migration`, then `feature/v2-polish`)
**Last done:** `feature/seo-sharing` merged — `middleware.ts` (crawler UA → index.html with article/section OG tags from Supabase REST), `/api/sitemap`, `/api/rss` (+`?section=`), `/api/robots` behind `vercel.json` rewrites; immutable `/assets` caching + security headers; `usePageMeta` (description, canonical, OG) on home/section/article; `public/og-default.jpg` (1200×630). Middleware/functions are unit-tested but NOT yet run on Vercel — check a preview deploy with the Facebook Sharing Debugger.
**Next step:** `feature/content-migration` is optional (fresh DB chosen; old v1 content would need an export from the old project) — skip unless the user asks. Continue with `feature/v2-polish`: delete `src/legacy` + nested `Amaranth/` gitlink + unused deps (Radix, recharts, quill, cmdk, vaul…), remove vite legacy aliases, a11y/responsive pass on every /dev screen, 404 + error states review.

## Decisions log
- 2026-10-17 DB option **B** (fresh schema, user pastes `supabase/v2/schema.sql` then `seed.sql`).
- 2026-10-17 Pre-v2 uncommitted Dashboard/index.css saved as WIP commit on `feature/edit-article-restructure` (not merged).
- Branch order: DB first (user priority), then tooling.

## Conventions (read before building)
- v2 code: `src/app` (router, layouts), `src/components/ui` (atoms), `src/components/story` (Figma story components), `src/lib` (supabase, types, format, media), `src/dev` (fixtures + `/dev/*`, dev builds only), feature folders `src/features/<area>`.
- `src/legacy` = v1 app, mounted by the router's `*` route until every page is rebuilt; excluded from lint/typecheck. Delete in `feature/v2-polish`.
- Tokens: `src/styles/tokens.css` (`@theme static`) → utilities like `bg-paper text-ink font-serif text-headline-m text-kicker`. No hex in components (lint rule). `npm run check:contrast`.
- Types: `src/lib/database.types.ts` is hand-written; update it with any schema change.
- Gate before each feature's last commit: `npm run check` (lint, typecheck, test, build; trust its exit code) + `npm run db:test` for DB changes.
- UI checks: run `window.__domCheck()` (dev builds, `src/dev/domCheck.ts`) at 375/768/1024/1440 on the `/dev/<screen>` fixture route. Claude's preview server: `.claude/launch.json` → port 5174 (the user may have their own dev server on 3000; leave it alone).

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
| 16 | `feature/content-migration` | ⬜ optional (old data import) | |
| 17 | `feature/v2-polish` | ⬜ | |
| 18 | `feature/perf-pass` | ⬜ | |
