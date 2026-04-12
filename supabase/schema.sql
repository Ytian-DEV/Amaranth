-- AMARANTH Supabase schema
-- Generated from the current frontend structure on 2026-04-11.
-- Covers:
--   - newsroom auth + profiles
--   - sections, categories, contributors, articles, tags, media
--   - archive issues
--   - article submissions, event reports, contact inbox
--   - editorial board / advisers / section heads
--   - search, analytics, compatibility views, RLS, and storage buckets

begin;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;
create extension if not exists unaccent with schema extensions;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role' and typnamespace = 'public'::regnamespace) then
    create type public.app_role as enum (
      'super_admin',
      'editor_in_chief',
      'managing_editor',
      'section_editor',
      'staff_writer',
      'contributor'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'contributor_type' and typnamespace = 'public'::regnamespace) then
    create type public.contributor_type as enum (
      'staff',
      'student',
      'guest',
      'faculty',
      'alumni'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'article_status' and typnamespace = 'public'::regnamespace) then
    create type public.article_status as enum (
      'draft',
      'submitted',
      'in_review',
      'scheduled',
      'published',
      'archived',
      'rejected'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'intake_status' and typnamespace = 'public'::regnamespace) then
    create type public.intake_status as enum (
      'submitted',
      'reviewing',
      'accepted',
      'rejected',
      'converted'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'contact_message_category' and typnamespace = 'public'::regnamespace) then
    create type public.contact_message_category as enum (
      'general',
      'editorial',
      'submission',
      'technical',
      'advertising',
      'feedback'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'contact_message_status' and typnamespace = 'public'::regnamespace) then
    create type public.contact_message_status as enum (
      'unread',
      'in_progress',
      'resolved',
      'spam'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'publication_issue_type' and typnamespace = 'public'::regnamespace) then
    create type public.publication_issue_type as enum (
      'regular',
      'special',
      'graduation',
      'annual',
      'commemorative'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'asset_kind' and typnamespace = 'public'::regnamespace) then
    create type public.asset_kind as enum (
      'image',
      'document',
      'pdf',
      'audio',
      'video',
      'attachment'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'article_asset_usage' and typnamespace = 'public'::regnamespace) then
    create type public.article_asset_usage as enum (
      'cover',
      'inline',
      'gallery',
      'attachment',
      'document'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'event_asset_usage' and typnamespace = 'public'::regnamespace) then
    create type public.event_asset_usage as enum (
      'photo',
      'document'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'team_role_group' and typnamespace = 'public'::regnamespace) then
    create type public.team_role_group as enum (
      'adviser',
      'editorial_board',
      'section_head',
      'staff'
    );
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create or replace function public.slugify(input text)
returns text
language sql
stable
as $$
  select nullif(
    trim(
      both '-'
      from regexp_replace(
        regexp_replace(
          lower(extensions.unaccent(coalesce(input, ''))),
          '[^a-z0-9]+',
          '-',
          'g'
        ),
        '-+',
        '-',
        'g'
      )
    ),
    ''
  );
$$;

create or replace function public.apply_slug()
returns trigger
language plpgsql
as $$
declare
  source_column text;
  source_value text;
begin
  source_column := tg_argv[0];

  if source_column is null then
    raise exception 'apply_slug trigger requires a source column name in TG_ARGV[0]';
  end if;

  execute format('select ($1).%I::text', source_column) into source_value using new;

  if coalesce(trim(new.slug), '') = '' then
    new.slug := public.slugify(source_value);
  else
    new.slug := public.slugify(new.slug);
  end if;

  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username extensions.citext unique,
  display_name text not null,
  email extensions.citext unique,
  avatar_url text,
  bio text,
  app_role public.app_role not null default 'contributor',
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.app_role from public.profiles p where p.id = auth.uid()),
    'contributor'::public.app_role
  );
$$;

create or replace function public.can_write_articles()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in (
    'super_admin',
    'editor_in_chief',
    'managing_editor',
    'section_editor',
    'staff_writer'
  );
$$;

create or replace function public.can_manage_all_articles()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in (
    'super_admin',
    'editor_in_chief',
    'managing_editor',
    'section_editor'
  );
$$;

create or replace function public.can_publish_content()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in (
    'super_admin',
    'editor_in_chief',
    'managing_editor'
  );
$$;

