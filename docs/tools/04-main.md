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

