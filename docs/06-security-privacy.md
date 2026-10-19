---
title: "Security and Privacy Document"
subtitle: "Amaranth v2 — authentication, authorisation, threat model and Data Privacy Act compliance"
version: "1.0"
date: "2026-10-19"
---

# Document control

| Field | Value |
|---|---|
| Title | Security and Privacy Document |
| Document ID | AMR-DOC-06 |
| Version | 1.0 |
| Date | 2026-10-19 |
| Author | Amaranth development team [TO CONFIRM: names] |
| Status | Final draft for defense |
| Classification | Internal; contains no secrets or personal data |

# Contents

1. Security objectives
2. Authentication
3. Authorisation and RBAC
4. Row Level Security strategy
5. Threat model (STRIDE)
6. Input validation and output encoding
7. File upload safety
8. Secrets handling
9. Transport and browser security
10. Audit logging and accountability
11. Privacy and the Data Privacy Act of 2012 (RA 10173)
12. Security review findings and open items

\newpage

# 1. Security objectives

| ID | Objective |
|---|---|
| SO-1 | Only invited, active staff can use the newsroom. |
| SO-2 | Each role can do only what its job requires, even if the user bypasses the UI. |
| SO-3 | Unpublished content, private contact details and statistics never reach readers. |
| SO-4 | Public forms cannot be abused to spam, flood storage or inject scripts. |
| SO-5 | Secrets never reach the browser. |
| SO-6 | Changes to access and to official results are traceable. |
| SO-7 | Personal data is collected minimally, protected and handled per RA 10173. |

# 2. Authentication

| Aspect | Implementation | Evidence |
|---|---|---|
| Method | Email and password through Supabase Auth (GoTrue); sessions as JWTs refreshed by supabase-js | `LoginPage.tsx`, `AuthProvider.tsx` |
| Account creation | By invitation only; `app.handle_new_user` gives a role only to emails in `staff_invites`; other sign-ups get an inactive profile with no access | `schema.sql` |
| Password reset | `resetPasswordForEmail` → emailed link → `/admin/set-password` (`updateUser`) | `ForgotPasswordPage.tsx`, `SetPasswordPage.tsx` |
| Inactive accounts | `app.current_role()` returns null when `is_active` is false, so every RLS check fails; the UI shows "access pending" | `guards.tsx` |
| Sign-ups switch | Supabase "allow new users to sign up" should be off (staff are invited) | `docs/v2/DB.md` §2.6 [TO CONFIRM current setting] |
| MFA | Not configured in the code; Supabase supports TOTP MFA | Recommendation R-03 |
| Leaked-password protection | Supabase dashboard option | Recommendation R-04 [TO CONFIRM] |

# 3. Authorisation and RBAC

**Roles:** `super_admin` (SA), `editor_in_chief` / Executive Editor (EE), `managing_editor` (ME), `business_manager` (BM), `section_editor` (SE), `staff_writer` (SW), `contributor` (CO); plus the **Salingkusog team** group (`sk_team`) and anonymous readers.

**Permission helpers** (private `app` schema, `security definer`, `search_path = ''`):

| Helper | Grants |
|---|---|
| `is_staff()` | any active role |
| `is_admin()` | SA, EE |
| `can_publish()` | SA, EE, ME (front page, settings ticker, issues, editorial board, archives, granting publishing access) |
| `can_publish_articles()` | `can_publish()` + BM + profiles with `can_publish = true` |
| `is_editor()` | SA, EE, ME, SE |
| `can_edit_section(s)` | `can_publish()` or SE assigned to `s` |
| `can_view_stats()` | SA, EE, ME |
| `can_manage_sk_team()` | SA, EE, ME |
| `can_edit_sk()` | `can_manage_sk_team()` or active staff in `sk_team` |

**RBAC matrix (summary).** ✔ allowed · ○ own/assigned only · — denied. The full matrix is in AMR-DOC-00 §8.

