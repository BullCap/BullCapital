'use server'

import { auth } from '@/lib/auth'
import { normalizeTicker } from '@/lib/market-routing'
import { getAssetHistory, getMultipleQuotes } from '@/modules/market'
import type { AssetHistoryResult, AssetQuote } from '@/types/market'

export async function fetchTerminalQuotes(tickers: string[]): Promise<AssetQuote[]> {
  const session = await auth()
  if (!session?.user) return []

  const normalizedTickers = Array.from(
    new Set(tickers.map((ticker) => normalizeTicker(ticker)).filter(Boolean))
  ).slice(0, 20)

  if (normalizedTickers.length === 0) return []

  const response = await getMultipleQuotes(normalizedTickers)
  return response.results ?? []
}

export async function fetchTerminalHistory(
  tickers: string[],
  range: string
): Promise<AssetHistoryResult[]> {
  const session = await auth()
  if (!session?.user || tickers.length === 0) return []

  const normalizedTickers = Array.from(
    new Set(tickers.map((ticker) => normalizeTicker(ticker)).filter(Boolean))
  ).slice(0, 10)

  if (normalizedTickers.length === 0) return []

  const response = await getAssetHistory(normalizedTickers, range)
  return response.results ?? []
}
