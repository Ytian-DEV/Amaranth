**Title:** Brand 2026, Salingkusog live tally upgrades, publishing permissions and form security

## Summary

Everything merged to `develop` since PR #5.

- **Brand 2026** (approved by the EIC): palette from the logo (deep forest, logo lime for fills, lime ink for text), Montserrat for text and Cinzel for the wordmark, a light masthead with the "In the name of TRUTH" motto, the deep-green nav, category pills, rounder cards, branded section landings and article page. Hovers are lime. Contrast checked (39/39 AA).
- **Salingkusog Medal Tally**
  - Points race in 1h / 3h / 6h / 12h steps or day by day (new RPC `sk_points_timeline`).
  - Chart lines rise from 0 and the podium and table count up, then move to new totals live.
  - "Results in: X of Y matches" with a progress bar; once every match is final the page reads **Official and final medal tally** and names the overall champion and runners-up.
  - Medal table rows 1–3 are tinted gold, silver and bronze.
  - Medals and results now update for readers instantly (Realtime on `sk_placements`), not only scores.
- **Literary** hero shows the lead story's photo on the green cover.
- **Loading:** the Amaranth logo rotates while a page loads.
- **Publishing permissions:** only the Super admin, Executive Editor, Managing editor and the new **Business Manager** role publish or schedule articles, plus staff given access in Staff → Accounts → "Can publish and schedule articles". Only the Super admin, Executive Editor and Managing editor can give that access; changes are audited. Everyone else saves drafts and submits for review. The database enforces it.
- **Form security:** comments, story and event submissions and contact go through `POST /api/submit` with a Cloudflare Turnstile check (invisible for most readers). Attachments upload with one-time signed links issued after the check. The form functions and intake uploads are closed to direct browser calls.
- **Hardening from the security review:** an out-of-range page number shows an empty page instead of a database error; footer social links accept only http(s); a Content-Security-Policy runs in report-only mode; a React console warning is fixed.

## Database — already applied

`schema.sql`, `salingkusog.sql` and `stats.sql` were re-pasted on 2026-10-19 and checked live (form functions closed to browsers, anonymous intake upload refused, `sk_points_timeline` and `profiles.can_publish` present). 233 local SQL checks pass.

## Environment variables (Vercel, Production + Preview)

| Name | Value |
|---|---|
| `VITE_TURNSTILE_SITE_KEY` | Turnstile widget site key (public) |
| `TURNSTILE_SECRET_KEY` | Turnstile secret key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (also used by statistics) |

## Manual test checklist (on the preview)

- [ ] Send a contact message, post a comment, and submit a story **with an attachment**; each arrives in the newsroom.
- [ ] As a staff writer: the editor offers only "Submit for review". After a Managing editor turns on "Can publish" in Staff → Accounts, Publish and Schedule appear.
- [ ] As a Business Manager: can publish, but has no publishing switch in Staff.
- [ ] Record a medal in the scorekeeper with `/salingkusog` open in another window: the tally, points race and podium update within a few seconds.
- [ ] Points race range switch (1h / 3h / 6h / 12h / Day).
- [ ] Browser console on `/`, `/contact` and an article: no `Content-Security-Policy` warnings (then switch the header to enforcing).

## Checks

`npm run check` (lint, typecheck, 234 tests, build) and `npm run db:test` (233 checks) pass.

## Known follow-ups

- Switch `Content-Security-Policy-Report-Only` to `Content-Security-Policy` once the preview shows no warnings.
- Supabase Auth: consider turning off public sign-ups, leaked-password protection, and MFA for the Super admin and Executive Editor.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
