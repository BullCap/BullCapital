'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Compass,
  Newspaper,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Share2,
  Check,
} from 'lucide-react'
import type { NewsRadarItem } from '@/lib/news-radar'

type FeedTab = 'for-you' | 'market' | 'following'

const FEED_TABS: Array<{ id: FeedTab; label: string }> = [
  { id: 'for-you', label: 'Para você' },
  { id: 'market', label: 'Mercado' },
  { id: 'following', label: 'Seguindo' },
]

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp)
  if (seconds < 3600) return `há ${Math.max(1, Math.floor(seconds / 60))}m`
  if (seconds < 86400) return `há ${Math.floor(seconds / 3600)}h`
  return `há ${Math.floor(seconds / 86400)}d`
}

function filterItems(items: NewsRadarItem[], tab: FeedTab) {
  if (tab === 'market') return items.filter((item) => item.scopes.includes('market'))
  if (tab === 'following') return items.filter((item) => item.scopes.includes('watchlist'))
  return items
}

function getPublisherInitials(publisher: string): string {
  const parts = publisher.split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return publisher.slice(0, 2).toUpperCase()
}

function getPublisherHandle(publisher: string): string {
  const clean = publisher.toLowerCase().replace(/[^a-z0-9]/g, '')
  return `@${clean || 'source'}`
}

function isVerifiedPublisher(publisher: string): boolean {
  const p = publisher.toLowerCase()
  return (
    p.includes('reuters') ||
    p.includes('bloomberg') ||
    p.includes('zacks') ||
    p.includes('valor') ||
    p.includes('infomoney') ||
    p.includes('estadao') ||
    p.includes('globo') ||
    p.includes('exame') ||
    p.includes('yahoo')
  )
}

function ShareButton({ url, headline }: { url: string; headline: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: headline,
          url: url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.warn('Failed to share/copy:', err)
    }
  }

  return (
    <button
      onClick={handleShare}
      title={copied ? 'Link copiado!' : 'Compartilhar notícia'}
      className={`flex size-8 md:size-9 items-center justify-center rounded-xl border transition duration-300 ${
        copied
          ? 'border-[#7fb59a]/30 bg-[#7fb59a]/10 text-[#a9d6bd]'
          : 'border-white/[0.07] bg-white/[0.025] text-[#F4F0FF]/65 hover:border-white/[0.12] hover:bg-white/[0.045] hover:text-white'
      }`}
    >
      {copied ? <Check size={12} /> : <Share2 size={12} />}
    </button>
  )
}

interface NewsRadarFeedProps {
  hasWatchlist: boolean
  items: NewsRadarItem[]
}

