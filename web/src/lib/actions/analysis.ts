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
  template: 'insight_card' | 'signal_list' | 'metrics'
  eyebrow?: string
  title?: string
  body?: string
  tone?: 'neutral' | 'positive' | 'negative'
  bullets?: string[]
  metrics?: Array<{ label: string; value: string }>
}

export interface AnalysisResult {
  subject: string
  summary: string
  sections: AnalysisSections
  artifacts?: AnalysisArtifact[]
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
    })

    if (!res.ok) return null
    return (await res.json()) as AnalysisResult
  } catch {
    return null
  }
}
