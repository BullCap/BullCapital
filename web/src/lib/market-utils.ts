import type { PrimeRateEntry } from '@/types/market'

export const CURATED_TICKERS = [
  'PETR4',
  'VALE3',
  'ITUB4',
  'BBDC4',
  'ABEV3',
  'WEGE3',
  'MGLU3',
  'B3SA3',
  'BBAS3',
  'RENT3',
  'SUZB3',
  'RADL3',
]

export type TemperatureLevel = 'panico' | 'medo' | 'neutro' | 'ganancia' | 'euforia'

export interface ComputedTemperature {
  value: number
  label: string
  level: TemperatureLevel
}

function getLevelAndLabel(value: number): { label: string; level: TemperatureLevel } {
  if (value <= 20) return { level: 'panico', label: 'Pânico extremo' }
  if (value <= 40) return { level: 'medo', label: 'Medo' }
  if (value <= 60) return { level: 'neutro', label: 'Neutro' }
  if (value <= 80) return { level: 'ganancia', label: 'Ganância' }
  return { level: 'euforia', label: 'Euforia' }
}

export function computeTemperature(
  ibovChange: number,
  vix: number | null
): ComputedTemperature {
  const base = Math.min(100, Math.max(0, ((ibovChange + 5) / 10) * 100))
  const amp = vix !== null ? (vix > 30 ? 1.4 : vix > 20 ? 1.1 : 0.9) : 1.0
  const value = Math.round(Math.min(100, Math.max(0, 50 + (base - 50) * amp)))
  const { label, level } = getLevelAndLabel(value)
  return { value, label, level }
}

export function formatSELIC(selic: PrimeRateEntry[]): { rate: string; date: string } | null {
  if (!selic.length) return null
  const latest = selic[0]
  const rate =
    parseFloat(latest.value).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + '% a.a.'
  const date = new Date(latest.epochDate * 1000).toLocaleDateString('pt-BR')
  return { rate, date }
}

export function isMarketOpen(): boolean {
  const brt = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const day = brt.getDay()
  const hour = brt.getHours() + brt.getMinutes() / 60
  return day >= 1 && day <= 5 && hour >= 10 && hour < 17
}
