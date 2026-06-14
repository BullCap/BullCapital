'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { buildAssetHref } from '@/lib/market-routing'

export interface TreemapCell {
  ticker: string
  change: number | null
}

interface MarketTreemapProps {
  cells: TreemapCell[]
}

// Pesos de composição da Ibovespa (dado público B3). Definem a área da célula.
const IBOV_WEIGHTS: Record<string, number> = {
  VALE3: 11.82, PETR4: 8.39, ITUB4: 8.08, PETR3: 4.77, AXIA3: 4.14, BBDC4: 3.66,
  SBSP3: 3.38, B3SA3: 3.28, ITSA4: 3.12, ABEV3: 2.79, BPAC11: 2.62, WEGE3: 2.56,
  BBAS3: 2.37, PRIO3: 2.17, GGBR4: 2.17, EMBJ3: 2.02, EQTL3: 1.95, ENEVE3: 1.91,
  CPLE3: 1.8, RENT3: 1.7, VBBR3: 1.61, RDOR3: 1.54, UGPA3: 1.54,
}

/** Heat calmo: positive/negative em opacidade crescente, satura em ±3%. */
function heatColor(change: number | null): string {
  if (change === null) return 'rgba(255, 255, 255, 0.035)'
  const magnitude = Math.min(Math.abs(change) / 3, 1)
  const alpha = (0.1 + magnitude * 0.3).toFixed(3)
  const rgb = change >= 0 ? '127, 181, 154' : '201, 140, 154'
  return `rgba(${rgb}, ${alpha})`
}

function formatChange(change: number | null): string {
  if (change === null) return 'n/d'
  return `${change >= 0 ? '+' : ''}${change.toFixed(2).replace('.', ',')}%`
}

interface Rect {
  left: number
  top: number
  width: number
  height: number
}

// Squarified treemap dentro de um retângulo 100×100 (percentual).
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

    remaining = isWide
      ? { left: remaining.left + lane, top: remaining.top, width: remaining.width - lane, height: remaining.height }
      : { left: remaining.left, top: remaining.top + lane, width: remaining.width, height: remaining.height - lane }
    i += row.length
  }

  return placed
}

/**
 * MarketTreemap — mapa de calor da Ibovespa em superfície calm. Áreas pelo peso
 * no índice, cor pelo retorno do dia (tons mutados positive/negative). Sem
 * sombras nem bordas pesadas: só hairlines separam as células.
 */
export default function MarketTreemap({ cells }: MarketTreemapProps) {
  const nodes = useMemo(() => {
    const changeByTicker = new Map(cells.map((c) => [c.ticker.toUpperCase(), c.change]))
    return Object.entries(IBOV_WEIGHTS)
      .map(([ticker, weight]) => ({
        ticker,
        weight,
        change: changeByTicker.get(ticker) ?? null,
      }))
      .sort((a, b) => b.weight - a.weight)
  }, [cells])

  const layout = useMemo(
    () => squarify(nodes.map((n) => n.weight), { left: 0, top: 0, width: 100, height: 100 }),
    [nodes]
  )

  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-control sm:h-[420px]">
      {nodes.map((node, index) => {
        const rect = layout[index]
        if (!rect) return null
        const area = rect.width * rect.height
        const showChange = area >= 3

        return (
          <Link
            key={node.ticker}
            href={buildAssetHref(node.ticker)}
            aria-label={`${node.ticker} ${formatChange(node.change)}`}
            className="absolute flex flex-col justify-end gap-0.5 overflow-hidden border border-void/40 p-2 transition-colors duration-300 hover:border-hairline-strong"
            style={{
              left: `${rect.left}%`,
              top: `${rect.top}%`,
              width: `${rect.width}%`,
              height: `${rect.height}%`,
              backgroundColor: heatColor(node.change),
            }}
          >
            <span className="truncate text-xs font-medium leading-none text-ink">{node.ticker}</span>
            {showChange ? (
              <span className="truncate text-[11px] leading-none tabular-nums text-ink-soft">
                {formatChange(node.change)}
              </span>
            ) : null}
          </Link>
        )
      })}
    </div>
  )
}