create or replace function public.can_admin_site()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in (
    'super_admin',
    'editor_in_chief',
    'managing_editor'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    username,
    display_name,
    email
  )
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      public.slugify(coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1))),
      'user'
    ) || '-' || left(new.id::text, 8),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      split_part(coalesce(new.email, 'new-user@example.com'), '@', 1)
    ),
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9-]+$'),
  name text not null unique,
  slug text not null unique,
  description text,
  nav_order integer not null default 0,
  is_nav_visible boolean not null default true,
  accepts_submissions boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections (id) on delete cascade,
  parent_id uuid references public.categories (id) on delete set null,
  title text not null,
  name text generated always as (title) stored,
  slug text not null,
  description text,
  sort_order integer not null default 0,
  is_assignable boolean not null default true,
  accepts_submissions boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint categories_unique_slug_per_section unique (section_id, slug),
  constraint categories_parent_not_self check (parent_id is null or parent_id <> id)
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid references public.profiles (id) on delete set null,
  bucket_name text not null,
  storage_path text not null unique,
  public_url text,
  alt_text text,
  kind public.asset_kind not null,
  mime_type text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  width_px integer check (width_px is null or width_px >= 0),
  height_px integer check (height_px is null or height_px >= 0),
  duration_seconds numeric(10,2) check (duration_seconds is null or duration_seconds >= 0),
  metadata jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contributors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  display_name text not null,
  slug text not null unique,
  email extensions.citext,
  contributor_type public.contributor_type not null default 'student',
  bio text,
  avatar_asset_id uuid references public.media_assets (id) on delete set null,
  academic_program text,
  year_level text,
  department text,
  is_public boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.publication_issues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  issue_type public.publication_issue_type not null default 'regular',
  issue_date date not null,
  volume_label text,
  issue_number text,
  description text,
  cover_asset_id uuid references public.media_assets (id) on delete set null,
  pdf_asset_id uuid references public.media_assets (id) on delete set null,
  view_url text,
  download_url text,
  is_published boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  issue_id uuid references public.publication_issues (id) on delete set null,
  issue_position integer check (issue_position is null or issue_position > 0),
  title text not null,
  slug text not null unique,
  subtitle text,
  excerpt text not null,
  author_name text not null default 'Amaranth Staff',
  body_html text,
  body_text text not null,
  contents text generated always as (body_text) stored,
  seo_title text,
  seo_description text,
  cover_asset_id uuid references public.media_assets (id) on delete set null,
  image_url text,
  featured_image_alt text,
  category text,
  status public.article_status not null default 'draft',
  editorial_priority smallint not null default 0 check (editorial_priority between 0 and 100),
  scheduled_for timestamptz,
  published_at timestamptz,
  published_date timestamptz generated always as (published_at) stored,
  archived_at timestamptz,
  publish boolean generated always as (status = 'published') stored,
  allow_comments boolean not null default false,
  meta jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  search_document tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(subtitle, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(body_text, '')), 'C')
  ) stored,
  constraint articles_scheduled_requires_datetime check (status <> 'scheduled' or scheduled_for is not null),
  constraint articles_published_requires_datetime check (status <> 'published' or published_at is not null)
);

