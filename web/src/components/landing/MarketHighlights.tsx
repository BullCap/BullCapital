'use client'

import React from 'react'
import type { MarketListingItem } from '@/types/market'
import { MarketHighlightList } from './MarketHighlightList'

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

interface MarketHighlightsProps {
  gainers: MarketListingItem[]
  losers: MarketListingItem[]
  mostTraded: MarketListingItem[]
}

export default function MarketHighlights({ gainers, losers, mostTraded }: MarketHighlightsProps) {

  return (
    <section id="destaques" className="flex w-full flex-col gap-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2 text-left">
          <p className="bull-eyebrow">Destaques</p>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-starlight md:text-4xl">
            Altas, quedas e liquidez do dia.
          </h2>
          <p className="max-w-2xl font-sans text-sm leading-7 text-starlight/50">
            Panorama dos ativos em destaque hoje, sempre mediado pelo backend antes de chegar à interface.
          </p>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-3">
        <MarketHighlightList title="Maiores Altas" icon={ICONS.gainers} data={gainers} />
        <MarketHighlightList title="Maiores Quedas" icon={ICONS.losers} data={losers} />
        <MarketHighlightList title="Mais Negociados" icon={ICONS.mostTraded} data={mostTraded} />
      </div>
    </section>
  )
}
export { MarketHighlights }
