import Link from 'next/link'
import { ArrowRight, Bookmark, Sparkles } from 'lucide-react'
import { VariationBadge } from '@/components/atoms/VariationBadge'
import { CompanyIcon } from '@/components/atoms/CompanyIcon'
import { getWatchlist } from '@/lib/actions/watchlist'
import { getMultipleQuotes } from '@/lib/services/market'
import { buildAssetHref } from '@/lib/market-routing'
import type { RadarPulseItem } from './RadarPulseSection'
import type { AssetQuote } from '@/types/market'

interface WatchlistRadarSectionProps {
  fallbackItems: RadarPulseItem[]
  watchlist?: string[]
  initialQuotes?: AssetQuote[]
}

export default async function WatchlistRadarSection({ fallbackItems, watchlist: providedWatchlist, initialQuotes }: WatchlistRadarSectionProps) {
  const watchlist = providedWatchlist ?? await getWatchlist()
  const hasWatchlist = watchlist.length > 0

  if (!hasWatchlist) {
    return <FallbackRadar items={fallbackItems} />
  }

  // Use pre-fetched quotes when available (eliminates a sequential waterfall on the news page)
  const { results: quotes } = initialQuotes
    ? { results: initialQuotes }
    : await getMultipleQuotes(watchlist.slice(0, 8))

  return (
    <section className="bull-frame h-full p-6 md:p-7">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="bull-eyebrow">Meu radar</p>
          <h2 className="mt-2 font-serif text-xl text-starlight">Ativos seguidos</h2>
        </div>
        <Bookmark size={15} className="text-starlight/35" />
      </div>

      {quotes.length === 0 ? (
        <div className="mt-5 flex h-24 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.012] px-6 text-center">
          <p className="text-sm text-starlight/40">Dados indisponíveis no momento.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-0.5">
          {quotes.map((q) => {
            const assetHref = buildAssetHref(q.symbol)
            const askQ = encodeURIComponent(`O que está acontecendo com ${q.symbol} hoje?`)
            const askHref = `/analysis?ticker=${encodeURIComponent(q.symbol)}&q=${askQ}`
            return (
              <div key={q.symbol} className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-white/[0.06] hover:bg-white/[0.02]">
                <Link href={assetHref} className="flex min-w-0 flex-1 items-center gap-3 group">
                  <CompanyIcon ticker={q.symbol} size={32} className="bg-[#09111D]/70 border-white/10" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-starlight transition group-hover:text-starlight">{q.symbol}</span>
                      <span className="truncate text-[10px] text-starlight/40 max-w-[5rem]">{q.shortName}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-starlight/55">
                      {q.regularMarketPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <VariationBadge variation={q.regularMarketChangePercent} />
                </Link>
                <Link
                  href={askHref}
                  aria-label={`Perguntar ao BullCapital sobre ${q.symbol}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-starlight/55 transition-colors hover:border-amethyst/40 hover:bg-amethyst/[0.08] hover:text-starlight"
                >
                  <Sparkles size={13} />
                </Link>
              </div>
            )
          })}
        </div>
      )}

      <Link
        href="/search"
        className="mt-4 inline-flex w-full min-h-9 items-center justify-center gap-1 rounded-full border border-white/[0.10] bg-white/[0.03] text-xs text-starlight/55 transition-colors hover:bg-white/[0.06] hover:text-starlight/80"
      >
        Adicionar ativo
        <ArrowRight size={12} />
      </Link>
    </section>
  )
}

function FallbackRadar({ items }: { items: RadarPulseItem[] }) {
  return (
    <section className="bull-frame flex h-full flex-col p-6 md:p-7">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="bull-eyebrow">Radar do dia</p>
          <h2 className="mt-2 font-serif text-xl leading-tight text-starlight">Nomes para acompanhar</h2>
        </div>
        <Link
          href="/search"
          className="inline-flex min-h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-white/[0.10] bg-white/[0.03] px-3 text-[11px] text-starlight/60 transition-colors hover:border-amethyst/40 hover:bg-amethyst/[0.08] hover:text-starlight"
        >
          <Bookmark size={10} />
          Seguir
        </Link>
      </div>

      <div className="mt-5 grid gap-1">
        {items.map((item) => (
          <Link
            key={`${item.ticker}-${item.label}`}
            href={item.href}
            className="flex items-start gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-white/[0.06] hover:bg-white/[0.02] group"
          >
            <CompanyIcon ticker={item.ticker} size={32} className="bg-[#09111D]/70 border-white/10" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 text-[11px] font-semibold text-starlight/50">{item.ticker}</span>
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-starlight">{item.label}</span>
              </div>
              <p className="mt-1 text-[11px] leading-5 text-starlight/55">{item.description}</p>
            </div>
            <ArrowRight size={15} className="mt-1 shrink-0 text-starlight/25 transition group-hover:text-starlight/55" />
          </Link>
        ))}
      </div>

      <p className="mt-4 text-center text-[11px] text-starlight/30">
        Siga ativos para ver seu radar aqui.
      </p>
    </section>
  )
}
