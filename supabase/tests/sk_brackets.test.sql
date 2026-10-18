-- Salingkusog: "Build schedule", teams moving through brackets and round robins on their own.
begin;

select tests.logout();
insert into public.sk_editions (id, year, title, starts_on, ends_on, is_current)
values ('00000000-0000-0000-0000-00000000e101', 2030, 'Salingkusog 2030', '2030-10-14', '2030-10-19', false);
insert into public.sk_factions (id, edition_id, name, slug, color) values
  ('00000000-0000-0000-0000-00000000f101', '00000000-0000-0000-0000-00000000e101', 'Tiamat', 'tiamat', '#2563eb'),
  ('00000000-0000-0000-0000-00000000f102', '00000000-0000-0000-0000-00000000e101', 'Vanguard', 'vanguard', '#dc2626'),
  ('00000000-0000-0000-0000-00000000f103', '00000000-0000-0000-0000-00000000e101', 'Dragons', 'dragons', '#16a34a'),
  ('00000000-0000-0000-0000-00000000f104', '00000000-0000-0000-0000-00000000e101', 'Moirai', 'moirai', '#7c3aed');
insert into public.sk_sports (id, edition_id, name, slug, category) values
  ('00000000-0000-0000-0000-00000000a101', '00000000-0000-0000-0000-00000000e101', 'Basketball', 'basketball', 'ball_games');
insert into public.sk_events (id, sport_id, name, slug, format) values
  ('00000000-0000-0000-0000-00000000b101', '00000000-0000-0000-0000-00000000a101', 'Men', 'basketball-men', 'bracket'),
  ('00000000-0000-0000-0000-00000000b102', '00000000-0000-0000-0000-00000000a101', 'Women', 'basketball-women', 'round_robin'),
  ('00000000-0000-0000-0000-00000000b103', '00000000-0000-0000-0000-00000000a101', 'Mixed', 'basketball-mixed', 'round_robin'),
  ('00000000-0000-0000-0000-00000000b104', '00000000-0000-0000-0000-00000000a101', 'Open', 'basketball-open', 'bracket');

create temp table seeds4 as select array[
  '00000000-0000-0000-0000-00000000f101', '00000000-0000-0000-0000-00000000f102',
  '00000000-0000-0000-0000-00000000f103', '00000000-0000-0000-0000-00000000f104']::uuid[] as s;
grant select on seeds4 to authenticated;

-- a game by its round name, for readable checks
create temp view g as
  select m.event_id, m.round, m.status, f1.name as a, f2.name as b, m.id
  from public.sk_matches m
  left join public.sk_factions f1 on f1.id = m.side_a_id
  left join public.sk_factions f2 on f2.id = m.side_b_id;
grant select on g to authenticated;

-- ---------------------------------------------------------------- who may build
select tests.login('writer2@test.local');
select tests.expect_error('only the Salingkusog team builds schedules',
  $$select public.sk_build_schedule('00000000-0000-0000-0000-00000000b101', 'bracket', (select s from seeds4), '2030-10-14 08:00+08')$$, 'Salingkusog team');

select tests.login('pub.me@test.local');
select tests.expect_error('a faction can only be picked once',
  $$select public.sk_build_schedule('00000000-0000-0000-0000-00000000b101', 'bracket',
     array['00000000-0000-0000-0000-00000000f101', '00000000-0000-0000-0000-00000000f101']::uuid[], '2030-10-14 08:00+08')$$, 'picked once');

-- ---------------------------------------------------------------- single elimination + bronze
select tests.expect_eq('4 factions: 2 semifinals, a final and a bronze game',
  public.sk_build_schedule('00000000-0000-0000-0000-00000000b101', 'bracket', (select s from seeds4), '2030-10-14 08:00+08', 24, 90)::text, '4');
select tests.expect_eq('seeds 1 v 4 and 2 v 3 meet in the semifinals',
  (select string_agg(round || ':' || a || '-' || b, ' ' order by round) from g where event_id = '00000000-0000-0000-0000-00000000b101' and round like 'Semi%'),
  'Semifinal 1:Tiamat-Moirai Semifinal 2:Vanguard-Dragons');
