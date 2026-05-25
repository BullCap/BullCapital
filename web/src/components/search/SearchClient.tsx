'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, ArrowUpRight } from 'lucide-react'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import type { AssetNewsItem, AssetSearchResult } from '@/types/market'
import { buildAssetHref } from '@/lib/market-routing'
import { CompanyIcon } from '@/components/atoms/CompanyIcon'

const TYPE_LABELS: Record<string, string> = {
  stock: 'Ação',
  fund: 'FII',
  bdr: 'BDR',
  etf: 'ETF',
  fixed_income: 'Renda Fixa',
  crypto: 'Cripto',
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

  const RecentNewsWidget = (
    <div className="bull-panel p-5 w-full">
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
                <p className="text-[14px] font-medium leading-snug text-[#F4F0FF] line-clamp-2 group-hover:text-white">
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
  )

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_22rem] 2xl:grid-cols-[1fr_24rem] items-start w-full">
      {/* Coluna Esquerda: Campo de Busca & Resultados / Atalhos Rápidos */}
      <div className="flex flex-col gap-4 min-w-0">
        <div className="bull-panel overflow-hidden p-0 group/portal focus-within:border-[#8B5CF6]/55 focus-within:shadow-[inset_0_2px_4px_rgba(0,0,0,0.55),0_0_24px_rgba(139,92,246,0.22)] focus-within:bg-[#0f0c18]/95 focus-within:scale-[0.995] focus-within:-translate-y-0">
          <GlassHighlight widthPercent={60} />

          <div className="flex items-center gap-3.5 pl-7 pr-5 py-[22px]">
            <Search size={20} className="shrink-0 text-[#F4F0FF]/35 transition-colors duration-300 group-focus-within/portal:text-[#8B5CF6] group-focus-within/portal:filter group-focus-within/portal:drop-shadow-[0_0_8px_#8B5CF6]" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="PETR4, Vale, Itaú…"
              className="flex-1 bg-transparent text-[17px] font-bold text-white placeholder:text-[#F4F0FF]/25 focus:outline-none"
            />
            {loading && (
              <span className="text-xs text-[#8B5CF6] font-mono font-bold animate-pulse">Buscando…</span>
            )}
          </div>

          {showList && (
            <>
              <div className="mx-4 h-px bg-white/[0.06]" />
              {isEmpty ? (
                <div className="flex h-20 items-center justify-center">
                  <p className="text-sm font-semibold text-[#F4F0FF]/40">Nenhum ativo encontrado</p>
                </div>
              ) : (
                <div className="bull-scroll max-h-72 overflow-y-auto p-2">
                  {results.map((item) => (
                    <Link
                      key={item.symbol}
                      href={buildAssetHref(item.symbol)}
                      className="group flex items-center gap-3.5 rounded-[1.25rem] px-4 py-3.5 transition-all duration-300 hover:bg-white/[0.05] hover:shadow-[inset_0_1px_0px_rgba(255,255,255,0.06)]"
                    >
                      <CompanyIcon
                        ticker={item.symbol}
                        size={44}
                        className="rounded-[0.95rem] bg-[#0A0810]/60 border border-white/10 group-hover:border-[#8B5CF6]/50 group-hover:bg-[#8B5CF6]/15 group-hover:shadow-[0_0_12px_rgba(139,92,246,0.15)] transition-all duration-300"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-[#F4F0FF] group-hover:text-white transition-colors">{item.symbol}</p>
                        <p className="truncate text-xs font-semibold text-[#DBEAFE]/45 group-hover:text-[#DBEAFE]/60 transition-colors">{item.name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {item.type && TYPE_LABELS[item.type] && (
                          <span className="rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/8 px-3 py-0.5 text-[10px] uppercase tracking-wider font-extrabold text-[#C4B5FD]">
                            {TYPE_LABELS[item.type]}
                          </span>
                        )}
                        <ArrowUpRight
                          size={16}
                          className="text-[#F4F0FF]/35 group-hover:text-[#8B5CF6] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300"
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
          <>
            <div className="bull-panel p-5 flex flex-col gap-3">
              <GlassHighlight widthPercent={50} />
              <p className="bull-eyebrow">Atalhos rápidos</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {['PETR4', 'VALE3', 'ITUB4', 'MXRF11', 'BTC', 'ETH', 'TESOURO_SELIC_2029', 'TESOURO_IPCA_2035'].map((ticker) => (
                  <Link
                    key={ticker}
                    href={buildAssetHref(ticker)}
                    className="px-3.5 py-2 rounded-xl border border-white/[0.06] bg-white/[0.03] text-xs font-bold text-[#C4B5FD] transition hover:bg-[#8B5CF6]/15 hover:border-[#8B5CF6]/30 active:scale-[0.98]"
                  >
                    {ticker === 'TESOURO_SELIC_2029' ? 'Tesouro Selic' : ticker === 'TESOURO_IPCA_2035' ? 'Tesouro IPCA+' : ticker}
                  </Link>
                ))}
              </div>
            </div>
            <p className="px-2 text-xs text-[#F4F0FF]/35">Digite o código ou nome do ativo para pesquisar mais.</p>
          </>
        )}

        {/* Notícias no mobile (visíveis apenas se não houver query e em telas < xl) */}
        {!hasQuery && (
          <div className="xl:hidden">
            {RecentNewsWidget}
          </div>
        )}
      </div>

      {/* Coluna Direita (Sticky, apenas xl+): Notícias Recentes da B3 */}
      <div className="hidden xl:grid xl:content-start xl:gap-5 xl:sticky xl:top-24 w-full">
        {RecentNewsWidget}
      </div>
    </div>
  )
}
