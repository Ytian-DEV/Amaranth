**Title:** AMARANTH v2 — Figma redesign, newsroom CMS, Salingkusog 2026 and statistics

## Summary

A ground-up rebuild of the Amaranth website and its staff CMS on the "Amaranth Redesign — RTSPC 2027" Figma design.

- **Public site** rebuilt to the Figma home page (desktop + mobile): utility bar, masthead, section nav with "More", mobile header/chips/drawer, ticker, lead story, Most Read, Latest Stories, Literary Folio, Sports, Views & Opinion, contribute CTA, footer. One data-driven section template replaces the 15 hand-written pages. New article page, search, archives, About, Editorial Board, story/event submission and contact forms.
- **Newsroom (`/admin`)** to the Figma admin frame: dashboard, article list + TipTap editor (autosave, revisions, media, SEO), editorial workflow (draft → submitted → in review → scheduled/published → archived; reject/return with notes), media library, staff/invites/contributors/editorial board, submission and event review, comment moderation, contact inbox, front-page curation, sections/categories and site settings.
- **Salingkusog 2026 (intramurals):** a public hub at `/salingkusog` with the Medal Tally, live Schedule & Results, Winners per Game, Factions, Sports with brackets, Match Recaps and a Venue Guide. A Sports section landing has a Salingkusog block, and a Hunger Games–style countdown runs at `/salingkusog-2026/countdown`. In the newsroom, staff set up the edition, factions, sports, venues and athletes, import the schedule from CSV, keep live scores from a phone, record results, medals and awards, and download MVP / Athlete of the Day social cards as PNGs. Score updates reach readers in realtime.
- **Statistics:** first-party reader statistics with no third-party service and no cookies. `/admin/statistics` shows pageviews, article views, visitors, read time, shares, top articles, authors, sections, traffic sources, devices and staff active time. Only the Super admin, Executive Editor and Managing editor can see it, and the database enforces this. Visitor ids are hashed with a daily-rotating salt, Do Not Track is respected, and a new `/privacy` page explains it all.
- **Database:** a fresh, re-runnable Supabase schema (`supabase/v2`) with RLS on every table, a workflow trigger, rate-limited public RPCs and storage policies. The Salingkusog and statistics add-ons are separate re-runnable files. 216 local SQL checks cover it.
- **Sharing/SEO:** Open Graph previews for Facebook/Messenger/X via Vercel middleware, `sitemap.xml`, `rss.xml`, `robots.txt`, canonical URLs.
- **Quality:** design tokens from Figma (WCAG AA checked), ESLint, strict TypeScript, 176 unit/component tests, `/dev` fixture screens, a11y/responsive sweep at 375/768/1024/1440. The v1 app, Joomla stub, Figma-export leftovers and 38 unused packages are gone.

## Features

| # | Branch | What |
|---|---|---|
| 1 | `feature/db-v2-schema` | Fresh schema + seed, local Postgres test harness (`npm run db:test`) |
| 2 | `feature/tooling-design-system` | ESLint, typecheck, Vitest, Tailwind v4, Figma tokens, fonts, component kit, router |
| 3 | `feature/auth-staff` | Staff sign-in (PKCE), forgot/set password (invites), role guards |
| 4 | `feature/public-shell-home` | Header, footer, mobile nav, Figma home page |
| 5 | `feature/section-pages` | `/:section` template, categories, pagination, `/latest`, 404, old-URL redirects |
| 6 | `feature/article-page` | Reading page, sanitised body, authors, tags, related, share, views, comments |
| 7 | `feature/search-archives` | Full-text search, tag pages, print issues, archives by month |
| 8 | `feature/submissions-contact` | Submit a story, report an event, contact (uploads, honeypot, rate limits) |
| 9 | `feature/cms-shell-dashboard` | Newsroom layout + dashboard |
| 10 | `feature/cms-article-editor` | Article list + TipTap editor |
| 11 | `feature/cms-editorial-workflow` | Notes/activity, revisions, review queue |
| 12 | `feature/cms-media-library` | Media library + picker |
| 13 | `feature/cms-people-board` | Accounts, invites, contributors, editorial board; About + Board pages |
| 14 | `feature/cms-site-settings` | Intake review, front page, moderation, inbox, sections, settings |
| 15 | `feature/seo-sharing` | OG middleware, sitemap, RSS, robots, `vercel.json` headers |
| 16 | `feature/content-migration` | Skipped — fresh database chosen |
| 17 | `feature/v2-polish` | Legacy removal, dependency cleanup, a11y sweep, README |
| 18 | `feature/perf-pass` | Eager shell, CLS 0, chunks, image compression, Lighthouse report |
| — | `feature/upgrade-tiptap-3` | TipTap 3.32 (fixes `@tiptap/core` advisory) |
| — | `feature/upgrade-vite-7` | Vite 7.3, Vitest 5, Tailwind 4.3 — `npm audit` 0 vulnerabilities |
| — | `fix/router-test-timeout` | Test timing fix + `npm run check` gate |

