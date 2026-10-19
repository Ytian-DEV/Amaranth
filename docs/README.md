# Amaranth v2 — Documentation Package (v1.0, 2026-10-19)

Defense-ready software engineering documentation, slide decks and defense support for **Amaranth v2**, the newsroom and publishing system of Amaranth, the official student publication of Visayas State University (VSU), Baybay City, Leyte.

Every statement is drawn from the code, the SQL files, the configuration or the project notes in `docs/v2/`. Anything that could not be verified is marked **[TO CONFIRM]** and collected at the end of this page. No secrets, real credentials or personal data appear in any document, deck or screenshot (screens use fictional fixture data).

## What is where

| Folder | Contents |
|---|---|
| `docs/*.md` | Markdown sources of every document (edit these) |
| `docs/diagrams/` | Mermaid sources (`.mmd`) and rendered `.png`/`.svg` (24 UML/process diagrams, 1 Gantt, 6 slide diagrams) |
| `docs/screenshots/` | 40 screen captures from the `/dev` fixture screens (fictional data) |
| `docs/export/` | Final files: 22 `.docx`, one combined `.pdf` (289 pages), 5 `.pptx` decks |
| `docs/tools/` | Scripts that rebuild everything (see "Rebuilding" below) |
| `docs/v2/` | The original build plans and progress log (historical; `DB.md` is partly outdated — KI-02) |

## Documents

| ID | Document | Source | Export |
|---|---|---|---|
| AMR-DOC-00 | Repository Audit Report | `00-audit-report.md` | `export/00-audit-report-v1.0.docx` |
| AMR-DOC-01 | Project Overview and Vision | `01-project-overview.md` | `.docx` |
| AMR-DOC-02 | Software Requirements Specification (94 FR, 21 NFR, 20 user stories) | `02-srs.md` | `.docx` |
| AMR-DOC-03 | Software Design Document and Architecture (15 ADRs) | `03-architecture-sdd.md` | `.docx` |
| AMR-DOC-04 | Database Design (ERD, full data dictionary of 448 columns, RLS, medal computation) | `04-database-design.md` | `.docx` |
| AMR-DOC-05 | UML and Process Diagrams (24 diagrams) | `05-diagrams.md` | `.docx` |
| AMR-DOC-06 | Security and Privacy (RBAC, STRIDE, RA 10173) | `06-security-privacy.md` | `.docx` |
| AMR-DOC-07 | API and Integration Reference | `07-api-reference.md` | `.docx` |
| AMR-DOC-08 | Test Documentation (533 automated cases, RTM, 20 manual cases) | `08-test-documentation.md` | `.docx` |
| AMR-DOC-09 | Deployment and Operations Runbook (incl. Salingkusog event-week checklist) | `09-deployment-runbook.md` | `.docx` |
| AMR-DOC-10 | Maintenance and Developer Guide | `10-developer-guide.md` | `.docx` |
| AMR-DOC-11a | User Manual — Executive Editor, Managing Editor, Super admin | `11a-manual-executive-managing.md` | `.docx` |
| AMR-DOC-11b | User Manual — Editors, staff and Business Manager | `11b-manual-editors-staff.md` | `.docx` |
| AMR-DOC-11c | User Manual — Salingkusog Team | `11c-manual-salingkusog-team.md` | `.docx` |
| AMR-DOC-11d | User Manual — Public Readers | `11d-manual-public-readers.md` | `.docx` |
| AMR-DOC-12 | Project Management (WBS, timeline, risks, change log) | `12-project-management.md` | `.docx` |
| AMR-DOC-13 | Limitations, Known Issues and Future Work | `13-limitations-future-work.md` | `.docx` |
| AMR-DOC-14 | Glossary and Appendices | `14-glossary-appendices.md` | `.docx` |
| AMR-DOC-20 | Defense Demo Script | `20-demo-script.md` | `.docx` |
| AMR-DOC-21 | Defense Q&A Preparation (55 questions) | `21-qa-preparation.md` | `.docx` |
| AMR-DOC-22 | One-Page Cheat Sheets | `22-cheat-sheets.md` | `.docx` |
| AMR-DOC-23 | Screenshot List | `23-screenshot-list.md` | `.docx` |
| — | All documents combined | — | `export/Amaranth-v2-Documentation-v1.0.pdf` |

## Slide decks (`docs/export/`)

| Deck | Slides | Audience |
|---|---|---|
| `B1-Main-System-Defense-v1.0.pptx` | 28 | Defense panel |
| `B2-Technical-Deep-Dive-v1.0.pptx` | 23 | Technical panel members, adviser, maintainers |
| `B3-Salingkusog-Module-v1.0.pptx` | 17 | Sports organisers, Salingkusog team, panel |
| `B4-Staff-Training-v1.0.pptx` | 15 | Newsroom staff and Salingkusog team |
| `B5-Executive-Pitch-v1.0.pptx` | 10 | University administration, stakeholders |

Every slide has speaker notes (3,689 words in total). Slides use Arial so they render the same on any computer.

## Suggested reading order

1. **AMR-DOC-00** Audit report — the whole system in 19 pages.
2. **AMR-DOC-01** Overview → **AMR-DOC-02** SRS.
3. **AMR-DOC-03** Architecture → **AMR-DOC-05** Diagrams → **AMR-DOC-04** Database.
4. **AMR-DOC-06** Security and privacy → **AMR-DOC-07** API.
5. **AMR-DOC-08** Tests and RTM.
6. **AMR-DOC-09** Runbook → **AMR-DOC-10** Developer guide.
7. **AMR-DOC-11a–d** Manuals for the relevant role.
8. **AMR-DOC-12**, **13**, **14**.

