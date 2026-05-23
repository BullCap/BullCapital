import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAssetHistory } from './market'

describe('getAssetHistory', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requests history from the yfinance-backed market API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              symbol: 'PETR4',
              history: [
                { timestamp: 10, close: 39.5, high: 40, low: 39.1 },
                { timestamp: 20, close: 40.1, high: 41.2, low: 39.8 },
              ],
            },
          ],
        }),
        { status: 200 }
      )
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await getAssetHistory(['PETR4'], '1d')
    const [requestUrl, requestOptions] = fetchMock.mock.calls[0] as [string, RequestInit]
    const url = new URL(requestUrl)

    expect(url.pathname).toBe('/api/v1/market/history')
    expect(url.searchParams.get('tickers')).toBe('PETR4')
    expect(url.searchParams.get('range')).toBe('1d')
    expect(requestOptions.cache).toBe('no-store')
    expect(result.results[0]?.history).toEqual([
      { timestamp: 10, close: 39.5, high: 40, low: 39.1 },
      { timestamp: 20, close: 40.1, high: 41.2, low: 39.8 },
    ])
  })
})
