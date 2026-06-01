'use client'

import { useEffect, useMemo, useState } from 'react'
import { ListChecks, MessageSquareText, X } from 'lucide-react'
import type { AssetQuote, CurrencyRate, MarketStatusData } from '@/types/market'
import { fetchTerminalQuotes } from '@/lib/actions/terminal'
import { cn } from '@/lib/utils'
import AiInsightsPanel from './AiInsightsPanel'
import AllocationSection from './AllocationSection'
import AssetComparator from './AssetComparator'
import AssetDetailDrawer from './AssetDetailDrawer'
import AssetFocus from './AssetFocus'
import HoldingsTable from './HoldingsTable'
import MarketEventsPanel from './MarketEventsPanel'
import MarketStatusBar from './MarketStatusBar'
import PerformanceContributionChart from './PerformanceContributionChart'
import PortfolioHeader from './PortfolioHeader'
import PortfolioKpiGrid from './PortfolioKpiGrid'
import PortfolioPerformanceChart from './PortfolioPerformanceChart'
import RiskOverview from './RiskOverview'
import TerminalCopilot from './TerminalCopilot'
import Watchlist from './Watchlist'
import {
  buildQuoteMap,
  DEFAULT_WATCHLIST,
  normalizeTerminalTicker,
  quoteToSnapshot,
} from './terminal-metrics'
import {
  getPortfolioById,
  type ChartMode,
  type PortfolioHolding,
  type PortfolioId,
  type TimeRange,
} from './portfolioMock'

const WATCHLIST_STORAGE_KEY = 'bull_watchlist'
const MAX_COMPARE_ASSETS = 4

interface TerminalClientProps {
  initialQuotes: AssetQuote[]
  marketStatus: MarketStatusData
  usdBrl: CurrencyRate | null
}

type WatchlistDrawer = 'watchlist' | null
type WorkspaceTab = 'carteira' | 'comparar'
type PortfolioView = 'resumo' | 'alocacao' | 'risco' | 'posicoes'

const PORTFOLIO_VIEWS: Array<{ key: PortfolioView; label: string }> = [
  { key: 'resumo', label: 'Resumo' },
  { key: 'alocacao', label: 'Alocação' },
  { key: 'risco', label: 'Risco' },
  { key: 'posicoes', label: 'Posições' },
]

function parseStoredWatchlist(value: string | null): string[] {
  if (!value) return [...DEFAULT_WATCHLIST]
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return [...DEFAULT_WATCHLIST]
    const tickers = Array.from(
      new Set(parsed.map((item) => normalizeTerminalTicker(String(item))).filter(Boolean))
    ).slice(0, 20)
    return tickers.length > 0 ? tickers : [...DEFAULT_WATCHLIST]
  } catch {
    return [...DEFAULT_WATCHLIST]
  }
}