select tests.expect_count('final and bronze game wait for the semifinals',
  $$select 1 from g where event_id = '00000000-0000-0000-0000-00000000b101' and round in ('Final', 'Bronze game') and a is null and b is null$$, 2);

select tests.expect_error('a knockout game cannot end in a tie',
  $$update public.sk_matches set status = 'final', score_a = 70, score_b = 70 where round = 'Semifinal 1' and event_id = '00000000-0000-0000-0000-00000000b101'$$, 'needs a winner');

update public.sk_matches set status = 'final', score_a = 70, score_b = 80 where round = 'Semifinal 1' and event_id = '00000000-0000-0000-0000-00000000b101';
select tests.expect_eq('the semifinal winner moves into the final',
  (select coalesce(a, '?') || '-' || coalesce(b, '?') from g where event_id = '00000000-0000-0000-0000-00000000b101' and round = 'Final'), 'Moirai-?');
select tests.expect_eq('the semifinal loser goes to the bronze game',
  (select coalesce(a, '?') || '-' || coalesce(b, '?') from g where event_id = '00000000-0000-0000-0000-00000000b101' and round = 'Bronze game'), 'Tiamat-?');

update public.sk_matches set status = 'final', score_a = 60, score_b = 55 where round = 'Semifinal 2' and event_id = '00000000-0000-0000-0000-00000000b101';
select tests.expect_eq('final is set', (select a || '-' || b from g where event_id = '00000000-0000-0000-0000-00000000b101' and round = 'Final'), 'Moirai-Vanguard');

update public.sk_matches set status = 'final', score_a = 90, score_b = 55 where round = 'Semifinal 2' and event_id = '00000000-0000-0000-0000-00000000b101';
select tests.expect_eq('a corrected score keeps the same winner', (select a || '-' || b from g where event_id = '00000000-0000-0000-0000-00000000b101' and round = 'Final'), 'Moirai-Vanguard');
update public.sk_matches set score_a = 50, score_b = 55 where round = 'Semifinal 2' and event_id = '00000000-0000-0000-0000-00000000b101';
select tests.expect_eq('a corrected result changes the final while it hasn''t started',
  (select a || '-' || b from g where event_id = '00000000-0000-0000-0000-00000000b101' and round = 'Final'), 'Moirai-Dragons');

update public.sk_matches set status = 'live', score_a = 0, score_b = 0 where round = 'Final' and event_id = '00000000-0000-0000-0000-00000000b101';
select tests.expect_error('once the final starts, the semifinal result is locked',
  $$update public.sk_matches set score_a = 99 where round = 'Semifinal 2' and event_id = '00000000-0000-0000-0000-00000000b101'$$, 'already started');
select tests.expect_error('a started event can''t be rebuilt',
  $$select public.sk_build_schedule('00000000-0000-0000-0000-00000000b101', 'bracket', (select s from seeds4), '2030-10-14 08:00+08')$$, 'already has games');

-- ---------------------------------------------------------------- byes
select tests.expect_eq('3 factions: the top seed gets a bye',
  public.sk_build_schedule('00000000-0000-0000-0000-00000000b104', 'bracket', (select s[1:3] from seeds4), '2030-10-14 08:00+08')::text, '2');
select tests.expect_eq('the bye seed waits in the final',
  (select coalesce(a, '?') || '-' || coalesce(b, '?') from g where event_id = '00000000-0000-0000-0000-00000000b104' and round = 'Final'), 'Tiamat-?');

-- ---------------------------------------------------------------- round robin: next round after this one
select tests.expect_eq('4 factions: 3 rounds of 2 games',
  public.sk_build_schedule('00000000-0000-0000-0000-00000000b102', 'round_robin', (select s from seeds4), '2030-10-14 08:00+08')::text, '6');
select tests.expect_count('everyone meets everyone once',
  $$select distinct least(source_a, source_b), greatest(source_a, source_b) from public.sk_matches where event_id = '00000000-0000-0000-0000-00000000b102'$$, 6);
