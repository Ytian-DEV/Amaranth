---
title: "Defense Demo Script"
subtitle: "Minute-by-minute live demonstration with test accounts, seed data and a fallback plan"
version: "1.0"
date: "2026-10-19"
---

# Document control

| Field | Value |
|---|---|
| Title | Defense Demo Script |
| Document ID | AMR-DOC-20 |
| Version | 1.0 |
| Date | 2026-10-19 |
| Author | Amaranth development team [TO CONFIRM: names] |
| Status | Final draft |

# Contents

1. Goal and setup
2. Test accounts (fictional)
3. Demo seed data
4. Minute-by-minute script (15 minutes)
5. Fallback plan
6. Pre-demo checklist

\newpage

# 1. Goal and setup

Show, in 15 minutes, that (1) the newsroom enforces editorial roles in the database, (2) readers get a fast, accessible site with safe public forms, and (3) Salingkusog results flow from a score tap to the official medal table automatically.

**Use a separate demo environment, never production with real people's data:** a second Supabase project (or the production project with a **test edition** that stays unpublished) and a Vercel preview, or `npm run dev` locally [TO CONFIRM which]. Two screens: laptop (projector) and a phone (scorekeeper).

# 2. Test accounts (fictional)

Create these in the demo project before the defense (Staff → Invites, then accept the invitations). The passwords below are **placeholders**: choose your own and keep them off the slides.

| Account | Role | Placeholder password |
|---|---|---|
| `demo.ee@example.test` | Executive Editor | `<set before demo>` |
| `demo.me@example.test` | Managing Editor | `<set before demo>` |
| `demo.editor@example.test` | Section editor (News) | `<set before demo>` |
| `demo.writer@example.test` | Staff writer | `<set before demo>` |
| `demo.scorer@example.test` | Staff writer + Salingkusog team | `<set before demo>` |

Use separate browser profiles (or one normal and one private window) to switch roles quickly.

# 3. Demo seed data

All fictional:

1. Articles: two published News articles with cover images (any campus photos you own), one draft by the writer.
2. Salingkusog test edition "Demo Games" (unpublished until the demo, dates covering the demo day), factions "Faction A–D" with distinct colours, sports Basketball (Men, format Bracket) and Swimming (50m Free, Timed, individual, unit "s"), one athlete per faction for swimming.
3. Build schedule for Basketball Men: 4 factions, single elimination + bronze. Create contest for Swimming.
4. Pre-finish Semifinal 1 so the final already shows "Faction A vs Winner of Semifinal 2".

# 4. Minute-by-minute script (15 minutes)

| Time | Who / screen | Action | Point to make |
|---|---|---|---|
| 0:00–1:00 | Laptop, public home | Scroll the home page; open a section; open an article | Brand 2026, mobile-first layout, accessibility 100 |
| 1:00–2:00 | Phone, public home | Same page on the phone; search for a word | Responsive; search is full-text in the database |
| 2:00–3:30 | Laptop, writer | Sign in as writer; create a draft; show autosave and **Submit for review**; show there is no Publish button | Writers cannot publish |
| 3:30–4:30 | Laptop, writer (DevTools optional) | Try to publish anyway via the API console snippet [optional] | "You cannot move this article…" comes from the **database** |
| 4:30–6:00 | Laptop, section editor | **Needs review** → **Start review** → **Return to draft** with a note; show Notes & activity | Workflow history and notes |
| 6:00–7:30 | Laptop, Managing Editor | Publish an article; Staff → Accounts → turn on **Can publish** for the writer | Granular publishing access, audited |
| 7:30–8:30 | Laptop, public | Submit the contact form (Turnstile runs invisibly); show it in Settings → Inbox | Safe public forms |
| 8:30–11:00 | Phone, scorer + laptop public tally | Open Semifinal 2 on the phone: **Start game**, tap scores, **Finish game**; laptop shows the final filling in and the bronze game | Live updates and automatic brackets |
| 11:00–12:30 | Phone + laptop | Swimming contest: enter four times, mark one DNF, **Finish contest** | Contest ranking, ties, DNF |
| 12:30–13:30 | Laptop, Managing Editor | Results & medals → **Ready to confirm** → **Save results**; switch to `/salingkusog` | Staff-confirmed medals; computed medal table |
| 13:30–14:30 | Laptop | Statistics screen (or screenshot); `/privacy` | First-party, cookie-less statistics |
| 14:30–15:00 | — | Summary slide | Database-enforced roles, live results, privacy |

Optional API snippet for 3:30 (run in the browser console of the writer's newsroom tab; it only works for signed-in staff):

```js
const { getSupabase } = await import('/src/lib/supabase.ts'); // dev server only
await getSupabase().rpc('transition_article', { p_article_id: '<draft id>', p_to: 'published' });
```

# 5. Fallback plan

| Failure | Fallback |
|---|---|
| No internet / Supabase down | Run `npm run dev` and use the `/dev` fixture screens (no database needed): `/dev/admin/editor`, `/dev/admin/salingkusog-scorekeeper` (buttons work), `/dev/salingkusog/sports/auto-bracket`, `/dev/salingkusog/final` |
| Laptop fails | Present the screenshots in `docs/screenshots/` and the slide deck (PDF copy on a USB drive) |
| Sign-in problem | Second browser profile already signed in for each role |
| Realtime slow | Refresh the tally; explain the 60-second polling fallback |
| Turnstile blocks the form | Show the 403 handling and the Inbox with a pre-sent message |

# 6. Pre-demo checklist

- [ ] Demo accounts created and tested; passwords not on slides.
- [ ] Demo edition and articles seeded; semifinal 1 finished; medals not yet confirmed.
- [ ] Phone charged, signed in as scorer, brightness up, notifications off.
- [ ] Laptop: two browser profiles, projector resolution checked, zoom 110%.
- [ ] Offline fallback tested (`npm run dev`, `/dev` screens).
- [ ] After the demo: unpublish/delete the demo edition and deactivate demo accounts.
