# AMARANTH v2 — Performance pass

Measured 2026-10-17 with Lighthouse 12.2.1 (headless Chrome, default mobile = simulated slow 4G + 4× CPU, and `--preset=desktop`) against local production builds (`vite build` + `vite preview`).

**Caveat:** the Supabase project in `.env` doesn't resolve (`ERR_NAME_NOT_RESOLVED`), so both v1 and v2 rendered without live data. `/` therefore compares the two shells fairly; `/dev/home` and `/dev/article` are v2 with the Figma fixture content (no photos). Re-run on a Vercel preview once the v2 database has content.

## Lighthouse

| Page | Build | Perf (mobile) | Perf (desktop) | A11y | Best pr. | SEO* | FCP mobile | LCP mobile | CLS | Transfer |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | v1 (`43aec30`) | 56 | 83 | 91 | 96 | 83 | 10.1 s | 10.4 s | 0.004 | 1,628 KB |
| `/` | v2 before perf pass | 70 | 93 | 100 | 96 | 92 | 2.4 s | 4.8 s | 0.143 (desktop) | 259 KB |
| `/` | **v2 final** | **79** | **99** | **100** | 96 | 92 | 2.0 s | 3.7 s | **0** | **246 KB** |
| `/dev/home` (Figma content) | v2 final | 74 | 96 | 100 | 96 | 92 | 2.9 s | 4.4 s | 0 | 349 KB |
| `/dev/article` | v2 final | 77 | 97 | 100 | 96 | 92 | 3.0 s | 4.3 s | 0 | 349 KB |

\*SEO's only failing audit locally is `robots.txt`, which is served by `api/robots.ts` on Vercel; the other failure everywhere is console errors from the unreachable Supabase host. v1 also failed `button-name`, `heading-order`, `image-redundant-alt` and `meta-description`; v2 passes them.

## Checklist

### Caching
- [x] Client cache for public reads — TanStack Query, 60 s stale time (nav/settings/sections 10–30 min), no refetch on focus, no retries on database errors.
- [x] Edge caching for article previews — `middleware.ts` responses `s-maxage=300, stale-while-revalidate=86400`; sitemap 1 h, RSS 15 min, robots 1 day.
- [x] CDN + immutable assets — `vercel.json`: `/assets/*` `max-age=31536000, immutable`; `/images|fonts|documents` 7 days; `index.html` revalidates.

### Database
- [x] Indexes for the real lookups — partial indexes on live articles by date/section/category, featured, issue, status queues, creator, cover/OG usage, GIN full-text, comments by article/status, intake by status; audit-only FKs deliberately unindexed (see schema comments).
- [x] No N+1 — lists read the `article_cards` view (section, category, cover and byline in one query); home page = 7 parallel queries; dashboard numbers come from one RPC (`dashboard_stats`).
- [x] Connection pooling — the app only talks to PostgREST (Supabase's pooled REST layer); no direct Postgres connections from the browser or functions.

### Images
- [x] Compressed on upload — `uploadMediaImage`: ≤2400 px WebP (q 0.82) + 640/1280 px variants; intake attachments ≤2400 px JPEG.
- [x] Responsive `srcset` + WebP — `Img` builds `srcset`/`sizes` from stored variants.
- [x] Lazy below the fold — `Img` is lazy by default; lead images use `priority` (eager + `fetchpriority=high`); editor images get `loading="lazy"`.
- [x] Static board photos 6.1 MB → 1.4 MB (800 px progressive JPEG).

### Bundle
- [x] Code split per route — every page except the public shell and front page is a lazy route; CMS fixtures split from public fixtures.
- [x] Vendor chunks — `react`, `supabase`, `query`, `editor` (TipTap/ProseMirror, CMS only).
- [x] Minified JS/CSS — Vite production build; Tailwind emits only used utilities (CSS 49 KB → 9.8 KB gzip).
- [x] No unused dependencies — 38 removed in `feature/v2-polish`; 22 runtime deps remain.
- [x] Deferred non-critical scripts — Vercel Analytics loads async and only in production; `/dev` code excluded from production builds.
- [x] Fonts — self-hosted variable WOFF2, only the latin Inter + Fraunces files preloaded; `preconnect` to Supabase.

### UI responsiveness
- [x] Debounced inputs — search (400 ms), CMS article/media search (350 ms), slot pickers (300 ms).
- [x] Memoised/paginated lists — all long lists are server-paginated (12–24 per page) with `keepPreviousData`; editor HTML sanitising is memoised.
- [x] Layout stability — `main` reserves height while loading (CLS 0).

### Payload compression
- [x] Vercel serves Brotli/gzip automatically for HTML, JS, CSS, XML and JSON; Supabase REST responses are gzip-compressed.

## Follow-ups
- Mobile TBT (~200–340 ms) is mostly React + Supabase client parse; lazy-initialising the Supabase client after first paint would help further.
- Re-measure on the Vercel preview with real photos (LCP will then be the lead image, which is `priority` + `srcset`).
