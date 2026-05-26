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

const DEFAULT_MAX_ROWS = 18

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
    <div className="relative flex min-h-[620px] flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-[#080B12]/75 p-4 shadow-[inset_0_1px_16px_rgba(0,0,0,0.5)]">
      {rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#F4F0FF]/40">Mapa de impacto indisponível</p>
      ) : (
        <ul className="flex flex-1 flex-col justify-between gap-1.5">
          {rows.map(({ asset, widthPercent }) => {
            const isDown = asset.change < 0
            const barColor = isDown
              ? 'from-[#F43F5E]/70 to-[#F43F5E]/18'
              : 'from-[#4ADE80]/70 to-[#4ADE80]/18'
            const textColor = isDown ? 'text-[#FDA4AF]' : 'text-[#86EFAC]'

            return (
              <li key={asset.stock}>
                <Link
                  href={buildAssetHref(asset.stock)}
                  className="group grid grid-cols-[3.75rem_minmax(0,1fr)_4.5rem] items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-white/[0.04] sm:grid-cols-[4.5rem_minmax(0,1fr)_5.25rem_5.75rem]"
                  aria-label={`${asset.stock}, variação ${formatChange(asset.change)}`}
                >
                  <span className="truncate text-[11px] font-semibold tracking-wide text-[#F4F0FF]/85 group-hover:text-[#F4F0FF] sm:text-[12px]">
                    {asset.stock}
                  </span>

                  <div className="relative h-5 flex-1 sm:h-6">
                    <span className="pointer-events-none absolute bottom-[-0.35rem] left-1/2 top-[-0.35rem] w-px bg-white/[0.08]" />
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

                  <span className={`text-right text-[11px] font-semibold tabular-nums sm:text-[12px] ${textColor}`}>
                    {formatChange(asset.change)}
                  </span>

                  <span className="hidden text-right text-[11px] tabular-nums text-[#F4F0FF]/45 sm:block">
                    {formatPrice(asset.close)}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-3 flex items-center justify-between px-2 text-[10px] uppercase tracking-[0.18em]">
        <span className="text-[#FDA4AF]/50">Pressão</span>
        <span className="text-[#86EFAC]/50">Tração</span>
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
