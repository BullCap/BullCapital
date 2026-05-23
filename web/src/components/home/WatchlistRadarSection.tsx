import Link from 'next/link'
import { ArrowRight, Bookmark, Sparkles } from 'lucide-react'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import { VariationBadge } from '@/components/atoms/VariationBadge'
import { CompanyIcon } from '@/components/atoms/CompanyIcon'
import { getWatchlist } from '@/lib/actions/watchlist'
import { getMultipleQuotes } from '@/lib/services/market'
import { buildAssetHref } from '@/lib/market-routing'
import type { RadarPulseItem } from './RadarPulseSection'

const TONE_STYLES: Record<RadarPulseItem['tone'], string> = {
  up: 'border-[#4ADE80]/20 bg-[#4ADE80]/10 text-[#D7FCE5]',
  down: 'border-[#FB7185]/20 bg-[#FB7185]/10 text-[#FFE0E6]',
  neutral: 'border-[#60A5FA]/20 bg-[#60A5FA]/10 text-[#DBEAFE]',
}

interface WatchlistRadarSectionProps {
  fallbackItems: RadarPulseItem[]
}

export default async function WatchlistRadarSection({ fallbackItems }: WatchlistRadarSectionProps) {
  const watchlist = await getWatchlist()
  const hasWatchlist = watchlist.length > 0

  if (!hasWatchlist) {
    return <FallbackRadar items={fallbackItems} />
  }

  const { results: quotes } = await getMultipleQuotes(watchlist.slice(0, 8))

  return (
    <section className="bull-panel h-full p-5 md:p-6">
      <GlassHighlight widthPercent={58} />

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="bull-eyebrow">Meu radar</p>
          <h2 className="mt-2 font-serif text-xl text-[#F4F0FF]">Ativos seguidos</h2>
        </div>
        <Bookmark size={15} className="text-[#8B5CF6]/60" />
      </div>

      {quotes.length === 0 ? (
        <div className="mt-5 flex h-24 items-center justify-center rounded-[1.5rem] border border-white/[0.06] bg-black/15 px-6 text-center">
          <p className="text-sm text-[#F4F0FF]/42">Dados indisponíveis no momento.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-2">
          {quotes.map((q) => {
            const assetHref = buildAssetHref(q.symbol)
            const askQ = encodeURIComponent(`O que está acontecendo com ${q.symbol} hoje?`)
            const askHref = `/analysis?ticker=${encodeURIComponent(q.symbol)}&q=${askQ}`
            return (
              <div key={q.symbol} className="bull-panel-quiet flex items-center gap-3 px-3.5 py-3">
                <Link href={assetHref} className="flex min-w-0 flex-1 items-center gap-3 group">
                  <CompanyIcon ticker={q.symbol} size={32} className="bg-[#09111D]/70 border-white/10" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-[#F4F0FF] group-hover:text-[#C4B5FD] transition">{q.symbol}</span>
                      <span className="truncate text-[10px] text-[#F4F0FF]/40 max-w-[5rem]">{q.shortName}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#F4F0FF]/55">
                      {q.regularMarketPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <VariationBadge variation={q.regularMarketChangePercent} />
                </Link>
                <Link
                  href={askHref}
                  aria-label={`Perguntar ao BullCapital sobre ${q.symbol}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#8B5CF6]/25 bg-[#8B5CF6]/10 text-[#C4B5FD] transition hover:bg-[#8B5CF6]/20"
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
        className="mt-4 inline-flex w-full min-h-9 items-center justify-center gap-1 rounded-full border border-white/10 bg-white/[0.04] text-xs text-[#F4F0FF]/55 transition hover:bg-white/[0.08] hover:text-[#F4F0FF]/80"
      >
        Adicionar ativo
        <ArrowRight size={12} />
      </Link>
    </section>
  )
}

function FallbackRadar({ items }: { items: RadarPulseItem[] }) {
  return (
    <section className="bull-panel h-full p-5 md:p-6">
      <GlassHighlight widthPercent={58} />

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="bull-eyebrow">Radar do dia</p>
          <h2 className="mt-2 font-serif text-xl text-[#F4F0FF]">Nomes para acompanhar</h2>
        </div>
        <Link
          href="/search"
          className="inline-flex min-h-7 items-center gap-1 rounded-full border border-[#8B5CF6]/25 bg-[#8B5CF6]/10 px-3 text-[11px] text-[#C4B5FD] transition hover:bg-[#8B5CF6]/20"
        >
          <Bookmark size={10} />
          Seguir ativos
        </Link>
      </div>

      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <Link
            key={`${item.ticker}-${item.label}`}
            href={item.href}
            className="bull-panel-quiet flex items-start gap-3 p-3.5 transition hover:-translate-y-0.5 hover:bg-white/[0.06] group"
          >
            <CompanyIcon ticker={item.ticker} size={32} className="bg-[#09111D]/70 border-white/10" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-[#C4B5FD]">{item.ticker}</span>
                <span className="text-xs font-semibold text-[#F4F0FF] truncate max-w-[8rem] group-hover:text-[#C4B5FD] transition">{item.label}</span>
              </div>
              <p className="mt-1 text-[11px] leading-5 text-[#F4F0FF]/62">{item.description}</p>
            </div>
            <ArrowRight size={15} className="mt-1 shrink-0 text-[#F4F0FF]/28 group-hover:text-[#C4B5FD] transition" />
          </Link>
        ))}
      </div>

      <p className="mt-4 text-center text-[11px] text-[#DBEAFE]/30">
        Siga ativos para ver seu radar aqui.
      </p>
    </section>
  )
}
