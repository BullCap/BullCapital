// DB-first read path of the market module — TS port of market_db.py reads.
// Serverless-aware: reads are plain SELECTs labeled with staleness; freshness
// is the cron's job (EOD-first, plan §6.2). The only synchronous Brapi calls
// happen on a true cache miss for explicitly requested symbols (no data to
// serve at all). No yfinance (D3): crypto/treasury symbols are skipped and
// surface as degraded-but-honest empty results, never fabricated numbers.
import { prisma } from '@/lib/db'
import { Prisma } from '@/generated/prisma/client'
import type {
  AssetQuote,
  AssetSearchData,
  CurrencyData,
  MarketIndicatorsData,
  MarketListingsData,
  MarketRadarData,
  MarketStatusData,
} from '@/types/market'
import { fetchBrapiQuotesBatch, fetchBrapiHistory } from '../ingest/brapi'
import { ingestMacroIndicators, ingestPtaxDollar } from '../ingest/bcb'
import { upsertQuoteRecord, upsertHistory } from './ingest-db'
import { isB3Session } from '../ingest/universe'

const QUOTE_TTL_MARKET_SECONDS = 300
const QUOTE_TTL_CLOSED_SECONDS = 3600

export const INDEX_NAMES: Record<string, string> = {
  '^BVSP': 'Ibovespa',
  '^GSPC': 'S&P 500',
  '^VIX': 'VIX',
}

const HISTORY_LIMITS: Record<string, number> = {
  '1d': 2, '5d': 8, '1mo': 32, '3mo': 90, '6mo': 186, '1y': 260,
  '2y': 520, '3y': 780, '5y': 1300, '10y': 2600, '15y': 3900, '16y': 4160, max: 6000,
}

const CRYPTO_SUFFIXES = ['-USD', '-BRL']
const CRYPTO_COINS = new Set(['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE'])

function cleanSymbol(symbol: string): string {
  const cleaned = symbol.trim().toUpperCase()
  return cleaned.endsWith('.SA') ? cleaned.slice(0, -3) : cleaned
}

function appSymbol(symbol: string): string {
  const cleaned = symbol.trim().toUpperCase()
  if (cleaned === 'BRL=X') return 'USD-BRL'
  if (cleaned.endsWith('BRL=X')) return `${cleaned.slice(0, -5)}-BRL`
  if (cleaned.endsWith('.SA')) return cleaned.slice(0, -3)
  return cleaned
}

/** Symbols the DB cache does not cover post-yfinance (D3): crypto and treasury. */
function isUnservedSymbol(clean: string): boolean {
  if (clean.startsWith('TESOURO_')) return true
  const base = clean.split('-')[0]
  return CRYPTO_SUFFIXES.some((s) => clean.endsWith(s)) && CRYPTO_COINS.has(base)
}

function quoteIsStale(updatedAt: Date | null): boolean {
  if (!updatedAt) return true
  const ttl = isB3Session() ? QUOTE_TTL_MARKET_SECONDS : QUOTE_TTL_CLOSED_SECONDS
  return (Date.now() - updatedAt.getTime()) / 1000 > ttl
}

interface QuoteRow {
  ticker: string
  name: string | null
  price: number | null
  change_percent: number | null
  volume: number | null
  market_cap: number | null
  high_52w: number | null
  low_52w: number | null
  pe_ratio: number | null
  dividend_yield: number | null
  ev_ebitda: number | null
  roe: number | null
  roic: number | null
  p_vp: number | null
  sector: string | null
  industry: string | null
  business_summary: string | null
  updated_at: Date | null
}

/** Provenance fields carried by every quote served from the DB (plan §6.3). */
export interface QuoteEnvelope {
  updatedAt: string | null
  isStale: boolean
}

export type DbAssetQuote = AssetQuote &
  QuoteEnvelope & {
    longBusinessSummary?: string | null
    industry?: string | null
    fiftyTwoWeekHigh?: number
    fiftyTwoWeekLow?: number
  }

