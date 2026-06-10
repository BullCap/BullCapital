// Brapi PRO fetchers — TS port of api/app/services/market_ingest.py (yfinance dropped per D3).
import { cleanTicker } from './universe'

const BRAPI_QUOTE_URL = 'https://brapi.dev/api/quote/'
const BRAPI_QUOTE_MODULES = 'summaryProfile,defaultKeyStatistics,financialData'
const TIMEOUT_MS = 5_000

const VALID_BRAPI_RANGES = new Set(['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max'])
const BRAPI_RANGE_ALIASES: Record<string, string> = { '3y': '5y', '15y': 'max', '16y': 'max', all: 'max' }

export type BrapiQuote = Record<string, unknown>

export interface HistoryRecord {
  date: string // YYYY-MM-DD (UTC)
  open: number | null
  high: number | null
  low: number | null
  close: number
  volume: number | null
}

export function toFloat(v: unknown): number | null {
  if (v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function brapiKey(): string | null {
  return process.env.BRAPI_KEY || null
}

function normalizeRange(range: string): string {
  const requested = (range || '1mo').trim().toLowerCase()
  const aliased = BRAPI_RANGE_ALIASES[requested] ?? requested
  return VALID_BRAPI_RANGES.has(aliased) ? aliased : '1mo'
}

async function brapiGet(path: string, params: Record<string, string>): Promise<Record<string, unknown> | null> {
  const key = brapiKey()
  if (!key) {
    console.warn('BRAPI_KEY not configured. Skipping Brapi fetch.')
    return null
  }
  const url = new URL(path, BRAPI_QUOTE_URL)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error(`Brapi request failed (${res.status}) for ${path}`)
      return null
    }
    return (await res.json()) as Record<string, unknown>
  } catch (err) {
    console.error(`Error calling Brapi for ${path}:`, err)
    return null
  }
}

/** Batch quotes + fundamentals (Brapi PRO supports up to 20 tickers per call). */
export async function fetchBrapiQuotesBatch(tickers: string[]): Promise<BrapiQuote[]> {
  const clean = tickers.map(cleanTicker)
  const data = await brapiGet(clean.join(','), {
    fundamental: 'true',
    dividends: 'true',
    modules: BRAPI_QUOTE_MODULES,
  })
  const results = data?.results
  return Array.isArray(results) ? (results as BrapiQuote[]) : []
}

/** Daily OHLCV history from the quote historicalDataPrice payload. */
export async function fetchBrapiHistory(ticker: string, range: string = '1mo'): Promise<HistoryRecord[]> {
  const data = await brapiGet(cleanTicker(ticker), { range: normalizeRange(range), interval: '1d' })
  const results = data?.results
  if (!Array.isArray(results) || results.length === 0) return []

  const history = (results[0] as BrapiQuote).historicalDataPrice
  if (!Array.isArray(history)) return []

  const records: HistoryRecord[] = []
  for (const row of history) {
    if (typeof row !== 'object' || row === null) continue
    const r = row as Record<string, unknown>
    const rawDate = toFloat(r.date)
    if (rawDate === null) continue
    const date = new Date(rawDate * 1000).toISOString().slice(0, 10)
    const close = toFloat(r.close) ?? toFloat(r.adjustedClose)
    if (close === null || close <= 0) continue
    records.push({
      date,
      open: toFloat(r.open),
      high: toFloat(r.high),
      low: toFloat(r.low),
      close,
      volume: toFloat(r.volume),
    })
  }
  return records
}
