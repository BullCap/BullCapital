// Macro + currency ingestion — TS port of api/app/services/bcb_sgs.py.
// Brapi PRO is the primary source; BCB SGS (official, free) is the fallback.
import { toFloat } from './brapi'
import { upsertCurrencyQuote, upsertMacroRecords, type MacroRecord } from '../data/ingest-db'

const BCB_SGS_URL = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.'
const BRAPI_MACRO_URL = 'https://brapi.dev/api/v2/macro/latest'
const BRAPI_CURRENCY_URL = 'https://brapi.dev/api/v2/currency'
const TIMEOUT_MS = 15_000

const SERIES_MAP: Record<number, string> = {
  432: 'SELIC',
  12: 'CDI',
  13522: 'IPCA',
  1: 'USD-BRL-PTAX',
}

const BRAPI_MACRO_SERIES: Record<string, [number, string]> = {
  selic: [432, 'SELIC'],
  selicovernight: [1178, 'SELIC OVER'],
  cdi: [12, 'CDI'],
  tr: [226, 'TR'],
  ipca: [433, 'IPCA MENSAL'],
  ipca12m: [13522, 'IPCA'],
  inpc: [188, 'INPC'],
  igpm: [189, 'IGP-M'],
  igpdi: [190, 'IGP-DI'],
  ibcbr: [24363, 'IBC-BR'],
  pibmensal: [4380, 'PIB MENSAL'],
  desemprego: [24369, 'DESEMPREGO'],
  m1: [27788, 'M1'],
  m4: [27810, 'M4'],
  reservas: [3546, 'RESERVAS'],
}

type Row = Record<string, unknown>

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  return toFloat(String(value).replace(',', '.'))
}

function parseDateIso(value: unknown): string | null {
  if (!value) return null
  const text = String(value)
  // DD/MM/YYYY (BCB)
  const br = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (br) return `${br[3]}-${br[2]}-${br[1]}`
  // ISO variants
  const parsed = new Date(text)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)
  return null
}

function asRows(value: unknown): Row[] {
  if (Array.isArray(value)) return value.filter((v): v is Row => typeof v === 'object' && v !== null)
  if (typeof value === 'object' && value !== null) return [value as Row]
  return []
}

/** Normalize the Brapi macro response variants into DB-ready records. */
function iterBrapiMacroPoints(payload: unknown): MacroRecord[] {
  const root = payload as Row | Row[] | null
  let items: Row[] = []
  const container =
    root && !Array.isArray(root) ? ((root.results ?? root.data ?? root) as unknown) : root
  if (Array.isArray(container)) {
    items = asRows(container)
  } else if (typeof container === 'object' && container !== null) {
    for (const [key, value] of Object.entries(container)) {
      if (Array.isArray(value)) items.push({ symbol: key, data: value })
      else if (typeof value === 'object' && value !== null) items.push({ symbol: (value as Row).symbol ?? key, ...(value as Row) })
    }
  }

  const records: MacroRecord[] = []
  for (const item of items) {
    const seriesMeta = (typeof item.series === 'object' && item.series !== null ? item.series : {}) as Row
    const symbol = String(item.symbol ?? seriesMeta.slug ?? item.name ?? seriesMeta.name ?? item.ticker ?? '').toLowerCase()
    let series = BRAPI_MACRO_SERIES[symbol]
    if (!series) {
      const match = Object.keys(BRAPI_MACRO_SERIES).find((key) => symbol.includes(key))
      if (match) series = BRAPI_MACRO_SERIES[match]
    }
    if (!series) continue

    let points: Row[]
    if (typeof item.latest === 'object' && item.latest !== null) points = [item.latest as Row]
    else points = asRows(item.data ?? item.values ?? item.historicalDataPrice ?? item)

    const [seriesId, seriesName] = series
    for (const point of points) {
      const date = parseDateIso(point.date ?? point.data ?? point.updatedAt)
      const value = parseNumber(point.value ?? point.valor ?? point.rate ?? point.close)
      if (date && value !== null) records.push({ seriesId, name: seriesName, date, value })
    }
  }
  return records
}

