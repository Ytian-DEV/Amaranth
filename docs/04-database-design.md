---
title: "Database Design"
subtitle: "Amaranth v2 — ERD, data dictionary, views, functions, triggers, indexes and RLS"
version: "1.0"
date: "2026-10-19"
---

# Document control

| Field | Value |
|---|---|
| Title | Database Design |
| Document ID | AMR-DOC-04 |
| Version | 1.0 |
| Date | 2026-10-19 |
| Author | Amaranth development team [TO CONFIRM: names] |
| Status | Final draft for defense |
| Sources | `supabase/v2/schema.sql`, `salingkusog.sql`, `stats.sql`, `seed.sql`; tests in `supabase/tests/` |

# Contents

1. Overview and counts
2. Schemas, files and deployment order
3. Entity–relationship diagrams
4. Design principles and normalisation
5. Key tables explained
6. Views
7. Functions, RPCs and triggers (summary)
8. Row Level Security strategy
9. How Salingkusog results become the medal table, points and ranking
10. Indexing strategy
11. Storage
12. Testing the database
- Appendix A — Data dictionary (every table and column)
- Appendix B — Enumerated types
- Appendix C — Functions and RPCs
- Appendix D — Triggers
- Appendix E — Indexes
- Appendix F — RLS policies
- Appendix G — Storage buckets

\newpage

# 1. Overview and counts

| Object | Newsroom (`schema.sql`) | Salingkusog | Statistics | Total |
|---|---|---|---|---|
| Tables | 29 | 12 | 9 | 50 |
| Columns | — | — | — | 448 |
| Enums | 13 | 6 | 0 | 19 |
| Views | 1 | 5 | 0 | 6 |
| Functions | 39 | 18 | 19 | 76 |
| Triggers | 19 | 21 | 0 | 40 |
| Indexes | 35 | 18 | 7 | 60 |
| RLS policies (incl. storage) | 64 | 25 | 8 | 97 |
| Storage buckets | 3 | — | — | 3 |

# 2. Schemas, files and deployment order

| Schema | Purpose | Exposed through the API? |
|---|---|---|
| `public` | Application tables, views and the RPCs the app calls | Yes (subject to RLS and grants) |
| `app` | Private helpers (`app.current_role`, `app.can_publish`, …), trigger functions, `app.rate_events`, `app.stats_salts` | No |
| `auth`, `storage` | Supabase-managed | Through Supabase only |

Deployment order (all files re-runnable): `schema.sql` → `salingkusog.sql` → `stats.sql` → `seed.sql` → optional `seed_board.sql` (AMR-DOC-09).

\newpage

# 3. Entity–relationship diagrams

Four ERDs (AMR-DOC-05 §8) are generated from the SQL. The content core:

![ERD-1 — content core.](diagrams/erd-1-content.png)

![ERD-3 — Salingkusog.](diagrams/erd-3-salingkusog.png)

ERD-2 (people, intake, settings) and ERD-4 (statistics) are in AMR-DOC-05.

\newpage

# 4. Design principles and normalisation

The schema is in **third normal form (3NF)** for the transactional tables: every non-key column depends on the key, the whole key and nothing but the key. Many-to-many relationships use link tables (`article_authors`, `article_tags`, `article_media`, `profile_sections`). Enumerated values use PostgreSQL enums, so invalid states cannot be stored.

Controlled denormalisations, each maintained by the database rather than the application:

| Denormalisation | Why | How it stays correct |
|---|---|---|
| `articles.section_id` (derivable from the category) | Fast section filters and section-editor RLS checks | Set by `app.article_before_write` from the category on every write |
| `edition_id` on `sk_events`, `sk_athletes`, `sk_matches`, `sk_placements`, `sk_entries` | Simple RLS (`app.sk_edition_visible`) and edition-wide queries | Copied from the parent by `app.sk_inherit_edition`; composite foreign keys `(edition_id, id)` make a mismatch impossible |
| `articles.reading_minutes`, `articles.search` | Avoid recomputing on every read | Trigger (reading time) and a generated `tsvector` column |
| `articles.view_count`, `article_daily_views` | "Most read" without scanning events | Updated only by `record_article_view` (the trigger rejects other changes during a view count) |
| `sk_matches.winner_side` | Simple winner queries | Generated column from status and scores |
| `stats_daily_*` tables | Fast dashboards over long ranges | Rebuilt by the nightly rollup |

Computed results are **views or RPCs**, never stored: `sk_medal_table`, `sk_points_by_day`, `sk_head_to_head`, `sk_event_status`, `sk_event_leaders`, `sk_points_timeline`, `app.sk_rr_table`.

# 5. Key tables explained

| Table | Key points |
|---|---|
| `profiles` | Primary key = `auth.users.id`. `role` (`app_role`), `is_active`, `can_publish`. Only SA/EE change role and activation (trigger `profiles_guard`). |
| `staff_invites` | The only source of roles for new accounts (`app.handle_new_user`). |
| `articles` | 33 columns. `status` (`article_status`), `published_at` (public timestamp), `scheduled_for`, `is_featured`, `editorial_priority`, SEO fields, `body_json`/`body_html`/`body_text`, generated `search`. |
| `article_activity`, `article_revisions` | Audit trail of the workflow and snapshots (pruned to 50). |
| `article_comments` + `article_comment_private` | Public comment text separated from the private email (editors only). |
| `article_submissions`, `event_reports`, `intake_files` | Public intake with `intake_status`; files in the private `intake` bucket. |
| `sk_editions` | Dates, medal points (default 5 / 3 / 1), `is_current`, `is_published`, countdown fields. |
| `sk_events` | `format` (`bracket`, `round_robin`, `round_robin_final`, `timed`, `judged`), `is_team`, `result_unit`, `seeds`. |
| `sk_matches` | Games and contest sessions: `status`, scores, `periods` and `team_stats` (JSON arrays), `source_a`/`source_b`, `is_contest`, generated `winner_side`. Constraints: two different sides; final needs scores (except contests); contests have no sides; source format check. |
| `sk_entries` | Contest entries: unique `(match_id, faction_id)`; `result`, `place`, `status` (`ok`, `dns`, `dnf`, `dq`); athlete must belong to the faction (trigger). |
| `sk_placements` | Official places; check constraint ties the medal to the place (1 gold, 2 silver, 3 bronze); unique per event, place, faction and athlete. |

Full columns: Appendix A.

# 6. Views

All six views use `security_invoker = true`, so the caller's RLS applies to the underlying tables.

| View | Returns | Used by |
|---|---|---|
| `article_cards` | Article list fields joined with section, category, byline and cover | Public lists, sitemap, RSS, crawler previews |
| `sk_medal_table` | Per faction: gold, silver, bronze, total, points, rank | Medal tally, sports landing |
| `sk_points_by_day` | Cumulative points per faction for every day of the edition | Points race ("Day") |
| `sk_head_to_head` | Wins and losses between each pair of factions (final games) | Faction profiles |
| `sk_event_status` | Per event: completed (gold awarded), first and last game, live now | Header counters, progress |
| `sk_event_leaders` | Totals of each numeric stat per athlete per event | Top scorers |

# 7. Functions, RPCs and triggers (summary)

- **76 functions:** 39 newsroom, 18 Salingkusog, 19 statistics. Helper functions are `security definer` with `search_path = ''` to prevent search-path attacks; RPCs that should respect RLS (`transition_article`, `sk_set_placements`, `sk_build_schedule`, `sk_create_contest`, `sk_points_timeline`) are `security invoker`.
- **40 triggers:** workflow (`articles_before_write`, `articles_after_write`), revisions pruning, profile guard, new-user handler, Salingkusog edition inheritance, match status timestamps, knockout winner check, automatic advancement, single current edition, countdown guard, team audit, and `updated_at` touch triggers.

Lists with arguments and purposes: Appendices C and D. Callable endpoints: AMR-DOC-07.

# 8. Row Level Security strategy

1. **Every table has RLS enabled** (50 of 50). Without a matching policy, a request sees and changes nothing.
2. **Policies call role helpers**, never repeat role lists. Changing who may publish means changing one function (`app.can_publish_articles`).
3. **Read and write are separate policies.** Public data has an `anon, authenticated` select policy; writes are `authenticated` only and further limited by helpers.
4. **Private data is split into separate tables** (`article_comment_private`) rather than hidden by column, because RLS works per row.
5. **Triggers complement RLS** for rules that depend on the *change* rather than the row (status transitions, role changes, locked articles).
6. **Statistics** are readable only by `app.can_view_stats()`; the read RPCs check it again.
7. **Storage** has its own policies on `storage.objects` per bucket (Appendix F).
8. **Policy reset on re-run:** `schema.sql` drops and recreates its policies but leaves `sk_*` and `stats_*` policies alone, so files can be re-run in any order.

Examples:

| Table | Policy (simplified) | Meaning |
|---|---|---|
| `articles` | select for anon: `app.is_live(status, published_at)` | Readers see only live articles |
| `articles` | select/update for staff: own, co-authored, or `app.can_edit_section(section_id)` | Staff see their work and their sections |
| `articles` | delete: `app.is_admin()` or own draft | SA/EE delete anything; others only their drafts |
| `sk_matches` | select: `app.sk_edition_visible(edition_id)`; all: `app.can_edit_sk()` | Public sees published editions; the team edits |
| `site_settings` | all: `app.is_admin()` or (`app.can_publish()` and key = 'ticker') | Admins edit settings; publishers edit the ticker |

\newpage

# 9. How Salingkusog results become the medal table, points and ranking

**Step 1 — games and contests produce outcomes.** Two-sided games end with scores; `winner_side` is generated. Contest entries end with results or judged places. Generated games advance through `app.sk_resolve` (AMR-DOC-03 §5.8).

**Step 2 — staff confirm placements.** When an event's last game is final, the newsroom suggests places 1–3 (`suggestedPodium`): for brackets, from the final and bronze game; for round robins, from `app.sk_rr_table`/`roundRobinTable()`; for contests, from the ranked entries. Staff save them with `sk_set_placements(event_id, rows)`, which replaces the event's placements and sets `medal` from `place`. The check constraint `sk_placements_medal_matches_place` makes a wrong medal impossible.

