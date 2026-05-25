'use client'

import React from 'react'
import { AlertCircle, ShieldCheck, Flame, type LucideIcon } from 'lucide-react'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import { getMarketVolatility, type VolatilityLevel } from '@/lib/utils'

interface MarketInsightCardProps {
  /** Temperatura de mercado de 0 a 100 indicando a volatilidade */
  marketTemperature: number | null
  text: string
}

interface VolatilityStyle {
  icon: LucideIcon
  borderClass: string
  bgClass: string
  glowShadow: string
  iconColor: string
  textColor: string
}

const VOLATILITY_STYLES: Record<VolatilityLevel, VolatilityStyle> = {
  fear: {
    icon: Flame,
    borderClass: 'border-[#E05A5A]/30',
    bgClass: 'bg-[#E05A5A]/15',
    glowShadow: 'shadow-[0_0_15px_rgba(224,90,90,0.2)]',
    iconColor: 'text-[#E05A5A]',
    textColor: 'text-[#FFDADA]/90',
  },
  mixed: {
    icon: AlertCircle,
    borderClass: 'border-white/10',
    bgClass: 'bg-white/5',
    glowShadow: 'shadow-none',
    iconColor: 'text-[#F4F0FF]/60',
    textColor: 'text-[#F4F0FF]/60',
  },
  calm: {
    icon: ShieldCheck,
    borderClass: 'border-[#8B5CF6]/30',
    bgClass: 'bg-[#8B5CF6]/15',
    glowShadow: 'shadow-[0_0_15px_rgba(139,92,246,0.2)]',
    iconColor: 'text-[#8B5CF6]',
    textColor: 'text-[#E9DFFF]/90',
  },
}

export default function MarketInsightCard({
  marketTemperature,
  text,
}: MarketInsightCardProps) {
  const { level, label } = getMarketVolatility(marketTemperature ?? 50)
  const style = VOLATILITY_STYLES[level]
  const VolatilityIcon = style.icon

  return (
    <div className="group relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A1625]/40 p-10 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-700 hover:-translate-y-1.5 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-1px_2px_rgba(0,0,0,0.8),0_15px_30px_rgba(0,0,0,0.5)]">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-[#8B5CF6]/15 blur-[80px] transition-all duration-700 group-hover:bg-[#8B5CF6]/20" />
      <div className="pointer-events-none absolute -left-10 -top-10 h-64 w-64 rounded-full bg-[#3B82F6]/10 blur-[80px] transition-all duration-700 group-hover:bg-[#3B82F6]/15" />

      <GlassHighlight widthPercent={75} />

      <div className="relative z-10 flex w-full max-w-[95%] flex-col items-center sm:max-w-[85%] md:max-w-[80%]">
        {/* Header Badges */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/15 px-3 py-1.5 shadow-[0_0_15px_rgba(139,92,246,0.2)] backdrop-blur-md">
            <span className="font-sans text-[10px] font-semibold uppercase tracking-widest text-[#F4F0FF]/90">
              Leitura contextual
            </span>
          </div>
          <div
            className={`flex items-center gap-2 rounded-full ${style.borderClass} ${style.bgClass} px-3 py-1.5 ${style.glowShadow} backdrop-blur-md transition-all duration-500`}
          >
            <VolatilityIcon
              className={`h-3.5 w-3.5 ${style.iconColor} transition-colors duration-500`}
            />
            <span
              className={`font-sans text-[10px] font-semibold uppercase tracking-widest ${style.textColor} transition-colors duration-500`}
            >
              {label}
            </span>
          </div>
        </div>

        {/* Content */}
        <p className="font-sans text-base font-light leading-relaxed text-[#F4F0FF]/80 drop-shadow-md transition-colors duration-500 group-hover:text-[#F4F0FF]/95 sm:text-lg md:text-[1.15rem]">
          &quot;{text}&quot;
        </p>

        {/* Decorative elements below */}
        <div className="mt-8 flex w-full scale-90 items-center justify-center gap-3 opacity-50 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#8B5CF6]/50" />
          <div className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6] shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#8B5CF6]/50" />
        </div>
      </div>
    </div>
  )
}
export { MarketInsightCard }