async function fetchJson(url: URL, headers?: Record<string, string>): Promise<unknown | null> {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store' })
    if (!res.ok) {
      console.warn(`Request failed (${res.status}) for ${url.hostname}${url.pathname}`)
      return null
    }
    return await res.json()
  } catch (err) {
    console.warn(`Request error for ${url.hostname}${url.pathname}:`, err)
    return null
  }
}

/** Fetch one BCB SGS series over the lookback window (official source). */
export async function fetchSgsSeries(seriesId: number, lookbackDays: number = 30): Promise<Row[]> {
  const today = new Date()
  const start = new Date(today.getTime() - lookbackDays * 86_400_000)
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  const url = new URL(`${BCB_SGS_URL}${seriesId}/dados`)
  url.searchParams.set('formato', 'json')
  url.searchParams.set('dataInicial', fmt(start))
  url.searchParams.set('dataFinal', fmt(today))
  const data = await fetchJson(url)
  return Array.isArray(data) ? asRows(data) : []
}

/** SELIC/CDI/IPCA from Brapi PRO, with BCB SGS automatic fallback. */
export async function ingestMacroIndicators(lookbackDays: number = 45): Promise<boolean> {
  const key = process.env.BRAPI_KEY
  if (key) {
    const url = new URL(BRAPI_MACRO_URL)
    url.searchParams.set('symbols', Object.keys(BRAPI_MACRO_SERIES).join(','))
    const payload = await fetchJson(url, { Authorization: `Bearer ${key}` })
    if (payload && (await upsertMacroRecords(iterBrapiMacroPoints(payload)))) return true
  }

  const macroSeries = [432, 12, 13522]
  const seriesRows = await Promise.all(macroSeries.map((id) => fetchSgsSeries(id, lookbackDays)))

  const records: MacroRecord[] = []
  let success = true
  macroSeries.forEach((seriesId, i) => {
    const rows = seriesRows[i]
    if (rows.length === 0) {
      success = false
      return
    }
    for (const row of rows) {
      const date = parseDateIso(row.data)
      const value = parseNumber(row.valor)
      if (date && value !== null) records.push({ seriesId, name: SERIES_MAP[seriesId], date, value })
      else success = false
    }
  })

  if (records.length > 0 && !(await upsertMacroRecords(records))) success = false
  return success && records.length > 0
}

/** USD/BRL from the Brapi currency endpoint, with BCB PTAX fallback. */
export async function ingestPtaxDollar(lookbackDays: number = 15): Promise<boolean> {
  const key = process.env.BRAPI_KEY
  if (key) {
    const url = new URL(BRAPI_CURRENCY_URL)
    url.searchParams.set('currency', 'USD-BRL')
    const payload = (await fetchJson(url, { Authorization: `Bearer ${key}` })) as Row | null
    const rows = asRows(payload?.currency ?? payload?.results ?? payload?.data ?? payload)
    const latest = rows[0]
    if (latest) {
      const bid = parseNumber(latest.bidPrice ?? latest.bid ?? latest.price)
      if (bid !== null) {
        const ask = parseNumber(latest.askPrice ?? latest.ask ?? latest.price) ?? bid
        const high = parseNumber(latest.highPrice ?? latest.high) ?? bid
        const low = parseNumber(latest.lowPrice ?? latest.low) ?? bid
        const updatedIso = parseDateIso(latest.updatedAt ?? latest.date)
        const ok = await upsertCurrencyQuote({
          pair: 'USD-BRL',
          name: 'USD/BRL',
          bid,
          ask,
          high,
          low,
          updatedAt: updatedIso ? new Date(updatedIso) : new Date(),
        })
        if (ok) return true
      }
    }
  }

  const rows = await fetchSgsSeries(1, lookbackDays)
  const latest = rows[rows.length - 1]
  if (!latest) return false
  const date = parseDateIso(latest.data)
  const price = parseNumber(latest.valor)
  if (!date || price === null) return false
  return upsertCurrencyQuote({
    pair: 'USD-BRL',
    name: 'USD/BRL',
    bid: price,
    ask: price,
    high: price,
    low: price,
    updatedAt: new Date(date),
  })
}