**Step 3 — the medal table is computed** by `sk_medal_table`:

- `gold`, `silver`, `bronze` = counts of the faction's placements with that medal;
- `total` = gold + silver + bronze;
- `points` = gold × `points_gold` + silver × `points_silver` + bronze × `points_bronze` (edition settings, default 5 / 3 / 1);
- `rank` = `rank()` over the edition ordered by points, then gold, then silver (ties share a rank).

**Worked example** (anonymised factions, default points 5 / 3 / 1):

| Faction | Gold | Silver | Bronze | Points | Rank |
|---|---|---|---|---|---|
| Faction A | 2 | 0 | 1 | 2×5 + 0×3 + 1×1 = **11** | 1 (more gold than B) |
| Faction B | 1 | 2 | 0 | 1×5 + 2×3 + 0 = **11** | 2 |
| Faction C | 0 | 1 | 2 | 0 + 3 + 2 = **5** | 3 |
| Faction D | 0 | 0 | 0 | **0** | 4 |

**Step 4 — the points race.** `sk_points_by_day` builds every day of the edition (`generate_series(starts_on, ends_on)`), sums each faction's points by `awarded_on`, and returns the running total (0 before the first medal). `sk_points_timeline(edition, hours)` does the same in 1, 3 or 6-hour steps for the latest day with results, or 12-hour steps across the edition, using the placement's creation time when it falls on the award day.

**Step 5 — progress and official result.** The public tally counts finished matches over all non-cancelled matches; when all are final it shows "Official and final medal tally" with the champion (rank 1) and runners-up (`resultsProgress`, `finalHeadline`).

**Round-robin standings** (`app.sk_rr_table`): wins descending → point difference → wins against teams level on wins and difference (head-to-head) → points scored → seed order.

# 10. Indexing strategy

60 indexes support the main access paths: live-article lists by section, category and featured flag (partial indexes on live statuses); slug lookups (unique); full-text search (GIN on `articles.search`); foreign keys used in joins; Salingkusog schedule by edition and time, live games, events by round and slot; statistics by day. A performance check on 2026-10-18 confirmed matching indexes for the schema, Salingkusog and statistics queries (`docs/v2/PERF.md`). Full list: Appendix E.

# 11. Storage

| Bucket | Public | Limit | Who writes |
|---|---|---|---|
| `media` | yes | 10 MB, images | Active staff (own files); editors manage others' |
| `archives` | yes | 60 MB, PDF and images | Publishers (SA, EE, ME) |
| `intake` | no | 20 MB, images, PDF, text, Word | Only through signed upload links from `/api/submit`; editors read and delete |

# 12. Testing the database

`npm run db:test` (`scripts/db-test.mjs`) starts a throwaway PostgreSQL cluster on `127.0.0.1`, loads a Supabase stub (`00_supabase_stub.sql`), applies every SQL file **twice**, loads fixtures (one user per role), and runs 6 test files with **278 checks** (all passing on 2026-10-19). Coverage per file: public access 39, workflow 75, Salingkusog 71, brackets 28, contests 17, statistics 48. See AMR-DOC-08.

\newpage

# Appendix A. Data dictionary

Generated from `supabase/v2/schema.sql`, `salingkusog.sql` and `stats.sql` on 2026-10-19. Types are PostgreSQL types; `timestamptz` is a timestamp with time zone. "Notes" come from comments in the SQL files.

## A.1 Newsroom (`schema.sql`)

### public.profiles

One row per staff account (linked to `auth.users`). Holds the role, activation and publishing-access flag.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key references auth.users (id) on delete cascade |  |
| `email` | text | not null |  |
| `display_name` | text | not null |  |
| `avatar_url` | text |  |  |
| `bio` | text |  |  |
| `role` | public.app_role | not null default 'contributor' |  |
| `is_active` | boolean | not null default false |  |
| `last_seen_at` | timestamptz |  |  |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |
| `can_publish` | boolean | not null default false | added in schema.sql |

### public.staff_invites

Pre-authorised emails with the role (and sections) they receive when the invitation is accepted.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `email` | text | primary key check (email = lower(email)) |  |
| `role` | public.app_role | not null default 'staff_writer' |  |
| `section_slugs` | text[] | not null default '{}' |  |
| `invited_by` | uuid | references public.profiles (id) on delete set null |  |
| `accepted_at` | timestamptz |  |  |
| `created_at` | timestamptz | not null default now() |  |

### public.sections

The 12 site sections (News, Sports, …) with navigation placement and order.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `slug` | text | not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$') |  |
| `name` | text | not null |  |
| `description` | text |  |  |
| `nav_placement` | public.nav_placement | not null default 'primary' |  |
| `nav_order` | integer | not null default 0 |  |
| `accepts_submissions` | boolean | not null default true |  |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |

### public.profile_sections

Which sections a section editor may edit.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `profile_id` | uuid | not null references public.profiles (id) on delete cascade |  |
| `section_id` | uuid | not null references public.sections (id) on delete cascade |  |

Table constraints: `primary key (profile_id, section_id)`

### public.categories

Categories inside a section; `is_assignable = false` reserves a category for editors.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `section_id` | uuid | not null references public.sections (id) on delete restrict |  |
| `slug` | text | not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$') |  |
| `name` | text | not null |  |
| `description` | text |  |  |
| `sort_order` | integer | not null default 0 |  |
| `is_active` | boolean | not null default true |  |
| `is_assignable` | boolean | not null default true | writers may file into this category (editorials are editors-only, etc.) |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |

Table constraints: `unique (section_id, slug)`

### public.tags

Free-form tags for articles.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `slug` | text | not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$') |  |
| `name` | text | not null |  |
| `created_at` | timestamptz | not null default now() |  |

### public.media_assets

Uploaded files in Storage with metadata (alt text, caption, credit, size).

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `bucket` | text | not null default 'media' check (bucket in ('media', 'archives')) |  |
| `path` | text | not null |  |
| `kind` | public.asset_kind | not null default 'image' |  |
| `mime_type` | text | not null |  |
| `size_bytes` | integer | not null check (size_bytes > 0) |  |
| `width` | integer | check (width is null or width > 0) |  |
| `height` | integer | check (height is null or height > 0) |  |
| `alt_text` | text | not null default '' |  |
| `caption` | text |  |  |
| `credit` | text |  |  |
| `variants` | jsonb | not null default '[]'::jsonb check (jsonb_typeof(variants) = 'array') | resized copies for srcset: [{"width": 640, "path": "..."}] |
| `uploaded_by` | uuid | references public.profiles (id) on delete set null |  |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |

Table constraints: `unique (bucket, path)`

### public.contributors

Public bylines (staff, students, guests, faculty, alumni); optionally linked to a profile.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `profile_id` | uuid | unique references public.profiles (id) on delete set null |  |
| `name` | text | not null |  |
| `slug` | text | not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$') |  |
| `type` | public.contributor_type | not null default 'staff' |  |
| `position` | text |  |  |
| `program` | text |  |  |
| `bio` | text |  |  |
| `avatar_asset_id` | uuid | references public.media_assets (id) on delete set null |  |
| `is_public` | boolean | not null default true |  |
| `is_active` | boolean | not null default true |  |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |

### public.publication_issues

Print issues with cover and PDF.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `title` | text | not null |  |
| `slug` | text | not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$') |  |
| `volume` | integer | check (volume is null or volume > 0) |  |
| `issue_number` | integer | check (issue_number is null or issue_number > 0) |  |
| `issue_type` | public.issue_type | not null default 'regular' |  |
| `issue_date` | date | not null |  |
| `description` | text |  |  |
| `cover_asset_id` | uuid | references public.media_assets (id) on delete set null |  |
| `pdf_asset_id` | uuid | references public.media_assets (id) on delete set null |  |
| `is_published` | boolean | not null default false |  |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |

### public.articles

News stories and other pieces, with workflow status, schedule, SEO fields and full-text search vector.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `section_id` | uuid | not null references public.sections (id) on delete restrict | derived from category |
| `category_id` | uuid | not null references public.categories (id) on delete restrict |  |
| `issue_id` | uuid | references public.publication_issues (id) on delete set null |  |
| `issue_position` | integer | check (issue_position is null or issue_position > 0) |  |
| `title` | text | not null check (length(btrim(title)) > 0) |  |
| `slug` | text | not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$') |  |
| `kicker` | text |  | optional label next to the section, e.g. "Environment" |
| `dek` | text |  | subtitle / standfirst |
| `excerpt` | text | not null default '' |  |
| `body_json` | jsonb |  | editor document |
| `body_html` | text | not null default '' |  |
| `body_text` | text | not null default '' |  |
| `reading_minutes` | integer | not null default 1 |  |
| `cover_asset_id` | uuid | references public.media_assets (id) on delete restrict |  |
| `cover_caption` | text |  |  |
| `byline_override` | text |  | e.g. "By Sports Desk"; otherwise built from article_authors |
| `status` | public.article_status | not null default 'draft' |  |
| `is_featured` | boolean | not null default false |  |
| `editorial_priority` | smallint | not null default 0 check (editorial_priority between 0 and 100) |  |
| `allow_comments` | boolean | not null default true |  |
| `seo_title` | text |  |  |
| `seo_description` | text |  |  |
| `og_image_asset_id` | uuid | references public.media_assets (id) on delete restrict |  |
| `submitted_at` | timestamptz |  |  |
| `scheduled_for` | timestamptz |  |  |
| `published_at` | timestamptz |  | public timestamp; for scheduled articles it equals scheduled_for, so the article goes live by itself when that time passes (no cron required) |
| `archived_at` | timestamptz |  |  |
| `view_count` | bigint | not null default 0 |  |
| `created_by` | uuid | references public.profiles (id) on delete set null |  |
| `updated_by` | uuid | references public.profiles (id) on delete set null |  |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |
| `search` | tsvector | generated (computed) |  |

Table constraints: `constraint articles_scheduled_needs_time check (status <> 'scheduled' or scheduled_for is not null)`; `constraint articles_published_needs_time check (status not in ('published', 'scheduled') or published_at is not null)`

### public.article_authors

