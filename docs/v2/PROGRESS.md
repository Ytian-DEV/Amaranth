# AMARANTH v2 — Progress

> **Resume ("continue"):** read this file → `git status` → check out the branch in "Current branch" → finish uncommitted work → continue from the first unchecked item. Plan: `docs/v2/PLAN.md`. DB: `docs/v2/DB.md`. Figma file `jpKBeBp37twnW7eXj0Nk2S` (frames: Components 3:28, Home desktop 4:2, Home mobile 7:64, Admin dashboard 8:101).

**Current branch:** `develop` — **v2 build complete.** PR text for `develop` → `main`: `docs/v2/PR.md` (not opened).
**Last done:** `feature/perf-pass` merged — Lighthouse before/after in `docs/v2/PERF.md` (v1 `/` mobile 56 / desktop 83 → v2 79 / 99, a11y 91 → 100, 1.6 MB → 246 KB), eager public shell, CLS 0, editor vendor chunk, board photos 6.1 → 1.4 MB, Supabase preconnect.
**Next step (user):** paste `supabase/v2/schema.sql` + `seed.sql` into the new project, set env vars on Vercel, deploy a preview, run the manual checklist in `docs/v2/PR.md`, then open the PR. Open questions: Katalon tests in `Amaranth/`, v1 content export. (TipTap 3 / Vite 7 upgrades done.)

## Phase 2 (Salingkusog + section layouts) — see `docs/v2/PLAN-PHASE2.md`
**Rule:** one feature at a time; wait for the user's go before starting the next.
**Last done:** B12 `feature/section-stories` merged. **Track A, Statistics and Track B (B1–B12) are complete** (2026-10-18). Earlier: A13 `feature/salingkusog-social-cards` (Figma 20:2036 / 20:2067).
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
  - **The user must** paste `supabase/v2/stats.sql` (and re-paste `schema.sql` once), and add `SUPABASE_SERVICE_ROLE_KEY` on Vercel Production.
  - Fixtures: `/dev/admin/statistics`, `/dev/admin/statistics/empty`, `/dev/admin/statistics/loading`, `/dev/privacy`.

- `docs/pr-track-a` (2026-10-18): `docs/v2/PR.md` now covers Phase 1 + Track A + Statistics for the `develop` → `main` PR (the user opens it).

- `fix/server-esm-imports` (2026-10-18): production returned 500 MIDDLEWARE_INVOCATION_FAILED after the first merge to `main`. Vercel runs `middleware.ts` and `api/*` as plain Node ESM, so relative imports need `.js` (`./api/_lib/seo.js`). Fixed everywhere; `api/_lib/esm-imports.test.ts` guards it.

- B1 `feature/nav-more-menu` (2026-10-18): Header "More" opens a full-width mega menu (Figma 42:1077): a card per More section with icon, pitch and its newest story (fetched on first open), plus an "Also on Amaranth" strip. Esc and outside click close it; Esc returns focus to the button. 5 columns on desktop, 3 on tablet; phones keep the section chips.

- B2 `feature/section-news` (2026-10-18): `/news` page 1 follows Figma 30:108: intro with category chips, lead story + campus briefs (times in Manila), top stories, more news feed, most read (this month, this section) and a tip box. Shared `section/landing/` toolkit (data hook, picker, blocks, registry) for B3–B12; `?view=all` (and any filter or page 2+) keeps the paginated list. Fixtures `/dev/section/:slug` and `/dev/section/:slug/empty`.

- B3 `feature/section-feature` (2026-10-18): `/feature` follows Figma 31:252: full-bleed photo hero (newest story with a photo), category chips, two alternating long reads (6+ min), Profiles from People & Events (photo circle, name, dek as quote), an "In pictures" band when three more photo stories exist, then more features. Photo essays need a gallery model, so the band uses story photos for now.

- B4 `feature/section-literary` (2026-10-18): `/literary` follows Figma 33:366: folio hero (newest work, drawn cover art on tablet and up), genre tab bar, Poem of the week (newest Poetry piece, dek as verse), "From the Folio" tiles in white / dark / lime, and the call-for-submissions band. A real Folio issue (title, semester, PDF) would need an issue type; for now the hero features the newest work.

- B5 `feature/section-blogs` (2026-10-18): `/blogs` follows Figma 34:349: intro, Featured bloggers (the four most recent writers by byline, with post counts and initials avatars), latest posts with byline, category tag and thumbnail, a Topics panel when the section has several categories, and the "Pitch a blog" box. Named blog columns, avatars, likes and comment counts need data the schema lacks.