select tests.expect_count('round 1 is filled in', $$select 1 from g where event_id = '00000000-0000-0000-0000-00000000b102' and round like 'Round 1%' and a is not null and b is not null$$, 2);
select tests.expect_count('round 2 waits for round 1', $$select 1 from g where event_id = '00000000-0000-0000-0000-00000000b102' and round like 'Round 2%' and a is null$$, 2);
update public.sk_matches set status = 'final', score_a = 3, score_b = 1 where event_id = '00000000-0000-0000-0000-00000000b102' and round = 'Round 1 · Game 1';
select tests.expect_count('still waiting while a round 1 game is left', $$select 1 from g where event_id = '00000000-0000-0000-0000-00000000b102' and round like 'Round 2%' and a is null$$, 2);
update public.sk_matches set status = 'final', score_a = 2, score_b = 2 where event_id = '00000000-0000-0000-0000-00000000b102' and round = 'Round 1 · Game 2';
select tests.expect_count('round robin games may be drawn, and round 2 is filled in',
  $$select 1 from g where event_id = '00000000-0000-0000-0000-00000000b102' and round like 'Round 2%' and a is not null and b is not null$$, 2);
select tests.expect_count('round 3 still waits', $$select 1 from g where event_id = '00000000-0000-0000-0000-00000000b102' and round like 'Round 3%' and a is null$$, 2);

-- ---------------------------------------------------------------- round robin + final
select tests.expect_eq('round robin + final: 6 games, then bronze and final',
  public.sk_build_schedule('00000000-0000-0000-0000-00000000b103', 'round_robin_final', (select s from seeds4), '2030-10-14 08:00+08')::text, '8');
-- seed 1 wins everything, seed 2 beats 3 and 4, seed 3 beats 4
update public.sk_matches m set status = 'final',
  score_a = case when split_part(m.source_a, ':', 2)::int < split_part(m.source_b, ':', 2)::int then 2 else 1 end,
  score_b = case when split_part(m.source_a, ':', 2)::int < split_part(m.source_b, ':', 2)::int then 1 else 2 end
where m.event_id = '00000000-0000-0000-0000-00000000b103' and m.round_order = 1;
update public.sk_matches m set status = 'final',
  score_a = case when split_part(m.source_a, ':', 2)::int < split_part(m.source_b, ':', 2)::int then 2 else 1 end,
  score_b = case when split_part(m.source_a, ':', 2)::int < split_part(m.source_b, ':', 2)::int then 1 else 2 end
where m.event_id = '00000000-0000-0000-0000-00000000b103' and m.round_order = 2;
select tests.expect_count('final waits for the last round', $$select 1 from g where event_id = '00000000-0000-0000-0000-00000000b103' and round = 'Final' and a is null$$, 1);
update public.sk_matches m set status = 'final',
  score_a = case when split_part(m.source_a, ':', 2)::int < split_part(m.source_b, ':', 2)::int then 2 else 1 end,
  score_b = case when split_part(m.source_a, ':', 2)::int < split_part(m.source_b, ':', 2)::int then 1 else 2 end
where m.event_id = '00000000-0000-0000-0000-00000000b103' and m.round_order = 3;
select tests.expect_eq('top 2 of the table play the final',
  (select a || '-' || b from g where event_id = '00000000-0000-0000-0000-00000000b103' and round = 'Final'), 'Tiamat-Vanguard');
select tests.expect_eq('3rd and 4th play the bronze game',
  (select a || '-' || b from g where event_id = '00000000-0000-0000-0000-00000000b103' and round = 'Bronze game'), 'Dragons-Moirai');

-- ---------------------------------------------------------------- readers
select tests.logout();
update public.sk_editions set is_published = true where id = '00000000-0000-0000-0000-00000000e101';
select tests.login(null);
select tests.expect_count('readers see where sides come from', $$select 1 from public.sk_matches where source_a is not null$$, 20);
select tests.expect_error('readers cannot build schedules',
  $$select public.sk_build_schedule('00000000-0000-0000-0000-00000000b101', 'bracket', '{}', now())$$, 'permission denied');

rollback;