Many-to-many link between articles and contributors (bylines).

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `article_id` | uuid | not null references public.articles (id) on delete cascade |  |
| `contributor_id` | uuid | not null references public.contributors (id) on delete restrict |  |
| `credit_label` | text | not null default 'Author' |  |
| `position` | smallint | not null default 1 check (position > 0) |  |

Table constraints: `primary key (article_id, contributor_id)`

### public.article_tags

Many-to-many link between articles and tags.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `article_id` | uuid | not null references public.articles (id) on delete cascade |  |
| `tag_id` | uuid | not null references public.tags (id) on delete cascade |  |

Table constraints: `primary key (article_id, tag_id)`

### public.article_media

Media used inside an article (inline, gallery, attachment).

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `article_id` | uuid | not null references public.articles (id) on delete cascade |  |
| `asset_id` | uuid | not null references public.media_assets (id) on delete restrict |  |
| `usage` | public.article_media_usage | not null default 'inline' |  |
| `position` | smallint | not null default 1 |  |
| `caption` | text |  |  |

Table constraints: `primary key (article_id, asset_id, usage)`

### public.article_revisions

Snapshots of an article (autosave, manual, status); newest 50 kept.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | bigint | generated always as identity primary key |  |
| `article_id` | uuid | not null references public.articles (id) on delete cascade |  |
| `kind` | public.revision_kind | not null default 'manual' |  |
| `title` | text | not null |  |
| `body_json` | jsonb |  |  |
| `body_html` | text | not null default '' |  |
| `saved_by` | uuid | references public.profiles (id) on delete set null | audit only, unindexed |
| `created_at` | timestamptz | not null default now() |  |

### public.article_activity

Workflow history: creation, status changes and notes.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | bigint | generated always as identity primary key |  |
| `article_id` | uuid | not null references public.articles (id) on delete cascade |  |
| `actor_id` | uuid | references public.profiles (id) on delete set null | audit only, unindexed |
| `action` | text | not null check (action in ('created', 'status', 'note')) |  |
| `from_status` | public.article_status |  |  |
| `to_status` | public.article_status |  |  |
| `note` | text |  |  |
| `created_at` | timestamptz | not null default now() |  |

### public.article_daily_views

View counts per article per day (feeds "most read").

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `article_id` | uuid | not null references public.articles (id) on delete cascade |  |
| `day` | date | not null |  |
| `views` | integer | not null default 0 |  |

Table constraints: `primary key (article_id, day)`

### public.article_comments

Reader comments with moderation status and optional parent (replies).

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `article_id` | uuid | not null references public.articles (id) on delete cascade |  |
| `parent_id` | uuid | references public.article_comments (id) on delete cascade |  |
| `author_name` | text | not null check (length(btrim(author_name)) between 1 and 80) |  |
| `body` | text | not null check (length(btrim(body)) between 2 and 3000) |  |
| `status` | public.comment_status | not null default 'pending' |  |
| `moderated_by` | uuid | references public.profiles (id) on delete set null | audit only, unindexed |
| `moderated_at` | timestamptz |  |  |
| `created_at` | timestamptz | not null default now() |  |

### public.article_comment_private

Commenter email, separated so only editors can read it.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `comment_id` | uuid | primary key references public.article_comments (id) on delete cascade |  |
| `author_email` | text | not null |  |

### public.home_slots

Front-page curation: lead story and literary folio pick.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `slot` | text | primary key check (slot in ('lead', 'folio')) |  |
| `article_id` | uuid | references public.articles (id) on delete set null |  |
| `pull_quote` | text |  |  |
| `attribution` | text |  |  |
| `updated_by` | uuid | references public.profiles (id) on delete set null | audit only |
| `updated_at` | timestamptz | not null default now() |  |

### public.article_submissions

Story submissions from the public, with review status.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `submitter_name` | text | not null |  |
| `submitter_email` | text | not null |  |
| `submitter_affiliation` | text |  |  |
| `section_id` | uuid | references public.sections (id) on delete set null |  |
| `title` | text | not null |  |
| `summary` | text |  |  |
| `body` | text |  |  |
| `status` | public.intake_status | not null default 'submitted' |  |
| `reviewer_id` | uuid | references public.profiles (id) on delete set null | audit only |
| `review_note` | text |  |  |
| `reviewed_at` | timestamptz |  |  |
| `converted_article_id` | uuid | unique references public.articles (id) on delete set null |  |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |

### public.event_reports

Event reports from the public, with review status.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `organization` | text | not null |  |
| `contact_name` | text | not null |  |
| `contact_email` | text | not null |  |
| `event_title` | text | not null |  |
| `event_date` | date |  |  |
| `venue` | text |  |  |
| `summary` | text | not null |  |
| `status` | public.intake_status | not null default 'submitted' |  |
| `reviewer_id` | uuid | references public.profiles (id) on delete set null | audit only |
| `review_note` | text |  |  |
| `reviewed_at` | timestamptz |  |  |
| `converted_article_id` | uuid | unique references public.articles (id) on delete set null |  |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |

### public.intake_files

Attachments of submissions and event reports in the private `intake` bucket.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `submission_id` | uuid | references public.article_submissions (id) on delete cascade |  |
| `event_report_id` | uuid | references public.event_reports (id) on delete cascade |  |
| `path` | text | not null unique |  |
| `file_name` | text | not null |  |
| `mime_type` | text |  |  |
| `size_bytes` | integer |  |  |
| `created_at` | timestamptz | not null default now() |  |

Table constraints: `constraint intake_files_one_parent check (num_nonnulls(submission_id, event_report_id) = 1)`

### public.contact_messages

Messages from the contact form, with handling status.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `name` | text | not null |  |
| `email` | text | not null |  |
| `subject` | text | not null |  |
| `category` | public.contact_category | not null default 'general' |  |
| `message` | text | not null |  |
| `status` | public.contact_status | not null default 'unread' |  |
| `handled_by` | uuid | references public.profiles (id) on delete set null | audit only |
| `handled_at` | timestamptz |  |  |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |

### public.team_terms

Editorial board terms (for example a school year).

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `label` | text | not null unique | e.g. "2026–2027" |
| `starts_on` | date | not null |  |
| `ends_on` | date |  |  |
| `is_current` | boolean | not null default false |  |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |

### public.team_members

Members of the editorial board per term.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `term_id` | uuid | not null references public.team_terms (id) on delete cascade |  |
| `role_group` | public.team_role_group | not null |  |
| `position_title` | text | not null |  |
| `contributor_id` | uuid | references public.contributors (id) on delete set null |  |
| `display_name` | text |  |  |
| `photo_asset_id` | uuid | references public.media_assets (id) on delete set null |  |
| `sort_order` | integer | not null default 0 |  |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |

Table constraints: `constraint team_members_named check (contributor_id is not null or display_name is not null)`

### public.department_contacts

Desk contacts shown on the contact page.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `name` | text | not null unique |  |
| `email` | text |  |  |
| `phone` | text |  |  |
| `description` | text |  |  |
| `sort_order` | integer | not null default 0 |  |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |

### public.site_settings

Key–value site configuration (site details, social links, ticker, comments switch).

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `key` | text | primary key check (key ~ '^[a-z0-9_]+$') |  |
| `value` | jsonb | not null |  |
| `is_public` | boolean | not null default false |  |
| `updated_by` | uuid | references public.profiles (id) on delete set null | audit only |
| `updated_at` | timestamptz | not null default now() |  |

### public.audit_log

Who changed access, publishing rights or the Salingkusog team, and when.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | bigint | generated always as identity primary key |  |
| `actor_id` | uuid | references public.profiles (id) on delete set null | audit only, unindexed |
| `action` | text | not null |  |
| `entity` | text | not null |  |
| `entity_id` | text |  |  |
| `details` | jsonb | not null default '{}'::jsonb |  |
| `created_at` | timestamptz | not null default now() |  |

### app.rate_events

Internal log used by `app.rate_limit` (private `app` schema).

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `key` | text | not null |  |
| `created_at` | timestamptz | not null default now() |  |

## A.2 Salingkusog (`salingkusog.sql`)

### public.sk_editions

One Salingkusog edition per year: dates, medal points, flags, schedule PDF, map, countdown.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `year` | integer | not null unique check (year between 2000 and 2100) |  |
| `title` | text | not null | "Salingkusog 2026" |
| `subtitle` | text |  | "VSU Intramural Games" |
| `starts_on` | date | not null |  |
| `ends_on` | date | not null |  |
| `points_gold` | smallint | not null default 5 check (points_gold >= 0) |  |
| `points_silver` | smallint | not null default 3 check (points_silver >= 0) |  |
| `points_bronze` | smallint | not null default 1 check (points_bronze >= 0) |  |
| `is_current` | boolean | not null default false |  |
| `is_published` | boolean | not null default false |  |
| `schedule_pdf_asset_id` | uuid | references public.media_assets (id) on delete set null |  |
| `map_asset_id` | uuid | references public.media_assets (id) on delete set null |  |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |
| `countdown_enabled` | boolean | not null default false | added in salingkusog.sql |
| `countdown_at` | timestamptz |  | added in salingkusog.sql |

Table constraints: `constraint sk_editions_dates check (ends_on >= starts_on)`

### public.sk_factions

Competing teams of an edition (name, short name, motto, colour, logo).

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `edition_id` | uuid | not null references public.sk_editions (id) on delete cascade |  |
| `name` | text | not null |  |
| `slug` | text | not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$') |  |
| `short_name` | text |  | "PT", used in compact score tables |
| `motto` | text |  |  |
| `color` | text | not null default '#0e5a36' check (color ~ '^#[0-9a-fA-F]{6}$') |  |
| `logo_asset_id` | uuid | references public.media_assets (id) on delete set null |  |
| `sort_order` | integer | not null default 0 |  |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |

Table constraints: `unique (edition_id, slug)`; `unique (edition_id, id)`

### public.sk_venues

Venues with description and position on the venue map.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `edition_id` | uuid | not null references public.sk_editions (id) on delete cascade |  |
| `name` | text | not null |  |
| `slug` | text | not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$') |  |
| `description` | text |  |  |
| `map_number` | smallint |  | the numbered pin on the venue map |
| `map_x` | numeric(5, 2) | check (map_x is null or map_x between 0 and 100) | % from left |
| `map_y` | numeric(5, 2) | check (map_y is null or map_y between 0 and 100) | % from top |
| `sort_order` | integer | not null default 0 |  |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |

