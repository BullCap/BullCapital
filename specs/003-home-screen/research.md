# Research: Home Screen — Market Overview

**Feature**: `003-home-screen`
**Date**: 2026-05-20

---

## Decision 1: Temperature Computation Formula

**Decision**: Derive temperature (0–100) from IBOVESPA daily % change, amplified by VIX.
Formula:
```
base = clamp((ibovChange + 5) / 10 * 100, 0, 100)  // -5% → 0, 0% → 50, +5% → 100
amplifier = vix > 30 ? 1.4 : vix > 20 ? 1.1 : 0.9   // high VIX = more extreme readings
temperature = clamp(50 + (base - 50) * amplifier, 0, 100)
```
Falls back to `base` alone if VIX data is unavailable.

**Rationale**: IBOVESPA change is the primary signal Brazilian retail investors care about. VIX amplifies it during global risk-off events — the same day IBOVESPA drops 2% feels very different at VIX 35 vs VIX 12. The formula is deterministic, requires no external fear/greed feed, and uses data already fetched by `getMarketStatus()` (which includes `^BVSP` and `^VIX`).
**Alternatives considered**: Static fear/greed index API — adds external dependency with unpredictable uptime. IBOVESPA change only (no VIX) — misses global context. ML model — massively out of MVP scope.

---

## Decision 2: Temperature 5-Level Scale Labels

**Decision**: Map 0–100 to 5 Portuguese labels matching the spec:
```
0–20   → "Pânico extremo"  (panic)
21–40  → "Medo"            (fear)
41–60  → "Neutro"          (neutral)
61–80  → "Ganância"        (greed)
81–100 → "Euforia"         (euphoria)
```

**Rationale**: BC's 3-level scale (calm/mixed/fear) was too coarse for a product that sells market intelligence. The 5-level scale matches industry conventions (CNN Fear & Greed scale) and gives users a more nuanced read. The Portuguese labels are already in the spec assumptions.
**Alternatives considered**: BC's 3-level mapping — too coarse, loses nuance. English labels — violates constitution § IV.

---

## Decision 3: Top Movers Data Source

**Decision**: Use `getMultipleQuotes(CURATED_TICKERS)` where `CURATED_TICKERS` is a hardcoded list of the 12 most liquid B3 stocks: `['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3', 'WEGE3', 'MGLU3', 'B3SA3', 'BBAS3', 'RENT3', 'SUZB3', 'RADL3']`. Sort results by `regularMarketChangePercent` descending → top 3 are gainers; ascending → bottom 3 are losers.

**Rationale**: A full market scan via `getMarketListings()` would need pagination and be too slow. The curated 12-ticker list covers >60% of IBOVESPA market cap by weight, ensuring the most relevant movers are shown. The list is hardcoded in the page module — no API call to fetch it. `getMultipleQuotes` fetches all 12 in a single Brapi API call.
**Alternatives considered**: `getMarketListings` with `sortBy: 'change'` — requires pagination, 20+ results, slower. Full IBOVESPA constituents — 87 tickers, one API call can't handle it without pagination.

---

## Decision 4: Rendering Strategy — Full Server Component

**Decision**: `web/src/app/home/page.tsx` is an `async` Server Component. All data fetched with `Promise.all([getMarketStatus(), getMarketIndicators(), getMultipleQuotes(TICKERS)])` on the server. Data is passed as props to presentational Client Components only where interactivity is needed (none for MVP home screen — fully static render).

**Rationale**: Server-side parallel fetching eliminates client-side loading spinners, improves FCP, and keeps BRAPI_KEY off the client bundle. BC had intermediate `/api/market/...` route handlers — those add one unnecessary network hop for a Next.js app that can call the service directly from the server. No client-side state is needed for the home screen.
**Alternatives considered**: Client-side fetch via SWR/React Query — adds loading states, exposes API patterns, slower perceived performance. BC-style API routes — unnecessary indirection for a monolith.

---

## Decision 5: Mobile-First Layout — Vertical Stack

**Decision**: Single-column vertical layout for all viewports (mobile-first). No CSS grid breakpoints for the home screen sections. Order from top to bottom:
1. Page heading ("Visão Geral")
2. Temperature dial card (full width)
3. Indices row (IBOVESPA + S&P 500 side-by-side, 2-col grid — both fit on 390px)
4. SELIC card (full width)
5. Maiores altas section (full width)
6. Maiores baixas section (full width)
7. AI chat CTA banner (full width)

**Rationale**: BC's home used `lg:grid-cols-2` desktop grid with `TopAssetsCirclePacking` (Three.js circle packing). That component is explicitly out of scope for BullCapital MVP. The target user is on mobile; a clean vertical stack delivers all information without horizontal scrolling or cramped layouts.
**Alternatives considered**: 2-column grid like BC — only relevant for desktop; 390px users would see 50% width cards which are too narrow for the data.

