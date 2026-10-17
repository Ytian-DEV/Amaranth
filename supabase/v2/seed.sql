-- =============================================================================
-- AMARANTH v2 — reference data (run after schema.sql; re-runnable)
-- Sections and categories follow the Figma navigation:
--   primary: News, Sports, Feature, Literary, Blogs, Specials, Views
--   "More":  Science & Technology, Investigative, Explainer, Bulletin, Stories
-- =============================================================================

begin;

insert into public.sections (slug, name, description, nav_placement, nav_order, accepts_submissions)
values
  ('news', 'News', 'Campus, community, regional, national and global reporting.', 'primary', 1, true),
  ('sports', 'Sports', 'Athletics coverage, competitions, profiles and sports updates.', 'primary', 2, true),
  ('feature', 'Feature', 'Long-form human-interest stories, campus life and experiences.', 'primary', 3, true),
  ('literary', 'Literary', 'Poetry, prose and creative writing.', 'primary', 4, true),
  ('blogs', 'Blogs', 'Blogs and informal commentary.', 'primary', 5, true),
  ('specials', 'Specials', 'Comics, multimedia and special storytelling formats.', 'primary', 6, true),
  ('views', 'Views', 'Editorials, opinion, columns and vox pop.', 'primary', 7, true),
  ('science-technology', 'Science & Technology', 'Science, technology and innovation stories.', 'more', 8, true),
  ('investigative', 'Investigative', 'Investigative reports and accountability journalism.', 'more', 9, true),
  ('explainer', 'Explainer', 'Context-rich explainers for complex topics.', 'more', 10, true),
  ('bulletin', 'Bulletin', 'Official notices, board passers, jobs and event bulletins.', 'more', 11, false),
  ('stories', 'Stories', 'Narrative and community stories.', 'more', 12, true)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    nav_placement = excluded.nav_placement,
    nav_order = excluded.nav_order,
    accepts_submissions = excluded.accepts_submissions;

insert into public.categories (section_id, slug, name, description, sort_order, is_assignable)
select s.id, x.slug, x.name, x.description, x.sort_order, x.is_assignable
from (
  values
    ('news', 'campus-news', 'Campus News', 'University and campus reporting.', 1, true),
    ('news', 'community-news', 'Community News', 'Stories from the wider local community.', 2, true),
    ('news', 'regional-news', 'Regional News', 'Regional developments affecting readers.', 3, true),
    ('news', 'national-news', 'National News', 'National news relevant to VSU readers.', 4, true),
    ('news', 'global-news', 'Global News', 'International news and analysis.', 5, true),
    ('news', 'environment', 'Environment', 'Environment and climate reporting.', 6, true),
    ('sports', 'salingkusog', 'Salingkusog', 'Campus sports coverage for Salingkusog.', 1, true),
    ('sports', 'scuaa', 'SCUAA', 'SCUAA competitions and stories.', 2, true),
    ('sports', 'national-sports', 'National Sports', 'National sports reporting.', 3, true),
    ('sports', 'sports-feature', 'Sports Feature', 'Profiles, analysis and feature-length sports stories.', 4, true),
    ('sports', 'world-sports', 'World Sports', 'International sports stories.', 5, true),
    ('feature', 'campus-feature', 'Campus Feature', 'Feature stories centred on campus life.', 1, true),
    ('feature', 'people-events', 'People & Events', 'People, milestones and event-driven features.', 2, true),
    ('feature', 'experiences', 'Experiences', 'First-person and experience-based narratives.', 3, true),
    ('feature', 'lifestyle', 'Lifestyle', 'Lifestyle and culture stories.', 4, true),
    ('feature', 'entertainment', 'Entertainment', 'Entertainment coverage and reviews.', 5, true),
    ('literary', 'poetry', 'Poetry', 'Poems.', 1, true),
    ('literary', 'fiction', 'Fiction', 'Short stories and fiction.', 2, true),
    ('literary', 'essay', 'Essay', 'Literary and personal essays.', 3, true),
    ('blogs', 'blogs', 'Blogs', 'General blog entries.', 1, true),
    ('specials', 'comics', 'Comics', 'Comics and illustrated storytelling.', 1, true),
    ('specials', 'multimedia', 'Multimedia', 'Audio, video and multimedia specials.', 2, true),
    ('views', 'editorial', 'Editorial', 'Unsigned institutional editorials.', 1, false),
    ('views', 'opinion', 'Opinion', 'Opinion and commentary.', 2, true),
    ('views', 'column', 'Column', 'Regular columns.', 3, true),
    ('views', 'vox-pop', 'Vox Pop', 'Public opinion and vox pop entries.', 4, true),
    ('science-technology', 'science-technology', 'Science & Technology', 'Science and technology reporting.', 1, true),
    ('investigative', 'investigative', 'Investigative', 'Investigative journalism.', 1, true),
    ('explainer', 'explainer', 'Explainer', 'Explainer articles.', 1, true),
    ('bulletin', 'board-passers', 'Board Passers', 'Board passer announcements.', 1, false),
    ('bulletin', 'jobs', 'Jobs', 'Job and opportunity postings.', 2, false),
    ('bulletin', 'official-announcement', 'Official Announcement', 'Official announcements and notices.', 3, false),
    ('bulletin', 'student-council', 'Student Council', 'Student council bulletins.', 4, false),
    ('bulletin', 'events', 'Events', 'Event bulletins and reports.', 5, false),
    ('stories', 'stories', 'Stories', 'Narrative and community stories.', 1, true)
) as x(section_slug, slug, name, description, sort_order, is_assignable)
join public.sections s on s.slug = x.section_slug
on conflict (section_id, slug) do update
set name = excluded.name,
    description = excluded.description,
    sort_order = excluded.sort_order,
    is_assignable = excluded.is_assignable;

