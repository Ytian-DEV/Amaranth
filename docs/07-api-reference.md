---
title: "API and Integration Reference"
subtitle: "Amaranth v2 — Vercel endpoints, database RPCs and direct table access"
version: "1.0"
date: "2026-10-19"
---

# Document control

| Field | Value |
|---|---|
| Title | API and Integration Reference |
| Document ID | AMR-DOC-07 |
| Version | 1.0 |
| Date | 2026-10-19 |
| Author | Amaranth development team [TO CONFIRM: names] |
| Status | Final draft for defense |
| Sources | `api/*.ts`, `middleware.ts`, `supabase/v2/*.sql` grants, `src/lib/database.types.ts` |

# Contents

1. Overview and conventions
2. Vercel endpoints
3. Routing middleware
4. Database RPCs (public)
5. Direct table access through PostgREST
6. Realtime channels
7. Error codes
8. External integrations

\newpage

# 1. Overview and conventions

There are **no server actions** (this is a Vite single-page app, not Next.js). Clients use three kinds of interface:

| Interface | Base | Auth |
|---|---|---|
| Vercel functions | `https://<site>/api/*` | None (public) or Turnstile token; secrets stay on the server |
| Supabase RPCs | `POST https://<project>.supabase.co/rest/v1/rpc/<name>` (called as `supabase.rpc(name, args)`) | Anon key for readers; user JWT for staff; service key from `/api` only |
| Supabase tables | `GET/POST/PATCH/DELETE /rest/v1/<table>` (called as `supabase.from(table)`) | Same as RPCs; RLS decides rows |

"Who can call" below means the database grant **and** the checks inside the function. RLS still applies inside `security invoker` functions.

# 2. Vercel endpoints

## 2.1 `POST /api/submit` — public forms gateway

File: `api/submit.ts`, `api/_lib/forms.ts`. Caller: any browser with a valid Turnstile token. Uses `SUPABASE_SERVICE_ROLE_KEY` and `TURNSTILE_SECRET_KEY`.

**Request (step 1, or the only step without files):**

```json
{
  "kind": "article",
  "token": "<turnstile token>",
  "args": {
    "p_name": "Sample Reader", "p_email": "reader@example.com", "p_affiliation": "BS Agriculture",
    "p_section_slug": "news", "p_title": "Sample title", "p_summary": null,
    "p_body": "Text …", "p_website": null
  },
  "files": [{ "name": "story.pdf", "mime": "application/pdf", "size": 120000 }]
}
```

| `kind` | RPC | Allowed `args` |
|---|---|---|
| `comment` | `submit_comment` | `p_article_id, p_name, p_email, p_body, p_parent_id, p_website` |
| `article` | `submit_article` | `p_name, p_email, p_affiliation, p_section_slug, p_title, p_summary, p_body, p_website` (+ files) |
| `event` | `submit_event_report` | `p_organization, p_contact_name, p_contact_email, p_event_title, p_event_date, p_venue, p_summary, p_website` (+ files) |
| `contact` | `send_contact_message` | `p_name, p_email, p_subject, p_category, p_message, p_website` |

**Responses:**

| Status | Body | When |
|---|---|---|
| 200 | `{ "id": "<uuid>" }` | Saved (no files, or step 2) |
| 200 | `{ "uploads": [{ "path": "submissions/<uuid>/1-story.pdf", "token": "…" }], "ticket": "<signed>" }` | Step 1 with files: upload each file with `storage.from('intake').uploadToSignedUrl(path, token, file)`, then repeat the request with `"ticket"` instead of `"token"` |
| 400 | `{ "message": "Unknown form." }` / `"Attach at most 5 files."` / database validation message | Bad input |
| 403 | `{ "message": "Please complete the security check and try again." }` | Turnstile failed |
| 403 | `{ "message": "This form expired. Please send it again." }` | Ticket forged, expired (30 min) or for different content |
| 413 | `{ "message": "That's too much text to send." }` | Body over 200 KB |
| 501 | `{ "message": "Forms aren't set up yet…" }` | Missing server environment variables |
| 502 | `{ "message": "…" }` | Upstream (Supabase) error |

