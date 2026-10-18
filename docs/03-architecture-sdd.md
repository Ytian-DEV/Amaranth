---
title: "Software Design Document (SDD) and Architecture"
subtitle: "Amaranth v2 — layers, components, decisions and trade-offs"
version: "1.0"
date: "2026-10-19"
---

# Document control

| Field | Value |
|---|---|
| Title | Software Design Document and Architecture |
| Document ID | AMR-DOC-03 |
| Version | 1.0 |
| Date | 2026-10-19 |
| Author | Amaranth development team [TO CONFIRM: names] |
| Status | Final draft for defense |
| Basis | IEEE 1016 structure; implemented system at commit `d7f6f34` |

# Contents

1. Introduction
2. Architectural goals and drivers
3. System overview
4. Layered architecture
5. Subsystem designs
6. Cross-cutting concerns
7. Technology choices and justification
8. Architecture decision records (ADRs)
9. Trade-offs and their consequences

\newpage

# 1. Introduction

This document explains **how** Amaranth v2 is built and **why**. It covers the architecture, the design of each subsystem, and the decisions behind them. Requirements are in AMR-DOC-02 and data structures in AMR-DOC-04; diagrams referenced here (ARCH-1, DEP-1, SEQ-n …) are in AMR-DOC-05.

# 2. Architectural goals and drivers

| Driver | Consequence for the design |
|---|---|
| Small student team, no operations staff | Managed platforms only (Supabase, Vercel); no servers to patch |
| Permissions must hold even if the UI is bypassed | Rules live in PostgreSQL (RLS, triggers, security-definer helpers) |
| Readers mostly on mobile data | Code splitting, edge caching, responsive images, lazy loading |
| Live intramural scores | Supabase Realtime on the Salingkusog tables |
| No budget for third-party analytics, privacy concerns | First-party, cookie-less statistics |
| Public forms attract spam | Server-side CAPTCHA gateway, rate limits, honeypot |
| Maintainability by future student developers | TypeScript strict, small feature folders, re-runnable SQL, tests |

# 3. System overview

Amaranth v2 is a **single-page application** served from Vercel's CDN. The browser talks **directly to Supabase** (PostgREST, Auth, Storage, Realtime) using the signed-in user's JSON Web Token, or the anonymous key for readers. Because every table has RLS, the database decides what each request may see or change.

A thin **edge/server layer** on Vercel exists only where the browser cannot be trusted or where caching helps:

- `api/submit.ts` holds the Turnstile secret and the Supabase service key for public forms;
- `api/e.ts` holds the service key for statistics ingest;
- `api/r.ts` caches public reads at the edge;
- `api/sitemap.ts`, `api/rss.ts`, `api/robots.ts` and `middleware.ts` serve crawlers.

See CTX-1, DEP-1 and ARCH-1 (AMR-DOC-05).

\newpage

# 4. Layered architecture

![ARCH-1 — layered architecture.](diagrams/arch-1-layers.png)

| Layer | Contents | Rules |
|---|---|---|
| L1 Presentation | React pages and components in `src/features/{public,cms,auth}` and `src/components` | No business rules beyond what the UI needs to show or hide; permissions mirrored from the DB in `permissions.ts` for display only |
| L2 Client data | TanStack Query hooks (`*Api.ts`, `*Data.ts`), `src/lib/supabase.ts`, `edgeCache.ts`, `sendForm.ts` | All reads and writes go through hooks; cache keys per feature; realtime invalidates keys |
| L3 Edge/server | `api/*.ts`, `middleware.ts` | Stateless; secrets only here; never trusts input; Node ESM with `.js` imports |
| L4 Data and rules | `supabase/v2/*.sql`: tables, RLS, triggers, RPCs, views | The source of truth for permissions and invariants |
| L5 Platform | Supabase Auth, Storage, Realtime, pg_cron | Managed services |

Dependency rule: a layer may call only the layers below it. L1 never calls L3 directly except through L2 helpers (`sendForm`, `edgeCache`).

# 5. Subsystem designs

## 5.1 Authentication and authorisation (FR-001 – FR-008)

