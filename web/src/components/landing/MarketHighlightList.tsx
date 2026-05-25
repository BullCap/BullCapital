'use client'

import React from 'react'
import Link from 'next/link'
import type { StockSummary } from '@/mocks/topAssets.mock'
import { MarketHighlightItem } from './MarketHighlightItem'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

interface MarketHighlightListProps {
  title: string
  icon: React.ReactNode
  data: StockSummary[]
}

export function MarketHighlightList({ title, icon, data }: MarketHighlightListProps) {
  return (
    <div className="group relative flex flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A1625]/40 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-700">
      {/* Amethyst Glow Effect */}
      <div className="pointer-events-none absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#8B5CF6]/15 blur-[100px] transition-all duration-700 group-hover:bg-[#8B5CF6]/25" />
      <GlassHighlight widthPercent={50} />

      {/* Header */}
      <div className="mb-6 flex items-center gap-3 px-1">
        <span className="text-white/60 drop-shadow-md">{icon}</span>
        <h3 className="font-serif text-xl tracking-tight text-[#F4F0FF]">{title}</h3>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {data.slice(0, 5).map((asset) => (
          <MarketHighlightItem key={asset.stock} asset={asset} />
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/auth/sign-in?callbackUrl=/home"
        className="group/cta mt-4 flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] py-2.5 text-sm text-white/40 transition-all duration-500 hover:border-[#8B5CF6]/20 hover:bg-[#8B5CF6]/5 hover:text-[#A78BFA]"
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
