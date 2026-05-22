'use server'

import { getAssetHistory } from '@/lib/services/market'
import type { AssetHistoryData } from '@/types/market'

export async function fetchAssetHistory(
  ticker: string,
  range: '1d' | '1mo' | '1y'
): Promise<AssetHistoryData> {
  return getAssetHistory([ticker], range)
}
