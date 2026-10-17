-- =============================================================================
-- AMARANTH v2 — Statistics add-on
--
-- Paste AFTER schema.sql (any time; re-runnable). Tables are prefixed stats_
-- (plus staff_activity_daily).
--
-- Who can do what
--   readers (anon)        nothing directly. The site records events through the
--                         Vercel route /api/e, which calls public.stats_ingest()
--                         with the service role (bots filtered there).
--   any staff             their newsroom tab reports active time through
--                         public.staff_heartbeat(); they cannot read any stats,
--                         not even their own
--   super_admin, editor_in_chief ("Executive Editor"), managing_editor
--                         read everything (app.can_view_stats())
--
-- Privacy: no IPs, names or e-mails in public tracking. The browser's random id
-- is hashed with a salt that changes every day (and is deleted after two days),
-- so a visitor cannot be followed from one day to the next. Visitors with Do Not
-- Track / Global Privacy Control send no id at all.
--
-- Retention (nightly pg_cron job, when the extension is enabled):
--   raw events 13 months, daily totals forever, staff activity 24 months.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function app.can_view_stats()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app.current_role() in ('super_admin', 'editor_in_chief', 'managing_editor'), false);
$$;

create or replace function app.manila_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Manila')::date;
$$;

-- Daily salts for hashing visitor/session ids (private: no grants)
create table if not exists app.stats_salts (
  day date primary key,
  salt text not null default gen_random_uuid()::text
);
revoke all on app.stats_salts from public;

