# Tasks: Home Screen — Market Overview

**Input**: Design documents from `specs/003-home-screen/`

**Branch**: `003-home-screen`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks grouped by user story for independent, incremental delivery.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable (different files, no incomplete dependencies)
- **[Story]**: User story label (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the utility module that all components and the page depend on.

- [x] T001 Create `web/src/lib/market-utils.ts` with: (1) `export const CURATED_TICKERS = ['PETR4','VALE3','ITUB4','BBDC4','ABEV3','WEGE3','MGLU3','B3SA3','BBAS3','RENT3','SUZB3','RADL3']`; (2) `export type TemperatureLevel = 'panico' | 'medo' | 'neutro' | 'ganancia' | 'euforia'`; (3) `export type ComputedTemperature = { value: number; label: string; level: TemperatureLevel }`; (4) `export function computeTemperature(ibovChange: number, vix: number | null): ComputedTemperature` — `base = Math.min(100, Math.max(0, (ibovChange + 5) / 10 * 100))`, `amp = vix !== null ? (vix > 30 ? 1.4 : vix > 20 ? 1.1 : 0.9) : 1.0`, `value = Math.round(Math.min(100, Math.max(0, 50 + (base - 50) * amp)))`, return label+level from `value <= 20 → { level: 'panico', label: 'Pânico extremo' }`, `<= 40 → { 'medo', 'Medo' }`, `<= 60 → { 'neutro', 'Neutro' }`, `<= 80 → { 'ganancia', 'Ganância' }`, `else → { 'euforia', 'Euforia' }`; (5) `export function formatSELIC(selic: PrimeRateEntry[]): { rate: string; date: string } | null` — if empty return null, else `parseFloat(selic[0].value).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '% a.a.'` and format date as `new Date(selic[0].epochDate * 1000).toLocaleDateString('pt-BR')`; (6) `export function isMarketOpen(): boolean` — `const now = new Date(); const brt = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })); const day = brt.getDay(); const hour = brt.getHours() + brt.getMinutes() / 60; return day >= 1 && day <= 5 && hour >= 10 && hour < 17`; imports: `{ PrimeRateEntry }` from `'@/types/market'`

**Checkpoint**: Utility module complete. `computeTemperature(-3, 25)` → `{ value: ~25, label: 'Medo', level: 'medo' }`. All subsequent components can import from here.

---

## Phase 2: Foundational — Leaf Components (all independent, build in parallel)

**Purpose**: The six presentational components. All are Server Components (no `'use client'`). All depend only on T001 for type imports.

- [x] T002 [P] Create `web/src/components/home/TemperatureCard.tsx` — Server Component; props: `{ temperature: ComputedTemperature | null }`; render: outer `<div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A1625]/40 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.4)] backdrop-blur-2xl">` containing `<GlassHighlight widthPercent={75} />`, amethyst glow `<div className="pointer-events-none absolute -top-10 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[#8B5CF6]/15 blur-[80px]" />`, heading `<p className="text-xs font-medium uppercase tracking-[0.2em] text-[#F4F0FF]/55 mb-4">Temperatura do Mercado</p>`, then if `temperature` is null render `<p className="text-center text-sm text-[#F4F0FF]/40">Dados indisponíveis</p>`, else render `<div className="flex flex-col items-center gap-4">` with `<MarketTemperatureDial value={temperature.value} stateName={temperature.label} />` and `<p className="font-serif text-lg text-[#F4F0FF]">{temperature.label}</p>`; imports: `{ GlassHighlight }` from `'@/components/atoms/GlassHighlight'`, `{ MarketTemperatureDial }` from `'@/components/atoms/MarketTemperatureDial'`, `{ ComputedTemperature }` from `'@/lib/market-utils'`

- [x] T003 [P] Create `web/src/components/home/IndexCard.tsx` — Server Component; props: `{ name: string; price: number | null; changePercent: number | null; isOpen: boolean }`; render: `<div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A1625]/40 p-5 shadow-[...] backdrop-blur-2xl flex flex-col gap-3">` with `<GlassHighlight widthPercent={80} />`, index name `<p className="text-xs font-medium uppercase tracking-[0.15em] text-[#F4F0FF]/55">{name}</p>`, if not `isOpen` show `<span className="rounded-full border border-[#F43F5E]/30 bg-[#F43F5E]/10 px-2 py-0.5 text-[10px] text-[#F43F5E]">Mercado fechado</span>`, if `price` is null render `<p className="text-sm text-[#F4F0FF]/40">Dados indisponíveis</p>`, else render price `<p className="font-serif text-2xl font-semibold text-[#F4F0FF]">{price.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>` and `<VariationBadge change={changePercent ?? 0} />` (import `VariationBadge` from `'@/components/atoms/VariationBadge'`); imports: `{ GlassHighlight }`, `{ VariationBadge }` from `'@/components/atoms/VariationBadge'`

- [x] T004 [P] Create `web/src/components/home/SELICCard.tsx` — Server Component; props: `{ selic: { rate: string; date: string } | null }`; render: glass card `<div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A1625]/40 p-6 shadow-[...] backdrop-blur-2xl">` with `<GlassHighlight widthPercent={60} />`, label `<p className="text-xs font-medium uppercase tracking-[0.2em] text-[#F4F0FF]/55 mb-2">Taxa SELIC</p>`, if `selic` is null show `<p className="text-sm text-[#F4F0FF]/40">Dados indisponíveis</p>`, else show `<p className="font-serif text-3xl font-bold text-[#F4F0FF]">{selic.rate}</p>` and `<p className="mt-1 text-xs text-[#F4F0FF]/40">Atualizado em {selic.date}</p>`; import `{ GlassHighlight }`

- [x] T005 [P] Create `web/src/components/home/MoverItem.tsx` — Server Component; props: `{ ticker: string; name: string; price: number; changePercent: number; logoUrl?: string; href: string }`; render: `<Link href={href} className="flex min-h-11 items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-2.5 transition-all duration-500 hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.05]">`; left side: logo container `<div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#1A1625]/60">` — if `logoUrl` render `<Image src={logoUrl} alt={ticker} fill className="object-cover" unoptimized />` else render `<span className="flex h-full w-full items-center justify-center text-xs font-bold text-[#8B5CF6]">{ticker.slice(0,2)}</span>`; middle: `<div className="min-w-0 flex-1"><p className="font-serif text-sm text-[#F4F0FF]">{ticker}</p><p className="truncate text-xs text-[#F4F0FF]/40">{name.slice(0,22)}</p></div>`; right: `<div className="flex flex-col items-end gap-1"><p className="text-sm font-medium text-[#F4F0FF]">{price.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</p><VariationBadge change={changePercent} /></div>`; imports: `Link` from `'next/link'`, `Image` from `'next/image'`, `{ VariationBadge }` from `'@/components/atoms/VariationBadge'`

- [x] T006 [P] Create `web/src/components/home/MoversSection.tsx` — Server Component; props: `{ title: string; icon: 'gainers' | 'losers'; movers: Array<{ ticker: string; name: string; price: number; changePercent: number; logoUrl?: string }> }`; render: glass card wrapper `<div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A1625]/40 p-6 shadow-[...] backdrop-blur-2xl">` with `<GlassHighlight widthPercent={50} />`, amethyst glow, header row `<div className="mb-4 flex items-center gap-2">` with SVG triangle icon (upward + amethyst for gainers: `<svg width="14" height="14"><path d="M7 2L12 10H2L7 2Z" fill="#8B5CF6"/></svg>`, downward + rose for losers: `<svg width="14" height="14"><path d="M7 12L2 4H12L7 12Z" fill="#F43F5E"/></svg>`) and `<h3 className="font-serif text-lg text-[#F4F0FF]">{title}</h3>`; if `movers.length === 0` render `<p className="text-center text-sm text-[#F4F0FF]/40 py-4">Dados de mercado indisponíveis</p>`, else render `<div className="flex flex-col gap-2">` with `movers.slice(0,3).map(m => <MoverItem key={m.ticker} {...m} href={'/asset/'+m.ticker} />)`; imports: `MoverItem` from `'./MoverItem'`, `{ GlassHighlight }` from `'@/components/atoms/GlassHighlight'`

- [x] T007 [P] Create `web/src/components/home/AnalysisCTA.tsx` — Server Component, no props; render: `<div className="relative overflow-hidden rounded-[2rem] border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_0_40px_rgba(139,92,246,0.15)] backdrop-blur-2xl text-center">` with `<GlassHighlight widthPercent={70} />`, amethyst glow `<div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-[#8B5CF6]/20 blur-[60px]" />`, heading `<h2 className="font-serif text-2xl text-[#F4F0FF] mb-2">Entenda os sinais de hoje</h2>`, subtext `<p className="text-sm text-[#F4F0FF]/60 mb-6">A IA transforma movimentos do mercado em análise contextual</p>`, link `<Link href="/analysis" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#8B5CF6]/40 bg-[#8B5CF6]/20 px-8 py-3 text-sm font-medium text-[#F4F0FF] transition hover:bg-[#8B5CF6]/30 hover:-translate-y-0.5">Ver análise do mercado</Link>`; imports: `Link` from `'next/link'`, `{ GlassHighlight }` from `'@/components/atoms/GlassHighlight'`; do not use open-ended prompt copy

**Checkpoint**: All 6 leaf components created. Each can be rendered standalone with sample props.

---

## Phase 3: User Story 1 — Investor Reads Market at a Glance (Priority: P1) 🎯 MVP

**Goal**: Sign in, land on `/home`, see temperature dial + IBOVESPA + S&P 500 + SELIC all rendered within 3 seconds.

**Independent Test**: Sign in → navigate to `/home`. Within 3s: `TemperatureCard` shows dial + label; two `IndexCard` components show prices and change badges; `SELICCard` shows rate. No blank sections. On 390px screen, all content is visible without horizontal scroll.

### Implementation

- [x] T008 [US1] Replace `web/src/app/home/page.tsx` with a full async Server Component: (1) auth guard: `const session = await auth(); if (!session?.user) redirect('/auth/sign-in')`; (2) parallel data fetch for indices, SELIC, and movers; (3) compute temperature from IBOVESPA + VIX; (4) format SELIC and map gainers/losers into `MoverDisplayData`; (5) render a mobile stack containing page heading, `<TemperatureCard />`, index cards, `<SELICCard />`, movers sections, and `<AnalysisCTA />`; imports: `{ auth }` from `'@/lib/auth'`, `{ redirect }` from `'next/navigation'`, market service functions, market utilities, and all home components from `'@/components/home/...'`

**Checkpoint**: US1 complete — `/home` renders temperature dial, two index cards, SELIC. Each section shows empty state if its data source fails. `pnpm type-check` passes.

---

## Phase 4: User Story 2 — Investor Discovers Top Movers (Priority: P2)

**Goal**: Scroll past the temperature section on `/home` — see "Maiores altas" and "Maiores baixas" with 3 real tickers each, each card tappable to `/asset/[ticker]`.

**Independent Test**: On the home screen with a valid `BRAPI_KEY`, the two `MoversSection` components each show 3 `MoverItem` rows. Tapping any row navigates to `/asset/PETR4` (or whichever ticker). Without `BRAPI_KEY`, both sections show "Dados de mercado indisponíveis".

### Implementation

> **Note**: US2 is fully implemented by T005, T006, and T008. The data flow (quotes → sort → gainers/losers → `MoversSection` → `MoverItem` → `/asset/[ticker]`) is wired in the page assembly (T008). This phase contains one verification task only.

- [x] T009 [US2] Verify the movers data pipeline end-to-end in `web/src/app/home/page.tsx`: confirm `getMultipleQuotes(CURATED_TICKERS)` result is correctly sorted for gainers (descending `regularMarketChangePercent`) and losers (ascending), that the `.map()` transformation to `MoverItem` props is correct, and that each `href` is `/asset/${q.symbol}` — fix any issues found

**Checkpoint**: US2 complete — both movers sections render with real data or empty states. Each asset card is a valid link to `/asset/[ticker]`.

---

## Phase 5: User Story 3 — Investor Opens Contextual Analysis from Home (Priority: P3)

**Goal**: The `AnalysisCTA` component is visible on the home screen and tapping "Ver análise do mercado" navigates to `/analysis`.

**Independent Test**: On the home screen, scroll to the bottom. `AnalysisCTA` is visible. Tap "Ver análise do mercado" → lands on `/analysis`. The button is ≥44px tall and fully visible on 390px without horizontal scroll.

### Implementation

> **Note**: US3 is fully implemented by T007 and T008. `AnalysisCTA` is rendered as the last item in the page stack. This phase contains one verification task only.

- [x] T010 [US3] Verify `AnalysisCTA` in `web/src/components/home/AnalysisCTA.tsx`: confirm `href="/analysis"` is present, button text is "Ver análise do mercado" (exact string), the `<Link>` element has `min-h-11` ensuring 44px tap height, and the component is included as the last child in the page stack in `web/src/app/home/page.tsx` — fix any issues found

**Checkpoint**: US3 complete — contextual analysis CTA visible and tappable at the bottom of the home screen.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T011 Run `pnpm type-check` from `web/` — resolve all TypeScript errors across `market-utils.ts`, all 6 home components, and `home/page.tsx`; zero errors required before proceeding
- [x] T012 [P] Audit all user-facing strings in `web/src/components/home/` and `web/src/app/home/page.tsx` for English — check section titles, empty state messages, labels, button text; fix any found (all must be pt-BR)
- [x] T013 [P] Verify 44px tap targets: `MoverItem` has `min-h-11`, `AnalysisCTA` link has `min-h-11`, `IndexCard` touch areas; fix any that fall short
- [x] T014 Manual end-to-end verification: (1) `docker compose up -d db && pnpm dev`; (2) sign in → `/home`; (3) confirm temperature dial renders with a value + label; (4) confirm IBOVESPA and S&P 500 cards show prices; (5) confirm SELIC shows a rate; (6) confirm movers show 3 assets each or empty state; (7) tap a mover → confirm navigation to `/asset/[ticker]`; (8) tap "Ver análise do mercado" → confirm `/analysis`; (9) test with `BRAPI_KEY` unset — confirm all sections show empty state without crashing

---

## Dependencies & Execution Order

### Critical Chain

```
T001 (market-utils.ts — types + functions)
  ↓
T002–T007 [all parallel — 6 leaf components]
  ↓
T008 (home/page.tsx — imports T001 + T002–T007)
  ↓
T009 (verify movers pipeline)
T010 (verify AnalysisCTA)
  ↓
T011 (type-check gate)
  ↓
T012, T013 [parallel polish]
  ↓
T014 (full manual verification)
```

### Parallel Batch — Phase 2

```bash
# After T001, all 6 can be written simultaneously:
T002  components/home/TemperatureCard.tsx
T003  components/home/IndexCard.tsx
T004  components/home/SELICCard.tsx
T005  components/home/MoverItem.tsx
T006  components/home/MoversSection.tsx
T007  components/home/AnalysisCTA.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. T001 — utility module
2. T002 + T003 + T004 — TemperatureCard, IndexCard, SELICCard (skip MoversSection/MoverItem/AnalysisCTA for now)
3. T008 (partial) — page with only temperature + indices + SELIC rendered
4. **STOP and VALIDATE**: `/home` shows market at a glance

### Full Delivery

1. T001 → T002–T007 (parallel) → T008 → T009 → T010 → T011 → T012+T013 → T014

---

## Notes

- [P] tasks = different files, no incomplete dependencies — safe to batch in one agent turn
- T001 (`market-utils.ts`) is the single blocking prerequisite — nothing compiles without the type exports
- `Promise.allSettled` in T008 means the page never throws due to a failed fetch — each result is individually checked with `result.status === 'fulfilled'`
- `getMultipleQuotes` from `market.ts` returns `{ results: AssetQuote[]; error?: string }` — always destructure `.results`, never assume the array exists on the top-level object
- `MarketTemperatureDial` atom props are `{ value: number; stateName: string }` — confirmed from `web/src/components/atoms/MarketTemperatureDial.tsx`
- `VariationBadge` props: confirm the actual prop name from `web/src/components/atoms/VariationBadge.tsx` before using — it may be `change` or `value` or `percent`
- IBOVESPA symbol in Brapi is `'^BVSP'`, S&P 500 is `'^GSPC'`, VIX is `'^VIX'` — these are returned by `getMarketStatus()` in the `indices` array
- `logourl` on `AssetQuote` may be an empty string for some tickers — the `MoverItem` fallback initials circle handles this
- The `next/image` `<Image>` component requires `unoptimized` prop when `src` is an external URL not in `next.config.ts` `images.domains` — add `unoptimized` to logo images or configure the domain