**Phase 2 — Salingkusog (Track A) and statistics**

| # | Branch | What |
|---|---|---|
| A1 | `feature/salingkusog-db` | `salingkusog.sql`: editions, factions, sports/events, venues, matches, placements, athletes, awards, team; medal table and points views; RLS; Realtime on matches |
| A2 | `feature/salingkusog-team-access` | "Executive Editor" label; Salingkusog team page (three managing roles only); sidebar entry |
| A3 | `feature/salingkusog-cms-setup` | Edition, factions (logos), sports & events, venues; CSV schedule import |
| A4 | `feature/salingkusog-scorekeeper` | Phone scorekeeper, results and medals, winners, MVP / Athlete of the Day, athletes |
| A5 | `feature/salingkusog-medal-tally` | Hub header and Medal Tally (podium, table, points race, live & up next) |
| A6 | `feature/salingkusog-schedule` | Schedule & Results by day, filters, schedule PDF, realtime |
| A7 | `feature/salingkusog-winners` | Winners per Game |
| A8 | `feature/salingkusog-factions` | Factions list and Faction Profile |
| A9 | `feature/salingkusog-sports-bracket` | Sports list and sport page with bracket |
| A10 | `feature/salingkusog-match-recap` | Match Recap (scoreline, box score, linked article) |
| A11 | `feature/salingkusog-venues` | Venue Guide |
| A12 | `feature/sports-landing` | Sports section landing with the Salingkusog block |
| A13 | `feature/salingkusog-social-cards` | MVP (1080×1350) and Athlete of the Day (1080×1080) PNG cards |
| — | `feature/salingkusog-countdown`, `feature/countdown-launch` | Countdown page with link previews, newsroom on/off toggle, launch animation |
| — | `fix/nested-dialog-close` | Media picker no longer closes the form it was opened from (logos and photos now save) |
| — | `fix/sk-more-categories` | Combat sports, Pageant and Others categories |
| — | `feature/statistics` | First-party statistics, `/api/e`, `stats.sql`, `/admin/statistics`, `/privacy` (see `docs/v2/STATS.md`) |

## Database — apply in this order (fresh / emptied project)

1. `supabase/v2/schema.sql`
2. `supabase/v2/salingkusog.sql`
3. `supabase/v2/stats.sql` (enable `pg_cron` first, so its nightly job is scheduled; re-run it if you enable pg_cron later)
4. `supabase/v2/seed.sql`
5. *(optional)* `supabase/v2/seed_board.sql` — current editorial board from v1 (edit the term label first)

All of them are re-runnable, in any order after the first paste. Full guide: `docs/v2/DB.md`; statistics: `docs/v2/STATS.md`.

## Environment variables (Vercel)

| Name | Where | Value |
|---|---|---|
| `VITE_SUPABASE_URL` | build | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | build | anon public key |
| `VITE_SITE_URL` | build | `https://<production domain>` |
| `SITE_URL` | runtime (middleware, /api) | same as above |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | runtime (optional) | fall back to the `VITE_` values |
| `SUPABASE_SERVICE_ROLE_KEY` | runtime (`/api/e` only), **Production** | `service_role` key. Never prefix it with `VITE_`. Without it the site counts article views the old way and Statistics stay empty. |

