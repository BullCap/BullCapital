import Brapi from 'brapi'
import {
  AssetNewsItem,
  AssetQuote,
  AssetSearchData,
  AssetSearchResult,
  AssetHistoryData,
  AssetHistoryResult,
  CurrencyData,
  CurrencyRate,
  InflationEntry,
  MarketIndicatorsData,
  MarketListingsData,
  MarketRadarData,
  MarketStatusData,
  MarketStatusIndex,
  MarketSummaryProfile,
  PrimeRateEntry,
} from '../../types/market'

/**
 * Fetches market intelligence data for the radar chart based on the Brazilian stock market using the official Brapi SDK.
 */
export async function getMarketRadarData(
  ticker: string = 'PETR4'
): Promise<MarketRadarData | null> {
  const apiKey = process.env.BRAPI_KEY

  if (!apiKey) {
    console.warn('BRAPI_KEY is not defined in the environment variables.')
    return null
  }

  try {
    const client = new Brapi({
      apiKey: apiKey,
    })

    // We request the quote along with modules available on the free tier.
    // As seen in the API response, fundamental and dividends might be restricted on certain keys.
    const quoteData = await client.quote.retrieve(ticker, {
      modules: ['financialData', 'summaryProfile'],
    })

    if (!quoteData || !quoteData.results || quoteData.results.length === 0) {
      console.warn('No results found for ticker:', ticker)
      return null
    }

    const result = quoteData.results[0]

    // Fallback variable bindings
    const currentPrice = result.regularMarketPrice || 0

    // --- Normalization Logic ---
    // We normalize real-world metrics into a 0-100 scale for the radar chart.

    // 1. Valuation (Based on Price-to-Earnings - P/E)
    // Lower P/E often means better value. Let's say P/E of 5 is 100 (great value), P/E > 25 is 0.
    const pe = result.priceEarnings || 15
    let valuationScore = 100 - ((pe - 5) / (25 - 5)) * 100
    valuationScore = Math.max(0, Math.min(100, valuationScore))

    // 2. Momentum (Based on regularMarketChangePercent)
    // -5% or worse = 0, +5% or better = 100
    const change = result.regularMarketChangePercent || 0
    let momentumScore = ((change - -5) / (5 - -5)) * 100
    momentumScore = Math.max(0, Math.min(100, momentumScore))

    // 3. Liquidez (Based on regularMarketVolume)
    // Volume of 1M = 0 (low for IBOV), Volume of 50M+ = 100 (high)
    const volume = result.regularMarketVolume || 0
    let liquidityScore = ((volume - 1_000_000) / (50_000_000 - 1_000_000)) * 100
    liquidityScore = Math.max(0, Math.min(100, liquidityScore))

    // 4. Trend (Based on current price vs 52-week high/low)
    // Closer to 52-week high means stronger trend.
    const high52 = result.fiftyTwoWeekHigh || currentPrice
    const low52 = result.fiftyTwoWeekLow || currentPrice
    let trendScore = 50
    if (high52 > low52) {
      trendScore = ((currentPrice - low52) / (high52 - low52)) * 100
    }
    trendScore = Math.max(0, Math.min(100, trendScore))

    // 5. Margin / Rentability
    // Since 'dividends' isn't available, let's use financialData (e.g. Return on Equity or Profit Margins)
    const financialData =
      (result as unknown as { financialData?: { operatingMargins?: number } })?.financialData || {}
    // Let's use Operating Margin if available. If not, use generic default.
    // E.g., 0% margin = 0, 30% margin = 100
    const operatingMargin = financialData.operatingMargins || 0.15 // fallback 15%
    let marginScore = (operatingMargin / 0.3) * 100
    marginScore = Math.max(0, Math.min(100, marginScore))

    // Extract summaryProfile if available
    const summaryProfile = (result as unknown as { summaryProfile?: MarketSummaryProfile })
      ?.summaryProfile

    const radarData: MarketRadarData = {
      timestamp: new Date().toISOString(),
      ticker: result.symbol,
      data: [
        { metric: 'Rentabilidade', value: Math.round(marginScore), fullMark: 100 },
        { metric: 'Momentum', value: Math.round(momentumScore), fullMark: 100 },
        { metric: 'Liquidez', value: Math.round(liquidityScore), fullMark: 100 },
        { metric: 'Valuation', value: Math.round(valuationScore), fullMark: 100 },
        { metric: 'Tendência', value: Math.round(trendScore), fullMark: 100 },
      ],
      profile: summaryProfile
        ? {
            longBusinessSummary: summaryProfile.longBusinessSummary,
            sector: summaryProfile.sector,
            industry: summaryProfile.industry,
            website: summaryProfile.website,
            fullTimeEmployees: summaryProfile.fullTimeEmployees,
          }
        : undefined,
      quote: {
        regularMarketPrice: currentPrice,
        regularMarketChangePercent: change,
        fiftyTwoWeekHigh: high52,
        fiftyTwoWeekLow: low52,
        marketCap: (result as unknown as { marketCap?: number })?.marketCap,
        longName: (result as unknown as { longName?: string })?.longName,
      },
    }

    return radarData
  } catch (error) {
    console.warn('Exception while fetching Brapi data:', error)
    return null
  }
}

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