function rowToQuote(row: QuoteRow, symbol: string): DbAssetQuote {
  const price = row.price ?? 0
  return {
    symbol,
    shortName: row.name ?? symbol,
    longName: row.name ?? symbol,
    regularMarketPrice: price,
    regularMarketChangePercent: row.change_percent ?? 0,
    regularMarketVolume: row.volume ?? 0,
    marketCap: row.market_cap ? Math.trunc(row.market_cap) : 0,
    logourl: '',
    fiftyTwoWeekHigh: row.high_52w ?? price,
    fiftyTwoWeekLow: row.low_52w ?? price,
    sector: row.sector,
    industry: row.industry,
    longBusinessSummary: row.business_summary,
    trailingPE: row.pe_ratio ?? 0,
    // Stored as percent; the app consumes the Brapi fraction convention.
    dividendYield: row.dividend_yield ? row.dividend_yield / 100 : 0,
    averageVolume: row.volume ?? 0,
    evEbitda: row.ev_ebitda,
    roe: row.roe,
    roic: row.roic,
    pBook: row.p_vp,
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
    isStale: quoteIsStale(row.updated_at),
  }
}

async function selectQuoteRows(tickers: string[]): Promise<Map<string, QuoteRow>> {
  if (tickers.length === 0) return new Map()
  const rows = await prisma.$queryRaw<QuoteRow[]>`
    SELECT ticker, name, price, change_percent, volume, market_cap, high_52w, low_52w,
           pe_ratio, dividend_yield, ev_ebitda, roe, roic, p_vp,
           sector, industry, business_summary, updated_at
    FROM "market"."asset_quotes"
    WHERE ticker IN (${Prisma.join(tickers)})`
  return new Map(rows.map((r) => [r.ticker, r]))
}

/** Fetch missing tickers from Brapi synchronously — only when there is nothing to serve. */
async function fetchAndUpsertMissing(tickers: string[]): Promise<void> {
  for (let i = 0; i < tickers.length; i += 20) {
    const chunk = tickers.slice(i, i + 20)
    const results = await fetchBrapiQuotesBatch(chunk)
    for (const quote of results) {
      const symbol = String(quote.symbol ?? '').trim().toUpperCase()
      if (symbol) await upsertQuoteRecord(quote, symbol)
    }
  }
}

export async function getDbQuotes(symbols: string[]): Promise<{ results: DbAssetQuote[] }> {
  if (symbols.length === 0) return { results: [] }

  const served = symbols.filter((s) => !isUnservedSymbol(cleanSymbol(s)))
  const cleanList = served.map(cleanSymbol)
  let cached = await selectQuoteRows(cleanList)

  const missing = cleanList.filter((t) => !cached.has(t))
  if (missing.length > 0) {
    await fetchAndUpsertMissing(missing)
    cached = await selectQuoteRows(cleanList)
  }

  const results: DbAssetQuote[] = []
  for (const original of served) {
    const row = cached.get(cleanSymbol(original))
    if (row) results.push(rowToQuote(row, appSymbol(original)))
  }
  return { results }
}

export async function getDbQuote(symbol: string): Promise<DbAssetQuote | null> {
  const { results } = await getDbQuotes([symbol])
  return results[0] ?? null
}

export async function getDbStatus(): Promise<MarketStatusData> {
  const { results } = await getDbQuotes(Object.keys(INDEX_NAMES))
  return {
    indices: results.map((q) => ({
      name: INDEX_NAMES[q.symbol] ?? q.shortName,
      symbol: q.symbol,
      regularMarketPrice: q.regularMarketPrice,
      regularMarketChangePercent: q.regularMarketChangePercent,
    })),
  }
}

interface HistoryRow {
  date: Date
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  volume: number | null
}

async function selectHistoryRows(ticker: string, limit: number): Promise<HistoryRow[]> {
  const rows = await prisma.$queryRaw<HistoryRow[]>`
    SELECT date, open, high, low, close, volume
    FROM "market"."asset_historical_prices"
    WHERE ticker = ${ticker}
    ORDER BY date DESC
    LIMIT ${limit}`
  return rows.reverse()
}

