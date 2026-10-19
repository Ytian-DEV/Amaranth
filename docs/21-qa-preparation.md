---
title: "Defense Q&A Preparation"
subtitle: "55 likely panel questions with honest, code-grounded answers"
version: "1.0"
date: "2026-10-19"
---

# Document control

| Field | Value |
|---|---|
| Title | Defense Q&A Preparation |
| Document ID | AMR-DOC-21 |
| Version | 1.0 |
| Date | 2026-10-19 |
| Author | Amaranth development team [TO CONFIRM: names] |
| Status | Final draft |

# Contents

1. Problem, scope and value
2. Architecture and stack
3. Database and data model
4. Security
5. Privacy
6. Salingkusog module
7. Testing and quality
8. Performance and scalability
9. Operations and failure
10. Process, limitations and future

\newpage

# 1. Problem, scope and value

**Q1. What problem does Amaranth v2 solve?**
The v1 site was a partial front end with no newsroom workflow, no tests, slow mobile pages (Lighthouse performance 56, accessibility 91) and security gaps (exposed helper functions, open storage deletes). v2 runs the whole editorial process and Salingkusog results inside one system, with permissions enforced by the database (AMR-DOC-01 §2).

**Q2. Who are the users?**
Seven staff roles (Super admin, Executive Editor, Managing Editor, Business Manager, Section editor, Staff writer, Contributor), a Salingkusog team group, and anonymous readers (AMR-DOC-02 §3).

**Q3. What is out of scope?**
Reader accounts, native apps, email notifications, ads, athlete eligibility, heats and multiple entries per faction, and v1 content migration (AMR-DOC-01 §7).

**Q4. How do you measure success?**
RLS on all 50 tables; all 255 unit tests and 278 SQL checks passing; accessibility 100 on key pages; WCAG AA contrast; no secrets in the browser; standings computed automatically (AMR-DOC-01 §8). The live-event criterion is confirmed only after the 2026 games.

**Q5. Why not use WordPress or another existing CMS?**
We needed the Salingkusog engine (brackets, contests, live scores, computed medal table) tightly integrated with the newsroom, database-enforced roles specific to the publication (e.g. the Business Manager and per-person publishing access), and a free managed stack. A generic CMS would need extensive plugins and still leave the sports logic custom.

# 2. Architecture and stack

**Q6. Describe the architecture in one sentence.**
A React single-page app that talks directly to Supabase (PostgreSQL with RLS, Auth, Storage, Realtime), plus a thin Vercel layer for secrets, caching and SEO (AMR-DOC-03 §3).

**Q7. Why React + Vite instead of Next.js?**
The app is client-rendered; we did not need server rendering. Vite gives fast builds. Link previews for social media are handled by a small middleware that injects Open Graph tags for crawlers only (ADR-003).

**Q8. Why Supabase?**
Relational data fits a newsroom and sports results; RLS lets the database enforce permissions; Auth, Storage and Realtime come with it; it has a free tier and plain PostgreSQL avoids lock-in to a proprietary data model.

**Q9. Where is the business logic?**
In the database: RLS policies, triggers (workflow, advancement, guards) and RPCs. The UI mirrors rules only to hide buttons (`permissions.ts`). This means the API cannot be used to bypass rules (ADR-001).

**Q10. Isn't putting logic in SQL hard to maintain?**
It needs SQL skills, but rules sit in one place and are covered by 278 SQL checks run against a throwaway database, applying every file twice. Helpers keep policies short; changing who may publish means editing one function.

**Q11. What runs on the server?**
Six Vercel functions — `/api/submit` (forms with CAPTCHA), `/api/e` (statistics ingest), `/api/r` (edge cache), sitemap, RSS, robots — and the crawler middleware (AMR-DOC-07 §2).

**Q12. How does real-time work?**
Supabase Realtime streams changes of `sk_matches`, `sk_placements` and `sk_entries`; public pages subscribe per edition and refetch affected queries; a 60-second poll is the fallback (SEQ-4).

**Q13. How do you handle state in the front end?**
TanStack Query caches server data per feature; mutations invalidate query keys; Realtime events also invalidate keys.

# 3. Database and data model

