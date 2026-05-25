'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import { CompanyIcon } from '@/components/atoms/CompanyIcon'
import { VariationBadge } from '@/components/atoms/VariationBadge'
import { buildAssetHref } from '@/lib/market-routing'
import { marketHighlightsMock } from '@/mocks/marketHighlights.mock'
import type { MarketListingItem } from '@/types/market'

type AssetType = 'stock' | 'fund' | 'etf'

type DisplayAsset = {
  stock: string
  name: string
  close: number
  change: number
  volume: number
}

const TYPE_LABELS: Record<AssetType, string> = {
  stock: 'Ações',
  fund: 'Fundos',
  etf: 'ETFs',
}

const ICONS = {
  gainers: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 3L12.5 10H3.5L8 3Z" fill="currentColor" opacity="0.8" />
    </svg>
  ),
  losers: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 13L3.5 6H12.5L8 13Z" fill="currentColor" opacity="0.8" />
    </svg>
  ),
  mostTraded: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="9" width="3" height="5" rx="0.75" fill="currentColor" opacity="0.5" />
      <rect x="6.5" y="5.5" width="3" height="8.5" rx="0.75" fill="currentColor" opacity="0.7" />
      <rect x="11" y="2" width="3" height="12" rx="0.75" fill="currentColor" opacity="0.9" />
    </svg>
  ),
}

function HighlightItem({ asset }: { asset: DisplayAsset }) {
  return (
    <Link
      href={buildAssetHref(asset.stock)}
      className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 transition-all duration-300 hover:-translate-y-px hover:border-white/10 hover:bg-white/[0.05]"
    >
      <CompanyIcon ticker={asset.stock} size={36} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-serif text-sm tracking-tight text-[#F4F0FF]">{asset.stock}</p>
        <p className="truncate text-xs text-white/40">{asset.name}</p>
      </div>
      <p className="shrink-0 text-sm font-medium text-[#F4F0FF]">
        {asset.close.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </p>
      <VariationBadge variation={asset.change} />
    </Link>
  )
}

function HighlightList({
  title,
  icon,
  data,
}: {
  title: string
  icon: React.ReactNode
  data: DisplayAsset[]
}) {
  return (
    <div className="group relative flex flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#0f0c18]/50 p-6 shadow-[inset_0_1px_0px_rgba(255,255,255,0.08),0_10px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-700">
      <div className="pointer-events-none absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[#8B5CF6]/10 blur-[80px] transition-all duration-700 group-hover:bg-[#8B5CF6]/18" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      <GlassHighlight widthPercent={50} />

      <div className="mb-5 flex items-center gap-3 px-1">
        <span className="text-white/55">{icon}</span>
        <h3 className="font-serif text-xl tracking-tight text-[#F4F0FF]">{title}</h3>
      </div>

      <div className="flex flex-col gap-2">
        {data.slice(0, 5).map((asset) => (
          <HighlightItem key={asset.stock} asset={asset} />
        ))}
      </div>

      <Link
        href="/search"
        className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] py-2.5 text-sm text-white/40 transition-all duration-300 hover:border-[#8B5CF6]/20 hover:bg-[#8B5CF6]/5 hover:text-[#A78BFA]"
      >
        Ver mais
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M5.25 3.5L8.75 7L5.25 10.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </div>
  )
}

function toDisplay(m: MarketListingItem | { stock: string; name: string; close: number; change: number; volume: number }): DisplayAsset {
  return { stock: m.stock, name: m.name, close: m.close, change: m.change, volume: m.volume }
}

interface MarketHighlightsSectionProps {
  stockGainers: MarketListingItem[]
  stockLosers: MarketListingItem[]
  stockMostTraded: MarketListingItem[]
}

export default function MarketHighlightsSection({
  stockGainers,
  stockLosers,
  stockMostTraded,
}: MarketHighlightsSectionProps) {
  const [tab, setTab] = useState<AssetType>('stock')

  const { gainers, losers, mostTraded } = useMemo(() => {
    if (tab === 'stock') {
      return {
        gainers: stockGainers.map(toDisplay),
        losers: stockLosers.map(toDisplay),
        mostTraded: stockMostTraded.map(toDisplay),
      }
    }
    const byType = marketHighlightsMock.filter((a) => a.type === tab)
    return {
      gainers: [...byType].sort((a, b) => b.change - a.change).map(toDisplay),
      losers: [...byType].sort((a, b) => a.change - b.change).map(toDisplay),
      mostTraded: [...byType].sort((a, b) => b.volume - a.volume).map(toDisplay),
    }
  }, [tab, stockGainers, stockLosers, stockMostTraded])

  return (
    <section>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between px-1">
        <div>
          <p className="bull-eyebrow">Radar do Pregão</p>
          <h2 className="mt-1 font-serif text-2xl tracking-tight text-[#F4F0FF]/80">
            Destaques do Mercado
          </h2>
          <p className="mt-1 text-sm text-[#DBEAFE]/55">
            Maiores altas, quedas e mais negociados do pregão de hoje.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(Object.entries(TYPE_LABELS) as [AssetType, string][]).map(([type, label]) => {
            const isActive = tab === type
            return (
              <button
                key={type}
                type="button"
                onClick={() => setTab(type)}
                className={`rounded-2xl border px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'border-[#8B5CF6]/30 bg-[#8B5CF6]/15 text-[#F4F0FF] shadow-[inset_0_1px_2px_rgba(139,92,246,0.3)]'
                    : 'border-white/5 bg-white/[0.03] text-white/40 hover:border-white/10 hover:bg-white/[0.06] hover:text-white/60'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-5 grid w-full grid-cols-1 gap-5 md:grid-cols-3">
        <HighlightList title="Maiores Altas" icon={ICONS.gainers} data={gainers} />
        <HighlightList title="Maiores Quedas" icon={ICONS.losers} data={losers} />
        <HighlightList title="Mais Negociados" icon={ICONS.mostTraded} data={mostTraded} />
      </div>
    </section>
  )
}