Never set `VITE_ENABLE_FIXTURES` or `VITE_STATS_DEBUG` on Vercel.

## Supabase settings

- Authentication → Sign In / Providers → Email: **turn off "Allow new users to sign up"** (staff are invited).
- Authentication → URL Configuration: Site URL = production URL; Redirect URLs: `https://<domain>/admin/set-password`, `https://<preview-domain>/**`, `http://localhost:3000/**`.
- Database → Extensions: enable **`pg_cron`** before pasting `stats.sql`. It schedules `amaranth-stats-nightly` (daily rollups and retention). Also schedule `app.publish_due_articles()` every 5 minutes (see DB.md). Check both with `select * from cron.job;`.
- Realtime: `salingkusog.sql` adds `sk_matches` to the `supabase_realtime` publication, so live scores need no dashboard setup.

## Breaking changes

- **New database.** v1 tables are not migrated; v1 content stays in the old project unless exported/imported separately.
- **Staff access is invite-only.** Old v1 logins don't carry over; add each person in Staff → Invites (or `staff_invites`) and invite them from Supabase Auth.
- **URLs:** `/dashboard` → `/admin`; `/features` → `/feature`; `/blog` → `/blogs`; `/s&t` → `/science-technology`; `/submit-article` → `/submit` (all redirect). Articles move from `/article/:id` to `/article/:slug`.
- Fonts are now Fraunces + Inter (Montserrat/Trajan removed).
- Build requires Node ≥ 20.19 (Vite 7); Vercel's default Node 22 is fine.
- **Privacy:** the site now records anonymous reader statistics and newsroom active time (explained on `/privacy`). Vercel Web Analytics stays on.

## Deploy day

1. **Backup:** Supabase → Database → Backups → download (and export storage files you need).
2. **Database:** in the new/emptied project enable `pg_cron`, then paste `schema.sql`, `salingkusog.sql`, `stats.sql` and `seed.sql` (and optionally `seed_board.sql`).
3. **First admin:** `insert into public.staff_invites (email, role) values ('<you>', 'super_admin');` then Authentication → Users → Invite user; accept the email and choose a password.
4. **Settings:** auth settings above; Vercel env vars above (including `SUPABASE_SERVICE_ROLE_KEY`).
5. **Salingkusog data:** in the newsroom, create the 2026 edition, factions, sports & events and venues, and import the schedule. Set the countdown time on the Edition tab if the countdown page should be on.
6. **Preview:** deploy `develop` to a Vercel preview; run the smoke test and manual checklist below on it.
7. **Merge** this PR into `main` → production deploy.
8. **Smoke test production:** `/`, a section, `/salingkusog`, `/search?q=`, `/sitemap.xml`, `/rss.xml`, `/robots.txt`, staff sign-in, a private-window visit where `/api/e` returns 204 (Network tab), publish a test article and paste its link into the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/); unpublish it.
9. **Rollback:** in Vercel, promote the previous production deployment (instant). The old Supabase project is untouched, so pointing the previous deployment's env vars back to it restores v1 fully.

## Manual test checklist

**Reader (signed out)**
- [ ] Home matches Figma on desktop and phone; ticker, Most Read, Folio, Sports, Views render
- [ ] Section page: categories filter, pagination, empty category
- [ ] Article: share buttons (Facebook, Messenger on phone, X, copy), related stories, author bio
- [ ] Post a comment → "awaiting moderation"; it appears only after approval
- [ ] Search by word, by section/date, tag link from an article; archives by issue and by month
- [ ] Submit a story with a PDF + photo; report an event; send a contact message; 4th message within 10 min is rate-limited
- [ ] Mobile drawer: open/close with Esc, focus returns; no sideways scrolling at 375 px
- [ ] Footer → Privacy opens `/privacy`

