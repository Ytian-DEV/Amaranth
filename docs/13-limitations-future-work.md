---
title: "Limitations, Known Issues and Future Work"
subtitle: "Amaranth v2 — honest list of what is missing and a prioritised roadmap"
version: "1.0"
date: "2026-10-19"
---

# Document control

| Field | Value |
|---|---|
| Title | Limitations, Known Issues and Future Work |
| Document ID | AMR-DOC-13 |
| Version | 1.0 |
| Date | 2026-10-19 |
| Author | Amaranth development team [TO CONFIRM: names] |
| Status | Final draft for defense |

# Contents

1. Limitations by design
2. Known issues
3. Security and privacy open items
4. Prioritised roadmap

\newpage

# 1. Limitations by design

| ID | Limitation | Why | Effect |
|---|---|---|---|
| LIM-01 | Readers have no accounts | Simpler privacy and support (ADR-007) | No saved articles, newsletters or personalisation |
| LIM-02 | English interface only | Scope | Filipino/Waray readers read English UI |
| LIM-03 | Straight finals only for timed events; no heats | Chosen for Salingkusog 2026 | Large fields need games entered by hand |
| LIM-04 | One entry per faction in contests | Chosen for Salingkusog 2026 | A faction cannot win two medals in one event |
| LIM-05 | Judged events record places, not judges' score sheets | Chosen by the user | No breakdown of scores per judge |
| LIM-06 | Medals need a person to confirm | Accuracy of official results (ADR-013) | One extra step per event |
| LIM-07 | Needs an internet connection | Thick client on managed services | Scorekeeping fails without signal |
| LIM-08 | No migration tool; SQL pasted by hand | Simplicity (ADR-002) | Manual deploy steps |
| LIM-09 | Edge-cached public data can be up to a minute old | Performance (ADR-010) | Live scores are not cached, other lists may lag |
| LIM-10 | v1 content not migrated | Fresh schema chosen | Old articles live only on the v1 site [TO CONFIRM] |

# 2. Known issues

| ID | Issue | Severity | Workaround | Evidence |
|---|---|---|---|---|
| KI-01 | No continuous integration | Medium | Run `npm run check` and `npm run db:test` before every merge | `.github/` has no workflows |
| KI-02 | `docs/v2/DB.md` partly out of date (intake upload policy, test counts, Realtime tables) | Low | Use AMR-DOC-04 and AMR-DOC-09 | `docs/v2/DB.md` |
| KI-03 | Content-Security-Policy in report-only mode | Medium | Check console; switch to enforcing | `vercel.json` |
| KI-04 | Database types written by hand | Low | Update with each schema change | `src/lib/database.types.ts` |
| KI-05 | Games entered before "Build schedule" do not advance automatically | Medium | Fill later rounds by hand or rebuild events with no games played | ADR-012 |
| KI-06 | A contest session opened at `/salingkusog/match/:id` shows an empty two-sided recap | Low | Cards do not link there; use the sport page | `RecapView.tsx` |
| KI-07 | Faction profiles list only two-sided games, not contest results | Low | Medals still counted | `factions.ts` |
| KI-08 | No email notifications for workflow steps | Medium | Check the dashboard and "Needs review" | no mail service |
| KI-09 | No self-service profile screen for staff | Low | Editors update contributors | FR-008 |
| KI-10 | Development fixture for the editorial board contains real names and photos | Low | Replace with fictional data | `src/dev/DevRoutes.tsx` |
| KI-11 | Old Katalon project in ignored `Amaranth/` folder | Low | Delete or archive | `.gitignore` |
| KI-12 | No browser end-to-end tests | Medium | Manual cases MT-01 – MT-20 | AMR-DOC-08 |
| KI-13 | No history of score edits (only last editor) | Medium | Ask the team; check `updated_by` | `sk_matches.updated_by` |

# 3. Security and privacy open items

From AMR-DOC-06 §12: R-01 enforce CSP; R-02 confirm sign-ups disabled; R-03 MFA for admins; R-04 leaked-password protection; R-05 CI; R-06 generated types; R-07 score history; R-08 orphan intake files; R-09 retention for forms and comments; R-10 privacy page section on athletes; R-11 privacy contact/DPO; R-12 consent for athlete photos.

# 4. Prioritised roadmap

| Priority | Item | Addresses | Effort |
|---|---|---|---|
| P1 (before/at the games) | Update `/privacy` for athletes; consent process for photos | R-10, R-12 | S |
| P1 | Confirm Supabase Auth settings; enable MFA for SA and EE | R-02, R-03, R-04 | S |
| P1 | Run manual tests MT-01 – MT-20 and record results | KI-12 | S |
| P2 | GitHub Actions running `npm run check` and `npm run db:test` | KI-01, R-05 | S |
| P2 | Enforce CSP after a clean preview | KI-03, R-01 | S |
| P2 | Score and result change history table with a viewer | KI-13, R-07 | M |
| P2 | Retention jobs for comments, submissions, events, contact messages | R-09 | S |
| P3 | Playwright end-to-end tests for the main flows | KI-12 | M |
| P3 | Generated database types (Supabase CLI) | KI-04, R-06 | S |
| P3 | Email or in-app notifications (submitted, returned, published) | KI-08 | M |
| P3 | Self-service profile page | KI-09 | S |
| P3 | Contest results on faction profiles; contest-aware recap page | KI-06, KI-07 | S |
| P4 | Heats → finals and multiple entries per faction | LIM-03, LIM-04 | L |
| P4 | Judges' score sheets with averaging | LIM-05 | M |
| P4 | Offline scorekeeping with later sync | LIM-07 | L |
| P4 | Filipino/Waray interface | LIM-02 | M |
| P4 | Import of v1 articles | LIM-10 | M |

Effort: S ≈ under a day, M ≈ a few days, L ≈ a week or more for one developer [estimates].
