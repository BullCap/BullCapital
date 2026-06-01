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
    borderClass: 'border-[#C98C9A]/25',
    bgClass: 'bg-[#C98C9A]/10',
    glowShadow: 'shadow-none',
    iconColor: 'text-[#C98C9A]',
    textColor: 'text-[#E7A1B0]',
  },
  mixed: {
    icon: AlertCircle,
    borderClass: 'border-white/10',
    bgClass: 'bg-white/5',
    glowShadow: 'shadow-none',
    iconColor: 'text-starlight/60',
    textColor: 'text-starlight/60',
  },
  calm: {
    icon: ShieldCheck,
    borderClass: 'border-[#7FB59A]/25',
    bgClass: 'bg-[#7FB59A]/10',
    glowShadow: 'shadow-none',
    iconColor: 'text-[#7FB59A]',
    textColor: 'text-[#9FCEB4]',
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
    <div className="bull-card-calm group relative flex h-full w-full flex-col items-start justify-center p-8 text-left md:p-10">
      <GlassHighlight widthPercent={75} className="opacity-45" />

      <div className="relative z-10 flex w-full flex-col">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 backdrop-blur-md">
            <span className="font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-starlight/60">
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

        <p className="font-serif text-xl font-medium leading-relaxed text-starlight/82 md:text-2xl">
          {text}
        </p>

        <p className="mt-5 max-w-2xl text-xs leading-5 text-starlight/38">
          Análises contextuais e educacionais. Não constituem recomendação de investimento.
        </p>
      </div>
    </div>
  )
}
export { MarketInsightCard }
