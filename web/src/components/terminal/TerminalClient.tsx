'use client'

import { useEffect, useMemo, useState } from 'react'
import { ListChecks, MessageSquareText, X } from 'lucide-react'
import type { AssetQuote, CurrencyRate, MarketStatusData } from '@/types/market'
import { fetchTerminalQuotes } from '@/lib/actions/terminal'
import { cn } from '@/lib/utils'
import AssetComparator from './AssetComparator'
import AssetFocus from './AssetFocus'
import MarketStatusBar from './MarketStatusBar'
import TerminalCopilot from './TerminalCopilot'
import Watchlist from './Watchlist'
import {
  buildQuoteMap,
  DEFAULT_WATCHLIST,
  normalizeTerminalTicker,
  quoteToSnapshot,
} from './terminal-metrics'

const WATCHLIST_STORAGE_KEY = 'bull_watchlist'
const MAX_PORTFOLIO_ASSETS = 10

interface TerminalClientProps {
  initialQuotes: AssetQuote[]
  marketStatus: MarketStatusData
  usdBrl: CurrencyRate | null
}

type WatchlistDrawer = 'watchlist' | null

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
  const [compareSet, setCompareSet] = useState<string[]>([DEFAULT_WATCHLIST[0]])
  const [watchlistDrawer, setWatchlistDrawer] = useState<WatchlistDrawer>(null)
  const [copilotOpen, setCopilotOpen] = useState(false)

  useEffect(() => {
    const storedWatchlist = parseStoredWatchlist(window.localStorage.getItem(WATCHLIST_STORAGE_KEY))
    setWatchlist(storedWatchlist)
    setFocusedTicker(storedWatchlist[0] ?? null)
    setCompareSet(storedWatchlist[0] ? [storedWatchlist[0]] : [])
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
    return () => { ignore = true }
  }, [hydrated, quotesBySymbol, watchlist])

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
      title: 'Terminal — Mesa do Analista',
      data: { watchlist, focusedTicker, compareSet, selectedAssets: activeAssets },
    }),
    [activeAssets, compareSet, focusedTicker, watchlist]
  )

  const handleFocusTicker = (ticker: string) => {
    const normalized = normalizeTerminalTicker(ticker)
    if (!normalized) return
    setFocusedTicker(normalized)
    setCompareSet((current) => {
      if (current.length === 0) return [normalized]
      if (current.length === 1 && current[0] !== normalized) return [current[0], normalized]
      if (current.includes(normalized)) return current
      return [normalized]
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
      if (current.length >= MAX_PORTFOLIO_ASSETS) return current
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
    setCompareSet([normalized])
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
        return nextCompare.length > 0 ? nextCompare : fallback ? [fallback] : []
      })
      return safeNext
    })
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
      <div className="mt-4 flex min-h-[460px] items-center justify-center border border-white/[0.08] bg-[#0D0B14]/70">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border border-[#8B5CF6]/30 border-t-[#8B5CF6]" />
          <p className="text-xs text-[#F4F0FF]/35">Carregando terminal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 flex min-w-0 flex-col gap-3">
      <MarketStatusBar marketStatus={marketStatus} usdBrl={usdBrl} />

      {/* Controls row */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setWatchlistDrawer('watchlist')}
          className="inline-flex h-8 items-center gap-1.5 border border-white/[0.08] bg-[#0D0B14]/70 px-3 text-xs font-bold text-[#F4F0FF]/70 transition hover:border-white/[0.14] hover:text-[#F4F0FF] lg:hidden"
        >
          <ListChecks size={13} />
          Watchlist
        </button>

        <button
          type="button"
          onClick={() => setCopilotOpen(true)}
          className="ml-auto inline-flex h-8 items-center gap-1.5 border border-white/[0.08] bg-[#0D0B14]/70 px-3 text-xs font-bold text-[#F4F0FF]/70 transition hover:border-white/[0.14] hover:text-[#F4F0FF]"
        >
          <MessageSquareText size={13} />
          Copiloto
        </button>
      </div>

      {/* Main grid — 2 columns (watchlist + content) */}
      <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]">
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
          ) : null}
        </main>
      </div>

      {/* Watchlist drawer — mobile only */}
      {watchlistDrawer && (
        <div className="fixed inset-0 z-50 bg-[#0D0B14]/85 p-3 lg:hidden">
          <div className="mx-auto flex h-full max-w-md flex-col overflow-hidden border border-white/[0.08] bg-[#0D0B14]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/35">
                Watchlist
              </span>
              <button
                type="button"
                onClick={() => setWatchlistDrawer(null)}
                className="flex size-7 items-center justify-center border border-white/[0.08] text-[#F4F0FF]/45 transition hover:text-[#F4F0FF]"
              >
                <X size={14} />
                <span className="sr-only">Fechar</span>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{watchlistPanel}</div>
          </div>
        </div>
      )}

      {/* Copilot overlay — sempre montado para preservar conversa */}
      {copilotOpen && (
        <div
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
            className="flex size-7 items-center justify-center border border-white/[0.08] text-[#F4F0FF]/45 transition hover:text-[#F4F0FF]"
          >
            <X size={14} />
            <span className="sr-only">Fechar copiloto</span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <TerminalCopilot activeContext={copilotContext} />
        </div>
      </div>
    </div>
  )
}