**Salingkusog (reader)**
- [ ] `/salingkusog` Medal Tally: podium, table, points race, live & up next (desktop and phone)
- [ ] Schedule: day tabs and filters; a score changed in the newsroom updates here without reloading
- [ ] Winners, Factions → Faction Profile, Sports → bracket, a Match Recap with its linked article, Venues
- [ ] `/sports` shows the Salingkusog block
- [ ] `/salingkusog-2026/countdown`: counts down in Manila time; Continue plays the launch and opens the hub; Esc skips it; the Facebook link preview shows the countdown image; with the toggle off the page redirects to the hub

**Staff writer / contributor**
- [ ] Invite → set password → sign in lands on dashboard ("My drafts")
- [ ] New article autosaves; cover upload; tags; authors; preview link shows draft banner
- [ ] Submit for review → editing locks; withdraw → editable again
- [ ] Cannot see others' drafts, cannot publish, cannot open Staff/Settings admin tabs

**Section editor**
- [ ] Sees submissions for own sections only; start review, return with a note, reject
- [ ] Note appears in the writer's activity timeline
- [ ] Moderate comments; read inbox; review submissions and convert one to a draft

**Executive Editor (`editor_in_chief`) / managing editor / super admin**
- [ ] Publish, schedule (goes live on time), archive, unpublish
- [ ] Front page: set lead story, folio pull quote, manual ticker
- [ ] Staff: change roles, deactivate, section assignments; only super admin can grant super admin; last super admin can't step down
- [ ] Media library: alt text, delete blocked while in use
- [ ] Sections & categories, desks, contact info, social links reflect on the site

**Salingkusog (newsroom)**
- [ ] Only the three managing roles see the Team page and can add or remove members; a staff writer on the team can keep score
- [ ] Edition, factions (logo upload saves), sports & events, venues, athletes; CSV schedule import
- [ ] Scorekeeper on a phone: start, score +/–, sets, finish; results and medals update the Medal Tally
- [ ] Awards → Card → Download PNG for MVP and Athlete of the Day
- [ ] Edition → Countdown page toggle: only the three managing roles can change it

**Statistics**
- [ ] As Super admin, Executive Editor or Managing editor: Statistics is in the sidebar; after a few signed-out visits on production, today's numbers, top articles, sources, devices and share clicks appear; ranges and custom dates work
- [ ] Newsroom activity shows active time in H:MM:SS that grows while a staff member works
- [ ] As a section editor or staff writer: no Statistics link, and `/admin/statistics` redirects to the overview
- [ ] With Do Not Track on, a visit is counted but no reading time or shares are recorded

## Lighthouse (local production builds, see `docs/v2/PERF.md`)

| Page | Build | Mobile | Desktop | A11y | Best pr. | SEO | Transfer |
|---|---|---|---|---|---|---|---|
| `/` | v1 | 56 | 83 | 91 | 96 | 83 | 1,628 KB |
| `/` | v2 | **79** | **99** | **100** | 96 | 92* | **246 KB** |
| `/dev/home` (Figma content) | v2 | 74 | 96 | 100 | 96 | 92* | 349 KB |
| `/dev/article` | v2 | 77 | 97 | 100 | 96 | 92* | 349 KB |

\*Only `robots.txt` fails locally (served by a Vercel function in production). Re-measure on the preview with real content.

## Screenshots to attach

- Home — desktop 1440 and mobile 375 (next to Figma frames 4:2 and 7:64)
- Section page, article page (with comments), search results, archives
- Staff sign-in
- Newsroom dashboard (next to Figma frame 8:101), article editor, media library, submission review, settings → front page
- Salingkusog Medal Tally and Schedule (desktop and phone), countdown page, scorekeeper on a phone, one social card
- `/admin/statistics` (desktop and phone)
- Facebook Sharing Debugger result for one article

## Known follow-ups

- Optional export/import of v1 articles if they should live in the new database.
- Katalon test project in the untracked `Amaranth/` folder: keep in its own repo or delete.
- Salingkusog faction names and colours, and the 5/3/1 medal points, are data: confirm them in the newsroom before the games.
- Track B (section-specific layouts B1–B12) follows in a separate PR.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
