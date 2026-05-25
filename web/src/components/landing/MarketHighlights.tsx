'use client'

import React, { useMemo, useState } from 'react'
import { marketHighlightsMock } from '@/mocks/marketHighlights.mock'
import { MarketHighlightList } from './MarketHighlightList'

type AssetType = 'stock' | 'fund' | 'etf'

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

export default function MarketHighlights() {
  const [assetType, setAssetType] = useState<AssetType>('stock')

  const { gainers, losers, mostTraded } = useMemo(() => {
    const byType = marketHighlightsMock.filter((a) => a.type === assetType)
    return {
      gainers: [...byType].sort((a, b) => b.change - a.change),
      losers: [...byType].sort((a, b) => a.change - b.change),
      mostTraded: [...byType].sort((a, b) => b.volume - a.volume),
    }
  }, [assetType])

  return (
    <section id="destaques" className="flex w-full flex-col gap-10">
      {/* Section heading + Asset type nav */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2 text-left">
          <h2 className="font-serif text-4xl font-bold tracking-tight text-[#F4F0FF] opacity-80">
            Destaques do Mercado
          </h2>
          <p className="max-w-lg font-sans text-sm leading-relaxed text-[#F4F0FF]/40">
            Panorama rápido dos ativos em destaque hoje — as maiores altas, quedas e os mais
            negociados.
          </p>
        </div>

        {/* Asset type pills */}
        <div className="flex items-center gap-2">
          {(Object.entries(TYPE_LABELS) as [AssetType, string][]).map(([type, label]) => {
            const isActive = assetType === type
            return (
              <button
                key={type}
                type="button"
                onClick={() => setAssetType(type)}
                className={`relative rounded-2xl border px-5 py-2 font-sans text-sm font-medium transition-all duration-500 ${
                  isActive
                    ? 'border-[#8B5CF6]/30 bg-[#8B5CF6]/15 text-[#F4F0FF] shadow-[inset_0_1px_2px_rgba(139,92,246,0.3),0_0_12px_rgba(139,92,246,0.15)]'
                    : 'border-white/5 bg-white/[0.03] text-white/40 hover:border-white/10 hover:bg-white/[0.06] hover:text-white/60'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Three cards grid */}
      <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-3">
        <MarketHighlightList title="Maiores Altas" icon={ICONS.gainers} data={gainers} />
        <MarketHighlightList title="Maiores Quedas" icon={ICONS.losers} data={losers} />
        <MarketHighlightList title="Mais Negociados" icon={ICONS.mostTraded} data={mostTraded} />
      </div>
    </section>
  )
}
export { MarketHighlights }