export async function getDbHistory(
  symbols: string[],
  range: string = '1mo'
): Promise<{ results: { symbol: string; history: Record<string, number | null>[] }[] }> {
  const limit = HISTORY_LIMITS[range] ?? 32
  const served = symbols.filter((s) => !isUnservedSymbol(cleanSymbol(s)))

  const parts = await Promise.all(
    served.map(async (symbol) => {
      const clean = cleanSymbol(symbol)
      let rows = await selectHistoryRows(clean, limit)
      if (rows.length === 0) {
        const records = await fetchBrapiHistory(clean, range)
        if (records.length > 0) {
          await upsertHistory(clean, records)
          rows = await selectHistoryRows(clean, limit)
        }
      }
      if (rows.length === 0) return []
      return [{
        symbol: appSymbol(symbol),
        history: rows.map((row) => ({
          timestamp: Math.trunc(row.date.getTime() / 1000),
          open: row.open,
          high: row.high,
          low: row.low,
          close: row.close,
          volume: row.volume,
        })),
      }]
    })
  )
  return { results: parts.flat() }
}

export async function getDbCurrencies(pairs: string[]): Promise<CurrencyData> {
  if (pairs.length === 0) return { currencies: [] }
  const cleanPairs = pairs.map(cleanSymbol)

  interface CurrencyRow {
    pair: string
    bid: number
    ask: number
    high: number
    low: number
    updated_at: Date
  }
  const select = async (): Promise<Map<string, CurrencyRow>> => {
    const rows = await prisma.$queryRaw<CurrencyRow[]>`
      SELECT pair, bid, ask, high, low, updated_at
      FROM "market"."currency_quotes"
      WHERE pair IN (${Prisma.join(cleanPairs)})`
    return new Map(rows.map((r) => [r.pair, r]))
  }

  let quotes = await select()
  if (cleanPairs.includes('USD-BRL') && !quotes.has('USD-BRL')) {
    await ingestPtaxDollar()
    quotes = await select()
  }

  const currencies = []
  for (const pair of cleanPairs) {
    const quote = quotes.get(pair)
    if (!quote) continue
    const [from, to] = pair.includes('-') ? pair.split('-') : [pair, 'BRL']
    currencies.push({
      fromCurrency: from,
      toCurrency: to,
      name: `${from}/${to}`,
      bidPrice: quote.bid,
      askPrice: quote.ask,
      highPrice: quote.high,
      lowPrice: quote.low,
      updatedAtTimestamp: Math.trunc(quote.updated_at.getTime() / 1000),
    })
  }
  return { currencies }
}

export async function getDbIndicators(): Promise<
  MarketIndicatorsData & QuoteEnvelope
> {
  interface MacroRow {
    date: Date
    value: number
    updated_at: Date | null
  }
  const selectSeries = (name: string): Promise<MacroRow[]> => prisma.$queryRaw<MacroRow[]>`
    SELECT date, value, updated_at
    FROM "market"."macro_indicators"
    WHERE name = ${name}
    ORDER BY date DESC
    LIMIT 10`

  let selic = await selectSeries('SELIC')
  if (selic.length === 0) {
    await ingestMacroIndicators()
    selic = await selectSeries('SELIC')
  }
  const inflation = await selectSeries('IPCA')
  const cdi = await selectSeries('CDI')
  const igpm = await selectSeries('IGP-M')

  const fmt = (d: Date) =>
    `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`
  const latest = selic[0]
  const updatedAt = latest?.updated_at ?? null
  return {
    selic: selic.map((r) => ({ date: fmt(r.date), value: r.value })),
    inflation: inflation.map((r) => ({ date: fmt(r.date), value: r.value })),
    cdi: cdi.map((r) => ({ date: fmt(r.date), value: r.value })),
    igpm: igpm.map((r) => ({ date: fmt(r.date), value: r.value })),
    updatedAt: updatedAt ? updatedAt.toISOString() : null,
    isStale: !updatedAt || updatedAt.toISOString().slice(0, 10) < new Date().toISOString().slice(0, 10),
  }
}

export interface ListingsParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: string
  type?: string | null
  search?: string | null
}

const LISTING_SORT_COLUMNS: Record<string, Prisma.Sql> = {
  name: Prisma.sql`name`,
  close: Prisma.sql`price`,
  change: Prisma.sql`change_percent`,
  change_abs: Prisma.sql`ABS(change_percent)`,
  volume: Prisma.sql`volume`,
  market_cap_basic: Prisma.sql`market_cap`,
  sector: Prisma.sql`sector`,
  rank: Prisma.sql`ticker`,
}

function emptyListingsPayload(): MarketListingsData {
  return {
    stocks: [],
    indexes: Object.entries(INDEX_NAMES).map(([stock, name]) => ({ stock, name })),
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
  }
}

