import { cn } from '@/lib/utils'
import type { EventImpact, InsightSeverity, StatusTone } from './portfolioMock'

export function formatMoney(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatCompactMoney(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

export function formatPercentValue(value: number, options?: { signed?: boolean }): string {
  const sign = options?.signed && value > 0 ? '+' : ''
  return `${sign}${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`
}

export function toneClass(tone: StatusTone): string {
  return cn(
    tone === 'positivo' && 'border-[#7fb59a]/20 bg-[#7fb59a]/10 text-[#b6dcc7]',
    tone === 'neutro' && 'border-white/[0.08] bg-white/[0.04] text-[#F4F0FF]/60',
    tone === 'atencao' && 'border-[#d0b982]/20 bg-[#d0b982]/10 text-[#ead9ad]',
    tone === 'risco' && 'border-[#c98c9a]/20 bg-[#c98c9a]/10 text-[#e8bdc6]'
  )
}

export function severityClass(severity: InsightSeverity): string {
  return cn(
    severity === 'informativo' && 'border-[#82759F]/20 bg-[#82759F]/10 text-[#B1A9C4]',
    severity === 'atencao' && 'border-[#d0b982]/20 bg-[#d0b982]/10 text-[#ead9ad]',
    severity === 'critico' && 'border-[#c98c9a]/20 bg-[#c98c9a]/10 text-[#e8bdc6]'
  )
}

export function impactClass(impact: EventImpact): string {
  return cn(
    impact === 'baixo' && 'border-white/[0.08] bg-white/[0.04] text-[#F4F0FF]/50',
    impact === 'medio' && 'border-[#d0b982]/20 bg-[#d0b982]/10 text-[#ead9ad]',
    impact === 'alto' && 'border-[#c98c9a]/20 bg-[#c98c9a]/10 text-[#e8bdc6]'
  )
}
