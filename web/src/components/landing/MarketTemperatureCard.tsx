'use client'

import React from 'react'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import { MarketTemperatureDial } from './MarketTemperatureDial'

interface MarketTemperatureCardProps {
  value: number | null
  label: string | null
}

export default function MarketTemperatureCard({ value, label }: MarketTemperatureCardProps) {
  return (
    <div className="bull-card-calm group relative flex h-full w-full flex-col items-center justify-center gap-6 p-6 text-center">
      <GlassHighlight widthPercent={80} className="opacity-45" />

      <div className="z-10 flex flex-col items-center gap-2">
        <h2 className="bull-eyebrow mb-3">
          Temperatura
        </h2>
        {value === null ? (
          <p className="text-sm text-starlight/40">Dados indisponíveis</p>
        ) : (
          <MarketTemperatureDial value={value} stateName={label ?? 'Neutro'} />
        )}
      </div>
    </div>
  )
}
export { MarketTemperatureCard }
