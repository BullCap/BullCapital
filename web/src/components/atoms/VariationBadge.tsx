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
    ? 'bg-[#7fb59a]/10 border-[#7fb59a]/25 text-[#b6dcc7]'
    : 'bg-[#c98c9a]/12 border-[#c98c9a]/28 text-[#e8bdc6]'

  return (
    <span
      className={`rounded-lg border px-2 py-0.5 text-xs font-medium ${variationBg}`}
    >
      {isPositive ? '+' : ''}
      {formattedVariation}%
    </span>
  )
}