const LISTINGS_REVALIDATE = 3600 // 1 hour

export async function getMarketListings(
  params: MarketListingsParams = {}
): Promise<MarketListingsData | null> {
  const apiKey = process.env.BRAPI_KEY

  if (!apiKey) {
    console.warn('BRAPI_KEY is not defined in the environment variables.')
    return null
  }

  try {
    const urlParams = new URLSearchParams()

    urlParams.append('token', apiKey)
    if (params.page) urlParams.append('page', params.page.toString())
    if (params.limit) urlParams.append('limit', params.limit.toString())
    if (params.sortBy) urlParams.append('sortBy', params.sortBy)
    if (params.sortOrder) urlParams.append('sortOrder', params.sortOrder)
    if (params.sector) urlParams.append('sector', params.sector)
    if (params.search) urlParams.append('search', params.search)

    // The BRAPI API has a data inconsistency: BDR items are stored with type "dr"
    // but the filter parameter expects "bdr". Filtering by type=bdr returns empty.
    // Workaround: skip the type filter for BDRs, fetch unfiltered, and filter client-side.
    const isBdrFilter = params.type === 'bdr'

    if (params.type && !isBdrFilter) {
      urlParams.append('type', params.type)
    }

    if (isBdrFilter) {
      urlParams.set('limit', '100')
      urlParams.set('page', '1')
    }

    const url = `https://brapi.dev/api/quote/list?${urlParams.toString()}`

    const response = await fetch(url, {
      next: { revalidate: LISTINGS_REVALIDATE },
    })

    if (!response.ok) {
      console.warn(`Brapi listing API error (${response.status})`)
      return null
    }

    const data = await response.json()

    function normalizeType(raw: string | undefined): string {
      if (raw === 'fund') return 'fund'
      if (raw === 'bdr' || raw === 'dr') return 'bdr'
      if (raw === 'etf') return 'etf'
      return 'stock'
    }

    let stocks = (data.stocks ?? []).map((s: Record<string, unknown>) => ({
      stock: (s.stock as string) ?? '',
      name: (s.name as string) ?? '',
      close: (s.close as number) ?? 0,
      change: (s.change as number) ?? 0,
      volume: (s.volume as number) ?? 0,
      marketCap: (s.market_cap as number) ?? null,
      logo: (s.logo as string) ?? null,
      sector: (s.sector as string) ?? null,
      type: normalizeType(s.type as string),
    }))

    // Client-side filtering for BDRs since the API filter is broken
    if (isBdrFilter) {
      stocks = stocks.filter((s: Record<string, unknown>) => s.type === 'bdr')
    }

    const totalCount = isBdrFilter ? stocks.length : (data.totalCount ?? 0)
    const pageSize = params.limit ?? 20

    // Client-side pagination for BDRs
    if (isBdrFilter) {
      const start = ((params.page ?? 1) - 1) * pageSize
      const totalPages = Math.max(1, Math.ceil(stocks.length / pageSize))
      const paginatedStocks = stocks.slice(start, start + pageSize)
      return {
        stocks: paginatedStocks,
        indexes: (data.indexes ?? []).map((i: Record<string, unknown>) => ({
          stock: (i.stock as string) ?? '',
          name: (i.name as string) ?? '',
        })),
        currentPage: params.page ?? 1,
        totalPages,
        totalCount,
        hasNextPage: (params.page ?? 1) < totalPages,
      }
    }

    const indexes = (data.indexes ?? []).map((i: Record<string, unknown>) => ({
      stock: (i.stock as string) ?? '',
      name: (i.name as string) ?? '',
    }))

    return {
      stocks,
      indexes,
      currentPage: data.currentPage ?? 1,
      totalPages: data.totalPages ?? 1,
      totalCount: data.totalCount ?? 0,
      hasNextPage: data.hasNextPage ?? false,
    }
  } catch (error) {
    console.warn('Exception while fetching market listings:', error)
    return null
  }
}

