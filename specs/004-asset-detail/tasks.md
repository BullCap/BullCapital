# Tasks: Asset Detail Screen

**Input**: Design documents from `specs/004-asset-detail/`

**Branch**: `004-asset-detail`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks grouped by user story for independent, incremental delivery.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable (different files, no incomplete dependencies)
- **[Story]**: User story label (US1, US2, US3, US4)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the server action that the chart Client Component depends on. All subsequent components can be built in parallel after this.

- [x] T001 Create `web/src/lib/actions/market.ts` with `'use server'` directive at top; export `async function fetchAssetHistory(ticker: string, range: '1d' | '1mo' | '1y'): Promise<AssetHistoryData>` that calls `getAssetHistory([ticker], range)` from `'@/lib/services/market'` and returns the result; imports: `{ getAssetHistory }` from `'@/lib/services/market'`, `{ AssetHistoryData }` from `'@/types/market'`

**Checkpoint**: Server action exists. `PriceChartClient` can now import `fetchAssetHistory`. All Phase 2 components can be built in parallel.

---

## Phase 2: Foundational — Leaf Components (all independent, build in parallel)

**Purpose**: Four presentational components. All depend only on T001 for the server action import (`PriceChartClient` only). `AssetHeader` and `AssetAnalysisCTA` are Server Components; `PriceChartClient` and `RadarSection` are Client Components (`'use client'`).

- [x] T00[P] Create `web/src/components/asset/AssetHeader.tsx` — Server Component (no `'use client'`); props: `{ ticker: string; name: string | null; price: number | null; changePercent: number | null }`; render: outer glass card `<div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A1625]/40 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.4)] backdrop-blur-2xl">`; `<GlassHighlight widthPercent={70} />`; back link `<Link href="/home" className="mb-5 flex w-fit items-center gap-1.5 text-xs text-[#F4F0FF]/50 hover:text-[#F4F0FF]/80 transition-colors"><ArrowLeft size={14} />Voltar</Link>`; ticker heading `<h1 className="font-serif text-4xl text-[#F4F0FF]">{ticker.toUpperCase()}</h1>`; name `<p className="mt-1 truncate text-sm text-[#F4F0FF]/55">{name ?? ticker}</p>`; if `price !== null` render `<div className="mt-5 flex items-center gap-3"><p className="font-serif text-3xl font-bold text-[#F4F0FF]">{price.toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2})}</p><VariationBadge variation={changePercent ?? 0} /></div>` else render `<p className="mt-5 text-sm text-[#F4F0FF]/40">Dados indisponíveis</p>`; imports: `Link` from `'next/link'`, `{ ArrowLeft }` from `'lucide-react'`, `{ VariationBadge }` from `'@/components/atoms/VariationBadge'`, `{ GlassHighlight }` from `'@/components/atoms/GlassHighlight'`

