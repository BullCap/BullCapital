'use client'

import Link from 'next/link'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import type { MarketListingItem } from '@/types/market'
import { buildAssetHref } from '@/lib/market-routing'

interface MarketBubbleMapProps {
  assets: MarketListingItem[]
  showHeader?: boolean
}

interface BubbleAsset extends MarketListingItem {
  left: number
  size: number
  top: number
  zIndex: number
}

interface BubbleSlot {
  left: number
  scale: number
  top: number
}

const RISE_SLOTS: BubbleSlot[] = [
  { left: 74, top: 24, scale: 1 },
  { left: 66, top: 52, scale: 0.92 },
  { left: 80, top: 69, scale: 0.78 },
  { left: 56, top: 76, scale: 0.7 },
]

const DIP_SLOTS: BubbleSlot[] = [
  { left: 28, top: 33, scale: 0.98 },
  { left: 38, top: 58, scale: 0.88 },
  { left: 22, top: 75, scale: 0.72 },
  { left: 47, top: 78, scale: 0.68 },
]

function formatChange(change: number) {
  return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
}


function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}


function buildBubbleAssets(assets: MarketListingItem[]): BubbleAsset[] {
  const uniqueAssets = Array.from(
    new Map(assets.filter((asset) => asset.stock).map((asset) => [asset.stock, asset])).values()
  )
  const risers = uniqueAssets
    .filter((asset) => asset.change >= 0)
    .sort((left, right) => right.change - left.change)
    .slice(0, RISE_SLOTS.length)
  const dips = uniqueAssets
    .filter((asset) => asset.change < 0)
    .sort((left, right) => left.change - right.change)
    .slice(0, DIP_SLOTS.length)
  const selected = [...risers, ...dips]

  const impactSignals = selected.map((asset) =>
    Math.log10(Math.max(asset.marketCap ?? asset.volume, 10))
  )
  const minImpact = Math.min(...impactSignals, 1)
  const maxImpact = Math.max(...impactSignals, minImpact + 1)

  return selected.map((asset, index) => {
    const impactSignal = impactSignals[index]
    const impactPosition = (impactSignal - minImpact) / (maxImpact - minImpact)
    const slotIndex = asset.change >= 0 ? risers.indexOf(asset) : dips.indexOf(asset)
    const slot = asset.change >= 0 ? RISE_SLOTS[slotIndex] : DIP_SLOTS[slotIndex]

    return {
      ...asset,
      left: slot.left,
      size: clamp((58 + impactPosition * 34) * slot.scale, 52, 92),
      top: slot.top,
      zIndex: Math.round(20 - index + impactPosition * 4),
    }
  })
}

export default function MarketBubbleMap({ assets, showHeader = true }: MarketBubbleMapProps) {
  const bubbles = buildBubbleAssets(assets)

  const mapContent = (
    <div className="relative h-[314px] rounded-[1.75rem] border border-white/[0.07]">
        {/* Background layer — overflow-hidden mantém bordas arredondadas e clipa a grade */}
        <div className="absolute inset-0 overflow-hidden rounded-[1.75rem] bg-[#080B12]/75 shadow-[inset_0_1px_16px_rgba(0,0,0,0.5)]">
          <div className="bull-bubble-grid absolute inset-0" />
          <div className="absolute bottom-6 left-1/2 top-5 w-px bg-white/[0.08]" />
          <div className="absolute bottom-[4.55rem] left-5 right-5 h-px bg-white/[0.08]" />
          <span className="absolute left-5 top-4 text-[10px] uppercase text-[#DBEAFE]/35">
            Mais liquidez
          </span>
          <span className="absolute bottom-4 left-5 text-[10px] uppercase text-[#EF4444]/60">
            Pressão
          </span>
          <span className="absolute bottom-4 right-5 text-[10px] uppercase text-[#22C55E]/60">
            Tração
          </span>
        </div>

        {/* Bubble layer — tooltips usam o slot para abrir na area livre do mapa. */}
        <div className="absolute inset-0">
          {bubbles.length === 0 ? (
            <div className="relative flex h-full items-center justify-center px-8 text-center">
              <p className="text-sm text-[#F4F0FF]/40">Mapa de ativos indisponível</p>
            </div>
          ) : (
            bubbles.map((asset) => {
              const tone =
                asset.change > 0
                  ? 'bull-bubble-up'
                  : asset.change < 0
                    ? 'bull-bubble-down'
                    : 'bull-bubble-flat'

              return (
                <div
                  key={asset.stock}
                  className="bull-bubble-float absolute"
                  style={{
                    left: `${asset.left}%`,
                    top: `${asset.top}%`,
                    width: `${asset.size}px`,
                    zIndex: asset.zIndex,
                  }}
                >
                  <Link
                    href={buildAssetHref(asset.stock)}
                    aria-label={`${asset.stock}, variação ${formatChange(asset.change)}`}
                    className={`bull-market-bubble ${tone}`}
                  >
                    <span className="max-w-[84%] truncate text-[11px] font-semibold">
                      {asset.stock}
                    </span>
                    <span className="text-[10px] font-medium">{formatChange(asset.change)}</span>
                  </Link>

                </div>
              )
            })
          )}
        </div>
      </div>
  )

  if (!showHeader) {
    return mapContent
  }

  return (
    <section className="bull-panel bull-bubble-stage p-5">
      <GlassHighlight widthPercent={68} />

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="bull-eyebrow">Mapa de Impacto</p>
          <h2 className="mt-2 font-serif text-xl text-[#F4F0FF]">Ativos em movimento</h2>
        </div>
        <div className="flex shrink-0 gap-2 pt-1 text-[10px] text-[#DBEAFE]/50">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
            Alta
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
            Baixa
          </span>
        </div>
      </div>

      {mapContent}
    </section>
  )
}
