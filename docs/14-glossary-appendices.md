---
title: "Glossary and Appendices"
subtitle: "Amaranth v2 — acronyms, newsroom terms and Salingkusog terms"
version: "1.0"
date: "2026-10-19"
---

# Document control

| Field | Value |
|---|---|
| Title | Glossary and Appendices |
| Document ID | AMR-DOC-14 |
| Version | 1.0 |
| Date | 2026-10-19 |
| Author | Amaranth development team [TO CONFIRM: names] |
| Status | Final draft for defense |

# Contents

1. Acronyms
2. Newsroom terms
3. Salingkusog terms
4. Roles
5. Document index

\newpage

# 1. Acronyms

| Acronym | Meaning |
|---|---|
| ADR | Architecture decision record |
| API | Application programming interface |
| CDN | Content delivery network |
| CI | Continuous integration |
| CMS | Content management system (the newsroom) |
| CSP | Content-Security-Policy (browser security header) |
| CSV | Comma-separated values (spreadsheet file) |
| DFD | Data flow diagram |
| DNS / DNF / DQ | Did not start / did not finish / disqualified |
| DNT / GPC | Do Not Track / Global Privacy Control (browser privacy signals) |
| DPO | Data Protection Officer |
| ERD | Entity–relationship diagram |
| FR / NFR | Functional / non-functional requirement |
| HMAC | Hash-based message authentication code (used to sign form tickets) |
| HSTS | HTTP Strict Transport Security |
| JWT | JSON Web Token (the signed-in session) |
| MFA | Multi-factor authentication |
| NPC | National Privacy Commission (Philippines) |
| OG | Open Graph (link-preview tags) |
| RA 10173 | Republic Act No. 10173, the Data Privacy Act of 2012 |
| RBAC | Role-based access control |
| RLS | Row Level Security (PostgreSQL) |
| RPC | Remote procedure call (a database function called by the app) |
| RTM | Requirements traceability matrix |
| SDD / SRS | Software design document / software requirements specification |
| SPA | Single-page application |
| SQL | Structured Query Language |
| STRIDE | Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege |
| UC | Use case |
| VSU | Visayas State University |
| WBS | Work breakdown structure |
| WCAG | Web Content Accessibility Guidelines |

# 2. Newsroom terms

| Term | Meaning |
|---|---|
| Article status | draft, submitted, in review, scheduled, published, archived, rejected |
| Live article | Published or scheduled with a publish time in the past |
| Publisher | Anyone allowed to publish or schedule (SA, EE, ME, BM, or granted) |
| Section / category | Site area (e.g. News) / subdivision of a section (e.g. Campus News) |
| Kicker | Short label above a headline |
| Dek | Subtitle or standfirst below the headline |
| Byline | Author credit, built from contributors or overridden |
| Contributor | A public byline record (staff, student, guest, faculty, alumni) |
| Revision | A saved snapshot of an article (autosave, manual, status) |
| Intake | Story submissions and event reports from the public |
| Front page slots | The lead story and literary folio pick chosen by managers |
| Ticker | The latest-headlines strip at the top of the site |
| Folio | The Literary Folio block on the home page |
| Print issue | An uploaded PDF of a printed edition |
| Turnstile | Cloudflare's CAPTCHA used on public forms |
| Edge cache | Short-lived copies of public data kept by Vercel's CDN |

# 3. Salingkusog terms

| Term | Meaning |
|---|---|
| Salingkusog | VSU's annual intramural games |
| Edition | One year of the games (dates, medal points, published flag) |
| Faction | A competing team in an edition (name, colour, logo) |
| Sport | A sport in an edition, with a category (ball games, athletics, aquatics, dance & cheer…) |
| Event | A competition inside a sport: division (men, women, mixed, open) and format |
| Format | Bracket (knockout), round robin, round robin + final, timed / measured, judged |
| Game (match) | One scheduled competition between two factions |
| Contest | One session in which every faction competes at once (dance, swimming, athletics…) |
| Entry | One faction's (or its athlete's) line-up slot and result in a contest |
| Seed | A faction's ranking used to build a bracket or round robin (seed 1 strongest) |
| Bye | A free pass to the next round when the field is not 2, 4, 8 or 16 |
| Bracket | Single-elimination draw from the first round to the final |
| Bronze game | Match between the semifinal losers for third place |
| Round robin | Every faction plays every other once |
| Source | Where a generated game's side comes from: a seed, the winner or loser of a game, or a standings rank |
| Placement | An official place (1st, 2nd, 3rd …) in an event; 1–3 carry gold, silver and bronze |
| Medal points | Points per medal for the overall standing (default 5 / 3 / 1) |
| Medal table | Computed table of medals, points and rank per faction |
| Points race | Cumulative points over time (by day or 1/3/6/12-hour steps) |
| Head-to-head | Wins and losses between two factions |
| Official and final medal tally | The tally once every match is final |
| Salingkusog team | Staff allowed to enter Salingkusog data |
| Scorekeeper | The live-scoring screen (or the person using it) |
| Awards | MVP of the Day, Athlete of the Day, Finals MVP |

# 4. Roles

| Role value | Display name | Short |
|---|---|---|
| `super_admin` | Super admin | SA |
| `editor_in_chief` | Executive Editor | EE |
| `managing_editor` | Managing editor | ME |
| `business_manager` | Business Manager | BM |
| `section_editor` | Section editor | SE |
| `staff_writer` | Staff writer | SW |
| `contributor` | Contributor | CO |
| (`sk_team` member) | Salingkusog team member | SKT |

# 5. Document index

| ID | Document | File |
|---|---|---|
| AMR-DOC-00 | Repository Audit Report | `00-audit-report.md` |
| AMR-DOC-01 | Project Overview and Vision | `01-project-overview.md` |
| AMR-DOC-02 | Software Requirements Specification | `02-srs.md` |
| AMR-DOC-03 | Software Design Document and Architecture | `03-architecture-sdd.md` |
| AMR-DOC-04 | Database Design | `04-database-design.md` |
| AMR-DOC-05 | UML and Process Diagrams | `05-diagrams.md` |
| AMR-DOC-06 | Security and Privacy | `06-security-privacy.md` |
| AMR-DOC-07 | API and Integration Reference | `07-api-reference.md` |
| AMR-DOC-08 | Test Documentation | `08-test-documentation.md` |
| AMR-DOC-09 | Deployment and Operations Runbook | `09-deployment-runbook.md` |
| AMR-DOC-10 | Maintenance and Developer Guide | `10-developer-guide.md` |
| AMR-DOC-11a–d | User Manuals | `11a` … `11d` |
| AMR-DOC-12 | Project Management | `12-project-management.md` |
| AMR-DOC-13 | Limitations and Future Work | `13-limitations-future-work.md` |
| AMR-DOC-14 | Glossary and Appendices | `14-glossary-appendices.md` |
| AMR-DOC-20 – 23 | Defense support | `20-demo-script.md` … `23-screenshot-list.md` |