- **Sign-in:** `LoginPage.tsx` calls `auth.signInWithPassword`; `AuthProvider.tsx` listens to `onAuthStateChange`, loads the profile, and exposes `status` and `profile` (SEQ-1).
- **Account creation:** only through Supabase invitations. `app.handle_new_user` (trigger `on_auth_user_created`) creates a profile; if the email is in `staff_invites`, it receives that role, is activated and gets assigned sections; otherwise it is inactive.
- **Authorisation:** `app.current_role()` returns the role of the active profile. Helpers (`is_staff`, `is_admin`, `can_publish`, `can_publish_articles`, `is_editor`, `can_edit_section`, `can_view_stats`, `can_edit_sk`, `can_manage_sk_team`) are `security definer`, `stable`, with `search_path = ''`, in the private `app` schema so the API cannot call them directly.
- **Guards in the UI:** `RequireStaff` (active staff only) and `RequireRole` (per screen). These improve the experience; they are not the security boundary.
- **Profile protection:** trigger `profiles_guard` blocks email or id changes, limits role and activation changes to SA/EE, limits super_admin changes to SA, protects the last super admin, limits publishing-access changes to SA/EE/ME, and writes audit entries.

## 5.2 Editorial workflow (FR-010 – FR-026)

- **State machine** (STATE-1) enforced by `app.article_before_write` (BEFORE INSERT/UPDATE on `articles`). The trigger also derives the section from the category, builds the slug, computes reading time, sets timestamps, freezes owners' edits while an article is under review or live, and limits featuring to section editors.
- **Transitions** go through `public.transition_article(id, to, note, scheduled_for)`, which passes the note to the trigger via a transaction setting (`app.transition_note`). `app.article_after_write` logs `article_activity` and stores a `status` revision (SEQ-2).
- **Autosave and revisions:** the editor saves 2.5 s after the last change (`AUTOSAVE_MS`); revisions of kind `autosave`/`manual`/`status`; `app.prune_revisions` keeps the newest 50.
- **Scheduling without cron:** a scheduled article gets `published_at = scheduled_for`; all public reads filter with `app.is_live(status, published_at)`, so it appears on time. `app.publish_due_articles()` can flip the status for tidiness through pg_cron (optional).
- **Editor:** TipTap 3 with headings, lists, quotes, links, images from the media library and video embeds; it stores `body_json` (editor document), `body_html` (rendered) and `body_text` (search and reading time).

## 5.3 Public site and SEO (FR-030 – FR-039)

- **Routing:** `createBrowserRouter` with lazy routes; the public shell and home page are bundled eagerly because most visitors land there.
- **Sections:** one data-driven `SectionPage` plus a registry of custom landings (`sectionLandings`) for the 12 sections.
- **Article cards:** the `article_cards` view (security invoker) joins section, category, byline and cover so lists need one query.
- **Search:** `search_articles` uses the generated `tsvector` column `articles.search` with weights, plus section and date filters.
- **Edge cache:** for signed-out readers, `src/lib/edgeCache.ts` rewrites eligible GETs to `/api/r?p=…`; `api/r.ts` forwards them with the anon key and caches successful responses at the CDN for 60 s (`stale-while-revalidate=300`). Live Salingkusog data, comments and anything personal are excluded (`CACHEABLE` list).
- **Crawler previews:** `middleware.ts` detects crawler user agents and returns `index.html` with Open Graph tags for `/article/:slug` and section pages; regular browsers pass through untouched.

## 5.4 Public intake gateway (FR-040 – FR-049)

The four public forms (comment, story submission, event report, contact) call `sendForm()` in the browser, which obtains a Turnstile token and posts to `/api/submit` (SEQ-6).

1. `api/submit.ts` validates the form kind and whitelists its fields (`pickArgs`), checks attachments (≤ 5, ≤ 20 MB, allowed types — `pickFiles`), and verifies the token with Cloudflare `siteverify`.
2. With attachments, it creates **one-time signed upload URLs** in the private `intake` bucket and returns them with a **ticket** signed by HMAC-SHA-256 over the form kind, the field values, the file list and a 30-minute expiry.
3. The browser uploads the files, then posts again with the ticket; the server re-checks the ticket and calls the RPC with the service key.
4. The RPC (`submit_article`, `submit_event_report`, `submit_comment`, `send_contact_message`) validates text and email, applies the honeypot and per-email rate limit (`app.rate_limit`), checks that attached files exist, and inserts.

The RPCs are executable only by `service_role`, and the open anonymous upload policy was removed, so the gateway cannot be bypassed.

