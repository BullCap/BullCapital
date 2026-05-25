import { buildAssetHref } from '@/lib/market-routing'
import { getAssetNews, getLatestNews } from '@/lib/services/market'
import type { AssetNewsItem } from '@/types/market'

export const MARKET_NEWS_TICKERS = ['^BVSP', 'PETR4', 'VALE3', 'ITUB4'] as const

export type NewsRadarScope = 'market' | 'watchlist'

export interface NewsRadarItem {
  askHref: string
  headline: string
  href: string
  note: string
  publishedAt: number
  publisher: string
  rankScore: number
  reason: string
  relatedHref?: string
  relatedLabel?: string
  scopes: NewsRadarScope[]
  tickers: string[]
  imageUrl?: string | null
}

interface NewsRadarSource {
  items: AssetNewsItem[]
  scope: NewsRadarScope
  ticker: string
}

function isIndexTicker(ticker: string) {
  return ticker.startsWith('^')
}

export function buildNewsAskHref(headline: string, tickers: string[]): string {
  const anchor = tickers.find((ticker) => !isIndexTicker(ticker)) ?? tickers[0]
  const question = `Explique o impacto desta notícia: "${headline.slice(0, 120)}"`
  if (!anchor) return `/analysis?q=${encodeURIComponent(question)}&source=news`
  return `/analysis?ticker=${encodeURIComponent(anchor)}&q=${encodeURIComponent(question)}&source=news`
}

export function buildNewsNote(tickers: string[]) {
  if (tickers.includes('^BVSP')) {
    return 'Use esta manchete para entender o clima geral do mercado antes de entrar nos nomes individuais.'
  }
  if (tickers.includes('PETR4')) {
    return 'Petrobras ajuda a ler commodities, índice e risco político em uma mesma história.'
  }
  if (tickers.includes('VALE3')) {
    return 'Vale cruza fluxo global, minério e apetite por exportadoras brasileiras.'
  }
  if (tickers.includes('ITUB4')) {
    return 'Itaú ajuda a testar se o movimento local também passa por bancos e crédito.'
  }
  return 'Cruze a manchete com preço, fonte e contexto antes de transformar sinal em tese.'
}

function buildNewsReason(scopes: NewsRadarScope[], tickers: string[]) {
  if (scopes.includes('watchlist')) {
    const followed = tickers.find((ticker) => !isIndexTicker(ticker))
    return followed ? `${followed} está na sua lista` : 'Apareceu na sua lista'
  }
  if (tickers.includes('^BVSP')) return 'Afeta a leitura do mercado local'
  return tickers[0] ? `${tickers[0]} está no radar do dia` : 'História priorizada no radar'
}

function getRankScore(item: NewsRadarItem) {
  const ageHours = item.publishedAt > 0
    ? Math.max(0, Date.now() / 1000 - item.publishedAt) / 3600
    : 72
  const freshness = Math.max(0, 48 - ageHours)
  const watchlistBoost = item.scopes.includes('watchlist') ? 120 : 0
  const marketBoost = item.tickers.includes('^BVSP') ? 26 : 12
  const confirmedAssets = item.tickers.filter((ticker) => !isIndexTicker(ticker)).length

  return Math.round(freshness + watchlistBoost + marketBoost + confirmedAssets * 8)
}

export function buildNewsRadarItems(sources: NewsRadarSource[]): NewsRadarItem[] {
  const deduped = new Map<string, NewsRadarItem>()

  for (const source of sources) {
    for (const item of source.items) {
      if (!item.link) continue

      const existing = deduped.get(item.link)
      if (existing) {
        if (!existing.tickers.includes(source.ticker)) existing.tickers.push(source.ticker)
        if (!existing.scopes.includes(source.scope)) existing.scopes.push(source.scope)
        if (!isIndexTicker(source.ticker)) {
          existing.relatedHref = buildAssetHref(source.ticker)
          existing.relatedLabel = `Abrir ${source.ticker}`
        }
        existing.askHref = buildNewsAskHref(existing.headline, existing.tickers)
        existing.note = buildNewsNote(existing.tickers)
        existing.reason = buildNewsReason(existing.scopes, existing.tickers)
        existing.rankScore = getRankScore(existing)
        if (!existing.imageUrl && item.imageUrl) {
          existing.imageUrl = item.imageUrl
        }
        continue
      }

      const relatedHref = isIndexTicker(source.ticker) ? '/analysis' : buildAssetHref(source.ticker)
      const scopes = [source.scope]
      const tickers = [source.ticker]
      const radarItem: NewsRadarItem = {
        askHref: buildNewsAskHref(item.title, tickers),
        headline: item.title,
        href: item.link,
        note: buildNewsNote(tickers),
        publishedAt: item.publishedAt,
        publisher: item.publisher,
        rankScore: 0,
        reason: buildNewsReason(scopes, tickers),
        relatedHref,
        relatedLabel: isIndexTicker(source.ticker) ? 'Ler mercado' : `Abrir ${source.ticker}`,
        scopes,
        tickers,
        imageUrl: item.imageUrl ?? null,
      }
      radarItem.rankScore = getRankScore(radarItem)
      deduped.set(item.link, radarItem)
    }
  }

  return Array.from(deduped.values()).sort((left, right) => {
    if (right.rankScore !== left.rankScore) return right.rankScore - left.rankScore
    return right.publishedAt - left.publishedAt
  })
}

export async function getNewsRadarItems(watchlist: string[] = []): Promise<NewsRadarItem[]> {
  const watchlistTickers = watchlist.slice(0, 5)

  const [marketResult, ...watchlistResults] = await Promise.allSettled([
    getLatestNews(18),
    ...watchlistTickers.map((ticker) => getAssetNews(ticker, 4)),
  ])

  const sources: NewsRadarSource[] = []

  if (marketResult.status === 'fulfilled') {
    const items = marketResult.value
    const matched = new Map<string, AssetNewsItem[]>()
    const generic: AssetNewsItem[] = []

    for (const item of items) {
      const tagged = (item.relatedTickers ?? []).filter((ticker) => ticker)
      if (tagged.length === 0) {
        generic.push(item)
        continue
      }
      for (const ticker of tagged) {
        const bucket = matched.get(ticker) ?? []
        bucket.push(item)
        matched.set(ticker, bucket)
      }
    }

    for (const [ticker, bucket] of matched.entries()) {
      sources.push({ scope: 'market', ticker, items: bucket })
    }
    if (generic.length > 0) {
      sources.push({ scope: 'market', ticker: '^BVSP', items: generic })
    }
  }

  watchlistResults.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      sources.push({ scope: 'watchlist', ticker: watchlistTickers[idx], items: result.value })
    }
  })

  return buildNewsRadarItems(sources)
}