export default function TerminalClient({ initialQuotes, marketStatus, usdBrl }: TerminalClientProps) {
  const [hydrated, setHydrated] = useState(false)
  const [watchlist, setWatchlist] = useState<string[]>([...DEFAULT_WATCHLIST])
  const [quotesBySymbol, setQuotesBySymbol] = useState<Record<string, AssetQuote>>(() =>
    buildQuoteMap(initialQuotes)
  )
  const [focusedTicker, setFocusedTicker] = useState<string | null>(DEFAULT_WATCHLIST[0])
  const [compareSet, setCompareSet] = useState<string[]>(DEFAULT_WATCHLIST.slice(0, 3))
  const [watchlistDrawer, setWatchlistDrawer] = useState<WatchlistDrawer>(null)
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('carteira')
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioId>('principal')
  const [selectedRange, setSelectedRange] = useState<TimeRange>('YTD')
  const [chartMode, setChartMode] = useState<ChartMode>('patrimonio')
  const [portfolioView, setPortfolioView] = useState<PortfolioView>('resumo')
  const [selectedHolding, setSelectedHolding] = useState<PortfolioHolding | null>(null)

  useEffect(() => {
    const storedWatchlist = parseStoredWatchlist(window.localStorage.getItem(WATCHLIST_STORAGE_KEY))
    setWatchlist(storedWatchlist)
    setFocusedTicker(storedWatchlist[0] ?? null)
    setCompareSet(storedWatchlist.slice(0, 3))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist))
  }, [hydrated, watchlist])

  useEffect(() => {
    if (!hydrated) return
    const missingTickers = watchlist.filter((ticker) => !quotesBySymbol[ticker])
    if (missingTickers.length === 0) return
    let ignore = false
    fetchTerminalQuotes(missingTickers).then((quotes) => {
      if (ignore || quotes.length === 0) return
      setQuotesBySymbol((current) => ({ ...current, ...buildQuoteMap(quotes) }))
    })
    return () => {
      ignore = true
    }
  }, [hydrated, quotesBySymbol, watchlist])

  const portfolio = useMemo(() => getPortfolioById(selectedPortfolio), [selectedPortfolio])

  const watchlistAssets = useMemo(
    () => watchlist.map((ticker) => quoteToSnapshot(ticker, quotesBySymbol[ticker])),
    [quotesBySymbol, watchlist]
  )

  const focusedAsset = useMemo(() => {
    const ticker = focusedTicker ?? watchlist[0]
    return ticker ? quoteToSnapshot(ticker, quotesBySymbol[ticker]) : null
  }, [focusedTicker, quotesBySymbol, watchlist])

  const comparedAssets = useMemo(
    () => compareSet.map((ticker) => quoteToSnapshot(ticker, quotesBySymbol[ticker])),
    [compareSet, quotesBySymbol]
  )

  const activeAssets = useMemo(
    () => (comparedAssets.length >= 2 ? comparedAssets : focusedAsset ? [focusedAsset] : []),
    [comparedAssets, focusedAsset]
  )

  const copilotContext = useMemo(
    () => ({
      type: 'terminal' as const,
      title: workspaceTab === 'carteira' ? 'Inteligência de Carteira' : 'Comparador de ativos',
      data: {
        watchlist,
        focusedTicker,
        compareSet,
        selectedAssets: activeAssets,
        portfolio: {
          name: portfolio.name,
          kpis: portfolio.kpis,
          holdings: portfolio.holdings.map((holding) => ({
            symbol: holding.symbol,
            weight: holding.weight,
            pnl: holding.pnl,
            status: holding.status,
          })),
          insights: portfolio.aiInsights.map((insight) => insight.title),
        },
      },
    }),
    [activeAssets, compareSet, focusedTicker, portfolio, watchlist, workspaceTab]
  )

  const handleFocusTicker = (ticker: string) => {
    const normalized = normalizeTerminalTicker(ticker)
    if (!normalized) return
    setFocusedTicker(normalized)
    setCompareSet((current) => {
      if (current.length === 0) return [normalized]
      if (current.length === 1 && current[0] !== normalized) return [current[0], normalized]
      if (current.includes(normalized)) return current
      return [normalized, ...current.filter((item) => item !== normalized)].slice(0, MAX_COMPARE_ASSETS)
    })
  }

  const handleToggleCompare = (ticker: string) => {
    const normalized = normalizeTerminalTicker(ticker)
    if (!normalized) return
    setFocusedTicker(normalized)
    setCompareSet((current) => {
      if (current.includes(normalized)) {
        if (current.length <= 1) return current
        const next = current.filter((item) => item !== normalized)
        if (next.length === 1) setFocusedTicker(next[0])
        return next
      }
      if (current.length >= MAX_COMPARE_ASSETS) return current
      if (current.length === 0 && focusedTicker && focusedTicker !== normalized) {
        return [focusedTicker, normalized]
      }
      return [...current, normalized]
    })
  }

  const handleRemoveFromCompare = (ticker: string) => {
    const normalized = normalizeTerminalTicker(ticker)
    if (!normalized) return
    setCompareSet((current) => {
      const next = current.filter((item) => item !== normalized)
      if (next.length >= 2) return next
      const fallback = next[0] ?? focusedTicker ?? watchlist.find((item) => item !== normalized) ?? watchlist[0]
      setFocusedTicker(fallback ?? null)
      return fallback ? [fallback] : []
    })
  }

  const handleAddTicker = (ticker: string) => {
    const normalized = normalizeTerminalTicker(ticker)
    if (!normalized) return
    setWatchlist((current) => {
      if (current.includes(normalized)) return current
      return [...current, normalized].slice(0, 20)
    })
    setFocusedTicker(normalized)
    setCompareSet((current) => [normalized, ...current.filter((item) => item !== normalized)].slice(0, MAX_COMPARE_ASSETS))
    fetchTerminalQuotes([normalized]).then((quotes) => {
      if (quotes.length === 0) return
      setQuotesBySymbol((current) => ({ ...current, ...buildQuoteMap(quotes) }))
    })
  }

  const handleRemoveTicker = (ticker: string) => {
    const normalized = normalizeTerminalTicker(ticker)
    if (!normalized) return
    setWatchlist((current) => {
      const next = current.filter((item) => item !== normalized)
      const safeNext = next.length > 0 ? next : [...DEFAULT_WATCHLIST]
      const fallback = safeNext[0] ?? null
      setFocusedTicker((currentFocus) => {
        if (currentFocus && safeNext.includes(currentFocus)) return currentFocus
        return fallback
      })
      setCompareSet((currentCompare) => {
        const nextCompare = currentCompare.filter((item) => item !== normalized && safeNext.includes(item))
        return nextCompare.length > 0 ? nextCompare.slice(0, MAX_COMPARE_ASSETS) : fallback ? [fallback] : []
      })
      return safeNext
    })
  }

  const handleOpenTickerFromInsight = (ticker: string) => {
    const holding = portfolio.holdings.find((item) => item.symbol === ticker)
    if (holding) setSelectedHolding(holding)
  }

  const watchlistPanel = (
    <Watchlist
      assets={watchlistAssets}
      focusedTicker={focusedTicker}
      compareSet={compareSet}
      onFocusTicker={handleFocusTicker}
      onToggleCompare={handleToggleCompare}
      onAddTicker={handleAddTicker}
      onRemoveTicker={handleRemoveTicker}
    />
  )

  if (!hydrated) {
    return (
      <div className="bull-frame mt-4 flex min-h-[460px] items-center justify-center p-6">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border border-[#8B5CF6]/30 border-t-[#8B5CF6]" />
          <p className="text-xs text-[#F4F0FF]/45">Preparando inteligência de carteira...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 flex min-w-0 flex-col gap-4">
      <MarketStatusBar marketStatus={marketStatus} usdBrl={usdBrl} />

      <PortfolioHeader
        selectedPortfolio={selectedPortfolio}
        selectedRange={selectedRange}
        updatedMinutesAgo={portfolio.updatedMinutesAgo}
        onPortfolioChange={setSelectedPortfolio}
        onRangeChange={setSelectedRange}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="bull-segmented">
          {[
            { key: 'carteira' as const, label: 'Gestão de carteira' },
            { key: 'comparar' as const, label: 'Comparador' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setWorkspaceTab(tab.key)}
              className={cn(
                'bull-tab',
                workspaceTab === tab.key && 'bg-white/[0.065] text-[#F4F0FF]'
              )}
              aria-pressed={workspaceTab === tab.key}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {workspaceTab === 'comparar' && (
            <button
              type="button"
              onClick={() => setWatchlistDrawer('watchlist')}
              className="bull-action min-h-9 px-3 text-xs lg:hidden"
            >
              <ListChecks size={13} />
              Watchlist
            </button>
          )}
          <button
            type="button"
            onClick={() => setCopilotOpen(true)}
            className="bull-action min-h-9 px-3 text-xs"
          >
            <MessageSquareText size={13} />
            Copiloto
          </button>
        </div>
      </div>

      {workspaceTab === 'carteira' && (
        <>
          <PortfolioKpiGrid kpis={portfolio.kpis} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="bull-eyebrow">Gestão</p>
              <h2 className="mt-1 font-serif text-xl text-starlight">Visão da carteira</h2>
            </div>
            <div className="bull-segmented-grid grid-cols-2 sm:inline-grid sm:grid-cols-4">
              {PORTFOLIO_VIEWS.map((view) => (
                <button
                  key={view.key}
                  type="button"
                  onClick={() => setPortfolioView(view.key)}
                  className="bull-tab"
                  data-active={portfolioView === view.key}
                  aria-pressed={portfolioView === view.key}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>

          {portfolioView === 'resumo' && (
            <div className="grid min-w-0 gap-4 xl:h-[460px] xl:grid-cols-[minmax(0,1fr)_24rem]">
              <PortfolioPerformanceChart
                data={portfolio.performanceHistory}
                mode={chartMode}
                benchmark={portfolio.benchmark}
                onModeChange={setChartMode}
              />
              <AiInsightsPanel insights={portfolio.aiInsights} onOpenTicker={handleOpenTickerFromInsight} />
            </div>
          )}

          {portfolioView === 'alocacao' && (
            <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(34rem,0.85fr)]">
              <AllocationSection
                byClass={portfolio.allocationByClass}
                bySector={portfolio.allocationBySector}
                byRisk={portfolio.allocationByRisk}
                byLiquidity={portfolio.allocationByLiquidity}
              />
              <PerformanceContributionChart
                top={portfolio.performanceContribution.top}
                detractors={portfolio.performanceContribution.detractors}
              />
            </div>
          )}

          {portfolioView === 'risco' && (
            <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_24rem]">
              <RiskOverview metrics={portfolio.riskMetrics} correlation={portfolio.correlation} />
              <MarketEventsPanel events={portfolio.marketEvents} />
            </div>
          )}

          {portfolioView === 'posicoes' && (
            <HoldingsTable holdings={portfolio.holdings} onSelectHolding={setSelectedHolding} />
          )}
        </>
      )}

      {workspaceTab === 'comparar' && (
        <section className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="hidden min-w-0 lg:block">{watchlistPanel}</aside>
          <main className="min-w-0">
            {comparedAssets.length >= 2 ? (
              <AssetComparator assets={comparedAssets} onRemoveTicker={handleRemoveFromCompare} />
            ) : focusedAsset ? (
              <AssetFocus
                asset={focusedAsset}
                compareSet={compareSet}
                onToggleCompare={handleToggleCompare}
              />
            ) : (
              <div className="bull-panel p-6 text-sm text-[#F4F0FF]/45">
                Selecione ativos na watchlist para iniciar a comparação.
              </div>
            )}
          </main>
        </section>
      )}

      {watchlistDrawer && (
        <div className="fixed inset-0 z-50 bg-[#0D0B14]/85 p-3 lg:hidden">
          <div className="mx-auto flex h-full max-w-md flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0D0B14]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/35">
                Watchlist
              </span>
              <button
                type="button"
                onClick={() => setWatchlistDrawer(null)}
                className="flex size-7 items-center justify-center rounded-lg border border-white/[0.08] text-[#F4F0FF]/45 transition hover:text-[#F4F0FF]"
              >
                <X size={14} />
                <span className="sr-only">Fechar</span>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{watchlistPanel}</div>
          </div>
        </div>
      )}

      {copilotOpen && (
        <button
          type="button"
          aria-label="Fechar copiloto"
          className="fixed inset-0 z-40 bg-[#0D0B14]/60"
          onClick={() => setCopilotOpen(false)}
        />
      )}

      <div
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-[26rem] flex-col border-l border-white/[0.08] bg-[#0D0B14] transition-transform duration-200',
          copilotOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/35">
            Copiloto
          </span>
          <button
            type="button"
            onClick={() => setCopilotOpen(false)}
            className="flex size-7 items-center justify-center rounded-lg border border-white/[0.08] text-[#F4F0FF]/45 transition hover:text-[#F4F0FF]"
          >
            <X size={14} />
            <span className="sr-only">Fechar copiloto</span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <TerminalCopilot activeContext={copilotContext} />
        </div>
      </div>

      <AssetDetailDrawer holding={selectedHolding} onClose={() => setSelectedHolding(null)} />
    </div>
  )
}