## 5.5 Media pipeline (FR-050 – FR-055)

Images are compressed in the browser (`src/lib/images.ts`) to WebP and uploaded in four widths (320, 640, 960, 1280). `media_assets` stores bucket, path, size, dimensions, alt text, caption and credit. `Img.tsx` builds `srcset`/`sizes`. Deletion is blocked while an asset is referenced (`on delete restrict` foreign keys) and `media_usage()` lists where it is used.

## 5.6 Administration (FR-060 – FR-075)

People (`cms/people`), settings (`cms/settings`) and dashboard (`cms/dashboard`) are standard list/detail screens over RLS-protected tables. `site_settings` is a key–value store (`jsonb`) with an `is_public` flag; the ticker key is editable by publishers, every other key only by admins.

## 5.7 Statistics (FR-080 – FR-084)

The tracker batches events and sends them with `sendBeacon` to `/api/e`. The function drops bots, rejects foreign origins and large bodies, classifies device/browser/OS and traffic source, and calls `stats_ingest` with the service key (no IP forwarded). The database hashes visitor ids with a daily salt, deduplicates article views, and `app.stats_nightly` (pg_cron, 00:15 Manila) rolls up daily tables and enforces retention. Read RPCs `stats_*` check `app.can_view_stats()` themselves, in addition to RLS.

## 5.8 Salingkusog engine (FR-100 – FR-127)

| Concern | Design |
|---|---|
| Data ownership | Every `sk_*` row belongs to an edition; triggers copy `edition_id` from the parent (`app.sk_inherit_edition`) so data cannot mix editions; composite foreign keys `(edition_id, id)` enforce it |
| Visibility | Public reads only for published editions (`app.sk_edition_visible`); staff see drafts |
| Write access | `app.can_edit_sk()`: SA/EE/ME always, other staff while in `sk_team` |
| Game generation | `sk_build_schedule` creates games whose sides have **sources**: `seed:n`, `winner:<id>`, `loser:<id>`, `rank:n` |
| Advancement | Trigger `sk_matches_advance` → `app.sk_resolve(event)` recomputes every generated game's sides idempotently; it refuses to change a game that is not `upcoming`; recursion is stopped with `pg_trigger_depth()` |
| Round robin ranking | `app.sk_rr_table` (SQL) and `roundRobinTable()` (TypeScript) use the same order: wins, difference, head-to-head among the tied, points scored, seed |
| Contests | A contest session is an `sk_matches` row with `is_contest = true` and no sides; its line-up and results are `sk_entries` (unique per faction); ranking in `src/lib/skContests.ts` (unit "s" → lowest wins) |
| Results and medals | `sk_set_placements` replaces an event's placements in one transaction; medals derive from places; the UI suggests a podium (`suggestedPodium`) but staff must confirm |
| Standings | Views compute medals, points and rank (`sk_medal_table`), cumulative points by day (`sk_points_by_day`), and an RPC computes hour steps (`sk_points_timeline`) |
| Live updates | Realtime publication on `sk_matches`, `sk_placements`, `sk_entries`; `useLiveGames()` invalidates the hub, standings, timeline and results queries; polling every 60 s remains as a fallback |

See ACT-2, SEQ-3, SEQ-4, STATE-2 and ERD-3.

\newpage

# 6. Cross-cutting concerns

| Concern | Approach | Evidence |
|---|---|---|
| Error handling | Database errors are raised with readable messages and codes (`42501` permission, `22023` invalid input, `55000` state conflict) and shown by `skErrorText`/`errorText` | `src/lib/errors.ts` |
| Validation | Server-side in RPCs and triggers (length checks, email check, enums, check constraints); client-side for convenience | `app.check_text`, `app.check_email` |
| Time zone | Manila time for Salingkusog (`src/lib/manila.ts`, `app.manila_today`) | |
| Accessibility | Semantic HTML, labelled controls, reduced-motion support, contrast-checked tokens | `domCheck.ts`, `check-contrast.mjs` |
| Performance | Lazy routes, vendor chunks (react, supabase, query, editor), responsive images, edge cache, debounced inputs | `vite.config.ts`, `docs/v2/PERF.md` |
| Security headers | HSTS, frame, nosniff, referrer, permissions, CSP (report-only) | `vercel.json` |
| Logging and audit | `audit_log` for access changes, team changes and publishing access; `article_activity` for workflow; `sk_matches.updated_by` | `app.audit` |
| Configuration | Environment variables (AMR-DOC-09); `site_settings` for editorial configuration | |

