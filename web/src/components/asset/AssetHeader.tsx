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
    <section className="bull-asset-hero p-5">
      <GlassHighlight widthPercent={70} />

      <div className="relative flex items-center justify-between gap-3">
        <Link
          href="/home"
          aria-label="Voltar ao mercado"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[#F4F0FF]/70 transition hover:bg-white/[0.09] hover:text-[#F4F0FF]"
        >
          <ArrowLeft size={15} />
        </Link>

        <span className="bull-wordmark">
          <span className="bull-brand-mark" />
          <span className="flex items-baseline">
            <span className="font-serif font-bold text-[#F4F0FF] text-[20px]">B</span>
            <span className="font-sans font-bold tracking-[0.14em] text-[#F4F0FF] text-xs uppercase ml-0.5">cap</span>
          </span>
        </span>

        {followButton ?? <span className="h-9 w-9" aria-hidden="true" />}
      </div>

      <div className="relative mt-8 flex flex-col items-center text-center">
        <CompanyIcon ticker={ticker} size={64} className="bull-asset-emblem p-1.5 bg-[#09111D]/80 border-white/20" />
        <p className="mt-4 max-w-[15rem] truncate text-sm text-[#DBEAFE]/60">{name ?? ticker}</p>
        <h1 className="mt-1 font-serif text-3xl text-[#F4F0FF]">{ticker.toUpperCase()}</h1>
      </div>

      {price !== null ? (
        <div className="relative mt-5 rounded-[1.6rem] border border-white/[0.08] bg-black/25 px-4 py-5 text-center shadow-[inset_0_1px_18px_rgba(0,0,0,0.32)]">
          <div className="flex flex-col items-center gap-3">
            <p className="text-4xl font-medium tracking-tight text-[#F4F0FF]">
              {price.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2,
              })}
            </p>
            <VariationBadge variation={changePercent ?? 0} />
          </div>
          <p className="mt-3 text-xs text-[#DBEAFE]/40">Preço, perfil e contexto juntos.</p>
        </div>
      ) : (
        <p className="mt-5 text-sm text-[#F4F0FF]/40">Dados indisponíveis</p>
      )}
    </section>
  )
}
