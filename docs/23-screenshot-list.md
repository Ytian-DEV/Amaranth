---
title: "Screenshot List"
subtitle: "Every screen to capture, with its route and the captured file"
version: "1.0"
date: "2026-10-19"
---

# Document control

| Field | Value |
|---|---|
| Title | Screenshot List |
| Document ID | AMR-DOC-23 |
| Version | 1.0 |
| Date | 2026-10-19 |
| Status | Final draft |

# Contents

1. How the screenshots were made
2. Captured screens
3. Screens still to capture on a seeded instance
4. Excluded screens

\newpage

# 1. How the screenshots were made

Captured on 2026-10-19 with headless Chrome against the local development server, using the `/dev` fixture screens, which show **fictional data** (fictional factions, athletes and staff such as "Wes Writer"). Desktop 1440×900, phone 390×844. Files are in `docs/screenshots/`.

# 2. Captured screens

| File | Screen | Fixture route | Real route |
|---|---|---|---|
| `pub-home.png`, `pub-home-mobile.png` | Home | `/dev/home` | `/` |
| `pub-section.png` | Section page | `/dev/section` | `/:section` |
| `pub-article.png`, `pub-article-mobile.png` | Article | `/dev/article` | `/article/:slug` |
| `pub-search.png` | Search | `/dev/search` | `/search` |
| `pub-archives.png` | Archives | `/dev/archives` | `/archives` |
| `pub-submit.png` | Submit a story | `/dev/submit` | `/submit` |
| `pub-submit-event.png` | Report an event | `/dev/submit/event` | `/submit/event` |
| `pub-contact.png` | Contact | `/dev/contact` | `/contact` |
| `pub-sports-landing.png` | Sports landing | `/dev/sports` | `/sports` |
| `sk-tally.png`, `sk-tally-mobile.png` | Medal tally | `/dev/salingkusog` | `/salingkusog` |
| `sk-tally-final.png` | Official and final tally | `/dev/salingkusog/final` | `/salingkusog` |
| `sk-schedule.png` | Schedule and results | `/dev/salingkusog/schedule` | `/salingkusog/schedule` |
| `sk-winners.png` | Winners | `/dev/salingkusog/winners` | `/salingkusog/winners` |
| `sk-faction.png` | Faction profile | `/dev/salingkusog/factions` | `/salingkusog/factions/:slug` |
| `sk-bracket.png` | Auto bracket | `/dev/salingkusog/sports/auto-bracket` | `/salingkusog/sports/:slug` |
| `sk-round-robin.png` | Round robin + final | `/dev/salingkusog/sports/auto-round-robin` | `/salingkusog/sports/:slug` |
| `sk-contest-results.png` | Contest results | `/dev/salingkusog/sports/contest-race` | `/salingkusog/sports/:slug` |
| `sk-contest-lineup.png` | Contest line-up | `/dev/salingkusog/sports/contest-dance` | `/salingkusog/sports/:slug` |
| `sk-match-recap.png` | Match recap | `/dev/salingkusog/match` | `/salingkusog/match/:id` |
| `sk-venues.png` | Venue guide | `/dev/salingkusog/venues` | `/salingkusog/venues` |
| `sk-countdown.png` | Countdown | `/dev/countdown` | `/salingkusog-2026/countdown` |
| `adm-login.png` | Staff sign in | `/admin/login` | `/admin/login` |
| `adm-access-pending.png` | Access pending | `/dev/auth/pending` | `/admin` (inactive user) |
| `adm-dashboard.png` | Dashboard (editor) | `/dev/admin` | `/admin` |
| `adm-dashboard-writer.png` | Dashboard (writer) | `/dev/admin/writer` | `/admin` |
| `adm-articles.png` | Articles list | `/dev/admin/articles` | `/admin/articles` |
| `adm-editor.png` | Article editor + workflow | `/dev/admin/editor` | `/admin/articles/:id` |
| `adm-media.png` | Media library | `/dev/admin/media` | `/admin/media` |
| `adm-intake.png` | Submission review | `/dev/admin/intake` | `/admin/submissions/:id` |
| `adm-sk-team.png` | Salingkusog team | `/dev/admin/salingkusog-team` | `/admin/salingkusog/team` |
| `adm-sk-setup.png` | Salingkusog setup (full page) | `/dev/admin/salingkusog-setup` | `/admin/salingkusog/edition` … `/import` |
| `adm-sk-scores.png` | Games by day | `/dev/admin/salingkusog-scores` | `/admin/salingkusog/scores` |
| `adm-sk-scorekeeper.png`, `-mobile.png` | Scorekeeper | `/dev/admin/salingkusog-scorekeeper` | `/admin/salingkusog/scores/:id` |
| `adm-sk-results.png` | Results and medals | `/dev/admin/salingkusog-results` | `/admin/salingkusog/results/:eventId` |
| `adm-sk-awards.png` | Awards and athletes | `/dev/admin/salingkusog-awards` | `/admin/salingkusog/awards` |
| `adm-sk-cards.png` | Social cards | `/dev/admin/salingkusog-cards` | `/admin/salingkusog/awards` |

# 3. Screens still to capture on a seeded instance

These have no fixture screen and need a demo database with fictional data (AMR-DOC-20 §3):

| Screen | Route |
|---|---|
| Staff accounts and publishing access | `/admin/staff` |
| Invites | `/admin/staff/invites` |
| Settings tabs (Front page, Comments, Inbox, Sections, Desks, General) | `/admin/settings/*` |
| Statistics | `/admin/statistics` |
| Build schedule modal | `/admin/salingkusog/sports` |
| Create contest modal and contest scorekeeper | `/admin/salingkusog/sports`, `/admin/salingkusog/scores/:id` |
| Schedule import with preview | `/admin/salingkusog/import` |
| Privacy page | `/privacy` |

# 4. Excluded screens

`/dev/about` and `/dev/editorial-board` were **not captured**: their fixtures contain real names and photos of editorial-board members (KI-10). Use a seeded demo board with fictional names instead.
