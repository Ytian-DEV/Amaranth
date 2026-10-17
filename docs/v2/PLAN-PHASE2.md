# AMARANTH v2 — Phase 2: Salingkusog + section layouts

Figma file `jpKBeBp37twnW7eXj0Nk2S`:
- page **Sports & Salingkusog** (`10:116`): Components & Faction System `10:117`, Medal Tally `13:123`, Schedule & Results `14:474`, Winners per Game `15:901`, Faction Profile `17:1248`, Sport: Basketball (Bracket) `18:1441`, Match Recap `19:1742`, Venue Guide `20:1856`, Social MVP of the Day `20:2036`, Social Athlete of the Day `20:2067`, Sports — Section Landing `21:1963`, Mobile Medal Tally `22:2139`, Mobile Schedule `22:2404`, Mobile Sports Landing `22:2645`.
- page **Sections** (`30:107`): News `30:108`, Feature `31:252`, Literary `33:366`, Blogs `34:349`, Specials `34:554`, Views `36:507`, S&T `39:579`, Investigative `39:763`, Explainer `40:721`, Bulletin `40:879`, Stories `42:851`, Header — More Menu Open `42:1077`.

Workflow: one feature per branch off `develop`, `npm run check` (+ `npm run db:test` for DB) before merging, PROGRESS.md updated with every merge. **One feature at a time; the user confirms before the next one starts.**

## Decisions (2026-10-17)
- Salingkusog data is **entered by staff in the newsroom** (no spreadsheet sync).
- **Only Super admin, Executive Editor (`editor_in_chief`, relabelled "Executive Editor") and Managing editor** choose who may enter Salingkusog data ("Salingkusog team"). Team members — and those three roles — can edit all Salingkusog data. Everyone else can only view.
- Medal table, points and the day-by-day race are **computed in the database** from results, never typed in.
- Live scores update for readers in real time (Supabase Realtime).

## Track A — Salingkusog

| # | Branch | What |
|---|---|---|
| A1 | `feature/salingkusog-db` | Tables: editions (dates, medal points), factions (name, colours, logo), sports + events (division: men/women/mixed), venues, matches (round, sides, schedule, status upcoming/live/final, scores, sets), placements (gold/silver/bronze per event), athletes + awards (MVP / Athlete of the Day, stat lines), `salingkusog_team`. RLS: public read; write = the three roles or team members; team managed only by the three roles. Views/RPCs: medal table, points by day, live count. Realtime on matches. Tests. |
| A2 | `feature/salingkusog-team-access` | "Executive Editor" label; `/admin/salingkusog/team` (add/remove members, three roles only); Salingkusog in the newsroom sidebar. |
| A3 | `feature/salingkusog-cms-setup` | Newsroom: edition, factions (logo upload), sports & events, venues; CSV import for the schedule. |
| A4 | `feature/salingkusog-scorekeeper` | Phone-friendly live scoring (score +/–, sets, start/finish), results & medals per event, winners per game, MVP / Athlete of the Day. |
| A5 | `feature/salingkusog-medal-tally` | Salingkusog header (tabs, live count, “Day x of y”), Medal Tally page — podium, table, points race chart, medal breakdown, live & up next (desktop + mobile). |
| A6 | `feature/salingkusog-schedule` | Schedule & Results (day tabs, filters, live / later / completed, PDF link) — desktop + mobile, realtime. |
| A7 | `feature/salingkusog-winners` | Winners per Game. |
| A8 | `feature/salingkusog-factions` | Factions list + Faction Profile. |
| A9 | `feature/salingkusog-sports-bracket` | Sports list + sport page with bracket. |
| A10 | `feature/salingkusog-match-recap` | Match Recap (scoreline, stats, linked article). |
| A11 | `feature/salingkusog-venues` | Venue Guide. |
| A12 | `feature/sports-landing` | Sports section landing with the Salingkusog block (desktop + mobile). |
| A13 | `feature/salingkusog-social-cards` | MVP of the Day (1080×1350) and Athlete of the Day (1080×1080) generated from data, downloadable PNG. |

## Track B — Section layouts (replace the shared template where the design differs)

| # | Branch | What |
|---|---|---|
| B1 | `feature/nav-more-menu` | Header “More” menu as designed (`42:1077`). |
| B2 | `feature/section-news` | News |
| B3 | `feature/section-feature` | Feature |
| B4 | `feature/section-literary` | Literary |
| B5 | `feature/section-blogs` | Blogs |
| B6 | `feature/section-specials` | Specials |
| B7 | `feature/section-views` | Views |
| B8 | `feature/section-science-technology` | S&T |
| B9 | `feature/section-investigative` | Investigative |
| B10 | `feature/section-explainer` | Explainer |
| B11 | `feature/section-bulletin` | Bulletin |
| B12 | `feature/section-stories` | Stories |

Each B feature: read the frame with `get_design_context`, build the layout from existing components/tokens, `/dev/section/<slug>` fixture, DOM sweep at 375/768/1024/1440. Database changes only if a frame needs data the schema lacks (noted in that feature).

## Open questions
- Faction names/colours in the design (Primordial Tiamat, Centicore Vanguard, Sylvan Dragons, Mystic Moirai) — real, or placeholders? They’re data, so they can change any time.
- Medal points: design shows Gold 5 · Silver 3 · Bronze 1 — confirm (editable per edition).
