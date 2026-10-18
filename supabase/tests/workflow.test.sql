-- Staff: article workflow, permissions per role.
begin;

-- ---------------------------------------------------------------- writer
select tests.login('writer@test.local');

select tests.expect_count('writer sees own + live articles',
  'select id from public.articles', 3); -- published(own), own draft, own sports submitted
select tests.expect_count('writer cannot see writer2 drafts',
  $$select id from public.articles where id = '00000000-0000-0000-0000-000000000003'$$, 0);

select tests.expect_ok('writer creates a draft',
  $$insert into public.articles (id, category_id, title, body_text)
    select '00000000-0000-0000-0000-0000000000b1', c.id, 'Climate-ready campus', 'one two three'
    from public.categories c where c.slug = 'campus-news'$$);
select tests.expect_eq('slug generated from title',
  (select slug from public.articles where id = '00000000-0000-0000-0000-0000000000b1'), 'climate-ready-campus');
select tests.expect_eq('section derived from category',
  (select s.slug from public.articles a join public.sections s on s.id = a.section_id
   where a.id = '00000000-0000-0000-0000-0000000000b1'), 'news');
select tests.expect_count('creator credited as author',
  $$select 1 from public.article_authors aa join public.contributors c on c.id = aa.contributor_id
    where aa.article_id = '00000000-0000-0000-0000-0000000000b1' and c.profile_id = auth.uid()$$, 1);
select tests.expect_error('writer cannot create published',
  $$insert into public.articles (category_id, title, status)
    select c.id, 'Sneaky', 'published' from public.categories c where c.slug = 'campus-news'$$, 'drafts');
select tests.expect_error('writer cannot file an editorial',
  $$insert into public.articles (category_id, title)
    select c.id, 'My editorial' from public.categories c where c.slug = 'editorial'$$, 'reserved');
select tests.expect_error('writer cannot publish own draft',
  $$select public.transition_article('00000000-0000-0000-0000-0000000000b1', 'published')$$, 'cannot move');
select tests.expect_error('writer cannot feature',
  $$update public.articles set is_featured = true where id = '00000000-0000-0000-0000-0000000000b1'$$, 'editors');
select tests.expect_ok('writer submits for review',
  $$select public.transition_article('00000000-0000-0000-0000-0000000000b1', 'submitted', 'Ready')$$);
select tests.expect_error('submitted article is locked for writer',
  $$update public.articles set title = 'Changed' where id = '00000000-0000-0000-0000-0000000000b1'$$, 'locked');
select tests.expect_ok('writer can withdraw to draft',
  $$select public.transition_article('00000000-0000-0000-0000-0000000000b1', 'draft')$$);
select tests.expect_ok('writer resubmits',
  $$select public.transition_article('00000000-0000-0000-0000-0000000000b1', 'submitted')$$);
select tests.expect_count('activity logged with note',
  $$select id from public.article_activity where article_id = '00000000-0000-0000-0000-0000000000b1' and note = 'Ready'$$, 1);
select tests.expect_ok('writer saves an autosave revision',
  $$insert into public.article_revisions (article_id, kind, title, saved_by)
    values ('00000000-0000-0000-0000-000000000002', 'autosave', 'Writer draft', auth.uid())$$);
select tests.expect_error('writer cannot change own role',
  $$update public.profiles set role = 'super_admin' where id = auth.uid()$$, 'admins');
select tests.expect_ok('writer edits own bio', $$update public.profiles set bio = 'Hi' where id = auth.uid()$$);
delete from public.articles where id = '00000000-0000-0000-0000-000000000001';
select tests.expect_count('writer delete of published is a no-op',
  $$select id from public.articles where id = '00000000-0000-0000-0000-000000000001'$$, 1);
select tests.expect_count('writer cannot read inbox', 'select id from public.contact_messages', 0);
select tests.expect_ok('writer uploads media',
  $$insert into storage.objects (bucket_id, name) values ('media', 'writer/photo.jpg')$$);
select tests.expect_error('writer cannot write archives',
  $$insert into storage.objects (bucket_id, name) values ('archives', 'issue.pdf')$$);
select tests.expect_eq('writer dashboard stats limited to own drafts',
  (public.dashboard_stats() ->> 'drafts'), '1');

-- ---------------------------------------------------------------- section editor (news)
select tests.login('news.editor@test.local');

select tests.expect_count('news editor sees news submissions',
  $$select id from public.articles where status = 'submitted'$$, 2); -- 0004 and b1 (news)
select tests.expect_count('news editor cannot see sports submissions',
  $$select id from public.articles where id = '00000000-0000-0000-0000-000000000005'$$, 0);
