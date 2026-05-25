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

const PRESET_GRADIENTS = [
  'linear-gradient(135deg, #3B82F6, #1D4ED8)', // Cobalt Blue
  'linear-gradient(135deg, #10B981, #047857)', // Mint Green
  'linear-gradient(135deg, #F59E0B, #B45309)', // Amber
  'linear-gradient(135deg, #EC4899, #BE185D)', // Pink
  'linear-gradient(135deg, #8B5CF6, #6D28D9)', // Amethyst
  'linear-gradient(135deg, #06B6D4, #0891B2)', // Cyan
  'linear-gradient(135deg, #EF4444, #B91C1C)', // Rose/Red
]

function getPublisherGradient(publisher: string): string {
  let hash = 0
  for (let i = 0; i < publisher.length; i++) {
    hash = publisher.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % PRESET_GRADIENTS.length
  return PRESET_GRADIENTS[index]
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
      className={`flex size-8 md:size-9 items-center justify-center rounded-full border transition duration-300 ${
        copied
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          : 'border-white/10 bg-white/[0.04] text-[#F4F0FF]/70 hover:bg-white/[0.1] hover:text-white hover:border-white/20'
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
      <div className="bull-panel p-1.5">
        <div
          role="tablist"
          aria-label="Filtros do radar de notícias"
          className="grid grid-cols-3 gap-1 rounded-[1.35rem] border border-white/[0.08] bg-black/20 p-1"
        >
          {FEED_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-10 rounded-[1rem] px-2 text-xs font-semibold transition ${
                activeTab === tab.id
                  ? 'border border-white/[0.08] bg-white/[0.1] text-[#F4F0FF] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]'
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
        <div className="grid gap-4">
          {visibleItems.map((item) => (
            <article
              key={item.href}
              className="bull-panel-quiet p-4 md:p-5 flex flex-col gap-4 hover:border-[#8b5cf6]/20 transition-all duration-300"
            >
              {/* Main tweet layout: Avatar + content */}
              <div className="flex items-start gap-3 md:gap-4">
                {/* Left side: circular initials avatar with hash gradient */}
                <div className="flex flex-col items-center self-stretch shrink-0">
                  <div
                    className="flex size-10 md:size-11 items-center justify-center rounded-full text-xs font-extrabold text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)] relative overflow-hidden"
                    style={{ background: getPublisherGradient(item.publisher) }}
                  >
                    {getPublisherInitials(item.publisher)}
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
                  </div>
                  {/* Subtle connection thread line to the AI Commentary below */}
                  <div className="w-[1.5px] grow bg-gradient-to-b from-[#8B5CF6]/30 to-[#8B5CF6]/5 mt-2 rounded" />
                </div>

                {/* Right side: content */}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  {/* Metadata Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm md:text-[15px] text-[#F4F0FF] flex items-center gap-1">
                        {item.publisher}
                        {isVerifiedPublisher(item.publisher) && (
                          <CheckCircle2 size={13} className="text-[#8B5CF6] fill-[#8B5CF6]/10 shrink-0" />
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
                          className="inline-flex min-h-6 items-center rounded border border-[#8B5CF6]/20 bg-[#8B5CF6]/5 px-2 py-0.5 text-[10px] font-extrabold text-[#C4B5FD] transition hover:bg-[#8B5CF6]/15 cursor-pointer uppercase"
                        >
                          {ticker}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* News Image container if available */}
                  {item.imageUrl && (
                    <div className="mt-3 overflow-hidden rounded-[1.25rem] border border-white/[0.08] bg-black/10 aspect-[16/10] max-h-[300px] md:max-h-[380px] relative group/img cursor-pointer shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
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
                  <div className="flex size-7 items-center justify-center rounded-full border border-[#8B5CF6]/30 bg-[#8b5cf6]/10 text-[#C4B5FD] shadow-inner relative overflow-hidden animate-pulse-glow">
                    <Sparkles size={11} />
                  </div>
                </div>

                <div className="flex-1 bg-[#8B5CF6]/5 border-l-2 border-[#8B5CF6]/40 p-3 rounded-r-xl rounded-bl-xl text-xs md:text-[13px] leading-relaxed text-[#F4F0FF]/80 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6]/5 to-transparent pointer-events-none" />
                  <div className="relative z-10">
                    <span className="font-bold text-[#C4B5FD] flex items-center gap-1.5 mb-1 text-[10px] uppercase tracking-wider">
                      Curadoria BullCapital
                    </span>
                    <p className="italic text-[#F4F0FF]/75">{item.note}</p>
                  </div>
                </div>
              </div>

              {/* Actions Footer Bar */}
              <div className="border-t border-white/[0.06] pt-3 flex items-center justify-between gap-2 mt-1">
                <Link
                  href={item.askHref}
                  className="inline-flex min-h-8 md:min-h-9 items-center gap-1.5 rounded-full border border-[#8B5CF6]/28 bg-[#8B5CF6]/12 px-3.5 text-xs font-bold text-[#DDD6FE] transition duration-300 hover:bg-[#8B5CF6]/22 hover:border-[#8B5CF6]/50 hover:shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                >
                  <Sparkles size={11} className="text-[#C4B5FD] shrink-0" />
                  Analisar impacto
                </Link>

                <div className="flex items-center gap-1 sm:gap-2">
                  {item.relatedHref && item.relatedLabel ? (
                    <Link
                      href={item.relatedHref}
                      title={item.relatedLabel}
                      className="flex size-8 md:size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#F4F0FF]/70 transition duration-300 hover:bg-white/[0.1] hover:text-white hover:border-white/20"
                    >
                      <ArrowRight size={13} />
                    </Link>
                  ) : null}

                  <Link
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Ver artigo original"
                    className="flex size-8 md:size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#F4F0FF]/70 transition duration-300 hover:bg-white/[0.1] hover:text-white hover:border-white/20"
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
    <div className="bull-panel flex min-h-56 flex-col items-center justify-center px-6 py-8 text-center">
      <span className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[#DBEAFE]/65">
        {followingEmpty ? <Bookmark size={18} /> : <Newspaper size={18} />}
      </span>
      <p className="mt-4 text-sm font-semibold text-[#F4F0FF]">
        {followingEmpty && !hasWatchlist ? 'Sua lista ainda está vazia' : 'Sem histórias neste filtro'}
      </p>
      <p className="mt-1 max-w-xs text-sm leading-6 text-[#F4F0FF]/52">
        {followingEmpty
          ? 'Siga ativos para puxar notícias confirmadas deles para este radar.'
          : 'Volte ao radar geral enquanto novas manchetes confirmadas chegam.'}
      </p>
      {followingEmpty && !hasWatchlist ? (
        <Link
          href="/search"
          className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#8B5CF6]/25 bg-[#8B5CF6]/12 px-4 text-xs font-semibold text-[#DDD6FE] transition hover:bg-[#8B5CF6]/22"
        >
          <Bookmark size={12} />
          Seguir ativos
        </Link>
      ) : null}
    </div>
  )
}