export default function NewsRadarFeed({ hasWatchlist, items }: NewsRadarFeedProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>('for-you')
  const visibleItems = useMemo(() => filterItems(items, activeTab), [activeTab, items])

  return (
    <section className="grid gap-4">
      <div role="tablist" aria-label="Filtros do radar de notícias" className="bull-segmented-grid grid-cols-3">
        {FEED_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="bull-tab"
            data-active={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {visibleItems.length === 0 ? (
        <EmptyFeed activeTab={activeTab} hasWatchlist={hasWatchlist} />
      ) : (
        <div className="grid gap-4">
          {visibleItems.map((item) => (
            <article
              key={item.href}
              className="bull-card-calm p-4 md:p-5 flex flex-col gap-4"
            >
              {/* Main tweet layout: Avatar + content */}
              <div className="flex items-start gap-3 md:gap-4">
                {/* Left side: circular initials avatar (neutral monochrome) */}
                <div className="flex flex-col items-center self-stretch shrink-0">
                  <div className="flex size-10 md:size-11 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.05] text-xs font-semibold text-starlight/70">
                    {getPublisherInitials(item.publisher)}
                  </div>
                  {/* Subtle connection thread line to the AI Commentary below */}
                  <div className="w-px grow bg-white/[0.06] mt-2" />
                </div>

                {/* Right side: content */}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  {/* Metadata Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm md:text-[15px] text-starlight flex items-center gap-1">
                        {item.publisher}
                        {isVerifiedPublisher(item.publisher) && (
                          <CheckCircle2 size={13} className="text-starlight/45 shrink-0" />
                        )}
                      </span>
                      <span className="text-xs text-[#F4F0FF]/40 font-mono">
                        {getPublisherHandle(item.publisher)}
                      </span>
                      <span className="text-[#F4F0FF]/30 text-xs hidden sm:inline">·</span>
                      <span className="text-xs text-[#F4F0FF]/40">
                        {item.publishedAt > 0 ? timeAgo(item.publishedAt) : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <span className="inline-flex min-h-6 items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 text-[10px] text-[#DBEAFE]/60 uppercase font-bold tracking-wider">
                        {item.scopes.includes('watchlist') ? <Bookmark size={9} /> : <Compass size={9} />}
                        {item.reason}
                      </span>
                    </div>
                  </div>

                  {/* News title (Headline) */}
                  <div className="mt-1">
                    <Link
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/title block"
                    >
                      <h2 className="text-[15px] font-semibold leading-relaxed text-[#F4F0FF] group-hover/title:text-white transition duration-200 flex items-start gap-1">
                        <span className="group-hover/title:underline">{item.headline}</span>
                        <ArrowUpRight
                          size={14}
                          className="inline-block mt-0.5 shrink-0 text-[#F4F0FF]/30 transition group-hover/title:text-white group-hover/title:translate-x-0.5 group-hover/title:-translate-y-0.5"
                        />
                      </h2>
                    </Link>
                  </div>

                  {/* Ticker Badges */}
                  {item.tickers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {item.tickers.map((ticker) => (
                        <span
                          key={`${item.href}-${ticker}`}
                          className="inline-flex min-h-6 items-center rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[10px] font-semibold text-starlight/55 transition-colors hover:border-white/[0.12] hover:text-starlight/80 cursor-pointer uppercase tracking-wide"
                        >
                          {ticker}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* News Image container if available */}
                  {item.imageUrl && (
                    <div className="mt-3 overflow-hidden rounded-[1.25rem] border border-white/[0.08] bg-black/10 aspect-[4/3] max-h-[360px] md:max-h-[460px] relative group/img cursor-pointer shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                      <Link href={item.href} target="_blank" rel="noopener noreferrer">
                        <img
                          src={item.imageUrl}
                          alt={item.headline}
                          className="w-full h-full object-cover transition duration-500 group-hover/img:scale-102"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition duration-300 flex items-end p-3">
                          <span className="text-[10px] font-semibold text-white/95 bg-black/70 px-2.5 py-1 rounded-full backdrop-blur flex items-center gap-1.5 border border-white/10">
                            <ExternalLink size={10} />
                            Ler artigo original
                          </span>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Expert Reply Commentary */}
              <div className="flex items-start gap-3 md:gap-4 -mt-2">
                <div className="flex flex-col items-center shrink-0 w-10 md:w-11">
                  <div className="flex size-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-starlight/55">
                    <Sparkles size={11} />
                  </div>
                </div>

                <div className="flex-1 border-l border-white/[0.10] pl-3.5 text-xs md:text-[13px] leading-relaxed">
                  <span className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-starlight/40">
                    Curadoria BullCapital
                  </span>
                  <p className="text-starlight/70">{item.note}</p>
                </div>
              </div>

              {/* Actions Footer Bar */}
              <div className="border-t border-white/[0.06] pt-3 flex items-center justify-between gap-2 mt-1">
                <Link
                  href={item.askHref}
                  className="bull-action-primary min-h-8 px-3.5 text-xs md:min-h-9"
                >
                  <Sparkles size={11} className="shrink-0" />
                  Analisar impacto
                </Link>

                <div className="flex items-center gap-1 sm:gap-2">
                  {item.relatedHref && item.relatedLabel ? (
                    <Link
                      href={item.relatedHref}
                      title={item.relatedLabel}
                      className="bull-icon-button size-8 md:size-9"
                    >
                      <ArrowRight size={13} />
                    </Link>
                  ) : null}

                  <Link
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Ver artigo original"
                    className="bull-icon-button size-8 md:size-9"
                  >
                    <ExternalLink size={13} />
                  </Link>

                  <ShareButton url={item.href} headline={item.headline} />
                </div>
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
    <div className="bull-card-calm flex min-h-44 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="flex size-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-starlight/55">
        {followingEmpty ? <Bookmark size={18} /> : <Newspaper size={18} />}
      </span>
      <p className="mt-4 text-sm font-semibold text-starlight">
        {followingEmpty && !hasWatchlist ? 'Sua lista ainda está vazia' : 'Sem histórias neste filtro'}
      </p>
      <p className="mt-1 max-w-xs text-sm leading-6 text-starlight/50">
        {followingEmpty
          ? 'Siga ativos para puxar notícias confirmadas deles para este radar.'
          : 'Volte ao radar geral enquanto novas manchetes confirmadas chegam.'}
      </p>
      {followingEmpty && !hasWatchlist ? (
        <Link
          href="/search"
          className="bull-action-primary mt-4 text-xs"
        >
          <Bookmark size={12} />
          Seguir ativos
        </Link>
      ) : null}
    </div>
  )
}

export function NewsRadarFeedSkeleton() {
  return (
    <div className="grid gap-4 animate-fade-in" aria-hidden="true">
      {/* Skeleton Tab bar */}
      <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/[0.06] bg-white/[0.015] p-1 opacity-70">
        {FEED_TABS.map((tab, i) => (
          <div
            key={tab.id}
            className={`min-h-10 rounded-lg flex items-center justify-center text-xs font-medium select-none ${
              i === 0 ? 'bg-white/[0.06] text-starlight/50' : 'text-starlight/20'
            }`}
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div className="grid gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bull-card-calm p-4 md:p-5 flex flex-col gap-4"
          >
            {/* Main layout: Avatar + content */}
            <div className="flex items-start gap-3 md:gap-4">
              {/* Left side: Avatar skeleton + connecting line */}
              <div className="flex flex-col items-center self-stretch shrink-0">
                <div
                  className="flex size-10 md:size-11 animate-pulse items-center justify-center rounded-full bg-white/[0.06] shadow-[0_4px_12px_rgba(0,0,0,0.3)] relative overflow-hidden"
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
                </div>
                {/* Connection thread line to AI Commentary below */}
                {i < 2 && (
                  <div className="w-px grow bg-white/[0.05] mt-2" />
                )}
              </div>

              {/* Right side: content */}
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                {/* Metadata Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Publisher placeholder */}
                    <div
                      className="h-4 w-28 animate-pulse rounded-full bg-white/[0.06]"
                      style={{ animationDelay: `${i * 120 + 20}ms` }}
                    />
                    <span className="text-[#F4F0FF]/15 text-xs hidden sm:inline select-none">•</span>
                    {/* Handle placeholder */}
                    <div
                      className="h-3 w-16 animate-pulse rounded-full bg-white/[0.04] hidden sm:block"
                      style={{ animationDelay: `${i * 120 + 40}ms` }}
                    />
                    <span className="text-[#F4F0FF]/15 text-xs hidden sm:inline select-none">•</span>
                    {/* Timeago placeholder */}
                    <div
                      className="h-3 w-10 animate-pulse rounded-full bg-white/[0.04]"
                      style={{ animationDelay: `${i * 120 + 60}ms` }}
                    />
                  </div>

                  {/* Scope badge placeholder */}
                  <div
                    className="h-6 w-20 animate-pulse rounded-full border border-white/[0.06] bg-white/[0.02]"
                    style={{ animationDelay: `${i * 120 + 80}ms` }}
                  />
                </div>

                {/* News title (Headline) */}
                <div className="mt-1 space-y-2">
                  <div
                    className="h-4 w-full animate-pulse rounded-full bg-white/[0.06]"
                    style={{ animationDelay: `${i * 120 + 100}ms` }}
                  />
                  <div
                    className="h-4 w-4/5 animate-pulse rounded-full bg-white/[0.05]"
                    style={{ animationDelay: `${i * 120 + 120}ms` }}
                  />
                </div>

                {/* Ticker Badges */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[0, 1].map((tickerIdx) => (
                    <div
                      key={tickerIdx}
                      className="h-6 w-12 animate-pulse rounded-md border border-white/[0.06] bg-white/[0.02]"
                      style={{ animationDelay: `${i * 120 + 140 + tickerIdx * 30}ms` }}
                    />
                  ))}
                </div>

                {/* Image placeholder (Only for first item to make list organic) */}
                {i === 0 && (
                  <div
                    className="mt-3 aspect-[16/10] max-h-[260px] md:max-h-[300px] w-full animate-pulse rounded-[1.25rem] border border-white/[0.06] bg-white/[0.03] shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
                    style={{ animationDelay: '250ms' }}
                  />
                )}
              </div>
            </div>

            {/* AI Expert Reply Commentary */}
            {i < 2 && (
              <div className="flex items-start gap-3 md:gap-4 -mt-2">
                <div className="flex flex-col items-center shrink-0 w-10 md:w-11">
                  <div className="flex size-7 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-starlight/30 relative overflow-hidden animate-pulse">
                    <Sparkles size={11} />
                  </div>
                </div>

                <div className="flex-1 border-l border-white/[0.08] pl-3.5 space-y-2">
                  <div className="h-3 w-28 animate-pulse rounded bg-white/[0.05]" />
                  <div className="h-3.5 w-full animate-pulse rounded-full bg-white/[0.04]" />
                  <div className="h-3.5 w-5/6 animate-pulse rounded-full bg-white/[0.03]" />
                </div>
              </div>
            )}

            {/* Actions Footer Bar */}
            <div className="border-t border-white/[0.06] pt-3 flex items-center justify-between gap-2 mt-1">
              <div className="h-8 w-32 animate-pulse rounded-full border border-white/[0.06] bg-white/[0.03]" />

              <div className="flex items-center gap-1.5">
                {[0, 1].map((btnIdx) => (
                  <div
                    key={btnIdx}
                    className="size-8 animate-pulse rounded-full border border-white/10 bg-white/[0.03]"
                    style={{ animationDelay: `${i * 120 + 200 + btnIdx * 50}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
