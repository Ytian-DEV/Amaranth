-- Salingkusog: who may enter data, who may choose the team, and the computed standings.
begin;

-- ---------------------------------------------------------------- setup (service role)
select tests.logout();

insert into public.staff_invites (email, role) values ('me@test.local', 'managing_editor') on conflict do nothing;
insert into auth.users (email, raw_user_meta_data) values ('me@test.local', '{"display_name":"Mia Managing"}');

insert into public.sk_editions (id, year, title, subtitle, starts_on, ends_on, is_current)
values ('00000000-0000-0000-0000-00000000e001', 2026, 'Salingkusog 2026', 'VSU Intramural Games', '2026-10-13', '2026-10-18', true);

insert into public.sk_factions (id, edition_id, name, slug, color) values
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000e001', 'Primordial Tiamat', 'primordial-tiamat', '#2563eb'),
  ('00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-00000000e001', 'Centicore Vanguard', 'centicore-vanguard', '#dc2626'),
  ('00000000-0000-0000-0000-00000000f003', '00000000-0000-0000-0000-00000000e001', 'Sylvan Dragons', 'sylvan-dragons', '#16a34a');

-- ---------------------------------------------------------------- visibility
select tests.login(null);
select tests.expect_count('readers cannot see an unpublished edition', 'select id from public.sk_editions', 0);
select tests.expect_count('readers cannot see its factions', 'select id from public.sk_factions', 0);
select tests.expect_error('readers cannot write',
  $$insert into public.sk_sports (edition_id, name, slug, category) values ('00000000-0000-0000-0000-00000000e001', 'Chess', 'chess', 'mind_games')$$);

select tests.login('writer@test.local');
select tests.expect_count('staff can preview an unpublished edition', 'select id from public.sk_factions', 3);
select tests.expect_error('staff outside the team cannot enter data',
  $$insert into public.sk_sports (edition_id, name, slug, category) values ('00000000-0000-0000-0000-00000000e001', 'Chess', 'chess', 'mind_games')$$);
select tests.expect_error('staff outside the team cannot add themselves',
  $$insert into public.sk_team (profile_id) values (auth.uid())$$);

-- ---------------------------------------------------------------- who manages the team
select tests.login('news.editor@test.local');
select tests.expect_error('section editor cannot pick the team',
  $$insert into public.sk_team (profile_id) select id from public.profiles where email = 'writer@test.local'$$);

select tests.login('me@test.local');
select tests.expect_ok('managing editor adds a writer to the team',
  $$insert into public.sk_team (profile_id, added_by) select id, auth.uid() from public.profiles where email = 'writer@test.local'$$);
select tests.expect_ok('managing editor can enter data too',
  $$update public.sk_editions set subtitle = 'VSU Intramural Games' where year = 2026$$);

select tests.login('eic@test.local');
select tests.expect_ok('executive editor (editor_in_chief) adds a member',
  $$insert into public.sk_team (profile_id) select id from public.profiles where email = 'writer2@test.local'$$);
select tests.expect_ok('executive editor removes a member',
  $$delete from public.sk_team where profile_id = (select id from public.profiles where email = 'writer2@test.local')$$);

select tests.login('admin@test.local');
select tests.expect_ok('super admin manages the team',
  $$insert into public.sk_team (profile_id) select id from public.profiles where email = 'news.editor@test.local'$$);
select tests.logout();
select tests.expect_count('team changes are audited', $$select id from public.audit_log where action like 'salingkusog.team.%'$$, 4);

-- ---------------------------------------------------------------- a team member enters data
select tests.login('writer@test.local');
-- RLS hides rows from a delete instead of raising, so check the row survives
delete from public.sk_team where profile_id = (select id from public.profiles where email = 'news.editor@test.local');
select tests.expect_count('team members cannot remove others from the team', $$select 1 from public.sk_team$$, 2);