create table if not exists public.article_authors (
  article_id uuid not null references public.articles (id) on delete cascade,
  contributor_id uuid not null references public.contributors (id) on delete restrict,
  credit_label text not null default 'Author',
  display_order integer not null default 1 check (display_order > 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (article_id, contributor_id)
);

create table if not exists public.article_tags (
  article_id uuid not null references public.articles (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (article_id, tag_id)
);

create table if not exists public.article_media (
  article_id uuid not null references public.articles (id) on delete cascade,
  asset_id uuid not null references public.media_assets (id) on delete cascade,
  usage public.article_asset_usage not null default 'inline',
  sort_order integer not null default 1 check (sort_order > 0),
  caption text,
  credit text,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (article_id, asset_id, usage)
);

create table if not exists public.article_daily_metrics (
  article_id uuid not null references public.articles (id) on delete cascade,
  metric_date date not null default current_date,
  view_count integer not null default 0 check (view_count >= 0),
  unique_visitors integer not null default 0 check (unique_visitors >= 0),
  share_count integer not null default 0 check (share_count >= 0),
  search_clicks integer not null default 0 check (search_clicks >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (article_id, metric_date)
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email extensions.citext not null,
  subject text not null,
  category public.contact_message_category not null default 'general',
  message text not null,
  status public.contact_message_status not null default 'unread',
  handled_by uuid references public.profiles (id) on delete set null,
  handled_at timestamptz,
  source_page text not null default 'contact',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.article_submissions (
  id uuid primary key default gen_random_uuid(),
  contributor_name text not null,
  contributor_email extensions.citext not null,
  proposed_title text not null,
  proposed_section_id uuid references public.sections (id) on delete set null,
  proposed_category_id uuid references public.categories (id) on delete set null,
  excerpt text not null,
  body_text text not null,
  notes text,
  status public.intake_status not null default 'submitted',
  converted_article_id uuid references public.articles (id) on delete set null,
  review_notes text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.submission_assets (
  submission_id uuid not null references public.article_submissions (id) on delete cascade,
  asset_id uuid not null references public.media_assets (id) on delete cascade,
  usage public.article_asset_usage not null default 'attachment',
  sort_order integer not null default 1 check (sort_order > 0),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (submission_id, asset_id)
);

create table if not exists public.event_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_name text not null,
  reporter_email extensions.citext not null,
  event_name text not null,
  event_date date not null,
  location text not null,
  event_type text not null,
  attendees_text text,
  description text not null,
  key_highlights text,
  status public.intake_status not null default 'submitted',
  converted_article_id uuid references public.articles (id) on delete set null,
  review_notes text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.event_report_assets (
  event_report_id uuid not null references public.event_reports (id) on delete cascade,
  asset_id uuid not null references public.media_assets (id) on delete cascade,
  usage public.event_asset_usage not null default 'photo',
  sort_order integer not null default 1 check (sort_order > 0),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (event_report_id, asset_id)
);

create table if not exists public.team_terms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  is_public boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.team_role_assignments (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.team_terms (id) on delete cascade,
  contributor_id uuid not null references public.contributors (id) on delete cascade,
  role_group public.team_role_group not null,
  role_title text not null,
  sort_order integer not null default 0,
  academic_program text,
  year_level text,
  department text,
  bio_override text,
  email_override extensions.citext,
  image_asset_id uuid references public.media_assets (id) on delete set null,
  is_public boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint team_role_assignments_unique_role unique (term_id, contributor_id, role_title)
);

create table if not exists public.department_contacts (
  id uuid primary key default gen_random_uuid(),
  section_id uuid references public.sections (id) on delete set null,
  name text not null,
  email extensions.citext not null,
  phone text,
  sort_order integer not null default 0,
  is_public boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.enforce_assignable_category()
returns trigger
language plpgsql
as $$
declare
  category_can_be_used boolean;
  resolved_category text;
begin
  select
    (c.is_assignable and c.is_active),
    case
      when c.title = s.name then c.title
      else s.name || ' - ' || c.title
    end
  into category_can_be_used, resolved_category
  from public.categories c
  join public.sections s on s.id = c.section_id
  where c.id = new.category_id;

  if category_can_be_used is distinct from true then
    raise exception 'Articles must be assigned to an active, assignable category.';
  end if;

  new.category := resolved_category;

  return new;
end;
$$;

create or replace function public.prepare_article_status()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := timezone('utc', now());
  end if;

  if new.status = 'archived' and new.archived_at is null then
    new.archived_at := timezone('utc', now());
  elsif new.status <> 'archived' then
    new.archived_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists sections_set_updated_at on public.sections;
create trigger sections_set_updated_at
before update on public.sections
for each row
execute function public.set_updated_at();

drop trigger if exists sections_apply_slug on public.sections;
create trigger sections_apply_slug
before insert or update of name, slug on public.sections
for each row
execute function public.apply_slug('name');

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

drop trigger if exists categories_apply_slug on public.categories;
create trigger categories_apply_slug
before insert or update of title, slug on public.categories
for each row
execute function public.apply_slug('title');

drop trigger if exists media_assets_set_updated_at on public.media_assets;
create trigger media_assets_set_updated_at
before update on public.media_assets
for each row
execute function public.set_updated_at();

drop trigger if exists contributors_set_updated_at on public.contributors;
create trigger contributors_set_updated_at
before update on public.contributors
for each row
execute function public.set_updated_at();

drop trigger if exists contributors_apply_slug on public.contributors;
create trigger contributors_apply_slug
before insert or update of display_name, slug on public.contributors
for each row
execute function public.apply_slug('display_name');

drop trigger if exists tags_set_updated_at on public.tags;
create trigger tags_set_updated_at
before update on public.tags
for each row
execute function public.set_updated_at();

drop trigger if exists tags_apply_slug on public.tags;
create trigger tags_apply_slug
before insert or update of name, slug on public.tags
for each row
execute function public.apply_slug('name');

drop trigger if exists publication_issues_set_updated_at on public.publication_issues;
create trigger publication_issues_set_updated_at
before update on public.publication_issues
for each row
execute function public.set_updated_at();

drop trigger if exists publication_issues_apply_slug on public.publication_issues;
create trigger publication_issues_apply_slug
before insert or update of title, slug on public.publication_issues
for each row
execute function public.apply_slug('title');

drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at
before update on public.articles
for each row
execute function public.set_updated_at();

drop trigger if exists articles_apply_slug on public.articles;
create trigger articles_apply_slug
before insert or update of title, slug on public.articles
for each row
execute function public.apply_slug('title');

drop trigger if exists articles_prepare_status on public.articles;
create trigger articles_prepare_status
before insert or update of status, published_at, archived_at, scheduled_for on public.articles
for each row
execute function public.prepare_article_status();

drop trigger if exists articles_enforce_assignable_category on public.articles;
create trigger articles_enforce_assignable_category
before insert or update of category_id on public.articles
for each row
execute function public.enforce_assignable_category();

drop trigger if exists article_daily_metrics_set_updated_at on public.article_daily_metrics;
create trigger article_daily_metrics_set_updated_at
before update on public.article_daily_metrics
for each row
execute function public.set_updated_at();

drop trigger if exists contact_messages_set_updated_at on public.contact_messages;
create trigger contact_messages_set_updated_at
before update on public.contact_messages
for each row
execute function public.set_updated_at();

drop trigger if exists article_submissions_set_updated_at on public.article_submissions;
create trigger article_submissions_set_updated_at
before update on public.article_submissions
for each row
execute function public.set_updated_at();

drop trigger if exists event_reports_set_updated_at on public.event_reports;
create trigger event_reports_set_updated_at
before update on public.event_reports
for each row
execute function public.set_updated_at();

drop trigger if exists team_terms_set_updated_at on public.team_terms;
create trigger team_terms_set_updated_at
before update on public.team_terms
for each row
execute function public.set_updated_at();

drop trigger if exists team_role_assignments_set_updated_at on public.team_role_assignments;
create trigger team_role_assignments_set_updated_at
before update on public.team_role_assignments
for each row
execute function public.set_updated_at();

drop trigger if exists department_contacts_set_updated_at on public.department_contacts;
create trigger department_contacts_set_updated_at
before update on public.department_contacts
for each row
execute function public.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row
execute function public.set_updated_at();

create or replace function public.is_article_owner(article_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.articles a
    where a.id = article_uuid
      and a.created_by = auth.uid()
  )
  or exists (
    select 1
    from public.article_authors aa
    join public.contributors c on c.id = aa.contributor_id
    where aa.article_id = article_uuid
      and c.profile_id = auth.uid()
  );
$$;

create unique index if not exists article_primary_author_unique
  on public.article_authors (article_id)
  where is_primary;

create unique index if not exists article_submission_converted_unique
  on public.article_submissions (converted_article_id)
  where converted_article_id is not null;

create unique index if not exists event_report_converted_unique
  on public.event_reports (converted_article_id)
  where converted_article_id is not null;

create unique index if not exists team_terms_one_current_unique
  on public.team_terms (is_current)
  where is_current;

create index if not exists sections_nav_order_idx on public.sections (nav_order);
create index if not exists categories_section_sort_idx on public.categories (section_id, sort_order);
create index if not exists categories_active_idx on public.categories (is_active);
create index if not exists contributors_profile_idx on public.contributors (profile_id);
create index if not exists contributors_public_idx on public.contributors (is_public, is_active);
create index if not exists publication_issues_date_idx on public.publication_issues (issue_date desc);
create index if not exists articles_category_status_date_idx on public.articles (category_id, status, published_at desc);
create index if not exists articles_issue_position_idx on public.articles (issue_id, issue_position);
create index if not exists articles_status_priority_idx on public.articles (status, editorial_priority desc, published_at desc);
create index if not exists articles_search_document_idx on public.articles using gin (search_document);
create index if not exists article_authors_contributor_idx on public.article_authors (contributor_id, display_order);
create index if not exists article_media_article_usage_idx on public.article_media (article_id, usage, sort_order);
create index if not exists article_daily_metrics_date_idx on public.article_daily_metrics (metric_date desc);
create index if not exists contact_messages_status_created_idx on public.contact_messages (status, created_at desc);
create index if not exists article_submissions_status_created_idx on public.article_submissions (status, created_at desc);
create index if not exists event_reports_status_created_idx on public.event_reports (status, created_at desc);
create index if not exists team_role_assignments_term_group_idx on public.team_role_assignments (term_id, role_group, sort_order);
create index if not exists department_contacts_sort_idx on public.department_contacts (sort_order);
create unique index if not exists department_contacts_name_unique on public.department_contacts (name);
create index if not exists site_settings_public_idx on public.site_settings (is_public);

insert into public.sections (key, name, slug, description, nav_order, is_nav_visible, accepts_submissions)
values
  ('news', 'News', 'news', 'Breaking campus, community, regional, national, and global reporting.', 1, true, true),
  ('sports', 'Sports', 'sports', 'Athletics coverage, competitions, profiles, and sports updates.', 2, true, true),
  ('feature', 'Feature', 'feature', 'Long-form human-interest stories, campus life, and experiences.', 3, true, true),
  ('literary', 'Literary', 'literary', 'Poetry, prose, and creative writing.', 4, true, true),
  ('blogs', 'Blogs', 'blogs', 'Blogs and informal commentary pieces.', 5, true, true),
  ('specials', 'Specials', 'specials', 'Comics, multimedia, and special storytelling formats.', 6, true, true),
  ('views', 'Views', 'views', 'Editorials, opinion pieces, and vox pop entries.', 7, true, true),
  ('science-technology', 'Science & Technology', 'science-technology', 'Science, technology, and innovation stories.', 8, true, true),
  ('investigative', 'Investigative', 'investigative', 'Investigative reports and accountability journalism.', 9, true, true),
  ('explainer', 'Explainer', 'explainer', 'Context-rich explainers for complex topics.', 10, true, true),
  ('bulletin', 'Bulletin', 'bulletin', 'Official notices, board passers, jobs, and event bulletins.', 11, true, false),
  ('stories', 'Stories', 'stories', 'Story-driven narrative content and community stories.', 12, true, true)
on conflict (key) do update
set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  nav_order = excluded.nav_order,
  is_nav_visible = excluded.is_nav_visible,
  accepts_submissions = excluded.accepts_submissions,
  updated_at = timezone('utc', now());

insert into public.categories (section_id, title, slug, description, sort_order, is_assignable, accepts_submissions, is_active)
select s.id, x.title, x.slug, x.description, x.sort_order, true, x.accepts_submissions, true
from public.sections s
join (
  values
    ('news', 'Campus News', 'campus-news', 'University and campus-focused reporting.', 1, true),
    ('news', 'Community News', 'community-news', 'Stories from the wider local community.', 2, true),
    ('news', 'Regional News', 'regional-news', 'Regional developments affecting readers.', 3, true),
    ('news', 'National News', 'national-news', 'National-level news relevant to VSU readers.', 4, true),
    ('news', 'Global News', 'global-news', 'International news and analysis.', 5, true),
    ('sports', 'Salingkusog', 'salingkusog', 'Campus sports coverage for Salingkusog.', 1, true),
    ('sports', 'SCUAA', 'scuaa', 'SCUAA competitions and stories.', 2, true),
    ('sports', 'National Sports News', 'national-sports-news', 'National-level sports reporting.', 3, true),
    ('sports', 'Sports Feature', 'sports-feature', 'Profiles, analysis, and feature-length sports stories.', 4, true),
    ('sports', 'World Sports News', 'world-sports-news', 'International sports stories.', 5, true),
    ('feature', 'Campus Feature', 'campus-feature', 'Feature stories centered on campus life.', 1, true),
    ('feature', 'People & Events', 'people-events', 'People, milestones, and event-driven features.', 2, true),
    ('feature', 'Experiences', 'experiences', 'First-person and experience-based narratives.', 3, true),
    ('feature', 'Lifestyle', 'lifestyle', 'Lifestyle and culture stories.', 4, true),
    ('feature', 'Entertainment', 'entertainment', 'Entertainment coverage and reviews.', 5, true),
    ('literary', 'Poetry', 'poetry', 'Poetry submissions and literary features.', 1, true),
    ('literary', 'Prose', 'prose', 'Prose, fiction, and literary essays.', 2, true),
    ('blogs', 'Blogs', 'blogs', 'General blog entries.', 1, true),
    ('specials', 'Comics', 'comics', 'Comics and illustrated storytelling.', 1, true),
    ('specials', 'Multimedia', 'multimedia', 'Audio, video, and multimedia specials.', 2, true),
    ('views', 'Editorial', 'editorial', 'Unsigned institutional editorials.', 1, false),
    ('views', 'Opinion', 'opinion', 'Opinion and commentary pieces.', 2, true),
    ('views', 'Vox Pop', 'vox-pop', 'Public opinion and vox pop entries.', 3, true),
    ('science-technology', 'Science & Technology', 'science-technology', 'Science and technology reporting.', 1, true),
    ('investigative', 'Investigative', 'investigative', 'Investigative journalism.', 1, true),
    ('explainer', 'Explainer', 'explainer', 'Explainer articles.', 1, true),
    ('bulletin', 'Board Passers', 'board-passers', 'Board passer announcements.', 1, false),
    ('bulletin', 'Jobs', 'jobs', 'Job and opportunity postings.', 2, false),
    ('bulletin', 'Official Announcement', 'official-announcement', 'Official announcements and notices.', 3, false),
    ('bulletin', 'Student Council', 'student-council', 'Student council bulletins.', 4, false),
    ('bulletin', 'Student Organization', 'student-organization', 'Student organization updates.', 5, false),
    ('bulletin', 'Events', 'events', 'Event bulletins and schedules.', 6, false),
    ('stories', 'Stories', 'stories', 'Standalone story content.', 1, true)
) as x(section_key, title, slug, description, sort_order, accepts_submissions)
  on s.key = x.section_key
on conflict (section_id, slug) do update
set
  title = excluded.title,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_assignable = excluded.is_assignable,
  accepts_submissions = excluded.accepts_submissions,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());

insert into public.department_contacts (section_id, name, email, sort_order, is_public)
select s.id, x.name, x.email, x.sort_order, true
from (
  values
    (null::text, 'Editorial Team', 'editor@amaranth.vsu.edu.ph', 1),
    ('news', 'News Department', 'news@amaranth.vsu.edu.ph', 2),
    ('sports', 'Sports Department', 'sports@amaranth.vsu.edu.ph', 3),
    ('feature', 'Features Department', 'features@amaranth.vsu.edu.ph', 4),
    ('views', 'Opinion Department', 'opinion@amaranth.vsu.edu.ph', 5),
    (null::text, 'Technical Support', 'tech@amaranth.vsu.edu.ph', 6)
) as x(section_key, name, email, sort_order)
left join public.sections s on s.key = x.section_key
on conflict do nothing;

insert into public.site_settings (key, value, is_public)
values
  (
    'contact_overview',
    jsonb_build_object(
      'office_address', jsonb_build_array(
        'Amaranth Publication Office',
        'Student Center Building',
        'Visayas State University',
        'Baybay City, Leyte 6521-A',
        'Philippines'
      ),
      'phones', jsonb_build_array('+63 53 335 2601', '+63 53 335 2602 (Fax)'),
      'emails', jsonb_build_array('amaranth@vsu.edu.ph', 'editor@amaranth.vsu.edu.ph', 'news@amaranth.vsu.edu.ph'),
      'office_hours', jsonb_build_array(
        'Monday - Friday: 8:00 AM - 5:00 PM',
        'Saturday: 8:00 AM - 12:00 PM',
        'Sunday: Closed'
      )
    ),
    true
  ),
  (
    'social_links',
    jsonb_build_array(
      jsonb_build_object('platform', 'facebook', 'label', 'Facebook', 'url', 'https://www.facebook.com/amaranthvsu'),
      jsonb_build_object('platform', 'tiktok', 'label', 'TikTok', 'url', 'https://www.tiktok.com/@amaranthvsu'),
      jsonb_build_object('platform', 'instagram', 'label', 'Instagram', 'url', 'https://www.instagram.com/amaranthvsu'),
      jsonb_build_object('platform', 'youtube', 'label', 'YouTube', 'url', 'https://www.youtube.com/@amaranthvsu')
    ),
    true
  )
on conflict (key) do update
set
  value = excluded.value,
  is_public = excluded.is_public,
  updated_at = timezone('utc', now());

create or replace view public.article_public_view
with (security_invoker = true)
as
select
  a.id,
  a.slug,
  a.title,
  a.subtitle,
  a.excerpt,
  a.body_html,
  a.contents,
  a.status,
  a.editorial_priority,
  a.allow_comments,
  a.meta,
  a.published_date,
  a.created_at,
  a.updated_at,
  s.id as section_id,
  s.key as section_key,
  s.name as section_name,
  c.id as category_id,
  c.slug as category_slug,
  c.title as category_name,
  case
    when c.title = s.name then c.title
    else s.name || ' - ' || c.title
  end as category_title,
  coalesce(nullif(a.author_name, ''), primary_author.display_name, 'Amaranth Staff') as author_name,
  primary_author.slug as author_slug,
  coalesce(ma.public_url, a.image_url) as image_url,
  ma.alt_text as image_alt,
  a.issue_id,
  i.title as issue_title
from public.articles a
join public.categories c on c.id = a.category_id
join public.sections s on s.id = c.section_id
left join public.publication_issues i on i.id = a.issue_id
left join public.media_assets ma on ma.id = a.cover_asset_id
left join lateral (
  select ctr.display_name, ctr.slug
  from public.article_authors aa
  join public.contributors ctr on ctr.id = aa.contributor_id
  where aa.article_id = a.id
  order by aa.is_primary desc, aa.display_order asc, ctr.display_name asc
  limit 1
) as primary_author on true;

create or replace view public.articles_legacy_view
with (security_invoker = true)
as
select
  apv.id,
  apv.title,
  apv.slug,
  apv.contents,
  apv.excerpt,
  apv.category_title as category,
  apv.author_name,
  apv.published_date,
  apv.image_url,
  (apv.status = 'published') as publish,
  apv.created_at,
  apv.updated_at,
  apv.section_key,
  apv.section_name,
  apv.category_id,
  apv.category_name,
  apv.category_slug
from public.article_public_view apv;

create or replace view public.article_stats_view
with (security_invoker = true)
as
select
  adm.article_id,
  sum(adm.view_count)::bigint as total_views,
  sum(adm.unique_visitors)::bigint as total_unique_visitors,
  sum(adm.share_count)::bigint as total_shares,
  sum(adm.search_clicks)::bigint as total_search_clicks,
  max(adm.metric_date) as last_metric_date
from public.article_daily_metrics adm
group by adm.article_id;

create or replace view public.team_directory_view
with (security_invoker = true)
as
select
  tra.id,
  tt.id as term_id,
  tt.name as term_name,
  tt.start_date,
  tt.end_date,
  tt.is_current,
  tra.role_group,
  tra.role_title,
  tra.sort_order,
  c.id as contributor_id,
  c.display_name,
  c.slug,
  coalesce(tra.email_override, c.email::text) as email,
  coalesce(tra.bio_override, c.bio) as bio,
  coalesce(tra.academic_program, c.academic_program) as academic_program,
  coalesce(tra.year_level, c.year_level) as year_level,
  coalesce(tra.department, c.department) as department,
  image_asset.public_url as image_url
from public.team_role_assignments tra
join public.team_terms tt on tt.id = tra.term_id
join public.contributors c on c.id = tra.contributor_id
left join public.media_assets image_asset on image_asset.id = coalesce(tra.image_asset_id, c.avatar_asset_id)
where tra.is_public
  and tt.is_public;

create or replace function public.search_published_articles(search_text text, section_filter text default null, limit_count integer default 20)
returns table (
  article_id uuid,
  slug text,
  title text,
  excerpt text,
  section_key text,
  category_title text,
  author_name text,
  published_date timestamptz,
  image_url text,
  rank real
)
language sql
stable
security definer
set search_path = public
as $$
  select
    apv.id as article_id,
    apv.slug,
    apv.title,
    apv.excerpt,
    apv.section_key,
    apv.category_title,
    apv.author_name,
    apv.published_date,
    apv.image_url,
    ts_rank(
      a.search_document,
      websearch_to_tsquery('simple', coalesce(nullif(search_text, ''), apv.title))
    ) as rank
  from public.articles a
  join public.article_public_view apv on apv.id = a.id
  where a.status = 'published'
    and coalesce(a.published_at, timezone('utc', now())) <= timezone('utc', now())
    and (
      section_filter is null
      or apv.section_key = section_filter
    )
    and (
      nullif(search_text, '') is null
      or a.search_document @@ websearch_to_tsquery('simple', search_text)
    )
  order by rank desc, apv.published_date desc nulls last
  limit greatest(coalesce(limit_count, 20), 1);
$$;

alter table public.profiles enable row level security;
alter table public.sections enable row level security;
alter table public.categories enable row level security;
alter table public.media_assets enable row level security;
alter table public.contributors enable row level security;
alter table public.tags enable row level security;
alter table public.publication_issues enable row level security;
alter table public.articles enable row level security;
alter table public.article_authors enable row level security;
alter table public.article_tags enable row level security;
alter table public.article_media enable row level security;
alter table public.article_daily_metrics enable row level security;
alter table public.contact_messages enable row level security;
alter table public.article_submissions enable row level security;
alter table public.submission_assets enable row level security;
alter table public.event_reports enable row level security;
alter table public.event_report_assets enable row level security;
alter table public.team_terms enable row level security;
alter table public.team_role_assignments enable row level security;
alter table public.department_contacts enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "profiles read own or editorial" on public.profiles;
create policy "profiles read own or editorial"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.can_manage_all_articles());

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.can_admin_site())
with check (id = auth.uid() or public.can_admin_site());

drop policy if exists "sections public read" on public.sections;
create policy "sections public read"
on public.sections
for select
to anon, authenticated
using (true);

drop policy if exists "sections editorial manage" on public.sections;
create policy "sections editorial manage"
on public.sections
for all
to authenticated
using (public.can_admin_site())
with check (public.can_admin_site());

drop policy if exists "categories public read" on public.categories;
create policy "categories public read"
on public.categories
for select
to anon, authenticated
using (is_active);

drop policy if exists "categories editorial manage" on public.categories;
create policy "categories editorial manage"
on public.categories
for all
to authenticated
using (public.can_manage_all_articles())
with check (public.can_manage_all_articles());

drop policy if exists "media public read" on public.media_assets;
create policy "media public read"
on public.media_assets
for select
to anon, authenticated
using (is_public);

drop policy if exists "media staff manage" on public.media_assets;
create policy "media staff manage"
on public.media_assets
for all
to authenticated
using (public.can_write_articles() or uploaded_by = auth.uid())
with check (public.can_write_articles() or uploaded_by = auth.uid());

drop policy if exists "contributors public read" on public.contributors;
create policy "contributors public read"
on public.contributors
for select
to anon, authenticated
using (
  (is_public and is_active)
  or exists (
    select 1
    from public.article_authors aa
    join public.articles a on a.id = aa.article_id
    where aa.contributor_id = contributors.id
      and a.status = 'published'
      and coalesce(a.published_at, timezone('utc', now())) <= timezone('utc', now())
  )
);

drop policy if exists "contributors update own or editorial" on public.contributors;
create policy "contributors update own or editorial"
on public.contributors
for all
to authenticated
using (profile_id = auth.uid() or public.can_manage_all_articles())
with check (profile_id = auth.uid() or public.can_manage_all_articles());

drop policy if exists "tags public read" on public.tags;
create policy "tags public read"
on public.tags
for select
to anon, authenticated
using (true);

drop policy if exists "tags editorial manage" on public.tags;
create policy "tags editorial manage"
on public.tags
for all
to authenticated
using (public.can_manage_all_articles())
with check (public.can_manage_all_articles());

drop policy if exists "issues public read published" on public.publication_issues;
create policy "issues public read published"
on public.publication_issues
for select
to anon, authenticated
using (is_published);

drop policy if exists "issues editorial manage" on public.publication_issues;
create policy "issues editorial manage"
on public.publication_issues
for all
to authenticated
using (public.can_manage_all_articles())
with check (public.can_manage_all_articles());

drop policy if exists "articles public published read" on public.articles;
create policy "articles public published read"
on public.articles
for select
to anon, authenticated
using (
  status = 'published'
  and coalesce(published_at, timezone('utc', now())) <= timezone('utc', now())
);

drop policy if exists "articles owner or editorial read" on public.articles;
create policy "articles owner or editorial read"
on public.articles
for select
to authenticated
using (public.can_manage_all_articles() or public.is_article_owner(id));

drop policy if exists "articles writers insert" on public.articles;
create policy "articles writers insert"
on public.articles
for insert
to authenticated
with check (
  public.can_write_articles()
  and (
    public.current_user_role() <> 'staff_writer'
    or (
      created_by = auth.uid()
      and status in ('draft', 'submitted', 'in_review')
    )
  )
);

drop policy if exists "articles editorial manage all" on public.articles;
create policy "articles editorial manage all"
on public.articles
for update
to authenticated
using (public.can_manage_all_articles())
with check (public.can_manage_all_articles());

drop policy if exists "articles writers manage own" on public.articles;
create policy "articles writers manage own"
on public.articles
for update
to authenticated
using (public.is_article_owner(id))
with check (
  public.is_article_owner(id)
  and (
    public.current_user_role() <> 'staff_writer'
    or status in ('draft', 'submitted', 'in_review')
  )
);

drop policy if exists "articles editorial delete" on public.articles;
create policy "articles editorial delete"
on public.articles
for delete
to authenticated
using (public.can_manage_all_articles());

drop policy if exists "article_authors public read published" on public.article_authors;
create policy "article_authors public read published"
on public.article_authors
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.articles a
    where a.id = article_authors.article_id
      and a.status = 'published'
      and coalesce(a.published_at, timezone('utc', now())) <= timezone('utc', now())
  )
);

drop policy if exists "article_authors owner or editorial manage" on public.article_authors;
create policy "article_authors owner or editorial manage"
on public.article_authors
for all
to authenticated
using (public.can_manage_all_articles() or public.is_article_owner(article_id))
with check (public.can_manage_all_articles() or public.is_article_owner(article_id));

drop policy if exists "article_tags public read published" on public.article_tags;
create policy "article_tags public read published"
on public.article_tags
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.articles a
    where a.id = article_tags.article_id
      and a.status = 'published'
      and coalesce(a.published_at, timezone('utc', now())) <= timezone('utc', now())
  )
);