Table constraints: `unique (edition_id, slug)`; `unique (edition_id, id)`

### public.sk_sports

Sports of an edition with a category.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `edition_id` | uuid | not null references public.sk_editions (id) on delete cascade |  |
| `name` | text | not null | "Basketball" |
| `slug` | text | not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$') |  |
| `category` | public.sk_category | not null |  |
| `sort_order` | integer | not null default 0 |  |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |

Table constraints: `unique (edition_id, slug)`; `unique (edition_id, id)`

### public.sk_events

An event inside a sport (division and format); `seeds` stores the seed order used by Build schedule.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `edition_id` | uuid | not null |  |
| `sport_id` | uuid | not null |  |
| `name` | text | not null | shown after the sport: "Men", "100m Dash · Women" |
| `slug` | text | not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$') |  |
| `division` | public.sk_division | not null default 'open' |  |
| `format` | public.sk_format | not null default 'bracket' |  |
| `is_team` | boolean | not null default true | false = individual athletes win the medals |
| `result_unit` | text |  | "s", "m", "pts" for timed/measured events |
| `venue_id` | uuid |  |  |
| `sort_order` | integer | not null default 0 |  |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |
| `seeds` | uuid[] | not null default '{}' | added in salingkusog.sql |

Table constraints: `unique (edition_id, slug)`; `unique (edition_id, id)`; `foreign key (edition_id, sport_id) references public.sk_sports (edition_id, id) on delete cascade`; `foreign key (edition_id, venue_id) references public.sk_venues (edition_id, id) on delete set null (venue_id)`

### public.sk_athletes

Athletes per faction: name, program and optional photo only.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `edition_id` | uuid | not null |  |
| `faction_id` | uuid | not null |  |
| `name` | text | not null |  |
| `slug` | text | not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$') |  |
| `program` | text |  | course / year |
| `photo_asset_id` | uuid | references public.media_assets (id) on delete set null |  |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |

Table constraints: `unique (edition_id, slug)`; `unique (edition_id, id)`; `foreign key (edition_id, faction_id) references public.sk_factions (edition_id, id) on delete cascade`

### public.sk_matches

Games and contest sessions: schedule, status, scores, periods, sources of generated sides, recap link.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `edition_id` | uuid | not null |  |
| `event_id` | uuid | not null |  |
| `round` | text |  | "Semifinal 1", "Final", "Bronze game", "Group A" |
| `round_order` | smallint | not null default 0 | column in the bracket (higher = later round) |
| `bracket_slot` | smallint |  | position within the round, top to bottom |
| `venue_id` | uuid |  |  |
| `scheduled_at` | timestamptz | not null |  |
| `status` | public.sk_match_status | not null default 'upcoming' |  |
| `side_a_id` | uuid |  | null = to be decided (TBD) in early brackets |
| `side_b_id` | uuid |  |  |
| `score_a` | numeric(8, 2) |  |  |
| `score_b` | numeric(8, 2) |  |  |
| `periods` | jsonb | not null default '[]'::jsonb check (jsonb_typeof(periods) = 'array') | quarters / sets / games: [{"label": "Q1", "a": 20, "b": 16}, …] |
| `team_stats` | jsonb | not null default '[]'::jsonb check (jsonb_typeof(team_stats) = 'array') | team stats for the recap: [{"label": "Field goal %", "a": "46%", "b": "41%"}, …] |
| `live_note` | text |  | "Set 4 · Now", "Q3 · 4:12" |
| `started_at` | timestamptz |  |  |
| `ended_at` | timestamptz |  |  |
| `recap_article_id` | uuid | references public.articles (id) on delete set null |  |
| `winner_side` | char(1) | generated (computed) |  |
| `updated_by` | uuid | references public.profiles (id) on delete set null | audit only |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |
| `source_a` | text |  | added in salingkusog.sql |
| `source_b` | text |  | added in salingkusog.sql |
| `is_contest` | boolean | not null default false | added in salingkusog.sql |

Table constraints: `unique (edition_id, id)`; `foreign key (edition_id, event_id) references public.sk_events (edition_id, id) on delete cascade`; `foreign key (edition_id, venue_id) references public.sk_venues (edition_id, id) on delete set null (venue_id)`; `foreign key (edition_id, side_a_id) references public.sk_factions (edition_id, id) on delete set null (side_a_id)`; `foreign key (edition_id, side_b_id) references public.sk_factions (edition_id, id) on delete set null (side_b_id)`; `constraint sk_matches_two_sides check (side_a_id is null or side_b_id is null or side_a_id <> side_b_id)`; `constraint sk_matches_final_needs_scores check (status <> 'final' or (score_a is not null and score_b is not null))`; `constraint sk_matches_sources check ( (source_a is null or source_a ~ '^(seed:[0-9]+\|rank:[0-9]+\|(winner\|loser):[0-9a-f-]{36})$') and (source_b is null or source_b ~ '^(seed:[0-`; `constraint sk_matches_final_needs_scores check (status <> 'final' or is_contest or (score_a is not null and score_b is not null))`; `constraint sk_matches_contest_no_sides check (not is_contest or (side_a_id is null and side_b_id is null))`

### public.sk_entries

Contest line-up and results: one row per faction per session.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `edition_id` | uuid | not null |  |
| `match_id` | uuid | not null |  |
| `faction_id` | uuid | not null |  |
| `athlete_id` | uuid |  | individual events: the faction's one entrant |
| `lane` | smallint | not null default 0 | performance order / lane |
| `result` | numeric(10, 3) |  | seconds, metres or points (timed / measured) |
| `place` | smallint | check (place between 1 and 64) | judged: the place announced by the judges |
| `status` | text | not null default 'ok' check (status in ('ok', 'dns', 'dnf', 'dq')) |  |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |

Table constraints: `unique (match_id, faction_id)`; `foreign key (edition_id, match_id) references public.sk_matches (edition_id, id) on delete cascade`; `foreign key (edition_id, faction_id) references public.sk_factions (edition_id, id) on delete cascade`; `foreign key (edition_id, athlete_id) references public.sk_athletes (edition_id, id) on delete set null (athlete_id)`

### public.sk_athlete_stats

Per-athlete box score values for a game (JSON of stat → value).

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `match_id` | uuid | not null references public.sk_matches (id) on delete cascade |  |
| `athlete_id` | uuid | not null references public.sk_athletes (id) on delete cascade |  |
| `stats` | jsonb | not null default '{}'::jsonb check (jsonb_typeof(stats) = 'object') |  |

Table constraints: `primary key (match_id, athlete_id)`

### public.sk_placements

Official places of an event; medal follows the place; feeds the medal table.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `edition_id` | uuid | not null |  |
| `event_id` | uuid | not null |  |
| `place` | smallint | not null check (place between 1 and 64) |  |
| `medal` | public.sk_medal |  | null for 4th place and below |
| `faction_id` | uuid | not null |  |
| `athlete_id` | uuid |  | individual events |
| `result` | text |  | "12.84s", "78–71", "92.5 pts" |
| `awarded_on` | date | not null default ((now() at time zone 'Asia/Manila')::date) |  |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |

Table constraints: `foreign key (edition_id, event_id) references public.sk_events (edition_id, id) on delete cascade`; `foreign key (edition_id, faction_id) references public.sk_factions (edition_id, id) on delete cascade`; `foreign key (edition_id, athlete_id) references public.sk_athletes (edition_id, id) on delete set null (athlete_id)`; `constraint sk_placements_medal_matches_place check ( medal is null or (medal = 'gold' and place = 1) or (medal = 'silver' and place = 2) or (medal = 'bronze' and place = 3) )`

### public.sk_awards

Daily and finals awards with stat line and quote.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | uuid | primary key default gen_random_uuid() |  |
| `edition_id` | uuid | not null |  |
| `kind` | public.sk_award_kind | not null |  |
| `day` | date | not null |  |
| `athlete_id` | uuid | not null |  |
| `match_id` | uuid | references public.sk_matches (id) on delete set null |  |
| `event_id` | uuid | references public.sk_events (id) on delete set null |  |
| `headline` | text |  | "12.84s" or "Gold · 100m Dash, Women" |
| `stat_line` | jsonb | not null default '[]'::jsonb check (jsonb_typeof(stat_line) = 'array') | [{"label":"PTS","value":"24"}] |
| `quote` | text |  |  |
| `created_at` | timestamptz | not null default now() |  |
| `updated_at` | timestamptz | not null default now() |  |

Table constraints: `foreign key (edition_id, athlete_id) references public.sk_athletes (edition_id, id) on delete cascade`

### public.sk_team

Staff allowed to enter Salingkusog data (besides SA, EE, ME).

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `profile_id` | uuid | primary key references public.profiles (id) on delete cascade |  |
| `added_by` | uuid | references public.profiles (id) on delete set null | audit only |
| `created_at` | timestamptz | not null default now() |  |

## A.3 Statistics (`stats.sql`)

### app.stats_salts

Daily random salts for hashing visitor ids; deleted after two days.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `day` | date | primary key |  |
| `salt` | text | not null default gen_random_uuid()::text |  |

### public.stats_pageviews

Raw pageview events (hashed ids, source, device, reading time, scroll).

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | bigint | generated always as identity primary key |  |
| `client_id` | uuid | not null unique | the browser's id for this pageview (engagement attaches to it) |
| `occurred_at` | timestamptz | not null default now() |  |
| `day` | date | not null default app.manila_today() |  |
| `path` | text | not null check (length(path) between 1 and 300) |  |
| `article_id` | uuid | references public.articles (id) on delete set null |  |
| `visitor_hash` | text |  | null: Do Not Track |
| `session_hash` | text |  |  |
| `source` | text | not null default 'direct' check (source in ('direct', 'social', 'search', 'referral', 'internal', 'campaign')) |  |
| `referrer_host` | text | check (referrer_host is null or length(referrer_host) <= 120) |  |
| `utm_source` | text | check (utm_source is null or length(utm_source) <= 80) |  |
| `utm_medium` | text | check (utm_medium is null or length(utm_medium) <= 80) |  |
| `utm_campaign` | text | check (utm_campaign is null or length(utm_campaign) <= 80) |  |
| `device` | text | not null default 'desktop' check (device in ('mobile', 'tablet', 'desktop')) |  |
| `browser` | text | not null default 'Other' check (length(browser) <= 40) |  |
| `os` | text | not null default 'Other' check (length(os) <= 40) |  |
| `counted` | boolean | not null default false | a deduplicated article view (one per visitor per article per 30 min) |
| `active_seconds` | integer | not null default 0 check (active_seconds between 0 and 14400) |  |
| `max_scroll` | smallint | not null default 0 check (max_scroll between 0 and 100) |  |