- [x] T00[P] Create `web/src/components/asset/PriceChartClient.tsx` — `'use client'`; props: `{ ticker: string; initialHistory: AssetHistoricalPrice[]; isMarketOpen: boolean }`; declare type `type Range = '1d' | '1mo' | '1y'`; state: `const [range, setRange] = useState<Range>('1mo')`, `const [history, setHistory] = useState<AssetHistoricalPrice[]>(initialHistory)`, `const [loading, setLoading] = useState(false)`; range labels map `const RANGE_LABELS: Record<Range, string> = { '1d': '1D', '1mo': '1M', '1y': '1A' }`; `useEffect(() => { if (range === '1mo') return; let cancelled = false; setLoading(true); fetchAssetHistory(ticker, range).then(result => { if (!cancelled) { setHistory(result.results?.[0]?.history ?? []); setLoading(false); } }); return () => { cancelled = true }; }, [range, ticker])`; chart data: `const chartData = history.map(h => { const d = new Date(h.timestamp * 1000); const date = range === '1d' ? d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}); return { date, close: h.close } })`; render: outer glass card `<div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A1625]/40 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.4)] backdrop-blur-2xl">`; `<GlassHighlight widthPercent={65} />`; header row `<div className="mb-4 flex items-center justify-between"><p className="text-xs font-medium uppercase tracking-[0.2em] text-[#F4F0FF]/55">Histórico de Preço</p>{ !isMarketOpen && range === '1d' && <span className="rounded-full border border-[#F43F5E]/30 bg-[#F43F5E]/10 px-2 py-0.5 text-[10px] text-[#F43F5E]">Mercado fechado</span>}</div>`; range toggle `<div className="mb-4 flex gap-2">{(['1d','1mo','1y'] as Range[]).map(r => <button key={r} onClick={() => setRange(r)} className={`min-h-9 min-w-[3rem] rounded-xl border px-3 py-1 text-xs font-medium transition-colors ${range===r ? 'border-[#8B5CF6]/40 bg-[#8B5CF6]/20 text-[#F4F0FF]' : 'border-white/10 text-[#F4F0FF]/40 hover:text-[#F4F0FF]/70'}`}>{RANGE_LABELS[r]}</button>)}</div>`; if `loading` show `<div className="flex h-[200px] items-center justify-center"><p className="text-sm text-[#F4F0FF]/40">Carregando...</p></div>` else if `chartData.length === 0` show `<div className="flex h-[200px] items-center justify-center"><p className="text-sm text-[#F4F0FF]/40">Histórico indisponível</p></div>` else render `<ResponsiveContainer width="100%" height={200}><LineChart data={chartData}><XAxis dataKey="date" tick={{fill:'#F4F0FF',fontSize:10,opacity:0.4}} axisLine={false} tickLine={false} interval="preserveStartEnd" /><YAxis domain={['auto','auto']} tick={{fill:'#F4F0FF',fontSize:10,opacity:0.4}} axisLine={false} tickLine={false} width={65} tickFormatter={(v:number)=>v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})} /><Tooltip contentStyle={{background:'#1A1625',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'1rem',color:'#F4F0FF',fontSize:12}} formatter={(v:number)=>[v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),'Preço']} labelStyle={{color:'rgba(244,240,255,0.55)',fontSize:11}} /><Line type="monotone" dataKey="close" stroke="#8B5CF6" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>`; imports: `{ useState, useEffect }` from `'react'`, `{ ResponsiveContainer, LineChart, XAxis, YAxis, Tooltip, Line }` from `'recharts'`, `{ fetchAssetHistory }` from `'@/lib/actions/market'`, `{ AssetHistoricalPrice }` from `'@/types/market'`, `{ GlassHighlight }` from `'@/components/atoms/GlassHighlight'`

- [x] T00[P] Create `web/src/components/asset/RadarSection.tsx` — `'use client'`; props: `{ data: MarketRadarDataPoint[] | null }`; render: outer glass card with same glassmorphism classes; `<GlassHighlight widthPercent={60} />`; section label `<p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-[#F4F0FF]/55">Perfil do Ativo</p>`; if `!data || data.length === 0` render `<div className="flex h-[280px] items-center justify-center"><p className="text-sm text-[#F4F0FF]/40">Análise indisponível</p></div>`; else render `<ResponsiveContainer width="100%" height={280}><RadarChart data={data} cx="50%" cy="55%" outerRadius="72%"><PolarGrid stroke="rgba(255,255,255,0.08)" /><PolarAngleAxis dataKey="metric" tick={{fill:'rgba(244,240,255,0.65)',fontSize:11}} /><PolarRadiusAxis angle={30} domain={[0,100]} tick={false} axisLine={false} /><Radar name="Ativo" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} strokeWidth={2} /></RadarChart></ResponsiveContainer>`; imports: `{ ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar }` from `'recharts'`, `{ MarketRadarDataPoint }` from `'@/types/market'`, `{ GlassHighlight }` from `'@/components/atoms/GlassHighlight'`

