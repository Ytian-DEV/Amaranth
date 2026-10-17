-- Statistics: write-only public tracking, who may read, dedupe, staff time, daily totals.
begin;

-- ---------------------------------------------------------------- setup
select tests.logout();
insert into public.staff_invites (email, role) values ('stats.me@test.local', 'managing_editor') on conflict do nothing;
insert into auth.users (email, raw_user_meta_data) values ('stats.me@test.local', '{"display_name":"Max Managing"}');

-- run as the Vercel route does (service role)
create or replace function tests.as_service() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '{"role":"service_role"}', false);
  execute 'set role service_role';
end $$;

-- ---------------------------------------------------------------- the public cannot write or read directly
select tests.login(null);
select tests.expect_error('readers cannot call the ingest function',
  $$select public.stats_ingest('visitor-aaaa-1111', 'session-1111', '[]')$$);
select tests.expect_error('readers cannot insert pageviews',
  $$insert into public.stats_pageviews (client_id, path) values (gen_random_uuid(), '/')$$);
select tests.expect_error('readers cannot read pageviews', $$select 1 from public.stats_pageviews$$);
select tests.expect_error('readers cannot read the overview', $$select public.stats_overview(current_date - 7, current_date)$$);

-- ---------------------------------------------------------------- ingest (service role)
select tests.as_service();
select tests.expect_eq('a batch is recorded',
  (select public.stats_ingest('visitor-aaaa-1111', 'session-1111', jsonb_build_array(
     jsonb_build_object('t', 'pv', 'id', '10000000-0000-0000-0000-000000000001', 'path', '/', 'src', 'direct'),
     jsonb_build_object('t', 'pv', 'id', '10000000-0000-0000-0000-000000000002', 'path', '/article/published-campus-story', 'src', 'social', 'ref', 'Facebook.com'),
     jsonb_build_object('t', 'eng', 'id', '10000000-0000-0000-0000-000000000002', 'secs', 95, 'scroll', 100),
     jsonb_build_object('t', 'share', 'path', '/article/published-campus-story', 'ch', 'facebook'),
     jsonb_build_object('t', 'share', 'path', '/article/published-campus-story', 'ch', 'carrier-pigeon'),
     jsonb_build_object('t', 'pv', 'id', 'not-a-uuid', 'path', '/x'),
     jsonb_build_object('t', 'pv', 'id', '10000000-0000-0000-0000-000000000009', 'path', '/article/writer-draft')
   ), 'mobile', 'Chrome', 'Android'))::text,
  '6');
select tests.expect_eq('the same visitor reading again within 30 min is not a new view',
  (select public.stats_ingest('visitor-aaaa-1111', 'session-1111',
     jsonb_build_array(jsonb_build_object('t', 'pv', 'id', '10000000-0000-0000-0000-000000000003', 'path', '/article/published-campus-story')),
     'mobile', 'Chrome', 'Android'))::text, '1');
select public.stats_ingest('visitor-bbbb-2222', 'session-2222',
  jsonb_build_array(jsonb_build_object('t', 'pv', 'id', '10000000-0000-0000-0000-000000000004', 'path', '/article/published-campus-story', 'src', 'search', 'ref', 'google.com')),
  'desktop', 'Firefox', 'Windows');
-- Do Not Track: no ids; the view counts, engagement and shares are dropped
select public.stats_ingest(null, null, jsonb_build_array(
  jsonb_build_object('t', 'pv', 'id', '10000000-0000-0000-0000-000000000005', 'path', '/article/published-campus-story'),
  jsonb_build_object('t', 'eng', 'id', '10000000-0000-0000-0000-000000000005', 'secs', 50, 'scroll', 50),
  jsonb_build_object('t', 'share', 'path', '/article/published-campus-story', 'ch', 'x')), 'tablet', 'Safari', 'iOS');

select tests.logout();
select tests.expect_count('pageviews stored (bad id skipped; the draft page is a plain pageview)', 'select 1 from public.stats_pageviews', 6);
select tests.expect_eq('draft articles are not linked or counted',
  (select coalesce(article_id::text, 'none') from public.stats_pageviews where client_id = '10000000-0000-0000-0000-000000000009'), 'none');