insert into public.department_contacts (name, email, sort_order)
values
  ('Editorial Board', 'amaranth@vsu.edu.ph', 1),
  ('News Correspondents Section', 'amaranth@vsu.edu.ph', 2),
  ('Sports Section', 'amaranth@vsu.edu.ph', 3),
  ('Multimedia Section', 'amaranth@vsu.edu.ph', 4),
  ('Creatives and Design Section', 'amaranth@vsu.edu.ph', 5),
  ('Writers Section', 'amaranth@vsu.edu.ph', 6)
on conflict (name) do nothing;

insert into public.home_slots (slot) values ('lead'), ('folio') on conflict (slot) do nothing;

insert into public.site_settings (key, value, is_public)
values
  ('site', jsonb_build_object(
     'name', 'Amaranth',
     'tagline', 'The Official Student Publication of Visayas State University',
     'location', 'Baybay City, Leyte',
     'founded', null
   ), true),
  ('contact', jsonb_build_object(
     'office_address', jsonb_build_array('Amaranth Publication Office', 'Student Center Building',
                                         'Visayas State University', 'Baybay City, Leyte 6521-A', 'Philippines'),
     'phones', jsonb_build_array('+63 53 335 2601'),
     'emails', jsonb_build_array('amaranth@vsu.edu.ph', 'editor@amaranth.vsu.edu.ph'),
     'office_hours', jsonb_build_array('Monday – Friday: 8:00 AM – 5:00 PM', 'Saturday: 8:00 AM – 12:00 PM')
   ), true),
  ('social_links', jsonb_build_array(
     jsonb_build_object('platform', 'facebook', 'label', 'Facebook', 'url', 'https://www.facebook.com/amaranthvsu'),
     jsonb_build_object('platform', 'tiktok', 'label', 'TikTok', 'url', 'https://www.tiktok.com/@amaranthvsu'),
     jsonb_build_object('platform', 'instagram', 'label', 'Instagram', 'url', 'https://www.instagram.com/amaranthvsu'),
     jsonb_build_object('platform', 'youtube', 'label', 'YouTube', 'url', 'https://www.youtube.com/@amaranthvsu')
   ), true),
  -- "latest" = newest headlines; "manual" = items[] ({"text", "href"})
  ('ticker', jsonb_build_object('mode', 'latest', 'count', 3, 'items', jsonb_build_array()), true),
  ('comments', jsonb_build_object('enabled', true), true),
  ('submissions', jsonb_build_object(
     'enabled', true,
     'review_days', '3 to 5 school days',
     'guidelines_md', ''
   ), true)
on conflict (key) do nothing;

commit;
