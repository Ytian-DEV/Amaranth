---
title: "Maintenance and Developer Guide"
subtitle: "Amaranth v2 — set up, conventions, extending the system and common fixes"
version: "1.0"
date: "2026-10-19"
---

# Document control

| Field | Value |
|---|---|
| Title | Maintenance and Developer Guide |
| Document ID | AMR-DOC-10 |
| Version | 1.0 |
| Date | 2026-10-19 |
| Author | Amaranth development team [TO CONFIRM: names] |
| Status | Final draft for defense |
| Audience | Future student developers and maintainers |

# Contents

1. Quick start
2. Scripts
3. Folder map
4. Coding conventions
5. How data flows in a feature
6. Writing a database change
7. How-to recipes
8. Documentation and diagrams
9. Common errors and fixes
10. Where to start reading

\newpage

# 1. Quick start

Requirements: Node.js ≥ 20.19, npm, Git; PostgreSQL 16+ binaries for the SQL tests.

```bash
git clone <repository>
cd <repository>
npm install
cp .env.example .env.local   # fill in Supabase URL and anon key; optional service key for forms
npm run dev                  # http://localhost:3000
```

- `/dev` (development builds only) lists fixture screens with fake data, so most UI can be worked on without a database.
- Without `VITE_TURNSTILE_SITE_KEY`, the dev server uses Cloudflare's test keys and serves `/api/submit` itself (`devApi` plugin in `vite.config.ts`); forms then need `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

Branching: create `feature/<name>` from `develop`; one feature per branch; Conventional Commits (`feat(scope): …`, `fix: …`, `docs: …`); merge with `--no-ff` into `develop` after the gates pass; never commit to `main` directly; never commit `.env*` files (except `.env.example`).