Browser helper: `sendForm(kind, args, files)` in `src/lib/sendForm.ts`.

## 2.2 `GET /api/r?p=<path>[&a=object]` — edge-cached public reads

File: `api/r.ts`. Caller: browsers of signed-out readers (through `src/lib/edgeCache.ts`). Forwards `GET /rest/v1/<path>` with the anon key and caches successes for 60 s (`s-maxage=60, stale-while-revalidate=300`). Only resources in `CACHEABLE` are allowed: `article_cards`, `articles`, `article_authors`, `article_tags`, `tags`, `sections`, `categories`, `site_settings`, `home_slots`, `publication_issues`, `team_terms`, `team_members`, `department_contacts`, `media_assets`, `sk_editions`, `sk_factions`, `sk_sports`, `sk_events`, `sk_venues`, `sk_athletes`, `rpc/most_read_articles`, `rpc/archive_months`. `a=object` returns a single object (`.single()`). Errors: 400 "Not a cacheable read"; 501 if not configured.

Example: `/api/r?p=sections%3Fselect%3D*%26order%3Dnav_order.asc`

## 2.3 `POST /api/e` — statistics ingest

File: `api/e.ts`, `api/_lib/traffic.ts`. Caller: the site's own pages (origin must be the site), sent with `navigator.sendBeacon`. Always answers `204` (or `501` when statistics are not configured, `405` for GET).

```json
{ "v": "<visitor id>", "s": "<session id>",
  "e": [ { "t": "pv", "id": "<uuid>", "path": "/article/sample", "ref": "https://www.facebook.com/", "us": "fb" },
         { "t": "eng", "id": "<uuid>", "secs": 74, "scroll": 82 },
         { "t": "share", "path": "/article/sample", "ch": "facebook" } ] }
```

Limits: body ≤ 16 KB, ≤ 25 events; bots dropped by user agent; device, browser and OS reduced to families; the IP address is never forwarded. Calls `stats_ingest` with the service key.

## 2.4 `GET /api/sitemap` (`/sitemap.xml`), `GET /api/rss` (`/rss.xml`), `GET /api/robots` (`/robots.txt`)

Files: `api/sitemap.ts`, `api/rss.ts`, `api/robots.ts`. Public, edge-cached. The sitemap lists sections and live articles; RSS lists the latest live articles; robots allows crawling and points to the sitemap.

# 3. Routing middleware

File: `middleware.ts` (matcher: `/article/:slug*` and top-level pages except `api`, `assets`, `admin`, `dev` and files). For crawler user agents only, it fetches the article (or section) with the anon key and returns `index.html` with `<title>`, description, canonical URL and Open Graph/Twitter tags (escaped by `escapeHtml`). Regular browsers pass through (`x-middleware-next`).

\newpage

# 4. Database RPCs (public)

## 4.1 Reader RPCs (anon and authenticated)

| RPC | Parameters | Returns | Notes |
|---|---|---|---|
| `record_article_view` | `p_article_id uuid` | void | Counts one view; dedupe handled with statistics (one per visitor per 30 min) |
| `most_read_articles` | `p_days int = 7`, `p_limit int = 5` | rows: id, slug, title, section_slug, section_name, category_name, published_at, views | "Most read" lists |
| `search_articles` | `p_query text`, `p_section text = null`, `p_from date = null`, `p_to date = null`, `p_limit int = 20`, `p_offset int = 0`, `p_live_only bool = true` | rows: id, slug, title, excerpt, section, category, published_at, status, cover, rank, total_count | Full-text search; invoker (RLS applies) |
| `archive_months` | — | rows: month, articles | Archive navigation |
| `sk_countdown` | — | title, subtitle, starts_on, countdown_at | Only while the countdown is switched on; works before the edition is published |
| `sk_points_timeline` | `p_edition_id uuid`, `p_hours int` (1, 3, 6 or 12) | rows: faction_id, bucket_end, points | Points race in hour steps; error 22023 for other hour values |

