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
import {
  getDbCurrencies,
  getDbHistory,
  getDbIndicators,
  getDbListings,
  getDbQuotes,
  getDbRadar,
  getDbStatus,
  searchDbAssets,
} from './reads'

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

// News is AI Service domain (D2) — the only reads still served over HTTP.
const NEWS_API_URL = ANALYSIS_API_URL
const NEWS_FETCH_TIMEOUT_MS = 5500
const QUOTE_REVALIDATE_SECONDS = 300

const HOME_TREEMAP_TICKERS = [
  'VALE3', 'PETR4', 'ITUB4', 'PETR3', 'AXIA3', 'BBDC4', 'SBSP3', 'B3SA3',
  'ITSA4', 'ABEV3', 'BPAC11', 'WEGE3', 'BBAS3', 'PRIO3', 'GGBR4', 'EMBJ3',
  'EQTL3', 'ENEVE3', 'CPLE3', 'RENT3', 'VBBR3', 'RDOR3', 'UGPA3',
]
const TERMINAL_DEFAULT_TICKERS = ['PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'TAEE11', 'MXRF11']

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

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise
  } catch {
    return fallback
  }
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
    const data = await getDbQuotes(symbols)
    if (symbols.length > 0 && data.results.length === 0) {
      throw new Error(`Market reads returned an empty quote batch for ${symbolsKey}`)
    }
    return data
  },
  ['market-quotes-batch-v3'],
  { revalidate: QUOTE_REVALIDATE_SECONDS }
)

// ── Snapshot resilience ────────────────────────────────────────────────────────
// Snapshot aggregates back the home/landing/terminal screens. A transiently cold
// cache (e.g. right after deploy, before the first cron run) must never be pinned
// into Next's Data Cache: compositions throw on fully-empty payloads so nothing
// empty is cached, and the last good snapshot kept in memory is served instead.
const lastGoodSnapshot = new Map<string, unknown>()

function rememberSnapshot<T>(key: string, data: T): T {
  lastGoodSnapshot.set(key, data)
  return data
}

function recallSnapshot<T>(key: string, fallback: T): T {
  return (lastGoodSnapshot.get(key) as T | undefined) ?? fallback
}

function requireSnapshot(hasData: boolean): void {
  if (!hasData) {
    throw new Error('Dados de mercado temporariamente indisponíveis.')
  }
}

const getCachedPulseSnapshot = unstable_cache(
  async (): Promise<MarketPulseSnapshot> => {
    const [quotes, history, indicators, currency] = await Promise.all([
      safe(getDbQuotes(['^BVSP', '^GSPC', '^VIX']), { results: [] }),
      safe(getDbHistory(['^BVSP', '^GSPC', '^VIX', 'USD-BRL'], '1mo'), { results: [] }),
      safe(getDbIndicators(), { selic: [], inflation: [], updatedAt: null, isStale: true }),
      safe(getDbCurrencies(['USD-BRL']), { currencies: [] }),
    ])
    requireSnapshot(quotes.results.length > 0 || history.results.length > 0)
    const data = {
      quotes,
      history,
      indicators,
      currency,
      updatedAt: new Date().toISOString(),
    } as unknown as MarketPulseSnapshot
    return rememberSnapshot('pulse', data)
  },
  ['market-snapshot-pulse-v2'],
  { revalidate: QUOTE_REVALIDATE_SECONDS }
)

const getCachedHomeHighlightsSnapshot = unstable_cache(
  async (): Promise<HomeHighlightsSnapshot> => {
    const [gainers, losers, mostTraded, crypto, fixedIncome, treemapQuotes] = await Promise.all([
      safe(getDbListings({ limit: 6, sortBy: 'change', sortOrder: 'desc', type: 'stock' }), emptyListings()),
      safe(getDbListings({ limit: 6, sortBy: 'change', sortOrder: 'asc', type: 'stock' }), emptyListings()),
      safe(getDbListings({ limit: 6, sortBy: 'volume', sortOrder: 'desc', type: 'stock' }), emptyListings()),
      safe(getDbListings({ limit: 6, type: 'crypto' }), emptyListings()),
      safe(getDbListings({ limit: 6, type: 'fixed_income' }), emptyListings()),
      safe(getDbQuotes(HOME_TREEMAP_TICKERS), { results: [] }),
    ])
    requireSnapshot(
      gainers.stocks.length > 0 ||
        losers.stocks.length > 0 ||
        mostTraded.stocks.length > 0 ||
        treemapQuotes.results.length > 0
    )
    const data = {
      gainers,
      losers,
      mostTraded,
      crypto,
      fixedIncome,
      treemapQuotes,
      updatedAt: new Date().toISOString(),
    } as unknown as HomeHighlightsSnapshot
    return rememberSnapshot('home-highlights', data)
  },
  ['market-snapshot-home-highlights-v2'],
  { revalidate: QUOTE_REVALIDATE_SECONDS }
)