# 2. Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server (port 3000) |
| `npm run build` | Type-check and production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc -b` (strict) |
| `npm run test` / `test:watch` | Vitest |
| `npm run check` | lint + typecheck + test + build (**the merge gate**) |
| `npm run db:test` | SQL tests in a throwaway PostgreSQL (**gate for database changes**) |
| `npm run check:contrast` | WCAG contrast of design-token pairs |

# 3. Folder map

| Path | Contents |
|---|---|
| `src/app/` | `router.tsx` (all routes, lazy), `RootLayout.tsx`, `RouteError.tsx` |
| `src/components/ui/` | Buttons, fields, modal, image (`Img`), pagination, pills, Turnstile widget, loader |
| `src/components/story/` | Story cards, rows, section header |
| `src/features/auth/` | `AuthProvider`, guards, login/reset pages, `permissions.ts` (UI mirror of DB rules) |
| `src/features/public/` | Public site: `home`, `section` (+ `landing/` per section), `article`, `search`, `archives`, `about`, `intake`, `salingkusog`, `analytics` |
| `src/features/cms/` | Newsroom: `dashboard`, `articles` (+ `editor/`), `intake`, `media`, `people`, `settings`, `statistics`, `salingkusog` (`setup/`, `scores/`, `results/`, `awards/`) |
| `src/lib/` | `supabase.ts`, `database.types.ts` (hand-written), `sanitize.ts`, `images.ts`, `media.ts`, `format.ts`, `manila.ts`, `edgeCache.ts`, `sendForm.ts`, `turnstile.ts`, `skSources.ts`, `skContests.ts`, `skLabels.ts` |
| `src/styles/` | `tokens.css` (design tokens), `app.css` |
| `src/dev/` | Fixture screens and the DOM checker (never in production) |
| `api/` | Vercel functions; `_lib/` shared server code (Node ESM — relative imports need `.js`) |
| `middleware.ts` | Crawler link previews |
| `supabase/v2/` | `schema.sql`, `salingkusog.sql`, `stats.sql`, `seed.sql`, `seed_board.sql` |
| `supabase/tests/` | Stub, helpers, fixtures and `*.test.sql` |
| `scripts/` | `db-test.mjs`, `check-contrast.mjs`, `countdown-og.py` |
| `docs/` | This documentation; `docs/v2/` holds the build plans and progress log |

# 4. Coding conventions

- **TypeScript strict;** no `any` without a reason.
- **Design tokens only:** no hex colours in components (ESLint rule `no-restricted-syntax`); use token utilities (`bg-paper`, `text-ink`, `text-lime-dark-text`) from `src/styles/tokens.css`.
- **Server state through TanStack Query hooks** in the feature's `*Api.ts` / `*Data.ts`; components do not call `supabase` directly.
- **Permissions:** add the rule in SQL first (helper + policy or trigger), then mirror it in `permissions.ts` for display. Never rely on the UI check.
- **Accessibility:** every control has a label; one `h1` per page; headings in order; images need `alt`; respect `prefers-reduced-motion`.
- **Copy:** plain, short English; error messages say what to do next.
- **Server code (`api/`, `middleware.ts`):** relative imports end in `.js` (a test enforces this); never return secrets; validate all input.
- **Philippine time:** use `src/lib/manila.ts` helpers for Salingkusog dates.
- **Tests:** add a unit or component test with each feature; SQL tests for every database rule.

# 5. How data flows in a feature

Example: the Salingkusog results editor.

1. Route in the feature router (`cms/salingkusog/SalingkusogPage.tsx` → `results/:eventId`).
2. The page uses hooks from `cms/salingkusog/skApi.ts` (`useSkPlacements`, `useSkMatches`, `useSetPlacements`).
3. Hooks call Supabase (`from('sk_placements')`, `rpc('sk_set_placements')`).
4. The database enforces `app.can_edit_sk()` (RLS and inside the RPC) and the medal/place check constraint.
5. On success the mutation invalidates the `['sk', …]` query keys; Realtime notifies public pages.

# 6. Writing a database change

1. Edit the right file: newsroom → `schema.sql`; Salingkusog → `salingkusog.sql`; statistics → `stats.sql`.
2. Keep it **re-runnable**: `if not exists`, `create or replace`, `drop … if exists` before `create policy`/`create trigger`, `add value if not exists` for enums (compare new enum values as text inside functions created in the same file).
3. Private helpers go in schema `app` with `security definer` and `set search_path = ''`; public RPCs need explicit `revoke … from public, anon` / `grant … to authenticated` (or `service_role`).
4. Enable RLS and add policies for any new table; add it to the touch/edition trigger loops if relevant.
5. Update `src/lib/database.types.ts` by hand.
6. Add checks to the right `supabase/tests/*.test.sql` file (use `tests.login('<fixture email>')`).
7. Run `npm run db:test` (applies each file twice) and `npm run check`.
8. In the release notes, say which file must be re-pasted and in which order relative to the code deploy.

# 7. How-to recipes

## 7.1 Add a sport or event (no code)
Sports, events, factions and venues are **data**. In the newsroom: Salingkusog → Sports & events → Add sport (choose a category) → Add event (division, format, team or individual, result unit "s" for times or "m"/"pts" for highest-wins, venue).

## 7.2 Add a new sport category (code)
1. `salingkusog.sql`: `alter type public.sk_category add value if not exists '<value>';`
2. `src/lib/database.types.ts`: add to `SkCategory`.
3. `src/lib/skLabels.ts`: add the label to `categoryLabels`.
4. Run the gates; re-paste `salingkusog.sql`.

## 7.3 Add a role
1. `schema.sql`: `alter type public.app_role add value if not exists '<role>' …;`
2. Decide its powers and update the helpers (`app.can_publish_articles`, `app.is_editor`, …) — compare as text (`app.current_role()::text = '<role>'`) in the same file.
3. `src/lib/database.types.ts` (`AppRole`), `src/features/auth/permissions.ts` (`roleLabels`, `roleOrder`, helper mirrors, `assignableRoles`).
4. Add a fixture user in `supabase/tests/02_fixtures.sql` and SQL tests for what the role may and may not do; unit tests in `permissions.test.ts`.
5. Example to follow: the Business Manager role (`feature/publish-permissions`).

## 7.4 Add a newsroom screen
1. Create `src/features/cms/<area>/<Screen>.tsx` and hooks in `<area>Api.ts`.
2. Add a lazy route in `src/app/router.tsx` (or the area's nested router) and a menu entry in `src/features/cms/nav.ts`, limited by role.
3. Wrap role-limited screens with `RequireRole`.
4. Add a fixture screen in `src/dev/` and a component test.

## 7.5 Add a public form field
1. Add the parameter to the RPC in `schema.sql` (validation inside).
2. Add the parameter name to `FORMS[kind].params` in `api/_lib/forms.ts`.
3. Send it from the form via `sendForm`.
4. Update tests (`forms.test.ts`, SQL tests).

## 7.6 Add a new Salingkusog format
Follow ADR-012 and ADR-014 (AMR-DOC-03): add the enum value, generate games with sources in `sk_build_schedule` (or a contest RPC), teach `app.sk_resolve`/`app.sk_source_side` how to fill sides, extend `suggestedPodium`, the sport page and tests in `sk_brackets.test.sql`.

# 8. Documentation and diagrams

- Markdown sources: `docs/*.md`; diagrams: `docs/diagrams/*.mmd` (Mermaid) with rendered `.png`/`.svg`.
- Exports (`docs/export/`): `.docx` per document, one combined `.pdf`, and the `.pptx` decks. They were produced with Pandoc (DOCX), Chrome print-to-PDF (PDF), python-pptx (decks) and Mermaid (diagrams) from a scratch build environment [TO CONFIRM where the build scripts will be kept; see `docs/README.md`].
- Update `docs/v2/PROGRESS.md` with every merge.

# 9. Common errors and fixes

| Error | Cause | Fix |
|---|---|---|
| Production 500 / `ERR_MODULE_NOT_FOUND` from `/api` or middleware | Relative import without `.js` in server code | Add `.js`; `esm-imports.test.ts` catches it |
| "permission denied for function …" | Missing grant after editing a function | Re-run the whole SQL file (grants at the end) |
| "unsafe use of new value … of enum type" | Using a new enum value in the same transaction | Compare as text (`::text`) |
| `npm run db:test` fails to start on port 54329 | A previous cluster still running | Stop the stray PostgreSQL process, rerun |
| Dev page "Something went wrong" after moving files | Vite's module graph stale | Restart the dev server |
| `showModal is not a function` in tests | jsdom lacks `<dialog>` methods | Stub `HTMLDialogElement.prototype.showModal` in `beforeAll` |
| Types don't match the database | Hand-written types not updated | Update `database.types.ts` with the schema change |
| Lint: hex colour not allowed | Colour literal in a component | Use a token |
| Forms answer 501 locally | No `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` | Add it (never commit it) |
| Live scores don't update | Table not in the Realtime publication | Re-run `salingkusog.sql` |

# 10. Where to start reading

1. `docs/00-audit-report.md` — the whole system on a few pages.
2. `src/app/router.tsx` — every screen.
3. `supabase/v2/schema.sql` sections "Helpers" and "Article workflow".
4. `src/features/cms/articles/editor/ArticleEditorPage.tsx` — a full feature end to end.
5. `supabase/v2/salingkusog.sql` — "Auto brackets and round robins" and "Contests".