**Q14. How many tables and why so many?**
50 tables: 29 newsroom, 12 Salingkusog, 9 statistics. Many are link tables (article authors, tags, media), private split tables (commenter emails) or daily rollups (AMR-DOC-04 §1).

**Q15. Is the schema normalised?**
Transactional tables are in 3NF. Deliberate denormalisations (article section, edition id on Salingkusog rows, reading time, search vector, view counts, rollups) are maintained by triggers or generated columns, never by the app (AMR-DOC-04 §4).

**Q16. How is the medal table computed?**
The view `sk_medal_table` counts gold, silver and bronze placements per faction, multiplies by the edition's points (default 5/3/1), and ranks by points, then golds, then silvers. Nothing is typed by hand (AMR-DOC-04 §9).

**Q17. What if two factions tie on points?**
Rank uses gold count, then silver; if still equal, `rank()` gives them the same rank.

**Q18. How do you prevent a wrong medal for a place?**
A check constraint ties medal to place (1 gold, 2 silver, 3 bronze), and `sk_set_placements` sets the medal from the place.

**Q19. How are database changes deployed without a migration tool?**
Re-runnable SQL files (`if not exists`, `create or replace`, `drop … if exists`) pasted in order; the test runner applies them twice to prove idempotency (AMR-DOC-09 §5).

**Q20. Why hand-written TypeScript types?**
No Supabase CLI/Docker at the start; it is a known debt with a plan to generate them (ADR-015, KI-04).

# 4. Security

**Q21. How do you stop a writer from publishing by calling the API directly?**
The `app.article_before_write` trigger checks `app.can_publish_articles()` on every status change; the API returns "You cannot move this article…" (SQL test in `workflow.test.sql`).

**Q22. Can someone make themselves an admin?**
No. Only SA/EE change roles; only SA grants SA; the last active SA cannot be removed (`profiles_guard`); new accounts get roles only from `staff_invites`.

**Q23. What stops spam on the forms?**
Cloudflare Turnstile verified on the server, per-email rate limits, a honeypot field, moderation of comments, and the form RPCs are callable only by the server (ADR-011).

**Q24. Could someone fill your storage with uploads?**
Uploads to the private intake bucket happen only through one-time signed links issued after the CAPTCHA, at most 5 files of 20 MB, with bucket type/size limits.

**Q25. How do you prevent XSS?**
Rich text is sanitised with DOMPurify, iframes allowed only from YouTube, Vimeo, Facebook and Spotify; comments and form text are rendered as plain text; meta tags are escaped.

**Q26. Where are secrets kept?**
Only the anon key and Turnstile site key are public. The service-role key and Turnstile secret live in Vercel environment variables and are used only by `/api` functions.

**Q27. Do you use HTTPS and security headers?**
Yes: HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy and a CSP (currently report-only; enforcing is on the roadmap).

**Q28. What is your biggest remaining security risk?**
Admin account takeover, because MFA is not yet required. Mitigations: invite-only accounts, quick deactivation; recommendation R-03 is to enforce MFA for SA and EE.

**Q29. Is there an audit trail?**
Role, activation, publishing-access and Salingkusog team changes go to `audit_log`; article status changes and notes to `article_activity`; the last scorer of each game is `updated_by`. A full score-edit history is future work.

# 5. Privacy

**Q30. What personal data do you collect about athletes?**
Only name, program (course/year) and an optional photo. No birth dates, student numbers or eligibility documents are stored (`sk_athletes`).

**Q31. How does the system comply with RA 10173?**
Transparency (`/privacy`), proportionality (minimal fields), security (RLS, private tables and bucket, HTTPS), and data-subject rights by request. Open items: a privacy section on athletes, photo consent, retention for forms, a named DPO contact (AMR-DOC-06 §11).

**Q32. Do you track readers?**
Only first-party, cookie-less statistics: a visitor id hashed with a daily salt that is deleted after two days, no IP stored, DNT/GPC respected; raw events deleted after 13 months.

**Q33. Who can see commenter emails?**
Editors only; emails are in a separate table (`article_comment_private`) with editor-only RLS.

**Q34. Why do you also use Vercel Web Analytics?**
It was in v1 and kept by the team's choice; the privacy page mentions it (`docs/v2/STATS.md`).