select tests.expect_ok('team member adds a sport',
  $$insert into public.sk_sports (id, edition_id, name, slug, category)
    values ('00000000-0000-0000-0000-0000000005b1', '00000000-0000-0000-0000-00000000e001', 'Basketball', 'basketball', 'ball_games'),
           ('00000000-0000-0000-0000-0000000005b2', '00000000-0000-0000-0000-00000000e001', 'Athletics', 'athletics', 'athletics')$$);
select tests.expect_ok('team member adds a venue',
  $$insert into public.sk_venues (id, edition_id, name, slug, map_number, map_x, map_y)
    values ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-00000000e001', 'University Gymnasium', 'university-gymnasium', 1, 42.5, 30)$$);
select tests.expect_ok('team member adds events (edition filled in from the sport)',
  $$insert into public.sk_events (id, sport_id, name, slug, division, format)
    values ('00000000-0000-0000-0000-0000000e0b01', '00000000-0000-0000-0000-0000000005b1', 'Men', 'basketball-men', 'men', 'bracket'),
           ('00000000-0000-0000-0000-0000000e0a01', '00000000-0000-0000-0000-0000000005b2', '100m Dash · Women', '100m-dash-women', 'women', 'timed')$$);
select tests.expect_eq('event inherited its edition',
  (select edition_id::text from public.sk_events where slug = 'basketball-men'), '00000000-0000-0000-0000-00000000e001');

select tests.expect_ok('team member schedules a semifinal and the final',
  $$insert into public.sk_matches (id, event_id, round, round_order, bracket_slot, venue_id, scheduled_at, side_a_id, side_b_id)
    values ('00000000-0000-0000-0000-0000000a0001', '00000000-0000-0000-0000-0000000e0b01', 'Semifinal 1', 1, 1, '00000000-0000-0000-0000-00000000a001',
            '2026-10-14T15:00:00+08:00', '00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000f003'),
           ('00000000-0000-0000-0000-0000000a0002', '00000000-0000-0000-0000-0000000e0b01', 'Final', 2, 1, '00000000-0000-0000-0000-00000000a001',
            '2026-10-15T16:00:00+08:00', '00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000f002')$$);
select tests.expect_error('a faction cannot play itself',
  $$insert into public.sk_matches (event_id, scheduled_at, side_a_id, side_b_id)
    values ('00000000-0000-0000-0000-0000000e0b01', now(), '00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000f001')$$);

select tests.expect_ok('scorekeeper starts the game',
  $$update public.sk_matches set status = 'live', score_a = 20, score_b = 16, live_note = 'Q2 · 8:10' where id = '00000000-0000-0000-0000-0000000a0002'$$);
select tests.expect_count('start time recorded when it went live',
  $$select 1 from public.sk_matches where id = '00000000-0000-0000-0000-0000000a0002' and started_at is not null and updated_by = auth.uid()$$, 1);
select tests.expect_error('a final needs both scores',
  $$update public.sk_matches set status = 'final', score_b = null where id = '00000000-0000-0000-0000-0000000a0002'$$);
select tests.expect_ok('scorekeeper finishes both games',
  $$update public.sk_matches set status = 'final', score_a = 81, score_b = 69 where id = '00000000-0000-0000-0000-0000000a0001';
    update public.sk_matches set status = 'final', score_a = 78, score_b = 71,
      periods = '[{"label":"Q1","a":20,"b":16},{"label":"Q2","a":18,"b":21},{"label":"Q3","a":22,"b":15},{"label":"Q4","a":18,"b":19}]'
    where id = '00000000-0000-0000-0000-0000000a0002'$$);
select tests.expect_eq('winner computed from the score', (select winner_side from public.sk_matches where id = '00000000-0000-0000-0000-0000000a0002'), 'a');
select tests.expect_count('finish clears the live note and records the end',
  $$select 1 from public.sk_matches where id = '00000000-0000-0000-0000-0000000a0002' and ended_at is not null and live_note is null$$, 1);

select tests.expect_ok('athletes and box scores',
  $$insert into public.sk_athletes (id, faction_id, name, slug)
    values ('00000000-0000-0000-0000-0000000a7101', '00000000-0000-0000-0000-00000000f001', 'Rafael Dela Peña', 'rafael-dela-pena'),
           ('00000000-0000-0000-0000-0000000a7102', '00000000-0000-0000-0000-00000000f003', 'Angela Mercado', 'angela-mercado');
    insert into public.sk_athlete_stats (match_id, athlete_id, stats)
    values ('00000000-0000-0000-0000-0000000a0001', '00000000-0000-0000-0000-0000000a7101', '{"PTS":28,"REB":7}'),
           ('00000000-0000-0000-0000-0000000a0002', '00000000-0000-0000-0000-0000000a7101', '{"PTS":24,"REB":9,"AST":5}')$$);

-- medals: basketball (day 3) gold PT 5, silver CV 3, bronze SD 1; 100m (day 2) gold SD 5, silver PT 3
select tests.expect_ok('results and medals',
  $$insert into public.sk_placements (event_id, place, medal, faction_id, result, awarded_on) values
      ('00000000-0000-0000-0000-0000000e0b01', 1, 'gold',   '00000000-0000-0000-0000-00000000f001', '78–71', '2026-10-15'),
      ('00000000-0000-0000-0000-0000000e0b01', 2, 'silver', '00000000-0000-0000-0000-00000000f002', null, '2026-10-15'),
      ('00000000-0000-0000-0000-0000000e0b01', 3, 'bronze', '00000000-0000-0000-0000-00000000f003', null, '2026-10-15');
    insert into public.sk_placements (event_id, place, medal, faction_id, athlete_id, result, awarded_on) values
      ('00000000-0000-0000-0000-0000000e0a01', 1, 'gold',   '00000000-0000-0000-0000-00000000f003', '00000000-0000-0000-0000-0000000a7102', '12.84s', '2026-10-14'),
      ('00000000-0000-0000-0000-0000000e0a01', 2, 'silver', '00000000-0000-0000-0000-00000000f001', null, '13.02s', '2026-10-14')$$);
select tests.expect_error('a gold must be first place',
  $$insert into public.sk_placements (event_id, place, medal, faction_id) values ('00000000-0000-0000-0000-0000000e0a01', 2, 'gold', '00000000-0000-0000-0000-00000000f002')$$);
select tests.expect_ok('award: athlete of the day',
  $$insert into public.sk_awards (edition_id, kind, day, athlete_id, event_id, headline)
    values ('00000000-0000-0000-0000-00000000e001', 'athlete_of_day', '2026-10-14', '00000000-0000-0000-0000-0000000a7102', '00000000-0000-0000-0000-0000000e0a01', '12.84s')$$);

-- ---------------------------------------------------------------- computed standings
select tests.expect_eq('medal table: Tiamat 1 gold + 1 silver = 8 pts, rank 1',
  (select rank || '|' || gold || '|' || silver || '|' || bronze || '|' || points from public.sk_medal_table where slug = 'primordial-tiamat'), '1|1|1|0|8');
select tests.expect_eq('medal table: Dragons 6 pts, rank 2',
  (select rank || '|' || points || '|' || total from public.sk_medal_table where slug = 'sylvan-dragons'), '2|6|2');
select tests.expect_eq('medal table: Vanguard 3 pts, rank 3',
  (select rank || '|' || points from public.sk_medal_table where slug = 'centicore-vanguard'), '3|3');
select tests.expect_eq('points race is cumulative by day (Tiamat: 0,3,8,8,8,8)',
  (select string_agg(points::text, ',' order by day) from public.sk_points_by_day where faction_id = '00000000-0000-0000-0000-00000000f001'), '0,3,8,8,8,8');
select tests.expect_count('points race has 6 days for each of 3 factions', 'select 1 from public.sk_points_by_day', 18);
select tests.expect_eq('head-to-head: Tiamat beat Vanguard once',
  (select wins || '-' || losses from public.sk_head_to_head where faction_id = '00000000-0000-0000-0000-00000000f001' and opponent_id = '00000000-0000-0000-0000-00000000f002'), '1-0');
select tests.expect_count('events completed (gold awarded)', 'select 1 from public.sk_event_status where completed', 2);
select tests.expect_eq('top scorer totals across games', (select total::text from public.sk_event_leaders where stat = 'PTS' and athlete_id = '00000000-0000-0000-0000-0000000a7101'), '52');

-- ---------------------------------------------------------------- publishing and removal
select tests.login('me@test.local');
select tests.expect_ok('publish the edition', $$update public.sk_editions set is_published = true where year = 2026$$);
select tests.login(null);
select tests.expect_count('readers now see the medal table', 'select 1 from public.sk_medal_table', 3);
select tests.expect_count('readers see box scores of the edition', 'select 1 from public.sk_athlete_stats', 2);
select tests.expect_count('readers cannot see who is on the team', 'select 1 from public.sk_team', 0);

select tests.login('me@test.local');
select tests.expect_ok('managing editor removes the writer from the team',
  $$delete from public.sk_team where profile_id = (select id from public.profiles where email = 'writer@test.local')$$);
select tests.login('writer@test.local');
select tests.expect_error('removed member can no longer enter scores',
  $$insert into public.sk_sports (edition_id, name, slug, category) values ('00000000-0000-0000-0000-00000000e001', 'Chess', 'chess', 'mind_games')$$);
update public.sk_matches set score_a = 0 where id = '00000000-0000-0000-0000-0000000a0002';
select tests.expect_count('…and score updates change nothing',
  $$select 1 from public.sk_matches where id = '00000000-0000-0000-0000-0000000a0002' and score_a = 78$$, 1);

-- ---------------------------------------------------------------- results in one step (sk_set_placements)
select tests.login('me@test.local');
select tests.expect_eq('set_placements replaces the 100m results',
  (select public.sk_set_placements('00000000-0000-0000-0000-0000000e0a01', jsonb_build_array(
     jsonb_build_object('place', 1, 'faction_id', '00000000-0000-0000-0000-00000000f001', 'result', '12.70s', 'awarded_on', '2026-10-14'),
     jsonb_build_object('place', 2, 'faction_id', '00000000-0000-0000-0000-00000000f003', 'result', '12.84s', 'awarded_on', '2026-10-14'),
     jsonb_build_object('place', 4, 'faction_id', '00000000-0000-0000-0000-00000000f002', 'result', ' ')))::text),
  '3');
select tests.expect_eq('medals follow the place; blank result is null',
  (select string_agg(place || ':' || coalesce(medal::text, '-') || ':' || coalesce(result, '-'), ',' order by place) from public.sk_placements where event_id = '00000000-0000-0000-0000-0000000e0a01'),
  '1:gold:12.70s,2:silver:12.84s,4:-:-');
select tests.expect_error('set_placements rolls back on a bad row',
  $$select public.sk_set_placements('00000000-0000-0000-0000-0000000e0a01', '[{"place": 1, "faction_id": "00000000-0000-0000-0000-00000000f001"}, {"place": 1, "faction_id": "00000000-0000-0000-0000-00000000f001"}]')$$);
select tests.expect_count('…leaving the previous results', $$select 1 from public.sk_placements where event_id = '00000000-0000-0000-0000-0000000e0a01'$$, 3);
select tests.login('writer@test.local');
select tests.expect_error('set_placements needs Salingkusog access',
  $$select public.sk_set_placements('00000000-0000-0000-0000-0000000e0a01', '[]')$$, '%Salingkusog team%');
select tests.login(null);
select tests.expect_error('readers cannot call set_placements',
  $$select public.sk_set_placements('00000000-0000-0000-0000-0000000e0a01', '[]')$$);

-- ---------------------------------------------------------------- one current edition
select tests.login('me@test.local');
select tests.expect_ok('a new current edition replaces the old one',
  $$insert into public.sk_editions (year, title, starts_on, ends_on, is_current) values (2027, 'Salingkusog 2027', '2027-10-12', '2027-10-17', true)$$);
select tests.expect_count('only one current edition', 'select 1 from public.sk_editions where is_current', 1);

rollback;
