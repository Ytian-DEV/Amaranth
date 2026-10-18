-- Salingkusog contests: every faction competes at once (dance, swimming, athletics…).
begin;

select tests.logout();
insert into public.sk_editions (id, year, title, starts_on, ends_on, is_current, is_published)
values ('00000000-0000-0000-0000-00000000e201', 2031, 'Salingkusog 2031', '2031-10-13', '2031-10-18', false, true);
insert into public.sk_factions (id, edition_id, name, slug, color, sort_order) values
  ('00000000-0000-0000-0000-00000000f201', '00000000-0000-0000-0000-00000000e201', 'Tiamat', 'tiamat', '#2563eb', 1),
  ('00000000-0000-0000-0000-00000000f202', '00000000-0000-0000-0000-00000000e201', 'Vanguard', 'vanguard', '#dc2626', 2),
  ('00000000-0000-0000-0000-00000000f203', '00000000-0000-0000-0000-00000000e201', 'Dragons', 'dragons', '#16a34a', 3);
insert into public.sk_athletes (id, edition_id, faction_id, name, slug) values
  ('00000000-0000-0000-0000-00000000c201', '00000000-0000-0000-0000-00000000e201', '00000000-0000-0000-0000-00000000f201', 'Ana Swimmer', 'ana-swimmer'),
  ('00000000-0000-0000-0000-00000000c202', '00000000-0000-0000-0000-00000000e201', '00000000-0000-0000-0000-00000000f202', 'Ben Swimmer', 'ben-swimmer');
insert into public.sk_sports (id, edition_id, name, slug, category) values
  ('00000000-0000-0000-0000-00000000a201', '00000000-0000-0000-0000-00000000e201', 'Swimming', 'swimming', 'aquatics'),
  ('00000000-0000-0000-0000-00000000a202', '00000000-0000-0000-0000-00000000e201', 'Hip-hop', 'hip-hop', 'dance_cheer'),
  ('00000000-0000-0000-0000-00000000a203', '00000000-0000-0000-0000-00000000e201', 'Football', 'football', 'ball_games');
insert into public.sk_events (id, sport_id, name, slug, format, is_team, result_unit) values
  ('00000000-0000-0000-0000-00000000b201', '00000000-0000-0000-0000-00000000a201', '50m Free · Women', 'swim-50-free-w', 'timed', false, 's'),
  ('00000000-0000-0000-0000-00000000b202', '00000000-0000-0000-0000-00000000a202', 'Open', 'hip-hop-open', 'judged', true, null),
  ('00000000-0000-0000-0000-00000000b203', '00000000-0000-0000-0000-00000000a203', 'Men', 'football-men', 'bracket', true, null);

-- ---------------------------------------------------------------- creating a contest
select tests.login('writer2@test.local');
select tests.expect_error('only the Salingkusog team creates contests',
  $$select public.sk_create_contest('00000000-0000-0000-0000-00000000b202', '2031-10-14 14:00+08')$$, 'Salingkusog team');

select tests.login('pub.me@test.local');
select tests.expect_error('contests are for timed or judged events',
  $$select public.sk_create_contest('00000000-0000-0000-0000-00000000b203', '2031-10-14 14:00+08')$$, 'timed, measured or judged');
select tests.expect_ok('hip-hop: one session with every faction',
  $$select public.sk_create_contest('00000000-0000-0000-0000-00000000b202', '2031-10-14 14:00+08')$$);
select tests.expect_eq('performance order follows the faction order',
  (select string_agg(f.name, ',' order by e.lane) from public.sk_entries e join public.sk_factions f on f.id = e.faction_id
   join public.sk_matches m on m.id = e.match_id where m.event_id = '00000000-0000-0000-0000-00000000b202'),
  'Tiamat,Vanguard,Dragons');
select tests.expect_eq('the session has no sides and is called Final',
  (select round || ':' || is_contest || ':' || (side_a_id is null) from public.sk_matches where event_id = '00000000-0000-0000-0000-00000000b202'),
  'Final:true:true');
select tests.expect_ok('swimming: only the chosen factions',
  $$select public.sk_create_contest('00000000-0000-0000-0000-00000000b201', '2031-10-14 08:00+08', null, 'Final',
     array['00000000-0000-0000-0000-00000000f202', '00000000-0000-0000-0000-00000000f201']::uuid[])$$);
select tests.expect_eq('in the order given',
  (select string_agg(f.name, ',' order by e.lane) from public.sk_entries e join public.sk_factions f on f.id = e.faction_id
   join public.sk_matches m on m.id = e.match_id where m.event_id = '00000000-0000-0000-0000-00000000b201'),
  'Vanguard,Tiamat');

-- ---------------------------------------------------------------- entering results
select tests.expect_error('one entry per faction',
  $$insert into public.sk_entries (match_id, faction_id)
    select id, '00000000-0000-0000-0000-00000000f201' from public.sk_matches where event_id = '00000000-0000-0000-0000-00000000b201'$$, 'duplicate');
select tests.expect_error('the athlete must be from the entry''s faction',
  $$update public.sk_entries set athlete_id = '00000000-0000-0000-0000-00000000c202'
    where faction_id = '00000000-0000-0000-0000-00000000f201'
      and match_id = (select id from public.sk_matches where event_id = '00000000-0000-0000-0000-00000000b201')$$, 'same faction');
select tests.expect_ok('times are entered per athlete',
  $$update public.sk_entries e set athlete_id = a.id, result = case a.slug when 'ana-swimmer' then 31.45 else 30.02 end
    from public.sk_athletes a
    where a.faction_id = e.faction_id and e.match_id = (select id from public.sk_matches where event_id = '00000000-0000-0000-0000-00000000b201')$$);
select tests.expect_ok('a contest can finish without scores',
  $$update public.sk_matches set status = 'final' where event_id = '00000000-0000-0000-0000-00000000b201'$$);
select tests.expect_error('entries only go into contest sessions',
  $$insert into public.sk_matches (event_id, scheduled_at, side_a_id, side_b_id) values ('00000000-0000-0000-0000-00000000b203', now(),
     '00000000-0000-0000-0000-00000000f201', '00000000-0000-0000-0000-00000000f202');
    insert into public.sk_entries (match_id, faction_id)
    select id, '00000000-0000-0000-0000-00000000f203' from public.sk_matches where event_id = '00000000-0000-0000-0000-00000000b203'$$, 'contest session');
select tests.expect_error('a contest session has no sides',
  $$update public.sk_matches set side_a_id = '00000000-0000-0000-0000-00000000f201' where event_id = '00000000-0000-0000-0000-00000000b202'$$, 'contest_no_sides');
select tests.expect_ok('judged places are entered, and two factions can share one',
  $$update public.sk_entries e set place = case f.slug when 'dragons' then 1 else 2 end
    from public.sk_factions f where f.id = e.faction_id
      and e.match_id = (select id from public.sk_matches where event_id = '00000000-0000-0000-0000-00000000b202')$$);
select tests.expect_error('did not start / finish / disqualified only',
  $$update public.sk_entries set status = 'late' where faction_id = '00000000-0000-0000-0000-00000000f203'$$, 'check');

-- ---------------------------------------------------------------- readers
select tests.login(null);
select tests.expect_count('readers see contest entries', 'select 1 from public.sk_entries', 5);
update public.sk_entries set place = 1; -- RLS hides rows from an update instead of raising
select tests.logout();
select tests.expect_count('readers cannot change them', 'select 1 from public.sk_entries where place = 1', 1);

rollback;
