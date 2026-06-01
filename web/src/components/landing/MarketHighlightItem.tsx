'use client'

import React from 'react'
import { CompanyIcon } from '@/components/atoms/CompanyIcon'
import type { MarketListingItem } from '@/types/market'

interface MarketHighlightItemProps {
  asset: MarketListingItem
}

export function MarketHighlightItem({ asset }: MarketHighlightItemProps) {
  const isPositive = asset.change >= 0
  const variationColor = isPositive ? 'text-[#7FB59A]' : 'text-[#C98C9A]'
  const variationBg = isPositive
    ? 'bg-[#7FB59A]/10 border-[#7FB59A]/20'
    : 'bg-[#C98C9A]/10 border-[#C98C9A]/20'

  const formattedPrice = asset.close.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  return (
    <div className="group/item relative flex items-center gap-4 rounded-2xl border border-white/[0.055] bg-white/[0.018] px-4 py-3 transition-colors duration-300 hover:border-white/[0.10] hover:bg-white/[0.035]">
      <CompanyIcon ticker={asset.stock} size={36} className="shrink-0" />

      <div className="flex min-w-0 flex-1 flex-col text-left">
        <span className="font-serif text-sm tracking-tight text-starlight">{asset.stock}</span>
        <span className="truncate text-xs text-starlight/40">{asset.name}</span>
      </div>

      <div className="text-right">
        <p className="font-sans text-sm font-medium tracking-tight text-starlight">
          {formattedPrice}
        </p>
      </div>

      <div className={`flex items-center gap-1 rounded-full border px-2.5 py-1 ${variationBg}`}>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={`${isPositive ? '' : 'rotate-180'} transition-transform duration-500`}
        >
          <path d="M5 2L8 7H2L5 2Z" fill={isPositive ? '#7FB59A' : '#C98C9A'} />
        </svg>
        <span className={`text-xs font-medium ${variationColor}`}>
          {isPositive ? '+' : ''}
          {asset.change.toFixed(2)}%
        </span>
      </div>
    </div>
  )
}
export default MarketHighlightItem
