'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { buildAssetHref } from '@/lib/market-routing'
import type { MarketListingItem } from '@/types/market'

interface MarketTreeMapProps {
  assets: MarketListingItem[]
  showHeader?: boolean
}

interface TreeAsset {
  ticker: string
  weight: number
  // Fallback default variation if not found in live assets
  defaultChange: number
}

// Fixed index weight allocation representing major Ibovespa components
const TREEMAP_COLUMNS: TreeAsset[][] = [
  // Column 1: Weight ~20.2%
  [
    { ticker: 'VALE3', weight: 11.82, defaultChange: 0.57 },
    { ticker: 'PETR4', weight: 8.39, defaultChange: -1.05 }
  ],
  // Column 2: Weight ~12.8%
  [
    { ticker: 'ITUB4', weight: 8.08, defaultChange: -1.72 },
    { ticker: 'PETR3', weight: 4.77, defaultChange: -0.30 }
  ],
  // Column 3: Weight ~11.2%
  [
    { ticker: 'AXIA3', weight: 4.14, defaultChange: -1.24 },
    { ticker: 'BBDC4', weight: 3.66, defaultChange: -1.56 },
    { ticker: 'SBSP3', weight: 3.38, defaultChange: -0.56 }
  ],
  // Column 4: Weight ~9.2%
  [
    { ticker: 'B3SA3', weight: 3.28, defaultChange: -2.12 },
    { ticker: 'ITSA4', weight: 3.12, defaultChange: -0.92 },
    { ticker: 'ABEV3', weight: 2.79, defaultChange: -1.83 }
  ],
  // Column 5: Weight ~9.7%
  [
    { ticker: 'BPAC11', weight: 2.62, defaultChange: -0.81 },
    { ticker: 'WEGE3', weight: 2.56, defaultChange: 0.61 },
    { ticker: 'BBAS3', weight: 2.37, defaultChange: 0.58 },
    { ticker: 'PRIO3', weight: 2.17, defaultChange: 0.59 }
  ],
  // Column 6: Weight ~8.4%
  [
    { ticker: 'EMBJ3', weight: 2.02, defaultChange: 2.15 },
    { ticker: 'RENT3', weight: 1.70, defaultChange: -1.57 },
    { ticker: 'VBBR3', weight: 1.61, defaultChange: -1.98 },
    { ticker: 'RDOR3', weight: 1.54, defaultChange: -1.50 },
    { ticker: 'UGPA3', weight: 1.54, defaultChange: -1.54 }
  ],
  // Column 7: Weight ~7.5%
  [
    { ticker: 'GGBR4', weight: 2.17, defaultChange: 2.17 },
    { ticker: 'EQTL3', weight: 1.95, defaultChange: -1.23 },
    { ticker: 'ENEVE3', weight: 1.91, defaultChange: -2.19 },
    { ticker: 'CPLE3', weight: 1.80, defaultChange: -1.14 }
  ]
]

export default function MarketTreeMap({ assets, showHeader = true }: MarketTreeMapProps) {
  const [isMobile, setIsMobile] = useState(false)

  // Responsive state logic
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const visibleColumns = isMobile ? TREEMAP_COLUMNS.slice(0, 4) : TREEMAP_COLUMNS

  // Map live dynamic variations from assets if available
  const getAssetChangeAndWeight = (ticker: string, defaultChange: number, weight: number) => {
    // Standardise and search in homepage list
    const live = assets.find(
      (a) => a.stock?.toUpperCase() === ticker.toUpperCase()
    )
    const change = live ? live.change : defaultChange

    // Colors mapping representing solid flat heatmaps (flat saturations)
    // Positive greens
    let bgColor = 'bg-[#3f966d]' // mild positive default
    if (change >= 2.0) bgColor = 'bg-[#1b7a4c]' // strong green
    else if (change > 0.1) bgColor = 'bg-[#2ea36d]' // medium green
    else if (change >= 0) bgColor = 'bg-[#52525b]' // flat gray

    // Negative reds
    if (change <= -2.0) bgColor = 'bg-[#a82b2b]' // deep red
    else if (change < -1.0) bgColor = 'bg-[#b83f3f]' // medium red
    else if (change < 0) bgColor = 'bg-[#c95353]' // mild red

    return {
      change,
      bgColor,
      weightLabel: `${weight.toFixed(2)}%`
    }
  }

  // Column weights total sums
  const colWeights = visibleColumns.map((col) =>
    col.reduce((acc, asset) => acc + asset.weight, 0)
  )
  const totalWeight = colWeights.reduce((acc, w) => acc + w, 0)

  const mapContent = (
    <div className="relative h-[340px] rounded-[1.75rem] border border-white/[0.08] overflow-hidden bg-[#080B12] shadow-2xl p-1">
      <div className="flex h-full w-full gap-[3px]">
        {visibleColumns.map((column, colIdx) => {
          const colWeightPercent = (colWeights[colIdx]! / totalWeight) * 100
          const colTotalWeightVal = column.reduce((acc, a) => acc + a.weight, 0)

          return (
            <div
              key={colIdx}
              className="flex flex-col gap-[3px]"
              style={{ width: `${colWeightPercent}%` }}
            >
              {column.map((asset) => {
                const heightPercent = (asset.weight / colTotalWeightVal) * 100
                const { change, bgColor, weightLabel } = getAssetChangeAndWeight(
                  asset.ticker,
                  asset.defaultChange,
                  asset.weight
                )

                const formattedChange = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`

                return (
                  <Link
                    key={asset.ticker}
                    href={buildAssetHref(asset.ticker)}
                    style={{ height: `${heightPercent}%` }}
                    className={`flex flex-col justify-between p-2.5 transition-all duration-300 hover:scale-[1.02] hover:z-10 hover:shadow-xl cursor-pointer ${bgColor} text-white select-none border border-black/10`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-bold tracking-wider leading-none text-white/95">
                        {asset.ticker}
                      </span>
                      {/* Only show label details if tile is reasonably tall */}
                      {heightPercent > 20 && (
                        <span className="text-[8px] opacity-80 leading-none text-white/80 mt-1">
                          Var. {formattedChange}
                        </span>
                      )}
                    </div>
                    
                    {heightPercent > 35 && (
                      <div className="text-[8px] opacity-70 leading-none text-white/70">
                        Part. {weightLabel}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )

  if (!showHeader) {
    return mapContent
  }

  return (
    <section className="bull-panel p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="bull-eyebrow">Mapa de Calor</p>
          <h2 className="mt-2 font-serif text-xl text-[#F4F0FF]">Mapa dos ativos (Treemap)</h2>
        </div>
        <div className="flex shrink-0 gap-2 pt-1 text-[10px] text-[#DBEAFE]/50">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 bg-[#1b7a4c]" />
            Alta
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 bg-[#a82b2b]" />
            Baixa
          </span>
        </div>
      </div>

      {mapContent}
    </section>
  )
}