- [x] T00[P] Create `web/src/components/asset/AssetAnalysisCTA.tsx` — Server Component (no `'use client'`); props: `{ ticker: string }`; render: amethyst-tinted glass card `<div className="relative overflow-hidden rounded-[2rem] border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 p-8 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_0_40px_rgba(139,92,246,0.15)] backdrop-blur-2xl">`; glow `<div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-[#8B5CF6]/20 blur-[60px]" />`; `<GlassHighlight widthPercent={70} />`; heading `<h2 className="mb-2 font-serif text-2xl text-[#F4F0FF]">Analisar este ativo</h2>`; subtext `<p className="mb-6 text-sm text-[#F4F0FF]/60">Entenda os sinais e movimentos recentes de {ticker.toUpperCase()} com contexto de IA</p>`; CTA link `<Link href={"/analysis?ticker="+ticker} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#8B5CF6]/40 bg-[#8B5CF6]/20 px-8 py-3 text-sm font-medium text-[#F4F0FF] transition hover:-translate-y-0.5 hover:bg-[#8B5CF6]/30">Ver análise de {ticker.toUpperCase()}</Link>`; imports: `Link` from `'next/link'`, `{ GlassHighlight }` from `'@/components/atoms/GlassHighlight'`

**Checkpoint**: All 4 leaf components created. Each is independently renderable with sample props. Phase 2 is blocked until T001 is done (PriceChartClient imports from it).

---

## Phase 3: User Story 1 — Investor Reads Asset Status (Priority: P1) 🎯 MVP

**Goal**: Navigate to `/asset/PETR4` — see ticker, full name, current price in BRL, daily change badge, and back link to home.

**Independent Test**: Sign in → navigate to `/asset/PETR4`. Within 3s: header shows "PETR4", company full name, BRL price, and color-coded change badge. Back arrow → `/home`. With invalid ticker: "Ativo não encontrado" card with link to home.

### Implementation

- [x] T00[US1] Replace `web/src/app/asset/[ticker]/page.tsx` with full async Server Component: (1) auth guard `const session = await auth(); if (!session?.user) redirect('/auth/sign-in')`; (2) `const { ticker } = await params`; (3) parallel fetch `const [radarResult, historyResult] = await Promise.allSettled([getMarketRadarData(ticker), getAssetHistory([ticker], '1mo')])`; (4) extract from radar: `const radarData = radarResult.status === 'fulfilled' ? radarResult.value : null`, `const name = radarData?.quote?.longName ?? null`, `const price = radarData?.quote?.regularMarketPrice ?? null`, `const changePercent = radarData?.quote?.regularMarketChangePercent ?? null`, `const radarPoints = radarData?.data ?? null`; (5) extract from history: `const historyData = historyResult.status === 'fulfilled' ? historyResult.value : null`, `const initialHistory = historyData?.results?.[0]?.history ?? []`; (6) not-found guard: if `radarData === null && historyData?.results?.length === 0` render "Ativo não encontrado" inline glass card with `<Link href="/home">Voltar ao início</Link>` early return; (7) render `<main className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-8">` containing in order: `<AssetHeader ticker={ticker} name={name} price={price} changePercent={changePercent} />`, `<PriceChartClient ticker={ticker} initialHistory={initialHistory} isMarketOpen={isMarketOpen()} />`, `<RadarSection data={radarPoints} />`, `<AssetAnalysisCTA ticker={ticker} />`; imports: `{ auth }` from `'@/lib/auth'`, `{ redirect }` from `'next/navigation'`, `{ getMarketRadarData, getAssetHistory }` from `'@/lib/services/market'`, `{ isMarketOpen }` from `'@/lib/market-utils'`, all 4 asset components from `'@/components/asset/...'`

**Checkpoint**: US1 complete — `/asset/[ticker]` renders with header, back link, and graceful not-found state. `pnpm type-check` passes.

---

## Phase 4: User Story 2 — Price History Chart (Priority: P2)

**Goal**: A price chart is visible below the header. Three range buttons (1D, 1M, 1A) update the chart when tapped. Initial render shows 1-month data.

**Independent Test**: On `/asset/PETR4`, the chart section shows a line chart with pre-loaded 1M data. Tap "1D" → chart updates to intraday data within 2s. Tap "1A" → chart updates to 12-month data. On 390px viewport: no horizontal scroll. With no data: "Histórico indisponível" appears.

