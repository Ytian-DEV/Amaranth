# AMARANTH v2 — Plan

Status: **approved 2026-10-17** — user said go; DB = option B (fresh schema). See PROGRESS.md for live status.

## 1. What I found

### Repo state
| Item | Finding | Proposal |
|---|---|---|
| Current branch | `feature/edit-article-restructure`, uncommitted edits to `Dashboard.tsx` (+2.1k/−1.1k lines, adds `RankingCard`/`ReportingKpi` analytics widgets) and `src/index.css` | **Your call:** commit as WIP on that branch (recommended, keeps it recoverable), stash, or drop. v2 rebuilds the dashboard anyway. |
| `develop` | Exists locally only; remote has `main` only | Push `develop` when the first feature is merged. |
| `Amaranth/` | Not a copy of the app in the repo: it is a **gitlink** (submodule entry with no `.gitmodules`) pointing at an old clone of this same repo at `d3ea38d`, and that clone also contains a **Katalon Studio test project** (`Test Cases/`, `Object Repository/`, `Profiles/`, `Reports/`, …) | Remove the gitlink from the index in `feature/v2-polish`. **Ask:** do you want the Katalon tests kept (moved to `tests/katalon/` or their own repo) or are they abandoned? |
| `src/services/joomlaApi.ts` | Talks to nothing: placeholder config (`your-joomla-site.com`, `YOUR_API_KEY_HERE`). Only `NewsCard.tsx` imports it. | Delete. No Joomla migration needed. |
| `src/index.css` | 5,170 lines of **pre-compiled Tailwind v4 output** (a Figma Make export); Tailwind itself is not a dependency, so new classes don't work | Replace with a real Tailwind v4 build reading our tokens (see §3). |
| `src/components/figma/` | `ImageWithFallback` export leftover | Replace with an `<Img>` component (lazy, srcset, fallback). |
| Pages | 15 near-identical hand-written section pages (~210 lines each) | One data-driven `SectionPage` by slug. |
| Fonts | Montserrat + Trajan Pro in `public/fonts` | Replaced by **Fraunces + Inter** (Figma). Trajan stays only if the logo wordmark needs it (logo is an image anyway). |
| Tooling | `dev`/`build` only, no lint/typecheck/tests | Added in feature 1. |
| Deps to drop | `hono`, `next-themes`, `react-quill`, `quill`, `embla-carousel`, `cmdk`, `input-otp`, `vaul`, `react-resizable-panels`, `recharts` (unless dashboard charts stay), many unused Radix packages, `@supabase/supabase-js` aliased to a JSR build | Swap to the normal npm `@supabase/supabase-js`. |

### Related folders
- **`AMARANTH-VSU`** (GitHub `Ytian-DEV/AMARANTH-VSU`): a newer, smaller rebuild with its own Express-style `pg` server and its **own `users` table and password hashes, not Supabase**. Different architecture, so not merging.
  Worth reusing (copied in by hand, credited in commits): ESLint flat config, `tsconfig` split, `utils/sanitize.ts` (DOMPurify), `EmptyState`/`ErrorState`/`Skeleton` patterns, zod + react-hook-form for forms.
- **`amaranth-system`**: empty scaffold (0-byte `package.json`). Ignore.

### Figma file (`jpKBeBp37twnW7eXj0Nk2S`, page "Amaranth Redesign")
| Frame | Node | Contents |
|---|---|---|
| Components | `3:28` | Tag, Button (Primary / Outline / Accent), Story Card, Story Compact, Story Row (numbered "01"), Section Header (lime bar + title + rule + "See all →") |
| Homepage — Desktop | `4:2` | Utility bar (date · Baybay City, About / Editorial Board / Archives / Contact) → masthead (logo, wordmark, Log in, **Submit a Story**) → green primary nav (News, Sports, Feature, Literary, Blogs, Specials, Views, More ▾, Search) → **Latest ticker** → lead story + **Most Read** (01–04) → **Latest Stories** (3 cards) → dark-green **Literary Folio** band (pull quote + 3 pieces) → **Sports** + **Views & Opinion** columns → **Contribute CTA** (Submit an Article / Report an Event) → footer (Sections / The Publication / Follow, Staff login) |
| Homepage — Mobile | `7:64` | Menu + lockup + search header, horizontally scrolling **section chips**, ticker, lead, Latest (compact), Most Read, CTA, short footer |
| Admin Dashboard — Desktop | `8:101` | Dark-green sidebar "AMARANTH Newsroom": **Overview, Articles, Submissions (badge), Events, Media Library, Staff, Settings**, profile + Log out. Main: greeting + date + "N submissions waiting", search, **+ New Article**; 4 stat cards (Published, Drafts, Pending submissions, Readers this month); Recent Articles table (title, category tag, status pill, date, Edit); Submission Queue (Review / Decline); "Database connected" status |

