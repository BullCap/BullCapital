'use client'

import { useMemo, useState } from 'react'
import { ResponsiveCirclePacking } from '@nivo/circle-packing'
import { animated } from '@react-spring/web'
import { Settings2 } from 'lucide-react'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import type { MarketListingItem } from '@/types/market'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface CirclePackingNode {
  id: string
  value?: number
  children?: CirclePackingNode[]
  // extra data for tooltip
  stock?: string
  name?: string
  close?: number
  change?: number
  sector?: string
}

function buildHierarchy(assets: MarketListingItem[], groupBySector: boolean): CirclePackingNode {
  if (!groupBySector) {
    return {
      id: 'root',
      children: assets.map((s) => ({
        id: s.stock,
        value: (s.marketCap ?? 0) / 1_000_000_000,
        stock: s.stock,
        name: s.name,
        close: s.close,
        change: s.change,
        sector: s.sector ?? 'Outros',
      })),
    }
  }

  const sectorMap = new Map<string, MarketListingItem[]>()

  for (const asset of assets) {
    const sector = asset.sector ?? 'Outros'
    if (!sectorMap.has(sector)) sectorMap.set(sector, [])
    sectorMap.get(sector)!.push(asset)
  }

  const children: CirclePackingNode[] = Array.from(sectorMap.entries()).map(([sector, stocks]) => ({
    id: sector,
    sector,
    children: stocks.map((s) => ({
      id: s.stock,
      value: (s.marketCap ?? 0) / 1_000_000_000,
      stock: s.stock,
      name: s.name,
      close: s.close,
      change: s.change,
      sector,
    })),
  }))

  return { id: 'root', children }
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

interface TopAssetsCirclePackingProps {
  assets: MarketListingItem[]
}

export default function TopAssetsCirclePacking({ assets }: TopAssetsCirclePackingProps) {
  const [groupBySector, setGroupBySector] = useState(false)
  const [assetCount, setAssetCount] = useState(10)

  const data = useMemo(() => {
    const slicedAssets = assets
      .filter((asset) => (asset.marketCap ?? 0) > 0)
      .slice(0, assetCount)
    return buildHierarchy(slicedAssets, groupBySector)
  }, [assets, groupBySector, assetCount])

  return (
    <div className="group relative flex h-full w-full flex-col items-center gap-6 overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#1A1625]/40 p-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-700">
      {/* Glow */}
      <div className="pointer-events-none absolute -top-10 h-64 w-64 rounded-full bg-[#8B5CF6]/15 blur-[100px] transition-all duration-700 group-hover:bg-[#8B5CF6]/20" />
      <GlassHighlight widthPercent={80} />

      {/* Header */}
      <div className="z-10 flex w-full items-start justify-between">
        <div className="w-9" /> {/* Spacer */}
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-balance text-center font-serif font-bold uppercase tracking-widest text-[#F4F0FF]">
            Top {assetCount} Ativos
          </h2>
          <p className="text-center text-sm font-light tracking-wide text-[#F4F0FF]/50">
            por capitalização de mercado
          </p>
        </div>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl border border-white/5 bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="relative w-64 space-y-4 overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A1625]/90 p-5 text-[#F4F0FF] shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-1px_2px_rgba(0,0,0,0.8),0_15px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-700"
          >
            <GlassHighlight widthPercent={60} />
            <div className="relative z-10 space-y-3">
              <DropdownMenuLabel className="px-0 py-0 text-[10px] font-medium uppercase tracking-widest text-white/40 drop-shadow-sm">
                Agrupamento
              </DropdownMenuLabel>
              <div className="flex rounded-xl border border-white/5 bg-black/40 p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                <button
                  type="button"
                  onClick={() => setGroupBySector(false)}
                  className={`flex-1 rounded-lg py-1.5 text-[10px] font-semibold transition-all duration-300 ${!groupBySector ? 'bg-[#1A1625] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_2px_4px_rgba(0,0,0,0.5)]' : 'text-white/40 hover:text-white/60 hover:shadow-[inset_0_-1px_2px_rgba(0,0,0,0.8)]'}`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setGroupBySector(true)}
                  className={`flex-1 rounded-lg py-1.5 text-[10px] font-semibold transition-all duration-300 ${groupBySector ? 'bg-[#1A1625] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_2px_4px_rgba(0,0,0,0.5)]' : 'text-white/40 hover:text-white/60 hover:shadow-[inset_0_-1px_2px_rgba(0,0,0,0.8)]'}`}
                >
                  Setor
                </button>
              </div>
            </div>

            <DropdownMenuSeparator className="relative z-10 bg-white/5 shadow-[0_1px_0_rgba(0,0,0,0.6)]" />

            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <DropdownMenuLabel className="px-0 py-0 text-[10px] font-medium uppercase tracking-widest text-white/40 drop-shadow-sm">
                  Quantidade
                </DropdownMenuLabel>
                <span className="text-[11px] font-bold text-[#8B5CF6] drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]">
                  {assetCount}
                </span>
              </div>
              <div className="px-1 pb-1 pt-1">
                <input
                  type="range"
                  min="5"
                  max="25"
                  value={assetCount}
                  onChange={(e) => setAssetCount(Number(e.target.value))}
                  className="h-2 w-full appearance-none rounded-full bg-black/40 accent-[#8B5CF6] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] outline-none transition-all hover:bg-black/50"
                />
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Chart */}
      <div className="z-10 -my-3 aspect-square w-full max-w-[480px]">
        {(data.children?.length ?? 0) === 0 ? (
          <div className="flex h-full items-center justify-center rounded-[2rem] border border-white/5 bg-black/15 text-sm text-[#F4F0FF]/40">
            Dados indisponíveis
          </div>
        ) : (
        <ResponsiveCirclePacking
          data={data}
          id="id"
          value="value"
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          padding={6}
          colors={(node) => {
            const d = node.data as CirclePackingNode
            // Root / sector groups → near-transparent
            if (!d.stock) return 'rgba(26, 22, 37, 0)'

            // Leaf nodes → colors based on performance (change)
            const change = d.change ?? 0

            if (change > 0) {
              // Positive: Amethyst variations (current theme)
              const hues = [
                'rgba(139, 92, 246, 0.35)',
              ]
              return hues[node.path.length % hues.length]
            } else if (change < 0) {
              // Negative: Soft reddish tones (based on VariationBadge #F43F5E)
              const hues = [
                'rgba(244, 63, 94, 0.30)',
              ]
              return hues[node.path.length % hues.length]
            } else {
              // Neutral: Opaque/Muted
              return 'rgba(244, 240, 255, 0.15)'
            }
          }}
          childColor={{ from: 'color', modifiers: [['brighter', 0.2]] }}
          borderWidth={1.5}
          borderColor={(node) => {
            const d = node.data as CirclePackingNode
            const change = d.change ?? 0
            if (d.sector) return 'rgba(139, 92, 246, 0.2)'
            if (!d.stock) return 'rgba(139, 92, 246, 0)'
            if (change > 0) return 'rgba(139, 92, 246, 0.4)'
            if (change < 0) return 'rgba(244, 63, 94, 0.4)'
            return 'rgba(244, 240, 255, 0.2)'
          }}
          enableLabels
          labelsFilter={(label) => !!(label.node.data as CirclePackingNode).stock}
          labelsSkipRadius={18}
          labelTextColor="#F4F0FF"
          labelComponent={({ node, style }) => {
            const d = node.data as CirclePackingNode
            const change = d.change ?? 0
            const isPositive = change > 0
            const isNegative = change < 0

            const tickerSize = Math.max(9, node.radius / 3.5)
            const variationSize = Math.max(7, node.radius / 5.5)

            return (
              <animated.g pointerEvents="none" style={{ opacity: style.opacity }}>
                <animated.text
                  x={style.x}
                  y={style.y}
                  dy={-tickerSize / 2 + 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{
                    fontSize: tickerSize,
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fill: '#F4F0FF',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                  }}
                >
                  {node.id}
                </animated.text>
                <animated.text
                  x={style.x}
                  y={style.y}
                  dy={tickerSize / 2 + variationSize / 2 + 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{
                    fontSize: variationSize,
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fill: isPositive
                      ? '#A78BFA'
                      : isNegative
                        ? '#FB7185'
                        : 'rgba(244, 240, 255, 0.5)',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))',
                  }}
                >
                  {isPositive ? '▲' : isNegative ? '▼' : ''} {Math.abs(change).toFixed(2)}%
                </animated.text>
              </animated.g>
            )
          }}
          tooltip={({ value, data: nodeData }) => {
            const d = nodeData as CirclePackingNode
            if (!d.stock) return <></>
            const isPositive = (d.change ?? 0) >= 0
            return (
              <div className="flex min-w-[200px] flex-col gap-1.5 rounded-[1.5rem] border border-white/10 bg-[#1A1625]/90 px-6 py-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
                <GlassHighlight className="via-white/40" widthPercent={80} />
                <div className="flex flex-col gap-0.5">
                  <span className="font-serif text-[15px] font-bold leading-tight tracking-tight text-[#F4F0FF]">
                    {d.stock}
                  </span>
                  <span className="text-[11px] font-light tracking-wide text-[#F4F0FF]/50">
                    {d.name}
                  </span>
                </div>

                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-sm font-medium text-[#F4F0FF]">
                    {formatBRL(d.close ?? 0)}
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${isPositive ? 'text-[#a78bfa]' : 'text-[#FB7185]'} flex items-center gap-0.5`}
                  >
                    {isPositive ? '▲' : '▼'} {Math.abs(d.change ?? 0).toFixed(2)}%
                  </span>
                </div>

                <div className="mt-2 flex flex-col gap-1 border-t border-white/5 pt-2">
                  <span className="text-[10px] uppercase tracking-widest text-[#F4F0FF]/30">
                    Market Cap: <span className="text-[#F4F0FF]/60">R$ {value?.toFixed(0)}B</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-[#8B5CF6]/80">
                    {d.sector}
                  </span>
                </div>
              </div>
            )
          }}
          animate
          motionConfig="gentle"
        />
        )}
      </div>
    </div>
  )
}
export { TopAssetsCirclePacking }
