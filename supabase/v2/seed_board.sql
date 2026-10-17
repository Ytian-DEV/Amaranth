-- =============================================================================
-- AMARANTH v2 — OPTIONAL: current editorial board from the v1 site
-- Run after seed.sql if you want the board page filled on launch day.
-- Re-runnable. Photos are the files already in /public/images.
-- Edit the term label and start date below to match the actual term.
-- =============================================================================

begin;

insert into public.team_terms (label, starts_on, is_current)
values ('2025–2026', '2025-08-01', true)
on conflict (label) do update set is_current = true;

update public.team_terms set is_current = false where label <> '2025–2026' and is_current;

-- static photos served by the site itself (path starts with "/")
insert into public.media_assets (bucket, path, kind, mime_type, size_bytes, alt_text)
select 'media', x.path, 'image', 'image/jpeg', 1, x.name
from (values
  ('/images/advisers/ulderico-alviola.jpg', 'Dr. Ulderico A. Alviola'),
  ('/images/advisers/jucel-marie-guatlo.jpg', 'Dr. Jucel Marie Guatlo'),
  ('/images/editorial-board/anna-naagas.jpg', 'Anna Marie Naagas'),
  ('/images/editorial-board/jelly-mondejar.jpg', 'Jelly Mondejar'),
  ('/images/editorial-board/chubi-soliva.jpg', 'Chubi Soliva'),
  ('/images/editorial-board/xavier-villaruel.jpg', 'Xavier John Villaruel'),
  ('/images/section-heads/fred-marfori.jpg', 'Fred Vincent Marfori'),
  ('/images/section-heads/sean-david.jpg', 'Sean Marcus David'),
  ('/images/section-heads/rixel-manimtim.jpg', 'Rixel Rashid Manimtim'),
  ('/images/section-heads/mariah-montesclaros.jpg', 'Mariah Shacille Jade Montesclaros'),
  ('/images/section-heads/joshua-calacar.jpg', 'Joshua Pray Calacar'),
  ('/images/section-heads/frances-ibo.jpg', 'Frances Ibo'),
  ('/images/section-heads/sam-duco.jpg', 'Sam Christian Duco'),
  ('/images/section-heads/kaye-banares.jpg', 'Kaye Bianca Banares'),
  ('/images/section-heads/christian-boyles.jpg', 'Christian Earl James Boyles'),
  ('/images/section-heads/jyra-usaraga.jpg', 'Jyra Maria Usaraga'),
  ('/images/section-heads/shamel-tejones.jpg', 'Shamel Tejones'),
  ('/images/section-heads/jennifer-pading.jpg', 'Jennifer Jezreel Kaye Pading')
) as x(path, name)
on conflict (bucket, path) do nothing;

delete from public.team_members where term_id = (select id from public.team_terms where label = '2025–2026');

insert into public.team_members (term_id, role_group, position_title, display_name, photo_asset_id, sort_order)
select t.id, x.grp::public.team_role_group, x.position, x.name,
       (select m.id from public.media_assets m where m.bucket = 'media' and m.path = x.path), x.ord
from public.team_terms t
cross join (values
  ('adviser', 'Adviser', 'Dr. Ulderico A. Alviola', '/images/advisers/ulderico-alviola.jpg', 1),
  ('adviser', 'Adviser', 'Dr. Jucel Marie Guatlo', '/images/advisers/jucel-marie-guatlo.jpg', 2),
  ('editorial_board', 'Executive Editor', 'Anna Marie Naagas', '/images/editorial-board/anna-naagas.jpg', 1),
  ('editorial_board', 'Managing Editor', 'Jelly Mondejar', '/images/editorial-board/jelly-mondejar.jpg', 2),
  ('editorial_board', 'Business Manager', 'Chubi Soliva', '/images/editorial-board/chubi-soliva.jpg', 3),
  ('editorial_board', 'Editorial Consultant', 'Xavier John Villaruel', '/images/editorial-board/xavier-villaruel.jpg', 4),
  ('section_head', 'News Editor', 'Fred Vincent Marfori', '/images/section-heads/fred-marfori.jpg', 1),
  ('section_head', 'Opinion Editor', 'Sean Marcus David', '/images/section-heads/sean-david.jpg', 2),
  ('section_head', 'Feature Editor', 'Rixel Rashid Manimtim', '/images/section-heads/rixel-manimtim.jpg', 3),
  ('section_head', 'Literary Editor', 'Mariah Shacille Jade Montesclaros', '/images/section-heads/mariah-montesclaros.jpg', 4),
  ('section_head', 'Sci-Tech Editor', 'Joshua Pray Calacar', '/images/section-heads/joshua-calacar.jpg', 5),
  ('section_head', 'Sports Editor', 'Frances Ibo', '/images/section-heads/frances-ibo.jpg', 6),
  ('section_head', 'Creatives and Design Head', 'Sam Christian Duco', '/images/section-heads/sam-duco.jpg', 7),
  ('section_head', 'Visual Editor', 'Kaye Bianca Banares', '/images/section-heads/kaye-banares.jpg', 8),
  ('section_head', 'Multimedia Production Head', 'Christian Earl James Boyles', '/images/section-heads/christian-boyles.jpg', 9),
  ('section_head', 'Head Photo Editor', 'Jyra Maria Usaraga', '/images/section-heads/jyra-usaraga.jpg', 10),
  ('section_head', 'Head Video Editor', 'Shamel Tejones', '/images/section-heads/shamel-tejones.jpg', 11),
  ('section_head', 'Online Editor', 'Jennifer Jezreel Kaye Pading', '/images/section-heads/jennifer-pading.jpg', 12)
) as x(grp, position, name, path, ord)
where t.label = '2025–2026';

commit;
