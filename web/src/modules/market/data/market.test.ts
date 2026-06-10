import { beforeEach, describe, expect, it, vi } from 'vitest'

const queryRawMock = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => queryRawMock(...args),
    $executeRaw: vi.fn(),
    $executeRawUnsafe: vi.fn(),
  },
}))

import { getAssetHistory } from './market'

describe('getAssetHistory', () => {
  beforeEach(() => {
    queryRawMock.mockReset()
  })

  it('serves history from the DB cache mapped to the app shape', async () => {
    queryRawMock.mockResolvedValueOnce([
      // selectHistoryRows returns DESC; reads.ts reverses to chronological order
      { date: new Date('2026-06-09T00:00:00Z'), open: 40, high: 41.2, low: 39.8, close: 40.1, volume: 200 },
      { date: new Date('2026-06-08T00:00:00Z'), open: 39.2, high: 40, low: 39.1, close: 39.5, volume: 100 },
    ])

    const result = await getAssetHistory(['PETR4'], '1d')

    expect(result.results).toHaveLength(1)
    expect(result.results[0]?.symbol).toBe('PETR4')
    expect(result.results[0]?.history).toEqual([
      {
        timestamp: Math.trunc(new Date('2026-06-08T00:00:00Z').getTime() / 1000),
        open: 39.2,
        high: 40,
        low: 39.1,
        close: 39.5,
        volume: 100,
      },
      {
        timestamp: Math.trunc(new Date('2026-06-09T00:00:00Z').getTime() / 1000),
        open: 40,
        high: 41.2,
        low: 39.8,
        close: 40.1,
        volume: 200,
      },
    ])
    // DB hit — no network fallback should be attempted
    expect(queryRawMock).toHaveBeenCalledTimes(1)
  })

  it('returns a labeled empty result when there is no data anywhere', async () => {
    queryRawMock.mockResolvedValue([])
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 502 })))

    const result = await getAssetHistory(['PETR4'], '1d')

    expect(result.results).toEqual([])
    vi.unstubAllGlobals()
  })
})
