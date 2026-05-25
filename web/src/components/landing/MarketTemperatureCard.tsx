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
    <div className="group relative flex h-full w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A1625]/40 p-6 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-700 hover:-translate-y-1.5 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-1px_2px_rgba(0,0,0,0.8),0_15px_30px_rgba(0,0,0,0.5)]">
      <div className="pointer-events-none absolute -top-10 h-64 w-64 rounded-full bg-[#8B5CF6]/10 blur-[80px] transition-all duration-700 group-hover:bg-[#8B5CF6]/20" />
      <GlassHighlight widthPercent={80} />

      {/* Velocímetro */}
      <div className="z-10 flex flex-col items-center gap-2">
        <h2 className="mb-3 text-balance font-serif font-bold uppercase tracking-widest text-[#F4F0FF]">
          Temperatura
        </h2>
        {value === null ? (
          <p className="text-sm text-[#F4F0FF]/40">Dados indisponíveis</p>
        ) : (
          <MarketTemperatureDial value={value} stateName={label ?? 'Neutro'} />
        )}
      </div>
    </div>
  )
}
export { MarketTemperatureCard }
