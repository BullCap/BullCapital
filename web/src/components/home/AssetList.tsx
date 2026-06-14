'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buildAssetHref } from '@/lib/market-routing'

export interface AssetRowData {
  ticker: string
  name: string
  /** Segunda linha à esquerda (default = name). Ex.: volume nas mais negociadas. */
  secondary?: string
  price: number
  change: number
}

interface AssetListProps {
  rows: AssetRowData[]
}

/**
 * AssetMark — logo do ativo via CDN (FMP, resolve B3 e globais) com fallback
 * para monograma calm. Superfície neutra uniforme, sem glow.
 */
function AssetMark({ ticker }: { ticker: string }) {
  const clean = ticker.replace('.SA', '').toUpperCase()
  const isB3 = /^[A-Z]{4}\d{1,2}$/i.test(ticker)
  const initialSrc = ticker.startsWith('^')
    ? null
    : `https://images.financialmodelingprep.com/symbol/${isB3 ? `${clean}.SA` : clean}.png`

  const [src, setSrc] = useState<string | null>(initialSrc)
  const [triedBare, setTriedBare] = useState(false)

  const handleError = () => {
    if (isB3 && !triedBare) {
      setSrc(`https://images.financialmodelingprep.com/symbol/${clean}.png`)
      setTriedBare(true)
    } else {
      setSrc(null)
    }
  }

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        onError={handleError}
        className="size-9 shrink-0 rounded-full border border-hairline bg-white/4 object-contain p-0.5"
      />
    )
  }

  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-hairline bg-white/4 text-[11px] font-semibold tracking-wide text-ink-soft"
      aria-hidden
    >
      {clean.slice(0, 2)}
    </span>
  )
}

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatChange(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2).replace('.', ',')}%`
}

/**
 * AssetList — lista de cards por ativo no padrão de apps de investimento:
 * logo, ticker + nome à esquerda, preço + variação à direita. Cada card é um
 * link para a página do ativo. Sem moldura própria (vive em superfície flat).
 */
export function AssetList({ rows }: AssetListProps) {
  return (
    <ol className="flex flex-col gap-0.5">
      {rows.map((row) => {
        const positive = row.change >= 0
        return (
          <li key={row.ticker}>
            <Link
              href={buildAssetHref(row.ticker)}
              className="flex items-center gap-3 rounded-control px-2 py-2 transition-colors hover:bg-white/3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            >
              <AssetMark ticker={row.ticker} />
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-sm font-medium text-ink">{row.ticker}</span>
                <span className="truncate text-xs text-ink-faint">{row.secondary ?? row.name}</span>
              </div>
              <div className="flex shrink-0 flex-col items-end leading-tight">
                <span className="text-sm font-medium tabular-nums text-ink">{formatPrice(row.price)}</span>
                <span className={cn('text-xs font-medium tabular-nums', positive ? 'text-positive' : 'text-negative')}>
                  {formatChange(row.change)}
                </span>
              </div>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