### Implementation

> **Note**: US2 is fully implemented by T003 (PriceChartClient) and T006 (page assembly). The server action (T001) wires the range toggle. This phase contains one verification task.

- [x] T00[US2] Verify `PriceChartClient` in `web/src/components/asset/PriceChartClient.tsx`: (1) confirm `useEffect` dependency array includes both `range` and `ticker`; (2) confirm initial render for `'1mo'` does NOT trigger a fetch (the `if (range === '1mo') return` guard); (3) confirm `cancelled` flag prevents state updates after unmount; (4) confirm `RANGE_LABELS` maps `'1mo'` → `'1M'` and `'1y'` → `'1A'`; (5) confirm `fetchAssetHistory` import path is `'@/lib/actions/market'` (not the service directly); fix any issues found

**Checkpoint**: US2 complete — chart loads with 1M data server-side, range toggle triggers server action fetch, empty state shows on failed history.

---

## Phase 5: User Story 3 — Radar Chart (Priority: P3)

**Goal**: Scroll below the price chart — see a filled radar chart with five axes (Rentabilidade, Momentum, Liquidez, Valuation, Tendência), each 0–100.

**Independent Test**: On `/asset/PETR4`, scroll past the price chart. Five-axis radar chart is visible, filled with amethyst colour, all axis labels readable on 390px. With failed radar data: "Análise indisponível" appears.

### Implementation

> **Note**: US3 is fully implemented by T004 (RadarSection) and T006 (page assembly). `getMarketRadarData` returns pre-scored data — no additional scoring logic needed. This phase contains one verification task.

- [x] T00[US3] Verify `RadarSection` in `web/src/components/asset/RadarSection.tsx`: (1) confirm `data` prop type is `MarketRadarDataPoint[] | null`; (2) confirm `dataKey="metric"` on `PolarAngleAxis` (axis labels from `MarketRadarDataPoint.metric`); (3) confirm `dataKey="value"` on `Radar`; (4) confirm `ResponsiveContainer` has `width="100%"` and fixed `height={280}`; (5) confirm empty state renders when `data` is null or empty array; fix any issues found

**Checkpoint**: US3 complete — radar chart renders with amethyst fill, all five axes labelled in Portuguese.

---

## Phase 6: User Story 4 — Contextual Analysis CTA (Priority: P4)

**Goal**: "Analisar este ativo" CTA is visible at the bottom. Tapping it navigates to `/analysis?ticker=PETR4`.

**Independent Test**: Scroll to bottom of `/asset/PETR4`. CTA card is visible. Tap "Ver análise de PETR4" → browser URL changes to `/analysis?ticker=PETR4`. CTA is ≥44px tall on 390px screen.

### Implementation

> **Note**: US4 is fully implemented by T005 (AssetAnalysisCTA) and T006 (page assembly). This phase contains one verification task.

- [x] T00[US4] Verify `AssetAnalysisCTA` in `web/src/components/asset/AssetAnalysisCTA.tsx`: (1) confirm `href` is `"/analysis?ticker="+ticker` (dynamic, not hardcoded); (2) confirm Link has `min-h-11` for 44px tap target; (3) confirm heading is "Analisar este ativo" (exact string); (4) confirm subtext references `ticker.toUpperCase()` (asset-specific, not generic); (5) confirm `AssetAnalysisCTA` is rendered as last child in page stack in `web/src/app/asset/[ticker]/page.tsx`; fix any issues found

