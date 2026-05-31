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
    tone === 'positivo' && 'border-emerald-400/15 bg-emerald-400/10 text-emerald-200',
    tone === 'neutro' && 'border-white/[0.08] bg-white/[0.04] text-[#F4F0FF]/60',
    tone === 'atencao' && 'border-amber-300/15 bg-amber-300/10 text-amber-100',
    tone === 'risco' && 'border-[#F43F5E]/20 bg-[#F43F5E]/10 text-rose-100'
  )
}

export function severityClass(severity: InsightSeverity): string {
  return cn(
    severity === 'informativo' && 'border-[#8B5CF6]/20 bg-[#8B5CF6]/10 text-[#C4B5FD]',
    severity === 'atencao' && 'border-amber-300/20 bg-amber-300/10 text-amber-100',
    severity === 'critico' && 'border-[#F43F5E]/20 bg-[#F43F5E]/10 text-rose-100'
  )
}

export function impactClass(impact: EventImpact): string {
  return cn(
    impact === 'baixo' && 'border-white/[0.08] bg-white/[0.04] text-[#F4F0FF]/50',
    impact === 'medio' && 'border-amber-300/20 bg-amber-300/10 text-amber-100',
    impact === 'alto' && 'border-[#F43F5E]/20 bg-[#F43F5E]/10 text-rose-100'
  )
}