| Capability | SA | EE | ME | BM | SE | SW | CO | SKT | Reader |
|---|---|---|---|---|---|---|---|---|---|
| Write drafts | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | (own role) | — |
| Review / reject | ✔ | ✔ | ✔ | — | ○ | — | — | — | — |
| Publish / schedule | ✔ | ✔ | ✔ | ✔ | granted | granted | granted | — | — |
| Grant publishing access | ✔ | ✔ | ✔ | — | — | — | — | — | — |
| Roles, invites, activation | ✔ | ✔ (no SA) | — | — | — | — | — | — | — |
| Settings (sections, desks, general) | ✔ | ✔ | — | — | — | — | — | — | — |
| Front page, ticker, board, issues | ✔ | ✔ | ✔ | — | — | — | — | — | — |
| Moderate comments, intake, inbox | ✔ | ✔ | ✔ | — | ✔ | — | — | — | — |
| Statistics | ✔ | ✔ | ✔ | — | — | — | — | — | — |
| Audit log | ✔ | ✔ | — | — | — | — | — | — | — |
| Salingkusog data entry | ✔ | ✔ | ✔ | — | — | — | — | ✔ | — |
| Salingkusog team and countdown | ✔ | ✔ | ✔ | — | — | — | — | — | — |
| Read published content | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Comment, submit, contact | via `/api/submit` for everyone | | | | | | | | ✔ |

**Separation of duties built in:**

- Only SA grants or removes the super_admin role; at least one active SA must remain (`profiles_guard`).
- Writers cannot publish unless explicitly granted; the grant is audited.
- The Business Manager can publish but cannot grant access or change settings.
- Medals must be confirmed by a person (`sk_set_placements`), not written automatically.

# 4. Row Level Security strategy

1. RLS is enabled on **all 50 tables**; 97 policies (including storage) define access (AMR-DOC-04 Appendix F).
2. Policies call the helpers above, so a role change takes effect everywhere at once.
3. Triggers enforce rules that depend on the change: workflow transitions (`app.article_before_write`), role and access changes (`app.guard_profile_update`), Salingkusog consistency (`app.sk_inherit_edition`, `app.sk_knockout_needs_winner`, `app.sk_resolve`).
4. Views use `security_invoker`, so they never widen access.
5. RPCs that must respect RLS are `security invoker`; `security definer` functions validate their callers (`transition_article` invoker; `set_publish_access` checks `app.can_publish()`; `sk_set_placements` checks `app.can_edit_sk()`).
6. Grants are explicit: execution is revoked from `public` and `anon` and granted per function (`schema.sql` "Function privileges"); the four form RPCs are executable by `service_role` only.
7. 278 SQL checks verify the rules, including that anonymous users cannot read submissions, write any table, upload to `intake`, or call staff RPCs (`public_access.test.sql`, live probe on 2026-10-19 reported in `docs/v2/PROGRESS.md`).

\newpage

# 5. Threat model (STRIDE)

Assets: unpublished articles, staff accounts, private emails, official Salingkusog results, the site's reputation, storage quota.

| # | STRIDE | Threat | Mitigation in the code | Residual risk |
|---|---|---|---|---|
| T1 | Spoofing | Stolen or guessed staff password | Supabase Auth; invite-only roles; inactive accounts powerless | No MFA yet (R-03) |
| T2 | Spoofing | Self-registration to gain access | `handle_new_user` gives no role without an invite | Low |
| T3 | Spoofing | Bots posing as readers on forms | Turnstile verified server-side; honeypot | Low |
| T4 | Tampering | Writer publishes or edits a locked article by calling the API directly | Trigger enforces transitions and locks; RLS on update | Low |
| T5 | Tampering | Member escalates own role | `profiles_guard`; only SA/EE change roles; only SA grants SA | Low |
| T6 | Tampering | Altering Salingkusog results or started games | RLS `can_edit_sk`; started games never auto-change; medals need confirmation; `updated_by` | No full score history (R-07) |
| T7 | Tampering | Forged form ticket to skip the CAPTCHA | HMAC-SHA-256 ticket with expiry bound to content; service key as HMAC key | Low |
| T8 | Repudiation | Denying a role change or publishing-access grant | `audit_log` entries with actor and before/after | Medium for content edits (activity log covers status changes, not every edit) |
| T9 | Information disclosure | Readers reading drafts or private emails | RLS `app.is_live`; emails in `article_comment_private` and intake tables (editors only) | Low |
| T10 | Information disclosure | Reader tracking or IP collection | Hashed ids with 2-day salts; IP never forwarded; DNT/GPC honoured | Low |
| T11 | Information disclosure | Secrets in the bundle | Secrets used only in `api/` | Low |
| T12 | Information disclosure | Stored XSS through article or comment HTML | DOMPurify with embed allow-list; comments rendered as text | Low |
| T13 | Denial of service | Form flooding | Turnstile, per-email rate limits, body size limits | Platform DoS handled by Vercel/Supabase |
| T14 | Denial of service | Storage exhaustion via uploads | Uploads only through signed links after CAPTCHA; 5 files × 20 MB; bucket limits | Orphan files if a user abandons after upload (R-08) |
| T15 | Denial of service | Traffic spikes during events | Edge cache for public reads; CDN for assets | Live data hits Supabase directly |
| T16 | Elevation of privilege | Calling private helpers through the API | Helpers in non-exposed `app` schema; `search_path = ''` | Low |
| T17 | Elevation of privilege | Clickjacking the newsroom | `X-Frame-Options: SAMEORIGIN`, CSP `frame-ancestors 'self'` (report-only) | Enforce CSP (R-01) |

