'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { MarketListingItem } from '@/types/market'
import { buildAssetHref } from '@/lib/market-routing'

interface SectorTreeMapProps {
  assets: MarketListingItem[]
  showHeader?: boolean
}

interface TickerWeight {
  ticker: string
  weight: number
}

// Ibov composition snapshot (public B3 data). Stays in sync with TREEMAP_TICKERS.
const IBOV_WEIGHTS: TickerWeight[] = [
  { ticker: 'VALE3', weight: 11.82 },
  { ticker: 'PETR4', weight: 8.39 },
  { ticker: 'ITUB4', weight: 8.08 },
  { ticker: 'PETR3', weight: 4.77 },
  { ticker: 'AXIA3', weight: 4.14 },
  { ticker: 'BBDC4', weight: 3.66 },
  { ticker: 'SBSP3', weight: 3.38 },
  { ticker: 'B3SA3', weight: 3.28 },
  { ticker: 'ITSA4', weight: 3.12 },
  { ticker: 'ABEV3', weight: 2.79 },
  { ticker: 'BPAC11', weight: 2.62 },
  { ticker: 'WEGE3', weight: 2.56 },
  { ticker: 'BBAS3', weight: 2.37 },
  { ticker: 'PRIO3', weight: 2.17 },
  { ticker: 'GGBR4', weight: 2.17 },
  { ticker: 'EMBJ3', weight: 2.02 },
  { ticker: 'EQTL3', weight: 1.95 },
  { ticker: 'ENEVE3', weight: 1.91 },
  { ticker: 'CPLE3', weight: 1.80 },
  { ticker: 'RENT3', weight: 1.70 },
  { ticker: 'VBBR3', weight: 1.61 },
  { ticker: 'RDOR3', weight: 1.54 },
  { ticker: 'UGPA3', weight: 1.54 },
]

export const SECTOR_TREEMAP_TICKERS: string[] = IBOV_WEIGHTS.map((w) => w.ticker)

// Short labels for crowded mobile cells. Maps the Brapi sector name.
const SECTOR_SHORT_LABEL: Record<string, string> = {
  'Serviços Financeiros': 'Finanças',
  'Materiais Básicos': 'Materiais',
  'Petróleo e Energia': 'Petróleo',
  'Consumo Não Cíclico': 'Consumo NC',
  'Consumo Cíclico': 'Consumo C',
  'Utilidade Pública': 'Utilidades',
  'Bens Industriais': 'Indústria',
  'Energia': 'Energia',
  'Saúde': 'Saúde',
  'Comunicações': 'Telecom',
  'Construção e Imobiliário': 'Imobiliário',
  'Outros setores': 'Outros',
}

// Translations from English API sectors to clean Portuguese names
const SECTOR_TRANSLATIONS: Record<string, string> = {
  'Financial Services': 'Serviços Financeiros',
  'Financial': 'Serviços Financeiros',
  'Basic Materials': 'Materiais Básicos',
  'Energy': 'Petróleo e Energia',
  'Consumer Defensive': 'Consumo Não Cíclico',
  'Consumer Cyclical': 'Consumo Cíclico',
  'Utilities': 'Utilidade Pública',
  'Industrials': 'Bens Industriais',
  'Healthcare': 'Saúde',
  'Technology': 'Tecnologia',
  'Communication Services': 'Comunicações',
  'Real Estate': 'Construção e Imobiliário',
  'Equities': 'Ações',
  'FINANCIAL SERVICES': 'Serviços Financeiros',
  'BASIC MATERIALS': 'Materiais Básicos',
  'ENERGY': 'Petróleo e Energia',
  'CONSUMER DEFENSIVE': 'Consumo Não Cíclico',
  'CONSUMER CYCLICAL': 'Consumo Cíclico',
  'UTILITIES': 'Utilidade Pública',
  'INDUSTRIALS': 'Bens Industriais',
  'HEALTHCARE': 'Saúde',
  'EQUITIES': 'Ações',
}

