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

// Banco Central do Brasil API — free, no key required
export async function fetchSELIC(): Promise<{ rate: string; date: string } | null> {
  try {
    const res = await fetch(
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json',
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) return null
    const data: Array<{ data: string; valor: string }> = await res.json()
    if (!data[0]) return null
    const value = parseFloat(data[0].valor.replace(',', '.'))
    const rate =
      value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
      '% a.a.'
    return { rate, date: data[0].data }
  } catch {
    return null
  }
}

// Single-ticker fetch from Brapi — works on free plan (1 ticker per request).
export async function fetchIndexFromBrapi(
  symbol: string
): Promise<{ price: number; changePercent: number; name: string | null } | null> {
  const apiKey = process.env.BRAPI_KEY
  if (!apiKey) return null
  try {
    const res = await fetch(
      `https://brapi.dev/api/quote/${encodeURIComponent(symbol)}?token=${apiKey}`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const item = data.results?.[0]
    if (!item) return null
    return {
      price: Number(item.regularMarketPrice ?? 0),
      changePercent: Number(item.regularMarketChangePercent ?? 0),
      name: (item.longName ?? item.shortName ?? null) as string | null,
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
