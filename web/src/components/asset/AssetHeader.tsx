import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { VariationBadge } from '@/components/atoms/VariationBadge'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import { CompanyIcon } from '@/components/atoms/CompanyIcon'

interface AssetHeaderProps {
  ticker: string
  name: string | null
  price: number | null
  changePercent: number | null
  followButton?: ReactNode
}

export default function AssetHeader({ ticker, name, price, changePercent, followButton }: AssetHeaderProps) {
  return (
    <section className="bull-panel p-4">
      <GlassHighlight widthPercent={70} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/home"
            aria-label="Voltar ao mercado"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#F4F0FF]/65 transition hover:bg-white/[0.08] hover:text-[#F4F0FF]"
          >
            <ArrowLeft size={15} />
          </Link>

          <CompanyIcon ticker={ticker} size={44} className="shrink-0 rounded-xl border-white/10 bg-[#09111D]/70 p-1" />

          <div className="min-w-0">
            <p className="truncate text-sm text-[#DBEAFE]/48">{name ?? ticker}</p>
            <h1 className="font-serif text-2xl leading-tight text-[#F4F0FF]">{ticker.toUpperCase()}</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          {price !== null ? (
            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-2.5">
              <p className="text-2xl font-medium tracking-tight text-[#F4F0FF]">
                {price.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 2,
                })}
              </p>
              <VariationBadge variation={changePercent ?? 0} />
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
