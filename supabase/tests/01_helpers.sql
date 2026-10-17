-- Test helpers. LOCAL TESTING ONLY.
create schema if not exists tests;
grant usage on schema tests to anon, authenticated, service_role;

-- Act as a user (by email, from auth.users) or as anon when p_email is null.
create or replace function tests.login(p_email text)
returns void
language plpgsql
as $$
declare
  v_id uuid;
begin
  execute 'reset role';
  if p_email is null then
    perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, false);
    execute 'set role anon';
    return;
  end if;
  select id into v_id from auth.users where email = p_email;
  if v_id is null then
    raise exception 'tests.login: no auth user %', p_email;
  end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_id, 'role', 'authenticated')::text, false);
  execute 'set role authenticated';
end;
$$;

create or replace function tests.logout()
returns void
language plpgsql
as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', false);
end;
$$;

create or replace function tests.expect_error(p_label text, p_sql text, p_like text default null)
returns void
language plpgsql
as $$
begin
  begin
    execute p_sql;
  exception when others then
    if p_like is not null and sqlerrm not ilike '%' || p_like || '%' then
      raise exception 'FAIL %: expected error like "%", got "%"', p_label, p_like, sqlerrm;
    end if;
    raise notice 'ok   %', p_label;
    return;
  end;
  raise exception 'FAIL %: expected an error, statement succeeded', p_label;
end;
$$;

create or replace function tests.expect_count(p_label text, p_sql text, p_expected bigint)
returns void
language plpgsql
as $$
declare
  v_count bigint;
begin
  execute format('select count(*) from (%s) as q', p_sql) into v_count;
  if v_count is distinct from p_expected then
    raise exception 'FAIL %: expected % rows, got %', p_label, p_expected, v_count;
  end if;
  raise notice 'ok   %', p_label;
end;
$$;

create or replace function tests.expect_ok(p_label text, p_sql text)
returns void
language plpgsql
as $$
begin
  execute p_sql;
  raise notice 'ok   %', p_label;
exception when others then
  raise exception 'FAIL %: %', p_label, sqlerrm;
end;
$$;

create or replace function tests.expect_eq(p_label text, p_actual text, p_expected text)
returns void
language plpgsql
as $$
begin
  if p_actual is distinct from p_expected then
    raise exception 'FAIL %: expected "%", got "%"', p_label, p_expected, p_actual;
  end if;
  raise notice 'ok   %', p_label;
end;
$$;

grant execute on all functions in schema tests to anon, authenticated, service_role;
