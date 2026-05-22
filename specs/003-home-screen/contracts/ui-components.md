# Contract: UI Component Interfaces — Home Screen

**Feature**: `003-home-screen`
**Date**: 2026-05-20

---

## Utility: `computeTemperature`

**File**: `web/src/lib/market-utils.ts`

```typescript
export function computeTemperature(
  ibovChange: number,
  vix: number | null
): ComputedTemperature
```

**Algorithm**:
```
base = clamp((ibovChange + 5) / 10 * 100, 0, 100)
amp  = vix !== null ? (vix > 30 ? 1.4 : vix > 20 ? 1.1 : 0.9) : 1.0
value = Math.round(clamp(50 + (base - 50) * amp, 0, 100))
label = TEMPERATURE_LABELS[level based on value]
```

**Returns**: `{ value: number, label: string, level: TemperatureLevel }`

---

## Utility: `formatSELIC`

**File**: `web/src/lib/market-utils.ts`

```typescript
export function formatSELIC(selic: PrimeRateEntry[]): SELICDisplayData | null
```

Returns `null` if `selic` is empty. Otherwise parses `selic[0].value` as a float, formats with 1 decimal and comma separator, appends `% a.a.`

---

## Component: `TemperatureCard`

**File**: `web/src/components/home/TemperatureCard.tsx`
**Type**: Server Component (no `'use client'`)

```typescript
interface TemperatureCardProps {
  temperature: ComputedTemperature | null
}
```

**Renders**: Glass card with `GlassHighlight`, amethyst glow, `MarketTemperatureDial` atom (props: `value`, `stateName`), temperature label below the dial. If `temperature` is null, renders empty state "Dados indisponíveis".

---

## Component: `IndexCard`

**File**: `web/src/components/home/IndexCard.tsx`
**Type**: Server Component

```typescript
interface IndexCardProps {
  name: string
  price: number | null
  changePercent: number | null
  isOpen: boolean
}
```

**Renders**: Glass card with index name, formatted price in the local locale (no BRL symbol — indices are points not currency), `VariationBadge` for change %, and a "Mercado fechado" badge (rose-colored) when `isOpen` is false. If `price` is null, renders "Dados indisponíveis".

---

## Component: `SELICCard`

**File**: `web/src/components/home/SELICCard.tsx`
**Type**: Server Component

```typescript
interface SELICCardProps {
  selic: SELICDisplayData | null
}
```

**Renders**: Glass card labeled "Taxa SELIC", displays `selic.rate` (e.g., "10,5% a.a.") in large serif font, `selic.date` in small muted text below. If `selic` is null, renders "Dados indisponíveis".

---

## Component: `MoverItem`

**File**: `web/src/components/home/MoverItem.tsx`
**Type**: Server Component

```typescript
interface MoverItemProps {
  ticker: string
  name: string
  price: number
  changePercent: number
  logoUrl?: string
  href: string
}
```

**Renders**: Full-width row wrapped in a `<Link href={href}>`. Left: logo (36×36 rounded, fallback initials circle) + ticker + truncated name. Right: BRL price + `VariationBadge`. Min height 44px. Hover state: subtle border brightening and -translate-y-0.5.

---

## Component: `MoversSection`

**File**: `web/src/components/home/MoversSection.tsx`
**Type**: Server Component

```typescript
interface MoversSectionProps {
  title: string           // "Maiores altas" or "Maiores baixas"
  icon: 'gainers' | 'losers'
  movers: MoverDisplayData[]
}
```

**Renders**: Glass card with section title row (icon + label in font-serif), then a list of up to 3 `MoverItem` rows. If `movers.length === 0`, renders the empty state message "Dados de mercado indisponíveis" centered inside the card.

**Icon**: Gainers → upward triangle SVG (amethyst). Losers → downward triangle SVG (rose).

---

## Component: `AnalysisCTA`

**File**: `web/src/components/home/AnalysisCTA.tsx`
**Type**: Server Component

```typescript
// No props — static CTA
export default function AnalysisCTA(): JSX.Element
```

**Renders**: Full-width glass card with amethyst glow, `GlassHighlight`, a heading "Entenda os sinais de hoje" in font-serif, a short subtext "A IA transforma movimentos do mercado em análise contextual", and a `<Link href="/analysis">` button "Ver análise do mercado" styled as the primary amethyst button. Minimum height 44px on the button.

**Constraint**: This component must not use open-ended prompt copy such as "conversar" or "perguntar livremente". It frames AI as interpretation of concrete market signals.

---

## Page: `HomePageServer`

**File**: `web/src/app/home/page.tsx`
**Type**: Async Server Component

**Data fetching**:
```typescript
const [statusResult, indicatorsResult, quotesResult] = await Promise.allSettled([
  getMarketStatus(),
  getMarketIndicators(),
  getMultipleQuotes(CURATED_TICKERS),
])
```

**Layout** (vertical stack, full width, gap-6, max-w-screen-sm mx-auto px-4):
```
<PageHeading>              ← "Visão Geral" h1 + subtitle
<TemperatureCard />        ← full width
<div grid-cols-2>          ← IndexCard IBOVESPA | IndexCard S&P 500
<SELICCard />              ← full width
<MoversSection gainers />  ← full width
<MoversSection losers />   ← full width
<AnalysisCTA />            ← full width
```
