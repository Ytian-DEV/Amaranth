# AMARANTH v2 — Progress

> **Resume ("continue"):** read this file → `git status` → check out the branch in "Current branch" → finish uncommitted work → continue from the first unchecked item. Plan: `docs/v2/PLAN.md`. DB: `docs/v2/DB.md`. Figma file `jpKBeBp37twnW7eXj0Nk2S` (frames: Components 3:28, Home desktop 4:2, Home mobile 7:64, Admin dashboard 8:101).

**Current branch:** `develop` (next: create `feature/tooling-design-system`)
**Last done:** `feature/db-v2-schema` merged into `develop` — fresh schema + seed + local test harness (95 checks).
**Next step:** feature 1b `feature/tooling-design-system`.

## Decisions log
- 2026-10-17 DB option **B** (fresh schema, user pastes `supabase/v2/schema.sql` then `seed.sql`).
- 2026-10-17 Pre-v2 uncommitted Dashboard/index.css saved as WIP commit on `feature/edit-article-restructure` (not merged).
- Branch order: DB first (user priority), then tooling.

## Features
| # | Branch | Status | Next step |
|---|---|---|---|
| 0 | — planning | ✅ | — |
| 2 | `feature/db-v2-schema` | ✅ merged | Types are hand-written in tooling branch (no Supabase CLI/Docker locally) |
| 1 | `feature/tooling-design-system` | ⬜ | ESLint, typecheck, Vitest, Tailwind v4 + tokens.css, fonts, UI components, `/dev/components`, fix `.gitignore` conflict markers |
| 3 | `feature/auth-staff` | ⬜ | |
| 4 | `feature/public-shell-home` | ⬜ | |
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