# 7. Technology choices and justification

| Choice | Alternatives considered | Why this one |
|---|---|---|
| React 18 + TypeScript | Vue, Svelte, plain JS | Existing v1 code and team familiarity; strong typing catches errors early |
| Vite 7 | Next.js, CRA | Fast builds; the app is a client-rendered SPA, so a server framework was unnecessary; SEO needs are covered by middleware |
| Supabase (PostgreSQL) | Firebase, custom Express + PostgreSQL | Relational data fits a newsroom and sports results; RLS gives database-enforced permissions; Auth, Storage and Realtime included; free tier |
| Vercel | Netlify, own VPS | Zero-ops hosting, CDN, serverless functions and middleware in one place |
| TanStack Query | Redux, SWR | Caching, background refresh and invalidation for server state with little code |
| Tailwind CSS v4 with design tokens | CSS modules, styled-components | Fast, consistent styling from one token file; no runtime cost |
| TipTap 3 | Quill (v1), Slate | Maintained, extensible, React-friendly; replaced the unmaintained Quill |
| DOMPurify | custom sanitiser | Proven HTML sanitiser for user-generated rich text |
| Cloudflare Turnstile | reCAPTCHA, hCaptcha | Free, privacy-friendly, invisible for most users |
| First-party statistics | Google Analytics | No cookies, no third-party data sharing, data stays in the project |
| Re-runnable SQL files | Migration tool (Supabase CLI) | Simple to apply from the dashboard by non-developers; proven idempotent by tests |

\newpage

# 8. Architecture decision records (ADRs)

Each record: context, decision, consequences. Dates come from `docs/v2/*.md` and git history.

| ID | Title | Date | Status |
|---|---|---|---|
| ADR-001 | The database is the security boundary (RLS + triggers) | 2026-10-17 | Accepted |
| ADR-002 | Fresh v2 schema instead of migrating v1 | 2026-10-17 | Accepted |
| ADR-003 | Client-rendered SPA with crawler middleware for link previews | 2026-10-17 | Accepted |
| ADR-004 | Private `app` schema for helper functions | 2026-10-17 | Accepted |
| ADR-005 | Workflow enforced by a trigger, transitions through an RPC | 2026-10-17 | Accepted |
| ADR-006 | Scheduling by `published_at` filter instead of a cron job | 2026-10-17 | Accepted |
| ADR-007 | Readers have no accounts; public writes only through validated RPCs | 2026-10-17 | Accepted |
| ADR-008 | Salingkusog standings computed by views, never typed | 2026-10-17 | Accepted |
| ADR-009 | First-party, cookie-less statistics | 2026-10-18 | Accepted |
| ADR-010 | Edge cache for public reads (`/api/r`) | 2026-10-18 | Accepted |
| ADR-011 | Public forms through a CAPTCHA gateway with service-role RPCs | 2026-10-19 | Accepted |
| ADR-012 | Generated games carry their sources; a trigger advances teams | 2026-10-19 | Accepted |
| ADR-013 | Medals are suggested, staff confirm | 2026-10-19 | Accepted |
| ADR-014 | Contests modelled as a session row plus entries | 2026-10-19 | Accepted |
| ADR-015 | Hand-written database types | 2026-10-17 | Accepted, revisit |

**ADR-001 — The database is the security boundary.**
*Context:* the browser talks directly to Supabase; any check done only in React can be bypassed with the public key. *Decision:* enable RLS on every table, express permissions as `app.*` helpers, and enforce invariants with triggers. *Consequences:* the same rules apply to the UI, the API and scripts; rules are testable in SQL (278 checks); UI permission code is a mirror that must be kept in sync.

**ADR-002 — Fresh schema.**
*Context:* the v1 schema mixed legacy columns and exposed helpers. *Decision:* option B, a new `schema.sql` pasted into a new or emptied project (`docs/v2/DB.md`). *Consequences:* clean model; v1 content is not migrated (out of scope).

