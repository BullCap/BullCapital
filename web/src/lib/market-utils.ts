import { getMarketIndicators } from '@/modules/market'
import { ANALYSIS_API_URL, internalApiHeaders } from '@/lib/internal-api'

export type TemperatureLevel = 'panico' | 'medo' | 'neutro' | 'ganancia' | 'euforia'

const MARKET_FETCH_TIMEOUT_MS = 10000
const MARKET_API_URL = ANALYSIS_API_URL

export interface ComputedTemperature {
  value: number
  label: string
  level: TemperatureLevel
}

export interface TemperatureInputs {
  ibovChange: number
  vix: number | null
  /** USD/BRL intraday change in % (positive = BRL depreciating) */
  usdBrlChange?: number | null
  /** % of B3 universe stocks with positive change (0-100) */
  marketBreadth?: number | null
}

function getLevelAndLabel(value: number): { label: string; level: TemperatureLevel } {
  if (value <= 20) return { level: 'panico', label: 'Pânico extremo' }
  if (value <= 40) return { level: 'medo', label: 'Medo' }
  if (value <= 60) return { level: 'neutro', label: 'Neutro' }
  if (value <= 80) return { level: 'ganancia', label: 'Ganância' }
  return { level: 'euforia', label: 'Euforia' }
}

export function computeTemperature(inputs: TemperatureInputs): ComputedTemperature
/** @deprecated Pass TemperatureInputs object instead */
export function computeTemperature(ibovChange: number, vix: number | null): ComputedTemperature
export function computeTemperature(
  inputsOrIbov: TemperatureInputs | number,
  legacyVix?: number | null,
): ComputedTemperature {
  const inputs: TemperatureInputs =
    typeof inputsOrIbov === 'number'
      ? { ibovChange: inputsOrIbov, vix: legacyVix ?? null }
      : inputsOrIbov

  const { ibovChange, vix, usdBrlChange, marketBreadth } = inputs

  // Base signal: IBOVESPA daily change, mapped -5% → 0, 0% → 50, +5% → 100
  const ibovBase = Math.min(100, Math.max(0, ((ibovChange + 5) / 10) * 100))

  // VIX amplifier: high fear → amplify negative moves
  const vixAmp = vix !== null ? (vix > 30 ? 1.4 : vix > 20 ? 1.1 : 0.9) : 1.0

  let score = 50 + (ibovBase - 50) * vixAmp

  // USD/BRL adjustment: BRL depreciating >1% → subtract up to 8 points
  if (usdBrlChange != null) {
    const fxPenalty = Math.min(8, Math.max(-4, usdBrlChange * 2.5))
    score -= fxPenalty
  }

  // Market breadth adjustment: <40% gainers → subtract up to 6 points; >60% → add up to 6
  if (marketBreadth != null) {
    const breadthDelta = (marketBreadth - 50) / 50 * 6
    score += breadthDelta
  }

  const value = Math.round(Math.min(100, Math.max(0, score)))
  const { label, level } = getLevelAndLabel(value)
  return { value, label, level }
}

export async function fetchSELIC(): Promise<{ rate: string; date: string } | null> {
  try {
    const data = await getMarketIndicators()
    const latest = data.selic?.[0]
    if (!latest) return null
    const numValue = typeof latest.value === 'number' ? latest.value : parseFloat(latest.value)
    if (isNaN(numValue)) return null
    return {
      rate: `${numValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}% a.a.`,
      date: latest.date,
    }
  } catch {
    return null
  }
}

/** IPCA — inflação mensal acumulada 12 meses (série BCB 13522). */
export async function fetchIPCA(): Promise<{ rate: string; date: string } | null> {
  try {
    const data = await getMarketIndicators()
    const latest = data.inflation?.[0]
    if (!latest) return null
    const numValue = typeof latest.value === 'number' ? latest.value : parseFloat(latest.value)
    if (isNaN(numValue)) return null
    return {
      rate: `${numValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}% a.a.`,
      date: latest.date,
    }
  } catch {
    return null
  }
}

// Single-symbol fetch through the FastAPI market boundary backed by Brapi PRO.
export async function fetchMarketQuote(
  symbol: string
): Promise<{ price: number; changePercent: number; name: string | null } | null> {
  try {
    const res = await fetch(`${MARKET_API_URL}/market/quote/${encodeURIComponent(symbol)}`, {
      headers: internalApiHeaders(),
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(MARKET_FETCH_TIMEOUT_MS),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.symbol) return null
    return {
      price: Number(data.regularMarketPrice ?? 0),
      changePercent: Number(data.regularMarketChangePercent ?? 0),
      name: (data.longName ?? data.shortName ?? null) as string | null,
    }
  } catch {
    return null
  }
}

export function isMarketOpen(): boolean {
  const brt = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const day = brt.getDay()
  const hour = brt.getHours() + brt.getMinutes() / 60
  return day >= 1 && day <= 5 && hour >= 10 && hour < 17
}
