# AMARANTH v2 — Statistics

First-party reader statistics and newsroom activity. No third-party analytics service and no cookies.
Only **Super admin, Executive Editor and Managing editor** can see any of it. The database enforces this through `app.can_view_stats()` (RLS on every table, plus a check inside every `stats_*` function), so it doesn't depend on the UI hiding a link.

## Setup (once)
1. Paste **`supabase/v2/stats.sql`** into the Supabase SQL editor and run it. Paste it after `schema.sql` and `salingkusog.sql`. It's safe to re-run.
   - If `schema.sql` was pasted before this feature, paste it once more too. Its policy-reset loop now leaves the `stats_*` tables alone, so re-running it later won't remove their policies.
   - pg_cron is already enabled, so the file schedules `amaranth-stats-nightly` (00:15 Manila) by itself. Check it with `select * from cron.job;`.
2. On Vercel, add **`SUPABASE_SERVICE_ROLE_KEY`** (Supabase → Settings → API → `service_role`) for **Production**, then redeploy.
   - Only the `/api/e` function uses this key. It never reaches the browser.
   - Without it, `/api/e` answers 501 and the site falls back to the old view counter, so "Most read" keeps working. Statistics stay empty.

## How it works
| Piece | File | What |
|---|---|---|
| Tracker | `src/features/public/analytics/tracker.ts`, `usePageTracking.ts` | Queues pageviews, active reading time, scroll depth and share clicks. Sends them in batches to `/api/e` every 10 s, and with `sendBeacon` when the tab is hidden. Runs only on the production host (`VITE_SITE_URL`). It is off on previews and localhost, for signed-in staff and in `/admin`. |
| Ingest | `api/e.ts`, `api/_lib/traffic.ts` | Drops bots by user agent, rejects other origins and bodies over 16 KB, and works out device, browser, OS and traffic source. It forwards only the cleaned events to `stats_ingest` with the service key. The IP address is never forwarded or stored. |
| Database | `supabase/v2/stats.sql` | `stats_ingest` (service role only, 25 events a batch, rate-limited). Raw tables `stats_pageviews` and `stats_shares`, daily rollups, staff `staff_activity_daily`, the `staff_heartbeat()` RPC, and the read RPCs `stats_overview`, `stats_articles`, `stats_authors`, `stats_sections`, `stats_breakdown`, `stats_share_channels` and `stats_staff_usage`. |
| Newsroom page | `src/features/cms/statistics/*` | `/admin/statistics`: date range (kept in the URL), summary cards with change vs the previous period, trend chart, top articles, authors, sections, traffic sources, referrers, devices, browsers, share channels, and staff active time in H:MM:SS. |
| Staff time | `src/features/cms/layout/useStaffHeartbeat.ts` | Every 30 s while the newsroom tab is visible and used in the last minute. The server credits at most 45 s per beat, and nothing after a gap of more than 90 s. |

## Privacy rules
- **Anonymous ids:** the visitor id lives in the browser (`localStorage` `amaranth:v`). The database stores only `sha256(daily salt + id)`. Salts are deleted after 2 days, so visits on different days can't be linked.
  - Because of this, "Visitors" for a range is the sum of daily unique visitors.
- **Do Not Track / Global Privacy Control:** the pageview is counted with no id. No reading time, scroll or share events are sent.
- **Article views:** one per visitor, per article, per 30 minutes. They also feed "Most read" (`record_article_view`).
- **Retention** (`app.stats_nightly`):
  - raw events: 13 months;
  - daily totals: forever;
  - staff activity: 24 months.
- **Privacy page:** `/privacy` (linked from the footer) explains all of this. The `#staff` section covers newsroom activity, and the newsroom sidebar links to it.
- **Vercel Web Analytics:** `@vercel/analytics` was already in `RootLayout.tsx` before this feature and is still there. The privacy page mentions it.

## How to test
- **Automated:** `npm run check` covers these tests:
  - `src/features/cms/statistics/statistics.test.tsx`: formatting, range parsing, roles, tracker helpers, heartbeat and the view;
  - `api/_lib/traffic.test.ts`: bot filter, UA parsing, source classification and event shaping.

  `npm run db:test` runs `supabase/tests/stats.test.sql`, which covers:
  - roles: anon and lower roles get nothing, and staff can't read their own usage;
  - ingest validation, de-duplication, replays and DNT pageviews;
  - rollups and retention;
  - heartbeat crediting.
- **Fixtures (dev server):**
  - `/dev/admin/statistics` (the range picker works);
  - `/dev/admin/statistics/empty`;
  - `/dev/admin/statistics/loading`;
  - `/dev/privacy`.
- **Locally against a real Supabase project:**
  1. Set `VITE_STATS_DEBUG=true` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`, and run `vercel dev` so `/api/e` exists.
  2. Open an article signed out, read it for a while, press a share button, then switch tabs.
  3. In the SQL editor, check the raw rows: `select * from stats_pageviews order by created_at desc limit 5;`.
  4. Sign in as a Managing editor and open `/admin/statistics`. Today's numbers come straight from the raw tables, so there's no need to wait for the nightly job.
- **Access check:** sign in as a Section editor or Staff writer.
  - Statistics is missing from the sidebar, and `/admin/statistics` redirects to the overview.
  - `select stats_overview(current_date - 7, current_date)` run as that user fails with "Statistics are only for Super admin, Executive Editor and Managing editor."
- **On production after deploy:** open the site in a private window, then check Network → `/api/e` returns 204.
