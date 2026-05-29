'use server'

import { auth } from '@/lib/auth'
import { ANALYSIS_API_URL, internalApiHeaders } from '@/lib/internal-api'

export interface ComparatorAssetPayload {
  symbol: string
  name?: string
  price?: number | null
  change?: number | null
  metrics?: Record<string, number | null>
}

export interface ComparatorNarrativeResult {
  narrative: string
  guardrailTriggered: boolean
  data: Record<string, unknown>
}

export async function requestComparatorNarrative(
  assets: ComparatorAssetPayload[],
  question?: string
): Promise<ComparatorNarrativeResult | null> {
  try {
    const session = await auth()
    if (!session?.user || assets.length < 2) return null

    const res = await fetch(`${ANALYSIS_API_URL}/comparator`, {
      method: 'POST',
      headers: internalApiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ assets, question }),
      cache: 'no-store',
    })

    if (!res.ok) return null
    const data = await res.json()

    return {
      narrative: String(data.narrative ?? ''),
      guardrailTriggered: Boolean(data.guardrail_triggered),
      data: data.data && typeof data.data === 'object' ? (data.data as Record<string, unknown>) : {},
    }
  } catch {
    return null
  }
}
