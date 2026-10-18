---
title: "UML and Process Diagrams"
subtitle: "Amaranth v2 — context, data flow, use case, activity, sequence, component, deployment, state and ER diagrams"
version: "1.0"
date: "2026-10-19"
---

# Document control

| Field | Value |
|---|---|
| Title | UML and Process Diagrams |
| Document ID | AMR-DOC-05 |
| Version | 1.0 |
| Date | 2026-10-19 |
| Author | Amaranth development team [TO CONFIRM: names] |
| Status | Final draft for defense |
| Sources | Mermaid files in `docs/diagrams/*.mmd`; PNG and SVG renders beside them |

# Contents

1. Diagram catalogue
2. Context and data flow
3. Use cases
4. Activities
5. Sequences
6. Structure: layers, components, classes, deployment
7. States
8. Entity–relationship diagrams

All diagrams are drawn from the code. Each caption names the files the diagram was checked against. Edit the `.mmd` source and re-render to update a diagram (AMR-DOC-10 §8).

# 1. Diagram catalogue

| ID | Diagram | File | Checked against |
|---|---|---|---|
| CTX-1 | System context | `ctx-1-context` | `vercel.json`, `src/lib/supabase.ts`, `api/` |
| DFD-0 | Data flow, level 0 | `dfd-0-level0` | feature modules |
| DFD-1 | Data flow, level 1 | `dfd-1-level1` | tables per module |
| UC-1 | Use cases: writers, editors, publishers | `uc-1-writers-editors` | `app.article_before_write` |
| UC-2 | Use cases: managers | `uc-2-managers` | role helpers, RLS |
| UC-3 | Use cases: Salingkusog team | `uc-3-salingkusog` | `app.can_edit_sk`, `sk_team` |
| UC-4 | Use cases: readers | `uc-4-readers` | public routes, `/api/submit` |
| ACT-1 | Article submission to publication | `act-1-article-publication` | workflow trigger |
| ACT-2 | Scheduling a game to an updated medal table | `act-2-game-to-medal-table` | `salingkusog.sql` |
| SEQ-1 | Login and role check | `seq-1-login-role` | `LoginPage.tsx`, `AuthProvider.tsx`, `guards.tsx` |
| SEQ-2 | Publish an article | `seq-2-publish-article` | `transition_article`, triggers |
| SEQ-3 | Enter results and medals | `seq-3-enter-results` | `sk_set_placements`, `ResultsTab.tsx` |
| SEQ-4 | Live score update | `seq-4-live-score` | `Scorekeeper.tsx`, `skData.ts` |
| SEQ-5 | Schedule import | `seq-5-schedule-import` | `scheduleCsv.ts`, `ImportTab.tsx` |
| SEQ-6 | Public form with CAPTCHA and attachments | `seq-6-public-form` | `api/submit.ts`, `src/lib/sendForm.ts` |
| ARCH-1 | Layered architecture | `arch-1-layers` | repository structure |
| CMP-1 | Front-end components | `cmp-1-components` | `src/` folders |
| CLS-1 | Domain class model | `cls-1-domain` | core tables |
| DEP-1 | Deployment | `dep-1-deployment` | `vercel.json`, Supabase services |
| STATE-1 | Article lifecycle | `state-1-article` | `app.article_before_write` |
| STATE-2 | Game status | `state-2-game` | `statusActions()` in `scoring.ts`, `sk_match_status` |
| ERD-1 | Content ERD | `erd-1-content` | `schema.sql` (generated) |
| ERD-2 | People, intake and settings ERD | `erd-2-people-intake` | `schema.sql` (generated) |
| ERD-3 | Salingkusog ERD | `erd-3-salingkusog` | `salingkusog.sql` (generated) |
| ERD-4 | Statistics ERD | `erd-4-statistics` | `stats.sql` (generated) |

\newpage

# 2. Context and data flow

## CTX-1 System context

![CTX-1 — Amaranth v2 and the people and services around it.](diagrams/ctx-1-context.png)

Amaranth v2 is one web application with three audiences. All persistent data and authentication are in Supabase; Vercel hosts the app and runs the small server functions; Cloudflare Turnstile checks public forms.

## DFD-0 Level 0

![DFD-0 — the system as a single process with its external entities.](diagrams/dfd-0-level0.png)

## DFD-1 Level 1

![DFD-1 — six processes and their data stores.](diagrams/dfd-1-level1.png)

