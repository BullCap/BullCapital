# Contract: UI Components + Server Action

**Feature**: `004-asset-detail`
**Type**: Component Interface + Server Action Contract
**Date**: 2026-05-21

---

## Component Contracts

### `AssetHeader` (Server Component)

```ts
// web/src/components/asset/AssetHeader.tsx

interface AssetHeaderProps {
  ticker: string           // Always present — from URL param
  name: string | null      // Full company name; null → falls back to ticker
  price: number | null     // Current price in BRL; null → shows "Dados indisponíveis"
  changePercent: number | null // Daily % change; null → VariationBadge shows 0
}
```

**Renders**: Glass card with `GlassHighlight`, back link to `/home`, ticker h1, company name, BRL price, `VariationBadge variation={changePercent}`.

**Empty state**: `price === null` → replaces price + badge with "Dados indisponíveis" text. Component never throws.

---

### `PriceChartClient` (Client Component — `'use client'`)

```ts
// web/src/components/asset/PriceChartClient.tsx

interface PriceChartClientProps {
  ticker: string
  initialHistory: AssetHistoricalPrice[]  // Pre-fetched for '1mo'
  isMarketOpen: boolean
}
```

**Internal state**: `range: '1d' | '1mo' | '1y'` (default `'1mo'`), `history: AssetHistoricalPrice[]` (init from `initialHistory`), `loading: boolean`.

**On mount**: uses `initialHistory` directly for `'1mo'` — no fetch on initial render.

**On range change**: calls `fetchAssetHistory(ticker, newRange)`, updates `history`.

**Empty state**: `history.length === 0` → "Histórico indisponível" message. Component never throws.

---

### `RadarSection` (Client Component — `'use client'`)

```ts
// web/src/components/asset/RadarSection.tsx

interface RadarSectionProps {
  data: MarketRadarDataPoint[] | null
}
```

**Renders**: Glass card with Recharts `RadarChart`. Five axes always labelled in Portuguese (Rentabilidade, Momentum, Liquidez, Valuation, Tendência), amethyst fill.

**Empty state**: `data === null || data.length === 0` → "Análise indisponível". Component never throws.

---

### `AssetAnalysisCTA` (Server Component)

```ts
// web/src/components/asset/AssetAnalysisCTA.tsx

interface AssetAnalysisCTAProps {
  ticker: string  // Used in href and button copy
}
```

**Renders**: Amethyst-tinted glass card, `<Link href={/analysis?ticker=${ticker}}>` with min-h-11 (44px tap target).

**Invariant**: `href` always includes `ticker` as a query parameter. Never renders a generic `/analysis` link.

---

## Page Contract

```ts
// web/src/app/asset/[ticker]/page.tsx

interface AssetPageProps {
  params: Promise<{ ticker: string }>
}

// Behaviour:
// 1. Unauthenticated → redirect('/auth/sign-in')
// 2. Both data fetches fail → render "Ativo não encontrado" inline card + Link to /home
// 3. Partial failure → renders available sections, shows per-section empty states
```

---

## Server Action Contract

```ts
// web/src/lib/actions/market.ts
'use server'

export async function fetchAssetHistory(
  ticker: string,
  range: '1d' | '1mo' | '1y'
): Promise<AssetHistoryData>
```

**Guarantees**:
- Always returns `AssetHistoryData` shape (never throws — wraps `getAssetHistory`)
- Returns `{ results: [], error: '...' }` on failure — caller checks `results[0]?.history ?? []`
- Server-only: `BRAPI_KEY` is never exposed to the client

---

## Navigation Contract

| From | Action | To |
|------|--------|----|
| `/home` movers | tap asset row | `/asset/[ticker]` |
| `/asset/[ticker]` | tap back | `/home` |
| `/asset/[ticker]` | tap "Analisar este ativo" | `/analysis?ticker=[ticker]` |
