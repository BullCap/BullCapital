// Formatting helpers for the client portfolio area. All monetary values flow
// as integer cents (contract: docs/contracts/deterministic-payload.md) and the
// UI owns pt-BR formatting.
import { cn } from '@/lib/utils'
import type {
  ConcentrationAlertLevel,
  PortfolioAssetClass,
} from '@/modules/portfolio'

export function formatCents(valueCents: number, options?: { compact?: boolean }): string {
  return (valueCents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: options?.compact ? 0 : 2,
    minimumFractionDigits: options?.compact ? 0 : 2,
  })
}

/** Weight/ratio between 0 and 1 → "37,5%". */
export function formatWeight(weight: number, digits = 1): string {
  return `${(weight * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`
}

/** Signed delta in percentage points → "+4,2 p.p.". */
export function formatDeltaPp(deltaWeight: number): string {
  const value = (deltaWeight * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  return `${deltaWeight > 0 ? '+' : ''}${value} p.p.`
}

export function formatSignedCents(valueCents: number): string {
  return `${valueCents > 0 ? '+' : ''}${formatCents(valueCents, { compact: true })}`
}

/** "2027-03" → "mar/2027". */
export function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  const date = new Date(Number(year), Number(m) - 1, 1)
  return `${date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}/${year}`
}

/** "2027-03-15" → "15/03/2027". */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

export function formatAge(ageDays: number): string {
  if (ageDays === 0) return 'atualizado hoje'
  if (ageDays === 1) return 'atualizado há 1 dia'
  return `atualizado há ${ageDays} dias`
}

export const ASSET_CLASS_LABELS: Record<PortfolioAssetClass, string> = {
  CASH: 'Caixa',
  FIXED_INCOME: 'Renda fixa bancária',
  TREASURY: 'Títulos públicos',
  FUND: 'Fundos',
  EQUITY: 'Ações',
  FII: 'FIIs',
  ETF: 'ETFs',
  PENSION: 'Previdência',
  COE: 'COE',
  OTHER: 'Outros',
}

export const ALERT_LEVEL_LABELS: Record<ConcentrationAlertLevel, string> = {
  info: 'Informativo',
  attention: 'Atenção',
  critical: 'Crítico',
}

/** Desaturated severity palette — never pure red/green (system-design §6.2). */
export function alertLevelClass(level: ConcentrationAlertLevel): string {
  return cn(
    level === 'info' && 'border-[#82759F]/20 bg-[#82759F]/10 text-[#B1A9C4]',
    level === 'attention' && 'border-[#d0b982]/20 bg-[#d0b982]/10 text-[#ead9ad]',
    level === 'critical' && 'border-[#c98c9a]/25 bg-[#c98c9a]/10 text-[#e8bdc6]'
  )
}

/** Ordered palette for allocation bars — amethyst family first, then quiet neutrals. */
export const BUCKET_COLORS = [
  '#B1A9C4',
  '#82759F',
  '#5F5675',
  '#7fb59a',
  '#d0b982',
  '#8da3b8',
  '#c98c9a',
  '#6f7d8f',
  '#4a4458',
  '#3a3547',
] as const

export function bucketColor(index: number): string {
  return BUCKET_COLORS[index % BUCKET_COLORS.length]
}