### public.stats_shares

Raw share-button events.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `id` | bigint | generated always as identity primary key |  |
| `occurred_at` | timestamptz | not null default now() |  |
| `day` | date | not null default app.manila_today() |  |
| `article_id` | uuid | not null references public.articles (id) on delete cascade |  |
| `channel` | text | not null check (channel in ('facebook', 'messenger', 'x', 'copy', 'native', 'other')) |  |
| `visitor_hash` | text |  |  |

### public.staff_activity_daily

Newsroom active seconds per staff member per day.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `profile_id` | uuid | not null references public.profiles (id) on delete cascade |  |
| `day` | date | not null |  |
| `active_seconds` | integer | not null default 0 check (active_seconds >= 0) |  |
| `last_beat_at` | timestamptz |  |  |

Table constraints: `primary key (profile_id, day)`

### public.stats_daily_site

Daily site totals.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `day` | date | primary key |  |
| `pageviews` | integer | not null default 0 |  |
| `views` | integer | not null default 0 |  |
| `visitors` | integer | not null default 0 |  |
| `sessions` | integer | not null default 0 |  |
| `active_seconds` | bigint | not null default 0 |  |
| `read_samples` | integer | not null default 0 |  |
| `shares` | integer | not null default 0 |  |

### public.stats_daily_articles

Daily totals per article.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `day` | date | not null |  |
| `article_id` | uuid | not null references public.articles (id) on delete cascade |  |
| `pageviews` | integer | not null default 0 |  |
| `views` | integer | not null default 0 |  |
| `visitors` | integer | not null default 0 |  |
| `active_seconds` | bigint | not null default 0 |  |
| `read_samples` | integer | not null default 0 |  |
| `scroll_sum` | bigint | not null default 0 |  |
| `scroll_samples` | integer | not null default 0 |  |
| `finished` | integer | not null default 0 |  |
| `shares` | integer | not null default 0 |  |

Table constraints: `primary key (day, article_id)`

### public.stats_daily_dims

Daily totals per dimension (source, referrer, device, browser, OS).

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `day` | date | not null |  |
| `dim` | text | not null check (dim in ('source', 'referrer', 'device', 'browser', 'os')) |  |
| `value` | text | not null |  |
| `pageviews` | integer | not null default 0 |  |
| `visitors` | integer | not null default 0 |  |

Table constraints: `primary key (day, dim, value)`

### public.stats_daily_shares

Daily share totals per channel.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `day` | date | not null |  |
| `channel` | text | not null |  |
| `shares` | integer | not null default 0 |  |

Table constraints: `primary key (day, channel)`

### public.stats_rollup_log

Days already rolled up by the nightly job.

| Column | Type | Constraints / default | Notes |
|---|---|---|---|
| `day` | date | primary key |  |
| `rolled_at` | timestamptz | not null default now() |  |

\newpage

# Appendix B. Enumerated types

| Enum | Values | File |
|---|---|---|
| `public.app_role` | `super_admin`, `editor_in_chief`, `managing_editor`, `section_editor`, `staff_writer`, `contributor`, `business_manager` | schema.sql |
| `public.article_status` | `draft`, `submitted`, `in_review`, `scheduled`, `published`, `archived`, `rejected` | schema.sql |
| `public.nav_placement` | `primary`, `more`, `hidden` | schema.sql |
| `public.contributor_type` | `staff`, `student`, `guest`, `faculty`, `alumni` | schema.sql |
| `public.asset_kind` | `image`, `document`, `audio`, `video` | schema.sql |
| `public.article_media_usage` | `inline`, `gallery`, `attachment` | schema.sql |
| `public.revision_kind` | `autosave`, `manual`, `status` | schema.sql |
| `public.comment_status` | `pending`, `approved`, `rejected`, `spam` | schema.sql |
| `public.intake_status` | `submitted`, `reviewing`, `accepted`, `declined`, `converted` | schema.sql |
| `public.contact_category` | `general`, `editorial`, `submission`, `technical`, `advertising`, `feedback` | schema.sql |
| `public.contact_status` | `unread`, `in_progress`, `resolved`, `spam` | schema.sql |
| `public.issue_type` | `regular`, `special`, `graduation`, `annual`, `commemorative` | schema.sql |
| `public.team_role_group` | `adviser`, `editorial_board`, `section_head`, `staff` | schema.sql |
| `public.sk_category` | `ball_games`, `athletics`, `racket_sports`, `aquatics`, `mind_games`, `esports`, `dance_cheer`, `combat_sports`, `pageant`, `others` | salingkusog.sql |
| `public.sk_division` | `men`, `women`, `mixed`, `open` | salingkusog.sql |
| `public.sk_format` | `bracket`, `round_robin`, `timed`, `judged`, `round_robin_final` | salingkusog.sql |
| `public.sk_match_status` | `upcoming`, `live`, `final`, `postponed`, `cancelled` | salingkusog.sql |
| `public.sk_medal` | `gold`, `silver`, `bronze` | salingkusog.sql |
| `public.sk_award_kind` | `mvp_of_day`, `athlete_of_day`, `finals_mvp` | salingkusog.sql |

# Appendix C. Functions and RPCs

Security: **definer** runs with the owner's rights (used for helpers that must read protected tables); **invoker** runs with the caller's rights, so RLS applies.