const getCachedLandingSnapshot = unstable_cache(
  async (): Promise<LandingMarketSnapshot> => {
    const [topAssets, gainers, losers, mostTraded, quotes, currency] = await Promise.all([
      safe(getDbListings({ limit: 25, sortBy: 'market_cap_basic', sortOrder: 'desc', type: 'stock' }), emptyListings()),
      safe(getDbListings({ limit: 5, sortBy: 'change', sortOrder: 'desc', type: 'stock' }), emptyListings()),
      safe(getDbListings({ limit: 5, sortBy: 'change', sortOrder: 'asc', type: 'stock' }), emptyListings()),
      safe(getDbListings({ limit: 5, sortBy: 'volume', sortOrder: 'desc', type: 'stock' }), emptyListings()),
      safe(getDbQuotes(['^BVSP', '^VIX']), { results: [] }),
      safe(getDbCurrencies(['USD-BRL']), { currencies: [] }),
    ])
    requireSnapshot(topAssets.stocks.length > 0 || gainers.stocks.length > 0 || quotes.results.length > 0)
    const data = {
      topAssets,
      gainers,
      losers,
      mostTraded,
      quotes,
      currency,
      updatedAt: new Date().toISOString(),
    } as unknown as LandingMarketSnapshot
    return rememberSnapshot('landing', data)
  },
  ['market-snapshot-landing-v2'],
  { revalidate: QUOTE_REVALIDATE_SECONDS }
)

const getCachedTerminalSnapshot = unstable_cache(
  async (): Promise<TerminalMarketSnapshot> => {
    const [quotes, marketStatus, currency] = await Promise.all([
      safe(getDbQuotes(TERMINAL_DEFAULT_TICKERS), { results: [] }),
      safe(getDbStatus(), { indices: [] }),
      safe(getDbCurrencies(['USD-BRL']), { currencies: [] }),
    ])
    requireSnapshot(quotes.results.length > 0 || marketStatus.indices.length > 0)
    const data = {
      quotes,
      marketStatus,
      currency,
      updatedAt: new Date().toISOString(),
    } as unknown as TerminalMarketSnapshot
    return rememberSnapshot('terminal', data)
  },
  ['market-snapshot-terminal-v2'],
  { revalidate: QUOTE_REVALIDATE_SECONDS }
)

export async function getMarketRadarData(
  ticker: string = 'PETR4'
): Promise<MarketRadarData | null> {
  try {
    return await getDbRadar(ticker)
  } catch (error) {
    console.warn('Exception while fetching market radar data:', error)
    return null
  }
}

export async function getMarketListings(
  params: MarketListingsParams = {}
): Promise<MarketListingsData | null> {
  try {
    return await getDbListings({
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      type: params.type,
      search: params.search ?? params.sector,
    })
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

// Treasury data came from an unlicensed scraper — removed with yfinance (D3).
// Served as unavailable until a licensed source is contracted; never fabricated.
export async function getTreasuryBonds(): Promise<{ data: TreasuryBond[] } | null> {
  return null
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
    return await getDbIndicators()
  } catch (error) {
    console.warn('Exception while fetching macro indicators:', error)
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
    return await searchDbAssets(query, limit, page)
  } catch (error) {
    console.warn('Exception while searching market assets:', error)
    return { ...emptySearch(limit), error: 'Falha ao buscar ativos reais.' }
  }
}

export async function getMarketStatus(): Promise<MarketStatusData & { error?: string }> {
  try {
    return await getDbStatus()
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
    return (await getDbHistory(tickers, range)) as unknown as AssetHistoryData
  } catch (error) {
    console.warn('Exception while fetching asset history:', error)
    return { results: [], error: 'Falha ao buscar histórico real do ativo.' }
  }
}

async function newsGet<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  revalidate: number
): Promise<T> {
  const url = new URL(`${NEWS_API_URL}${path}`)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value))
  })
  const response = await fetch(url, {
    headers: internalApiHeaders(),
    next: { revalidate },
    signal: AbortSignal.timeout(NEWS_FETCH_TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`News API returned ${response.status}`)
  }
  return (await response.json()) as T
}

export async function getAssetNews(
  ticker: string,
  newsCount: number = 3
): Promise<AssetNewsItem[]> {
  try {
    return await newsGet<AssetNewsItem[]>(`/market/news/${encodeURIComponent(ticker)}`, {
      count: newsCount,
    }, 3600)
  } catch {
    return []
  }
}

export async function getLatestNews(count: number = 12): Promise<AssetNewsItem[]> {
  try {
    return await newsGet<AssetNewsItem[]>('/market/news', { count }, 600)
  } catch (err) {
    console.warn('Exception while fetching latest news:', err)
    return []
  }
}

export async function getCurrencyRates(
  pairs: string[] = ['USD-BRL', 'EUR-BRL', 'GBP-BRL']
): Promise<CurrencyData> {
  try {
    return await getDbCurrencies(pairs)
  } catch (err) {
    console.warn('Exception while fetching currency rates:', err)
    return { currencies: [], error: 'Falha ao buscar câmbio real.' } as CurrencyData
  }
}
