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

## Pass 2 — production with real data (2026-10-18, `perf/edge-cache-images`)

Lighthouse 12.2.1, mobile (simulated slow 4G, 4× CPU), against production `amaranth-iota.vercel.app` with live content:

| Page | Perf | A11y | Best pr. | SEO | FCP | LCP | TBT | CLS | Transfer |
|---|---|---|---|---|---|---|---|---|---|
| `/` | 68 | 100 | 100 | 100 | 2.2 s | 6.1 s | 250 ms | 0.016 | 533 KB |
| `/news` | 72 | 100 | 100 | 100 | 2.1 s | 5.4 s | 220 ms | 0 | 478 KB |
| `/salingkusog` | 67 | 100 | 100 | 100 | 2.3 s | 6.0 s | 300 ms | 0 | 494 KB |

What held LCP back:
- **Oversized photos.** Variants were 640/1280 px; a phone (412 px at 1.75×) needs ~720 px, so it got the 1280 px file, and older uploads without variants were sent at full size (up to 175 KB for one image, 142 KB wasted on `/`).
- **Every Supabase read paid twice**: a CORS preflight, then the GET (7–12 reads per page before anything can render).

Changes:
- **Edge cache for public reads** (`api/r.ts`, `src/lib/edgeCache.ts`): signed-out readers' GETs of public, slow-changing tables go to same-origin `/api/r`, cached by Vercel's CDN for 60 s (`stale-while-revalidate=300`). No preflight, one hop to the nearest edge, and a traffic spike costs the database one query per minute per URL. Staff (signed in), writes, counts, comments and live Salingkusog results stay direct; if the proxy can't answer, the read goes to Supabase as before. The live-articles cutoff is rounded to the minute so readers share cache entries; `most_read_articles` / `archive_months` are called with GET.
- **Image sizes 320 / 640 / 960 / 1280** for new uploads, and **Media Library → "Make web sizes"** (editors) to add the missing sizes to older images in the browser.
- `srcset`/`sizes` on the three remaining raw `<img>` (Feature hero, Stories tiles, venue map).
- Debounced the recap-article search in the scorekeeper (it queried on every keystroke).

Re-run the table above after deploy and after "Make web sizes" has been run once.

### Checklist status (the list from 2026-10-18)
| Item | Status |
|---|---|
| Cache API responses / server-side caching / cache expensive queries / CDN | Done in pass 2 (edge-cached `/api/r`; sitemap, RSS, robots and crawler previews were already edge-cached; Vercel CDN serves all static files) |
| Load balancer | Not needed: Vercel and Supabase are managed platforms that scale and balance on their own |
| Database indexes | Checked: schema, Salingkusog and statistics queries all have matching indexes |
| Image compression | Yes, on upload in v2 (WebP ≤2400 px); pass 2 adds 320/960 sizes and a backfill |
| Loading skeletons | Yes on every public page and newsroom list |
| Debounced inputs | Yes; the last gap (recap search) fixed in pass 2 |
| Code splitting | Yes, per route plus vendor chunks |
| Pagination | Yes, every long list is paginated (12–24 per page) |
| Compress API payloads / minify JS and CSS | Automatic (Vercel Brotli/gzip; Vite minifies) |
| Lazy loading | Images lazy by default; routes lazy |
| Defer non-critical scripts | Yes (analytics async, statistics tracker batches after load) |
| Connection pooling | Handled by Supabase (PostgREST); nothing connects to Postgres directly |
| Lighthouse | Run above (production, real data) |