create or replace function app.stats_hash(p_raw text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day date := app.manila_today();
  v_salt text;
begin
  if p_raw is null or length(p_raw) not between 8 and 64 then
    return null;
  end if;
  insert into app.stats_salts (day) values (v_day) on conflict (day) do nothing;
  select s.salt into v_salt from app.stats_salts s where s.day = v_day;
  return encode(sha256(convert_to(v_salt || ':' || p_raw, 'UTF8')), 'hex');
end;
$$;

-- -----------------------------------------------------------------------------
-- Raw events
-- -----------------------------------------------------------------------------
create table if not exists public.stats_pageviews (
  id bigint generated always as identity primary key,
  client_id uuid not null unique,                 -- the browser's id for this pageview (engagement attaches to it)
  occurred_at timestamptz not null default now(),
  day date not null default app.manila_today(),
  path text not null check (length(path) between 1 and 300),
  article_id uuid references public.articles (id) on delete set null,
  visitor_hash text,                              -- null: Do Not Track
  session_hash text,
  source text not null default 'direct' check (source in ('direct', 'social', 'search', 'referral', 'internal', 'campaign')),
  referrer_host text check (referrer_host is null or length(referrer_host) <= 120),
  utm_source text check (utm_source is null or length(utm_source) <= 80),
  utm_medium text check (utm_medium is null or length(utm_medium) <= 80),
  utm_campaign text check (utm_campaign is null or length(utm_campaign) <= 80),
  device text not null default 'desktop' check (device in ('mobile', 'tablet', 'desktop')),
  browser text not null default 'Other' check (length(browser) <= 40),
  os text not null default 'Other' check (length(os) <= 40),
  counted boolean not null default false,         -- a deduplicated article view (one per visitor per article per 30 min)
  active_seconds integer not null default 0 check (active_seconds between 0 and 14400),
  max_scroll smallint not null default 0 check (max_scroll between 0 and 100)
);
create index if not exists stats_pageviews_day_idx on public.stats_pageviews (day);
create index if not exists stats_pageviews_article_idx on public.stats_pageviews (article_id, day) where article_id is not null;
create index if not exists stats_pageviews_dedupe_idx on public.stats_pageviews (visitor_hash, article_id, occurred_at desc) where article_id is not null;

create table if not exists public.stats_shares (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  day date not null default app.manila_today(),
  article_id uuid not null references public.articles (id) on delete cascade,
  channel text not null check (channel in ('facebook', 'messenger', 'x', 'copy', 'native', 'other')),
  visitor_hash text
);
create index if not exists stats_shares_day_idx on public.stats_shares (day);
create index if not exists stats_shares_article_idx on public.stats_shares (article_id, day);

-- Staff active time in the newsroom, one row per person per day (Manila)
create table if not exists public.staff_activity_daily (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  active_seconds integer not null default 0 check (active_seconds >= 0),
  last_beat_at timestamptz,
  primary key (profile_id, day)
);
create index if not exists staff_activity_daily_day_idx on public.staff_activity_daily (day);

-- -----------------------------------------------------------------------------
-- Daily totals (kept forever; raw events are deleted after 13 months)
-- -----------------------------------------------------------------------------
create table if not exists public.stats_daily_site (
  day date primary key,
  pageviews integer not null default 0,
  views integer not null default 0,
  visitors integer not null default 0,
  sessions integer not null default 0,
  active_seconds bigint not null default 0,
  read_samples integer not null default 0,
  shares integer not null default 0
);

create table if not exists public.stats_daily_articles (
  day date not null,
  article_id uuid not null references public.articles (id) on delete cascade,
  pageviews integer not null default 0,
  views integer not null default 0,
  visitors integer not null default 0,
  active_seconds bigint not null default 0,
  read_samples integer not null default 0,
  scroll_sum bigint not null default 0,
  scroll_samples integer not null default 0,
  finished integer not null default 0,
  shares integer not null default 0,
  primary key (day, article_id)
);
create index if not exists stats_daily_articles_article_idx on public.stats_daily_articles (article_id);

create table if not exists public.stats_daily_dims (
  day date not null,
  dim text not null check (dim in ('source', 'referrer', 'device', 'browser', 'os')),
  value text not null,
  pageviews integer not null default 0,
  visitors integer not null default 0,
  primary key (day, dim, value)
);

create table if not exists public.stats_daily_shares (
  day date not null,
  channel text not null,
  shares integer not null default 0,
  primary key (day, channel)
);

create table if not exists public.stats_rollup_log (
  day date primary key,
  rolled_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Write path: public.stats_ingest (service role only, called by /api/e)
-- p_events: [{"t":"pv","id":"<uuid>","path":"/article/x","src":"social","ref":"facebook.com","us":"…","um":"…","uc":"…"},
--            {"t":"eng","id":"<uuid>","secs":42,"scroll":80},
--            {"t":"share","path":"/article/x","ch":"facebook"}]
-- -----------------------------------------------------------------------------
create or replace function public.stats_ingest(
  p_visitor text,
  p_session text,
  p_events jsonb,
  p_device text default 'desktop',
  p_browser text default 'Other',
  p_os text default 'Other'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_visitor text := app.stats_hash(p_visitor);
  v_session text := app.stats_hash(p_session);
  v_device text := case when p_device in ('mobile', 'tablet', 'desktop') then p_device else 'desktop' end;
  v_browser text := left(coalesce(nullif(trim(p_browser), ''), 'Other'), 40);
  v_os text := left(coalesce(nullif(trim(p_os), ''), 'Other'), 40);
  e jsonb;
  n integer := 0;
  v_path text;
  v_slug text;
  v_article uuid;
  v_counted boolean;
  v_uuid_re constant text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
begin
  if jsonb_typeof(p_events) is distinct from 'array' then
    raise exception 'Events must be a list.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_events) > 25 then
    raise exception 'Too many events in one batch.' using errcode = '22023';
  end if;
  -- per visitor per hour; visitors without an id (Do Not Track) share one large bucket
  perform app.rate_limit('stats:' || coalesce(v_visitor, 'anonymous'), case when v_visitor is null then 20000 else 600 end, interval '1 hour');

  for e in select value from jsonb_array_elements(p_events) loop
    if jsonb_typeof(e) is distinct from 'object' then
      continue;
    end if;
    v_path := left(coalesce(e ->> 'path', ''), 300);
    v_slug := substring(v_path from '^/article/([a-z0-9-]+)/?$');
    v_article := null;
    if v_slug is not null then
      select a.id into v_article from public.articles a where a.slug = v_slug and app.is_live(a.status, a.published_at);
    end if;

    if e ->> 't' = 'pv' then
      if coalesce(e ->> 'id', '') !~ v_uuid_re or v_path !~ '^/' then
        continue;
      end if;
      v_counted := v_article is not null and (
        v_visitor is null
        or not exists (
          select 1 from public.stats_pageviews p
          where p.visitor_hash = v_visitor and p.article_id = v_article and p.counted
            and p.occurred_at > now() - interval '30 minutes'
        )
      );
      insert into public.stats_pageviews (
        client_id, path, article_id, visitor_hash, session_hash, source, referrer_host,
        utm_source, utm_medium, utm_campaign, device, browser, os, counted
      ) values (
        (e ->> 'id')::uuid, v_path, v_article, v_visitor, v_session,
        case when e ->> 'src' in ('direct', 'social', 'search', 'referral', 'internal', 'campaign') then e ->> 'src' else 'direct' end,
        left(nullif(lower(e ->> 'ref'), ''), 120),
        left(nullif(e ->> 'us', ''), 80), left(nullif(e ->> 'um', ''), 80), left(nullif(e ->> 'uc', ''), 80),
        v_device, v_browser, v_os, v_counted
      )
      on conflict (client_id) do nothing;
      -- keeps "Most read" and articles.view_count working (they come from the same counted views)
      if found and v_counted then
        perform public.record_article_view(v_article);
      end if;
      n := n + 1;

    elsif e ->> 't' = 'eng' then
      if coalesce(e ->> 'id', '') !~ v_uuid_re or v_visitor is null then
        continue;
      end if;
      update public.stats_pageviews p
      set active_seconds = greatest(p.active_seconds, least(case when e ->> 'secs' ~ '^\d{1,6}$' then (e ->> 'secs')::integer else 0 end, 14400)),
          max_scroll = greatest(p.max_scroll, least(case when e ->> 'scroll' ~ '^\d{1,3}$' then (e ->> 'scroll')::integer else 0 end, 100))
      where p.client_id = (e ->> 'id')::uuid
        and p.visitor_hash = v_visitor
        and p.occurred_at > now() - interval '1 day';
      n := n + 1;

    elsif e ->> 't' = 'share' then
      if v_article is null or v_visitor is null then
        continue;
      end if;
      insert into public.stats_shares (article_id, channel, visitor_hash)
      values (v_article, case when e ->> 'ch' in ('facebook', 'messenger', 'x', 'copy', 'native') then e ->> 'ch' else 'other' end, v_visitor);
      n := n + 1;
    end if;
  end loop;
  return n;
end;
$$;

-- -----------------------------------------------------------------------------
-- Staff heartbeat: the newsroom calls this every ~30 s while the tab is visible
-- and the person was active in the last minute. Credit is the time since the
-- last beat, capped at 45 s, and only when that beat was under 90 s ago, so a
-- forgotten tab or a burst of calls cannot add time.
-- -----------------------------------------------------------------------------
create or replace function public.staff_heartbeat()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_day date := app.manila_today();
  v_last timestamptz;
  v_credit integer := 0;
begin
  if v_uid is null or not app.is_staff() then
    raise exception 'Staff only.' using errcode = '42501';
  end if;
  select max(a.last_beat_at) into v_last from public.staff_activity_daily a where a.profile_id = v_uid and a.day >= v_day - 1;
  if v_last is not null and v_last > now() - interval '90 seconds' then
    v_credit := least(45, greatest(0, floor(extract(epoch from now() - v_last))::integer));
  end if;
  insert into public.staff_activity_daily (profile_id, day, active_seconds, last_beat_at)
  values (v_uid, v_day, v_credit, now())
  on conflict (profile_id, day) do update
    set active_seconds = public.staff_activity_daily.active_seconds + excluded.active_seconds,
        last_beat_at = excluded.last_beat_at;
  update public.profiles set last_seen_at = now() where id = v_uid;
  return v_credit;
end;
$$;

-- -----------------------------------------------------------------------------
-- Daily totals and retention
-- -----------------------------------------------------------------------------
create or replace function app.stats_rollup_day(p_day date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.stats_daily_site where day = p_day;
  insert into public.stats_daily_site (day, pageviews, views, visitors, sessions, active_seconds, read_samples, shares)
  select p_day,
         (select count(*) from public.stats_pageviews where day = p_day),
         (select count(*) from public.stats_pageviews where day = p_day and counted),
         (select count(distinct visitor_hash) from public.stats_pageviews where day = p_day),
         (select count(distinct session_hash) from public.stats_pageviews where day = p_day),
         (select coalesce(sum(active_seconds), 0) from public.stats_pageviews where day = p_day and article_id is not null),
         (select count(*) from public.stats_pageviews where day = p_day and article_id is not null and active_seconds > 0),
         (select count(*) from public.stats_shares where day = p_day);

  delete from public.stats_daily_articles where day = p_day;
  insert into public.stats_daily_articles (day, article_id, pageviews, views, visitors, active_seconds, read_samples, scroll_sum, scroll_samples, finished, shares)
  select p_day, a.article_id, coalesce(pv.pageviews, 0), coalesce(pv.views, 0), coalesce(pv.visitors, 0), coalesce(pv.secs, 0),
         coalesce(pv.samples, 0), coalesce(pv.scroll_sum, 0), coalesce(pv.scroll_samples, 0), coalesce(pv.finished, 0), coalesce(sh.shares, 0)
  from (
    select article_id from public.stats_pageviews where day = p_day and article_id is not null
    union
    select article_id from public.stats_shares where day = p_day
  ) a
  left join (
    select article_id, count(*) as pageviews, count(*) filter (where counted) as views, count(distinct visitor_hash) as visitors,
           sum(active_seconds) as secs, count(*) filter (where active_seconds > 0) as samples,
           sum(max_scroll) filter (where max_scroll > 0) as scroll_sum, count(*) filter (where max_scroll > 0) as scroll_samples,
           count(*) filter (where max_scroll >= 90) as finished
    from public.stats_pageviews where day = p_day and article_id is not null group by article_id
  ) pv on pv.article_id = a.article_id
  left join (
    select article_id, count(*) as shares from public.stats_shares where day = p_day group by article_id
  ) sh on sh.article_id = a.article_id
  where exists (select 1 from public.articles x where x.id = a.article_id);

  delete from public.stats_daily_dims where day = p_day;
  insert into public.stats_daily_dims (day, dim, value, pageviews, visitors)
  select p_day, d.dim, d.value, count(*), count(distinct d.visitor_hash)
  from public.stats_pageviews p
  cross join lateral (values ('source', p.source, p.visitor_hash), ('referrer', p.referrer_host, p.visitor_hash),
                              ('device', p.device, p.visitor_hash), ('browser', p.browser, p.visitor_hash), ('os', p.os, p.visitor_hash)) as d (dim, value, visitor_hash)
  where p.day = p_day and d.value is not null
  group by d.dim, d.value;

  delete from public.stats_daily_shares where day = p_day;
  insert into public.stats_daily_shares (day, channel, shares)
  select p_day, channel, count(*) from public.stats_shares where day = p_day group by channel;

  insert into public.stats_rollup_log (day) values (p_day)
  on conflict (day) do update set rolled_at = now();
end;
$$;

-- Nightly: total up every finished day not done yet, then apply retention.
create or replace function app.stats_nightly()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := app.manila_today();
  v_from date;
  d date;
begin
  v_from := coalesce(
    (select max(day) + 1 from public.stats_rollup_log),
    least((select min(day) from public.stats_pageviews), (select min(day) from public.stats_shares)),
    v_today - 1
  );
  for d in select generate_series(v_from, v_today - 1, interval '1 day')::date loop
    perform app.stats_rollup_day(d);
  end loop;

  delete from public.stats_pageviews where day < (v_today - interval '13 months')::date;
  delete from public.stats_shares where day < (v_today - interval '13 months')::date;
  delete from public.staff_activity_daily where day < (v_today - interval '24 months')::date;
  delete from app.stats_salts where day < v_today - 1;
end;
$$;

-- First day still read from raw events (everything before it has daily totals)
create or replace function app.stats_live_from()
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select max(day) + 1 from public.stats_rollup_log), date '2000-01-01');
$$;

-- -----------------------------------------------------------------------------
-- Read path (internal): daily totals for finished days + raw events after them
-- -----------------------------------------------------------------------------
create or replace function app.stats_site_days(p_from date, p_to date)
returns table (day date, pageviews bigint, views bigint, visitors bigint, sessions bigint, active_seconds bigint, read_samples bigint, shares bigint)
language sql
stable
security definer
set search_path = ''
as $$
  with live_from as (select greatest(p_from, app.stats_live_from()) as d),
  live as (
    select p.day, count(*) as pageviews, count(*) filter (where p.counted) as views, count(distinct p.visitor_hash) as visitors,
           count(distinct p.session_hash) as sessions,
           coalesce(sum(p.active_seconds) filter (where p.article_id is not null), 0) as active_seconds,
           count(*) filter (where p.article_id is not null and p.active_seconds > 0) as read_samples
    from public.stats_pageviews p, live_from l
    where p.day between l.d and p_to
    group by p.day
  ),
  live_shares as (
    select s.day, count(*) as shares from public.stats_shares s, live_from l where s.day between l.d and p_to group by s.day
  )
  select s.day, s.pageviews, s.views, s.visitors, s.sessions, s.active_seconds, s.read_samples, s.shares
  from public.stats_daily_site s, live_from l
  where s.day between p_from and p_to and s.day < l.d
  union all
  select coalesce(v.day, sh.day), coalesce(v.pageviews, 0), coalesce(v.views, 0), coalesce(v.visitors, 0), coalesce(v.sessions, 0),
         coalesce(v.active_seconds, 0), coalesce(v.read_samples, 0), coalesce(sh.shares, 0)
  from live v full join live_shares sh on sh.day = v.day;
$$;

create or replace function app.stats_article_totals(p_from date, p_to date)
returns table (article_id uuid, pageviews bigint, views bigint, visitors bigint, active_seconds bigint, read_samples bigint,
               scroll_sum bigint, scroll_samples bigint, finished bigint, shares bigint)
language sql
stable
security definer
set search_path = ''
as $$
  with live_from as (select greatest(p_from, app.stats_live_from()) as d),
  rows as (
    select a.article_id, a.pageviews::bigint, a.views::bigint, a.visitors::bigint, a.active_seconds, a.read_samples::bigint,
           a.scroll_sum, a.scroll_samples::bigint, a.finished::bigint, a.shares::bigint
    from public.stats_daily_articles a, live_from l
    where a.day between p_from and p_to and a.day < l.d
    union all
    select p.article_id, count(*), count(*) filter (where p.counted), count(distinct p.visitor_hash), sum(p.active_seconds),
           count(*) filter (where p.active_seconds > 0), coalesce(sum(p.max_scroll) filter (where p.max_scroll > 0), 0),
           count(*) filter (where p.max_scroll > 0), count(*) filter (where p.max_scroll >= 90), 0
    from public.stats_pageviews p, live_from l
    where p.day between l.d and p_to and p.article_id is not null
    group by p.article_id, p.day
    union all
    select s.article_id, 0, 0, 0, 0, 0, 0, 0, 0, count(*)
    from public.stats_shares s, live_from l
    where s.day between l.d and p_to
    group by s.article_id
  )
  -- visitors are daily uniques summed over the range (ids change daily by design)
  select article_id, sum(pageviews)::bigint, sum(views)::bigint, sum(visitors)::bigint, sum(active_seconds)::bigint, sum(read_samples)::bigint,
         sum(scroll_sum)::bigint, sum(scroll_samples)::bigint, sum(finished)::bigint, sum(shares)::bigint
  from rows
  group by article_id;
$$;

create or replace function app.stats_dim_totals(p_from date, p_to date, p_dim text)
returns table (value text, pageviews bigint, visitors bigint)
language sql
stable
security definer
set search_path = ''
as $$
  with live_from as (select greatest(p_from, app.stats_live_from()) as d),
  rows as (
    select d.value, d.pageviews::bigint, d.visitors::bigint
    from public.stats_daily_dims d, live_from l
    where d.dim = p_dim and d.day between p_from and p_to and d.day < l.d
    union all
    select x.value, count(*), count(distinct x.visitor_hash)
    from public.stats_pageviews p, live_from l,
         lateral (select case p_dim when 'source' then p.source when 'referrer' then p.referrer_host when 'device' then p.device
                                    when 'browser' then p.browser when 'os' then p.os end as value, p.visitor_hash) x
    where p.day between l.d and p_to and x.value is not null
    group by x.value, p.day
  )
  select value, sum(pageviews)::bigint, sum(visitors)::bigint from rows group by value order by 2 desc;
$$;

-- -----------------------------------------------------------------------------
-- Read path (public RPCs): stats viewers only
-- -----------------------------------------------------------------------------
create or replace function app.stats_require(p_from date, p_to date)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not app.can_view_stats() then
    raise exception 'Statistics are only for Super admin, Executive Editor and Managing editor.' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 800 then
    raise exception 'Choose a date range of up to two years.' using errcode = '22023';
  end if;
end;
$$;

-- Totals for the range and the same-length period before it, plus a daily series.
create or replace function public.stats_overview(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_len integer := p_to - p_from + 1;
  v_now jsonb;
  v_prev jsonb;
  v_series jsonb;
begin
  perform app.stats_require(p_from, p_to);
  select jsonb_build_object('pageviews', coalesce(sum(pageviews), 0), 'views', coalesce(sum(views), 0), 'visitors', coalesce(sum(visitors), 0),
                            'sessions', coalesce(sum(sessions), 0), 'active_seconds', coalesce(sum(active_seconds), 0),
                            'read_samples', coalesce(sum(read_samples), 0), 'shares', coalesce(sum(shares), 0))
    into v_now from app.stats_site_days(p_from, p_to);
  select jsonb_build_object('pageviews', coalesce(sum(pageviews), 0), 'views', coalesce(sum(views), 0), 'visitors', coalesce(sum(visitors), 0),
                            'sessions', coalesce(sum(sessions), 0), 'active_seconds', coalesce(sum(active_seconds), 0),
                            'read_samples', coalesce(sum(read_samples), 0), 'shares', coalesce(sum(shares), 0))
    into v_prev from app.stats_site_days(p_from - v_len, p_from - 1);
  select coalesce(jsonb_agg(jsonb_build_object('day', g.day, 'pageviews', coalesce(s.pageviews, 0), 'views', coalesce(s.views, 0),
                                               'visitors', coalesce(s.visitors, 0), 'shares', coalesce(s.shares, 0)) order by g.day), '[]'::jsonb)
    into v_series
  from generate_series(p_from, p_to, interval '1 day') as g (day)
  left join app.stats_site_days(p_from, p_to) s on s.day = g.day::date;
  return jsonb_build_object('current', v_now, 'previous', v_prev, 'series', v_series);
end;
$$;

create or replace function public.stats_articles(p_from date, p_to date, p_limit integer default 20)
returns table (article_id uuid, slug text, title text, section_name text, category_name text, authors text, published_at timestamptz,
               views bigint, pageviews bigint, visitors bigint, avg_read_seconds integer, avg_scroll integer, finish_rate integer, shares bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform app.stats_require(p_from, p_to);
  return query
  select t.article_id, a.slug, a.title, s.name, c.name,
         (select string_agg(ct.name, ', ' order by aa.position) from public.article_authors aa join public.contributors ct on ct.id = aa.contributor_id where aa.article_id = a.id),
         a.published_at, t.views, t.pageviews, t.visitors,
         case when t.read_samples > 0 then (t.active_seconds / t.read_samples)::integer end,
         case when t.scroll_samples > 0 then (t.scroll_sum / t.scroll_samples)::integer end,
         case when t.scroll_samples > 0 then (100 * t.finished / t.scroll_samples)::integer end,
         t.shares
  from app.stats_article_totals(p_from, p_to) t
  join public.articles a on a.id = t.article_id
  join public.sections s on s.id = a.section_id
  join public.categories c on c.id = a.category_id
  order by t.views desc, t.pageviews desc, t.shares desc
  limit greatest(1, least(coalesce(p_limit, 20), 100));
end;
$$;

create or replace function public.stats_authors(p_from date, p_to date)
returns table (contributor_id uuid, name text, articles bigint, views bigint, avg_read_seconds integer, shares bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform app.stats_require(p_from, p_to);
  return query
  select ct.id, ct.name, count(distinct t.article_id), sum(t.views)::bigint,
         case when sum(t.read_samples) > 0 then (sum(t.active_seconds) / sum(t.read_samples))::integer end,
         sum(t.shares)::bigint
  from app.stats_article_totals(p_from, p_to) t
  join public.article_authors aa on aa.article_id = t.article_id
  join public.contributors ct on ct.id = aa.contributor_id
  group by ct.id, ct.name
  order by 4 desc, 3 desc
  limit 100;
end;
$$;

create or replace function public.stats_sections(p_from date, p_to date)
returns table (section_name text, category_name text, articles bigint, views bigint, avg_read_seconds integer, shares bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform app.stats_require(p_from, p_to);
  return query
  select s.name, c.name, count(*)::bigint, sum(t.views)::bigint,
         case when sum(t.read_samples) > 0 then (sum(t.active_seconds) / sum(t.read_samples))::integer end,
         sum(t.shares)::bigint
  from app.stats_article_totals(p_from, p_to) t
  join public.articles a on a.id = t.article_id
  join public.sections s on s.id = a.section_id
  join public.categories c on c.id = a.category_id
  group by s.name, c.name, s.nav_order
  order by 4 desc;
end;
$$;

create or replace function public.stats_breakdown(p_from date, p_to date, p_dim text)
returns table (value text, pageviews bigint, visitors bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform app.stats_require(p_from, p_to);
  if p_dim not in ('source', 'referrer', 'device', 'browser', 'os') then
    raise exception 'Unknown breakdown.' using errcode = '22023';
  end if;
  return query select d.value, d.pageviews, d.visitors from app.stats_dim_totals(p_from, p_to, p_dim) d limit 50;
end;
$$;

create or replace function public.stats_share_channels(p_from date, p_to date)
returns table (channel text, shares bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform app.stats_require(p_from, p_to);
  return query
  select x.channel, sum(x.shares)::bigint
  from (
    select d.channel, d.shares::bigint from public.stats_daily_shares d
    where d.day between p_from and p_to and d.day < greatest(p_from, app.stats_live_from())
    union all
    select s.channel, count(*) from public.stats_shares s
    where s.day between greatest(p_from, app.stats_live_from()) and p_to
    group by s.channel
  ) x
  group by x.channel
  order by 2 desc;
end;
$$;

create or replace function public.stats_staff_usage(p_from date, p_to date)
returns table (profile_id uuid, display_name text, role public.app_role, is_active boolean, active_seconds bigint, days_active bigint, last_active_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform app.stats_require(p_from, p_to);
  return query
  select p.id, p.display_name, p.role, p.is_active,
         coalesce(sum(a.active_seconds), 0)::bigint,
         count(a.day) filter (where a.active_seconds > 0),
         p.last_seen_at
  from public.profiles p
  left join public.staff_activity_daily a on a.profile_id = p.id and a.day between p_from and p_to
  where p.is_active or a.profile_id is not null
  group by p.id
  order by 5 desc, p.display_name;
end;
$$;

-- -----------------------------------------------------------------------------
-- RLS: nobody writes directly (only the functions above); only stats viewers read
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
  r record;
begin
  foreach t in array array['stats_pageviews', 'stats_shares', 'staff_activity_daily', 'stats_daily_site', 'stats_daily_articles',
                           'stats_daily_dims', 'stats_daily_shares', 'stats_rollup_log'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke insert, update, delete, truncate on public.%I from authenticated', t);
  end loop;
  for r in select tablename, policyname from pg_policies
           where schemaname = 'public' and (tablename like 'stats\_%' or tablename = 'staff_activity_daily') loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
  foreach t in array array['stats_pageviews', 'stats_shares', 'staff_activity_daily', 'stats_daily_site', 'stats_daily_articles',
                           'stats_daily_dims', 'stats_daily_shares', 'stats_rollup_log'] loop
    execute format('create policy %I on public.%I for select to authenticated using (app.can_view_stats())', t || '_read', t);
  end loop;
end $$;

revoke execute on function public.stats_ingest(text, text, jsonb, text, text, text) from public, anon, authenticated;
grant execute on function public.stats_ingest(text, text, jsonb, text, text, text) to service_role;
revoke execute on function public.staff_heartbeat() from public, anon;
grant execute on function public.staff_heartbeat() to authenticated;
do $$
declare f text;
begin
  foreach f in array array['stats_overview(date, date)', 'stats_articles(date, date, integer)', 'stats_authors(date, date)',
                           'stats_sections(date, date)', 'stats_breakdown(date, date, text)', 'stats_share_channels(date, date)',
                           'stats_staff_usage(date, date)'] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
-- RLS policies call this as the signed-in user, and column defaults use manila_today()
grant execute on function app.can_view_stats() to anon, authenticated, service_role;
grant execute on function app.manila_today() to anon, authenticated, service_role;
-- internal helpers stay callable from the RPCs only through security definer; hide the write-side ones
revoke execute on function app.stats_hash(text) from public, anon, authenticated;
revoke execute on function app.stats_rollup_day(date) from public, anon, authenticated;
revoke execute on function app.stats_nightly() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Nightly job (pg_cron): 00:15 Philippine time = 16:15 UTC
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('amaranth-stats-nightly', '15 16 * * *', 'select app.stats_nightly()');
  end if;
end $$;

commit;
