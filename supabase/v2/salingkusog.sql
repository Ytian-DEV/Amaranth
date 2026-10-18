-- =============================================================================
-- AMARANTH v2 — Salingkusog (VSU intramural games) add-on
--
-- Paste AFTER schema.sql (any time; re-runnable). All tables are prefixed sk_.
--
-- Who can do what
--   readers (anon)                     read everything in a published edition
--   any active staff                   read everything, incl. unpublished editions
--   Salingkusog team (sk_team)         create/edit all Salingkusog data
--   super_admin, editor_in_chief       = "Executive Editor", and managing_editor:
--                                      everything above + choose the team
--
-- Medal table, points, the day-by-day race, head-to-head and top scorers are
-- views over the results — nobody types totals in by hand.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.sk_category as enum ('ball_games', 'athletics', 'racket_sports', 'aquatics', 'mind_games', 'esports', 'dance_cheer');
exception when duplicate_object then null; end $$;

-- categories added after the first release (re-runnable; nothing in this file uses them,
-- so adding them inside the transaction is fine on PostgreSQL 12+)
alter type public.sk_category add value if not exists 'combat_sports' after 'athletics';
alter type public.sk_category add value if not exists 'pageant';
alter type public.sk_category add value if not exists 'others';

do $$ begin
  create type public.sk_division as enum ('men', 'women', 'mixed', 'open');
exception when duplicate_object then null; end $$;

do $$ begin
  -- bracket: elimination games · round_robin: league · timed/measured: races, throws · judged: cheerdance
  create type public.sk_format as enum ('bracket', 'round_robin', 'timed', 'judged');
exception when duplicate_object then null; end $$;
-- round robin, then the top 2 play the final (and 3rd/4th the bronze game). Compared as text below.
alter type public.sk_format add value if not exists 'round_robin_final' after 'round_robin';

do $$ begin
  create type public.sk_match_status as enum ('upcoming', 'live', 'final', 'postponed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.sk_medal as enum ('gold', 'silver', 'bronze');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.sk_award_kind as enum ('mvp_of_day', 'athlete_of_day', 'finals_mvp');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table if not exists public.sk_editions (
  id uuid primary key default gen_random_uuid(),
  year integer not null unique check (year between 2000 and 2100),
  title text not null,                          -- "Salingkusog 2026"
  subtitle text,                                -- "VSU Intramural Games"
  starts_on date not null,
  ends_on date not null,
  points_gold smallint not null default 5 check (points_gold >= 0),
  points_silver smallint not null default 3 check (points_silver >= 0),
  points_bronze smallint not null default 1 check (points_bronze >= 0),
  is_current boolean not null default false,
  is_published boolean not null default false,
  schedule_pdf_asset_id uuid references public.media_assets (id) on delete set null,
  map_asset_id uuid references public.media_assets (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sk_editions_dates check (ends_on >= starts_on)
);
create unique index if not exists sk_editions_one_current on public.sk_editions (is_current) where is_current;
-- Countdown page (/salingkusog-2026/countdown): off by default; null time = first day, 8:00 AM Manila
alter table public.sk_editions add column if not exists countdown_enabled boolean not null default false;
alter table public.sk_editions add column if not exists countdown_at timestamptz;

create table if not exists public.sk_factions (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.sk_editions (id) on delete cascade,
  name text not null,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_name text,                              -- "PT", used in compact score tables
  motto text,
  color text not null default '#0e5a36' check (color ~ '^#[0-9a-fA-F]{6}$'),
  logo_asset_id uuid references public.media_assets (id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edition_id, slug),
  unique (edition_id, id)
);

create table if not exists public.sk_venues (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.sk_editions (id) on delete cascade,
  name text not null,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  map_number smallint,                          -- the numbered pin on the venue map
  map_x numeric(5, 2) check (map_x is null or map_x between 0 and 100), -- % from left
  map_y numeric(5, 2) check (map_y is null or map_y between 0 and 100), -- % from top
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edition_id, slug),
  unique (edition_id, id)
);

create table if not exists public.sk_sports (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.sk_editions (id) on delete cascade,
  name text not null,                           -- "Basketball"
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category public.sk_category not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edition_id, slug),
  unique (edition_id, id)
);

-- A medal event within a sport: "Basketball · Men", "100m Dash · Women", "Chess · Individual Open"
create table if not exists public.sk_events (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null,
  sport_id uuid not null,
  name text not null,                           -- shown after the sport: "Men", "100m Dash · Women"
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  division public.sk_division not null default 'open',
  format public.sk_format not null default 'bracket',
  is_team boolean not null default true,        -- false = individual athletes win the medals
  result_unit text,                             -- "s", "m", "pts" for timed/measured events
  venue_id uuid,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edition_id, slug),
  unique (edition_id, id),
  foreign key (edition_id, sport_id) references public.sk_sports (edition_id, id) on delete cascade,
  foreign key (edition_id, venue_id) references public.sk_venues (edition_id, id) on delete set null (venue_id)
);
create index if not exists sk_events_sport_idx on public.sk_events (sport_id, sort_order);

create table if not exists public.sk_athletes (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null,
  faction_id uuid not null,
  name text not null,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  program text,                                 -- course / year
  photo_asset_id uuid references public.media_assets (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edition_id, slug),
  unique (edition_id, id),
  foreign key (edition_id, faction_id) references public.sk_factions (edition_id, id) on delete cascade
);
create index if not exists sk_athletes_faction_idx on public.sk_athletes (faction_id);

