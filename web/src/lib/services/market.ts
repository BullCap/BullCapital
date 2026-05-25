import type {
  AssetHistoryData,
  AssetNewsItem,
  AssetQuote,
  AssetSearchData,
  CurrencyData,
  MarketIndicatorsData,
  MarketListingsData,
  MarketRadarData,
  MarketStatusData,
} from '@/types/market'
import { ANALYSIS_API_URL, internalApiHeaders } from '@/lib/internal-api'

export interface MarketListingsParams {
  page?: number
  limit?: number
  sortBy?:
    | 'name'
    | 'close'
    | 'change'
    | 'change_abs'
    | 'volume'
    | 'market_cap_basic'
    | 'sector'
    | 'rank'
    | string
  sortOrder?: 'asc' | 'desc'
  type?: 'stock' | 'fund' | 'bdr' | 'etf' | string
  sector?: string
  search?: string
}

const MARKET_API_URL = ANALYSIS_API_URL
const MARKET_FETCH_TIMEOUT_MS = 10000
const MARKET_BATCH_TIMEOUT_MS = 25000
const QUOTE_REVALIDATE_SECONDS = 300
const DAILY_REVALIDATE_SECONDS = 86400

function emptySearch(limit: number): AssetSearchData & { error?: string } {
  return {
    results: [],
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: limit,
    totalCount: 0,
    hasNextPage: false,
  }
}

async function marketGet<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
  revalidate = 60
) {
  const url = new URL(`${MARKET_API_URL}${path}`)
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value))
  })

  const response = await fetch(url, {
    headers: internalApiHeaders(),
    next: { revalidate },
    signal: AbortSignal.timeout(MARKET_FETCH_TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`Market API returned ${response.status}`)
  }
  return (await response.json()) as T
}

async function marketPost<T>(path: string, body: unknown, timeoutMs = MARKET_FETCH_TIMEOUT_MS) {
  // POST responses are never reused; relying on Next's cache here previously
  // pinned a transient timeout failure for the full revalidate window.
  const response = await fetch(`${MARKET_API_URL}${path}`, {
    method: 'POST',
    headers: internalApiHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!response.ok) {
    throw new Error(`Market API returned ${response.status}`)
  }
  return (await response.json()) as T
}

export async function getMarketRadarData(
  ticker: string = 'PETR4'
): Promise<MarketRadarData | null> {
  try {
    const data = await marketGet<MarketRadarData>(`/market/radar/${encodeURIComponent(ticker)}`, undefined, QUOTE_REVALIDATE_SECONDS)
    return data?.data?.length ? data : null
  } catch (error) {
    console.warn('Exception while fetching market radar data:', error)
    return null
  }
}

export async function getMarketListings(
  params: MarketListingsParams = {}
): Promise<MarketListingsData | null> {
  try {
    return await marketGet<MarketListingsData>('/market/listings', {
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      type: params.type,
      search: params.search ?? params.sector,
    }, QUOTE_REVALIDATE_SECONDS)
  } catch (error) {
    console.warn('Exception while fetching market listings:', error)
    return null
  }
}

export interface TreasuryBond {
  symbol: string
  name: string
  buyPrice: number
  sellPrice: number
  buyRate: number
  sellRate: number
  maturityDate: string
  durationDays: number
  indexer: string
}

export async function getTreasuryBonds(): Promise<{ data: TreasuryBond[] } | null> {
  try {
    return await marketGet<{ data: TreasuryBond[] }>('/market/treasury', undefined, QUOTE_REVALIDATE_SECONDS)
  } catch (error) {
    console.warn('Exception while fetching treasury bonds:', error)
    return null
  }
}

export async function getMultipleQuotes(
  tickers: string[]
): Promise<{ results: AssetQuote[]; error?: string }> {
  if (tickers.length === 0) return { results: [], error: 'No tickers provided.' }

  // Batch fetches can chain 20+ Brapi PRO calls on a cold cache; give them headroom.
  const timeoutMs = tickers.length > 8 ? MARKET_BATCH_TIMEOUT_MS : MARKET_FETCH_TIMEOUT_MS
  try {
    return await marketPost<{ results: AssetQuote[] }>('/market/quotes', { symbols: tickers }, timeoutMs)
  } catch (error) {
    console.warn('Exception while fetching market quotes:', error)
    return { results: [], error: 'Falha ao buscar cotações reais.' }
  }
}

export async function getMarketIndicators(): Promise<MarketIndicatorsData & { error?: string }> {
  try {
    return await marketGet<MarketIndicatorsData>('/market/indicators', undefined, DAILY_REVALIDATE_SECONDS)
  } catch (error) {
    console.warn('Exception while fetching macro indicators from backend:', error)
    return {
      selic: [],
      inflation: [],
      error: 'Failed to fetch macro indicators from database.',
    }
  }
}

export async function searchAssets(
  query: string,
  limit: number = 10,
  page: number = 1
): Promise<AssetSearchData & { error?: string }> {
  if (!query.trim()) return emptySearch(limit)

  try {
    return await marketGet<AssetSearchData>('/market/search', { q: query, limit, page }, QUOTE_REVALIDATE_SECONDS)
  } catch (error) {
    console.warn('Exception while searching market assets:', error)
    return { ...emptySearch(limit), error: 'Falha ao buscar ativos reais.' }
  }
}

export async function getMarketStatus(): Promise<MarketStatusData & { error?: string }> {
  try {
    return await marketGet<MarketStatusData>('/market/status', undefined, QUOTE_REVALIDATE_SECONDS)
  } catch (error) {
    console.warn('Exception while fetching market status:', error)
    return { indices: [], error: 'Falha ao buscar status real do mercado.' }
  }
}

export async function getAssetHistory(
  tickers: string[],
  range: string = '1mo'
): Promise<AssetHistoryData> {
  if (!tickers || tickers.length === 0) {
    return { results: [], error: 'No tickers provided.' }
  }

  try {
    return await marketGet<AssetHistoryData>('/market/history', {
      tickers: tickers.join(','),
      range,
    }, QUOTE_REVALIDATE_SECONDS)
  } catch (error) {
    console.warn('Exception while fetching asset history:', error)
    return { results: [], error: 'Falha ao buscar histórico real do ativo.' }
  }
}

export async function getAssetNews(
  ticker: string,
  newsCount: number = 3
): Promise<AssetNewsItem[]> {
  try {
    return await marketGet<AssetNewsItem[]>(`/market/news/${encodeURIComponent(ticker)}`, {
      count: newsCount,
    }, 3600)
  } catch {
    return []
  }
}

export async function getLatestNews(count: number = 12): Promise<AssetNewsItem[]> {
  try {
    return await marketGet<AssetNewsItem[]>('/market/news', { count }, 600)
  } catch (err) {
    console.warn('Exception while fetching latest news:', err)
    return []
  }
}

export async function getCurrencyRates(
  pairs: string[] = ['USD-BRL', 'EUR-BRL', 'GBP-BRL']
): Promise<CurrencyData> {
  try {
    return await marketGet<CurrencyData>('/market/currency', { pairs: pairs.join(',') }, QUOTE_REVALIDATE_SECONDS)
  } catch (err) {
    console.warn('Exception while fetching currency rates:', err)
    return { currencies: [], error: 'Falha ao buscar câmbio real.' }
  }
}