\newpage

# 6. Input validation and output encoding

| Layer | Validation |
|---|---|
| Browser | Field validation for convenience (`validate.ts`), file type and size checks (`uploads.ts`) |
| `/api/submit` | Form kind allow-list; field allow-list per form; max value length 20,000; max body 200 KB; file count, type and size; Turnstile; ticket verification |
| Database | `app.check_email`, `app.check_text` length limits; check constraints (slugs, scores, places, statuses); enums; foreign keys; triggers |
| Output | Article and recap HTML sanitised with DOMPurify (iframes only from YouTube, Vimeo, Facebook, Spotify); external links get `rel="noopener noreferrer"`; comments and form text rendered as plain text by React; crawler meta tags escaped (`escapeHtml` in `api/_lib/seo.ts`) |
| URLs | Footer social links accept only `http(s)` (`settings.ts`); middleware slugs restricted to `[a-z0-9-]` before querying |
| Query injection | All database access through parameterised PostgREST/RPC calls; no string-built SQL from user input in the app |

# 7. File upload safety

| Bucket | Controls |
|---|---|
| `media` (public) | Staff only; images only (JPEG, PNG, WebP, AVIF, GIF); 10 MB; compressed to WebP in the browser; deletes limited to the owner or editors; in-use assets cannot be deleted |
| `archives` (public) | Publishers only; PDF and images; 60 MB |
| `intake` (private) | No direct uploads; one-time signed upload links from `/api/submit` after Turnstile; max 5 files × 20 MB; JPEG, PNG, WebP, PDF, text, Word; file names sanitised to `[\w-]` with a random folder; only editors can read or delete |

The bucket MIME and size limits are enforced by Supabase Storage itself, in addition to the checks in code.

# 8. Secrets handling

| Secret | Where it lives | Used by |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel environment (Production, Preview); `.env.local` for local dev | `api/e.ts`, `api/submit.ts` |
| `TURNSTILE_SECRET_KEY` | Vercel environment | `api/submit.ts` |
| Supabase anon key, Turnstile site key | Public by design (`VITE_` variables) | Browser |

Rules: no secrets in the repository (`.env*` ignored except `.env.example` placeholders); `VITE_`-prefixed variables are the only ones bundled into the browser; the service key also serves as the HMAC key for form tickets; local development uses Cloudflare's published test keys when no Turnstile key is set.

# 9. Transport and browser security

`vercel.json` sets on every response: `Strict-Transport-Security: max-age=63072000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy` (camera, microphone, geolocation, interest-cohort off), and `Content-Security-Policy-Report-Only` limiting scripts to the site and Cloudflare challenges, connections to Supabase and Cloudflare, and frames to Cloudflare and approved video hosts. All traffic is HTTPS (Vercel and Supabase).

# 10. Audit logging and accountability

| Event | Where recorded |
|---|---|
| Role or activation change | `audit_log` action `profile.access` (before/after) |
| Publishing access change | `audit_log` action `profile.publish_access` |
| Salingkusog team add/remove | `audit_log` actions `salingkusog.team.add` / `.remove` |
| Article created, status changed, notes | `article_activity` (actor, from, to, note) |
| Article snapshots | `article_revisions` (newest 50) |
| Last change to a game | `sk_matches.updated_by` |
| Comment moderation | `article_comments.moderated_by` |
| Intake review | `reviewer_id`, `reviewed_at` on submissions and event reports |