-- Head-to-head games (bracket rounds, league games, finals)
create table if not exists public.sk_matches (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null,
  event_id uuid not null,
  round text,                                   -- "Semifinal 1", "Final", "Bronze game", "Group A"
  round_order smallint not null default 0,      -- column in the bracket (higher = later round)
  bracket_slot smallint,                        -- position within the round, top to bottom
  venue_id uuid,
  scheduled_at timestamptz not null,
  status public.sk_match_status not null default 'upcoming',
  side_a_id uuid,                               -- null = to be decided (TBD) in early brackets
  side_b_id uuid,
  score_a numeric(8, 2),
  score_b numeric(8, 2),
  -- quarters / sets / games: [{"label": "Q1", "a": 20, "b": 16}, …]
  periods jsonb not null default '[]'::jsonb check (jsonb_typeof(periods) = 'array'),
  -- team stats for the recap: [{"label": "Field goal %", "a": "46%", "b": "41%"}, …]
  team_stats jsonb not null default '[]'::jsonb check (jsonb_typeof(team_stats) = 'array'),
  live_note text,                               -- "Set 4 · Now", "Q3 · 4:12"
  started_at timestamptz,
  ended_at timestamptz,
  recap_article_id uuid references public.articles (id) on delete set null,
  winner_side char(1) generated always as (
    case
      when status = 'final' and score_a > score_b then 'a'
      when status = 'final' and score_b > score_a then 'b'
    end
  ) stored,
  updated_by uuid references public.profiles (id) on delete set null, -- audit only
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edition_id, id),
  foreign key (edition_id, event_id) references public.sk_events (edition_id, id) on delete cascade,
  foreign key (edition_id, venue_id) references public.sk_venues (edition_id, id) on delete set null (venue_id),
  foreign key (edition_id, side_a_id) references public.sk_factions (edition_id, id) on delete set null (side_a_id),
  foreign key (edition_id, side_b_id) references public.sk_factions (edition_id, id) on delete set null (side_b_id),
  constraint sk_matches_two_sides check (side_a_id is null or side_b_id is null or side_a_id <> side_b_id),
  constraint sk_matches_final_needs_scores check (status <> 'final' or (score_a is not null and score_b is not null))
);
create index if not exists sk_matches_schedule_idx on public.sk_matches (edition_id, scheduled_at);
create index if not exists sk_matches_live_idx on public.sk_matches (edition_id) where status = 'live';
create index if not exists sk_matches_event_idx on public.sk_matches (event_id, round_order, bracket_slot);
create index if not exists sk_matches_side_a_idx on public.sk_matches (side_a_id);
create index if not exists sk_matches_side_b_idx on public.sk_matches (side_b_id);
create index if not exists sk_matches_venue_idx on public.sk_matches (venue_id, scheduled_at);

-- Generated games: where each side comes from (see app.sk_resolve below)
alter table public.sk_matches add column if not exists source_a text;
alter table public.sk_matches add column if not exists source_b text;
do $$ begin
  alter table public.sk_matches add constraint sk_matches_sources check (
    (source_a is null or source_a ~ '^(seed:[0-9]+|rank:[0-9]+|(winner|loser):[0-9a-f-]{36})$')
    and (source_b is null or source_b ~ '^(seed:[0-9]+|rank:[0-9]+|(winner|loser):[0-9a-f-]{36})$'));
exception when duplicate_object then null; end $$;
-- Factions in seed order, set by "Build schedule"
alter table public.sk_events add column if not exists seeds uuid[] not null default '{}';

-- Per-athlete box score for a game: {"PTS": 24, "REB": 9, "AST": 5, "STL": 3}
create table if not exists public.sk_athlete_stats (
  match_id uuid not null references public.sk_matches (id) on delete cascade,
  athlete_id uuid not null references public.sk_athletes (id) on delete cascade,
  stats jsonb not null default '{}'::jsonb check (jsonb_typeof(stats) = 'object'),
  primary key (match_id, athlete_id)
);
create index if not exists sk_athlete_stats_athlete_idx on public.sk_athlete_stats (athlete_id);