/**
 * Fetches quotes for multiple tickers using native fetch to leverage Next.js Data Cache.
 * Uses the brapi.dev REST API directly instead of the SDK to enable `next: { revalidate }`.
 */
export async function getMultipleQuotes(
  tickers: string[]
): Promise<{ results: AssetQuote[]; error?: string }> {
  const apiKey = process.env.BRAPI_KEY

  if (!apiKey) {
    return { results: [], error: 'BRAPI_KEY is not defined in the environment variables.' }
  }

  if (tickers.length === 0) {
    return { results: [], error: 'No tickers provided.' }
  }

  const tickerList = tickers.join(',')
  const url = `https://brapi.dev/api/quote/${tickerList}?token=${apiKey}`

  try {
    const response = await fetch(url, {
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.warn(`Brapi API error (${response.status}):`, errorBody)
      return { results: [], error: `Brapi API returned status ${response.status}.` }
    }

    const data = await response.json()

    if (!data.results || !Array.isArray(data.results)) {
      return { results: [], error: 'Invalid response format from Brapi API.' }
    }

    const results: AssetQuote[] = data.results.map((item: Record<string, unknown>) => ({
      symbol: (item.symbol as string) ?? '',
      shortName: (item.shortName as string) ?? '',
      regularMarketPrice: (item.regularMarketPrice as number) ?? 0,
      regularMarketChangePercent: (item.regularMarketChangePercent as number) ?? 0,
      regularMarketVolume: (item.regularMarketVolume as number) ?? 0,
      marketCap: (item.marketCap as number) ?? 0,
      logourl: (item.logourl as string) ?? '',
    }))

    return { results }
  } catch (error) {
    console.warn('Exception while fetching quotes from Brapi:', error)
    return { results: [], error: 'Failed to fetch quotes from Brapi API.' }
  }
}

const INDICATORS_REVALIDATE = 86400 // 24 hours

/**
 * Fetches SELIC (prime-rate) and IPCA (inflation) data using native fetch
 * to leverage Next.js Data Cache with a 24h TTL.
 */
export async function getMarketIndicators(): Promise<MarketIndicatorsData & { error?: string }> {
  const apiKey = process.env.BRAPI_KEY

  if (!apiKey) {
    return {
      selic: [],
      inflation: [],
      error: 'BRAPI_KEY is not defined in the environment variables.',
    }
  }

  const selicUrl = `https://brapi.dev/api/v2/prime-rate?country=brazil&sortBy=date&sortOrder=desc&token=${apiKey}`
  const inflationUrl = `https://brapi.dev/api/v2/inflation?country=brazil&sortBy=date&sortOrder=desc&token=${apiKey}`

  try {
    const [selicResponse, inflationResponse] = await Promise.all([
      fetch(selicUrl, { next: { revalidate: INDICATORS_REVALIDATE } }),
      fetch(inflationUrl, { next: { revalidate: INDICATORS_REVALIDATE } }),
    ])

    if (!selicResponse.ok || !inflationResponse.ok) {
      const failedEndpoints: string[] = []
      if (!selicResponse.ok) failedEndpoints.push(`prime-rate (${selicResponse.status})`)
      if (!inflationResponse.ok) failedEndpoints.push(`inflation (${inflationResponse.status})`)
      console.warn('Brapi API error for:', failedEndpoints.join(', '))
      return {
        selic: [],
        inflation: [],
        error: `Brapi API returned errors for: ${failedEndpoints.join(', ')}.`,
      }
    }

    const selicData = await selicResponse.json()
    const inflationData = await inflationResponse.json()

    const selic: PrimeRateEntry[] = (selicData['prime-rate'] ?? []).map(
      (item: Record<string, unknown>) => ({
        date: (item.date as string) ?? '',
        value: (item.value as string) ?? '',
        epochDate: (item.epochDate as number) ?? 0,
      })
    )

    const inflation: InflationEntry[] = (inflationData.inflation ?? []).map(
      (item: Record<string, unknown>) => ({
        date: (item.date as string) ?? '',
        value: (item.value as string) ?? '',
        epochDate: (item.epochDate as number) ?? 0,
      })
    )

    return { selic, inflation }
  } catch (error) {
    console.warn('Exception while fetching market indicators from Brapi:', error)
    return { selic: [], inflation: [], error: 'Failed to fetch market indicators from Brapi API.' }
  }
}

const SEARCH_REVALIDATE = 86400 // 24 hours

/**
 * Searches assets by ticker/name using native fetch to leverage Next.js Data Cache.
 * Returns only basic fields for search suggestions: symbol, name, logo, type, sector.
 */
export async function searchAssets(
  query: string,
  limit: number = 10,
  page: number = 1
): Promise<AssetSearchData & { error?: string }> {
  const apiKey = process.env.BRAPI_KEY
  const empty: AssetSearchData = {
    results: [],
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: limit,
    totalCount: 0,
    hasNextPage: false,
  }

  if (!apiKey) {
    return { ...empty, error: 'BRAPI_KEY is not defined in the environment variables.' }
  }

  const url = `https://brapi.dev/api/quote/list?search=${encodeURIComponent(query)}&limit=${limit}&page=${page}&sortBy=name&sortOrder=asc&token=${apiKey}`

  try {
    const response = await fetch(url, {
      next: { revalidate: SEARCH_REVALIDATE },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.warn(`Brapi search API error (${response.status}):`, errorBody)
      return { ...empty, error: `Brapi API returned status ${response.status}.` }
    }

    const data = await response.json()

    function normalizeType(raw: string | undefined): 'stock' | 'fund' | 'bdr' {
      if (raw === 'fund') return 'fund'
      if (raw === 'bdr' || raw === 'dr') return 'bdr'
      return 'stock'
    }

    const results: AssetSearchResult[] = (data.stocks ?? []).map(
      (item: Record<string, unknown>) => ({
        symbol: (item.stock as string) ?? '',
        name: (item.name as string) ?? '',
        logo: (item.logo as string) ?? null,
        type: normalizeType(item.type as string | undefined),
        sector: (item.sector as string) ?? null,
      })
    )

    return {
      results,
      currentPage: (data.currentPage as number) ?? 1,
      totalPages: (data.totalPages as number) ?? 1,
      itemsPerPage: (data.itemsPerPage as number) ?? limit,
      totalCount: (data.totalCount as number) ?? 0,
      hasNextPage: (data.hasNextPage as boolean) ?? false,
    }
  } catch (error) {
    console.warn('Exception while searching assets from Brapi:', error)
    return { ...empty, error: 'Failed to search assets from Brapi API.' }
  }
}

const STATUS_REVALIDATE = 300 // 5 minutes

/**
 * Fetches the status of major market indices (IBOVESPA, S&P 500, VIX, VXBR).
 * Utilizes Next.js Data Cache with a 5-minute TTL.
 * Falls back to Yahoo Finance if Brapi fails or misses some tickers.
 */
export async function getMarketStatus(): Promise<MarketStatusData & { error?: string }> {
  const apiKey = process.env.BRAPI_KEY
  const requiredTickers = ['^BVSP', '^GSPC', '^VIX', '^VXBR']
  const indices: MarketStatusIndex[] = []
  let missingTickers: string[] = [...requiredTickers]

  if (apiKey) {
    const defaultTickersList = requiredTickers.join(',')
    const brapiUrl = `https://brapi.dev/api/quote/${defaultTickersList}?token=${apiKey}`
    try {
      const response = await fetch(brapiUrl, { next: { revalidate: STATUS_REVALIDATE } })
      if (response.ok) {
        const data = await response.json()
        const results = data.results || []
        for (const item of results) {
          const symbol = item.symbol
          if (requiredTickers.includes(symbol)) {
            indices.push({
              name: item.shortName || item.longName || symbol,
              symbol: symbol,
              regularMarketPrice: item.regularMarketPrice || 0,
              regularMarketChangePercent: item.regularMarketChangePercent || 0,
            })
            // Remove from missing
            missingTickers = missingTickers.filter((t) => t !== symbol)
          }
        }
      }
    } catch (err) {
      console.warn('Brapi market status error:', err)
    }
  }

  // Fallback to Yahoo Finance for missing tickers
  if (missingTickers.length > 0) {
    const yahooUrl = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${missingTickers.join(',')}`
    try {
      const response = await fetch(yahooUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
        next: { revalidate: STATUS_REVALIDATE },
      })
      if (response.ok) {
        const data = await response.json()
        const results = data.quoteResponse?.result || []
        for (const item of results) {
          indices.push({
            name: item.shortName || item.longName || item.symbol,
            symbol: item.symbol,
            regularMarketPrice: item.regularMarketPrice || 0,
            regularMarketChangePercent: item.regularMarketChangePercent || 0,
          })
        }
      }
    } catch (err) {
      console.warn('Yahoo fallback error:', err)
    }
  }

  // Format names nicely if they exist
  const nameMap: Record<string, string> = {
    '^BVSP': 'Ibovespa',
    '^GSPC': 'S&P 500',
    '^VIX': 'VIX',
    '^VXBR': 'VXBR',
  }

  const formattedIndices = indices.map((idx) => ({
    ...idx,
    name: nameMap[idx.symbol] || idx.name,
  }))

  return { indices: formattedIndices }
}

/**
 * Maps a given time range string to an appropriate data interval.
 */
function getIntervalForRange(range: string): string {
  switch (range) {
    case '1d':
      return '5m'
    case '5d':
      return '15m'
    case '1mo':
      return '1d'
    case '3mo':
      return '1d'
    case '6mo':
      return '1d'
    case '1y':
      return '1d'
    case '2y':
      return '1wk'
    case '5y':
      return '1mo'
    case '10y':
      return '1mo'
    case 'ytd':
      return '1d'
    case 'max':
      return '1mo'
    default:
      return '1d'
  }
}

/**
 * Fetches historical price data for one or more tickers.
 * Uses a short cache (5 min) for 1d range, and a long cache (24h) for larger ranges.
 */
export async function getAssetHistory(
  tickers: string[],
  range: string = '1mo'
): Promise<AssetHistoryData> {
  const apiKey = process.env.BRAPI_KEY

  if (!apiKey) {
    return { results: [], error: 'BRAPI_KEY is not defined in the environment variables.' }
  }

  if (!tickers || tickers.length === 0) {
    return { results: [], error: 'No tickers provided.' }
  }

  const interval = getIntervalForRange(range)

  // Cache strategy: short TTL for volatile/current day, long TTL for historical data
  const revalidateTTL = range === '1d' ? 300 : 86400 // 5 minutes vs 24 hours

  const defaultTickersList = tickers.join(',')
  const urlParams = new URLSearchParams({
    range,
    interval,
    token: apiKey,
    fundamental: 'false',
    dividends: 'false',
  })

  const url = `https://brapi.dev/api/quote/${defaultTickersList}?${urlParams.toString()}`

  try {
    const response = await fetch(url, {
      next: { revalidate: revalidateTTL },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.warn(`Brapi history API error (${response.status}):`, errorBody)
      return { results: [], error: `Brapi API returned status ${response.status}.` }
    }

    const data = await response.json()
    const rawResults = data.results || []

    const results: AssetHistoryResult[] = rawResults.map((item: Record<string, unknown>) => {
      const symbol = (item.symbol as string) ?? ''
      const historicalDataPrice = (item.historicalDataPrice as Record<string, unknown>[]) ?? []

      const history = historicalDataPrice
        .map((point) => ({
          timestamp: (point.date as number) ?? 0,
          close: (point.close as number) ?? 0,
        }))
        // Filter out data points with missing values where needed
        .filter((point) => point.timestamp > 0 && point.close > 0)

      return {
        symbol,
        history,
      }
    })

    return { results }
  } catch (err) {
    console.warn('Exception while fetching asset history:', err)
    return { results: [], error: 'Failed to fetch asset history from Brapi API.' }
  }
}

const NEWS_REVALIDATE = 900 // 15 minutes

/**
 * Fetches recent news for a ticker via Yahoo Finance.
 * B3 stocks require the .SA suffix (e.g. PETR4.SA). Indices (^BVSP) are used as-is.
 */
export async function getAssetNews(
  ticker: string,
  newsCount: number = 3
): Promise<AssetNewsItem[]> {
  const yahooTicker = ticker.startsWith('^') ? ticker : `${ticker}.SA`
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(yahooTicker)}&newsCount=${newsCount}&quotesCount=0`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      next: { revalidate: NEWS_REVALIDATE },
    })
    if (!response.ok) return []
    const data = await response.json()
    return ((data.news ?? []) as Record<string, unknown>[]).slice(0, newsCount).map((item) => ({
      title: (item.title as string) ?? '',
      publisher: (item.publisher as string) ?? '',
      link: (item.link as string) ?? '',
      publishedAt: (item.providerPublishTime as number) ?? 0,
    }))
  } catch {
    return []
  }
}

const CURRENCY_REVALIDATE = 900 // 15 minutes

/**
 * Fetches real-time currency exchange rates for specified pairs.
 * Utilizes Next.js Data Cache with a 15-minute TTL.
 */
export async function getCurrencyRates(
  pairs: string[] = ['USD-BRL', 'EUR-BRL', 'GBP-BRL']
): Promise<CurrencyData> {
  const apiKey = process.env.BRAPI_KEY

  if (!apiKey) {
    return { currencies: [], error: 'BRAPI_KEY is not defined in the environment variables.' }
  }

  const currencyParam = pairs.join(',')
  const url = `https://brapi.dev/api/v2/currency?currency=${currencyParam}&token=${apiKey}`

  try {
    const response = await fetch(url, {
      next: { revalidate: CURRENCY_REVALIDATE },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.warn(`Brapi currency API error (${response.status}):`, errorBody)
      return { currencies: [], error: `Brapi API returned status ${response.status}.` }
    }

    const data = await response.json()
    const rawCurrencies = data.currency || []

    const currencies: CurrencyRate[] = rawCurrencies.map((item: Record<string, unknown>) => ({
      fromCurrency: (item.fromCurrency as string) ?? '',
      toCurrency: (item.toCurrency as string) ?? '',
      name: (item.name as string) ?? '',
      bidPrice: Number(item.bidPrice) ?? 0,
      askPrice: Number(item.askPrice) ?? 0,
      highPrice: Number(item.highPrice) ?? 0,
      lowPrice: Number(item.lowPrice) ?? 0,
      updatedAtTimestamp: Number(item.updatedAtTimestamp) ?? 0,
    }))

    return { currencies }
  } catch (err) {
    console.warn('Exception while fetching currency rates:', err)
    return { currencies: [], error: 'Failed to fetch currency rates from Brapi API.' }
  }
}
