# Research: Asset Detail Screen

**Date**: 2026-05-21 | **Branch**: `004-asset-detail`

---

## Decision 1: Server/Client Component boundary for the chart

**Decision**: Server Component shell (page.tsx) + Client Component islands for interactive charts (`PriceChartClient`, `RadarSection`). Non-interactive parts (`AssetHeader`, `AssetAnalysisCTA`) remain Server Components.

**Rationale**: The price chart requires `useState` for the selected range and `useEffect` to refetch on change — these are inherently client-side. Recharts internally uses browser APIs (`ResizeObserver`, SVG rendering), making it incompatible with pure Server Components. Splitting into a Server shell + Client islands gives the best of both: server-side initial data fetch (no flash, fast TTFB) + client interactivity for charts.

**Alternatives considered**:
- Full Client Component page — loses server-side data fetching, introduces loading flash
- Suspense + RSC streaming for every range — overengineered for MVP, adds complexity without user benefit

---

## Decision 2: Range change data fetching strategy

**Decision**: Server Action (`'use server'` function) in `web/src/lib/actions/market.ts` — the `PriceChartClient` calls `fetchAssetHistory(ticker, range)` on range toggle.

**Rationale**: Server Actions are the idiomatic Next.js 15 approach for Client Components that need server-side data. They avoid exposing an API route, work with the Next.js Data Cache, and keep `market.ts` service functions server-only (they access `process.env.BRAPI_KEY`). Route Handler (`/api/asset/[ticker]/history`) is an alternative but adds a new file with more boilerplate for no benefit at MVP scale.

**Alternatives considered**:
- SWR/React Query client fetching to a route handler — adds a dependency, more complexity
- Fetch all three ranges server-side and pass all to client — 3x the data transferred, wasted for unused ranges

---

## Decision 3: Data source for asset header (name + price + change)

**Decision**: `getMarketRadarData(ticker)` provides everything — `result.quote.longName`, `result.quote.regularMarketPrice`, `result.quote.regularMarketChangePercent` — plus radar scores. One SDK call for two needs.

**Rationale**: `getMarketRadarData` already fetches detailed quote data (with `financialData` module) and returns it in `result.quote`. Using it for both the header and the radar avoids a redundant second API call to the same provider, keeping the page at 2 parallel fetches total.

**Alternatives considered**:
- `fetchIndexFromBrapi(ticker)` for header + `getMarketRadarData` for radar — 3 total fetches, redundant
- `getMultipleQuotes([ticker])` for header — free-tier compatible for 1 ticker but returns `AssetQuote` with `shortName` not `longName`; less informative

---

## Decision 4: Recharts version compatibility

**Decision**: Use `recharts ^3.7.0` already installed. `LineChart` + `RadarChart` APIs are stable in v3.

**Rationale**: Recharts 3.x is a stable major with `ResponsiveContainer`, `LineChart`, `RadarChart`, `PolarGrid`, `PolarAngleAxis`, `Radar`, `Tooltip` — all needed for this feature. No migration or new install required.

**Alternatives considered**:
- Chart.js — not installed, different API, would require new dependency
- D3 — much more powerful but massively overengineered for two basic charts at MVP

---

## Decision 5: Initial chart range on page load

**Decision**: Default to `'1mo'` (1 month), pre-fetched server-side and passed as `initialHistory` to `PriceChartClient`.

**Rationale**: 1 month gives the best "first glance" context — shows recent trend without the noise of intraday or the sparseness of yearly for most stocks. It matches the spec assumption (FR-006) and avoids a client-side fetch on initial render.

---

## Decision 6: Ticker not found handling

**Decision**: If `Promise.allSettled` results in both `getMarketRadarData` and `getAssetHistory` rejecting/returning null, render a "Ativo não encontrado" inline card with a `<Link href="/home">` — no separate 404 page.

**Rationale**: Next.js `notFound()` renders a global 404 page that would break the app's design system. An inline card with glassmorphism design is consistent and lets the user navigate back without losing context.

**Alternatives considered**:
- `notFound()` from Next.js — violates design system (plain Next.js 404 page)
- Redirect to home — removes useful feedback for mistyped URLs

---

## Decision 7: Back navigation implementation

**Decision**: `<Link href="/home">` — not `router.back()` or `window.history.back()`.

**Rationale**: `router.back()` requires `'use client'` and depends on navigation history, which may not include `/home` if the user arrived via a direct URL or refreshed. A static `<Link href="/home">` always works, is a Server Component, and is consistent with PWA expectations (home is always one tap away).

---

## Decision 8: Asset logo in header

**Decision**: No logo in the asset header. Display ticker + name only.

**Rationale**: `getMarketRadarData` doesn't return a logo URL. Logos are available via `getMarketListings` but that's a different call. For MVP, ticker + company name is sufficient identification. Adding a logo fetch would require an extra API call or a different data source. Logos are used on `MoverItem` in the home screen movers list — that context is appropriate. The detail screen header is better served by a clean typographic treatment.

**Alternatives considered**:
- Fetch logo via `searchAssets(ticker)` — extra call, unreliable for all tickers, not worth it
- Use Brapi's logo CDN URL directly — undocumented, fragile
