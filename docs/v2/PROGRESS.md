# AMARANTH v2 — Progress

> **Resume ("continue"):** read this file → `git status` → check out the branch in "Current branch" → finish uncommitted work → continue from the first unchecked item. Plan: `docs/v2/PLAN.md`. DB: `docs/v2/DB.md`. Figma file `jpKBeBp37twnW7eXj0Nk2S` (frames: Components 3:28, Home desktop 4:2, Home mobile 7:64, Admin dashboard 8:101).

**Current branch:** `develop` (next: create `feature/section-pages`)
**Last done:** `feature/public-shell-home` merged — public header (utility bar, masthead, nav + More, mobile header/chips/drawer), footer, home page per Figma (`/`), fixtures at `/dev/home`.
**Next step:** `feature/section-pages` — one `/:section` template (lead + grid + category filter + pagination) for all 12 sections, redirects for old URLs (`/features`→`/feature`, `/blog`→`/blogs`), `/latest`.

## Decisions log
- 2026-10-17 DB option **B** (fresh schema, user pastes `supabase/v2/schema.sql` then `seed.sql`).
- 2026-10-17 Pre-v2 uncommitted Dashboard/index.css saved as WIP commit on `feature/edit-article-restructure` (not merged).
- Branch order: DB first (user priority), then tooling.

## Conventions (read before building)
- v2 code: `src/app` (router, layouts), `src/components/ui` (atoms), `src/components/story` (Figma story components), `src/lib` (supabase, types, format, media), `src/dev` (fixtures + `/dev/*`, dev builds only), feature folders `src/features/<area>`.
- `src/legacy` = v1 app, mounted by the router's `*` route until every page is rebuilt; excluded from lint/typecheck. Delete in `feature/v2-polish`.
- Tokens: `src/styles/tokens.css` (`@theme static`) → utilities like `bg-paper text-ink font-serif text-headline-m text-kicker`. No hex in components (lint rule). `npm run check:contrast`.
- Types: `src/lib/database.types.ts` is hand-written; update it with any schema change.
- Gate before each feature's last commit: `npm run lint && npm run typecheck && npm test && npm run build` (+ `npm run db:test` for DB changes).
- UI checks: run `window.__domCheck()` (dev builds, `src/dev/domCheck.ts`) at 375/768/1024/1440 on the `/dev/<screen>` fixture route. Claude's preview server: `.claude/launch.json` → port 5174 (the user may have their own dev server on 3000; leave it alone).

## Features
| # | Branch | Status | Next step |
|---|---|---|---|
| 0 | — planning | ✅ | — |
| 2 | `feature/db-v2-schema` | ✅ merged | Types are hand-written in tooling branch (no Supabase CLI/Docker locally) |
| 1 | `feature/tooling-design-system` | ✅ merged | — |
| 3 | `feature/auth-staff` | ✅ merged | Login not exercised against a live v2 project yet (needs schema pasted + invited user) |
| 4 | `feature/public-shell-home` | ✅ merged | Header links to `/submit`, `/search`, `/about` … still served by legacy until their features land |
| 5 | `feature/section-pages` | ⬜ | |
| 6 | `feature/article-page` | ⬜ | |
| 7 | `feature/search-archives` | ⬜ | |
| 8 | `feature/submissions-contact` | ⬜ | |
| 9 | `feature/cms-shell-dashboard` | ⬜ | |
| 10 | `feature/cms-article-editor` | ⬜ | |
| 11 | `feature/cms-editorial-workflow` | ⬜ | |
| 12 | `feature/cms-media-library` | ⬜ | |
| 13 | `feature/cms-people-board` | ⬜ | |
| 14 | `feature/cms-site-settings` | ⬜ | |
| 15 | `feature/seo-sharing` | ⬜ | |
| 16 | `feature/content-migration` | ⬜ optional (old data import) | |
| 17 | `feature/v2-polish` | ⬜ | |
| 18 | `feature/perf-pass` | ⬜ | |
