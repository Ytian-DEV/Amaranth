-- =============================================================================
-- AMARANTH v2 — database schema (fresh install)
--
-- Paste order on a new / emptied Supabase project:
--   1. supabase/v2/schema.sql   (this file)
--   2. supabase/v2/seed.sql     (sections, categories, settings)
-- Both files are re-runnable: running them twice changes nothing.
--
-- Layout
--   public.*  tables, views and the RPCs the app calls (exposed by PostgREST)
--   app.*     private helpers used by RLS and triggers (not exposed)
--
-- Roles (public.app_role)
--   super_admin      everything, incl. granting super_admin
--   editor_in_chief  publish, manage staff, settings
--   managing_editor  publish, manage content and intake
--   section_editor   review/edit articles in their assigned sections
--   staff_writer     write own drafts, submit for review
--   contributor      same as staff_writer (external / occasional staff)
-- Readers do not have accounts.
-- =============================================================================

begin;

create schema if not exists app;
revoke all on schema app from public;
grant usage on schema app to anon, authenticated, service_role;
do $$
begin
  -- Supabase Auth inserts into auth.users and fires app.handle_new_user()
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant usage on schema app to supabase_auth_admin;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$
begin
  create type public.app_role as enum (
    'super_admin', 'editor_in_chief', 'managing_editor',
    'section_editor', 'staff_writer', 'contributor'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.article_status as enum (
    'draft', 'submitted', 'in_review', 'scheduled', 'published', 'archived', 'rejected'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.nav_placement as enum ('primary', 'more', 'hidden');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.contributor_type as enum ('staff', 'student', 'guest', 'faculty', 'alumni');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.asset_kind as enum ('image', 'document', 'audio', 'video');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.article_media_usage as enum ('inline', 'gallery', 'attachment');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.revision_kind as enum ('autosave', 'manual', 'status');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.comment_status as enum ('pending', 'approved', 'rejected', 'spam');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.intake_status as enum ('submitted', 'reviewing', 'accepted', 'declined', 'converted');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.contact_category as enum ('general', 'editorial', 'submission', 'technical', 'advertising', 'feedback');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.contact_status as enum ('unread', 'in_progress', 'resolved', 'spam');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.issue_type as enum ('regular', 'special', 'graduation', 'annual', 'commemorative');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.team_role_group as enum ('adviser', 'editorial_board', 'section_head', 'staff');
exception when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- Generic helpers
-- -----------------------------------------------------------------------------
create or replace function app.slugify(input text)
returns text
language sql
immutable
set search_path = ''
as $$
  select left(
    trim(both '-' from regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g')),
    80
  );
$$;

create or replace function app.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- People
-- -----------------------------------------------------------------------------
-- Business Manager (added 2026-10): may publish and schedule articles, nothing more.
-- Compared as text below so this file can add the value and use it in one run.
alter type public.app_role add value if not exists 'business_manager' after 'managing_editor';

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  avatar_url text,
  bio text,
  role public.app_role not null default 'contributor',
  is_active boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_email_key on public.profiles (lower(email));
-- Publishing access granted to one person by the Super admin, Executive Editor or Managing editor
alter table public.profiles add column if not exists can_publish boolean not null default false;

-- Pre-authorised staff: a new auth user whose email is here gets this role and
-- is activated. Anyone else who signs up gets an inactive profile (no access).
create table if not exists public.staff_invites (
  email text primary key check (email = lower(email)),
  role public.app_role not null default 'staff_writer',
  section_slugs text[] not null default '{}',
  invited_by uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Taxonomy
-- -----------------------------------------------------------------------------
create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  description text,
  nav_placement public.nav_placement not null default 'primary',
  nav_order integer not null default 0,
  accepts_submissions boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Which sections a section_editor looks after.
create table if not exists public.profile_sections (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  section_id uuid not null references public.sections (id) on delete cascade,
  primary key (profile_id, section_id)
);
create index if not exists profile_sections_section_idx on public.profile_sections (section_id);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections (id) on delete restrict,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  -- writers may file into this category (editorials are editors-only, etc.)
  is_assignable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section_id, slug)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Media
-- -----------------------------------------------------------------------------
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'media' check (bucket in ('media', 'archives')),
  path text not null,
  kind public.asset_kind not null default 'image',
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  alt_text text not null default '',
  caption text,
  credit text,
  -- resized copies for srcset: [{"width": 640, "path": "..."}]
  variants jsonb not null default '[]'::jsonb check (jsonb_typeof(variants) = 'array'),
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket, path)
);
create index if not exists media_assets_created_idx on public.media_assets (created_at desc);
create index if not exists media_assets_uploaded_by_idx on public.media_assets (uploaded_by);

-- -----------------------------------------------------------------------------
-- Contributors (public bylines; may or may not be staff accounts)
-- -----------------------------------------------------------------------------
create table if not exists public.contributors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  type public.contributor_type not null default 'staff',
  position text,
  program text,
  bio text,
  avatar_asset_id uuid references public.media_assets (id) on delete set null,
  is_public boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Print issues (archives)
-- -----------------------------------------------------------------------------
create table if not exists public.publication_issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  volume integer check (volume is null or volume > 0),
  issue_number integer check (issue_number is null or issue_number > 0),
  issue_type public.issue_type not null default 'regular',
  issue_date date not null,
  description text,
  cover_asset_id uuid references public.media_assets (id) on delete set null,
  pdf_asset_id uuid references public.media_assets (id) on delete set null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists publication_issues_date_idx on public.publication_issues (issue_date desc);

-- -----------------------------------------------------------------------------
-- Articles
-- -----------------------------------------------------------------------------
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections (id) on delete restrict, -- derived from category
  category_id uuid not null references public.categories (id) on delete restrict,
  issue_id uuid references public.publication_issues (id) on delete set null,
  issue_position integer check (issue_position is null or issue_position > 0),
  title text not null check (length(btrim(title)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kicker text,                 -- optional label next to the section, e.g. "Environment"
  dek text,                    -- subtitle / standfirst
  excerpt text not null default '',
  body_json jsonb,             -- editor document
  body_html text not null default '',
  body_text text not null default '',
  reading_minutes integer not null default 1,
  cover_asset_id uuid references public.media_assets (id) on delete restrict,
  cover_caption text,
  byline_override text,        -- e.g. "By Sports Desk"; otherwise built from article_authors
  status public.article_status not null default 'draft',
  is_featured boolean not null default false,
  editorial_priority smallint not null default 0 check (editorial_priority between 0 and 100),
  allow_comments boolean not null default true,
  seo_title text,
  seo_description text,
  og_image_asset_id uuid references public.media_assets (id) on delete restrict,
  submitted_at timestamptz,
  scheduled_for timestamptz,
  -- public timestamp; for scheduled articles it equals scheduled_for, so the
  -- article goes live by itself when that time passes (no cron required)
  published_at timestamptz,
  archived_at timestamptz,
  view_count bigint not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('simple'::regconfig, coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple'::regconfig, coalesce(dek, '') || ' ' || coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('simple'::regconfig, coalesce(body_text, '')), 'C')
  ) stored,
  constraint articles_scheduled_needs_time check (status <> 'scheduled' or scheduled_for is not null),
  constraint articles_published_needs_time check (status not in ('published', 'scheduled') or published_at is not null)
);

-- public listings: only live rows, newest first
create index if not exists articles_live_idx
  on public.articles (published_at desc) where status in ('published', 'scheduled');
create index if not exists articles_live_section_idx
  on public.articles (section_id, published_at desc) where status in ('published', 'scheduled');
create index if not exists articles_live_category_idx
  on public.articles (category_id, published_at desc) where status in ('published', 'scheduled');
create index if not exists articles_featured_idx
  on public.articles (published_at desc) where is_featured;
create index if not exists articles_issue_idx
  on public.articles (issue_id, issue_position) where issue_id is not null;
-- CMS: queues and "my drafts"
create index if not exists articles_status_updated_idx on public.articles (status, updated_at desc);
create index if not exists articles_created_by_idx on public.articles (created_by, updated_at desc);
-- media usage checks (FK restrict + "unused" filter)
create index if not exists articles_cover_idx on public.articles (cover_asset_id) where cover_asset_id is not null;
create index if not exists articles_og_image_idx on public.articles (og_image_asset_id) where og_image_asset_id is not null;
create index if not exists articles_search_idx on public.articles using gin (search);

create table if not exists public.article_authors (
  article_id uuid not null references public.articles (id) on delete cascade,
  contributor_id uuid not null references public.contributors (id) on delete restrict,
  credit_label text not null default 'Author',
  position smallint not null default 1 check (position > 0),
  primary key (article_id, contributor_id)
);
create index if not exists article_authors_contributor_idx on public.article_authors (contributor_id);

create table if not exists public.article_tags (
  article_id uuid not null references public.articles (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (article_id, tag_id)
);
create index if not exists article_tags_tag_idx on public.article_tags (tag_id);

create table if not exists public.article_media (
  article_id uuid not null references public.articles (id) on delete cascade,
  asset_id uuid not null references public.media_assets (id) on delete restrict,
  usage public.article_media_usage not null default 'inline',
  position smallint not null default 1,
  caption text,
  primary key (article_id, asset_id, usage)
);
create index if not exists article_media_asset_idx on public.article_media (asset_id);

create table if not exists public.article_revisions (
  id bigint generated always as identity primary key,
  article_id uuid not null references public.articles (id) on delete cascade,
  kind public.revision_kind not null default 'manual',
  title text not null,
  body_json jsonb,
  body_html text not null default '',
  saved_by uuid references public.profiles (id) on delete set null, -- audit only, unindexed
  created_at timestamptz not null default now()
);
create index if not exists article_revisions_article_idx on public.article_revisions (article_id, created_at desc);

-- Workflow history and review notes
create table if not exists public.article_activity (
  id bigint generated always as identity primary key,
  article_id uuid not null references public.articles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null, -- audit only, unindexed
  action text not null check (action in ('created', 'status', 'note')),
  from_status public.article_status,
  to_status public.article_status,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists article_activity_article_idx on public.article_activity (article_id, created_at desc);
create index if not exists article_activity_created_idx on public.article_activity (created_at desc);

create table if not exists public.article_daily_views (
  article_id uuid not null references public.articles (id) on delete cascade,
  day date not null,
  views integer not null default 0,
  primary key (article_id, day)
);
create index if not exists article_daily_views_day_idx on public.article_daily_views (day, article_id);

create table if not exists public.article_comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  parent_id uuid references public.article_comments (id) on delete cascade,
  author_name text not null check (length(btrim(author_name)) between 1 and 80),
  body text not null check (length(btrim(body)) between 2 and 3000),
  status public.comment_status not null default 'pending',
  moderated_by uuid references public.profiles (id) on delete set null, -- audit only, unindexed
  moderated_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists article_comments_article_idx on public.article_comments (article_id, status, created_at);
create index if not exists article_comments_status_idx on public.article_comments (status, created_at desc);
create index if not exists article_comments_parent_idx on public.article_comments (parent_id) where parent_id is not null;

-- Commenter e-mail is kept apart so public reads can never expose it.
create table if not exists public.article_comment_private (
  comment_id uuid primary key references public.article_comments (id) on delete cascade,
  author_email text not null
);

-- Homepage curation: lead story and literary folio pick
create table if not exists public.home_slots (
  slot text primary key check (slot in ('lead', 'folio')),
  article_id uuid references public.articles (id) on delete set null,
  pull_quote text,
  attribution text,
  updated_by uuid references public.profiles (id) on delete set null, -- audit only
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Intake: submissions, event reports, contact
-- -----------------------------------------------------------------------------
create table if not exists public.article_submissions (
  id uuid primary key default gen_random_uuid(),
  submitter_name text not null,
  submitter_email text not null,
  submitter_affiliation text,
  section_id uuid references public.sections (id) on delete set null,
  title text not null,
  summary text,
  body text,
  status public.intake_status not null default 'submitted',
  reviewer_id uuid references public.profiles (id) on delete set null, -- audit only
  review_note text,
  reviewed_at timestamptz,
  converted_article_id uuid unique references public.articles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists article_submissions_status_idx on public.article_submissions (status, created_at desc);

create table if not exists public.event_reports (
  id uuid primary key default gen_random_uuid(),
  organization text not null,
  contact_name text not null,
  contact_email text not null,
  event_title text not null,
  event_date date,
  venue text,
  summary text not null,
  status public.intake_status not null default 'submitted',
  reviewer_id uuid references public.profiles (id) on delete set null, -- audit only
  review_note text,
  reviewed_at timestamptz,
  converted_article_id uuid unique references public.articles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists event_reports_status_idx on public.event_reports (status, created_at desc);

-- Files uploaded with a submission or event report (private "intake" bucket)
create table if not exists public.intake_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.article_submissions (id) on delete cascade,
  event_report_id uuid references public.event_reports (id) on delete cascade,
  path text not null unique,
  file_name text not null,
  mime_type text,
  size_bytes integer,
  created_at timestamptz not null default now(),
  constraint intake_files_one_parent check (num_nonnulls(submission_id, event_report_id) = 1)
);
create index if not exists intake_files_submission_idx on public.intake_files (submission_id) where submission_id is not null;
create index if not exists intake_files_event_idx on public.intake_files (event_report_id) where event_report_id is not null;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  category public.contact_category not null default 'general',
  message text not null,
  status public.contact_status not null default 'unread',
  handled_by uuid references public.profiles (id) on delete set null, -- audit only
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contact_messages_status_idx on public.contact_messages (status, created_at desc);

-- -----------------------------------------------------------------------------
-- Editorial board / team
-- -----------------------------------------------------------------------------
create table if not exists public.team_terms (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,           -- e.g. "2026–2027"
  starts_on date not null,
  ends_on date,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists team_terms_one_current on public.team_terms (is_current) where is_current;

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.team_terms (id) on delete cascade,
  role_group public.team_role_group not null,
  position_title text not null,
  contributor_id uuid references public.contributors (id) on delete set null,
  display_name text,
  photo_asset_id uuid references public.media_assets (id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_members_named check (contributor_id is not null or display_name is not null)
);
create index if not exists team_members_term_idx on public.team_members (term_id, role_group, sort_order);
create index if not exists team_members_contributor_idx on public.team_members (contributor_id) where contributor_id is not null;

create table if not exists public.department_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  email text,
  phone text,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  value jsonb not null,
  is_public boolean not null default false,
  updated_by uuid references public.profiles (id) on delete set null, -- audit only
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null, -- audit only, unindexed
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);

-- Rate limiting for the public RPCs (private)
create table if not exists app.rate_events (
  key text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_events_key_idx on app.rate_events (key, created_at desc);

-- -----------------------------------------------------------------------------
-- Permission helpers (security definer: they read profiles without RLS)
-- -----------------------------------------------------------------------------
create or replace function app.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid() and p.is_active;
$$;

create or replace function app.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.current_role() is not null;
$$;

create or replace function app.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app.current_role() in ('super_admin', 'editor_in_chief'), false);
$$;

create or replace function app.can_publish()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app.current_role() in ('super_admin', 'editor_in_chief', 'managing_editor'), false);
$$;

-- Publish / schedule articles: the three managing roles, the Business Manager, and anyone
-- given publishing access in Staff. (Front page, settings and the like stay app.can_publish.)
create or replace function app.can_publish_articles()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.can_publish()
    or coalesce((select p.role::text = 'business_manager' or p.can_publish
                 from public.profiles p where p.id = auth.uid() and p.is_active), false);
$$;

create or replace function app.is_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app.current_role() in ('super_admin', 'editor_in_chief', 'managing_editor', 'section_editor'), false);
$$;

create or replace function app.can_edit_section(p_section_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.can_publish()
    or (
      app.current_role() = 'section_editor'
      and exists (
        select 1 from public.profile_sections ps
        where ps.profile_id = auth.uid() and ps.section_id = p_section_id
      )
    );
$$;

create or replace function app.is_live(p_status public.article_status, p_published_at timestamptz)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_status in ('published', 'scheduled') and p_published_at is not null and p_published_at <= now();
$$;

create or replace function app.is_article_owner(p_article_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and (
    exists (select 1 from public.articles a where a.id = p_article_id and a.created_by = auth.uid())
    or exists (
      select 1
      from public.article_authors aa
      join public.contributors c on c.id = aa.contributor_id
      where aa.article_id = p_article_id and c.profile_id = auth.uid()
    )
  );
$$;

create or replace function app.article_is_live(p_article_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.articles a
    where a.id = p_article_id and app.is_live(a.status, a.published_at)
  );
$$;

create or replace function app.can_view_article(p_article_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.is_staff() and (
    app.is_article_owner(p_article_id)
    or exists (
      select 1 from public.articles a
      where a.id = p_article_id and app.can_edit_section(a.section_id)
    )
  );
$$;

-- Owners may change an article's parts only while it is a draft or rejected;
-- editors of its section may change it at any time.
create or replace function app.can_modify_article(p_article_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.is_staff() and exists (
    select 1 from public.articles a
    where a.id = p_article_id
      and (
        app.can_edit_section(a.section_id)
        or (a.status in ('draft', 'rejected') and app.is_article_owner(a.id))
      )
  );
$$;

create or replace function app.rate_limit(p_key text, p_max integer, p_window interval)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from app.rate_events where created_at < now() - interval '1 day';
  if (select count(*) from app.rate_events where key = p_key and created_at > now() - p_window) >= p_max then
    raise exception 'Too many requests. Please try again later.' using errcode = 'P0429';
  end if;
  insert into app.rate_events (key) values (p_key);
end;
$$;

create or replace function app.audit(p_action text, p_entity text, p_entity_id text, p_details jsonb default '{}'::jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (auth.uid(), p_action, p_entity, p_entity_id, coalesce(p_details, '{}'::jsonb));
$$;

-- -----------------------------------------------------------------------------
-- New auth user → profile (role only ever comes from staff_invites)
-- -----------------------------------------------------------------------------
create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.staff_invites%rowtype;
  v_email text := lower(coalesce(new.email, ''));
begin
  select * into v_invite from public.staff_invites where email = v_email;

  insert into public.profiles (id, email, display_name, role, is_active)
  values (
    new.id,
    v_email,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(v_email, '@', 1)),
    coalesce(v_invite.role, 'contributor'),
    v_invite.email is not null
  )
  on conflict (id) do nothing;

  if v_invite.email is not null then
    insert into public.profile_sections (profile_id, section_id)
    select new.id, s.id from public.sections s where s.slug = any (v_invite.section_slugs)
    on conflict do nothing;

    update public.staff_invites set accepted_at = now() where email = v_email;

    -- every staff member gets a public byline they can be credited with
    insert into public.contributors (profile_id, name, slug, type)
    values (
      new.id,
      coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(v_email, '@', 1)),
      coalesce(nullif(app.slugify(coalesce(new.raw_user_meta_data ->> 'display_name', split_part(v_email, '@', 1))), ''), 'staff')
        || '-' || left(new.id::text, 6),
      'staff'
    )
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function app.handle_new_user();

-- Role / activation changes are admin-only; only super_admin grants super_admin;
-- the last active super_admin can't be demoted or deactivated.
create or replace function app.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new; -- SQL editor / service role
  end if;

  if new.email is distinct from old.email or new.id is distinct from old.id then
    raise exception 'Email is managed by authentication.' using errcode = '42501';
  end if;

  if new.can_publish is distinct from old.can_publish and not app.can_publish() then
    raise exception 'Only the Super admin, Executive Editor or Managing editor can give publishing access.' using errcode = '42501';
  end if;

  if new.role is distinct from old.role or new.is_active is distinct from old.is_active then
    if not app.is_admin() then
      raise exception 'Only admins can change roles or access.' using errcode = '42501';
    end if;
    if (new.role = 'super_admin' or old.role = 'super_admin') and app.current_role() <> 'super_admin' then
      raise exception 'Only a super admin can grant or remove super admin.' using errcode = '42501';
    end if;
  end if;

  if old.role = 'super_admin' and old.is_active
     and (new.role <> 'super_admin' or not new.is_active)
     and not exists (
       select 1 from public.profiles p
       where p.role = 'super_admin' and p.is_active and p.id <> old.id
     ) then
    raise exception 'At least one active super admin is required.' using errcode = '42501';
  end if;

  if new.can_publish is distinct from old.can_publish then
    perform app.audit('profile.publish_access', 'profiles', new.id::text,
      jsonb_build_object('can_publish', jsonb_build_array(old.can_publish, new.can_publish)));
  end if;

  if new.role is distinct from old.role or new.is_active is distinct from old.is_active then
    perform app.audit('profile.access', 'profiles', new.id::text,
      jsonb_build_object('role', jsonb_build_array(old.role, new.role),
                         'is_active', jsonb_build_array(old.is_active, new.is_active)));
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
for each row execute function app.guard_profile_update();

-- -----------------------------------------------------------------------------
-- Article workflow
--   draft      → submitted (owner/editor) | scheduled, published (publisher)
--   submitted  → draft (owner withdraws / editor returns) | in_review | rejected (editor)
--                | scheduled, published (publisher)
--   in_review  → draft, rejected (editor) | scheduled, published (publisher)
--   scheduled  → published, draft (publisher)
--   published  → archived, draft (publisher)
--   archived   → published, draft (publisher)
--   rejected   → draft (owner/editor)
-- -----------------------------------------------------------------------------
create or replace function app.article_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_section uuid;
  v_assignable boolean;
  v_is_editor boolean;
  v_is_owner boolean;
  v_publisher boolean := app.can_publish_articles();
  v_base text;
  v_slug text;
  v_n integer := 1;
begin
  -- view counter bump from record_article_view(): nothing else may change
  if tg_op = 'UPDATE' and current_setting('app.counting_view', true) = 'on' then
    if (to_jsonb(new) - 'view_count' - 'search') is distinct from (to_jsonb(old) - 'view_count' - 'search') then
      raise exception 'Unexpected change while counting a view.' using errcode = '42501';
    end if;
    return new;
  end if;

  -- section always follows the category
  select c.section_id, c.is_assignable into v_section, v_assignable
  from public.categories c where c.id = new.category_id;
  if v_section is null then
    raise exception 'Unknown category.' using errcode = '23503';
  end if;
  new.section_id := v_section;

  -- slug: from title when empty, unique with a numeric suffix
  if new.slug is null or btrim(new.slug) = '' then
    v_base := nullif(app.slugify(new.title), '');
    v_base := coalesce(v_base, 'article');
    v_slug := v_base;
    while exists (select 1 from public.articles a where a.slug = v_slug and a.id <> new.id) loop
      v_n := v_n + 1;
      v_slug := v_base || '-' || v_n;
    end loop;
    new.slug := v_slug;
  else
    new.slug := app.slugify(new.slug);
  end if;

  new.reading_minutes := greatest(1, ceil(coalesce(array_length(regexp_split_to_array(btrim(new.body_text), '\s+'), 1), 0) / 220.0)::integer);
  new.updated_at := now();
  if v_uid is not null then
    new.updated_by := v_uid;
  end if;

  if tg_op = 'INSERT' then
    if v_uid is not null then
      new.created_by := v_uid;
    end if;
    new.view_count := 0;
  end if;

  -- service role / SQL editor: no workflow checks, but keep timestamps sane
  if v_uid is null then
    if new.status = 'published' and new.published_at is null then new.published_at := now(); end if;
    if new.status = 'scheduled' then new.published_at := new.scheduled_for; end if;
    return new;
  end if;

  v_is_editor := app.can_edit_section(v_section)
    and (tg_op = 'INSERT' or app.can_edit_section(old.section_id));

  if tg_op = 'INSERT' then
    v_is_owner := true;
    if not v_is_editor and not v_assignable then
      raise exception 'This category is reserved for editors.' using errcode = '42501';
    end if;
    if new.status not in ('draft', 'submitted') and not v_publisher then
      raise exception 'New articles start as drafts.' using errcode = '42501';
    end if;
  else
    v_is_owner := app.is_article_owner(old.id);
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.view_count := old.view_count;

    if not v_is_editor then
      if new.category_id is distinct from old.category_id and not v_assignable then
        raise exception 'This category is reserved for editors.' using errcode = '42501';
      end if;
      if old.status not in ('draft', 'rejected') and new.status = old.status then
        raise exception 'This article is locked while it is %.', old.status using errcode = '42501';
      end if;
      if new.is_featured is distinct from old.is_featured
         or new.editorial_priority is distinct from old.editorial_priority then
        raise exception 'Only editors can feature or prioritise articles.' using errcode = '42501';
      end if;
    end if;
  end if;

  -- status transition rules
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    declare
      v_from public.article_status := case when tg_op = 'INSERT' then null else old.status end;
      v_to public.article_status := new.status;
      v_ok boolean := false;
    begin
      if v_to in ('scheduled', 'published', 'archived') then
        v_ok := v_publisher;
      elsif v_to = 'draft' then
        v_ok := v_from is null
          or (v_from in ('submitted', 'rejected') and (v_is_owner or v_is_editor))
          or (v_from = 'in_review' and v_is_editor)
          or (v_from in ('scheduled', 'published', 'archived') and v_publisher);
      elsif v_to = 'submitted' then
        v_ok := v_from is null or (v_from in ('draft', 'rejected') and (v_is_owner or v_is_editor));
      elsif v_to = 'in_review' then
        v_ok := v_from in ('submitted') and v_is_editor;
      elsif v_to = 'rejected' then
        v_ok := v_from in ('submitted', 'in_review') and v_is_editor;
      end if;

      if not v_ok then
        raise exception 'You cannot move this article from % to %.', coalesce(v_from::text, 'new'), v_to
          using errcode = '42501';
      end if;
    end;

    case new.status
      when 'submitted' then
        new.submitted_at := now();
      when 'scheduled' then
        if new.scheduled_for is null or new.scheduled_for <= now() then
          raise exception 'Pick a future time to schedule.' using errcode = '22023';
        end if;
        new.published_at := new.scheduled_for;
      when 'published' then
        new.published_at := case
          when tg_op = 'UPDATE' and old.status = 'archived' then coalesce(old.published_at, now())
          else coalesce(case when new.published_at <= now() then new.published_at end, now())
        end;
        new.scheduled_for := null;
        new.archived_at := null;
      when 'archived' then
        new.archived_at := now();
      when 'draft' then
        new.published_at := case when tg_op = 'UPDATE' and old.status = 'archived' then old.published_at else null end;
        new.scheduled_for := null;
      else
        null;
    end case;
  elsif new.status = 'scheduled' and new.scheduled_for is distinct from old.scheduled_for then
    if not v_publisher then
      raise exception 'Only publishers can reschedule.' using errcode = '42501';
    end if;
    if new.scheduled_for is null or new.scheduled_for <= now() then
      raise exception 'Pick a future time to schedule.' using errcode = '22023';
    end if;
    new.published_at := new.scheduled_for;
  elsif new.published_at is distinct from old.published_at and not v_publisher then
    new.published_at := old.published_at;
  end if;

  return new;
end;
$$;

drop trigger if exists articles_before_write on public.articles;
create trigger articles_before_write before insert or update on public.articles
for each row execute function app.article_before_write();

create or replace function app.article_after_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_note text := nullif(current_setting('app.transition_note', true), '');
begin
  if tg_op = 'INSERT' then
    insert into public.article_activity (article_id, actor_id, action, to_status)
    values (new.id, auth.uid(), 'created', new.status);

    -- the creator is credited by default (and so counts as an owner)
    insert into public.article_authors (article_id, contributor_id)
    select new.id, c.id from public.contributors c where c.profile_id = new.created_by
    on conflict do nothing;
  elsif new.status is distinct from old.status then
    insert into public.article_activity (article_id, actor_id, action, from_status, to_status, note)
    values (new.id, auth.uid(), 'status', old.status, new.status, v_note);

    insert into public.article_revisions (article_id, kind, title, body_json, body_html, saved_by)
    values (new.id, 'status', new.title, new.body_json, new.body_html, auth.uid());
  end if;
  return null;
end;
$$;

drop trigger if exists articles_after_write on public.articles;
create trigger articles_after_write after insert or update on public.articles
for each row execute function app.article_after_write();

-- keep the newest 50 revisions per article
create or replace function app.prune_revisions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.article_revisions r
  where r.article_id = new.article_id
    and r.id not in (
      select r2.id from public.article_revisions r2
      where r2.article_id = new.article_id
      order by r2.created_at desc, r2.id desc
      limit 50
    );
  return null;
end;
$$;

drop trigger if exists article_revisions_prune on public.article_revisions;
create trigger article_revisions_prune after insert on public.article_revisions
for each row execute function app.prune_revisions();

-- flip due scheduled rows to published (optional: run from pg_cron; the public
-- site already shows them once published_at has passed)
create or replace function app.publish_due_articles()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.articles
  set status = 'published'
  where status = 'scheduled' and published_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'sections', 'categories', 'media_assets', 'contributors', 'publication_issues',
    'article_submissions', 'event_reports', 'contact_messages', 'team_terms', 'team_members',
    'department_contacts', 'site_settings', 'home_slots'
  ] loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function app.touch_updated_at()',
      t || '_touch', t
    );
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Views
-- -----------------------------------------------------------------------------
create or replace view public.article_cards
with (security_invoker = true)
as
select
  a.id,
  a.slug,
  a.title,
  a.kicker,
  a.dek,
  a.excerpt,
  a.status,
  a.is_featured,
  a.editorial_priority,
  a.reading_minutes,
  a.published_at,
  a.updated_at,
  a.view_count,
  a.section_id,
  s.slug as section_slug,
  s.name as section_name,
  a.category_id,
  c.slug as category_slug,
  c.name as category_name,
  a.cover_asset_id,
  m.bucket as cover_bucket,
  m.path as cover_path,
  m.alt_text as cover_alt,
  m.width as cover_width,
  m.height as cover_height,
  m.variants as cover_variants,
  coalesce(
    a.byline_override,
    (
      select string_agg(ct.name, ', ' order by aa.position, ct.name)
      from public.article_authors aa
      join public.contributors ct on ct.id = aa.contributor_id
      where aa.article_id = a.id
    )
  ) as byline,
  a.created_by
from public.articles a
join public.sections s on s.id = a.section_id
join public.categories c on c.id = a.category_id
left join public.media_assets m on m.id = a.cover_asset_id;

-- -----------------------------------------------------------------------------
-- RPCs: public
-- -----------------------------------------------------------------------------
create or replace function public.record_article_view(p_article_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app.article_is_live(p_article_id) then
    return;
  end if;

  insert into public.article_daily_views (article_id, day, views)
  values (p_article_id, (now() at time zone 'Asia/Manila')::date, 1)
  on conflict (article_id, day) do update set views = public.article_daily_views.views + 1;

  perform set_config('app.counting_view', 'on', true);
  update public.articles set view_count = view_count + 1 where id = p_article_id;
  perform set_config('app.counting_view', 'off', true);
end;
$$;

create or replace function public.most_read_articles(p_days integer default 7, p_limit integer default 5)
returns table (
  id uuid, slug text, title text, section_slug text, section_name text,
  category_name text, published_at timestamptz, views bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.slug, a.title, s.slug, s.name, c.name, a.published_at, sum(v.views)::bigint as views
  from public.article_daily_views v
  join public.articles a on a.id = v.article_id
  join public.sections s on s.id = a.section_id
  join public.categories c on c.id = a.category_id
  where v.day >= (now() at time zone 'Asia/Manila')::date - greatest(1, least(coalesce(p_days, 7), 365))
    and app.is_live(a.status, a.published_at)
  group by a.id, s.slug, s.name, c.name
  order by views desc, a.published_at desc
  limit greatest(1, least(coalesce(p_limit, 5), 20));
$$;

-- Full-text search over live articles (RLS applies: staff also see their drafts
-- unless p_live_only is true, which the public site always passes).
create or replace function public.search_articles(
  p_query text,
  p_section text default null,
  p_from date default null,
  p_to date default null,
  p_limit integer default 20,
  p_offset integer default 0,
  p_live_only boolean default true
)
returns table (
  id uuid, slug text, title text, excerpt text, section_slug text, section_name text,
  category_name text, published_at timestamptz, status public.article_status,
  cover_bucket text, cover_path text, cover_alt text, rank real, total_count bigint
)
language sql
stable
set search_path = ''
as $$
  with q as (
    select case when btrim(coalesce(p_query, '')) = '' then null
                else websearch_to_tsquery('simple'::regconfig, p_query) end as tsq
  ),
  hits as (
    select a.id, a.slug, a.title, a.excerpt, s.slug as section_slug, s.name as section_name,
           c.name as category_name, a.published_at, a.status,
           m.bucket, m.path, m.alt_text,
           case when q.tsq is null then 0 else ts_rank(a.search, q.tsq) end as rank
    from public.articles a
    cross join q
    join public.sections s on s.id = a.section_id
    join public.categories c on c.id = a.category_id
    left join public.media_assets m on m.id = a.cover_asset_id
    where (q.tsq is null or a.search @@ q.tsq)
      and (p_section is null or s.slug = p_section)
      and (p_from is null or a.published_at >= p_from)
      and (p_to is null or a.published_at < p_to + 1)
      and (not p_live_only or app.is_live(a.status, a.published_at))
  )
  select h.id, h.slug, h.title, h.excerpt, h.section_slug, h.section_name, h.category_name,
         h.published_at, h.status, h.bucket, h.path, h.alt_text, h.rank::real,
         count(*) over () as total_count
  from hits h
  order by h.rank desc, h.published_at desc nulls last
  limit greatest(1, least(coalesce(p_limit, 20), 50))
  offset greatest(0, coalesce(p_offset, 0));
$$;

-- Months that have live articles, newest first (archive browsing).
create or replace function public.archive_months()
returns table (month date, articles bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select date_trunc('month', a.published_at at time zone 'Asia/Manila')::date as month, count(*) as articles
  from public.articles a
  where app.is_live(a.status, a.published_at)
  group by 1
  order by 1 desc;
$$;

create or replace function app.check_email(p_email text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_email is null or p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(p_email) > 254 then
    raise exception 'Please enter a valid email address.' using errcode = '22023';
  end if;
  return lower(btrim(p_email));
end;
$$;

create or replace function app.check_text(p_value text, p_label text, p_min integer, p_max integer)
returns text
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_value is null or length(btrim(p_value)) < p_min or length(p_value) > p_max then
    raise exception '% must be between % and % characters.', p_label, p_min, p_max using errcode = '22023';
  end if;
  return btrim(p_value);
end;
$$;

-- p_website is a honeypot field: real visitors never fill it in.
create or replace function public.submit_comment(
  p_article_id uuid, p_name text, p_email text, p_body text,
  p_parent_id uuid default null, p_website text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := app.check_email(p_email);
  v_id uuid;
begin
  if nullif(p_website, '') is not null then
    return gen_random_uuid(); -- pretend success for bots
  end if;
  if not exists (
    select 1 from public.articles a
    where a.id = p_article_id and a.allow_comments and app.is_live(a.status, a.published_at)
  ) or coalesce((select (value ->> 'enabled')::boolean from public.site_settings where key = 'comments'), true) = false then
    raise exception 'Comments are closed for this article.' using errcode = '42501';
  end if;
  if p_parent_id is not null and not exists (
    select 1 from public.article_comments c
    where c.id = p_parent_id and c.article_id = p_article_id and c.status = 'approved'
  ) then
    raise exception 'You can only reply to a published comment.' using errcode = '22023';
  end if;

  perform app.rate_limit('comment:' || v_email, 5, interval '10 minutes');

  insert into public.article_comments (article_id, parent_id, author_name, body)
  values (p_article_id, p_parent_id,
          app.check_text(p_name, 'Name', 1, 80),
          app.check_text(p_body, 'Comment', 2, 3000))
  returning id into v_id;

  insert into public.article_comment_private (comment_id, author_email) values (v_id, v_email);
  return v_id;
end;
$$;

-- p_files: [{"path": "submissions/<uuid>/file.pdf", "name": "file.pdf", "mime": "...", "size": 123}]
-- Files must already be uploaded to the private "intake" bucket.
create or replace function app.attach_intake_files(p_files jsonb, p_prefix text, p_submission uuid, p_event uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  f jsonb;
begin
  if p_files is null or jsonb_typeof(p_files) <> 'array' then
    return;
  end if;
  if jsonb_array_length(p_files) > 10 then
    raise exception 'Attach at most 10 files.' using errcode = '22023';
  end if;
  for f in select * from jsonb_array_elements(p_files) loop
    if (f ->> 'path') is null or (f ->> 'path') not like p_prefix || '/%' then
      raise exception 'Invalid file path.' using errcode = '22023';
    end if;
    if not exists (select 1 from storage.objects o where o.bucket_id = 'intake' and o.name = f ->> 'path') then
      raise exception 'File % was not uploaded.', f ->> 'name' using errcode = '22023';
    end if;
    insert into public.intake_files (submission_id, event_report_id, path, file_name, mime_type, size_bytes)
    values (p_submission, p_event, f ->> 'path', coalesce(f ->> 'name', f ->> 'path'),
            f ->> 'mime', nullif(f ->> 'size', '')::integer);
  end loop;
end;
$$;

create or replace function public.submit_article(
  p_name text, p_email text, p_affiliation text, p_section_slug text,
  p_title text, p_summary text, p_body text,
  p_files jsonb default '[]'::jsonb, p_website text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := app.check_email(p_email);
  v_section uuid;
  v_id uuid;
begin
  if nullif(p_website, '') is not null then
    return gen_random_uuid();
  end if;
  perform app.rate_limit('submission:' || v_email, 3, interval '1 hour');

  select id into v_section from public.sections where slug = p_section_slug and accepts_submissions;

  if coalesce(length(btrim(p_body)), 0) < 50 and coalesce(jsonb_array_length(p_files), 0) = 0 then
    raise exception 'Paste your article or attach a file.' using errcode = '22023';
  end if;

  insert into public.article_submissions (
    submitter_name, submitter_email, submitter_affiliation, section_id, title, summary, body
  ) values (
    app.check_text(p_name, 'Name', 2, 120), v_email, nullif(btrim(p_affiliation), ''), v_section,
    app.check_text(p_title, 'Title', 3, 200), nullif(btrim(p_summary), ''), nullif(btrim(p_body), '')
  ) returning id into v_id;

  perform app.attach_intake_files(p_files, 'submissions', v_id, null);
  return v_id;
end;
$$;

create or replace function public.submit_event_report(
  p_organization text, p_contact_name text, p_contact_email text,
  p_event_title text, p_event_date date, p_venue text, p_summary text,
  p_files jsonb default '[]'::jsonb, p_website text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := app.check_email(p_contact_email);
  v_id uuid;
begin
  if nullif(p_website, '') is not null then
    return gen_random_uuid();
  end if;
  perform app.rate_limit('event:' || v_email, 3, interval '1 hour');

  insert into public.event_reports (
    organization, contact_name, contact_email, event_title, event_date, venue, summary
  ) values (
    app.check_text(p_organization, 'Organization', 2, 160),
    app.check_text(p_contact_name, 'Contact name', 2, 120),
    v_email,
    app.check_text(p_event_title, 'Event title', 3, 200),
    p_event_date,
    nullif(btrim(p_venue), ''),
    app.check_text(p_summary, 'Summary', 20, 10000)
  ) returning id into v_id;

  perform app.attach_intake_files(p_files, 'events', null, v_id);
  return v_id;
end;
$$;

create or replace function public.send_contact_message(
  p_name text, p_email text, p_subject text, p_category public.contact_category,
  p_message text, p_website text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := app.check_email(p_email);
  v_id uuid;
begin
  if nullif(p_website, '') is not null then
    return gen_random_uuid();
  end if;
  perform app.rate_limit('contact:' || v_email, 3, interval '10 minutes');

  insert into public.contact_messages (name, email, subject, category, message)
  values (
    app.check_text(p_name, 'Name', 2, 120), v_email,
    app.check_text(p_subject, 'Subject', 2, 200),
    coalesce(p_category, 'general'),
    app.check_text(p_message, 'Message', 10, 5000)
  ) returning id into v_id;
  return v_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- RPCs: staff (run as the caller, so RLS and the workflow trigger apply)
-- -----------------------------------------------------------------------------
create or replace function public.transition_article(
  p_article_id uuid,
  p_to public.article_status,
  p_note text default null,
  p_scheduled_for timestamptz default null
)
returns public.articles
language plpgsql
set search_path = ''
as $$
declare
  v_row public.articles;
begin
  perform set_config('app.transition_note', coalesce(p_note, ''), true);

  update public.articles
  set status = p_to,
      scheduled_for = case when p_to = 'scheduled' then p_scheduled_for else scheduled_for end
  where id = p_article_id
  returning * into v_row;

  perform set_config('app.transition_note', '', true);

  if v_row.id is null then
    raise exception 'Article not found or not editable.' using errcode = '42501';
  end if;
  return v_row;
end;
$$;

create or replace function public.add_article_note(p_article_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app.can_view_article(p_article_id) then
    raise exception 'Article not found.' using errcode = '42501';
  end if;
  insert into public.article_activity (article_id, actor_id, action, note)
  values (p_article_id, auth.uid(), 'note', app.check_text(p_note, 'Note', 1, 4000));
end;
$$;

-- Turn a public submission or event report into a draft article.
create or replace function public.convert_intake_to_article(
  p_kind text, p_intake_id uuid, p_category_id uuid
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_title text;
  v_body text;
  v_summary text;
  v_article uuid;
begin
  if not app.is_editor() then
    raise exception 'Only editors can convert submissions.' using errcode = '42501';
  end if;

  if p_kind = 'submission' then
    select title, coalesce(body, ''), summary into v_title, v_body, v_summary
    from public.article_submissions where id = p_intake_id and converted_article_id is null;
  elsif p_kind = 'event' then
    select event_title, summary, null into v_title, v_body, v_summary
    from public.event_reports where id = p_intake_id and converted_article_id is null;
  else
    raise exception 'Unknown intake kind %.', p_kind using errcode = '22023';
  end if;

  if v_title is null then
    raise exception 'Not found or already converted.' using errcode = '22023';
  end if;

  insert into public.articles (category_id, title, excerpt, body_text, body_html, status)
  values (
    p_category_id, v_title, coalesce(v_summary, left(v_body, 280)), v_body,
    (select string_agg('<p>' || replace(replace(replace(p, '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || '</p>', '')
     from regexp_split_to_table(v_body, '\n\s*\n') as p where btrim(p) <> ''),
    'draft'
  ) returning id into v_article;

  if p_kind = 'submission' then
    update public.article_submissions
    set status = 'converted', converted_article_id = v_article, reviewer_id = auth.uid(), reviewed_at = now()
    where id = p_intake_id;
  else
    update public.event_reports
    set status = 'converted', converted_article_id = v_article, reviewer_id = auth.uid(), reviewed_at = now()
    where id = p_intake_id;
  end if;

  return v_article;
end;
$$;

-- Staff → "Can publish": the three managing roles turn publishing access on or off.
create or replace function public.set_publish_access(p_profile_id uuid, p_allowed boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app.can_publish() then
    raise exception 'Only the Super admin, Executive Editor or Managing editor can give publishing access.' using errcode = '42501';
  end if;
  update public.profiles set can_publish = coalesce(p_allowed, false), updated_at = now() where id = p_profile_id;
  if not found then
    raise exception 'Unknown staff member.' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.set_publish_access(uuid, boolean) from public, anon;
grant execute on function public.set_publish_access(uuid, boolean) to authenticated;

create or replace function public.dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Asia/Manila')::date;
  v_month date := date_trunc('month', v_today)::date;
  v_prev date := (date_trunc('month', v_today) - interval '1 month')::date;
  v_mine boolean := not app.is_editor();
begin
  if not app.is_staff() then
    raise exception 'Staff only.' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'published', (select count(*) from public.articles where status = 'published'),
    'published_this_week', (select count(*) from public.articles where status = 'published' and published_at >= now() - interval '7 days'),
    'scheduled', (select count(*) from public.articles where status = 'scheduled'),
    'drafts', (select count(*) from public.articles where status = 'draft' and (not v_mine or created_by = auth.uid())),
    'in_review', (select count(*) from public.articles where status in ('submitted', 'in_review') and (not v_mine or created_by = auth.uid())),
    'pending_submissions', case when v_mine then null else
      (select count(*) from public.article_submissions where status in ('submitted', 'reviewing'))
      + (select count(*) from public.event_reports where status in ('submitted', 'reviewing')) end,
    'oldest_pending_at', case when v_mine then null else
      least(
        (select min(created_at) from public.article_submissions where status in ('submitted', 'reviewing')),
        (select min(created_at) from public.event_reports where status in ('submitted', 'reviewing'))
      ) end,
    'unread_messages', case when v_mine then null else
      (select count(*) from public.contact_messages where status = 'unread') end,
    'pending_comments', case when v_mine then null else
      (select count(*) from public.article_comments where status = 'pending') end,
    'views_this_month', (select coalesce(sum(views), 0) from public.article_daily_views where day >= v_month),
    'views_last_month', (select coalesce(sum(views), 0) from public.article_daily_views where day >= v_prev and day < v_month)
  );
end;
$$;

create or replace function public.media_usage(p_asset_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case when not app.is_staff() then 0 else (
    (select count(*) from public.articles where cover_asset_id = p_asset_id or og_image_asset_id = p_asset_id)
    + (select count(*) from public.article_media where asset_id = p_asset_id)
    + (select count(*) from public.contributors where avatar_asset_id = p_asset_id)
    + (select count(*) from public.publication_issues where cover_asset_id = p_asset_id or pdf_asset_id = p_asset_id)
    + (select count(*) from public.team_members where photo_asset_id = p_asset_id)
  )::integer end;
$$;

-- -----------------------------------------------------------------------------
-- Function privileges
-- -----------------------------------------------------------------------------
revoke execute on all functions in schema app from public;
grant execute on all functions in schema app to anon, authenticated, service_role;

revoke execute on function public.record_article_view(uuid) from public, anon, authenticated;
revoke execute on function public.most_read_articles(integer, integer) from public, anon, authenticated;
revoke execute on function public.archive_months() from public, anon, authenticated;
revoke execute on function public.search_articles(text, text, date, date, integer, integer, boolean) from public, anon, authenticated;
revoke execute on function public.submit_comment(uuid, text, text, text, uuid, text) from public, anon, authenticated;
revoke execute on function public.submit_article(text, text, text, text, text, text, text, jsonb, text) from public, anon, authenticated;
revoke execute on function public.submit_event_report(text, text, text, text, date, text, text, jsonb, text) from public, anon, authenticated;
revoke execute on function public.send_contact_message(text, text, text, public.contact_category, text, text) from public, anon, authenticated;
revoke execute on function public.transition_article(uuid, public.article_status, text, timestamptz) from public, anon, authenticated;
revoke execute on function public.add_article_note(uuid, text) from public, anon, authenticated;
revoke execute on function public.convert_intake_to_article(text, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.dashboard_stats() from public, anon, authenticated;
revoke execute on function public.media_usage(uuid) from public, anon, authenticated;

grant execute on function public.record_article_view(uuid) to anon, authenticated;
grant execute on function public.most_read_articles(integer, integer) to anon, authenticated;
grant execute on function public.archive_months() to anon, authenticated;
grant execute on function public.search_articles(text, text, date, date, integer, integer, boolean) to anon, authenticated;
grant execute on function public.submit_comment(uuid, text, text, text, uuid, text) to anon, authenticated;
grant execute on function public.submit_article(text, text, text, text, text, text, text, jsonb, text) to anon, authenticated;
grant execute on function public.submit_event_report(text, text, text, text, date, text, text, jsonb, text) to anon, authenticated;
grant execute on function public.send_contact_message(text, text, text, public.contact_category, text, text) to anon, authenticated;
grant execute on function public.transition_article(uuid, public.article_status, text, timestamptz) to authenticated;
grant execute on function public.add_article_note(uuid, text) to authenticated;
grant execute on function public.convert_intake_to_article(text, uuid, uuid) to authenticated;
grant execute on function public.dashboard_stats() to authenticated;
grant execute on function public.media_usage(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Row level security
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'staff_invites', 'sections', 'profile_sections', 'categories', 'tags', 'media_assets',
    'contributors', 'publication_issues', 'articles', 'article_authors', 'article_tags', 'article_media',
    'article_revisions', 'article_activity', 'article_daily_views', 'article_comments',
    'article_comment_private', 'home_slots', 'article_submissions', 'event_reports', 'intake_files',
    'contact_messages', 'team_terms', 'team_members', 'department_contacts', 'site_settings', 'audit_log'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
alter table app.rate_events enable row level security;

-- Drop every existing policy on our tables so this file can be re-run cleanly.
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename not like 'sk\_%' -- Salingkusog tables are owned by salingkusog.sql
      and tablename not like 'stats\_%' and tablename <> 'staff_activity_daily' -- owned by stats.sql
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or app.is_staff());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or app.is_admin()) with check (id = auth.uid() or app.is_admin());

-- staff_invites
create policy staff_invites_admin on public.staff_invites for all to authenticated
  using (app.is_admin()) with check (app.is_admin());

-- sections / categories / tags
create policy sections_read on public.sections for select to anon, authenticated using (true);
create policy sections_admin on public.sections for all to authenticated
  using (app.is_admin()) with check (app.is_admin());

create policy profile_sections_read on public.profile_sections for select to authenticated
  using (profile_id = auth.uid() or app.is_staff());
create policy profile_sections_admin on public.profile_sections for all to authenticated
  using (app.is_admin()) with check (app.is_admin());

create policy categories_read on public.categories for select to anon, authenticated
  using (is_active or app.is_staff());
create policy categories_admin on public.categories for all to authenticated
  using (app.is_admin()) with check (app.is_admin());

create policy tags_read on public.tags for select to anon, authenticated using (true);
create policy tags_insert on public.tags for insert to authenticated with check (app.is_staff());
create policy tags_editor_update on public.tags for update to authenticated
  using (app.is_editor()) with check (app.is_editor());
create policy tags_editor_delete on public.tags for delete to authenticated using (app.is_editor());

-- media_assets
create policy media_read on public.media_assets for select to anon, authenticated using (true);
create policy media_insert on public.media_assets for insert to authenticated
  with check (app.is_staff() and uploaded_by = auth.uid()
              and (bucket = 'media' or app.can_publish()));
create policy media_update on public.media_assets for update to authenticated
  using (uploaded_by = auth.uid() or app.is_editor())
  with check (app.is_staff());
create policy media_delete on public.media_assets for delete to authenticated
  using (uploaded_by = auth.uid() or app.is_editor());

-- contributors
create policy contributors_read on public.contributors for select to anon, authenticated
  using ((is_public and is_active) or app.is_staff());
create policy contributors_editor on public.contributors for all to authenticated
  using (app.is_editor()) with check (app.is_editor());
create policy contributors_self_update on public.contributors for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- publication_issues
create policy issues_read on public.publication_issues for select to anon, authenticated
  using (is_published or app.is_staff());
create policy issues_publisher on public.publication_issues for all to authenticated
  using (app.can_publish()) with check (app.can_publish());

-- articles
create policy articles_public_read on public.articles for select to anon, authenticated
  using (app.is_live(status, published_at));
create policy articles_staff_read on public.articles for select to authenticated
  using (app.is_staff() and (created_by = auth.uid() or app.is_article_owner(id) or app.can_edit_section(section_id)));
create policy articles_insert on public.articles for insert to authenticated
  with check (app.is_staff());
create policy articles_update on public.articles for update to authenticated
  using (app.is_staff() and (created_by = auth.uid() or app.is_article_owner(id) or app.can_edit_section(section_id)))
  with check (app.is_staff());
create policy articles_delete on public.articles for delete to authenticated
  using (app.is_admin() or (status = 'draft' and created_by = auth.uid()));

-- article parts
create policy article_authors_read on public.article_authors for select to anon, authenticated
  using (app.article_is_live(article_id) or app.can_view_article(article_id));
create policy article_authors_write on public.article_authors for all to authenticated
  using (app.can_modify_article(article_id)) with check (app.can_modify_article(article_id));

create policy article_tags_read on public.article_tags for select to anon, authenticated
  using (app.article_is_live(article_id) or app.can_view_article(article_id));
create policy article_tags_write on public.article_tags for all to authenticated
  using (app.can_modify_article(article_id)) with check (app.can_modify_article(article_id));

create policy article_media_read on public.article_media for select to anon, authenticated
  using (app.article_is_live(article_id) or app.can_view_article(article_id));
create policy article_media_write on public.article_media for all to authenticated
  using (app.can_modify_article(article_id)) with check (app.can_modify_article(article_id));

create policy article_revisions_read on public.article_revisions for select to authenticated
  using (app.can_view_article(article_id));
create policy article_revisions_insert on public.article_revisions for insert to authenticated
  with check (app.can_modify_article(article_id) and saved_by = auth.uid() and kind in ('autosave', 'manual'));

create policy article_activity_read on public.article_activity for select to authenticated
  using (app.can_view_article(article_id));

create policy article_daily_views_staff on public.article_daily_views for select to authenticated
  using (app.is_staff());

-- comments
create policy comments_public_read on public.article_comments for select to anon, authenticated
  using ((status = 'approved' and app.article_is_live(article_id)) or app.is_editor());
create policy comments_moderate on public.article_comments for update to authenticated
  using (app.is_editor()) with check (app.is_editor());
create policy comments_delete on public.article_comments for delete to authenticated
  using (app.is_editor());

create policy comment_private_editor on public.article_comment_private for select to authenticated
  using (app.is_editor());

-- homepage curation
create policy home_slots_read on public.home_slots for select to anon, authenticated using (true);
create policy home_slots_write on public.home_slots for all to authenticated
  using (app.can_publish()) with check (app.can_publish());

-- intake (public writes go through the RPCs above)
create policy submissions_editor on public.article_submissions for all to authenticated
  using (app.is_editor()) with check (app.is_editor());
create policy event_reports_editor on public.event_reports for all to authenticated
  using (app.is_editor()) with check (app.is_editor());
create policy intake_files_editor on public.intake_files for select to authenticated
  using (app.is_editor());
create policy intake_files_editor_delete on public.intake_files for delete to authenticated
  using (app.is_editor());
create policy contact_editor on public.contact_messages for all to authenticated
  using (app.is_editor()) with check (app.is_editor());

-- team / contacts / settings
create policy team_terms_read on public.team_terms for select to anon, authenticated using (true);
create policy team_terms_write on public.team_terms for all to authenticated
  using (app.can_publish()) with check (app.can_publish());
create policy team_members_read on public.team_members for select to anon, authenticated using (true);
create policy team_members_write on public.team_members for all to authenticated
  using (app.can_publish()) with check (app.can_publish());
create policy department_contacts_read on public.department_contacts for select to anon, authenticated using (true);
create policy department_contacts_write on public.department_contacts for all to authenticated
  using (app.is_admin()) with check (app.is_admin());
create policy site_settings_read on public.site_settings for select to anon, authenticated
  using (is_public or app.is_staff());
create policy site_settings_write on public.site_settings for all to authenticated
  using (app.is_admin() or (app.can_publish() and key = 'ticker'))
  with check (app.is_admin() or (app.can_publish() and key = 'ticker'));

create policy audit_log_admin on public.audit_log for select to authenticated using (app.is_admin());

-- -----------------------------------------------------------------------------
-- Storage
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', true, 10485760,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']),
  ('archives', 'archives', true, 62914560,
   array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('intake', 'intake', false, 20971520,
   array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain',
         'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- legacy (v1) policy names, in case the project was not fully emptied
drop policy if exists "storage public read" on storage.objects;
drop policy if exists "storage editorial manage" on storage.objects;

drop policy if exists v2_public_read on storage.objects;
create policy v2_public_read on storage.objects for select to anon, authenticated
  using (bucket_id in ('media', 'archives'));

drop policy if exists v2_media_insert on storage.objects;
create policy v2_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and app.is_staff());

drop policy if exists v2_media_update on storage.objects;
create policy v2_media_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and (owner_id = auth.uid()::text or app.is_editor()))
  with check (bucket_id = 'media' and app.is_staff());

drop policy if exists v2_media_delete on storage.objects;
create policy v2_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (owner_id = auth.uid()::text or app.is_editor()));

drop policy if exists v2_archives_write on storage.objects;
create policy v2_archives_write on storage.objects for all to authenticated
  using (bucket_id = 'archives' and app.can_publish())
  with check (bucket_id = 'archives' and app.can_publish());

drop policy if exists v2_intake_upload on storage.objects;
create policy v2_intake_upload on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'intake' and (storage.foldername(name))[1] in ('submissions', 'events'));

drop policy if exists v2_intake_editor on storage.objects;
create policy v2_intake_editor on storage.objects for select to authenticated
  using (bucket_id = 'intake' and app.is_editor());

drop policy if exists v2_intake_editor_delete on storage.objects;
create policy v2_intake_editor_delete on storage.objects for delete to authenticated
  using (bucket_id = 'intake' and app.is_editor());

commit;
