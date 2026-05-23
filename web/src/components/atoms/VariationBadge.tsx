'use client'

import React from 'react'

interface VariationBadgeProps {
  variation: number
}

export function VariationBadge({ variation }: VariationBadgeProps) {
  const isPositive = variation >= 0
  const formattedVariation = Math.abs(variation).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const variationBg = isPositive
    ? 'bg-[#4ADE80]/10 border-[#4ADE80]/25'
    : 'bg-[#F43F5E]/15 border-[#F43F5E]/30'

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium text-[#F4F0FF] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] ${variationBg}`}
    >
      {isPositive ? '+' : ''}
      {formattedVariation}%
    </span>
  )
}
