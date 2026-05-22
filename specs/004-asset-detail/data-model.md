# Data Model: Asset Detail Screen

**Date**: 2026-05-21 | **Branch**: `004-asset-detail`

---

## Computed/Derived Types

These types are derived from existing `@/types/market` shapes and used as component props.

### `AssetHeaderProps`

```ts
{
  ticker: string               // e.g. "PETR4" — from URL param
  name: string | null          // radarData?.quote?.longName — null if fetch failed
  price: number | null         // radarData?.quote?.regularMarketPrice — null if fetch failed
  changePercent: number | null // radarData?.quote?.regularMarketChangePercent — null if fetch failed
}
```

Source: `MarketRadarData.quote` (type `MarketQuoteSnapshot` in `types/market.ts`)

---

### `PriceChartClientProps`

```ts
{
  ticker: string                       // passed through for server action calls
  initialHistory: AssetHistoricalPrice[] // pre-fetched for '1mo' range on server
  isMarketOpen: boolean                // from isMarketOpen() utility
}
```

Source: `AssetHistoryData.results[0].history` → `AssetHistoricalPrice[]`  
Each point: `{ timestamp: number; close: number }` — timestamp is Unix epoch seconds

---

### `RadarSectionProps`

```ts
{
  data: MarketRadarDataPoint[] | null  // null if getMarketRadarData failed
}
```

Source: `MarketRadarData.data` — pre-normalised 0–100 scores  
Each point: `{ metric: string; value: number; fullMark: number }`  
Fixed 5 entries: Rentabilidade, Momentum, Liquidez, Valuation, Tendência

---

### `AssetAnalysisCTAProps`

```ts
{
  ticker: string  // used in href="/analysis?ticker={ticker}" and button copy
}
```

---

### `ChartDataPoint` (internal to PriceChartClient)

```ts
{
  date: string   // formatted label for X-axis
  close: number  // Y-axis price value
}
```

Transformation from `AssetHistoricalPrice`:
- `timestamp * 1000` → JS Date
- For `'1d'` range: format as `HH:mm` (pt-BR time)
- For `'1mo'` / `'1y'` range: format as `dd MMM` (pt-BR short date)

---

## Page Data Flow

```
page.tsx (Server Component)
  ├── params.ticker  → string (from URL)
  ├── auth()         → redirect if no session
  │
  └── Promise.allSettled([
        getMarketRadarData(ticker),     → MarketRadarData | null
        getAssetHistory([ticker], '1mo') → AssetHistoryData
      ])
         │
         ├── radarResult → extract: name, price, changePercent, radarPoints
         └── historyResult → extract: initialHistory[]
```

---

## Server Action Contract

```ts
// web/src/lib/actions/market.ts
'use server'

async function fetchAssetHistory(
  ticker: string,
  range: '1d' | '1mo' | '1y'
): Promise<AssetHistoryData>
```

Called by: `PriceChartClient` on range toggle  
Returns: full `AssetHistoryData` — caller extracts `.results[0]?.history ?? []`

---

## Range → Brapi Interval Mapping

Handled inside existing `getAssetHistory` via `getIntervalForRange()`:

| UI Label | Range param | Brapi interval | Cache TTL |
|----------|-------------|----------------|-----------|
| 1D       | `'1d'`      | `5m`           | 5 min     |
| 1M       | `'1mo'`     | `1d`           | 24 h      |
| 1A       | `'1y'`      | `1d`           | 24 h      |

---

## Component Tree

```
/asset/[ticker]/page.tsx (Server Component)
├── AssetHeader.tsx (Server Component)
│   ├── <Link href="/home"> ← ArrowLeft icon
│   ├── ticker h1
│   ├── name p
│   └── price + VariationBadge atom
│
├── PriceChartClient.tsx ('use client')
│   ├── range toggle buttons (1D / 1M / 1A)
│   └── Recharts LineChart (ResponsiveContainer)
│
├── RadarSection.tsx ('use client')
│   └── Recharts RadarChart (ResponsiveContainer)
│
└── AssetAnalysisCTA.tsx (Server Component)
    └── <Link href="/analysis?ticker={ticker}">
```