select tests.expect_ok('section editor moves to in_review',
  $$select public.transition_article('00000000-0000-0000-0000-0000000000b1', 'in_review')$$);
select tests.expect_ok('section editor edits in review',
  $$update public.articles set dek = 'A look at preparedness' where id = '00000000-0000-0000-0000-0000000000b1'$$);
select tests.expect_error('section editor cannot publish',
  $$select public.transition_article('00000000-0000-0000-0000-0000000000b1', 'published')$$, 'cannot move');
select tests.expect_ok('section editor returns with note',
  $$select public.transition_article('00000000-0000-0000-0000-0000000000b1', 'draft', 'Needs a source')$$);
select tests.expect_ok('section editor rejects',
  $$select public.transition_article('00000000-0000-0000-0000-000000000004', 'rejected', 'Off-topic')$$);
select tests.expect_error('section editor cannot touch sports',
  $$select public.transition_article('00000000-0000-0000-0000-000000000005', 'in_review')$$, 'not found');
select tests.expect_error('section editor cannot change the ticker',
  $$insert into public.site_settings (key, value, is_public) values ('ticker', '{}', true)
    on conflict (key) do update set value = excluded.value$$);
select tests.expect_count('section editor reads submissions intake', 'select id from public.article_submissions', 0);

-- ---------------------------------------------------------------- editor in chief
select tests.login('eic@test.local');

select tests.expect_ok('eic publishes directly from draft',
  $$select public.transition_article('00000000-0000-0000-0000-0000000000b1', 'published')$$);
select tests.expect_ok('eic schedules sports piece',
  $$select public.transition_article('00000000-0000-0000-0000-000000000005', 'scheduled', null, now() + interval '1 day')$$);
select tests.expect_error('eic cannot schedule in the past',
  $$select public.transition_article('00000000-0000-0000-0000-000000000003', 'scheduled', null, now() - interval '1 day')$$, 'future');
select tests.expect_ok('eic archives', $$select public.transition_article('00000000-0000-0000-0000-0000000000b1', 'archived')$$);
select tests.expect_ok('eic restores', $$select public.transition_article('00000000-0000-0000-0000-0000000000b1', 'published')$$);
select tests.expect_ok('eic features an article',
  $$update public.articles set is_featured = true where id = '00000000-0000-0000-0000-0000000000b1'$$);
select tests.expect_ok('publisher can change the ticker',
  $$update public.site_settings set value = '{"mode":"manual","count":3,"items":[{"text":"Enrollment opens Jan 5"}]}' where key = 'ticker'$$);
select tests.expect_ok('eic sets lead slot',
  $$update public.home_slots set article_id = '00000000-0000-0000-0000-0000000000b1' where slot = 'lead'$$);
select tests.expect_error('eic cannot grant super_admin',
  $$update public.profiles set role = 'super_admin' where email = 'writer@test.local'$$, 'super admin');
select tests.expect_ok('eic promotes writer to section editor',
  $$update public.profiles set role = 'section_editor' where email = 'writer2@test.local'$$);
select tests.expect_count('role change audited', $$select id from public.audit_log where action = 'profile.access'$$, 1);

-- scheduled article: hidden now, visible once its time passes
select tests.login(null);
select tests.expect_count('scheduled article hidden before time',
  $$select id from public.articles where id = '00000000-0000-0000-0000-000000000005'$$, 0);
select tests.expect_count('published + restored articles visible',
  $$select id from public.articles$$, 2);
select tests.logout();
update public.articles set scheduled_for = now() - interval '1 minute', published_at = now() - interval '1 minute'
  where id = '00000000-0000-0000-0000-000000000005';
select tests.login(null);
select tests.expect_count('scheduled article visible after time',
  $$select id from public.articles where id = '00000000-0000-0000-0000-000000000005'$$, 1);
select tests.logout();
select tests.expect_eq('cron flips due scheduled rows', app.publish_due_articles()::text, '1');

-- ---------------------------------------------------------------- comments + intake as eic
select tests.logout();
select public.submit_comment('00000000-0000-0000-0000-000000000001', 'Reader', 'r@example.com', 'Nice work');
select tests.login('eic@test.local');
select tests.expect_count('eic sees pending comments', $$select id from public.article_comments where status = 'pending'$$, 1);
select tests.expect_ok('eic approves comment',
  $$update public.article_comments set status = 'approved' where status = 'pending'$$);
select tests.login(null);
select tests.expect_count('approved comment is public', 'select id from public.article_comments', 1);