---

## Decision 6: Independent Section Failure Handling

**Decision**: Each data section receives its own optional prop (`indices?: MarketStatusData`, `selic?: MarketIndicatorsData`, `movers?: AssetQuote[]`). If a prop is `null` or `undefined`, the section renders its own empty state card ("Dados indisponíveis") instead of crashing. `Promise.allSettled` is used instead of `Promise.all` so one failing fetch doesn't block the others.

**Rationale**: SC-004 explicitly requires zero white screens when any single data source errors. `Promise.allSettled` gives each promise an independent result. The empty state card uses the same glass treatment as the live data card so the layout doesn't shift.
**Alternatives considered**: `Promise.all` with try/catch fallback — one error swallows all data. Individual try/catch around each fetch — more verbose, same effect as `allSettled`.

---

## Decision 7: B3 Open/Closed Detection

**Decision**: B3 is considered open when `getMarketStatus()` returns an index with `regularMarketPrice > 0` and the current UTC-3 time is between 10:00 and 17:00 on a weekday. The page shows "Mercado fechado" as a badge on the indices card when the condition is false. No holiday calendar lookup for MVP.

**Rationale**: `getMarketStatus()` already has a Yahoo Finance fallback for non-Brapi data. Checking if IBOVESPA is returning live quotes is the simplest proxy for "market is open". A full B3 holiday calendar adds complexity that's out of MVP scope — the "closed" label will show on weekends reliably; Brazilian holidays may occasionally show the wrong state, which is acceptable.
**Alternatives considered**: Full B3 holiday calendar — out of MVP scope. Always showing data without a status indicator — misses FR-016 requirement.

---

## Decision 8: SELIC Display Format

**Decision**: Format `selic[0].value` (a string like `"10.5"`) as `"10,5% a.a."` using Brazilian locale formatting. If `selic` array is empty, show "—".

**Rationale**: `getMarketIndicators()` returns `selic: PrimeRateEntry[]` sorted by date descending, so `selic[0]` is always the most recent. The value is a string that needs to be parsed and re-formatted with a comma decimal separator (pt-BR convention). The "a.a." suffix (ao ano / per annum) is standard for SELIC communication to Brazilian retail investors.
**Alternatives considered**: Show raw string — inconsistent decimal format. Show percentage without "a.a." — ambiguous for beginner investors.

---

## Decision 9: Components to Create vs Reuse from BC

**Reuse from BC (pattern only, re-implement):**
- `MarketHighlightItem` atom pattern → create `web/src/components/home/MoverItem.tsx` (same glass row design, but typed to `AssetQuote` instead of `StockSummary` mock)
- `MarketHighlightList` organism glass card pattern → create `web/src/components/home/MoversSection.tsx`
- `MarketInsightCard` AI badge + copy → replace with `ChatCTA.tsx` — a simpler amethyst banner linking to `/chat` (no hardcoded AI analysis text)

**Reuse directly (no changes):**
- `MarketTemperatureDial` atom — `web/src/components/atoms/MarketTemperatureDial.tsx`
- `VariationBadge` atom — `web/src/components/atoms/VariationBadge.tsx`
- `GlassHighlight` atom — `web/src/components/atoms/GlassHighlight.tsx`

**New (no BC equivalent):**
- `web/src/components/home/IndexCard.tsx` — single index display (name, price, change %)
- `web/src/components/home/SELICCard.tsx` — SELIC rate display
- `web/src/components/home/TemperatureCard.tsx` — wraps `MarketTemperatureDial` in a glass card
- `web/src/components/home/ChatCTA.tsx` — amethyst call-to-action banner for `/chat`
- `web/src/lib/market-utils.ts` — `computeTemperature()` and `getTemperatureLabel()` utilities

**DO NOT port from BC:**
- `TopAssetsCirclePacking` — Three.js/nivo circle packing, heavy deps, out of scope
- `MarketInsightCard` with hardcoded AI text — replaced by real chat CTA
- `MarketRadarCard` — belongs to asset detail screen, not home
- `Grainient` — Three.js animated background, heavy dep, out of scope

---

## Decision 10: Curated Ticker List Location

**Decision**: Define `CURATED_TICKERS` as a `const` array in `web/src/lib/market-utils.ts` alongside the temperature utility functions. Not in the page file — keeps the page clean and makes the list testable.

**Rationale**: The curated list is a business rule, not presentation logic. It belongs in the lib layer. Exporting it from `market-utils.ts` also makes it easy to update without touching the page component.