-- Official placings. A medal earns its faction points on `awarded_on` (the competition day).
create table if not exists public.sk_placements (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null,
  event_id uuid not null,
  place smallint not null check (place between 1 and 64),
  medal public.sk_medal,                        -- null for 4th place and below
  faction_id uuid not null,
  athlete_id uuid,                              -- individual events
  result text,                                  -- "12.84s", "78–71", "92.5 pts"
  awarded_on date not null default ((now() at time zone 'Asia/Manila')::date),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (edition_id, event_id) references public.sk_events (edition_id, id) on delete cascade,
  foreign key (edition_id, faction_id) references public.sk_factions (edition_id, id) on delete cascade,
  foreign key (edition_id, athlete_id) references public.sk_athletes (edition_id, id) on delete set null (athlete_id),
  constraint sk_placements_medal_matches_place check (
    medal is null or (medal = 'gold' and place = 1) or (medal = 'silver' and place = 2) or (medal = 'bronze' and place = 3)
  )
);
create unique index if not exists sk_placements_unique on public.sk_placements
  (event_id, place, faction_id, coalesce(athlete_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index if not exists sk_placements_edition_idx on public.sk_placements (edition_id, awarded_on);
create index if not exists sk_placements_faction_idx on public.sk_placements (faction_id);
create index if not exists sk_placements_athlete_idx on public.sk_placements (athlete_id) where athlete_id is not null;

create table if not exists public.sk_awards (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null,
  kind public.sk_award_kind not null,
  day date not null,
  athlete_id uuid not null,
  match_id uuid references public.sk_matches (id) on delete set null,
  event_id uuid references public.sk_events (id) on delete set null,
  headline text,                                -- "12.84s" or "Gold · 100m Dash, Women"
  stat_line jsonb not null default '[]'::jsonb check (jsonb_typeof(stat_line) = 'array'), -- [{"label":"PTS","value":"24"}]
  quote text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (edition_id, athlete_id) references public.sk_athletes (edition_id, id) on delete cascade
);
create unique index if not exists sk_awards_one_per_day on public.sk_awards (edition_id, kind, day) where kind <> 'finals_mvp';
create index if not exists sk_awards_athlete_idx on public.sk_awards (athlete_id);

-- Staff allowed to enter Salingkusog data (chosen by the three manager roles)
create table if not exists public.sk_team (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  added_by uuid references public.profiles (id) on delete set null, -- audit only
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Permission helpers
-- -----------------------------------------------------------------------------
create or replace function app.can_manage_sk_team()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app.current_role() in ('super_admin', 'editor_in_chief', 'managing_editor'), false);
$$;

create or replace function app.can_edit_sk()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.can_manage_sk_team()
    or (app.is_staff() and exists (select 1 from public.sk_team t where t.profile_id = auth.uid()));
$$;

create or replace function app.sk_edition_visible(p_edition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.is_staff() or exists (select 1 from public.sk_editions e where e.id = p_edition_id and e.is_published);
$$;

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------
-- Child rows always carry their parent's edition (so a match can't mix editions)
create or replace function app.sk_inherit_edition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'sk_events' then
    select s.edition_id into new.edition_id from public.sk_sports s where s.id = new.sport_id;
  elsif tg_table_name in ('sk_matches', 'sk_placements') then
    select e.edition_id into new.edition_id from public.sk_events e where e.id = new.event_id;
  elsif tg_table_name = 'sk_athletes' then
    select f.edition_id into new.edition_id from public.sk_factions f where f.id = new.faction_id;
  end if;
  if new.edition_id is null then
    raise exception 'Unknown parent record.' using errcode = '23503';
  end if;
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['sk_events', 'sk_matches', 'sk_placements', 'sk_athletes'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_edition', t);
    execute format('create trigger %I before insert or update on public.%I for each row execute function app.sk_inherit_edition()', t || '_edition', t);
  end loop;
  foreach t in array array['sk_editions', 'sk_factions', 'sk_venues', 'sk_sports', 'sk_events', 'sk_athletes', 'sk_matches', 'sk_placements', 'sk_awards'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format('create trigger %I before update on public.%I for each row execute function app.touch_updated_at()', t || '_touch', t);
  end loop;
end $$;

-- Live / final timestamps and who touched the score last
create or replace function app.sk_match_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null then
    new.updated_by := auth.uid();
  end if;
  if new.status = 'live' and (tg_op = 'INSERT' or old.status <> 'live') then
    new.started_at := coalesce(new.started_at, now());
    new.ended_at := null;
  elsif new.status = 'final' and (tg_op = 'INSERT' or old.status <> 'final') then
    new.started_at := coalesce(new.started_at, new.scheduled_at);
    new.ended_at := coalesce(new.ended_at, now());
    new.live_note := null;
  elsif new.status = 'upcoming' then
    new.started_at := null;
    new.ended_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists sk_matches_status on public.sk_matches;
create trigger sk_matches_status before insert or update on public.sk_matches
for each row execute function app.sk_match_status();

-- Only one current edition
create or replace function app.sk_single_current()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_current then
    update public.sk_editions set is_current = false where is_current and id <> new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists sk_editions_single_current on public.sk_editions;
create trigger sk_editions_single_current before insert or update of is_current on public.sk_editions
for each row when (new.is_current) execute function app.sk_single_current();

-- Only the managing roles may switch the countdown page or move its time (team members edit everything else)
create or replace function app.sk_countdown_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or app.can_manage_sk_team() then
    return new;
  end if;
  if (tg_op = 'INSERT' and (new.countdown_enabled or new.countdown_at is not null))
     or (tg_op = 'UPDATE' and (new.countdown_enabled is distinct from old.countdown_enabled or new.countdown_at is distinct from old.countdown_at)) then
    raise exception 'Only Super admin, Executive Editor or Managing editor can change the countdown page.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists sk_editions_countdown_guard on public.sk_editions;
create trigger sk_editions_countdown_guard before insert or update on public.sk_editions
for each row execute function app.sk_countdown_guard();

-- Team changes are audited
create or replace function app.sk_team_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform app.audit('salingkusog.team.add', 'sk_team', new.profile_id::text);
    return new;
  end if;
  perform app.audit('salingkusog.team.remove', 'sk_team', old.profile_id::text);
  return old;
end;
$$;

drop trigger if exists sk_team_audit on public.sk_team;
create trigger sk_team_audit after insert or delete on public.sk_team
for each row execute function app.sk_team_audit();

-- -----------------------------------------------------------------------------
-- Views (security invoker: RLS of the underlying tables applies)
-- -----------------------------------------------------------------------------
create or replace view public.sk_medal_table
with (security_invoker = true)
as
with tallies as (
  select f.edition_id, f.id as faction_id, f.name, f.slug, f.short_name, f.color, f.logo_asset_id, f.sort_order,
         count(*) filter (where p.medal = 'gold') as gold,
         count(*) filter (where p.medal = 'silver') as silver,
         count(*) filter (where p.medal = 'bronze') as bronze
  from public.sk_factions f
  left join public.sk_placements p on p.faction_id = f.id
  group by f.id
)
select t.edition_id, t.faction_id, t.name, t.slug, t.short_name, t.color, t.logo_asset_id,
       t.gold, t.silver, t.bronze,
       t.gold + t.silver + t.bronze as total,
       (t.gold * e.points_gold + t.silver * e.points_silver + t.bronze * e.points_bronze)::integer as points,
       rank() over (
         partition by t.edition_id
         order by (t.gold * e.points_gold + t.silver * e.points_silver + t.bronze * e.points_bronze) desc, t.gold desc, t.silver desc
       )::integer as rank
from tallies t
join public.sk_editions e on e.id = t.edition_id;

-- Cumulative points at the end of each competition day (0 before any medal)
create or replace view public.sk_points_by_day
with (security_invoker = true)
as
with days as (
  select e.id as edition_id, d::date as day, (d::date - e.starts_on + 1)::integer as day_number
  from public.sk_editions e
  cross join generate_series(e.starts_on, e.ends_on, interval '1 day') as d
),
daily as (
  select p.edition_id, p.faction_id, p.awarded_on as day,
         sum(case p.medal when 'gold' then e.points_gold when 'silver' then e.points_silver when 'bronze' then e.points_bronze else 0 end) as pts
  from public.sk_placements p
  join public.sk_editions e on e.id = p.edition_id
  where p.medal is not null
  group by p.edition_id, p.faction_id, p.awarded_on
)
select d.edition_id, f.id as faction_id, d.day, d.day_number,
       coalesce(sum(daily.pts) over (partition by f.id order by d.day), 0)::integer as points
from days d
join public.sk_factions f on f.edition_id = d.edition_id
left join daily on daily.faction_id = f.id and daily.day = d.day;

-- Wins and losses between every pair of factions (final games only)
create or replace view public.sk_head_to_head
with (security_invoker = true)
as
with sides as (
  select m.edition_id, m.side_a_id as faction_id, m.side_b_id as opponent_id, (m.winner_side = 'a') as won, (m.winner_side = 'b') as lost
  from public.sk_matches m where m.status = 'final' and m.side_a_id is not null and m.side_b_id is not null
  union all
  select m.edition_id, m.side_b_id, m.side_a_id, (m.winner_side = 'b'), (m.winner_side = 'a')
  from public.sk_matches m where m.status = 'final' and m.side_a_id is not null and m.side_b_id is not null
)
select edition_id, faction_id, opponent_id,
       count(*) filter (where won)::integer as wins,
       count(*) filter (where lost)::integer as losses
from sides
group by edition_id, faction_id, opponent_id;

-- Event progress: completed once its gold is awarded ("31 of 48 events completed")
create or replace view public.sk_event_status
with (security_invoker = true)
as
select ev.edition_id, ev.id as event_id, ev.sport_id,
       exists (select 1 from public.sk_placements p where p.event_id = ev.id and p.medal = 'gold') as completed,
       (select min(m.scheduled_at) from public.sk_matches m where m.event_id = ev.id) as first_match_at,
       (select max(coalesce(m.ended_at, m.scheduled_at)) from public.sk_matches m where m.event_id = ev.id) as last_match_at,
       exists (select 1 from public.sk_matches m where m.event_id = ev.id and m.status = 'live') as live
from public.sk_events ev;

-- Totals of one numeric stat per athlete and event ("Top scorers · PTS")
create or replace view public.sk_event_leaders
with (security_invoker = true)
as
select m.edition_id, m.event_id, s.athlete_id, k.key as stat,
       sum((k.value #>> '{}')::numeric) as total,
       count(*)::integer as games
from public.sk_athlete_stats s
join public.sk_matches m on m.id = s.match_id
cross join lateral jsonb_each(s.stats) as k
where jsonb_typeof(k.value) = 'number'
group by m.edition_id, m.event_id, s.athlete_id, k.key;

-- -----------------------------------------------------------------------------
-- RPC: replace an event's results in one step (newsroom "Results & medals").
-- Medals follow the place (1 gold, 2 silver, 3 bronze); RLS still applies.
-- p_rows: [{"place": 1, "faction_id": "…", "athlete_id": null, "result": "12.84s", "awarded_on": "2026-11-04"}]
-- -----------------------------------------------------------------------------
create or replace function public.sk_set_placements(p_event_id uuid, p_rows jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  n integer;
begin
  if not app.can_edit_sk() then
    raise exception 'Only the Salingkusog team can enter results.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_rows) is distinct from 'array' then
    raise exception 'Results must be a list.' using errcode = '22023';
  end if;
  delete from public.sk_placements where event_id = p_event_id;
  insert into public.sk_placements (event_id, place, medal, faction_id, athlete_id, result, awarded_on)
  select p_event_id,
         (r ->> 'place')::smallint,
         (case (r ->> 'place')::smallint when 1 then 'gold' when 2 then 'silver' when 3 then 'bronze' end)::public.sk_medal,
         (r ->> 'faction_id')::uuid,
         nullif(r ->> 'athlete_id', '')::uuid,
         nullif(trim(r ->> 'result'), ''),
         coalesce(nullif(r ->> 'awarded_on', '')::date, (now() at time zone 'Asia/Manila')::date)
  from jsonb_array_elements(p_rows) as r;
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke execute on function public.sk_set_placements(uuid, jsonb) from public, anon;
grant execute on function public.sk_set_placements(uuid, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- Auto brackets and round robins (2026-10)
-- A generated game knows where its two sides come from (sk_matches.source_a/_b):
--   seed:3            the 3rd faction in sk_events.seeds
--   winner:<match id> the winner of that game · loser:<match id> its loser (bronze game)
--   rank:2            2nd in the event's round-robin standings (round robin + final)
-- app.sk_resolve() fills the sides in whenever a game of the event changes:
--   knockout seeds at once; round-robin round n once rounds before it are done;
--   winners/losers when that game is final; ranks when every round-robin game is done.
-- A game that has started never changes: the edit that would change it is refused.
-- -----------------------------------------------------------------------------

-- Round-robin standings: wins, point difference, head-to-head among the tied, points scored, seed.
-- Group games = every game of the event that isn't fed by a winner/loser/rank (so imported
-- round robins without sources work too). Cancelled games don't count.
create or replace function app.sk_rr_table(p_event_id uuid)
returns table (faction_id uuid, rank integer, played integer, wins integer, losses integer, draws integer, pf numeric, pa numeric)
language sql
stable
security definer
set search_path = ''
as $$
  with ev as (
    select coalesce(e.seeds, '{}') as seeds from public.sk_events e where e.id = p_event_id
  ),
  games as (
    select m.* from public.sk_matches m
    where m.event_id = p_event_id and coalesce(m.source_a, '') !~ '^(winner|loser|rank):'
  ),
  teams as (
    select unnest(ev.seeds) as id from ev
    union select side_a_id from games where side_a_id is not null
    union select side_b_id from games where side_b_id is not null
  ),
  results as (
    select side_a_id as id, side_b_id as opp, score_a as f, score_b as a from games where status = 'final'
    union all
    select side_b_id, side_a_id, score_b, score_a from games where status = 'final'
  ),
  base as (
    select t.id,
           count(r.id)::integer as played,
           count(*) filter (where r.f > r.a)::integer as wins,
           count(*) filter (where r.f < r.a)::integer as losses,
           count(*) filter (where r.f = r.a)::integer as draws,
           coalesce(sum(r.f), 0) as pf,
           coalesce(sum(r.a), 0) as pa
    from teams t left join results r on r.id = t.id
    group by t.id
  ),
  h2h as (
    -- wins against the teams level with you on wins and difference
    select b.id, count(*) filter (where r.f > r.a)::integer as h2h
    from base b
    left join results r on r.id = b.id
      and exists (select 1 from base o where o.id = r.opp and o.wins = b.wins and o.pf - o.pa = b.pf - b.pa)
    group by b.id
  )
  select b.id, (row_number() over (
           order by b.wins desc, b.pf - b.pa desc, h.h2h desc, b.pf desc,
                    coalesce(array_position((select seeds from ev), b.id), 999)))::integer,
         b.played, b.wins, b.losses, b.draws, b.pf, b.pa
  from base b join h2h h on h.id = b.id;
$$;

-- Fills in the sides of the event's generated games (idempotent).
create or replace function app.sk_resolve(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_format text;
  v_seeds uuid[];
  v_group_left integer;
  m record;
  v_a uuid;
  v_b uuid;
begin
  select e.format::text, coalesce(e.seeds, '{}') into v_format, v_seeds from public.sk_events e where e.id = p_event_id;
  if v_format is null then
    return;
  end if;
  select count(*) into v_group_left from public.sk_matches g
  where g.event_id = p_event_id and coalesce(g.source_a, '') !~ '^(winner|loser|rank):' and g.status not in ('final', 'cancelled');

  for m in
    select * from public.sk_matches x
    where x.event_id = p_event_id and (x.source_a is not null or x.source_b is not null)
    order by x.round_order, x.bracket_slot nulls last, x.scheduled_at
  loop
    v_a := app.sk_source_side(p_event_id, v_format, v_seeds, v_group_left, m.round_order, m.source_a);
    v_b := app.sk_source_side(p_event_id, v_format, v_seeds, v_group_left, m.round_order, m.source_b);
    if m.source_a is null then v_a := m.side_a_id; end if;
    if m.source_b is null then v_b := m.side_b_id; end if;
    if m.side_a_id is distinct from v_a or m.side_b_id is distinct from v_b then
      if m.status <> 'upcoming' then
        raise exception '% has already started, so its teams can''t change. Fix that game first.', coalesce(m.round, 'The next game')
          using errcode = '55000';
      end if;
      update public.sk_matches set side_a_id = v_a, side_b_id = v_b where id = m.id;
    end if;
  end loop;
end;
$$;

-- One side of a generated game, or null while it isn't known yet.
create or replace function app.sk_source_side(p_event_id uuid, p_format text, p_seeds uuid[], p_group_left integer, p_round integer, p_source text)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_kind text := split_part(p_source, ':', 1);
  v_ref text := split_part(p_source, ':', 2);
  g record;
begin
  if p_source is null then
    return null;
  elsif v_kind = 'seed' then
    -- knockout seeds (incl. byes) at once; a round-robin round once every earlier round is done
    if p_format = 'bracket' or p_round <= 1 or not exists (
      select 1 from public.sk_matches x
      where x.event_id = p_event_id and coalesce(x.source_a, '') !~ '^(winner|loser|rank):'
        and x.round_order < p_round and x.status not in ('final', 'cancelled')
    ) then
      return p_seeds[v_ref::integer];
    end if;
    return null;
  elsif v_kind in ('winner', 'loser') then
    select x.status, x.winner_side, x.side_a_id, x.side_b_id into g from public.sk_matches x where x.id = v_ref::uuid;
    if g.status is distinct from 'final' or g.winner_side is null then
      return null;
    end if;
    return case when (v_kind = 'winner') = (g.winner_side = 'a') then g.side_a_id else g.side_b_id end;
  elsif v_kind = 'rank' then
    if p_group_left > 0 then
      return null;
    end if;
    return (select t.faction_id from app.sk_rr_table(p_event_id) t where t.rank = v_ref::integer);
  end if;
  return null;
end;
$$;

-- After a game changes, move the teams along (one level deep: the updates it makes don't recurse).
create or replace function app.sk_matches_advance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if pg_trigger_depth() > 1 then
    return null;
  end if;
  perform app.sk_resolve(coalesce(new.event_id, old.event_id));
  return null;
end;
$$;

drop trigger if exists sk_matches_advance on public.sk_matches;
create trigger sk_matches_advance
after insert or delete or update of status, score_a, score_b, side_a_id, side_b_id, source_a, source_b on public.sk_matches
for each row execute function app.sk_matches_advance();

-- Knockout games need a winner (overtime, penalties… go into the score)
create or replace function app.sk_knockout_needs_winner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'final' and new.score_a = new.score_b and (
    coalesce(new.source_a, '') ~ '^(winner|loser|rank):'
    or exists (select 1 from public.sk_events e where e.id = new.event_id and e.format::text = 'bracket')
    or exists (select 1 from public.sk_matches x where x.event_id = new.event_id and new.id::text in (split_part(x.source_a, ':', 2), split_part(x.source_b, ':', 2)))
  ) then
    raise exception 'A knockout game needs a winner. Add the tiebreak (overtime, penalties, extra set) to the score.' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists sk_matches_knockout on public.sk_matches;
create trigger sk_matches_knockout before insert or update on public.sk_matches
for each row execute function app.sk_knockout_needs_winner();

-- -----------------------------------------------------------------------------
-- RPC: build an event's games ("Build schedule" in the newsroom).
-- p_format: bracket (single elimination), round_robin, or round_robin_final (top 2 play the final).
-- p_seeds: factions in seed order. Replaces the event's games while none has started.
-- -----------------------------------------------------------------------------
create or replace function public.sk_build_schedule(
  p_event_id uuid, p_format text, p_seeds uuid[], p_first_at timestamptz,
  p_round_gap_hours integer default 24, p_game_gap_minutes integer default 90,
  p_venue_id uuid default null, p_bronze boolean default true
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_edition uuid;
  n integer := coalesce(cardinality(p_seeds), 0);
  v_round interval := make_interval(hours => greatest(coalesce(p_round_gap_hours, 24), 0));
  v_game interval := make_interval(mins => greatest(coalesce(p_game_gap_minutes, 90), 0));
  v_count integer := 0;
  -- bracket
  v_size integer;
  v_rounds integer;
  v_pos integer[];
  v_next integer[];
  v_prev text[];   -- sources feeding the next round, per slot
  v_cur text[];
  v_ids uuid[];
  v_id uuid;
  v_name text;
  v_left integer;
  v_semis uuid[];
  r integer;
  i integer;
  -- round robin
  v_teams integer[];
  v_rr_rounds integer;
  g integer;
  x integer;
  y integer;
  v_final_at timestamptz;
begin
  if not app.can_edit_sk() then
    raise exception 'Only the Salingkusog team can build schedules.' using errcode = '42501';
  end if;
  if p_format not in ('bracket', 'round_robin', 'round_robin_final') then
    raise exception 'Choose single elimination, round robin, or round robin + final.' using errcode = '22023';
  end if;
  select e.edition_id into v_edition from public.sk_events e where e.id = p_event_id;
  if v_edition is null then
    raise exception 'Unknown event.' using errcode = 'P0002';
  end if;
  if n < 2 or n > 16 then
    raise exception 'Pick between 2 and 16 factions.' using errcode = '22023';
  end if;
  if (select count(distinct s) from unnest(p_seeds) s) <> n
     or (select count(*) from public.sk_factions f where f.edition_id = v_edition and f.id = any (p_seeds)) <> n then
    raise exception 'Each faction can be picked once, from this edition.' using errcode = '22023';
  end if;
  if p_format = 'round_robin_final' and n < 3 then
    raise exception 'Round robin + final needs at least 3 factions.' using errcode = '22023';
  end if;
  if p_first_at is null then
    raise exception 'Set when the first game starts.' using errcode = '22023';
  end if;
  if exists (select 1 from public.sk_matches m where m.event_id = p_event_id and m.status not in ('upcoming', 'postponed', 'cancelled')) then
    raise exception 'This event already has games played, so its schedule can''t be rebuilt.' using errcode = '55000';
  end if;

  delete from public.sk_matches where event_id = p_event_id;
  update public.sk_events set format = p_format::public.sk_format, seeds = p_seeds where id = p_event_id;

  if p_format = 'bracket' then
    v_size := 1;
    while v_size < n loop v_size := v_size * 2; end loop;
    v_rounds := round(ln(v_size) / ln(2))::integer;
    -- standard seeding order: 1 v 8, 4 v 5, 2 v 7, 3 v 6 …
    v_pos := array[1, 2];
    while cardinality(v_pos) < v_size loop
      v_next := '{}';
      foreach i in array v_pos loop
        v_next := v_next || i || (cardinality(v_pos) * 2 + 1 - i);
      end loop;
      v_pos := v_next;
    end loop;
    v_prev := '{}';
    for i in 1 .. v_size loop
      v_prev := v_prev || ('seed:' || v_pos[i]);
    end loop;

    for r in 1 .. v_rounds loop
      v_left := (v_size / power(2, r - 1))::integer;
      v_cur := '{}';
      v_ids := '{}';
      g := 0;
      for i in 1 .. cardinality(v_prev) / 2 loop
        -- a bye: the seed with no opponent goes straight on
        if v_prev[2 * i]::text ~ '^seed:' and split_part(v_prev[2 * i], ':', 2)::integer > n then
          v_cur := v_cur || v_prev[2 * i - 1];
          v_ids := v_ids || null::uuid;
          continue;
        end if;
        g := g + 1;
        v_name := case v_left when 2 then 'Final' when 4 then 'Semifinal ' || g when 8 then 'Quarterfinal ' || g else 'Round of ' || v_left || ' · ' || g end;
        insert into public.sk_matches (edition_id, event_id, round, round_order, bracket_slot, venue_id, scheduled_at, source_a, source_b)
        values (v_edition, p_event_id, v_name, r, i, p_venue_id,
                p_first_at + v_round * (r - 1) + v_game * (i - 1) + case when v_left = 2 and p_bronze and v_size >= 4 then v_game else interval '0' end,
                v_prev[2 * i - 1], v_prev[2 * i])
        returning id into v_id;
        v_count := v_count + 1;
        v_cur := v_cur || ('winner:' || v_id);
        v_ids := v_ids || v_id;
      end loop;
      if v_left = 4 then
        v_semis := v_ids;
      end if;
      v_prev := v_cur;
    end loop;

    if p_bronze and v_size >= 4 and cardinality(v_semis) = 2 and v_semis[1] is not null and v_semis[2] is not null then
      insert into public.sk_matches (edition_id, event_id, round, round_order, bracket_slot, venue_id, scheduled_at, source_a, source_b)
      values (v_edition, p_event_id, 'Bronze game', v_rounds, null, p_venue_id, p_first_at + v_round * (v_rounds - 1),
              'loser:' || v_semis[1], 'loser:' || v_semis[2]);
      v_count := v_count + 1;
    end if;
  else
    -- round robin, circle method: seed 1 stays put, the rest rotate; an odd field adds a rest slot (0)
    v_teams := '{}';
    for i in 1 .. n loop v_teams := v_teams || i; end loop;
    if n % 2 = 1 then v_teams := v_teams || 0; end if;
    v_rr_rounds := cardinality(v_teams) - 1;
    for r in 1 .. v_rr_rounds loop
      g := 0;
      for i in 1 .. cardinality(v_teams) / 2 loop
        x := v_teams[i];
        y := v_teams[cardinality(v_teams) + 1 - i];
        continue when x = 0 or y = 0;
        g := g + 1;
        insert into public.sk_matches (edition_id, event_id, round, round_order, bracket_slot, venue_id, scheduled_at, source_a, source_b)
        values (v_edition, p_event_id, 'Round ' || r || ' · Game ' || g, r, g, p_venue_id,
                p_first_at + v_round * (r - 1) + v_game * (g - 1), 'seed:' || least(x, y), 'seed:' || greatest(x, y));
        v_count := v_count + 1;
      end loop;
      v_teams := v_teams[1:1] || v_teams[cardinality(v_teams):cardinality(v_teams)] || v_teams[2:cardinality(v_teams) - 1];
    end loop;

    if p_format = 'round_robin_final' then
      v_final_at := p_first_at + v_round * v_rr_rounds;
      if p_bronze and n >= 4 then
        insert into public.sk_matches (edition_id, event_id, round, round_order, bracket_slot, venue_id, scheduled_at, source_a, source_b)
        values (v_edition, p_event_id, 'Bronze game', v_rr_rounds + 1, null, p_venue_id, v_final_at, 'rank:3', 'rank:4');
        v_count := v_count + 1;
        v_final_at := v_final_at + v_game;
      end if;
      insert into public.sk_matches (edition_id, event_id, round, round_order, bracket_slot, venue_id, scheduled_at, source_a, source_b)
      values (v_edition, p_event_id, 'Final', v_rr_rounds + 1, 1, p_venue_id, v_final_at, 'rank:1', 'rank:2');
      v_count := v_count + 1;
    end if;
  end if;

  perform app.sk_resolve(p_event_id);
  return v_count;
end;
$$;

revoke execute on function public.sk_build_schedule(uuid, text, uuid[], timestamptz, integer, integer, uuid, boolean) from public, anon;
grant execute on function public.sk_build_schedule(uuid, text, uuid[], timestamptz, integer, integer, uuid, boolean) to authenticated;


-- -----------------------------------------------------------------------------
-- RPC: the public countdown. Returns a row only while the current edition's
-- countdown page is switched on (works before the edition itself is published).
-- -----------------------------------------------------------------------------
create or replace function public.sk_countdown()
returns table (title text, subtitle text, starts_on date, countdown_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select e.title, e.subtitle, e.starts_on,
         coalesce(e.countdown_at, (e.starts_on + time '08:00') at time zone 'Asia/Manila')
  from public.sk_editions e
  where e.is_current and e.countdown_enabled
  limit 1;
$$;

revoke execute on function public.sk_countdown() from public;
grant execute on function public.sk_countdown() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- RPC: the points race in hour steps (1, 3, 6 or 12). Cumulative points per faction at
-- the end of each step. 1/3/6 h cover the latest day with results; 12 h covers the whole
-- edition. A result counts at the time it was entered when that was on the day it was
-- won, otherwise at the end of that day. Steps in the future are left out.
-- (Day by day stays the sk_points_by_day view.)
-- -----------------------------------------------------------------------------
create or replace function public.sk_points_timeline(p_edition_id uuid, p_hours integer)
returns table (faction_id uuid, bucket_end timestamptz, points integer)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_ed public.sk_editions%rowtype;
  v_from date;
  v_to date;
  v_step interval;
begin
  if p_hours is null or p_hours not in (1, 3, 6, 12) then
    raise exception 'Choose 1, 3, 6 or 12 hours' using errcode = '22023';
  end if;
  select * into v_ed from public.sk_editions where id = p_edition_id;
  if not found then return; end if;
  v_step := make_interval(hours => p_hours);
  if p_hours < 12 then
    select least(greatest(coalesce(max(p.awarded_on), v_ed.starts_on), v_ed.starts_on), v_ed.ends_on)
      into v_from
      from public.sk_placements p where p.edition_id = p_edition_id and p.medal is not null;
    v_to := v_from;
  else
    v_from := v_ed.starts_on;
    v_to := v_ed.ends_on;
  end if;

  return query
  with pts as (
    select p.faction_id as fid,
           case when (p.created_at at time zone 'Asia/Manila')::date = p.awarded_on then p.created_at
                else ((p.awarded_on + 1)::timestamp at time zone 'Asia/Manila') - interval '1 second' end as at,
           case p.medal when 'gold' then v_ed.points_gold when 'silver' then v_ed.points_silver when 'bronze' then v_ed.points_bronze else 0 end as n
    from public.sk_placements p
    where p.edition_id = p_edition_id and p.medal is not null
  ),
  steps as (
    select g + v_step as ends
    from generate_series(v_from::timestamp at time zone 'Asia/Manila',
                         ((v_to + 1)::timestamp at time zone 'Asia/Manila') - v_step,
                         v_step) as g
    where g < now()
  )
  select f.id, s.ends,
         coalesce((select sum(x.n) from pts x where x.fid = f.id and x.at < s.ends), 0)::integer
  from steps s
  cross join public.sk_factions f
  where f.edition_id = p_edition_id
  order by s.ends, f.sort_order, f.name;
end;
$$;

revoke execute on function public.sk_points_timeline(uuid, integer) from public;
grant execute on function public.sk_points_timeline(uuid, integer) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['sk_editions', 'sk_factions', 'sk_venues', 'sk_sports', 'sk_events', 'sk_athletes', 'sk_matches', 'sk_athlete_stats', 'sk_placements', 'sk_awards', 'sk_team'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- re-runnable: drop this file's policies first
do $$
declare r record;
begin
  for r in select tablename, policyname from pg_policies where schemaname = 'public' and tablename like 'sk\_%' loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy sk_editions_read on public.sk_editions for select to anon, authenticated using (is_published or app.is_staff());
create policy sk_editions_write on public.sk_editions for all to authenticated using (app.can_edit_sk()) with check (app.can_edit_sk());

do $$
declare t text;
begin
  foreach t in array array['sk_factions', 'sk_venues', 'sk_sports', 'sk_events', 'sk_athletes', 'sk_matches', 'sk_placements', 'sk_awards'] loop
    execute format('create policy %I on public.%I for select to anon, authenticated using (app.sk_edition_visible(edition_id))', t || '_read', t);
    execute format('create policy %I on public.%I for all to authenticated using (app.can_edit_sk()) with check (app.can_edit_sk())', t || '_write', t);
  end loop;
end $$;

create policy sk_athlete_stats_read on public.sk_athlete_stats for select to anon, authenticated
  using (exists (select 1 from public.sk_matches m where m.id = match_id and app.sk_edition_visible(m.edition_id)));
create policy sk_athlete_stats_write on public.sk_athlete_stats for all to authenticated
  using (app.can_edit_sk()) with check (app.can_edit_sk());

create policy sk_team_read on public.sk_team for select to authenticated using (app.is_staff());
create policy sk_team_add on public.sk_team for insert to authenticated with check (app.can_manage_sk_team());
create policy sk_team_remove on public.sk_team for delete to authenticated using (app.can_manage_sk_team());

revoke execute on all functions in schema app from public;
grant execute on all functions in schema app to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Realtime: live scores push to readers (Supabase only; skipped elsewhere)
-- -----------------------------------------------------------------------------
-- sk_matches: scores; sk_placements: medals and points (medal tally, points race, winners)
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['sk_matches', 'sk_placements'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

commit;
