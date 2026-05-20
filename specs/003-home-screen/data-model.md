# Data Model: Home Screen — Market Overview

**Feature**: `003-home-screen`
**Date**: 2026-05-20

> This screen has no database entities. All data comes from the Brapi market service functions already in `web/src/lib/services/market.ts`. This document covers the **computed data models**, **component prop contracts**, and **display transformation rules**.

---

## Entity 1: ComputedTemperature

Derived from raw market data — not fetched directly.

| Field | Type | Source |
|-------|------|--------|
| `value` | `number` (0–100) | Computed from IBOVESPA `regularMarketChangePercent` + VIX |
| `label` | `string` | Mapped from `value` via 5-level scale |
| `level` | `'panico' \| 'medo' \| 'neutro' \| 'ganancia' \| 'euforia'` | Mapped from `value` |

**Computation** (in `web/src/lib/market-utils.ts`):
```typescript
function computeTemperature(ibovChange: number, vix: number | null): ComputedTemperature
```

**Label mapping**:
| Range | Level | Label |
|-------|-------|-------|
| 0–20 | `panico` | "Pânico extremo" |
| 21–40 | `medo` | "Medo" |
| 41–60 | `neutro` | "Neutro" |
| 61–80 | `ganancia` | "Ganância" |
| 81–100 | `euforia` | "Euforia" |

---

## Entity 2: IndexDisplayData

Transformed from `MarketStatusIndex` for display.

| Field | Type | Source | Display |
|-------|------|--------|---------|
| `name` | `string` | `MarketStatusIndex.name` | "IBOVESPA" or "S&P 500" |
| `price` | `number` | `MarketStatusIndex.regularMarketPrice` | `toLocaleString('pt-BR')` |
| `changePercent` | `number` | `MarketStatusIndex.regularMarketChangePercent` | `VariationBadge` |
| `isOpen` | `boolean` | Time check (10:00–17:00 BRT weekday) | "Mercado fechado" badge if false |

**Source**: `getMarketStatus()` → `indices` array, filtered for `^BVSP` (IBOVESPA) and `^GSPC` (S&P 500).

---

## Entity 3: SELICDisplayData

| Field | Type | Source | Display |
|-------|------|--------|---------|
| `rate` | `string` | `selic[0].value` parsed + formatted | `"10,5% a.a."` |
| `date` | `string` | `selic[0].date` | `"Atualizado em 20/05/2026"` |

**Source**: `getMarketIndicators()` → `selic[0]` (most recent, sorted desc).
**Fallback**: if `selic.length === 0`, display `"—"`.

---

## Entity 4: MoverDisplayData

Transformed from `AssetQuote` for display in the movers sections.

| Field | Type | Source | Display |
|-------|------|--------|---------|
| `ticker` | `string` | `AssetQuote.symbol` | Uppercase, e.g. "PETR4" |
| `name` | `string` | `AssetQuote.shortName` | Truncated to 20 chars |
| `price` | `number` | `AssetQuote.regularMarketPrice` | `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })` |
| `changePercent` | `number` | `AssetQuote.regularMarketChangePercent` | `VariationBadge` |
| `logoUrl` | `string \| undefined` | `AssetQuote.logourl` | `<Image>` with fallback initials |
| `href` | `string` | Derived: `/asset/${ticker}` | `<Link>` wrapper |

**Source**: `getMultipleQuotes(CURATED_TICKERS)` → `results` array.
**Gainers**: sorted by `changePercent` descending, take first 3.
**Losers**: sorted by `changePercent` ascending, take first 3.

---

## Entity 5: HomePageData (Server-fetched aggregate)

The complete data bundle assembled by the page Server Component.

```typescript
interface HomePageData {
  temperature: ComputedTemperature | null   // null if getMarketStatus fails
  ibovespa: IndexDisplayData | null
  sp500: IndexDisplayData | null
  selic: SELICDisplayData | null            // null if getMarketIndicators fails
  gainers: MoverDisplayData[]              // [] if getMultipleQuotes fails
  losers: MoverDisplayData[]               // [] if getMultipleQuotes fails
  isMarketOpen: boolean
}
```

**Fetching** (in `web/src/app/home/page.tsx`):
```typescript
const [statusResult, indicatorsResult, quotesResult] = await Promise.allSettled([
  getMarketStatus(),
  getMarketIndicators(),
  getMultipleQuotes(CURATED_TICKERS),
])
```

---

## Component File Map

```
web/src/
├── app/
│   └── home/
│       └── page.tsx                      ← UPDATE: full server component with data fetch
│
├── lib/
│   └── market-utils.ts                   ← NEW: computeTemperature(), CURATED_TICKERS, formatSELIC()
│
└── components/
    └── home/
        ├── TemperatureCard.tsx           ← NEW: wraps MarketTemperatureDial in glass card
        ├── IndexCard.tsx                 ← NEW: single index display
        ├── SELICCard.tsx                 ← NEW: SELIC rate display
        ├── MoverItem.tsx                 ← NEW: single asset row (ticker, name, price, %)
        ├── MoversSection.tsx             ← NEW: section header + list of MoverItems
        └── ChatCTA.tsx                   ← NEW: amethyst banner → /chat
```

**Unchanged pre-built files used by this feature**:
- `web/src/components/atoms/MarketTemperatureDial.tsx`
- `web/src/components/atoms/VariationBadge.tsx`
- `web/src/components/atoms/GlassHighlight.tsx`
- `web/src/lib/services/market.ts`
- `web/src/types/market.ts`

---

## Curated Tickers List (business rule)

```typescript
export const CURATED_TICKERS = [
  'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3',
  'WEGE3', 'MGLU3', 'B3SA3', 'BBAS3', 'RENT3',
  'SUZB3', 'RADL3',
]
```

Covers top ~12 most liquid B3 stocks by average daily volume. Updated when a stock is delisted or a major new addition joins the IBOVESPA top tier.
