import type { AssetHistoricalPrice } from '@/types/market'

export type PriceHistoryRange = '1d' | '1mo' | '3mo'

const MOCK_END_TIMESTAMP = Date.parse('2026-05-21T18:00:00-03:00') / 1000

const MOCK_HISTORY_STEPS: Record<PriceHistoryRange, number> = {
  '1d': 10 * 60,
  '1mo': 24 * 60 * 60,
  '3mo': 2 * 24 * 60 * 60,
}

const MOCK_NOISE_AMPLITUDE: Record<PriceHistoryRange, number> = {
  '1d': 0.012,
  '1mo': 0.018,
  '3mo': 0.026,
}

const MOCK_HIGH_LOW_SPREAD: Record<PriceHistoryRange, number> = {
  '1d': 0.006,
  '1mo': 0.011,
  '3mo': 0.015,
}

// Ratios give each range a legible trend before noise and direction are applied.
const MOCK_HISTORY_RATIOS: Record<PriceHistoryRange, number[]> = {
  '1d': [
    0.953, 0.956, 0.962, 0.958, 0.967, 0.973, 0.969, 0.978, 0.982, 0.976, 0.984, 0.989, 0.986,
    0.994, 0.998, 0.991, 0.996, 1.004, 1.008, 1.002, 1.011, 1.018, 1.014, 1.022, 1.028, 1.023,
    1.031, 1.035, 1.03, 1.038, 1.044, 1.04, 1.049, 1.054, 1.05, 1.058, 1.064, 1.057, 1.066, 1.071,
    1.067, 1.074, 1.083, 1.078, 1.086, 1.091, 1.085, 1.097,
  ],
  '1mo': [
    0.912, 0.925, 0.944, 0.937, 0.955, 0.972, 0.965, 0.981, 0.996, 0.988, 1.004, 1.018, 1.011,
    1.027, 1.044, 1.038, 1.052, 1.067, 1.058, 1.081, 1.094, 1.087, 1.101, 1.118, 1.109, 1.125,
    1.142, 1.136, 1.151, 1.165, 1.157, 1.173,
  ],
  '3mo': [
    0.702, 0.714, 0.731, 0.725, 0.749, 0.772, 0.763, 0.784, 0.803, 0.794, 0.821, 0.845, 0.833,
    0.857, 0.879, 0.867, 0.892, 0.918, 0.904, 0.927, 0.946, 0.932, 0.958, 0.981, 0.973, 0.997,
    1.018, 1.004, 1.026, 1.047, 1.034, 1.059, 1.083, 1.069, 1.093, 1.118, 1.102, 1.129, 1.151,
    1.138, 1.166, 1.192, 1.179, 1.206, 1.234, 1.221, 1.248, 1.275, 1.258, 1.286, 1.309, 1.297,
    1.326, 1.351, 1.336, 1.364, 1.389, 1.373, 1.402, 1.428, 1.414, 1.441,
  ],
}

function addNoise(ratios: number[], range: PriceHistoryRange) {
  const amplitude = MOCK_NOISE_AMPLITUDE[range]

  return ratios.map((ratio, index) => {
    if (index === ratios.length - 1) return ratio

    const noise =
      Math.sin(index * 2.33) * amplitude +
      Math.cos(index * 5.19) * amplitude * 0.42 +
      Math.sin((index + 3) * 8.07) * amplitude * 0.18

    return ratio * (1 + noise)
  })
}

function resolveHighLow(close: number, range: PriceHistoryRange, index: number) {
  const baseSpread = MOCK_HIGH_LOW_SPREAD[range]
  const wave =
    0.72 +
    Math.sin(index * 1.87) * 0.18 +
    Math.cos((index + 2) * 3.41) * 0.1
  const spread = Math.max(0.001, baseSpread * wave)

  const high = close * (1 + spread)
  const low = close * (1 - spread)

  return {
    high: Number(high.toFixed(2)),
    low: Number(Math.max(0, low).toFixed(2)),
  }
}

export function getMockAssetHistory(
  range: PriceHistoryRange,
  anchorPrice: number | null | undefined,
  relativeChangePercent: number | null | undefined = 1
): AssetHistoricalPrice[] {
  const directionalRatios =
    (relativeChangePercent ?? 1) < 0
      ? [...MOCK_HISTORY_RATIOS[range]].reverse()
      : MOCK_HISTORY_RATIOS[range]
  const ratios = addNoise(directionalRatios, range)
  const finalRatio = ratios[ratios.length - 1]
  const lastPrice = anchorPrice && anchorPrice > 0 ? anchorPrice : 100
  const basePrice = lastPrice / finalRatio
  const step = MOCK_HISTORY_STEPS[range]
  const start = MOCK_END_TIMESTAMP - step * (ratios.length - 1)

  return ratios.map((ratio, index) => {
    const close = Number((basePrice * ratio).toFixed(2))
    const { high, low } = resolveHighLow(close, range, index)

    return {
      timestamp: start + step * index,
      close,
      high,
      low,
    }
  })
}
