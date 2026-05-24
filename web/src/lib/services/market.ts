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

const MARKET_API_URL = process.env.ANALYSIS_API_URL ?? 'http://localhost:8001/api/v1'
const MARKET_FETCH_TIMEOUT_MS = 10000

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
    next: { revalidate },
    signal: AbortSignal.timeout(MARKET_FETCH_TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`yfinance market API returned ${response.status}`)
  }
  return (await response.json()) as T
}

async function marketPost<T>(path: string, body: unknown, revalidate = 60) {
  const response = await fetch(`${MARKET_API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    next: { revalidate },
    signal: AbortSignal.timeout(MARKET_FETCH_TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`yfinance market API returned ${response.status}`)
  }
  return (await response.json()) as T
}

export async function getMarketRadarData(
  ticker: string = 'PETR4'
): Promise<MarketRadarData | null> {
  try {
    const data = await marketGet<MarketRadarData>(`/market/radar/${encodeURIComponent(ticker)}`)
    return data?.data?.length ? data : null
  } catch (error) {
    console.warn('Exception while fetching yfinance radar data:', error)
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
    })
  } catch (error) {
    console.warn('Exception while fetching yfinance market listings:', error)
    return null
  }
}

export async function getMultipleQuotes(
  tickers: string[]
): Promise<{ results: AssetQuote[]; error?: string }> {
  if (tickers.length === 0) return { results: [], error: 'No tickers provided.' }

  try {
    return await marketPost<{ results: AssetQuote[] }>('/market/quotes', { symbols: tickers }, 60)
  } catch (error) {
    console.warn('Exception while fetching yfinance quotes:', error)
    return { results: [], error: 'Failed to fetch quotes from yfinance API.' }
  }
}

export async function getMarketIndicators(): Promise<MarketIndicatorsData & { error?: string }> {
  return {
    selic: [],
    inflation: [],
    error: 'Market indicators are not available through yfinance.',
  }
}

export async function searchAssets(
  query: string,
  limit: number = 10,
  page: number = 1
): Promise<AssetSearchData & { error?: string }> {
  if (!query.trim()) return emptySearch(limit)

  try {
    return await marketGet<AssetSearchData>('/market/search', { q: query, limit, page })
  } catch (error) {
    console.warn('Exception while searching yfinance assets:', error)
    return { ...emptySearch(limit), error: 'Failed to search assets from yfinance API.' }
  }
}

export async function getMarketStatus(): Promise<MarketStatusData & { error?: string }> {
  try {
    return await marketGet<MarketStatusData>('/market/status')
  } catch (error) {
    console.warn('Exception while fetching yfinance market status:', error)
    return { indices: [], error: 'Failed to fetch market status from yfinance API.' }
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
    }, 300)
  } catch (error) {
    console.warn('Exception while fetching yfinance asset history:', error)
    return { results: [], error: 'Failed to fetch asset history from yfinance API.' }
  }
}

export async function getAssetNews(
  ticker: string,
  newsCount: number = 3
): Promise<AssetNewsItem[]> {
  try {
    return await marketGet<AssetNewsItem[]>(`/market/news/${encodeURIComponent(ticker)}`, {
      count: newsCount,
    }, 600)
  } catch {
    return []
  }
}

export async function getCurrencyRates(
  pairs: string[] = ['USD-BRL', 'EUR-BRL', 'GBP-BRL']
): Promise<CurrencyData> {
  try {
    return await marketGet<CurrencyData>('/market/currency', { pairs: pairs.join(',') })
  } catch (err) {
    console.warn('Exception while fetching yfinance currency rates:', err)
    return { currencies: [], error: 'Failed to fetch currency rates from yfinance API.' }
  }
}
