'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, ArrowUpRight } from 'lucide-react'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import type { AssetNewsItem, AssetSearchResult } from '@/types/market'
import { buildAssetHref } from '@/lib/market-routing'

const TYPE_LABELS: Record<string, string> = {
  stock: 'Ação',
  fund: 'FII',
  bdr: 'BDR',
  etf: 'ETF',
}

async function fetchSearch(query: string): Promise<AssetSearchResult[]> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.results ?? []
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp)
  if (seconds < 3600) return `há ${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `há ${Math.floor(seconds / 3600)}h`
  return `há ${Math.floor(seconds / 86400)}d`
}

interface SearchClientProps {
  news: AssetNewsItem[]
}

export default function SearchClient({ news }: SearchClientProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AssetSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasQuery = query.trim().length >= 2
  const isEmpty = !loading && hasQuery && results.length === 0
  const showList = results.length > 0 || isEmpty

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 2) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const data = await fetchSearch(query.trim())
      setResults(data)
      setLoading(false)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  return (
    <div className="flex flex-col gap-3">
      {/* Search input + results — mesmo card, sem gap */}
      <div className="bull-panel overflow-hidden p-0">
        <GlassHighlight widthPercent={60} />

        <div className="flex items-center gap-3 px-4 py-4">
          <Search size={16} className="shrink-0 text-[#F4F0FF]/40" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="PETR4, Vale, Itaú…"
            className="flex-1 bg-transparent text-sm text-[#F4F0FF] placeholder:text-[#F4F0FF]/35 focus:outline-none"
          />
          {loading && (
            <span className="text-[11px] text-[#DBEAFE]/45">Buscando…</span>
          )}
        </div>

        {showList && (
          <>
            <div className="mx-4 h-px bg-white/[0.07]" />
            {isEmpty ? (
              <div className="flex h-20 items-center justify-center">
                <p className="text-sm text-[#F4F0FF]/40">Nenhum ativo encontrado</p>
              </div>
            ) : (
              <div className="bull-scroll max-h-72 overflow-y-auto p-2">
                {results.map((item) => (
                  <Link
                    key={item.symbol}
                    href={buildAssetHref(item.symbol)}
                    className="group flex items-center gap-3 rounded-[1.25rem] px-3 py-3 transition hover:bg-white/[0.05]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#111827]/60">
                      <span className="text-xs font-bold text-[#8B5CF6]">
                        {item.symbol.slice(0, 2)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#F4F0FF]">{item.symbol}</p>
                      <p className="truncate text-xs text-[#DBEAFE]/50">{item.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.type && TYPE_LABELS[item.type] && (
                        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] text-[#F4F0FF]/50">
                          {TYPE_LABELS[item.type]}
                        </span>
                      )}
                      <ArrowUpRight
                        size={14}
                        className="text-[#F4F0FF]/25 group-hover:text-[#F4F0FF]/55 transition"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {query.trim().length === 0 && (
        <p className="px-2 text-xs text-[#F4F0FF]/35">Digite o código ou nome do ativo.</p>
      )}

      {/* Notícias — desaparecem enquanto o usuário pesquisa */}
      {!hasQuery && (
        <div className="bull-panel p-5">
          <GlassHighlight widthPercent={55} />
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="bull-eyebrow">Notícias recentes</p>
            <span className="bull-chip">B3</span>
          </div>

          {news.length === 0 ? (
            <div className="flex h-24 items-center justify-center">
              <p className="text-sm text-[#F4F0FF]/40">Nenhuma notícia disponível</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {news.map((item, i) => (
                <Link
                  key={`${item.link}-${i}`}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3.5 border-t border-white/[0.06] py-4 first:border-t-0 first:pt-0 last:pb-0 transition-opacity hover:opacity-75"
                >
                  <span className="mt-0.5 shrink-0 font-mono text-[10px] tabular-nums text-[#8B5CF6]/50">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium leading-snug text-[#F4F0FF] line-clamp-2 group-hover:text-white">
                      {item.title}
                    </p>
                    <p className="mt-1.5 text-[11px] text-[#DBEAFE]/40">
                      {item.publisher}
                      {item.publishedAt > 0 && (
                        <span className="ml-1.5 text-[#F4F0FF]/25">· {timeAgo(item.publishedAt)}</span>
                      )}
                    </p>
                  </div>
                  <ArrowUpRight
                    size={13}
                    className="mt-1 shrink-0 text-[#F4F0FF]/20 transition group-hover:text-[#F4F0FF]/50"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
