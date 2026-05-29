import type { AssetQuote } from '@/types/market'

export const DEFAULT_WATCHLIST = ['PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'TAEE11', 'MXRF11'] as const

export type TerminalMetricKey = 'dy' | 'pl' | 'pvp' | 'roe' | 'evEbitda' | 'volume'
export type TerminalHighlightMode = 'higher' | 'lower'

export interface TerminalMetricDefinition {
  key: TerminalMetricKey
  label: string
  shortLabel: string
  mode: TerminalHighlightMode
  formatter: (value: number) => string
}

export interface TerminalAssetSnapshot {
  symbol: string
  name: string
  price: number | null
  change: number | null
  metrics: Record<TerminalMetricKey, number | null>
}

export const TERMINAL_METRICS: TerminalMetricDefinition[] = [
  {
    key: 'dy',
    label: 'Dividend Yield',
    shortLabel: 'DY',
    mode: 'higher',
    formatter: (value) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`,
  },
  {
    key: 'pl',
    label: 'Preço / Lucro',
    shortLabel: 'P/L',
    mode: 'lower',
    formatter: (value) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}x`,
  },
  {
    key: 'pvp',
    label: 'Preço / Valor Patrimonial',
    shortLabel: 'P/VP',
    mode: 'lower',
    formatter: (value) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x`,
  },
  {
    key: 'roe',
    label: 'ROE',
    shortLabel: 'ROE',
    mode: 'higher',
    formatter: (value) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`,
  },
  {
    key: 'evEbitda',
    label: 'EV/EBITDA',
    shortLabel: 'EV/EBITDA',
    mode: 'lower',
    formatter: (value) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}x`,
  },
  {
    key: 'volume',
    label: 'Volume negociado',
    shortLabel: 'Volume',
    mode: 'higher',
    formatter: (value) => value.toLocaleString('pt-BR'),
  },
]

export function normalizeTerminalTicker(value: string): string {
  return value.trim().toUpperCase().replace(/\.SA$/i, '')
}

export function formatCurrency(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return 'n/d'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatPercent(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return 'n/d'
  return `${value >= 0 ? '+' : ''}${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`
}

export function formatMetricValue(value: number | null, formatter: (value: number) => string): string {
  return value == null || !Number.isFinite(value) ? 'n/d' : formatter(value)
}

function normalizePercent(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null
  return value > 0 && value < 1 ? value * 100 : value
}

export function quoteToSnapshot(symbol: string, quote?: AssetQuote): TerminalAssetSnapshot {
  const normalized = normalizeTerminalTicker(quote?.symbol ?? symbol)

  return {
    symbol: normalized,
    name: quote?.shortName || quote?.longName || 'Ativo',
    price: quote?.regularMarketPrice ?? null,
    change: quote?.regularMarketChangePercent ?? null,
    metrics: {
      dy: normalizePercent(quote?.dividendYield),
      pl: quote?.trailingPE ?? null,
      pvp: quote?.pBook ?? null,
      roe: normalizePercent(quote?.roe),
      evEbitda: quote?.evEbitda ?? null,
      volume: quote?.regularMarketVolume ?? quote?.averageVolume ?? null,
    },
  }
}

export function buildQuoteMap(quotes: AssetQuote[]): Record<string, AssetQuote> {
  return quotes.reduce<Record<string, AssetQuote>>((acc, quote) => {
    acc[normalizeTerminalTicker(quote.symbol)] = quote
    return acc
  }, {})
}
