-- Test fixtures (run as the superuser after schema + seed). LOCAL TESTING ONLY.
-- Re-runnable.

insert into public.staff_invites (email, role, section_slugs) values
  ('admin@test.local', 'super_admin', '{}'),
  ('eic@test.local', 'editor_in_chief', '{}'),
  ('news.editor@test.local', 'section_editor', '{news}'),
  ('writer@test.local', 'staff_writer', '{}'),
  ('writer2@test.local', 'staff_writer', '{}')
on conflict (email) do nothing;

insert into auth.users (email, raw_user_meta_data)
select x.email, jsonb_build_object('display_name', x.name)
from (values
  ('admin@test.local', 'Ada Admin'),
  ('eic@test.local', 'Eli Chief'),
  ('news.editor@test.local', 'Nora News'),
  ('writer@test.local', 'Wes Writer'),
  ('writer2@test.local', 'Wren Writer'),
  ('stranger@test.local', 'Sam Stranger')
) as x(email, name)
where not exists (select 1 from auth.users u where u.email = x.email);

insert into public.contributors (profile_id, name, slug, type)
select p.id, p.display_name, app.slugify(p.display_name), 'staff'
from public.profiles p
where p.email in ('writer@test.local', 'writer2@test.local')
on conflict (slug) do nothing;

insert into public.media_assets (id, bucket, path, mime_type, size_bytes, width, height, alt_text)
values ('00000000-0000-0000-0000-0000000000a1', 'media', 'fixtures/cover.jpg', 'image/jpeg', 1000, 1600, 900, 'Forest')
on conflict (id) do nothing;

-- Articles created as the service role (no auth.uid): workflow checks skipped.
insert into public.articles (id, category_id, title, excerpt, body_text, status, cover_asset_id, created_by, allow_comments)
select x.id::uuid, c.id, x.title, 'Excerpt', 'Body text for ' || x.title, x.status::public.article_status,
       case when x.cover then '00000000-0000-0000-0000-0000000000a1'::uuid end,
       (select id from public.profiles where email = x.owner), true
from (values
  ('00000000-0000-0000-0000-000000000001', 'news', 'campus-news', 'Published campus story', 'published', true, 'writer@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'news', 'campus-news', 'Writer draft', 'draft', false, 'writer@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'sports', 'scuaa', 'Writer2 sports draft', 'draft', false, 'writer2@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'news', 'campus-news', 'Writer2 news submitted', 'submitted', false, 'writer2@test.local'),
  ('00000000-0000-0000-0000-000000000005', 'sports', 'scuaa', 'Sports submitted', 'submitted', false, 'writer@test.local')
) as x(id, section, category, title, status, cover, owner)
join public.sections s on s.slug = x.section
join public.categories c on c.section_id = s.id and c.slug = x.category
on conflict (id) do nothing;

insert into public.article_authors (article_id, contributor_id)
select '00000000-0000-0000-0000-000000000001', id from public.contributors where slug = 'wes-writer'
on conflict do nothing;

insert into storage.objects (bucket_id, name) values ('intake', 'submissions/abc/story.pdf')
on conflict do nothing;
