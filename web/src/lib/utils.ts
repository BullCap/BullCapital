import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Market Volatility ---

export type VolatilityLevel = 'calm' | 'mixed' | 'fear'

export interface MarketVolatility {
  level: VolatilityLevel
  label: string
}

/**
 * Mapeia uma temperatura de mercado (0–100) para um nível de volatilidade.
 *
 * - 0–33  → calm  (Tranquilidade)
 * - 34–66 → mixed (Cenário Misto)
 * - 67–100 → fear (Cenário de Medo)
 */
export function getMarketVolatility(temperature: number): MarketVolatility {
  const clamped = Math.max(0, Math.min(100, temperature))

  if (clamped >= 67) {
    return { level: 'fear', label: 'Cenário de Medo' }
  }

  if (clamped >= 34) {
    return { level: 'mixed', label: 'Cenário Misto' }
  }

  return { level: 'calm', label: 'Tranquilidade' }
}