// Fallback sector labels when the live quote response is missing one.
const SECTOR_FALLBACK: Record<string, string> = {
  VALE3: 'Materiais Básicos',
  GGBR4: 'Materiais Básicos',
  PETR3: 'Petróleo e Energia',
  PETR4: 'Petróleo e Energia',
  PRIO3: 'Petróleo e Energia',
  VBBR3: 'Petróleo e Energia',
  ITUB4: 'Serviços Financeiros',
  BBDC4: 'Serviços Financeiros',
  BBAS3: 'Serviços Financeiros',
  B3SA3: 'Serviços Financeiros',
  ITSA4: 'Serviços Financeiros',
  BPAC11: 'Serviços Financeiros',
  ABEV3: 'Consumo Não Cíclico',
  AXIA3: 'Consumo Não Cíclico',
  SBSP3: 'Utilidade Pública',
  EQTL3: 'Utilidade Pública',
  ENEVE3: 'Utilidade Pública',
  CPLE3: 'Utilidade Pública',
  WEGE3: 'Bens Industriais',
  EMBJ3: 'Bens Industriais',
  RENT3: 'Consumo Cíclico',
  RDOR3: 'Saúde',
  UGPA3: 'Petróleo e Energia',
}

interface CellNode {
  ticker: string
  weight: number
  change: number | null
}

interface SectorNode {
  sector: string
  weight: number
  cells: CellNode[]
}

function colorForChange(change: number | null): string {
  if (change === null) return 'bg-[#2A2A36]'
  if (change >= 2.0) return 'bg-[#1b7a4c]'
  if (change > 0.1) return 'bg-[#2ea36d]'
  if (change >= 0) return 'bg-[#3f966d]'
  if (change <= -2.0) return 'bg-[#a82b2b]'
  if (change < -1.0) return 'bg-[#b83f3f]'
  return 'bg-[#c95353]'
}

function formatChange(change: number | null) {
  if (change === null) return 'n/d'
  return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
}

function normalizeStockSymbol(symbol: string | null | undefined): string {
  return (symbol ?? '')
    .toUpperCase()
    .replace(/\.SA$/, '')
    .replace(/[^A-Z0-9]/g, '')
}

// Squarified treemap inside a rectangle. Returns [{w%, h%, left%, top%}].
interface Rect {
  left: number
  top: number
  width: number
  height: number
}

function squarify(weights: number[], rect: Rect): Rect[] {
  if (weights.length === 0) return []
  if (weights.length === 1) return [rect]

  const total = weights.reduce((sum, w) => sum + w, 0)
  const areas = weights.map((w) => (w / total) * rect.width * rect.height)
  const placed: Rect[] = []
  let remaining = { ...rect }
  let i = 0

  while (i < areas.length) {
    const isWide = remaining.width >= remaining.height
    const fixed = isWide ? remaining.height : remaining.width
    // Greedy row: keep adding while the worst aspect ratio improves.
    const row: number[] = []
    let bestRatio = Infinity
    while (i + row.length < areas.length) {
      const candidate = [...row, areas[i + row.length]]
      const sum = candidate.reduce((s, a) => s + a, 0)
      const lane = sum / fixed
      const worstRatio = candidate.reduce((worst, a) => {
        const w = a / lane
        const ratio = Math.max(w / lane, lane / w)
        return Math.max(worst, ratio)
      }, 0)
      if (worstRatio > bestRatio) break
      bestRatio = worstRatio
      row.push(areas[i + row.length])
    }

    const rowSum = row.reduce((s, a) => s + a, 0)
    const lane = rowSum / fixed
    let cursor = isWide ? remaining.top : remaining.left
    for (const area of row) {
      const span = area / lane
      placed.push(
        isWide
          ? { left: remaining.left, top: cursor, width: lane, height: span }
          : { left: cursor, top: remaining.top, width: span, height: lane }
      )
      cursor += span
    }

    if (isWide) {
      remaining = {
        left: remaining.left + lane,
        top: remaining.top,
        width: remaining.width - lane,
        height: remaining.height,
      }
    } else {
      remaining = {
        left: remaining.left,
        top: remaining.top + lane,
        width: remaining.width,
        height: remaining.height - lane,
      }
    }
    i += row.length
  }

  return placed
}

