import type {
  AssetHistoryData,
  AssetNewsItem,
  AssetQuote,
  AssetSearchData,
  CurrencyData,
  MarketIndicatorsData,
  HomeHighlightsSnapshot,
  LandingMarketSnapshot,
  MarketListingsData,
  MarketPulseSnapshot,
  MarketRadarData,
  MarketStatusData,
  TerminalMarketSnapshot,
} from '@/types/market'
import { ANALYSIS_API_URL, internalApiHeaders } from '@/lib/internal-api'
import { unstable_cache } from 'next/cache'

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
const MARKET_FETCH_TIMEOUT_MS = 5500
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

function emptyListings(): MarketListingsData {
  return {
    stocks: [],
    indexes: [],
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
  }
}

function emptyPulseSnapshot(): MarketPulseSnapshot {
  return {
    quotes: { results: [] },
    history: { results: [] },
    indicators: { selic: [], inflation: [] },
    currency: { currencies: [] },
  }
}

function emptyHighlightsSnapshot(): HomeHighlightsSnapshot {
  const listings = emptyListings()
  return {
    gainers: listings,
    losers: listings,
    mostTraded: listings,
    crypto: listings,
    fixedIncome: listings,
    treemapQuotes: { results: [] },
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

function normalizeQuoteBatch(tickers: string[]): string[] {
  return Array.from(
    new Set(
      tickers
        .map((ticker) => ticker.trim().toUpperCase().replace(/\.SA$/i, ''))
        .filter(Boolean)
    )
  )
}

const getCachedMultipleQuotes = unstable_cache(
  async (symbolsKey: string): Promise<{ results: AssetQuote[] }> => {
    const symbols = symbolsKey.split(',').filter(Boolean)
    const timeoutMs = symbols.length > 8 ? MARKET_BATCH_TIMEOUT_MS : MARKET_FETCH_TIMEOUT_MS
    const data = await marketPost<{ results: AssetQuote[] }>('/market/quotes', { symbols }, timeoutMs)
    if (symbols.length > 0 && (!Array.isArray(data.results) || data.results.length === 0)) {
      throw new Error(`Market API returned an empty quote batch for ${symbolsKey}`)
    }
    return data
  },
  ['market-quotes-batch-v2'],
  { revalidate: QUOTE_REVALIDATE_SECONDS }
)

// ── Snapshot resilience ────────────────────────────────────────────────────────
// Snapshot endpoints aggregate the whole DB cache and back the home/landing/terminal
// screens. The backend's `_safe` wrapper can answer 200 + empty arrays when a query
// transiently fails (e.g. cold Supabase pool right after a deploy). If that empty
// body lands in Next's Data Cache it pins a blank screen for the full revalidate
// window. To avoid it we fetch with `no-store`, validate the payload, and throw on
// empty so nothing empty is ever cached — then serve the last good snapshot kept in
// memory (survives across requests on the long-running Node server) instead of blank.
const lastGoodSnapshot = new Map<string, unknown>()

function rememberSnapshot<T>(key: string, data: T): T {
  lastGoodSnapshot.set(key, data)
  return data
}

function recallSnapshot<T>(key: string, fallback: T): T {
  return (lastGoodSnapshot.get(key) as T | undefined) ?? fallback
}

async function marketGetFresh<T>(path: string, isValid: (data: T) => boolean): Promise<T> {
  const response = await fetch(`${MARKET_API_URL}${path}`, {
    headers: internalApiHeaders(),
    cache: 'no-store',
    signal: AbortSignal.timeout(MARKET_FETCH_TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`Market API returned ${response.status} for ${path}`)
  }
  const data = (await response.json()) as T
  if (!isValid(data)) {
    throw new Error(`Market API returned an empty snapshot for ${path}`)
  }
  return data
}

const getCachedPulseSnapshot = unstable_cache(
  async (): Promise<MarketPulseSnapshot> => {
    const data = await marketGetFresh<MarketPulseSnapshot>(
      '/market/snapshot/pulse',
      (d) => (d.quotes?.results?.length ?? 0) > 0 || (d.history?.results?.length ?? 0) > 0
    )
    return rememberSnapshot('pulse', data)
  },
  ['market-snapshot-pulse-v1'],
  { revalidate: QUOTE_REVALIDATE_SECONDS }
)

const getCachedHomeHighlightsSnapshot = unstable_cache(
  async (): Promise<HomeHighlightsSnapshot> => {
    const data = await marketGetFresh<HomeHighlightsSnapshot>(
      '/market/snapshot/home-highlights',
      (d) =>
        (d.gainers?.stocks?.length ?? 0) > 0 ||
        (d.losers?.stocks?.length ?? 0) > 0 ||
        (d.mostTraded?.stocks?.length ?? 0) > 0 ||
        (d.treemapQuotes?.results?.length ?? 0) > 0
    )
    return rememberSnapshot('home-highlights', data)
  },
  ['market-snapshot-home-highlights-v1'],
  { revalidate: QUOTE_REVALIDATE_SECONDS }
)

const getCachedLandingSnapshot = unstable_cache(
  async (): Promise<LandingMarketSnapshot> => {
    const data = await marketGetFresh<LandingMarketSnapshot>(
      '/market/snapshot/landing',
      (d) =>
        (d.topAssets?.stocks?.length ?? 0) > 0 ||
        (d.gainers?.stocks?.length ?? 0) > 0 ||
        (d.quotes?.results?.length ?? 0) > 0
    )
    return rememberSnapshot('landing', data)
  },
  ['market-snapshot-landing-v1'],
  { revalidate: QUOTE_REVALIDATE_SECONDS }
)

const getCachedTerminalSnapshot = unstable_cache(
  async (): Promise<TerminalMarketSnapshot> => {
    const data = await marketGetFresh<TerminalMarketSnapshot>(
      '/market/snapshot/terminal',
      (d) => (d.quotes?.results?.length ?? 0) > 0 || (d.marketStatus?.indices?.length ?? 0) > 0
    )
    return rememberSnapshot('terminal', data)
  },
  ['market-snapshot-terminal-v1'],
  { revalidate: QUOTE_REVALIDATE_SECONDS }
)

export async function getMarketRadarData(
  ticker: string = 'PETR4'
): Promise<MarketRadarData | null> {
  try {
    const data = await marketGet<MarketRadarData>(
      `/market/radar/${encodeURIComponent(ticker)}`,
      { profileFallback: 1 },
      QUOTE_REVALIDATE_SECONDS
    )
    return data?.data?.length || data?.profile || data?.quote ? data : null
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

export async function getMarketPulseSnapshot(): Promise<MarketPulseSnapshot> {
  try {
    return await getCachedPulseSnapshot()
  } catch (error) {
    console.warn('Exception while fetching market pulse snapshot:', error)
    return recallSnapshot('pulse', emptyPulseSnapshot())
  }
}

export async function getHomeHighlightsSnapshot(): Promise<HomeHighlightsSnapshot> {
  try {
    return await getCachedHomeHighlightsSnapshot()
  } catch (error) {
    console.warn('Exception while fetching home highlights snapshot:', error)
    return recallSnapshot('home-highlights', emptyHighlightsSnapshot())
  }
}

export async function getLandingMarketSnapshot(): Promise<LandingMarketSnapshot> {
  try {
    return await getCachedLandingSnapshot()
  } catch (error) {
    console.warn('Exception while fetching landing market snapshot:', error)
    return recallSnapshot('landing', {
      topAssets: emptyListings(),
      gainers: emptyListings(),
      losers: emptyListings(),
      mostTraded: emptyListings(),
      quotes: { results: [] },
      currency: { currencies: [] },
    })
  }
}

export async function getTerminalMarketSnapshot(): Promise<TerminalMarketSnapshot> {
  try {
    return await getCachedTerminalSnapshot()
  } catch (error) {
    console.warn('Exception while fetching terminal market snapshot:', error)
    return recallSnapshot('terminal', {
      quotes: { results: [] },
      marketStatus: { indices: [] },
      currency: { currencies: [] },
    })
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
  const symbols = normalizeQuoteBatch(tickers)
  if (symbols.length === 0) return { results: [], error: 'No tickers provided.' }

  try {
    return await getCachedMultipleQuotes(symbols.join(','))
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
