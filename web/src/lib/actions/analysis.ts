'use server'

import { getMarketRadarData, getMarketStatus, getAssetNews, getCurrencyRates } from '@/lib/services/market'
import { ANALYSIS_API_URL, internalApiHeaders } from '@/lib/internal-api'
import { fetchSELIC } from '@/lib/market-utils'
import { normalizeTicker } from '@/lib/market-routing'
import { auth } from '@/lib/auth'

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
  range?: '1d' | '1mo' | '3mo' | '1y'
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
    const session = await auth()
    if (!session?.user) return null

    const normalizedTicker = normalizeTicker(ticker)
    if (!normalizedTicker) return null

    const context: Record<string, unknown> = {}
    const isMarketAnalysis = normalizedTicker === 'MERCADO'

    if (isMarketAnalysis) {
      const [statusResult, selicResult, fxResult] = await Promise.allSettled([
        getMarketStatus(),
        fetchSELIC(),
        getCurrencyRates(['USD-BRL', 'EUR-BRL']),
      ])
      const status = statusResult.status === 'fulfilled' ? statusResult.value : null
      const selic = selicResult.status === 'fulfilled' ? selicResult.value : null
      const fx = fxResult.status === 'fulfilled' ? fxResult.value : null

      if (status?.indices.length) {
        context.indices = status.indices.map((index) => ({
          name: index.name,
          symbol: index.symbol,
          price: index.regularMarketPrice,
          change: index.regularMarketChangePercent,
        }))
      }
      if (selic?.rate) context.selic = selic.rate
      if (fx?.currencies?.length) {
        context.fx = fx.currencies.map((c) => ({
          pair: c.name,
          rate: c.bidPrice,
          change: c.askPrice > 0
            ? +((c.bidPrice - c.lowPrice) / c.lowPrice * 100).toFixed(2)
            : 0,
        }))
      }
    } else {
      const [radarResult, newsResult] = await Promise.allSettled([
        getMarketRadarData(normalizedTicker),
        getAssetNews(normalizedTicker, 3),
      ])

      const radar = radarResult.status === 'fulfilled' ? radarResult.value : null
      const news = newsResult.status === 'fulfilled' ? newsResult.value : []

      // Price + change from the richer radar quote (avoids a double fetch)
      const rq = radar?.quote
      if (rq?.regularMarketPrice != null) context.price = rq.regularMarketPrice
      if (rq?.regularMarketChangePercent != null) context.change = rq.regularMarketChangePercent
      if (rq?.fiftyTwoWeekHigh != null) context.high52 = rq.fiftyTwoWeekHigh
      if (rq?.fiftyTwoWeekLow != null) context.low52 = rq.fiftyTwoWeekLow
      if (rq?.marketCap) context.marketCap = rq.marketCap

      const profile = radar?.profile
      if (profile?.sector) context.sector = profile.sector
      if (profile?.industry) context.industry = profile.industry

      if (radar?.data?.length) {
        context.radar = Object.fromEntries(radar.data.map((d) => [d.metric, d.value]))
      }

      if (news.length > 0) {
        context.news = news.map((n) => ({ title: n.title, publisher: n.publisher }))
      }
    }

    const res = await fetch(`${ANALYSIS_API_URL}/analysis`, {
      method: 'POST',
      headers: internalApiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        subject: isMarketAnalysis ? 'mercado' : normalizedTicker,
        source: isMarketAnalysis ? 'market' : 'asset',
        context,
        template: template?.trim() || null,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok) return null
    return (await res.json()) as AnalysisResult
  } catch {
    return null
  }
}