export async function getDbListings(params: ListingsParams = {}): Promise<MarketListingsData> {
  const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc', type, search } = params

  // Crypto/treasury listings came from yfinance — removed (D3). Served empty,
  // visibly degraded, until a licensed source is contracted.
  if (type && type !== 'stock') return emptyListingsPayload()

  const where = [Prisma.sql`ticker NOT LIKE '^%' AND ticker NOT LIKE '%=X'`]
  if (search?.trim()) {
    const needle = `%${search.trim().toUpperCase()}%`
    where.push(Prisma.sql`(ticker ILIKE ${needle} OR name ILIKE ${needle})`)
  }
  const whereSql = Prisma.join(where, ' AND ')

  const sortCol = LISTING_SORT_COLUMNS[sortBy] ?? LISTING_SORT_COLUMNS.name
  const orderSql = sortOrder === 'desc' ? Prisma.sql`${sortCol} DESC` : Prisma.sql`${sortCol} ASC`

  const countRows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count FROM "market"."asset_quotes" WHERE ${whereSql}`
  const totalCount = Number(countRows[0]?.count ?? 0)

  const pageSize = Math.max(1, Math.min(limit, 100))
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const currentPage = Math.max(1, Math.min(page, totalPages))
  const offset = (currentPage - 1) * pageSize

  interface ListingRow {
    ticker: string
    name: string | null
    price: number | null
    change_percent: number | null
    volume: number | null
    market_cap: number | null
    sector: string | null
  }
  const rows = await prisma.$queryRaw<ListingRow[]>`
    SELECT ticker, name, price, change_percent, volume, market_cap, sector
    FROM "market"."asset_quotes"
    WHERE ${whereSql}
    ORDER BY ${orderSql}
    OFFSET ${offset} LIMIT ${pageSize}`

  return {
    stocks: rows.map((q) => ({
      stock: appSymbol(q.ticker),
      name: q.name ?? q.ticker,
      close: q.price ?? 0,
      change: q.change_percent ?? 0,
      volume: q.volume ?? 0,
      marketCap: q.market_cap ?? 0,
      logo: null,
      sector: q.sector,
      type: 'stock',
    })),
    indexes: Object.entries(INDEX_NAMES).map(([stock, name]) => ({ stock, name })),
    currentPage,
    totalPages,
    totalCount,
    hasNextPage: currentPage < totalPages,
  }
}

/** Radar without yfinance scores (D3): DB fundamentals/profile only, data: []. */
export async function getDbRadar(symbol: string): Promise<MarketRadarData | null> {
  const quote = await getDbQuote(symbol)
  if (!quote) return null
  return {
    timestamp: new Date().toISOString(),
    ticker: cleanSymbol(symbol),
    data: [],
    profile: {
      longBusinessSummary: quote.longBusinessSummary ?? null,
      sector: quote.sector ?? null,
      industry: quote.industry ?? null,
      website: null,
      fullTimeEmployees: null,
    },
    quote: {
      regularMarketPrice: quote.regularMarketPrice,
      regularMarketChangePercent: quote.regularMarketChangePercent,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh ?? quote.regularMarketPrice,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow ?? quote.regularMarketPrice,
      marketCap: quote.marketCap,
      longName: quote.longName,
    },
  } as unknown as MarketRadarData
}

export async function searchDbAssets(
  query: string,
  limit: number = 10,
  page: number = 1
): Promise<AssetSearchData> {
  const data = await getDbListings({
    limit: limit * 3,
    page: 1,
    sortBy: 'name',
    sortOrder: 'asc',
    search: query,
  })

  const seen = new Set<string>()
  const results = []
  for (const item of data.stocks) {
    if (!item.stock || seen.has(item.stock)) continue
    seen.add(item.stock)
    results.push({
      symbol: item.stock,
      name: item.name ?? item.stock,
      logo: null,
      type: item.type ?? 'stock',
      sector: item.sector ?? null,
    })
  }

  const pageSize = Math.max(1, limit)
  const totalCount = results.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const currentPage = Math.max(1, Math.min(page, totalPages))
  const start = (currentPage - 1) * pageSize
  return {
    results: results.slice(start, start + pageSize),
    currentPage,
    totalPages,
    itemsPerPage: pageSize,
    totalCount,
    hasNextPage: currentPage < totalPages,
  } as AssetSearchData
}