Only SA and EE can read `audit_log`.

\newpage

# 11. Privacy and the Data Privacy Act of 2012 (RA 10173)

## 11.1 Personal data inventory

| Data subject | Data collected | Purpose | Who can see it | Retention (as implemented) |
|---|---|---|---|---|
| Staff | Email, display name, role, optional bio and avatar; newsroom active time | Accounts, bylines, workload | Staff (names); SA/EE/ME (activity) | Account lifetime; activity 24 months |
| Commenters | Name (public once approved), email (private) | Moderation and replies | Editors | Not automatically deleted [gap R-09] |
| Story submitters | Name, email, affiliation, submission, attachments | Editorial review and credit | Editors | Not automatically deleted [gap R-09] |
| Event reporters | Organisation, contact name, email, event details | Coverage planning | Editors | Not automatically deleted [gap R-09] |
| Contact senders | Name, email, message | Replies | Editors | Not automatically deleted [gap R-09] |
| Readers | Hashed daily visitor id, page, source, device family, reading time, scroll | Readership statistics | SA/EE/ME (aggregates) | Raw 13 months, aggregates indefinitely; salts 2 days |
| Salingkusog athletes | Name, program (course/year), optional photo, results, stat lines, award quotes | Publishing intramural results | **Public** once the edition is published | Kept with the edition [TO CONFIRM policy] |
| Editorial board | Name, position, photo | About the publication | Public | Per term |

**Not collected by the system:** birth dates, student numbers, addresses, phone numbers of athletes, medical or eligibility documents. `sk_athletes` has only name, slug, program and photo. If the intramurals organisers collect **eligibility forms**, they are outside this system [TO CONFIRM who holds them and where].

## 11.2 Data Privacy Act principles

| RA 10173 principle | How the system supports it | Gap / action |
|---|---|---|
| Transparency | `/privacy` explains statistics, forms, staff activity and rights | Add a section on Salingkusog athletes and published results (R-10) |
| Legitimate purpose | Data used only for publishing, moderation, statistics | — |
| Proportionality (minimisation) | Athletes: name, program, photo only; stats: hashed, no IP, coarse device info | — |
| Security of personal data (Sec. 20) | RLS, private tables for emails, private bucket for intake, HTTPS, secrets server-side | MFA for admins (R-03) |
| Data subject rights (Sec. 16) | `/privacy` explains access, correction, deletion; requests via the contact page | Define a written procedure and a Data Protection Officer contact (R-11) [TO CONFIRM VSU DPO] |
| Retention | Stats retention enforced by `app.stats_nightly` | Retention for intake, comments and athlete data (R-09) |
| Consent for athletes' photos | — | Obtain consent through the intramurals organisers before publishing photos (R-12) [TO CONFIRM] |
| Breach notification | Supabase/Vercel logs | Incident procedure in AMR-DOC-09 §9; NPC notification within 72 hours where required [TO CONFIRM with VSU DPO] |

# 12. Security review findings and open items

A security review was carried out on 2026-10-19 (`docs/v2/PROGRESS.md`, `fix/security-hardening`, `feature/turnstile-captcha`). Fixed: page-number range errors, open intake uploads, anonymous access to `set_publish_access`, unsafe social-link schemes, form spam (Turnstile). Open recommendations:

| ID | Recommendation | Priority |
|---|---|---|
| R-01 | Switch the Content-Security-Policy from report-only to enforcing after checking the browser console on a preview | High |
| R-02 | Confirm "allow new users to sign up" is disabled in Supabase Auth | High |
| R-03 | Require MFA for Super admin and Executive Editor accounts | High |
| R-04 | Enable leaked-password protection in Supabase Auth | Medium |
| R-05 | Add CI so security tests (SQL checks) run on every push | Medium |
| R-06 | Replace hand-written database types with generated ones | Low |
| R-07 | Keep a history of score and result changes (who changed what) | Medium |
| R-08 | Clean up intake files never attached to a submission | Low |
| R-09 | Define and automate retention for comments, submissions, event reports and contact messages | Medium |
| R-10 | Extend `/privacy` to cover Salingkusog athletes and published results | High |
| R-11 | Name a privacy contact or DPO and document how requests are handled | Medium |
| R-12 | Obtain consent for publishing athletes' photos | High |