**Checkpoint**: US4 complete — analysis CTA anchors to specific ticker, always visible at bottom of screen.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T01Run `pnpm type-check` from `web/` — resolve all TypeScript errors across `web/src/lib/actions/market.ts`, all 4 asset components, and `web/src/app/asset/[ticker]/page.tsx`; zero errors required before proceeding
- [x] T01[P] Audit all user-facing strings in `web/src/components/asset/` and `web/src/app/asset/[ticker]/page.tsx` for English — section labels, range button labels ("1D","1M","1A" are acceptable abbreviations), empty state messages, back button text, CTA copy; fix any non-pt-BR strings found
- [x] T01[P] Verify 44px tap targets: `AssetAnalysisCTA` link has `min-h-11`; range toggle buttons have `min-h-9` (36px — acceptable for secondary controls); back link has sufficient padding; fix any interactive element falling below 44px for primary actions
- [x] T01[P] Verify `next.config.ts` does not block Recharts — confirm no CSP headers or image domain restrictions that would break chart rendering; if `next/image` is used anywhere in asset components, confirm `unoptimized` prop or add domain to `images.remotePatterns`
- [x] T01Manual end-to-end verification: (1) `pnpm dev` from `web/`; (2) sign in → tap a mover on `/home` → lands on `/asset/[ticker]`; (3) header shows ticker + name + price + badge; (4) chart shows 1M data on load; (5) tap "1D" → chart updates; (6) tap "1A" → chart updates; (7) scroll → radar chart renders with 5 axes; (8) scroll to bottom → CTA visible; (9) tap CTA → lands on `/analysis?ticker=[ticker]`; (10) tap back → lands on `/home`; (11) navigate to `/asset/INVALID123` → "Ativo não encontrado" card with link to home; (12) test on 390px viewport (Chrome DevTools mobile) for no overflow

---

## Dependencies & Execution Order

### Critical Chain

```
T001 (server action — market.ts)
  ↓
T002–T005 [all parallel — 4 leaf components; T003 imports T001]
  ↓
T006 (page.tsx — imports T001 + T002–T005)
  ↓
T007, T008, T009 [parallel verification tasks]
  ↓
T010 (type-check gate)
  ↓
T011, T012, T013 [parallel polish]
  ↓
T014 (full manual verification)
```

### Parallel Batch — Phase 2

```bash
# After T001, all 4 can be written simultaneously:
T002  components/asset/AssetHeader.tsx
T003  components/asset/PriceChartClient.tsx   ← imports from lib/actions/market.ts (T001)
T004  components/asset/RadarSection.tsx
T005  components/asset/AssetAnalysisCTA.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. T001 — server action
2. T002 — AssetHeader (header is the MVP core)
3. T006 (partial) — page with only `AssetHeader` rendered; skip chart, radar, CTA for now
4. **STOP and VALIDATE**: `/asset/PETR4` shows ticker + name + price + change

### Full Delivery

T001 → T002–T005 (parallel) → T006 → T007 + T008 + T009 → T010 → T011 + T012 + T013 → T014

---

## Notes

- [P] tasks = different files, no incomplete dependencies — safe to batch in one agent turn
- T001 (server action) is the single blocking prerequisite — `PriceChartClient` imports `fetchAssetHistory` from it
- `VariationBadge` prop is `variation: number` — confirmed from `web/src/components/atoms/VariationBadge.tsx` (NOT `change`)
- `getMarketRadarData` returns `result.quote.regularMarketPrice` and `result.quote.regularMarketChangePercent` — these are the price/change for the header
- `getMarketRadarData` returns `result.quote.longName` — use this for the company name in the header
- `AssetHistoricalPrice` shape: `{ timestamp: number; close: number }` — timestamp is Unix epoch **seconds**, multiply by 1000 for JS Date
- Recharts `ResponsiveContainer` requires a parent with defined height — the glass card wrapper provides it
- `'use client'` is required for `PriceChartClient` AND `RadarSection` because Recharts uses browser APIs internally
- `MarketTemperatureDial` is also `'use client'` (same reason) — this is the expected pattern for Recharts components
- The `getAssetHistory` range param for 1 year is `'1y'` (not `'1yr'` or `'12mo'`) — verified from `getIntervalForRange` in `market.ts`
- `Promise.allSettled` in T006 ensures the page never throws — each result is individually checked with `.status === 'fulfilled'`
- Not-found detection: both `radarData === null` AND `initialHistory.length === 0` must be true — if only one fails, show partial data with per-section empty states