**Not in Figma** (I'll design these from the same tokens and components, and show you screenshots before merging each): section page, article page, search, archives, about, editorial board, contact, submission and event-report forms, staff login / reset, CMS articles list, article editor, submissions detail, events, media library, staff, settings, 404/error, all mobile CMS screens.
There is no "Foundations" frame — tokens come from the Figma **variables** below.

## 2. Design tokens (from Figma variables)
Colours: `paper #faf8f3`, `surface #ffffff`, `ink #15201a`, `ink-muted #5e6b63`, `line #e4e0d6`, `photo #c9d6cc` (image placeholder), `green-900 #0a2e1f`, `green-700 #0e5a36`, `green-500 #1f8a4c`, `green-soft #e6f0ea`, `lime #a8d02a`, `lime-dark #6e8f0f`, `lime-soft #f1f7dc`, `alert #c8102e`.

Type: **Fraunces** (Display XL 56/1.06 bold −1.5; Headline L 32 semibold; M 22; S 17; Numeral 30 italic) and **Inter** (Body L 17/1.6, Body M 15/1.55, Meta 13 medium, UI Button 14 semibold, UI Nav 13 semibold tracked, Kicker 11 bold tracked uppercase).

**Contrast check (WCAG AA, 4.5:1 for small text):**
| Pair | Ratio | Result |
|---|---|---|
| ink / ink-muted / green-700 / alert on paper | 15.8 / 5.3 / 7.8 / 5.5 | pass |
| **green-500 on paper** (kickers "NEWS", "+6 this week") | **4.12** | **fail** → add `--green-500-text` (darker, ≥4.5) |
| **lime-dark on paper / lime-soft** ("Draft" pill, numerals) | **3.53 / 3.41** | **fail for small text** → add `--lime-dark-text`; 30px italic numerals are large text, so they pass at 3:1 |
| lime on green-900, ink on lime, white on green-700 | 8.2 / 9.4 / 8.3 | pass |

## 3. Decisions (recommendations; tell me if you disagree)
1. **Styling:** Tailwind v4 (`@tailwindcss/vite`) whose `@theme` maps to the CSS variables in `src/styles/tokens.css`. No hex values in components.
2. **UI kit:** keep **Radix primitives only where they earn it** (Dialog, DropdownMenu, Select, Popover, Tabs, Toast via `sonner`), restyled from tokens; delete the other ~30 shadcn files. Our own `Button`, `Tag`, `StoryCard`, `StoryCompact`, `StoryRow`, `SectionHeader`, `StatusPill`, `StatCard` mirror the Figma components 1:1.
3. **Router:** `react-router-dom` v7 data router, lazy route per page, `/admin/*` for the CMS (replaces `/dashboard`; old URL redirects).
4. **Data:** `@supabase/supabase-js` (npm) + **TanStack Query** for caching public reads; generated DB types.
5. **Editor:** replace Quill/react-quill (unmaintained, React 19 issues) with **TipTap** (headings, lists, quotes, links, images from media library, embeds); output sanitized HTML + plain text for search.
6. **Fonts:** `@fontsource-variable/fraunces` + `@fontsource-variable/inter`, preload latin only.
7. **Readers have no accounts.** Comments are moderated (name + email, honeypot + rate limit).
8. **Article SEO:** Vercel Edge Middleware for `/article/:slug` that injects OG/Twitter tags for bots.

## 4. Database
The current `supabase/schema.sql` is already a good base (roles, workflow statuses, sections/categories, contributors, issues, intake, team terms, RLS, buckets). It's "outdated" mainly against what v2 needs:
- **Missing for v2:** review notes / workflow history (`article_reviews`, `article_events`), article revisions + autosave, comment moderation status (pending/approved/spam), view-count RPC (anon can't write metrics today), "Most Read" and "Latest ticker" queries, homepage curation (lead story, folio pick), staff invites, audit log, per-role permission table, submissions → article conversion RPC.
- **Problems to fix:** helper functions live in `public` (callable via the API) → move to a private `app` schema; storage policy lets any writer delete any file; `article_daily_metrics` has no safe public write path; legacy compat columns (`contents`, `category`, `publish`, `published_date`, `image_url`) kept only for old code.

**Chosen: B (fresh schema).** Options considered:
- **A. Upgrade in place (recommended if production has real articles/users):** `supabase/migrations/2026xxxx_*.sql`, re-runnable, applied in order on deploy day. Needs the read-only production queries (DB.md §2) first so migrations match reality.
- **B. Fresh database:** one new `supabase/v2/schema.sql` you paste into a **new or emptied** Supabase project; old content re-imported by a script if wanted.

Either way: local test harness (Docker or local Postgres), every migration run twice, `*.test.sql` RLS tests, generated TS types.

## 5. Features (one branch each, in order)
| # | Branch | What you'll see |
|---|---|---|
| 1 | `feature/db-v2-schema` (done first) | see #2 |
| 1b | `feature/tooling-design-system` | ESLint, `typecheck`, Vitest, Tailwind v4 + tokens, fonts, Figma components, `/dev/components` preview |
| 2 | `feature/db-v2-schema` | Migrations (or fresh schema), test harness, seed, generated types |
| 3 | `feature/auth-staff` | Staff login (PKCE), forgot/reset password, role guards |
| 4 | `feature/public-shell-home` | Utility bar, masthead, nav + More, mobile drawer/chips, ticker, footer, full homepage per Figma |
| 5 | `feature/section-pages` | One `/section/:slug` template (lead + grid + category filter + pagination) replacing 15 pages; old URLs redirect |
| 6 | `feature/article-page` | Reading layout, authors, tags, related, share, view counting, moderated comments |
| 7 | `feature/search-archives` | Full-text search page, filters, archives by issue/date |
| 8 | `feature/submissions-contact` | Submit a Story, Report an Event, Contact (uploads, spam protection) |
| 9 | `feature/cms-shell-dashboard` | Figma admin dashboard with live stats, queue, recent articles |
| 10 | `feature/cms-article-editor` | TipTap editor, autosave, media, authors, tags, SEO, preview |
| 11 | `feature/cms-editorial-workflow` | draft → submitted → in review → scheduled/published, archive/reject, notes |
| 12 | `feature/cms-media-library` | Upload (compressed), browse, alt text, safe delete |
| 13 | `feature/cms-people-board` | Staff & roles, contributors, editorial board terms |
| 14 | `feature/cms-site-settings` | Sections/categories, inbox, intake, department contacts, settings, homepage curation |
| 15 | `feature/seo-sharing` | Edge OG tags, sitemap.xml, RSS, canonical URLs |
| 16 | `feature/content-migration` | Only if option B is chosen |
| 17 | `feature/v2-polish` | States, 404, a11y + responsive passes, dead-code removal (nested `Amaranth/`, Joomla, Figma leftovers, unused deps) |
| 18 | `feature/perf-pass` | Caching, images, bundle, Lighthouse before/after |

## 6. Risks
- **Production schema drift**: the file may not match prod; mitigated by the read-only queries before any migration is written.
- **No staging**: deploy day is the first real run; mitigated by backup + re-runnable migrations + rollback steps.
- **Many screens have no Figma frame**: I'll derive them from the components; you review screenshots per feature.
- **OG tags for Messenger/Facebook** require the Vercel edge function to read Supabase with the anon key at the edge.
- **Big scope** (18 branches): work spans several sessions; PROGRESS.md is the hand-off.

## 7. Open questions
1. ~~Database A or B~~ → **B** (decided).
2. ~~Uncommitted work~~ → committed as a WIP snapshot on `feature/edit-article-restructure` (not merged).
3. Katalon test project inside `Amaranth/`: keep (move) or drop?
4. Live site URL (for Lighthouse "before" numbers and canonical URLs)?
5. "Readers this month" stat: from Vercel Analytics (needs an API token) or our own `article_daily_metrics` view counts? (I recommend our own.)
6. Keep the dark-mode toggle? Figma is light-only; I'd drop it for v2.