**ADR-003 — SPA with crawler middleware.**
*Context:* social networks need Open Graph tags but do not run JavaScript. *Decision:* keep a Vite SPA and add Vercel routing middleware that injects tags for crawlers only. *Consequences:* simple hosting and fast navigation; search engines that run JavaScript index the SPA; crawler responses depend on Supabase availability.

**ADR-004 — Private `app` schema.**
*Context:* functions in `public` are callable over the API. *Decision:* helpers live in `app`, which is not exposed; public RPCs are explicitly granted. *Consequences:* smaller attack surface; grants must be maintained per function.

**ADR-005 — Workflow trigger plus RPC.**
*Context:* transitions must be enforced even on direct updates. *Decision:* `app.article_before_write` validates every status change; `transition_article` adds notes. *Consequences:* one place for the rules; error messages come from the database.

**ADR-006 — Scheduling by filter.**
*Context:* pg_cron may not be available or may lag. *Decision:* public queries treat scheduled articles as live once `published_at` passes. *Consequences:* exact go-live time with no job; the CMS list shows "scheduled" until the optional job flips it.

**ADR-007 — Anonymous readers.**
*Context:* reader accounts add privacy and support burden. *Decision:* no reader accounts; comments and submissions through validated, rate-limited RPCs. *Consequences:* simpler privacy story; moderation is needed for comments.

**ADR-008 — Computed standings.**
*Context:* hand-typed tallies cause disputes. *Decision:* views compute medals, points and ranks from placements. *Consequences:* one source of truth; correcting a placement corrects every page.

**ADR-009 — First-party statistics.**
*Context:* third-party analytics share reader data and need cookie consent. *Decision:* own ingest endpoint, hashed ids with rotating salts, retention limits. *Consequences:* privacy-friendly; fewer features than commercial tools; needs the service key on Vercel.

**ADR-010 — Edge cache.**
*Context:* each Supabase read cost a CORS preflight plus the request; traffic spikes during events. *Decision:* signed-out reads of slow-changing public tables go through `/api/r`, cached 60 s at the CDN. *Consequences:* faster pages and fewer database queries; up to a minute of staleness for those tables (live scores excluded).

**ADR-011 — CAPTCHA gateway.**
*Context:* per-email rate limits can be bypassed with new addresses; anonymous uploads could fill storage. *Decision:* forms go through `/api/submit` with Turnstile; uploads use signed URLs; form RPCs are service-role only. *Consequences:* bots are stopped before the database; forms depend on the Vercel function and three environment variables.

**ADR-012 — Sources on generated games.**
*Context:* staff wanted to enter only the first round. *Decision:* games store where each side comes from; `app.sk_resolve` recomputes sides after every change and refuses to alter started games. *Consequences:* brackets and round robins advance automatically; games entered before this feature do not advance.

**ADR-013 — Staff-confirmed medals.**
*Context:* medals affect the official tally. *Decision:* the system suggests the podium; a person saves it. *Consequences:* a human check on official results; one extra step per event.

**ADR-014 — Contests as session + entries.**
*Context:* dance, swimming and athletics have every faction in one session. *Decision:* reuse `sk_matches` (flag `is_contest`, no sides) for scheduling and status, and add `sk_entries` for line-up and results. *Consequences:* contests appear in schedules and live states without a parallel model; two-sided views ignore them.

**ADR-015 — Hand-written types.**
*Context:* no Supabase CLI or Docker locally when the project started. *Decision:* maintain `src/lib/database.types.ts` by hand. *Consequences:* types can drift; should be replaced by generated types (AMR-DOC-13).

# 9. Trade-offs and their consequences

| Trade-off | Benefit | Cost / risk | Mitigation |
|---|---|---|---|
| Logic in the database | Single enforcement point, testable | SQL skills needed to change rules | SQL test suite, comments in SQL files |
| Thick client | Simple hosting, fast UI | Bundle size; logic duplicated for display | Code splitting; mirrors kept small |
| Managed services | No operations | Vendor lock-in, free-tier limits | Standard PostgreSQL; schema in plain SQL |
| No migration tool | Easy manual deploys | Manual steps can be missed | Idempotent files, `docs/v2/DB.md` paste order |
| Edge cache | Speed, resilience | Short staleness | Excludes live data and personal data |
| Report-only CSP | No risk of breaking pages | Not yet blocking | Switch to enforcing after a clean preview (AMR-DOC-13) |
