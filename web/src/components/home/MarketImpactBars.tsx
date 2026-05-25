'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import type { MarketListingItem } from '@/types/market'
import { buildAssetHref } from '@/lib/market-routing'

interface MarketImpactBarsProps {
  assets: MarketListingItem[]
  maxRows?: number
  showHeader?: boolean
}

const DEFAULT_MAX_ROWS = 14

function formatChange(change: number) {
  return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
}

function formatPrice(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function MarketImpactBars({
  assets,
  maxRows = DEFAULT_MAX_ROWS,
  showHeader = true,
}: MarketImpactBarsProps) {
  const rows = useMemo(() => {
    const unique = Array.from(
      new Map(
        assets
          .filter((asset) => asset.stock && Number.isFinite(asset.change))
          .map((asset) => [asset.stock, asset])
      ).values()
    )
    const ranked = unique
      .map((asset) => ({ asset, magnitude: Math.abs(asset.change) }))
      .sort((a, b) => b.magnitude - a.magnitude)
      .slice(0, maxRows)
    const maxMagnitude = Math.max(...ranked.map((r) => r.magnitude), 1)
    return ranked.map(({ asset, magnitude }) => ({
      asset,
      // Reserve at least 6% so a tiny mover still shows a sliver of bar.
      widthPercent: 6 + (magnitude / maxMagnitude) * 94,
    }))
  }, [assets, maxRows])

  const content = (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-[#080B12]/75 p-4 shadow-[inset_0_1px_16px_rgba(0,0,0,0.5)]">
      {/* Center zero divider */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 top-3 w-px bg-white/[0.08]" />

      {rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#F4F0FF]/40">Mapa de impacto indisponível</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {rows.map(({ asset, widthPercent }) => {
            const isDown = asset.change < 0
            const barColor = isDown
              ? 'from-[#F43F5E]/55 to-[#F43F5E]/15'
              : 'from-[#8B5CF6]/55 to-[#8B5CF6]/15'
            const textColor = isDown ? 'text-[#FBA5AE]' : 'text-[#C4B5FD]'

            return (
              <li key={asset.stock}>
                <Link
                  href={buildAssetHref(asset.stock)}
                  className="group relative flex items-center gap-2 rounded-xl px-1.5 py-1.5 transition hover:bg-white/[0.04] sm:gap-3 sm:px-2"
                  aria-label={`${asset.stock}, variação ${formatChange(asset.change)}`}
                >
                  {/* Ticker */}
                  <span className="w-14 shrink-0 text-[11px] font-semibold tracking-wide text-[#F4F0FF]/85 group-hover:text-[#F4F0FF] sm:w-16 sm:text-[12px]">
                    {asset.stock}
                  </span>

                  {/* Bar lane: half-width per side of the zero line */}
                  <div className="relative h-5 flex-1 sm:h-6">
                    {isDown ? (
                      <div
                        className={`absolute inset-y-0 right-1/2 rounded-l-md bg-gradient-to-l ${barColor} shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]`}
                        style={{ width: `${widthPercent / 2}%` }}
                      />
                    ) : (
                      <div
                        className={`absolute inset-y-0 left-1/2 rounded-r-md bg-gradient-to-r ${barColor} shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]`}
                        style={{ width: `${widthPercent / 2}%` }}
                      />
                    )}
                  </div>

                  {/* Change % */}
                  <span className={`w-[68px] shrink-0 text-right text-[11px] font-semibold tabular-nums sm:w-20 sm:text-[12px] ${textColor}`}>
                    {formatChange(asset.change)}
                  </span>

                  {/* Price (hidden on small phones) */}
                  <span className="hidden w-24 shrink-0 text-right text-[11px] tabular-nums text-[#F4F0FF]/45 sm:block">
                    {formatPrice(asset.close)}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-3 flex items-center justify-between px-2 text-[10px] uppercase tracking-[0.18em] text-[#DBEAFE]/35">
        <span>Pressão</span>
        <span>Tração</span>
      </div>
    </div>
  )

  if (!showHeader) return content

  return (
    <section className="bull-panel p-5">
      <div className="mb-4">
        <p className="bull-eyebrow">Mapa de Impacto</p>
        <h2 className="mt-1.5 font-serif text-xl text-[#F4F0FF]">Movers do pregão</h2>
      </div>
      {content}
    </section>
  )
}