Example (supabase-js):

```ts
const { data } = await supabase.rpc('search_articles', { p_query: 'intramurals', p_section: 'sports', p_limit: 12 });
```

## 4.2 Staff RPCs (authenticated; further checks inside)

| RPC | Parameters | Returns | Who | Errors |
|---|---|---|---|---|
| `transition_article` | `p_article_id uuid`, `p_to article_status`, `p_note text = null`, `p_scheduled_for timestamptz = null` | the updated `articles` row | Per workflow rules (FR-014, FR-016) | 42501 "You cannot move this article from X to Y", 22023 "Pick a future time to schedule", 42501 "Article not found or not editable" |
| `add_article_note` | `p_article_id uuid`, `p_note text` | void | Anyone who can view the article | 42501 |
| `convert_intake_to_article` | `p_kind text` ('submission' or 'event'), `p_intake_id uuid`, `p_category_id uuid` | new article id | Editors | 42501 |
| `set_publish_access` | `p_profile_id uuid`, `p_allowed bool` | void | SA, EE, ME | 42501 "Only the Super admin, Executive Editor or Managing editor…", P0002 unknown staff member |
| `dashboard_stats` | — | jsonb: published, published_this_week, scheduled, drafts, in_review, views_this_month, views_last_month | Staff (values limited by role) | — |
| `media_usage` | `p_asset_id uuid` | integer (number of references) | Staff | — |
| `staff_heartbeat` | — | integer (seconds credited) | Staff | — |
| `stats_overview` | `p_from date`, `p_to date` | jsonb summary and trend | SA, EE, ME | 42501 |
| `stats_articles` | `p_from`, `p_to`, `p_limit int = 20` | top articles with views, visitors, read time, scroll, finish rate, shares | SA, EE, ME | 42501 |
| `stats_authors` | `p_from`, `p_to` | per contributor | SA, EE, ME | 42501 |
| `stats_sections` | `p_from`, `p_to` | per section and category | SA, EE, ME | 42501 |
| `stats_breakdown` | `p_from`, `p_to`, `p_dim text` (source, referrer, device, browser, os) | value, pageviews, visitors | SA, EE, ME | 42501 |
| `stats_share_channels` | `p_from`, `p_to` | channel, shares | SA, EE, ME | 42501 |
| `stats_staff_usage` | `p_from`, `p_to` | per staff: active seconds, days active, last active | SA, EE, ME | 42501 |

## 4.3 Salingkusog RPCs (authenticated; Salingkusog team)

| RPC | Parameters | Returns | Errors |
|---|---|---|---|
| `sk_set_placements` | `p_event_id uuid`, `p_rows jsonb` — `[{ "place": 1, "faction_id": "…", "athlete_id": null, "result": "12.84s", "awarded_on": "2026-10-27" }]` | number of rows saved | 42501 "Only the Salingkusog team can enter results.", 22023 "Results must be a list." |
| `sk_build_schedule` | `p_event_id uuid`, `p_format text` (bracket, round_robin, round_robin_final), `p_seeds uuid[]` (2–16 factions in seed order), `p_first_at timestamptz`, `p_round_gap_hours int = 24`, `p_game_gap_minutes int = 90`, `p_venue_id uuid = null`, `p_bronze bool = true` | number of games created | 42501 not on the team; 22023 invalid format, seeds, missing time; 55000 "This event already has games played…" |
| `sk_create_contest` | `p_event_id uuid`, `p_at timestamptz`, `p_venue_id uuid = null`, `p_round text = 'Final'`, `p_factions uuid[] = all`, `p_shuffle bool = false` | session id | 42501; 22023 "Contests are for timed, measured or judged events.", "Pick at least one faction." |

Example:

```ts
await supabase.rpc('sk_build_schedule', {
  p_event_id: eventId, p_format: 'bracket', p_seeds: [f1, f2, f3, f4],
  p_first_at: '2026-10-26T08:00:00+08:00', p_round_gap_hours: 24, p_game_gap_minutes: 90,
});
```