## What to present for which audience

| Audience | Present | Hand out |
|---|---|---|
| Thesis/capstone defense panel | B1 deck + live demo (AMR-DOC-20) | Combined PDF; cheat sheets (AMR-DOC-22) |
| Technical panel member / adviser | B2 deck | AMR-DOC-03, 04, 06, 08 |
| University administration | B5 deck | AMR-DOC-01, 13 |
| Salingkusog organisers | B3 deck | AMR-DOC-11c, AMR-DOC-09 §10 |
| New newsroom staff | B4 deck | AMR-DOC-11a or 11b |
| Future maintainers | B2 deck | AMR-DOC-10, 03, 04, 07, 09 |
| Data privacy officer | — | AMR-DOC-06 §11 |

## Issues found while documenting (not fixed — no application code was changed)

| Issue | Where documented |
|---|---|
| `/privacy` does not mention Salingkusog athletes, whose names, programs and photos are published | AMR-DOC-06 R-10 |
| The editorial-board development fixture contains **real names and photos** | AMR-DOC-13 KI-10 |
| No athlete eligibility data is stored; if eligibility forms exist, they are outside the system | AMR-DOC-06 §11.1 |
| `docs/v2/DB.md` is partly out of date | AMR-DOC-13 KI-02 |
| No CI pipeline, no end-to-end tests, CSP report-only, no MFA | AMR-DOC-13 |
| Old Katalon project in the ignored `Amaranth/` folder | AMR-DOC-13 KI-11 |

## Quality checks performed

- All numbers counted from the code: 50 tables, 448 columns, 19 enums, 6 views, 76 functions, 40 triggers, 60 indexes, 97 policies, 3 buckets.
- Tests re-run on 2026-10-19: 255/255 unit tests, 278/278 SQL checks (results in AMR-DOC-08).
- Every diagram rendered and checked for legibility; dense ones have simplified slide versions.
- Combined PDF: rendered to images; no blank pages and no text beyond the right margin across 289 pages; sample pages checked visually.
- Decks: every slide previewed as an image with the same geometry and fonts; automatic checks for text overflow, word count, speaker notes and image scaling report 0 problems; `.pptx` files re-opened and validated (all shapes within the slide).
- Limitation: neither Microsoft Office nor LibreOffice was available on the build machine, so the `.docx` and `.pptx` files were checked structurally and through equivalent renderings, not opened in Word or PowerPoint. Open them once in Word/PowerPoint before printing (Word may ask to update fields).

## Rebuilding

Requirements: Python 3.11+ with `pypandoc_binary python-docx python-pptx pillow pymupdf`; Node.js with `npm install` in `docs/tools` (installs `mermaid`, `puppeteer-core`, `marked`); Google Chrome installed (path set in `render-mermaid.mjs`, `print-pdf.mjs`, `capture.mjs`).

```bash
python docs/tools/sql_inventory.py supabase/v2 inventory.json
python docs/tools/inventory_fix.py inventory.json
python docs/tools/gen_erd.py inventory.json docs/diagrams
node docs/tools/render-mermaid.mjs docs/diagrams
python docs/tools/build_docs.py . all
python docs/tools/build_decks.py .
```

`gen_dictionary.py` (with `04-main.md`) regenerates AMR-DOC-04; `gen_tests.py` (with `08-main.md`, `manual.json` and a Vitest JSON report) regenerates AMR-DOC-08; `capture.mjs` re-captures the screenshots from a running dev server.

## Items to confirm

| # | Item | Appears in |
|---|---|---|
| 1 | Team member names and roles for title pages and decks | all documents, B1, B2 |
| 2 | Adviser name and title; institution unit (college/department) | 01, B1 |
| 3 | Defense audience and date; presenters | 12, B1, B2, B5 |
| 4 | Production domain (custom domain or `amaranth-iota.vercel.app`) | 00, 09, 12, B5 |
| 5 | Whether the `.env` Supabase project is production; whether previews share it | 00, 09 |
| 6 | Supabase and Vercel plans, costs, region and backup retention | 09, 12, 21, B5 |
| 7 | Supabase Auth settings: sign-ups disabled, leaked-password protection, MFA | 01, 02, 06 |
| 8 | Whether the pg_cron `publish-due-articles` job is enabled | 00 |
| 9 | Who sends staff invitation emails (Supabase dashboard step) | 11a |
| 10 | Purpose of the Business Manager role | 01 |
| 11 | Whether the adviser or administration need accounts | 01 |
| 12 | Athlete photo consent process; retention policy for athlete data; who holds eligibility forms | 06, 09, 11c |
| 13 | VSU Data Protection Officer contact; breach-notification procedure | 06, 09 |
| 14 | Contacts and access list (technical lead, Executive Editor, scorekeepers, duty editor) | 09 |
| 15 | Browser test matrix | 02, 08 |
| 16 | Date and results of manual tests MT-01 – MT-20 | 08, 12 |
| 17 | Demo environment (separate project or unpublished test edition) | 20 |
| 18 | Whether v1 articles must remain available | 13 |
| 19 | Actual effort and planning time behind the commit timeline | 12 |
| 20 | Success criterion SC-7 (system used by all roles during the 2026 games) — after Oct 30 | 01 |
