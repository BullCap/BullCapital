'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { CompanyIcon } from '@/components/atoms/CompanyIcon'
import { cn } from '@/lib/utils'
import type { AssetSearchResult } from '@/types/market'
import WatchlistItem from './WatchlistItem'
import type { TerminalAssetSnapshot } from './terminal-metrics'

const MAX_PORTFOLIO_ASSETS = 10

interface WatchlistProps {
  assets: TerminalAssetSnapshot[]
  focusedTicker: string | null
  compareSet: string[]
  onFocusTicker: (ticker: string) => void
  onToggleCompare: (ticker: string) => void
  onAddTicker: (ticker: string) => void
  onRemoveTicker: (ticker: string) => void
  className?: string
}

async function fetchSearch(query: string): Promise<AssetSearchResult[]> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data.results) ? data.results : []
}

export default function Watchlist({
  assets,
  focusedTicker,
  compareSet,
  onFocusTicker,
  onToggleCompare,
  onAddTicker,
  onRemoveTicker,
  className,
}: WatchlistProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AssetSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const normalizedQuery = query.trim()
  const canSearch = normalizedQuery.length >= 3
  const existingTickers = new Set(assets.map((asset) => asset.symbol))
  const isFull = assets.length >= 20
  const showResults = canSearch && (results.length > 0 || (!loading && results.length === 0))

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!canSearch) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const nextResults = await fetchSearch(normalizedQuery)
      setResults(nextResults)
      setLoading(false)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [canSearch, normalizedQuery])

  const handleAdd = (symbol: string) => {
    if (isFull || existingTickers.has(symbol)) return
    onAddTicker(symbol)
    setQuery('')
    setResults([])
  }

  return (
    <section
      className={cn(
        'flex h-full min-h-[520px] flex-col border border-white/[0.08] bg-[#0D0B14]/70',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-white/[0.08] px-3 py-2.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/35">
          Watchlist
        </span>
        <span className="text-[10px] tabular-nums text-[#F4F0FF]/25">
          {assets.length}/20
        </span>
      </div>

      <div className="relative border-b border-white/[0.06] px-3 py-2">
        <Search
          size={13}
          className="pointer-events-none absolute left-5.5 top-1/2 -translate-y-1/2 text-[#F4F0FF]/25"
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={isFull}
          placeholder={isFull ? 'Limite atingido' : 'Buscar ativo'}
          className="h-8 w-full border border-white/[0.08] bg-[#0A0810]/60 pl-8 pr-8 text-xs font-semibold text-[#F4F0FF] outline-none transition placeholder:text-[#F4F0FF]/25 focus:border-[#8B5CF6]/35 disabled:cursor-not-allowed disabled:opacity-45"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setResults([])
            }}
            className="absolute right-5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center text-[#F4F0FF]/30 transition hover:text-[#F4F0FF]"
          >
            <X size={12} />
            <span className="sr-only">Limpar busca</span>
          </button>
        )}

        {canSearch && (
          <div className="absolute left-3 right-3 top-[calc(100%+1px)] z-20 border border-white/[0.08] bg-[#0D0B14] shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
            {loading ? (
              <div className="px-3 py-2.5 text-xs text-[#F4F0FF]/35">Buscando...</div>
            ) : showResults && results.length === 0 ? (
              <div className="px-3 py-2.5 text-xs text-[#F4F0FF]/35">
                Sem resultados para &ldquo;{normalizedQuery}&rdquo;
              </div>
            ) : (
              <div className="bull-scroll max-h-56 overflow-y-auto">
                {results.map((result) => {
                  const alreadyAdded = existingTickers.has(result.symbol)
                  return (
                    <button
                      key={result.symbol}
                      type="button"
                      onClick={() => handleAdd(result.symbol)}
                      disabled={alreadyAdded || isFull}
                      className={cn(
                        'flex w-full items-center gap-2.5 border-b border-white/[0.04] px-3 py-2 text-left transition last:border-0',
                        alreadyAdded
                          ? 'cursor-default opacity-35'
                          : 'hover:bg-white/[0.04]'
                      )}
                    >
                      <CompanyIcon
                        ticker={result.symbol}
                        size={26}
                        className="shrink-0 rounded-sm border border-white/[0.08] bg-[#0A0810]/70"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-[#F4F0FF]">
                          {result.symbol}
                        </span>
                        <span className="block truncate text-[10px] text-[#F4F0FF]/35">
                          {result.name}
                        </span>
                      </span>
                      {alreadyAdded && (
                        <span className="text-[10px] text-[#F4F0FF]/30">na lista</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bull-scroll min-h-0 flex-1 overflow-y-auto">
        {assets.map((asset) => (
          <WatchlistItem
            key={asset.symbol}
            asset={asset}
            active={asset.symbol === focusedTicker}
            inCompareSet={compareSet.includes(asset.symbol)}
            compareDisabled={compareSet.length >= MAX_PORTFOLIO_ASSETS}
            onFocus={() => onFocusTicker(asset.symbol)}
            onToggleCompare={() => onToggleCompare(asset.symbol)}
            onRemove={() => onRemoveTicker(asset.symbol)}
          />
        ))}
      </div>

      {compareSet.length >= 2 && (
        <div className="border-t border-white/[0.08] px-3 py-2">
          <p className="text-[10px] text-[#F4F0FF]/30">
            <span className="font-bold text-[#8B5CF6]/80">{compareSet.length}</span> ativos em análise
          </p>
        </div>
      )}
    </section>
  )
}
