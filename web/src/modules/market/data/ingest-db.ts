// Write path of the market module: raw SQL upserts against the tables the
// FastAPI created in schema "ai" (moved to schema "market" in F5). Raw SQL keeps
// the ON CONFLICT ... COALESCE semantics of market_ingest.py/bcb_sgs.py and
// avoids Prisma schema surgery before F5 settles migration ownership.
import { prisma } from '@/lib/db'
import { Prisma } from '@/generated/prisma/client'
import type { BrapiQuote, HistoryRecord } from '../ingest/brapi'
import { toFloat } from '../ingest/brapi'

const SCHEMA = 'ai' // becomes 'market' in F5

let bootstrapped: Promise<void> | null = null

/** Creates ingest bookkeeping tables once per runtime instance (idempotent). */
export function ensureIngestTables(): Promise<void> {
  bootstrapped ??= (async () => {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ${SCHEMA}.ingest_runs (
        id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
        job text NOT NULL,
        source text NOT NULL,
        started_at timestamptz NOT NULL,
        finished_at timestamptz NOT NULL DEFAULT now(),
        ok_count integer NOT NULL DEFAULT 0,
        fail_count integer NOT NULL DEFAULT 0
      )`)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS ix_ingest_runs_job_finished
        ON ${SCHEMA}.ingest_runs (job, finished_at DESC)`)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ${SCHEMA}.ingest_locks (
        job text PRIMARY KEY,
        locked_until timestamptz NOT NULL
      )`)
  })()
  return bootstrapped
}

/**
 * Lease-based job lock (pool-safe replacement for the pg_advisory_lock pattern
 * of main.py — advisory locks need a pinned connection, which Prisma's pool
 * does not guarantee across the HTTP fetches a run performs).
 */
export async function acquireJobLease(job: string, leaseSeconds: number): Promise<boolean> {
  await ensureIngestTables()
  const rows = await prisma.$queryRaw<{ job: string }[]>`
    INSERT INTO "ai"."ingest_locks" (job, locked_until)
    VALUES (${job}, now() + make_interval(secs => ${leaseSeconds}))
    ON CONFLICT (job) DO UPDATE
      SET locked_until = now() + make_interval(secs => ${leaseSeconds})
      WHERE "ingest_locks".locked_until < now()
    RETURNING job`
  return rows.length > 0
}

export async function releaseJobLease(job: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "ai"."ingest_locks" SET locked_until = now() WHERE job = ${job}`
}

/** Cheap observability (plan §6.2): every run leaves a row; feeds staleness labels. */
export async function recordIngestRun(run: {
  job: string
  source: string
  startedAt: Date
  okCount: number
  failCount: number
}): Promise<void> {
  await ensureIngestTables()
  await prisma.$executeRaw`
    INSERT INTO "ai"."ingest_runs" (job, source, started_at, ok_count, fail_count)
    VALUES (${run.job}, ${run.source}, ${run.startedAt}, ${run.okCount}, ${run.failCount})`
}

function nested(data: BrapiQuote, key: string): Record<string, unknown> {
  const value = data[key]
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

function firstFloat(...values: unknown[]): number | null {
  for (const v of values) {
    const n = toFloat(v)
    if (n !== null) return n
  }
  return null
}

function firstString(...values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v
  }
  return null
}

/** Upsert one quote row. Fundamentals never wipe a previously-populated value
 *  with null — Brapi batch calls may omit module data on intraday refreshes. */
export async function upsertQuoteRecord(quote: BrapiQuote, ticker: string): Promise<boolean> {
  try {
    const tickerUpper = ticker.trim().toUpperCase()
    const profile = nested(quote, 'summaryProfile')
    const keyStats = nested(quote, 'defaultKeyStatistics')
    const financial = nested(quote, 'financialData')

    const name =
      firstString(quote.longName, profile.name as string, quote.shortName as string) ?? ticker
    const price = toFloat(quote.regularMarketPrice) ?? 0
    const changePercent = toFloat(quote.regularMarketChangePercent) ?? 0
    const volume = toFloat(quote.regularMarketVolume) ?? 0
    const pe = firstFloat(quote.priceEarnings, quote.pe, quote.trailingPE, keyStats.trailingPE, keyStats.forwardPE)
    const dy = firstFloat(quote.dividendYield, quote.dy, keyStats.dividendYield, keyStats.trailingAnnualDividendYield, keyStats.yield)
    const pVp = firstFloat(quote.priceToBook, quote.p_vp, quote.pBook, keyStats.priceToBook)
    const roe = firstFloat(quote.roe, quote.returnOnEquity, financial.returnOnEquity)
    const roic = firstFloat(quote.roic, quote.returnOnInvestedCapital, financial.returnOnInvestedCapital)
    const evEbitda = firstFloat(quote.enterpriseValueEbitda, quote.evEbitda, keyStats.enterpriseToEbitda, financial.enterpriseToEbitda)
    const sector = firstString(quote.sector, profile.sector as string, profile.sectorDisp as string)
    const industry = firstString(quote.industry, profile.industry as string, profile.industryDisp as string)
    const businessSummary = firstString(
      quote.longBusinessSummary, quote.businessSummary,
      profile.longBusinessSummary as string, profile.description as string
    )

    await prisma.$executeRaw`
      INSERT INTO "ai"."asset_quotes" (
        ticker, name, price, change_percent, volume, market_cap, high_52w, low_52w,
        pe_ratio, dividend_yield, ev_ebitda, roe, roic, p_vp,
        sector, industry, business_summary, updated_at
      ) VALUES (
        ${tickerUpper}, ${name}, ${price}, ${changePercent}, ${volume},
        ${toFloat(quote.marketCap)}, ${toFloat(quote.fiftyTwoWeekHigh)}, ${toFloat(quote.fiftyTwoWeekLow)},
        ${pe}, ${dy}, ${evEbitda}, ${roe}, ${roic}, ${pVp},
        ${sector}, ${industry}, ${businessSummary}, now()
      )
      ON CONFLICT (ticker) DO UPDATE SET
        name = excluded.name,
        price = excluded.price,
        change_percent = excluded.change_percent,
        volume = excluded.volume,
        market_cap = COALESCE(excluded.market_cap, "asset_quotes".market_cap),
        high_52w = COALESCE(excluded.high_52w, "asset_quotes".high_52w),
        low_52w = COALESCE(excluded.low_52w, "asset_quotes".low_52w),
        pe_ratio = COALESCE(excluded.pe_ratio, "asset_quotes".pe_ratio),
        dividend_yield = COALESCE(excluded.dividend_yield, "asset_quotes".dividend_yield),
        ev_ebitda = COALESCE(excluded.ev_ebitda, "asset_quotes".ev_ebitda),
        roe = COALESCE(excluded.roe, "asset_quotes".roe),
        roic = COALESCE(excluded.roic, "asset_quotes".roic),
        p_vp = COALESCE(excluded.p_vp, "asset_quotes".p_vp),
        sector = COALESCE(excluded.sector, "asset_quotes".sector),
        industry = COALESCE(excluded.industry, "asset_quotes".industry),
        business_summary = COALESCE(excluded.business_summary, "asset_quotes".business_summary),
        updated_at = now()`
    return true
  } catch (err) {
    console.error(`Failed to upsert quote for ${ticker}:`, err)
    return false
  }
}

export async function upsertHistory(ticker: string, records: HistoryRecord[]): Promise<number> {
  if (records.length === 0) return 0
  const tickerUpper = ticker.trim().toUpperCase()
  try {
    const values = records.map(
      (r) => Prisma.sql`(gen_random_uuid()::text, ${tickerUpper}, ${r.date}::date,
        ${r.open}, ${r.high}, ${r.low}, ${r.close}, ${r.volume}, now())`
    )
    await prisma.$executeRaw`
      INSERT INTO "ai"."asset_historical_prices" (id, ticker, date, open, high, low, close, volume, created_at)
      VALUES ${Prisma.join(values)}
      ON CONFLICT ON CONSTRAINT uq_ticker_date DO UPDATE SET
        open = COALESCE(excluded.open, "asset_historical_prices".open),
        high = COALESCE(excluded.high, "asset_historical_prices".high),
        low = COALESCE(excluded.low, "asset_historical_prices".low),
        close = excluded.close,
        volume = COALESCE(excluded.volume, "asset_historical_prices".volume)`
    return records.length
  } catch (err) {
    console.error(`Failed to upsert history for ${tickerUpper}:`, err)
    return 0
  }
}

export interface MacroRecord {
  seriesId: number
  name: string
  date: string // YYYY-MM-DD
  value: number
}

export async function upsertMacroRecords(records: MacroRecord[]): Promise<boolean> {
  if (records.length === 0) return false
  try {
    const values = records.map(
      (r) => Prisma.sql`(gen_random_uuid()::text, ${r.seriesId}, ${r.name}, ${r.date}::date, ${r.value}, now(), now())`
    )
    await prisma.$executeRaw`
      INSERT INTO "ai"."macro_indicators" (id, series_id, name, date, value, created_at, updated_at)
      VALUES ${Prisma.join(values)}
      ON CONFLICT ON CONSTRAINT uq_series_date DO UPDATE SET
        value = excluded.value,
        updated_at = now()`
    return true
  } catch (err) {
    console.error('Failed to upsert macro records:', err)
    return false
  }
}

export async function upsertCurrencyQuote(input: {
  pair: string
  name: string
  bid: number
  ask: number
  high: number
  low: number
  updatedAt: Date
}): Promise<boolean> {
  try {
    await prisma.$executeRaw`
      INSERT INTO "ai"."currency_quotes" (pair, name, bid, ask, high, low, updated_at)
      VALUES (${input.pair}, ${input.name}, ${input.bid}, ${input.ask}, ${input.high}, ${input.low}, ${input.updatedAt})
      ON CONFLICT (pair) DO UPDATE SET
        bid = excluded.bid,
        ask = excluded.ask,
        high = excluded.high,
        low = excluded.low,
        updated_at = excluded.updated_at`
    return true
  } catch (err) {
    console.error(`Failed to upsert currency quote for ${input.pair}:`, err)
    return false
  }
}
