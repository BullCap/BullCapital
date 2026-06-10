// Ingestion orchestration of the market module (plan §6.2). Called only by the
// cron route handlers in app/api/cron/* — EOD is the run that matters; intraday
// is best-effort during the B3 session. No yfinance (D3): tickers Brapi cannot
// serve simply age and surface as stale via the provenance envelope.
import { fetchBrapiQuotesBatch, fetchBrapiHistory } from './brapi'
import { ingestMacroIndicators, ingestPtaxDollar } from './bcb'
import { getIngestUniverse, cleanTicker, isB3Session, INDEX_TICKERS } from './universe'
import {
  acquireJobLease,
  releaseJobLease,
  recordIngestRun,
  upsertQuoteRecord,
  upsertHistory,
} from '../data/ingest-db'

export { isB3Session } from './universe'

const BATCH_SIZE = 20 // Brapi PRO batch limit
const HISTORY_CONCURRENCY = 5

export interface IngestResult {
  okCount: number
  failCount: number
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

/** Batch quote ingestion for the deduplicated universe (D8). */
export async function ingestAllQuotes(): Promise<IngestResult> {
  const tickers = [...(await getIngestUniverse()), ...INDEX_TICKERS]
  let okCount = 0

  for (const batch of chunk(tickers, BATCH_SIZE)) {
    const results = await fetchBrapiQuotesBatch(batch)
    for (const ticker of batch) {
      const clean = cleanTicker(ticker)
      const quote = results.find((r) => String(r.symbol ?? '').trim().toUpperCase() === clean)
      if (quote && (await upsertQuoteRecord(quote, ticker))) okCount += 1
    }
    // Gentle pacing between batch calls, mirroring market_ingest.py
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return { okCount, failCount: tickers.length - okCount }
}

/** Daily OHLCV upsert for the universe (recent window — backfills run manually). */
export async function ingestAllHistories(range: string = '1mo'): Promise<IngestResult> {
  const tickers = [...(await getIngestUniverse()), '^BVSP', '^GSPC']
  let okCount = 0

  for (const batch of chunk(tickers, HISTORY_CONCURRENCY)) {
    const counts = await Promise.all(
      batch.map(async (ticker) => {
        const records = await fetchBrapiHistory(ticker, range)
        return upsertHistory(ticker, records)
      })
    )
    okCount += counts.filter((c) => c > 0).length
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return { okCount, failCount: tickers.length - okCount }
}

/** Macro indicators + PTAX (Brapi primary, BCB SGS fallback). */
export async function ingestMacro(): Promise<IngestResult> {
  const [macroOk, ptaxOk] = await Promise.all([ingestMacroIndicators(), ingestPtaxDollar()])
  return {
    okCount: Number(macroOk) + Number(ptaxOk),
    failCount: Number(!macroOk) + Number(!ptaxOk),
  }
}

/**
 * Runs a named ingest job under a lease lock and records the run (§6.2).
 * Returns null when another worker holds the lease (not an error).
 */
export async function runIngestJob(
  job: string,
  leaseSeconds: number,
  work: () => Promise<IngestResult>
): Promise<IngestResult | null> {
  const acquired = await acquireJobLease(job, leaseSeconds)
  if (!acquired) return null

  const startedAt = new Date()
  try {
    const result = await work()
    await recordIngestRun({ job, source: 'brapi', startedAt, ...result })
    return result
  } finally {
    await releaseJobLease(job)
  }
}
