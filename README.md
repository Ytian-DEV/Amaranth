# Amaranth

The website and newsroom CMS of **Amaranth**, the official student publication of Visayas State University, Baybay City, Leyte.

- **Public site:** front page, section pages, articles with comments, search, archives (print issues + by month), About, Editorial Board, story and event submissions, contact.
- **Newsroom (`/admin`):** dashboard, article editor (autosave, revisions, media, SEO), editorial workflow (draft → review → scheduled/published), media library, staff and contributors, editorial board, submission review, comment moderation, inbox, front-page curation and site settings.

Built with Vite, React 18, TypeScript, Tailwind CSS v4, TanStack Query, TipTap and Supabase (Postgres, Auth, Storage). Deployed on Vercel.

## Getting started

```bash
npm install
cp .env.example .env   # add your Supabase URL and anon key
npm run dev            # http://localhost:3000
```

Without data you can still look at every screen: open **`/dev`** for fixture pages (dev builds only).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run check` | Lint, typecheck, unit tests and production build — run before committing |
| `npm run test` | Vitest unit/component tests |
| `npm run db:test` | Applies `supabase/v2` twice to a throwaway local PostgreSQL and runs the RLS/trigger/RPC tests (needs PostgreSQL 16+ binaries) |
| `npm run check:contrast` | WCAG contrast check of the colour tokens |

## Project layout

```
src/
  app/            router, root layout, error screen
  components/     ui/ (design-system atoms), story/ (Figma story components)
  features/
    auth/         staff sign-in, guards, permissions
    public/       header/footer, home, sections, article, search, archives, intake forms, about
    cms/          newsroom: dashboard, articles + editor, media, people, intake, settings
  lib/            Supabase client + types, formatting, media, sanitising
  styles/         tokens.css (design tokens from Figma) and app.css
  dev/            fixtures and /dev screens (excluded from production)
api/              Vercel functions: sitemap.xml, rss.xml, robots.txt
middleware.ts     Open Graph tags for link previews (Facebook, Messenger, X…)
supabase/v2/      database schema + seed (paste into Supabase); tests in supabase/tests
docs/v2/          plan, progress log and database deploy guide
```

## Database

See [`docs/v2/DB.md`](docs/v2/DB.md) for the deploy-day steps (paste `schema.sql`, then `seed.sql`, invite the first admin, auth settings).

## Design

Design tokens and components follow the Figma file “Amaranth Redesign — RTSPC 2027”. Colours live in `src/styles/tokens.css`; components never hard-code hex values (enforced by ESLint).