| Function | Arguments | Returns | Security | File | Purpose (from SQL comments) |
|---|---|---|---|---|---|
| `app.slugify` | input text | text | invoker | schema.sql | Generic helpers |
| `app.touch_updated_at` |  | trigger | invoker | schema.sql |  |
| `app.current_role` |  | public.app_role | definer | schema.sql | Permission helpers (security definer: they read profiles without RLS) |
| `app.is_staff` |  | boolean | definer | schema.sql |  |
| `app.is_admin` |  | boolean | definer | schema.sql |  |
| `app.can_publish` |  | boolean | definer | schema.sql |  |
| `app.can_publish_articles` |  | boolean | definer | schema.sql | Publish / schedule articles: the three managing roles, the Business Manager, and anyone given publishing access in Staff. (Front page, settings and the like stay app.can_publish.) |
| `app.is_editor` |  | boolean | definer | schema.sql |  |
| `app.can_edit_section` | p_section_id uuid | boolean | definer | schema.sql |  |
| `app.is_live` | p_status public.article_status, p_published_at timestamptz | boolean | invoker | schema.sql |  |
| `app.is_article_owner` | p_article_id uuid | boolean | definer | schema.sql |  |
| `app.article_is_live` | p_article_id uuid | boolean | definer | schema.sql |  |
| `app.can_view_article` | p_article_id uuid | boolean | definer | schema.sql |  |
| `app.can_modify_article` | p_article_id uuid | boolean | definer | schema.sql | Owners may change an article's parts only while it is a draft or rejected; editors of its section may change it at any time. |
| `app.rate_limit` | p_key text, p_max integer, p_window interval | void | definer | schema.sql |  |
| `app.audit` | p_action text, p_entity text, p_entity_id text, p_details jsonb default '{}'::jsonb | void | definer | schema.sql |  |
| `app.handle_new_user` |  | trigger | definer | schema.sql | New auth user → profile (role only ever comes from staff_invites) |
| `app.guard_profile_update` |  | trigger | definer | schema.sql | Role / activation changes are admin-only; only super_admin grants super_admin; the last active super_admin can't be demoted or deactivated. |
| `app.article_before_write` |  | trigger | definer | schema.sql | submitted  → draft (owner withdraws / editor returns) \| in_review \| rejected (editor) \| scheduled, published (publisher) in_review  → draft, rejected (editor) \| scheduled, published (publisher) sc |
| `app.article_after_write` |  | trigger | definer | schema.sql |  |
| `app.prune_revisions` |  | trigger | definer | schema.sql | keep the newest 50 revisions per article |
| `app.publish_due_articles` |  | integer | definer | schema.sql | flip due scheduled rows to published (optional: run from pg_cron; the public site already shows them once published_at has passed) |
| `public.record_article_view` | p_article_id uuid | void | definer | schema.sql | RPCs: public |
| `public.most_read_articles` | p_days integer default 7, p_limit integer default 5 | table ( id uuid, slug text, title text, section_slug text, section_name text, category_name text, published_at timestamptz, views bigint ) | definer | schema.sql |  |
| `public.search_articles` | p_query text, p_section text default null, p_from date default null, p_to date default null, p_limit integer default 20, p_offset integer default 0, p_live_only boolean default true | table ( id uuid, slug text, title text, excerpt text, section_slug text, section_name text, category_name text, published_at timestamptz, status public.article_status, cover_bucket text, cover_path text, cover_alt text, rank real, total_count bigint ) | invoker | schema.sql | Full-text search over live articles (RLS applies: staff also see their drafts unless p_live_only is true, which the public site always passes). |
| `public.archive_months` |  | table (month date, articles bigint) | definer | schema.sql | Months that have live articles, newest first (archive browsing). |
| `app.check_email` | p_email text | text | invoker | schema.sql |  |
| `app.check_text` | p_value text, p_label text, p_min integer, p_max integer | text | invoker | schema.sql |  |
| `public.submit_comment` | p_article_id uuid, p_name text, p_email text, p_body text, p_parent_id uuid default null, p_website text default null | uuid | definer | schema.sql | p_website is a honeypot field: real visitors never fill it in. |
| `app.attach_intake_files` | p_files jsonb, p_prefix text, p_submission uuid, p_event uuid | void | definer | schema.sql | p_files: [{"path": "submissions/<uuid>/file.pdf", "name": "file.pdf", "mime": "...", "size": 123}] Files must already be uploaded to the private "intake" bucket. |
| `public.submit_article` | p_name text, p_email text, p_affiliation text, p_section_slug text, p_title text, p_summary text, p_body text, p_files jsonb default '[]'::jsonb, p_website text default null | uuid | definer | schema.sql |  |
| `public.submit_event_report` | p_organization text, p_contact_name text, p_contact_email text, p_event_title text, p_event_date date, p_venue text, p_summary text, p_files jsonb default '[]'::jsonb, p_website text default null | uuid | definer | schema.sql |  |
| `public.send_contact_message` | p_name text, p_email text, p_subject text, p_category public.contact_category, p_message text, p_website text default null | uuid | definer | schema.sql |  |
| `public.transition_article` | p_article_id uuid, p_to public.article_status, p_note text default null, p_scheduled_for timestamptz default null | public.articles | invoker | schema.sql | RPCs: staff (run as the caller, so RLS and the workflow trigger apply) |
| `public.add_article_note` | p_article_id uuid, p_note text | void | definer | schema.sql |  |
| `public.convert_intake_to_article` | p_kind text, p_intake_id uuid, p_category_id uuid | uuid | invoker | schema.sql | Turn a public submission or event report into a draft article. |
| `public.set_publish_access` | p_profile_id uuid, p_allowed boolean | void | definer | schema.sql | Staff → "Can publish": the three managing roles turn publishing access on or off. |
| `public.dashboard_stats` |  | jsonb | definer | schema.sql |  |
| `public.media_usage` | p_asset_id uuid | integer | definer | schema.sql |  |
| `app.can_manage_sk_team` |  | boolean | definer | salingkusog.sql | Permission helpers |
| `app.can_edit_sk` |  | boolean | definer | salingkusog.sql |  |
| `app.sk_edition_visible` | p_edition_id uuid | boolean | definer | salingkusog.sql |  |
| `app.sk_inherit_edition` |  | trigger | definer | salingkusog.sql | Child rows always carry their parent's edition (so a match can't mix editions) |
| `app.sk_match_status` |  | trigger | definer | salingkusog.sql | Live / final timestamps and who touched the score last |
| `app.sk_single_current` |  | trigger | definer | salingkusog.sql | Only one current edition |
| `app.sk_countdown_guard` |  | trigger | definer | salingkusog.sql | Only the managing roles may switch the countdown page or move its time (team members edit everything else) |
| `app.sk_team_audit` |  | trigger | definer | salingkusog.sql | Team changes are audited |
| `public.sk_set_placements` | p_event_id uuid, p_rows jsonb | integer | invoker | salingkusog.sql | RPC: replace an event's results in one step (newsroom "Results & medals"). Medals follow the place (1 gold, 2 silver, 3 bronze); RLS still applies. p_rows: [{"place": 1, "faction_id": "…", "athlete_id |
| `app.sk_rr_table` | p_event_id uuid | table (faction_id uuid, rank integer, played integer, wins integer, losses integer, draws integer, pf numeric, pa numeric) | definer | salingkusog.sql | Round-robin standings: wins, point difference, head-to-head among the tied, points scored, seed. Group games = every game of the event that isn't fed by a winner/loser/rank (so imported round robins w |
| `app.sk_resolve` | p_event_id uuid | void | definer | salingkusog.sql | Fills in the sides of the event's generated games (idempotent). |
| `app.sk_source_side` | p_event_id uuid, p_format text, p_seeds uuid[], p_group_left integer, p_round integer, p_source text | uuid | definer | salingkusog.sql | One side of a generated game, or null while it isn't known yet. |
| `app.sk_matches_advance` |  | trigger | definer | salingkusog.sql | After a game changes, move the teams along (one level deep: the updates it makes don't recurse). |
| `app.sk_knockout_needs_winner` |  | trigger | definer | salingkusog.sql | Knockout games need a winner (overtime, penalties… go into the score) |
| `public.sk_build_schedule` | p_event_id uuid, p_format text, p_seeds uuid[], p_first_at timestamptz, p_round_gap_hours integer default 24, p_game_gap_minutes integer default 90, p_venue_id uuid default null, p_bronze boolean default true | integer | invoker | salingkusog.sql | RPC: build an event's games ("Build schedule" in the newsroom). p_format: bracket (single elimination), round_robin, or round_robin_final (top 2 play the final). p_seeds: factions in seed order. Repla |
| `public.sk_create_contest` | p_event_id uuid, p_at timestamptz, p_venue_id uuid default null, p_round text default null, p_factions uuid[] default null, p_shuffle boolean default false | uuid | invoker | salingkusog.sql | RPC: a contest session with every faction in it ("Create contest" in the newsroom). p_factions: who takes part, in performance order (default: all, by faction order); p_shuffle draws a random order in |
| `public.sk_countdown` |  | table (title text, subtitle text, starts_on date, countdown_at timestamptz) | definer | salingkusog.sql | RPC: the public countdown. Returns a row only while the current edition's countdown page is switched on (works before the edition itself is published). |
| `public.sk_points_timeline` | p_edition_id uuid, p_hours integer | table (faction_id uuid, bucket_end timestamptz, points integer) | invoker | salingkusog.sql | RPC: the points race in hour steps (1, 3, 6 or 12). Cumulative points per faction at the end of each step. 1/3/6 h cover the latest day with results; 12 h covers the whole edition. A result counts at  |
| `app.can_view_stats` |  | boolean | definer | stats.sql | Helpers |
| `app.manila_today` |  | date | invoker | stats.sql |  |
| `app.stats_hash` | p_raw text | text | definer | stats.sql |  |
| `public.stats_ingest` | p_visitor text, p_session text, p_events jsonb, p_device text default 'desktop', p_browser text default 'Other', p_os text default 'Other' | integer | definer | stats.sql | Write path: public.stats_ingest (service role only, called by /api/e) p_events: [{"t":"pv","id":"<uuid>","path":"/article/x","src":"social","ref":"facebook.com","us":"…","um":"…","uc":"…"}, {"t":"eng" |
| `public.staff_heartbeat` |  | integer | definer | stats.sql | Staff heartbeat: the newsroom calls this every ~30 s while the tab is visible and the person was active in the last minute. Credit is the time since the last beat, capped at 45 s, and only when that b |
| `app.stats_rollup_day` | p_day date | void | definer | stats.sql | Daily totals and retention |
| `app.stats_nightly` |  | void | definer | stats.sql | Nightly: total up every finished day not done yet, then apply retention. |
| `app.stats_live_from` |  | date | definer | stats.sql | First day still read from raw events (everything before it has daily totals) |
| `app.stats_site_days` | p_from date, p_to date | table (day date, pageviews bigint, views bigint, visitors bigint, sessions bigint, active_seconds bigint, read_samples bigint, shares bigint) | definer | stats.sql | Read path (internal): daily totals for finished days + raw events after them |
| `app.stats_article_totals` | p_from date, p_to date | table (article_id uuid, pageviews bigint, views bigint, visitors bigint, active_seconds bigint, read_samples bigint, scroll_sum bigint, scroll_samples bigint, finished bigint, shares bigint) | definer | stats.sql |  |
| `app.stats_dim_totals` | p_from date, p_to date, p_dim text | table (value text, pageviews bigint, visitors bigint) | definer | stats.sql |  |
| `app.stats_require` | p_from date, p_to date | void | definer | stats.sql | Read path (public RPCs): stats viewers only |
| `public.stats_overview` | p_from date, p_to date | jsonb | definer | stats.sql | Totals for the range and the same-length period before it, plus a daily series. |
| `public.stats_articles` | p_from date, p_to date, p_limit integer default 20 | table (article_id uuid, slug text, title text, section_name text, category_name text, authors text, published_at timestamptz, views bigint, pageviews bigint, visitors bigint, avg_read_seconds integer, avg_scroll integer, finish_rate integer, shares bigint) | definer | stats.sql |  |
| `public.stats_authors` | p_from date, p_to date | table (contributor_id uuid, name text, articles bigint, views bigint, avg_read_seconds integer, shares bigint) | definer | stats.sql |  |
| `public.stats_sections` | p_from date, p_to date | table (section_name text, category_name text, articles bigint, views bigint, avg_read_seconds integer, shares bigint) | definer | stats.sql |  |
| `public.stats_breakdown` | p_from date, p_to date, p_dim text | table (value text, pageviews bigint, visitors bigint) | definer | stats.sql |  |
| `public.stats_share_channels` | p_from date, p_to date | table (channel text, shares bigint) | definer | stats.sql |  |
| `public.stats_staff_usage` | p_from date, p_to date | table (profile_id uuid, display_name text, role public.app_role, is_active boolean, active_seconds bigint, days_active bigint, last_active_at timestamptz) | definer | stats.sql |  |

# Appendix D. Triggers

| Trigger | Table | Timing / events | Function |
|---|---|---|---|
| `on_auth_user_created` | `auth.users` | after insert | `app.handle_new_user` |
| `profiles_guard` | `public.profiles` | before update | `app.guard_profile_update` |
| `articles_before_write` | `public.articles` | before insert or update | `app.article_before_write` |
| `articles_after_write` | `public.articles` | after insert or update | `app.article_after_write` |
| `article_revisions_prune` | `public.article_revisions` | after insert | `app.prune_revisions` |
| `sk_matches_status` | `public.sk_matches` | before insert or update | `app.sk_match_status` |
| `sk_editions_single_current` | `public.sk_editions` | before insert or update of is_current | `app.sk_single_current` |
| `sk_editions_countdown_guard` | `public.sk_editions` | before insert or update | `app.sk_countdown_guard` |
| `sk_team_audit` | `public.sk_team` | after insert or delete | `app.sk_team_audit` |
| `sk_matches_advance` | `public.sk_matches` | after insert or delete or update of status, score_a, score_b, side_a_id, side_b_id, source_a, source_b | `app.sk_matches_advance` |
| `sk_matches_knockout` | `public.sk_matches` | before insert or update | `app.sk_knockout_needs_winner` |
| `sk_events_edition` | `public.sk_events` | before insert or update | `app.sk_inherit_edition` |
| `sk_matches_edition` | `public.sk_matches` | before insert or update | `app.sk_inherit_edition` |
| `sk_placements_edition` | `public.sk_placements` | before insert or update | `app.sk_inherit_edition` |
| `sk_athletes_edition` | `public.sk_athletes` | before insert or update | `app.sk_inherit_edition` |
| `sk_entries_edition` | `public.sk_entries` | before insert or update | `app.sk_inherit_edition` |
| `sk_editions_touch` | `public.sk_editions` | before update | `app.touch_updated_at` |
| `sk_factions_touch` | `public.sk_factions` | before update | `app.touch_updated_at` |
| `sk_venues_touch` | `public.sk_venues` | before update | `app.touch_updated_at` |
| `sk_sports_touch` | `public.sk_sports` | before update | `app.touch_updated_at` |
| `sk_events_touch` | `public.sk_events` | before update | `app.touch_updated_at` |
| `sk_athletes_touch` | `public.sk_athletes` | before update | `app.touch_updated_at` |
| `sk_matches_touch` | `public.sk_matches` | before update | `app.touch_updated_at` |
| `sk_placements_touch` | `public.sk_placements` | before update | `app.touch_updated_at` |
| `sk_awards_touch` | `public.sk_awards` | before update | `app.touch_updated_at` |
| `sk_entries_touch` | `public.sk_entries` | before update | `app.touch_updated_at` |
| `profiles_touch` | `public.profiles` | before update | `app.touch_updated_at` |
| `sections_touch` | `public.sections` | before update | `app.touch_updated_at` |
| `categories_touch` | `public.categories` | before update | `app.touch_updated_at` |
| `media_assets_touch` | `public.media_assets` | before update | `app.touch_updated_at` |
| `contributors_touch` | `public.contributors` | before update | `app.touch_updated_at` |
| `publication_issues_touch` | `public.publication_issues` | before update | `app.touch_updated_at` |
| `article_submissions_touch` | `public.article_submissions` | before update | `app.touch_updated_at` |
| `event_reports_touch` | `public.event_reports` | before update | `app.touch_updated_at` |
| `contact_messages_touch` | `public.contact_messages` | before update | `app.touch_updated_at` |
| `team_terms_touch` | `public.team_terms` | before update | `app.touch_updated_at` |
| `team_members_touch` | `public.team_members` | before update | `app.touch_updated_at` |
| `department_contacts_touch` | `public.department_contacts` | before update | `app.touch_updated_at` |
| `site_settings_touch` | `public.site_settings` | before update | `app.touch_updated_at` |
| `home_slots_touch` | `public.home_slots` | before update | `app.touch_updated_at` |

# Appendix E. Indexes

| Index | Table | Columns | Unique | Condition |
|---|---|---|---|---|
| `profiles_email_key` | `public.profiles` | lower(email) | yes |  |
| `profile_sections_section_idx` | `public.profile_sections` | section_id |  |  |
| `media_assets_created_idx` | `public.media_assets` | created_at desc |  |  |
| `media_assets_uploaded_by_idx` | `public.media_assets` | uploaded_by |  |  |
| `publication_issues_date_idx` | `public.publication_issues` | issue_date desc |  |  |
| `articles_live_idx` | `public.articles` | published_at desc |  | where status in ('published', 'scheduled') |
| `articles_live_section_idx` | `public.articles` | section_id, published_at desc |  | where status in ('published', 'scheduled') |
| `articles_live_category_idx` | `public.articles` | category_id, published_at desc |  | where status in ('published', 'scheduled') |
| `articles_featured_idx` | `public.articles` | published_at desc |  | where is_featured |
| `articles_issue_idx` | `public.articles` | issue_id, issue_position |  | where issue_id is not null |
| `articles_status_updated_idx` | `public.articles` | status, updated_at desc |  |  |
| `articles_created_by_idx` | `public.articles` | created_by, updated_at desc |  |  |
| `articles_cover_idx` | `public.articles` | cover_asset_id |  | where cover_asset_id is not null |
| `articles_og_image_idx` | `public.articles` | og_image_asset_id |  | where og_image_asset_id is not null |
| `articles_search_idx` | `public.articles` | search |  |  |
| `article_authors_contributor_idx` | `public.article_authors` | contributor_id |  |  |
| `article_tags_tag_idx` | `public.article_tags` | tag_id |  |  |
| `article_media_asset_idx` | `public.article_media` | asset_id |  |  |
| `article_revisions_article_idx` | `public.article_revisions` | article_id, created_at desc |  |  |
| `article_activity_article_idx` | `public.article_activity` | article_id, created_at desc |  |  |
| `article_activity_created_idx` | `public.article_activity` | created_at desc |  |  |
| `article_daily_views_day_idx` | `public.article_daily_views` | day, article_id |  |  |
| `article_comments_article_idx` | `public.article_comments` | article_id, status, created_at |  |  |
| `article_comments_status_idx` | `public.article_comments` | status, created_at desc |  |  |
| `article_comments_parent_idx` | `public.article_comments` | parent_id |  | where parent_id is not null |
| `article_submissions_status_idx` | `public.article_submissions` | status, created_at desc |  |  |
| `event_reports_status_idx` | `public.event_reports` | status, created_at desc |  |  |
| `intake_files_submission_idx` | `public.intake_files` | submission_id |  | where submission_id is not null |
| `intake_files_event_idx` | `public.intake_files` | event_report_id |  | where event_report_id is not null |
| `contact_messages_status_idx` | `public.contact_messages` | status, created_at desc |  |  |
| `team_terms_one_current` | `public.team_terms` | is_current | yes | where is_current |
| `team_members_term_idx` | `public.team_members` | term_id, role_group, sort_order |  |  |
| `team_members_contributor_idx` | `public.team_members` | contributor_id |  | where contributor_id is not null |
| `audit_log_created_idx` | `public.audit_log` | created_at desc |  |  |
| `rate_events_key_idx` | `app.rate_events` | key, created_at desc |  |  |
| `sk_editions_one_current` | `public.sk_editions` | is_current | yes | where is_current |
| `sk_events_sport_idx` | `public.sk_events` | sport_id, sort_order |  |  |
| `sk_athletes_faction_idx` | `public.sk_athletes` | faction_id |  |  |
| `sk_matches_schedule_idx` | `public.sk_matches` | edition_id, scheduled_at |  |  |
| `sk_matches_live_idx` | `public.sk_matches` | edition_id |  | where status = 'live' |
| `sk_matches_event_idx` | `public.sk_matches` | event_id, round_order, bracket_slot |  |  |
| `sk_matches_side_a_idx` | `public.sk_matches` | side_a_id |  |  |
| `sk_matches_side_b_idx` | `public.sk_matches` | side_b_id |  |  |
| `sk_matches_venue_idx` | `public.sk_matches` | venue_id, scheduled_at |  |  |
| `sk_entries_faction_idx` | `public.sk_entries` | faction_id |  |  |
| `sk_entries_athlete_idx` | `public.sk_entries` | athlete_id |  | where athlete_id is not null |
| `sk_athlete_stats_athlete_idx` | `public.sk_athlete_stats` | athlete_id |  |  |
| `sk_placements_unique` | `public.sk_placements` | event_id, place, faction_id, coalesce(athlete_id, '00000000-0000-0000-0000-000000000000':: | yes |  |
| `sk_placements_edition_idx` | `public.sk_placements` | edition_id, awarded_on |  |  |
| `sk_placements_faction_idx` | `public.sk_placements` | faction_id |  |  |
| `sk_placements_athlete_idx` | `public.sk_placements` | athlete_id |  | where athlete_id is not null |
| `sk_awards_one_per_day` | `public.sk_awards` | edition_id, kind, day | yes | where kind <> 'finals_mvp' |
| `sk_awards_athlete_idx` | `public.sk_awards` | athlete_id |  |  |
| `stats_pageviews_day_idx` | `public.stats_pageviews` | day |  |  |
| `stats_pageviews_article_idx` | `public.stats_pageviews` | article_id, day |  | where article_id is not null |
| `stats_pageviews_dedupe_idx` | `public.stats_pageviews` | visitor_hash, article_id, occurred_at desc |  | where article_id is not null |
| `stats_shares_day_idx` | `public.stats_shares` | day |  |  |
| `stats_shares_article_idx` | `public.stats_shares` | article_id, day |  |  |
| `staff_activity_daily_day_idx` | `public.staff_activity_daily` | day |  |  |
| `stats_daily_articles_article_idx` | `public.stats_daily_articles` | article_id |  |  |

# Appendix F. Row Level Security policies

`using` decides which existing rows a command can see or affect; `with check` decides which new or changed rows are accepted.

| Table | Policy | Command | Roles | Using | With check |
|---|---|---|---|---|---|
| `profiles` | `profiles_select` | select | authenticated | id = auth.uid() or app.is_staff() |  |
| `profiles` | `profiles_update` | update | authenticated | id = auth.uid() or app.is_admin() | id = auth.uid() or app.is_admin() |
| `staff_invites` | `staff_invites_admin` | all | authenticated | app.is_admin() | app.is_admin() |
| `sections` | `sections_read` | select | anon, authenticated | true |  |
| `sections` | `sections_admin` | all | authenticated | app.is_admin() | app.is_admin() |
| `profile_sections` | `profile_sections_read` | select | authenticated | profile_id = auth.uid() or app.is_staff() |  |
| `profile_sections` | `profile_sections_admin` | all | authenticated | app.is_admin() | app.is_admin() |
| `categories` | `categories_read` | select | anon, authenticated | is_active or app.is_staff() |  |
| `categories` | `categories_admin` | all | authenticated | app.is_admin() | app.is_admin() |
| `tags` | `tags_read` | select | anon, authenticated | true |  |
| `tags` | `tags_insert` | insert | authenticated |  | app.is_staff() |
| `tags` | `tags_editor_update` | update | authenticated | app.is_editor() | app.is_editor() |
| `tags` | `tags_editor_delete` | delete | authenticated | app.is_editor() |  |
| `media_assets` | `media_read` | select | anon, authenticated | true |  |
| `media_assets` | `media_insert` | insert | authenticated |  | app.is_staff() and uploaded_by = auth.uid() and (bucket = 'media' or app.can_publish()) |
| `media_assets` | `media_update` | update | authenticated | uploaded_by = auth.uid() or app.is_editor() | app.is_staff() |
| `media_assets` | `media_delete` | delete | authenticated | uploaded_by = auth.uid() or app.is_editor() |  |
| `contributors` | `contributors_read` | select | anon, authenticated | (is_public and is_active) or app.is_staff() |  |
| `contributors` | `contributors_editor` | all | authenticated | app.is_editor() | app.is_editor() |
| `contributors` | `contributors_self_update` | update | authenticated | profile_id = auth.uid() | profile_id = auth.uid() |
| `publication_issues` | `issues_read` | select | anon, authenticated | is_published or app.is_staff() |  |
| `publication_issues` | `issues_publisher` | all | authenticated | app.can_publish() | app.can_publish() |
| `articles` | `articles_public_read` | select | anon, authenticated | app.is_live(status, published_at) |  |
| `articles` | `articles_staff_read` | select | authenticated | app.is_staff() and (created_by = auth.uid() or app.is_article_owner(id) or app.can_edit_section(section_id)) |  |
| `articles` | `articles_insert` | insert | authenticated |  | app.is_staff() |
| `articles` | `articles_update` | update | authenticated | app.is_staff() and (created_by = auth.uid() or app.is_article_owner(id) or app.can_edit_section(section_id)) | app.is_staff() |
| `articles` | `articles_delete` | delete | authenticated | app.is_admin() or (status = 'draft' and created_by = auth.uid()) |  |
| `article_authors` | `article_authors_read` | select | anon, authenticated | app.article_is_live(article_id) or app.can_view_article(article_id) |  |
| `article_authors` | `article_authors_write` | all | authenticated | app.can_modify_article(article_id) | app.can_modify_article(article_id) |
| `article_tags` | `article_tags_read` | select | anon, authenticated | app.article_is_live(article_id) or app.can_view_article(article_id) |  |
| `article_tags` | `article_tags_write` | all | authenticated | app.can_modify_article(article_id) | app.can_modify_article(article_id) |
| `article_media` | `article_media_read` | select | anon, authenticated | app.article_is_live(article_id) or app.can_view_article(article_id) |  |
| `article_media` | `article_media_write` | all | authenticated | app.can_modify_article(article_id) | app.can_modify_article(article_id) |
| `article_revisions` | `article_revisions_read` | select | authenticated | app.can_view_article(article_id) |  |
| `article_revisions` | `article_revisions_insert` | insert | authenticated |  | app.can_modify_article(article_id) and saved_by = auth.uid() and kind in ('autosave', 'manual') |
| `article_activity` | `article_activity_read` | select | authenticated | app.can_view_article(article_id) |  |
| `article_daily_views` | `article_daily_views_staff` | select | authenticated | app.is_staff() |  |
| `article_comments` | `comments_public_read` | select | anon, authenticated | (status = 'approved' and app.article_is_live(article_id)) or app.is_editor() |  |
| `article_comments` | `comments_moderate` | update | authenticated | app.is_editor() | app.is_editor() |
| `article_comments` | `comments_delete` | delete | authenticated | app.is_editor() |  |
| `article_comment_private` | `comment_private_editor` | select | authenticated | app.is_editor() |  |
| `home_slots` | `home_slots_read` | select | anon, authenticated | true |  |
| `home_slots` | `home_slots_write` | all | authenticated | app.can_publish() | app.can_publish() |
| `article_submissions` | `submissions_editor` | all | authenticated | app.is_editor() | app.is_editor() |
| `event_reports` | `event_reports_editor` | all | authenticated | app.is_editor() | app.is_editor() |
| `intake_files` | `intake_files_editor` | select | authenticated | app.is_editor() |  |
| `intake_files` | `intake_files_editor_delete` | delete | authenticated | app.is_editor() |  |
| `contact_messages` | `contact_editor` | all | authenticated | app.is_editor() | app.is_editor() |
| `team_terms` | `team_terms_read` | select | anon, authenticated | true |  |
| `team_terms` | `team_terms_write` | all | authenticated | app.can_publish() | app.can_publish() |
| `team_members` | `team_members_read` | select | anon, authenticated | true |  |
| `team_members` | `team_members_write` | all | authenticated | app.can_publish() | app.can_publish() |
| `department_contacts` | `department_contacts_read` | select | anon, authenticated | true |  |
| `department_contacts` | `department_contacts_write` | all | authenticated | app.is_admin() | app.is_admin() |
| `site_settings` | `site_settings_read` | select | anon, authenticated | is_public or app.is_staff() |  |
| `site_settings` | `site_settings_write` | all | authenticated | app.is_admin() or (app.can_publish() and key = 'ticker') | app.is_admin() or (app.can_publish() and key = 'ticker') |
| `audit_log` | `audit_log_admin` | select | authenticated | app.is_admin() |  |
| `storage.objects` | `v2_public_read` | select | anon, authenticated | bucket_id in ('media', 'archives') |  |
| `storage.objects` | `v2_media_insert` | insert | authenticated |  | bucket_id = 'media' and app.is_staff() |
| `storage.objects` | `v2_media_update` | update | authenticated | bucket_id = 'media' and (owner_id = auth.uid()::text or app.is_editor()) | bucket_id = 'media' and app.is_staff() |
| `storage.objects` | `v2_media_delete` | delete | authenticated | bucket_id = 'media' and (owner_id = auth.uid()::text or app.is_editor()) |  |
| `storage.objects` | `v2_archives_write` | all | authenticated | bucket_id = 'archives' and app.can_publish() | bucket_id = 'archives' and app.can_publish() |
| `storage.objects` | `v2_intake_editor` | select | authenticated | bucket_id = 'intake' and app.is_editor() |  |
| `storage.objects` | `v2_intake_editor_delete` | delete | authenticated | bucket_id = 'intake' and app.is_editor() |  |
| `sk_editions` | `sk_editions_read` | select | anon, authenticated | is_published or app.is_staff() |  |
| `sk_editions` | `sk_editions_write` | all | authenticated | app.can_edit_sk() | app.can_edit_sk() |
| `sk_athlete_stats` | `sk_athlete_stats_read` | select | anon, authenticated | exists (select 1 from public.sk_matches m where m.id = match_id and app.sk_edition_visible(m.edition_id)) |  |
| `sk_athlete_stats` | `sk_athlete_stats_write` | all | authenticated | app.can_edit_sk() | app.can_edit_sk() |
| `sk_team` | `sk_team_read` | select | authenticated | app.is_staff() |  |
| `sk_team` | `sk_team_add` | insert | authenticated |  | app.can_manage_sk_team() |
| `sk_team` | `sk_team_remove` | delete | authenticated | app.can_manage_sk_team() |  |
| `sk_factions` | `sk_factions_read` | select | anon, authenticated | app.sk_edition_visible(edition_id) |  |
| `sk_venues` | `sk_venues_read` | select | anon, authenticated | app.sk_edition_visible(edition_id) |  |
| `sk_sports` | `sk_sports_read` | select | anon, authenticated | app.sk_edition_visible(edition_id) |  |
| `sk_events` | `sk_events_read` | select | anon, authenticated | app.sk_edition_visible(edition_id) |  |
| `sk_athletes` | `sk_athletes_read` | select | anon, authenticated | app.sk_edition_visible(edition_id) |  |
| `sk_matches` | `sk_matches_read` | select | anon, authenticated | app.sk_edition_visible(edition_id) |  |
| `sk_placements` | `sk_placements_read` | select | anon, authenticated | app.sk_edition_visible(edition_id) |  |
| `sk_awards` | `sk_awards_read` | select | anon, authenticated | app.sk_edition_visible(edition_id) |  |
| `sk_entries` | `sk_entries_read` | select | anon, authenticated | app.sk_edition_visible(edition_id) |  |
| `sk_factions` | `sk_factions_write` | all | authenticated | app.can_edit_sk() | app.can_edit_sk() |
| `sk_venues` | `sk_venues_write` | all | authenticated | app.can_edit_sk() | app.can_edit_sk() |
| `sk_sports` | `sk_sports_write` | all | authenticated | app.can_edit_sk() | app.can_edit_sk() |
| `sk_events` | `sk_events_write` | all | authenticated | app.can_edit_sk() | app.can_edit_sk() |
| `sk_athletes` | `sk_athletes_write` | all | authenticated | app.can_edit_sk() | app.can_edit_sk() |
| `sk_matches` | `sk_matches_write` | all | authenticated | app.can_edit_sk() | app.can_edit_sk() |
| `sk_placements` | `sk_placements_write` | all | authenticated | app.can_edit_sk() | app.can_edit_sk() |
| `sk_awards` | `sk_awards_write` | all | authenticated | app.can_edit_sk() | app.can_edit_sk() |
| `sk_entries` | `sk_entries_write` | all | authenticated | app.can_edit_sk() | app.can_edit_sk() |
| `stats_pageviews` | `stats_pageviews_read` | select | authenticated | app.can_view_stats() |  |
| `stats_shares` | `stats_shares_read` | select | authenticated | app.can_view_stats() |  |
| `staff_activity_daily` | `staff_activity_daily_read` | select | authenticated | app.can_view_stats() |  |
| `stats_daily_site` | `stats_daily_site_read` | select | authenticated | app.can_view_stats() |  |
| `stats_daily_articles` | `stats_daily_articles_read` | select | authenticated | app.can_view_stats() |  |
| `stats_daily_dims` | `stats_daily_dims_read` | select | authenticated | app.can_view_stats() |  |
| `stats_daily_shares` | `stats_daily_shares_read` | select | authenticated | app.can_view_stats() |  |
| `stats_rollup_log` | `stats_rollup_log_read` | select | authenticated | app.can_view_stats() |  |

# Appendix G. Storage buckets

| Bucket | Public | Size limit | Allowed types |
|---|---|---|---|
| `media` | yes | 10 MB | image/jpeg, image/png, image/webp, image/avif, image/gif |
| `archives` | yes | 60 MB | application/pdf, image/jpeg, image/png, image/webp |
| `intake` | no | 20 MB | image/jpeg, image/png, image/webp, application/pdf, text/plain, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document |