## 4.4 Service-role RPCs (called only by `/api`)

| RPC | Parameters | Purpose | Limits |
|---|---|---|---|
| `submit_comment` | `p_article_id, p_name, p_email, p_body, p_parent_id, p_website` | New pending comment | 5 per email per 10 min; article must be live and allow comments; replies only to approved comments |
| `submit_article` | `p_name, p_email, p_affiliation, p_section_slug, p_title, p_summary, p_body, p_files jsonb, p_website` | New story submission | 3 per email per hour; files must exist in `intake` |
| `submit_event_report` | `p_organization, p_contact_name, p_contact_email, p_event_title, p_event_date, p_venue, p_summary, p_files, p_website` | New event report | 3 per email per hour |
| `send_contact_message` | `p_name, p_email, p_subject, p_category, p_message, p_website` | New contact message | 3 per email per 10 min |
| `stats_ingest` | `p_visitor, p_session, p_events jsonb, p_device, p_browser, p_os` | Statistics events | 25 events per batch; rate-limited |

In all form RPCs a non-empty `p_website` (honeypot) returns a fake success without saving.

\newpage

# 5. Direct table access through PostgREST

Most screens read and write tables directly with supabase-js; RLS decides the rows. Summary by audience (full policies in AMR-DOC-04 Appendix F):

| Audience | Read | Write |
|---|---|---|
| Anonymous | `sections`, `categories` (active), `tags`, `media_assets`, `contributors` (public), `publication_issues` (published), `articles` (live), `article_authors`/`tags`/`media` (live), `article_comments` (approved on live), `home_slots`, `team_terms`, `team_members`, `department_contacts`, `site_settings` (public), `article_cards`, Salingkusog tables and views of published editions | none |
| Staff | the above plus own and section articles, revisions, activity, profiles, staff-only settings | as allowed by role (AMR-DOC-06 §3) |
| Editors | plus comments (all), submissions, event reports, intake files, contact messages | moderation and review fields |
| SA, EE, ME | plus statistics tables | settings, board, issues, home slots (per helper) |

Typical calls:

```ts
// live articles of a section, newest first
supabase.from('article_cards').select('*').eq('section_slug', 'news').order('published_at', { ascending: false }).range(0, 11);
// update a live score (Salingkusog team)
supabase.from('sk_matches').update({ score_a: 54, score_b: 58, live_note: 'Q3' }).eq('id', matchId);
```

# 6. Realtime channels

| Channel (client) | Table filter | Effect |
|---|---|---|
| `sk-public-<edition>` (`useLiveGames`) | `sk_matches`, `sk_placements`, `sk_entries` with `edition_id = <edition>` | Invalidates hub, standings, timeline and results queries on public pages |
| `sk-match-<id>` (`useMatchRealtime`) | `sk_matches` with `id = <id>` | Keeps several scorekeepers on the same game in sync |

The publication `supabase_realtime` includes `sk_matches`, `sk_placements` and `sk_entries` (`salingkusog.sql`). Realtime respects RLS.

# 7. Error codes

| SQLSTATE | Meaning in this system | Example message |
|---|---|---|
| 42501 | Not allowed | "You cannot move this article from draft to published." |
| 22023 | Invalid input | "Pick a future time to schedule." |
| 23503 | Unknown parent | "Unknown category." |
| 23514 | Rule check failed | "A knockout game needs a winner…" |
| 55000 | State conflict | "Semifinal 2 has already started, so its teams can't change." |
| P0002 | Not found | "Unknown event." |
| PGRST103 | Page past the end (PostgREST 416) | handled as an empty page (`pastLastPage`) |

# 8. External integrations

| Service | Use | Configuration |
|---|---|---|
| Supabase | Database, Auth, Storage, Realtime, pg_cron | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Cloudflare Turnstile | CAPTCHA for public forms | `VITE_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |
| Vercel | Hosting, functions, middleware, Web Analytics | `vercel.json`; project settings |
| YouTube, Vimeo, Facebook, Spotify | Embeds allowed in article bodies | `src/lib/sanitize.ts` allow-list |
