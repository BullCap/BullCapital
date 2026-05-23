'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Bookmark, Compass, Newspaper, Sparkles } from 'lucide-react'
import type { NewsRadarItem } from '@/lib/news-radar'

type FeedTab = 'for-you' | 'market' | 'following'

const FEED_TABS: Array<{ id: FeedTab; label: string }> = [
  { id: 'for-you', label: 'Para você' },
  { id: 'market', label: 'Mercado' },
  { id: 'following', label: 'Seguindo' },
]

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp)
  if (seconds < 3600) return `ha ${Math.max(1, Math.floor(seconds / 60))}m`
  if (seconds < 86400) return `ha ${Math.floor(seconds / 3600)}h`
  return `ha ${Math.floor(seconds / 86400)}d`
}

function filterItems(items: NewsRadarItem[], tab: FeedTab) {
  if (tab === 'market') return items.filter((item) => item.scopes.includes('market'))
  if (tab === 'following') return items.filter((item) => item.scopes.includes('watchlist'))
  return items
}

interface NewsRadarFeedProps {
  hasWatchlist: boolean
  items: NewsRadarItem[]
}

export default function NewsRadarFeed({ hasWatchlist, items }: NewsRadarFeedProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>('for-you')
  const visibleItems = useMemo(() => filterItems(items, activeTab), [activeTab, items])

  return (
    <section className="grid gap-3">
      <div className="bull-panel p-1.5">
        <div
          role="tablist"
          aria-label="Filtros do radar de noticias"
          className="grid grid-cols-3 gap-1 rounded-[1.35rem] border border-white/[0.08] bg-black/20 p-1"
        >
          {FEED_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-10 rounded-[1rem] px-2 text-xs transition ${
                activeTab === tab.id
                  ? 'border border-white/[0.08] bg-white/[0.1] text-[#F4F0FF]'
                  : 'text-[#F4F0FF]/52 hover:bg-white/[0.05] hover:text-[#F4F0FF]/82'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <EmptyFeed activeTab={activeTab} hasWatchlist={hasWatchlist} />
      ) : (
        <div className="mt-4 grid gap-3">
          {visibleItems.map((item) => (
            <article key={item.href} className="bull-panel-quiet p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-[#60A5FA]/20 bg-[#3B82F6]/10 px-2.5 text-[11px] text-[#DBEAFE]/78">
                    {item.scopes.includes('watchlist') ? <Bookmark size={11} /> : <Compass size={11} />}
                    {item.reason}
                  </span>
                  {item.tickers.map((ticker) => (
                    <span key={`${item.href}-${ticker}`} className="bull-chip min-h-7 px-2.5 py-1 text-[11px]">
                      {ticker}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] uppercase text-[#DBEAFE]/40">
                  {item.publisher}
                  {item.publishedAt > 0 ? ` · ${timeAgo(item.publishedAt)}` : ''}
                </p>
              </div>

              <Link
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-3 block"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-[15px] font-medium leading-6 text-[#F4F0FF] group-hover:text-white md:text-base">
                    {item.headline}
                  </h2>
                  <ArrowUpRight
                    size={15}
                    className="mt-1 shrink-0 text-[#F4F0FF]/28 transition group-hover:text-[#F4F0FF]/62"
                  />
                </div>
              </Link>

              <p className="mt-2 text-sm leading-6 text-[#F4F0FF]/62">{item.note}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={item.askHref}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#8B5CF6]/28 bg-[#8B5CF6]/12 px-3.5 text-xs font-medium text-[#DDD6FE] transition hover:bg-[#8B5CF6]/22"
                >
                  <Sparkles size={12} />
                  Analisar impacto
                </Link>
                {item.relatedHref && item.relatedLabel ? (
                  <Link
                    href={item.relatedHref}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3.5 text-xs text-[#F4F0FF]/76 transition hover:bg-white/[0.1] hover:text-[#F4F0FF]"
                  >
                    <ArrowRight size={12} />
                    {item.relatedLabel}
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function EmptyFeed({ activeTab, hasWatchlist }: { activeTab: FeedTab; hasWatchlist: boolean }) {
  const followingEmpty = activeTab === 'following'

  return (
    <div className="bull-panel flex min-h-56 flex-col items-center justify-center px-6 py-8 text-center">
      <span className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[#DBEAFE]/65">
        {followingEmpty ? <Bookmark size={18} /> : <Newspaper size={18} />}
      </span>
      <p className="mt-4 text-sm font-medium text-[#F4F0FF]">
        {followingEmpty && !hasWatchlist ? 'Sua lista ainda esta vazia' : 'Sem historias neste filtro'}
      </p>
      <p className="mt-1 max-w-xs text-sm leading-6 text-[#F4F0FF]/52">
        {followingEmpty
          ? 'Siga ativos para puxar noticias confirmadas deles para este radar.'
          : 'Volte ao radar geral enquanto novas manchetes confirmadas chegam.'}
      </p>
      {followingEmpty && !hasWatchlist ? (
        <Link
          href="/search"
          className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#8B5CF6]/25 bg-[#8B5CF6]/12 px-4 text-xs font-medium text-[#DDD6FE] transition hover:bg-[#8B5CF6]/22"
        >
          <Bookmark size={12} />
          Seguir ativos
        </Link>
      ) : null}
    </div>
  )
}