select tests.expect_count('counted views: first read, other visitor, DNT visitor', 'select 1 from public.stats_pageviews where counted', 3);
select tests.expect_eq('no raw ids are stored (hashed)',
  (select count(*)::text from public.stats_pageviews where visitor_hash = 'visitor-aaaa-1111' or length(visitor_hash) <> 64), '0');
select tests.expect_eq('engagement attached to the pageview',
  (select active_seconds || '/' || max_scroll from public.stats_pageviews where client_id = '10000000-0000-0000-0000-000000000002'), '95/100');
select tests.expect_eq('DNT pageview has no id or engagement',
  (select coalesce(visitor_hash, 'none') || '/' || active_seconds from public.stats_pageviews where client_id = '10000000-0000-0000-0000-000000000005'), 'none/0');
select tests.expect_eq('shares: known channel, unknown becomes other, DNT dropped',
  (select string_agg(channel, ',' order by channel) from public.stats_shares), 'facebook,other');
select tests.expect_eq('referrer host lower-cased', (select referrer_host from public.stats_pageviews where client_id = '10000000-0000-0000-0000-000000000002'), 'facebook.com');
select tests.expect_eq('"Most read" counter still updated (3 counted views)',
  (select view_count::text from public.articles where id = '00000000-0000-0000-0000-000000000001'), '3');

-- replay of a pageview id is ignored
select tests.as_service();
select public.stats_ingest('visitor-aaaa-1111', 'session-1111',
  jsonb_build_array(jsonb_build_object('t', 'pv', 'id', '10000000-0000-0000-0000-000000000002', 'path', '/article/published-campus-story')), 'mobile', 'Chrome', 'Android');
select tests.logout();
select tests.expect_count('replayed pageview id not stored twice', 'select 1 from public.stats_pageviews', 6);

-- ---------------------------------------------------------------- who can read
select tests.login('writer@test.local');
select tests.expect_error('staff writer cannot read the overview', $$select public.stats_overview(current_date - 7, current_date)$$, '%only for%');
select tests.expect_count('staff writer sees no raw pageviews (RLS)', 'select 1 from public.stats_pageviews', 0);
select tests.login('news.editor@test.local');
select tests.expect_error('section editor cannot read staff usage', $$select public.stats_staff_usage(current_date - 7, current_date)$$, '%only for%');

select tests.login('stats.me@test.local');
select tests.expect_eq('managing editor reads the overview',
  (select (public.stats_overview(app.manila_today() - 6, app.manila_today()) -> 'current' ->> 'pageviews')), '6');
select tests.expect_eq('overview: counted views and shares',
  (select (o -> 'current' ->> 'views') || '/' || (o -> 'current' ->> 'shares') from public.stats_overview(app.manila_today() - 6, app.manila_today()) o), '3/2');
select tests.expect_eq('overview series has one row per day', (select jsonb_array_length(public.stats_overview(app.manila_today() - 6, app.manila_today()) -> 'series')::text), '7');
select tests.expect_eq('top article: views, avg read, finish rate, shares',
  (select views || '/' || avg_read_seconds || '/' || finish_rate || '/' || shares from public.stats_articles(app.manila_today() - 6, app.manila_today(), 5)), '3/95/100/2');
select tests.expect_eq('author breakdown', (select name || ':' || views from public.stats_authors(app.manila_today() - 6, app.manila_today())), 'Wes Writer:3');
select tests.expect_eq('sources', (select string_agg(value || '=' || pageviews, ',' order by value) from public.stats_breakdown(app.manila_today() - 6, app.manila_today(), 'source')), 'direct=4,search=1,social=1');
select tests.expect_eq('devices', (select string_agg(value || '=' || pageviews, ',' order by value) from public.stats_breakdown(app.manila_today() - 6, app.manila_today(), 'device')), 'desktop=1,mobile=4,tablet=1');
select tests.expect_eq('share channels', (select string_agg(channel || '=' || shares, ',') from public.stats_share_channels(app.manila_today() - 6, app.manila_today())), 'facebook=1,other=1');
select tests.expect_error('unknown breakdown rejected', $$select public.stats_breakdown(current_date - 7, current_date, 'ip')$$);
select tests.expect_error('date range limited', $$select public.stats_overview(current_date - 900, current_date)$$);
select tests.login('eic@test.local');
select tests.expect_count('executive editor can read too', 'select 1 from public.stats_articles(app.manila_today() - 6, app.manila_today(), 5)', 1);
select tests.login('admin@test.local');
select tests.expect_count('super admin reads raw rows (RLS)', 'select 1 from public.stats_pageviews', 6);

