'use client'

import React from 'react'
import { CompanyIcon } from '@/components/atoms/CompanyIcon'
import type { MarketListingItem } from '@/types/market'

interface MarketHighlightItemProps {
  asset: MarketListingItem
}

export function MarketHighlightItem({ asset }: MarketHighlightItemProps) {
  const isPositive = asset.change >= 0
  const variationColor = isPositive ? 'text-[#A78BFA]' : 'text-[#F9A8D4]'
  const variationBg = isPositive
    ? 'bg-[#8B5CF6]/10 border-[#8B5CF6]/20'
    : 'bg-[#F43F5E]/10 border-[#F43F5E]/20'

  const formattedPrice = asset.close.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  return (
    <div className="group/item relative flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.05] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_16px_rgba(0,0,0,0.25)]">
      {/* Logo */}
      <CompanyIcon ticker={asset.stock} size={36} className="shrink-0" />

      {/* Ticker + Name */}
      <div className="flex min-w-0 flex-1 flex-col text-left">
        <span className="font-serif text-sm tracking-tight text-[#F4F0FF]">{asset.stock}</span>
        <span className="truncate text-xs text-white/40">{asset.name}</span>
      </div>

      {/* Price */}
      <div className="text-right">
        <p className="font-sans text-sm font-medium tracking-tight text-[#F4F0FF]">
          {formattedPrice}
        </p>
      </div>

      {/* Variation badge */}
      <div className={`flex items-center gap-1 rounded-full border px-2.5 py-1 ${variationBg}`}>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={`${isPositive ? '' : 'rotate-180'} transition-transform duration-500`}
        >
          <path d="M5 2L8 7H2L5 2Z" fill={isPositive ? '#A78BFA' : '#F9A8D4'} />
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
