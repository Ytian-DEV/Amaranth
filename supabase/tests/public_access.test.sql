-- Readers (anon): what the public site can and cannot do.
begin;

select tests.login(null);

select tests.expect_count('anon sees only live articles', 'select id from public.articles', 1);
select tests.expect_count('anon card view shows live articles', 'select id from public.article_cards', 1);
select tests.expect_eq('card byline from authors',
  (select byline from public.article_cards limit 1), 'Wes Writer');
select tests.expect_count('anon reads sections', 'select id from public.sections', 12);
select tests.expect_count('anon reads authors of live article only', 'select * from public.article_authors', 1);
select tests.expect_count('anon cannot read submissions', 'select id from public.article_submissions', 0);
select tests.expect_count('anon cannot read contact inbox', 'select id from public.contact_messages', 0);
select tests.expect_count('anon cannot read profiles', 'select id from public.profiles', 0);
select tests.expect_count('anon cannot read staff invites', 'select email from public.staff_invites', 0);
select tests.expect_count('anon cannot read private site settings',
  'select key from public.site_settings where not is_public', 0);

select tests.expect_error('anon cannot insert articles',
  $$insert into public.articles (category_id, title) select id, 'x' from public.categories limit 1$$);
select tests.expect_error('anon cannot insert submissions directly',
  $$insert into public.article_submissions (submitter_name, submitter_email, title) values ('a', 'a@b.co', 'x')$$);
select tests.expect_error('anon cannot call staff RPC',
  $$select public.dashboard_stats()$$, 'permission denied');

-- views
select public.record_article_view('00000000-0000-0000-0000-000000000001');
select public.record_article_view('00000000-0000-0000-0000-000000000001');
select public.record_article_view('00000000-0000-0000-0000-000000000002'); -- draft: ignored
select tests.expect_eq('view counted on live article',
  (select view_count::text from public.articles where id = '00000000-0000-0000-0000-000000000001'), '2');
select tests.expect_count('most read lists live article', 'select * from public.most_read_articles(7, 5)', 1);

-- search
select tests.expect_count('search finds live article', $$select * from public.search_articles('campus')$$, 1);
select tests.expect_count('search hides drafts', $$select * from public.search_articles('draft')$$, 0);

select tests.expect_count('archive months lists live months only', 'select * from public.archive_months()', 1);

select tests.expect_count('board seed: one current term with 18 members', $$select 1 from public.team_members m join public.team_terms t on t.id = m.term_id where t.is_current$$, 18);

-- forms: closed to browsers, open to /api/submit (service role)
select tests.expect_error('anon cannot call the comment form directly',
  $$select public.submit_comment('00000000-0000-0000-0000-000000000001', 'Reader', 'r@example.com', 'Great story!')$$, 'permission denied');
select tests.expect_error('anon cannot call the contact form directly',
  $$select public.send_contact_message('Ana', 'ana@example.com', 'Hello', 'general', 'I have a question about joining.')$$, 'permission denied');
select tests.expect_error('anon cannot upload to intake (signed links only)',
  $$insert into storage.objects (bucket_id, name) values ('intake', 'submissions/x/file.pdf')$$);
select tests.as_service();

-- comments
select tests.expect_ok('form api can comment',
  $$select public.submit_comment('00000000-0000-0000-0000-000000000001', 'Reader', 'r@example.com', 'Great story!')$$);
select tests.login(null);
select tests.expect_count('pending comment is hidden', 'select id from public.article_comments', 0);
select tests.expect_count('commenter email is private', 'select * from public.article_comment_private', 0);
select tests.as_service();
select tests.expect_error('cannot comment on a draft',
  $$select public.submit_comment('00000000-0000-0000-0000-000000000002', 'Reader', 'r@example.com', 'Hello')$$,
  'closed');
select tests.expect_error('bad email rejected',
  $$select public.submit_comment('00000000-0000-0000-0000-000000000001', 'Reader', 'nope', 'Hello')$$,
  'valid email');

-- intake
select tests.expect_ok('form api can submit an article',
  $$select public.submit_article('Juan Dela Cruz', 'juan@example.com', 'BS Agriculture', 'news',
     'A love letter to the Agri canteen', null, repeat('word ', 30),
     '[{"path": "submissions/abc/story.pdf", "name": "story.pdf"}]')$$);
select tests.expect_error('submission file must exist',
  $$select public.submit_article('Juan Dela Cruz', 'juan2@example.com', null, 'news', 'Title here', null, null,
     '[{"path": "submissions/missing.pdf", "name": "x.pdf"}]')$$, 'not uploaded');
select tests.expect_ok('form api can send event report',
  $$select public.submit_event_report('Student Council', 'Ana', 'ana@example.com', 'Org Fair 2026', current_date,
     'Gym', 'A full day of org booths and performances.')$$);
select tests.expect_ok('form api can send contact message',
  $$select public.send_contact_message('Ana', 'ana@example.com', 'Hello', 'general', 'I have a question about joining.')$$);
select tests.expect_ok('rate limit allows 3', $$select public.send_contact_message('Ana', 'ana@example.com', 'Hello', 'general', 'Second message here.')$$);
select tests.expect_ok('rate limit allows 3 (3rd)', $$select public.send_contact_message('Ana', 'ana@example.com', 'Hello', 'general', 'Third message here.')$$);
select tests.expect_error('rate limit blocks the 4th',
  $$select public.send_contact_message('Ana', 'ana@example.com', 'Hello', 'general', 'Fourth message here.')$$, 'Too many');
select tests.expect_ok('honeypot silently accepted',
  $$select public.send_contact_message('Bot', 'bot@example.com', 'x', 'general', 'spam spam spam', 'http://spam')$$);

-- storage
select tests.login(null);
select tests.expect_error('anon cannot upload to media',
  $$insert into storage.objects (bucket_id, name) values ('media', 'x.jpg')$$);
select tests.expect_count('anon cannot list intake files', $$select id from storage.objects where bucket_id = 'intake'$$, 0);

select tests.logout();
select tests.expect_count('honeypot stored nothing', $$select id from public.contact_messages where email = 'bot@example.com'$$, 0);
select tests.expect_count('submission file attached', 'select id from public.intake_files', 1);

rollback;
