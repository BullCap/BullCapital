export type TemperatureLevel = 'panico' | 'medo' | 'neutro' | 'ganancia' | 'euforia'

const MARKET_FETCH_TIMEOUT_MS = 20000
const MARKET_API_URL = process.env.ANALYSIS_API_URL ?? 'http://localhost:8001/api/v1'

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

export async function fetchSELIC(): Promise<{ rate: string; date: string } | null> {
  try {
    const today = new Date()
    const start = new Date(today)
    start.setDate(start.getDate() - 45)
    const formatDate = (date: Date) =>
      new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Sao_Paulo',
      }).format(date)
    const url = new URL('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados')
    url.searchParams.set('formato', 'json')
    url.searchParams.set('dataInicial', formatDate(start))
    url.searchParams.set('dataFinal', formatDate(today))

    const res = await fetch(url, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(MARKET_FETCH_TIMEOUT_MS),
    })
    if (!res.ok) return null

    const data: Array<{ data: string; valor: string }> = await res.json()
    const latest = data.at(-1)
    if (!latest) return null

    const value = Number(latest.valor.replace(',', '.'))
    if (!Number.isFinite(value)) return null

    return {
      rate: `${value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}% a.a.`,
      date: latest.data,
    }
  } catch {
    return null
  }
}

// Single-symbol fetch from the local yfinance-backed API.
export async function fetchIndexFromYfinance(
  symbol: string
): Promise<{ price: number; changePercent: number; name: string | null } | null> {
  try {
    const res = await fetch(`${MARKET_API_URL}/market/quote/${encodeURIComponent(symbol)}`, {
      cache: 'no-store',
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
