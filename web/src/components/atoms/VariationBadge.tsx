'use client'

import React from 'react'

interface VariationBadgeProps {
  variation: number
}

export function VariationBadge({ variation }: VariationBadgeProps) {
  const isPositive = variation >= 0

  const variationBg = isPositive
    ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/30'
    : 'bg-[#F43F5E]/15 border-[#F43F5E]/30'

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium text-[#F4F0FF] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] transition-colors duration-500 ${variationBg}`}
    >
      {isPositive ? '+' : ''}
      {variation}%
    </span>
  )
}