select tests.logout();
select public.submit_article('Juan', 'juan@example.com', null, 'news', 'Agri canteen letter', null, repeat('word ', 30));
select tests.login('eic@test.local');
select tests.expect_ok('eic converts submission to draft',
  $$select public.convert_intake_to_article('submission',
     (select id from public.article_submissions limit 1),
     (select id from public.categories where slug = 'campus-news'))$$);
select tests.expect_count('converted submission marked',
  $$select id from public.article_submissions where status = 'converted' and converted_article_id is not null$$, 1);
select tests.expect_ok('eic reads stats', $$select public.dashboard_stats()$$);

-- ---------------------------------------------------------------- admin
select tests.login('admin@test.local');
select tests.expect_ok('super admin grants super admin',
  $$update public.profiles set role = 'super_admin' where email = 'eic@test.local'$$);
select tests.expect_ok('super admin demotes the other super admin',
  $$update public.profiles set role = 'editor_in_chief' where email = 'eic@test.local'$$);
select tests.expect_error('last super admin cannot step down',
  $$update public.profiles set role = 'editor_in_chief' where id = auth.uid()$$, 'At least one');

-- ---------------------------------------------------------------- stranger (signed up, not invited)
select tests.login('stranger@test.local');
select tests.expect_count('uninvited user sees only live articles', 'select id from public.articles', 3);
select tests.expect_count('uninvited user has no contributor byline',
  $$select 1 from public.contributors where profile_id = auth.uid()$$, 0);
select tests.expect_error('uninvited user cannot write',
  $$insert into public.articles (category_id, title) select id, 'x' from public.categories where slug = 'campus-news'$$);
select tests.expect_error('uninvited user cannot upload media',
  $$insert into storage.objects (bucket_id, name) values ('media', 'x.jpg')$$);
select tests.expect_error('uninvited user cannot read stats', $$select public.dashboard_stats()$$, 'Staff only');

-- ---------------------------------------------------------------- publishing access
select tests.login('writer@test.local');
select tests.expect_ok('writer drafts another story',
  $$insert into public.articles (id, category_id, title, body_text)
    select '00000000-0000-0000-0000-0000000000b9', c.id, 'Granted story', 'one two three'
    from public.categories c where c.slug = 'campus-news'$$);
select tests.expect_error('writer without access cannot publish',
  $$select public.transition_article('00000000-0000-0000-0000-0000000000b9', 'published')$$, 'cannot move');
select tests.expect_error('writer cannot give self publishing access',
  $$update public.profiles set can_publish = true where id = auth.uid()$$, 'publishing access');
select tests.expect_error('writer cannot call the grant',
  $$select public.set_publish_access(auth.uid(), true)$$, 'publishing access');

select tests.login('bm@test.local');
select tests.expect_error('business manager cannot give publishing access',
  $$select public.set_publish_access((select id from public.profiles where email = 'writer@test.local'), true)$$, 'publishing access');
select tests.expect_ok('business manager drafts a story',
  $$insert into public.articles (id, category_id, title, body_text)
    select '00000000-0000-0000-0000-0000000000ba', c.id, 'Business story', 'one two three'
    from public.categories c where c.slug = 'campus-news'$$);
select tests.expect_ok('business manager publishes',
  $$select public.transition_article('00000000-0000-0000-0000-0000000000ba', 'published')$$);

select tests.login('pub.me@test.local');
select tests.expect_ok('managing editor gives the writer publishing access',
  $$select public.set_publish_access((select id from public.profiles where email = 'writer@test.local'), true)$$);

select tests.login('writer@test.local');
select tests.expect_ok('writer with access publishes own story',
  $$select public.transition_article('00000000-0000-0000-0000-0000000000b9', 'published')$$);

select tests.login('pub.me@test.local');
select tests.expect_ok('managing editor takes the access back',
  $$select public.set_publish_access((select id from public.profiles where email = 'writer@test.local'), false)$$);
select tests.login('writer@test.local');
select tests.expect_error('writer without access cannot unpublish',
  $$select public.transition_article('00000000-0000-0000-0000-0000000000b9', 'draft')$$, 'cannot move');

select tests.logout();
select tests.expect_count('publishing access changes are audited',
  $$select 1 from public.audit_log where action = 'profile.publish_access'$$, 2);

-- ---------------------------------------------------------------- media in use cannot be deleted
select tests.logout();
select tests.expect_error('used cover cannot be deleted',
  $$delete from public.media_assets where id = '00000000-0000-0000-0000-0000000000a1'$$, 'foreign key');

rollback;
