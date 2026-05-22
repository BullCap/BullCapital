'use server'

import { getMarketRadarData } from '@/lib/services/market'
import { fetchIndexFromBrapi } from '@/lib/market-utils'
import { normalizeTicker } from '@/lib/market-routing'

const ANALYSIS_API_URL = process.env.ANALYSIS_API_URL ?? 'http://localhost:8001/api/v1'

export interface AnalysisSections {
  o_que_aconteceu: string
  por_que_importa: string
  impacto_potencial: string
  o_que_acompanhar: string
  riscos_e_incertezas: string
}

export interface AnalysisArtifact {
  template: 'insight_card' | 'signal_list' | 'metrics' | 'price_chart' | 'radar_chart' | 'bar_chart'
  eyebrow?: string
  title?: string
  body?: string
  tone?: 'neutral' | 'positive' | 'negative'
  bullets?: string[]
  metrics?: Array<{ label: string; value: string }>
  // chart-specific
  range?: '1d' | '1mo' | '1y'
  chart_note?: string
  bars?: Array<{ label: string; value: number; color?: 'positive' | 'negative' | 'neutral' }>
}

export interface AnalysisRadarData {
  Rentabilidade?: number
  Momentum?: number
  Liquidez?: number
  Valuation?: number
  Tendência?: number
  [key: string]: number | undefined
}

export interface AnalysisResult {
  subject: string
  summary: string
  sections: AnalysisSections
  artifacts?: AnalysisArtifact[]
  data?: {
    price?: number
    change?: number
    radar?: AnalysisRadarData
  }
}

export async function requestAnalysis(
  ticker: string,
  template?: string
): Promise<AnalysisResult | null> {
  try {
    const normalizedTicker = normalizeTicker(ticker)
    if (!normalizedTicker) return null
    const [quoteResult, radarResult] = await Promise.allSettled([
      fetchIndexFromBrapi(normalizedTicker),
      getMarketRadarData(normalizedTicker),
    ])

    const quote = quoteResult.status === 'fulfilled' ? quoteResult.value : null
    const radar = radarResult.status === 'fulfilled' ? radarResult.value : null

    const context: Record<string, unknown> = {}
    if (quote?.price != null) context.price = quote.price
    if (quote?.changePercent != null) context.change = quote.changePercent
    if (radar?.data?.length) {
      context.radar = Object.fromEntries(radar.data.map((d) => [d.metric, d.value]))
    }

    const res = await fetch(`${ANALYSIS_API_URL}/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: normalizedTicker,
        source: 'asset',
        context,
        template: template?.trim() || null,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) return null
    return (await res.json()) as AnalysisResult
  } catch {
    return null
  }
}