- B6 `feature/section-specials` (2026-10-18): `/specials` follows Figma 34:554: dark special-report hero (newest special) with up to three parts of the series (same category, oldest first) and "Start with part 1", "More special coverage" tiles (the section categories plus the Salingkusog hub; the middle tile is lime so text keeps AA contrast, since the design blue is not in the palette), then the special-issue archive by year. The "By the numbers" strip needs per-story figures the schema lacks.

- B7 `feature/section-views` (2026-10-18): `/views` follows Figma 36:507: editorial hero (newest Editorial, else newest piece) with italic dek and cartoon frame when it has an image, Our columnists (newest three Column pieces), latest opinion list with italic deks, then Most read and a Letters to the editor box linking to Contact. The weekly poll and published letters need their own data; left out until then.

- B8 `feature/section-science-technology` (2026-10-18): `/science-technology` follows Figma 39:579: intro with chips, lead story with an "Also in S&T" panel in the study-at-a-glance slot, From VSU labs cards (tinted photo, dot + category), and a dark numbered "Explained" band linking to /explainer. Study-at-a-glance facts and the innovation tracker need data the schema lacks.

- B9 `feature/section-investigative` (2026-10-18): `/investigative` follows Figma 39:763: dark hero with the newest investigation ("Read the investigation", byline, date) and a "How we report" note, Our investigations by year, and the Investigations desk band linking to Contact. Reporting stats, the documents gallery and impact badges need per-story data the schema lacks.

- B10 `feature/section-explainer` (2026-10-18): `/explainer` follows Figma 40:721: intro, featured explainer with its dek as "The short answer" panel, More explainers as question cards ("Get the answer →"), and the Ask Amaranth band (links to Contact rather than a free-text box). The four-step "what changed / who it affects" cards need structured fields the schema lacks.

- B11 `feature/section-bulletin` (2026-10-18): `/bulletin` follows Figma 40:879: intro, category filter chips, notice cards (category tag, "New" for three days, office byline, date and time, "View notice →"), a Manila-time month calendar marking today and the days notices went up, and "Post an announcement" (links to Contact, since Bulletin takes no public submissions). The Deadlines strip and pinned notices need deadline dates and a pin flag the schema lacks.

- B12 `feature/section-stories` (2026-10-18): `/stories` follows Figma 42:851: intro (category circles when the section has several), a swipeable "New this week" row of 9:16 tiles (photo or colour, progress dashes, kicker, title), then Faces of VSU quote cards (a `faces-of-vsu` category, else "More stories"). The "How stories work" band describes a tap-through player the site does not have, so it is left out. **Track B is complete.**