| Process | Main code | Data stores |
|---|---|---|
| 1.0 Authenticate and authorise | `features/auth`, `app.current_role` | D1 `profiles`, `staff_invites` |
| 2.0 Manage articles and workflow | `features/cms/articles`, `transition_article` | D2 articles, D3 media |
| 3.0 Serve public site | `features/public`, `api/r.ts`, `middleware.ts` | D2, D5 |
| 4.0 Handle public intake | `api/submit.ts`, `features/cms/intake` | D4 |
| 5.0 Run Salingkusog | `features/cms/salingkusog`, `salingkusog.sql` | D5 |
| 6.0 Collect and report statistics | `api/e.ts`, `stats.sql`, `features/cms/statistics` | D6 |

\newpage

# 3. Use cases

## UC-1 Writers, editors and publishers

![UC-1 — article use cases by role. "Publisher" means SA, EE, ME, BM or staff granted publishing access.](diagrams/uc-1-writers-editors.png)

## UC-2 Managers

![UC-2 — administration use cases for Super admin, Executive Editor and Managing Editor.](diagrams/uc-2-managers.png)

## UC-3 Salingkusog team

![UC-3 — Salingkusog newsroom use cases.](diagrams/uc-3-salingkusog.png)

## UC-4 Readers

![UC-4 — public use cases; forms include the Turnstile check.](diagrams/uc-4-readers.png)

\newpage

# 4. Activities

## ACT-1 Article submission to publication

![ACT-1 — from draft to a live article. Every transition is checked by the database trigger.](diagrams/act-1-article-publication.png)

\newpage

## ACT-2 Scheduling a game to an updated medal table

![ACT-2 — three ways to create games, live scoring, automatic advancement and staff-confirmed medals.](diagrams/act-2-game-to-medal-table.png)

\newpage

# 5. Sequences

## SEQ-1 Login and role check

![SEQ-1 — sign-in, profile load and the RequireStaff guard. The database re-checks the role on every query.](diagrams/seq-1-login-role.png)

## SEQ-2 Publish an article

![SEQ-2 — publishing through transition_article and the article triggers.](diagrams/seq-2-publish-article.png)

## SEQ-3 Enter results and medals

![SEQ-3 — confirming medals; the medal table and points are computed when read.](diagrams/seq-3-enter-results.png)

## SEQ-4 Live score update

![SEQ-4 — a score tap reaches every open page through Supabase Realtime.](diagrams/seq-4-live-score.png)

## SEQ-5 Schedule import

![SEQ-5 — CSV import with validation and duplicate detection.](diagrams/seq-5-schedule-import.png)

## SEQ-6 Public form with CAPTCHA and attachments

![SEQ-6 — the /api/submit gateway: Turnstile, signed uploads, signed ticket, service-role RPC.](diagrams/seq-6-public-form.png)

\newpage

# 6. Structure

## ARCH-1 Layered architecture

![ARCH-1 — five layers from React pages to Supabase platform services.](diagrams/arch-1-layers.png)

## CMP-1 Front-end components

![CMP-1 — main front-end modules and shared libraries.](diagrams/cmp-1-components.png)

## CLS-1 Domain class model

![CLS-1 — the main domain entities and their relationships (simplified; full columns in AMR-DOC-04).](diagrams/cls-1-domain.png)

## DEP-1 Deployment

![DEP-1 — browsers, Vercel and Supabase services.](diagrams/dep-1-deployment.png)

\newpage

# 7. States

## STATE-1 Article lifecycle

![STATE-1 — article statuses and who may move between them.](diagrams/state-1-article.png)

## STATE-2 Game status

![STATE-2 — statuses of a Salingkusog game (sk_match_status) and the scorekeeper actions.](diagrams/state-2-game.png)

\newpage

# 8. Entity–relationship diagrams

These are generated from the SQL files and show primary keys, foreign keys and a few key columns. Grey boxes without columns are tables from another group, shown for context. The complete data dictionary is in AMR-DOC-04.

## ERD-1 Content

![ERD-1 — sections, categories, articles and their related tables.](diagrams/erd-1-content.png)

## ERD-2 People, intake and settings

![ERD-2 — staff, invitations, contributors, editorial board, public intake and settings.](diagrams/erd-2-people-intake.png)

## ERD-3 Salingkusog

![ERD-3 — editions, factions, sports, events, matches, entries, placements and awards.](diagrams/erd-3-salingkusog.png)

## ERD-4 Statistics

![ERD-4 — raw events and daily rollups.](diagrams/erd-4-statistics.png)
