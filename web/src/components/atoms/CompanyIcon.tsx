'use client'

import { useState } from 'react'

interface CompanyIconProps {
  ticker: string
  size?: number
  className?: string
}

export function CompanyIcon({ ticker, size = 36, className }: CompanyIconProps) {
  const cleanTicker = ticker.replace('.SA', '').toUpperCase()

  // Construct primary URL using FMP CDN which resolves Brazilian and global tickers.
  // Market indices (starting with ^ like ^BVSP) do not have company logos, so we immediately fall back to the monogram.
  const hasLogo = !ticker.startsWith('^')

  // Check if it's a B3 (Brazilian) stock ticker (4 letters + 1 or 2 digits, e.g., PETR4, VALE3, BOVA11)
  const isB3Ticker = /^[A-Z]{4}\d{1,2}$/i.test(ticker)
  const primaryTicker = isB3Ticker ? `${ticker.toUpperCase()}.SA` : ticker.toUpperCase()

  const [imgSrc, setImgSrc] = useState<string | null>(
    hasLogo ? `https://images.financialmodelingprep.com/symbol/${primaryTicker}.png` : null
  )
  const [fallbackAttempted, setFallbackAttempted] = useState(false)

  const handleError = () => {
    if (isB3Ticker && !fallbackAttempted) {
      // If B3 stock failed with .SA, try without .SA (e.g. PETR4.png)
      setImgSrc(`https://images.financialmodelingprep.com/symbol/${ticker.toUpperCase()}.png`)
      setFallbackAttempted(true)
    } else {
      // If both fail, remove image and fall back to the monogram
      setImgSrc(null)
    }
  }

  if (imgSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imgSrc}
        alt={`Logo da ${cleanTicker}`}
        onError={handleError}
        className={`rounded-full bg-white/5 object-contain p-0.5 border border-white/10 ${className ?? ''}`}
        style={{ width: size, height: size }}
      />
    )
  }

  // Fallback: Glassmorphic Monograma Badge of BullCapital
  const initials = cleanTicker.slice(0, 2)
  return (
    <span
      className={`flex items-center justify-center rounded-full font-serif font-semibold text-white/90 border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 shrink-0 select-none ${className ?? ''}`}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.35) }}
    >
      {initials}
    </span>
  )
}
