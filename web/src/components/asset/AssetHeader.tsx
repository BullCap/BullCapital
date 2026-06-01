import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { VariationBadge } from '@/components/atoms/VariationBadge'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import { CompanyIcon } from '@/components/atoms/CompanyIcon'

export function AssetHeaderSkeleton({ ticker }: { ticker: string }) {
  return (
    <section className="bull-frame p-4 md:p-5" aria-hidden="true">
      <GlassHighlight widthPercent={70} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
            <ArrowLeft size={15} className="text-[#F4F0FF]/30" />
          </div>
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-white/[0.055]" />
          <div className="min-w-0">
            <div className="h-3 w-32 animate-pulse rounded-full bg-white/[0.05]" />
            <p className="mt-1.5 font-serif text-2xl leading-tight text-[#F4F0FF]">
              {ticker.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <div className="h-12 w-44 animate-pulse rounded-xl bg-white/[0.055]" style={{ animationDelay: '80ms' }} />
          <div
            className="h-9 w-24 animate-pulse rounded-xl bg-white/[0.05]"
            style={{ animationDelay: '140ms' }}
          />
        </div>
      </div>
    </section>
  )
}

interface AssetHeaderProps {
  ticker: string
  name: string | null
  price: number | null
  changePercent: number | null
  followButton?: ReactNode
}

export default function AssetHeader({ ticker, name, price, changePercent, followButton }: AssetHeaderProps) {
  return (
    <section className="bull-frame p-4 md:p-5">
      <GlassHighlight widthPercent={70} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/home"
            aria-label="Voltar ao mercado"
            className="bull-icon-button shrink-0"
          >
            <ArrowLeft size={15} />
          </Link>

          <CompanyIcon ticker={ticker} size={44} className="shrink-0 rounded-xl border-white/10 bg-[#09111D]/70 p-1" />

          <div className="min-w-0">
            <p className="bull-eyebrow">Ativo em foco</p>
            <h1 className="mt-1 font-serif text-2xl leading-tight text-[#F4F0FF]">{ticker.toUpperCase()}</h1>
            <p className="mt-1 truncate text-sm text-starlight/45">{name ?? ticker}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-stretch gap-3 lg:justify-end">
          {price !== null ? (
            <div className="flex min-w-[17rem] items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-starlight/35">Preço</p>
                <p className="mt-1 font-sans text-2xl font-medium tabular-nums text-[#F4F0FF]">
                  {price.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-starlight/35">Variação</p>
                <VariationBadge variation={changePercent ?? 0} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#F4F0FF]/40">Dados indisponíveis</p>
          )}
          {followButton}
        </div>
      </div>
    </section>
  )
}