# 6. Salingkusog module

**Q35. How does the bracket fill itself in?**
Build schedule creates games whose sides have sources (seed, winner of, loser of, rank). After each game change a trigger calls `app.sk_resolve`, which fills the next games; it never changes a game that has started (ADR-012).

**Q36. What if a score is corrected after the next game started?**
The database refuses the correction with "… has already started, so its teams can't change", so the bracket cannot become inconsistent.

**Q37. Can a knockout game end in a tie?**
No; the trigger `app.sk_knockout_needs_winner` and the scorekeeper both refuse it.

**Q38. How are round-robin standings ranked?**
Wins, then point difference, then head-to-head among tied teams, then points scored, then seed — identical in SQL (`app.sk_rr_table`) and TypeScript.

**Q39. How do you handle dance or swimming where all factions compete together?**
A contest: one session (`sk_matches.is_contest`) with entries per faction (`sk_entries`); times rank automatically (unit "s" lowest wins), judged events take places; DNS/DNF/DQ get no place (ADR-014).

**Q40. Why do medals need manual confirmation?**
Official results should be checked by a person. The system suggests the podium and shows "Ready to confirm", but nothing counts until staff save it (ADR-013).

**Q41. How many sports and events does the 2026 edition have?**
From the live data on 2026-10-19: 4 factions, 27 sports, 74 events, 21 venues, 169 games and sessions.

**Q42. Can the scoring be done on phones?**
Yes; the scorekeeper is designed for one-handed use with large buttons and a sticky action bar; changes save after a short pause and reach readers in seconds.

# 7. Testing and quality

**Q43. How did you test the system?**
255 unit/component tests (Vitest), 278 SQL checks against a real PostgreSQL, lint, strict type-check, build, a contrast script, and an accessibility/overflow sweep of 53 screens; results in AMR-DOC-08.

**Q44. Do you have end-to-end tests?**
Not yet; 20 manual cases are written and scheduled. Playwright E2E is on the roadmap. We say this openly.

**Q45. How do requirements trace to tests?**
The RTM maps all 115 requirements: 98 to automated suites, 17 to manual cases; none uncovered (AMR-DOC-08 Appendix B).

**Q46. Did you find bugs through testing?**
Yes — e.g. a final placed in the semifinal column, raw errors on out-of-range pages, an RPC callable by anonymous users, unlimited anonymous uploads; all fixed (AMR-DOC-08 §8).

# 8. Performance and scalability

**Q47. How fast is the site?**
Production Lighthouse on mobile (2026-10-18): performance 67–72, accessibility, best practices and SEO 100. Image-size and caching fixes were deployed after that run.

**Q48. What happens when thousands view the medal tally at once?**
Static assets come from Vercel's CDN; slow-changing public data is edge-cached for 60 s; live data goes to Supabase, which scales on its managed infrastructure; queries are indexed. A load test is future work.

**Q49. What are your scaling limits?**
Mostly the Supabase and Vercel plan quotas [TO CONFIRM plan]; the architecture itself needs no change to scale up a tier.

# 9. Operations and failure

**Q50. What if Supabase goes down during the games?**
Scorekeepers keep paper sheets and enter results afterwards; the computed tally updates once data is in. Recovery from backups is described in the runbook.

**Q51. What if Vercel goes down?**
The site is unavailable until Vercel recovers or a previous deployment is promoted; data is safe in Supabase.

**Q52. How do you back up data?**
Supabase backups (plan-dependent [TO CONFIRM]) plus manual exports before SQL changes and before event week; a restore drill is recommended each semester.

**Q53. How do you roll back a bad release?**
Promote the previous Vercel deployment; re-run the previous SQL file from git for functions and policies; restore a backup for data.

# 10. Process, limitations and future

**Q54. How was the project managed?**
One feature per branch, gates before every merge, plans approved before large changes, 82 merged branches and a progress log (AMR-DOC-12).

**Q55. What would you do next?**
Privacy updates for athletes and MFA (P1), CI and CSP enforcement (P2), score history, E2E tests, notifications (P3), then heats, judges' score sheets and offline scoring (P4) (AMR-DOC-13 §4).