-- ---------------------------------------------------------------- staff heartbeat
select tests.login(null);
select tests.expect_error('readers cannot send heartbeats', $$select public.staff_heartbeat()$$);
select tests.login('writer@test.local');
select tests.expect_eq('first beat of a session credits nothing', (select public.staff_heartbeat()::text), '0');
select tests.logout();
update public.staff_activity_daily set last_beat_at = now() - interval '30 seconds' where profile_id = (select id from public.profiles where email = 'writer@test.local');
select tests.login('writer@test.local');
select tests.expect_eq('a beat 30 s after the last one credits 30 s', (select public.staff_heartbeat()::text), '30');
select tests.logout();
update public.staff_activity_daily set last_beat_at = now() - interval '80 seconds' where profile_id = (select id from public.profiles where email = 'writer@test.local');
select tests.login('writer@test.local');
select tests.expect_eq('credit is capped at 45 s per beat', (select public.staff_heartbeat()::text), '45');
select tests.logout();
update public.staff_activity_daily set last_beat_at = now() - interval '10 minutes' where profile_id = (select id from public.profiles where email = 'writer@test.local');
select tests.login('writer@test.local');
select tests.expect_eq('after idling (no beats for minutes) the gap is not counted', (select public.staff_heartbeat()::text), '0');
select tests.expect_count('staff cannot read their own usage', 'select 1 from public.staff_activity_daily', 0);
select tests.expect_error('staff cannot use the usage report', $$select public.stats_staff_usage(current_date, current_date)$$);
select tests.expect_error('staff cannot write their own time', $$update public.staff_activity_daily set active_seconds = 99999$$);
select tests.login('stats.me@test.local');
select tests.expect_eq('managing editor sees the writer''s active time (75 s) and last active',
  (select active_seconds || '/' || (last_active_at is not null) from public.stats_staff_usage(app.manila_today(), app.manila_today()) where display_name = 'Wes Writer'), '75/true');

-- ---------------------------------------------------------------- daily totals (nightly job)
select tests.logout();
update public.stats_pageviews set day = app.manila_today() - 1;
update public.stats_shares set day = app.manila_today() - 1;
select app.stats_nightly();
select tests.expect_eq('yesterday rolled up', (select pageviews || '/' || views || '/' || shares from public.stats_daily_site where day = app.manila_today() - 1), '6/3/2');
select tests.expect_eq('article totals rolled up', (select views || '/' || finished || '/' || shares from public.stats_daily_articles where day = app.manila_today() - 1), '3/1/2');
select tests.expect_count('dimension totals rolled up', 'select 1 from public.stats_daily_dims where day = app.manila_today() - 1', 14);
-- raw rows gone (as after 13 months): reports still come from the totals
delete from public.stats_pageviews;
delete from public.stats_shares;
select tests.login('stats.me@test.local');
select tests.expect_eq('overview reads the daily totals once raw data is gone',
  (select (o -> 'current' ->> 'pageviews') || '/' || (o -> 'current' ->> 'views') from public.stats_overview(app.manila_today() - 6, app.manila_today()) o), '6/3');
select tests.expect_eq('top articles read the daily totals', (select views::text from public.stats_articles(app.manila_today() - 6, app.manila_today(), 5)), '3');
select tests.expect_eq('breakdowns read the daily totals', (select string_agg(value, ',' order by value) from public.stats_breakdown(app.manila_today() - 6, app.manila_today(), 'browser')), 'Chrome,Firefox,Safari');

-- retention
select tests.logout();
insert into public.staff_activity_daily (profile_id, day, active_seconds) select id, app.manila_today() - 800, 10 from public.profiles where email = 'writer@test.local';
select app.stats_nightly();
select tests.expect_count('staff activity older than 24 months is deleted', $$select 1 from public.staff_activity_daily where day < app.manila_today() - 750$$, 0);
select tests.expect_count('old daily salts are deleted', $$select 1 from app.stats_salts where day < app.manila_today() - 1$$, 0);

rollback;