**Track B follow-ups (design widgets left out because the data doesn't exist yet; each needs a small schema + newsroom form, ask the user first):**
- News: none. Feature: photo essays as galleries (the band uses story photos).
- Literary: a real Folio issue (title, semester, PDF); the hero uses the newest work.
- Blogs: named blog columns with avatars; likes and comment counts.
- Specials: "By the numbers" figures for a series.
- Views: weekly poll; published letters to the editor.
- S&T: "study at a glance" facts; innovation tracker.
- Investigative: reporting stats, documents gallery, impact badges.
- Explainer: the four "what changed / who it affects / what to check / where to ask" cards.
- Bulletin: deadline dates (Deadlines strip, calendar deadlines) and pinned notices.
- Stories: a tap-through story player ("How stories work" band).

- `perf/edge-cache-images` (2026-10-18): performance pass 2 on production data (see `docs/v2/PERF.md`): CDN-cached `/api/r` for signed-out public reads, 320/960 px image sizes + Media Library "Make web sizes" backfill, srcset on the last raw images, debounced recap search.

## Brand 2026 (approved by the EIC, 2026-10-18)
Design: Figma page "Brand 2026" (94:121). Plan: 1 tokens + fonts → 2 header/footer → 3 components → 4 pages; one branch each, user approves before the next.
- [x] 1 `feature/brand-tokens-fonts`: colour tokens to the Brand 2026 palette (page #FAFAF7, deep forest #0F2A1A/#14361F bands, logo lime #B5F000 for fills, lime ink #3F6A00 for lime text), Montserrat (headlines + text) and Cinzel (wordmark only, `--font-wordmark`) self-hosted via Fontsource; Fraunces and Inter removed; heavier type scale; contrast script covers the new pairs (39/39 AA). Social cards use Montserrat + Cinzel. Fixed two phone overflows the wider font exposed (match recap faction names, card preview).
- [x] 2 `feature/brand-header-footer`: light utility bar, white masthead with the AMARANTH wordmark in Cinzel (deep green) over a hairline rule, one solid deep-green nav with the lime active underline, white sticky mobile top bar (chips stay on the green band), light "Latest" ticker, footer with lime Cinzel wordmark and the `@AMARANTHVSU · site` strip; newsroom/sign-in lockups use the Cinzel wordmark too.
- [x] 2b `feature/brand-header-tagline`: header matched to the Figma frame: deep-green utility bar, and the cover motto "In the name of TRUTH and standing by it—we remain." on the left of the masthead (desktop).
- [x] 3 `feature/brand-components`: `CategoryPill` (lime, specific word heavy: "**ENVIRONMENT** NEWS") on the home and landing leads (overlapping the photo edge) and the article header; rounder radii (6/12/16/20, lead photos 24); pill-shaped buttons; caps ExtraBold section headers; black-italic numerals; the post byline chip "via Name | Amaranth" on articles.
- [x] 4 `feature/brand-pages`: home "Have a story" panel is the deep-forest CTA with lime outline and lime button; landing heroes and bands (Specials, Investigative, Literary call for submissions, Stories tiles) use deep forest instead of near-black (Salingkusog keeps its own night theme); article gets a carded author box and the dark "Got a news tip?" card. **Brand 2026 is applied.**

- [x] 5 `feature/brand-lime-hover` (user request): hovers are lime. On light backgrounds `hover-lime` / `group-hover-lime` (app.css) turn text lime ink with a 3px lime underline, since pure lime text is unreadable on white; on dark bands links hover to lime; borders hover lime; buttons: primary/outline turn lime with dark text, lime accent inverts to deep green with lime text. Rechecked the performance checklist after branding: fonts are latin-only subsets (~91 KB incl. italic and Cinzel), local prod build Lighthouse home 73 / news 76 perf, a11y 100.

## After Brand 2026 (user requests, 2026-10-19)
- [x] `feature/literary-folio-photo`: the Literary hero folio shows the lead story's photo on the deep-green cover (SVG mountain art only when there is no photo).
- [x] `feature/logo-loader`: page loads show the Amaranth logo rotating (`LogoLoader`, `NavigationLoader` after 300 ms, inline boot spinner in index.html); reduced motion pulses instead. Skeletons inside lists stay.
- [x] `feature/sk-chart-animations`: points race lines rise from 0 and the podium and medal-table points count up (`src/lib/useTween.ts`), moving to new totals on live updates.
- [x] `feature/sk-points-race-ranges`: points race in 1h / 3h / 6h steps (latest day with results), 12h (whole edition) or Day. New RPC `sk_points_timeline` in salingkusog.sql. **Re-paste `supabase/v2/salingkusog.sql`.**
- [x] `feature/publish-permissions`: only the Super admin, Executive Editor, Managing editor, the new **Business Manager** role, and staff given access in Staff → Accounts → "Can publish and schedule articles" may publish/schedule (`app.can_publish_articles()`, `profiles.can_publish`, RPC `set_publish_access`, audited). Only SA/EE/ME give access (the Managing editor now sees the Accounts tab, publishing switch only). Everyone else saves drafts and submits for review. Granted staff publish articles they can already open (their own; section editors their sections). Front page, settings and the board stay with SA/EE/ME. **Re-paste `supabase/v2/schema.sql`, then salingkusog.sql and stats.sql.**

- [x] `fix/security-hardening` (security review, 2026-10-19): a page number past the end (`?page=99999`) shows an empty page instead of a database error (`pastLastPage`); medals and results now push live too (Realtime on `sk_placements`; a score or medal refreshes the medal tally, points race and winners, polling every minute stays as fallback); `set_publish_access` revoked from anon; footer social links accept only http(s); `Content-Security-Policy-Report-Only` in vercel.json (check the browser console on a preview, then rename to `Content-Security-Policy`); React `fetchpriority` warning fixed. Probed live as a signed-out visitor: staff tables, inbox, drafts, stats and staff RPCs all closed. **Re-paste salingkusog.sql.**
  Not fixed (recommendations): CAPTCHA (e.g. Cloudflare Turnstile) on comments, submissions and contact, since rate limits are per email; anonymous intake uploads have no rate limit (clean orphans or move upload behind the submit RPC); Supabase Auth settings: turn off public sign-ups if staff are invited, leaked-password protection, MFA for SA/EE.
- [x] `feature/sk-official-tally`: medal tally shows "Results in: X of Y matches" with a progress bar (cancelled matches left out); once every match is final it reads "Official and final medal tally", names the overall champion (co-champions on a tie) and the 1st and 2nd runners-up. Medal table rows 1–3 get gold, silver and bronze tints (ties share the tint). Fixture: `/dev/salingkusog/final`.
- [x] `feature/turnstile-captcha`: comments, story and event submissions and contact go through `POST /api/submit` (api/submit.ts) with a Cloudflare Turnstile check (invisible unless a visit looks automated; `<Turnstile />` + `sendForm`). Attachments upload with one-time signed links issued after the check, then a signed 30-minute ticket saves the submission. The four form RPCs are service-role only and the anonymous intake upload policy is gone. `npm run dev` serves /api/submit (dev plugin in vite.config.ts) with Cloudflare's test keys. **Deploy order:** set Vercel env `VITE_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (Production + Preview) and deploy, *then* re-paste schema.sql (pasting first breaks the forms on the old deploy).
- [x] `feature/sk-auto-brackets`: newsroom **Build schedule** per event (Sports & events tab): single elimination (+ bronze game, byes for odd fields), round robin, or the new **round robin + final** format; factions in seed order, first game time, gaps between rounds/games, venue. `public.sk_build_schedule` creates the games with `source_a/_b` (seed / winner / loser / rank) and `app.sk_resolve` fills sides in as results come: winners and losers when a game is final, a round-robin round once the previous one is done, the final from the standings (`app.sk_rr_table`: wins, difference, head-to-head, points, seed). A started game never changes (the edit that would change it is refused); knockout games can't end tied. Medals stay staff-confirmed: Results shows "Ready to confirm" and pre-fills the podium, and the scorekeeper links there after an event's last game. Public: bracket columns fixed (a Final saved with the semifinals' round order gets its own column), "Winner of Semifinal 1" / "2nd in the standings" / "After Round 1" instead of TBD, round names on cards, winner bold with a check. Fixtures: `/dev/salingkusog/sports/auto-bracket`, `/auto-round-robin`. **Re-paste salingkusog.sql.**
  Games entered before this (CSV or by hand) have no sources, so they keep working as before but don't fill in by themselves.
- [x] `feature/sk-contests`: **contests** for events where every faction competes at once (dance, Pinoy pop, folkdance, hip-hop, GMBM painting, laro ng lahi, swimming, athletics). Newsroom **Create contest** (timed or judged events): one session (`sk_matches.is_contest`, no sides) with every faction as an `sk_entries` row in faction order or a random draw (`public.sk_create_contest`). The contest scorekeeper takes each entry's result (time like 1:02.45, distance or points; unit "s" = fastest wins, else highest wins) or, for judged events, the place the judges announce (shared places allowed); Did not start / Did not finish / Disqualified get no place; Finish needs every result. Straight finals, one athlete per faction (`unique (match_id, faction_id)`). Medals stay staff-confirmed (Results "Ready to confirm", pre-filled from the places). Public: contest cards (line-up logos, then the top 3), results or performance order on the sport page, results strip and schedule faction filter include contests, live via Realtime on `sk_entries`. Fixtures: `/dev/salingkusog/sports/contest-race`, `/contest-dance`. **Re-paste salingkusog.sql.**

**Next:** the user opens the `develop` → `main` PR. Nothing else queued.

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
| B1 | `feature/nav-more-menu` | ✅ |
| B2 | `feature/section-news` | ✅ |
| B3 | `feature/section-feature` | ✅ |
| B4 | `feature/section-literary` | ✅ |
| B5 | `feature/section-blogs` | ✅ |
| B6 | `feature/section-specials` | ✅ |
| B7 | `feature/section-views` | ✅ |
| B8 | `feature/section-science-technology` | ✅ |
| B9 | `feature/section-investigative` | ✅ |
| B10 | `feature/section-explainer` | ✅ |
| B11 | `feature/section-bulletin` | ✅ |
| B12 | `feature/section-stories` | ✅ |

## Decisions log
- 2026-10-18 Statistics: keep Vercel Web Analytics (`@vercel/analytics`) alongside the first-party statistics (user's choice). The privacy page mentions it.
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