drop policy if exists "article_tags owner or editorial manage" on public.article_tags;
create policy "article_tags owner or editorial manage"
on public.article_tags
for all
to authenticated
using (public.can_manage_all_articles() or public.is_article_owner(article_id))
with check (public.can_manage_all_articles() or public.is_article_owner(article_id));

drop policy if exists "article_media public read published" on public.article_media;
create policy "article_media public read published"
on public.article_media
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.articles a
    where a.id = article_media.article_id
      and a.status = 'published'
      and coalesce(a.published_at, timezone('utc', now())) <= timezone('utc', now())
  )
);

drop policy if exists "article_media owner or editorial manage" on public.article_media;
create policy "article_media owner or editorial manage"
on public.article_media
for all
to authenticated
using (public.can_manage_all_articles() or public.is_article_owner(article_id))
with check (public.can_manage_all_articles() or public.is_article_owner(article_id));

drop policy if exists "article metrics public read" on public.article_daily_metrics;
create policy "article metrics public read"
on public.article_daily_metrics
for select
to anon, authenticated
using (true);

drop policy if exists "article metrics editorial manage" on public.article_daily_metrics;
create policy "article metrics editorial manage"
on public.article_daily_metrics
for all
to authenticated
using (public.can_manage_all_articles())
with check (public.can_manage_all_articles());

