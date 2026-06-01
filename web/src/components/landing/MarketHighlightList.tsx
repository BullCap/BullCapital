'use client'

import React from 'react'
import Link from 'next/link'
import type { MarketListingItem } from '@/types/market'
import { MarketHighlightItem } from './MarketHighlightItem'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

interface MarketHighlightListProps {
  title: string
  icon: React.ReactNode
  data: MarketListingItem[]
}

export function MarketHighlightList({ title, icon, data }: MarketHighlightListProps) {
  return (
    <div className="bull-card-calm group relative flex flex-1 flex-col p-5 md:p-6">
      <GlassHighlight widthPercent={50} className="opacity-45" />

      <div className="mb-6 flex items-center gap-3 px-1">
        <span className="text-starlight/50">{icon}</span>
        <h3 className="font-serif text-xl font-medium tracking-tight text-starlight">{title}</h3>
      </div>

      <div className="flex flex-col gap-2">
        {data.length > 0 ? (
          data.slice(0, 5).map((asset) => (
            <MarketHighlightItem key={asset.stock} asset={asset} />
          ))
        ) : (
          <div className="rounded-2xl border border-white/[0.055] bg-white/[0.018] px-4 py-5 text-sm text-starlight/35">
            Dados indisponíveis
          </div>
        )}
      </div>

      <Link
        href="/auth/sign-in?callbackUrl=/home"
        className="group/cta mt-4 flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 text-sm text-starlight/45 transition-colors duration-300 hover:border-white/[0.10] hover:bg-white/[0.04] hover:text-starlight/75"
      >
        <span>Ver mais</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="transition-transform duration-500 group-hover/cta:translate-x-1"
        >
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
export default MarketHighlightList