export default function SectorTreeMap({ assets, showHeader = true }: SectorTreeMapProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const sectorLabel = (name: string) => (isMobile ? SECTOR_SHORT_LABEL[name] ?? name : name)

  const sectors = useMemo<SectorNode[]>(() => {
    const liveByTicker = new Map(
      assets.map((a) => [normalizeStockSymbol(a.stock), a])
    )
    const grouped = new Map<string, SectorNode>()

    for (const { ticker, weight } of IBOV_WEIGHTS) {
      const live = liveByTicker.get(ticker)
      const rawSector = live?.sector || SECTOR_FALLBACK[ticker] || 'Outros'
      const sector = SECTOR_TRANSLATIONS[rawSector] || rawSector
      const change = live && Number.isFinite(live.change) ? live.change : null

      if (!grouped.has(sector)) {
        grouped.set(sector, { sector, weight: 0, cells: [] })
      }
      const node = grouped.get(sector)!
      node.weight += weight
      node.cells.push({ ticker, weight, change })
    }

    return Array.from(grouped.values()).sort((a, b) => b.weight - a.weight)
  }, [assets])

  // Mobile: collapse smallest sectors into "Outros" if too cramped.
  const visibleSectors = useMemo(() => {
    if (!isMobile || sectors.length <= 4) return sectors
    const main = sectors.slice(0, 4)
    const overflow = sectors.slice(4)
    if (overflow.length === 0) return main
    const merged: SectorNode = {
      sector: 'Outros setores',
      weight: overflow.reduce((s, x) => s + x.weight, 0),
      cells: overflow.flatMap((x) => x.cells),
    }
    return [...main, merged]
  }, [sectors, isMobile])

  const layout = useMemo(() => {
    const totalRect: Rect = { left: 0, top: 0, width: 100, height: 100 }
    const weights = visibleSectors.map((s) => s.weight)
    return squarify(weights, totalRect)
  }, [visibleSectors])

  const content = (
    <div className="relative h-[520px] overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[#080B12] p-1 shadow-2xl sm:h-[620px]">
      <div className="relative h-full w-full">
        {visibleSectors.map((sector, idx) => {
          const rect = layout[idx]
          if (!rect) return null
          const innerCells = sector.cells.sort((a, b) => b.weight - a.weight)
          const cellLayout = squarify(
            innerCells.map((c) => c.weight),
            { left: 0, top: 0, width: 100, height: 100 }
          )

          return (
            <div
              key={sector.sector}
              className="absolute p-[2px]"
              style={{
                left: `${rect.left}%`,
                top: `${rect.top}%`,
                width: `${rect.width}%`,
                height: `${rect.height}%`,
              }}
            >
              <div className="relative h-full w-full overflow-hidden rounded-md border border-white/[0.07] bg-black/40">
                <span className="pointer-events-none absolute left-1.5 top-1 z-10 max-w-[calc(100%-12px)] truncate text-[8px] font-bold uppercase tracking-[0.12em] text-white/65 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:text-[9px] sm:tracking-[0.14em]">
                  {sectorLabel(sector.sector)}
                </span>
                <div className="absolute inset-0">
                  {innerCells.map((cell, cellIdx) => {
                    const cellRect = cellLayout[cellIdx]
                    if (!cellRect) return null
                    const bgColor = colorForChange(cell.change)
                    const cellArea = cellRect.width * cellRect.height
                    const isLarge = cellArea >= 9
                    const isMedium = cellArea >= 4
                    const showTicker = cellArea >= 1.5

                    return (
                      <Link
                        key={cell.ticker}
                        href={buildAssetHref(cell.ticker)}
                        className={`absolute flex flex-col justify-end overflow-hidden p-1 transition hover:z-10 hover:scale-[1.02] hover:shadow-xl sm:p-1.5 ${bgColor} border border-black/30 text-white`}
                        style={{
                          left: `${cellRect.left}%`,
                          top: `${cellRect.top}%`,
                          width: `${cellRect.width}%`,
                          height: `${cellRect.height}%`,
                        }}
                        aria-label={`${cell.ticker} ${formatChange(cell.change)}`}
                      >
                        {showTicker && (
                          <span className="truncate text-[9px] font-bold leading-none tracking-wide sm:text-[10px]">
                            {cell.ticker}
                          </span>
                        )}
                        {isMedium && (
                          <span className="mt-0.5 truncate text-[8px] leading-none text-white/85 sm:text-[9px]">
                            {formatChange(cell.change)}
                          </span>
                        )}
                        {isLarge && (
                          <span className="mt-0.5 truncate text-[7px] leading-none text-white/55 sm:text-[8px]">
                            {cell.weight.toFixed(2)}%
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  if (!showHeader) return content

  return (
    <section className="bull-panel p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="bull-eyebrow">Mapa por Setor</p>
          <h2 className="mt-2 font-serif text-xl text-[#F4F0FF]">Setores da Ibovespa</h2>
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
      {content}
    </section>
  )
}