drop policy if exists "contact messages public insert" on public.contact_messages;
create policy "contact messages public insert"
on public.contact_messages
for insert
to anon, authenticated
with check (true);

drop policy if exists "contact messages editorial read manage" on public.contact_messages;
create policy "contact messages editorial read manage"
on public.contact_messages
for all
to authenticated
using (public.can_manage_all_articles())
with check (public.can_manage_all_articles());

drop policy if exists "article submissions public insert" on public.article_submissions;
create policy "article submissions public insert"
on public.article_submissions
for insert
to anon, authenticated
with check (true);

drop policy if exists "article submissions editorial manage" on public.article_submissions;
create policy "article submissions editorial manage"
on public.article_submissions
for all
to authenticated
using (public.can_manage_all_articles())
with check (public.can_manage_all_articles());

drop policy if exists "submission assets editorial manage" on public.submission_assets;
create policy "submission assets editorial manage"
on public.submission_assets
for all
to authenticated
using (public.can_manage_all_articles())
with check (public.can_manage_all_articles());

drop policy if exists "event reports public insert" on public.event_reports;
create policy "event reports public insert"
on public.event_reports
for insert
to anon, authenticated
with check (true);

drop policy if exists "event reports editorial manage" on public.event_reports;
create policy "event reports editorial manage"
on public.event_reports
for all
to authenticated
using (public.can_manage_all_articles())
with check (public.can_manage_all_articles());

drop policy if exists "event report assets editorial manage" on public.event_report_assets;
create policy "event report assets editorial manage"
on public.event_report_assets
for all
to authenticated
using (public.can_manage_all_articles())
with check (public.can_manage_all_articles());

drop policy if exists "team terms public read" on public.team_terms;
create policy "team terms public read"
on public.team_terms
for select
to anon, authenticated
using (is_public);

drop policy if exists "team terms editorial manage" on public.team_terms;
create policy "team terms editorial manage"
on public.team_terms
for all
to authenticated
using (public.can_admin_site())
with check (public.can_admin_site());

drop policy if exists "team roles public read" on public.team_role_assignments;
create policy "team roles public read"
on public.team_role_assignments
for select
to anon, authenticated
using (is_public);

drop policy if exists "team roles editorial manage" on public.team_role_assignments;
create policy "team roles editorial manage"
on public.team_role_assignments
for all
to authenticated
using (public.can_admin_site())
with check (public.can_admin_site());

drop policy if exists "department contacts public read" on public.department_contacts;
create policy "department contacts public read"
on public.department_contacts
for select
to anon, authenticated
using (is_public);

drop policy if exists "department contacts editorial manage" on public.department_contacts;
create policy "department contacts editorial manage"
on public.department_contacts
for all
to authenticated
using (public.can_admin_site())
with check (public.can_admin_site());

drop policy if exists "site settings public read" on public.site_settings;
create policy "site settings public read"
on public.site_settings
for select
to anon, authenticated
using (is_public);

drop policy if exists "site settings editorial manage" on public.site_settings;
create policy "site settings editorial manage"
on public.site_settings
for all
to authenticated
using (public.can_admin_site())
with check (public.can_admin_site());

insert into storage.buckets (id, name, public)
values
  ('public-media', 'public-media', true),
  ('archives', 'archives', true),
  ('intake-files', 'intake-files', false)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "storage public read" on storage.objects;
create policy "storage public read"
on storage.objects
for select
to anon, authenticated
using (bucket_id in ('public-media', 'archives'));

drop policy if exists "storage editorial manage" on storage.objects;
create policy "storage editorial manage"
on storage.objects
for all
to authenticated
using (public.can_write_articles())
with check (public.can_write_articles());

commit;
