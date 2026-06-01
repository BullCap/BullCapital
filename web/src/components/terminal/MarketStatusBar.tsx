'use client'

import type { CurrencyRate, MarketStatusData, MarketStatusIndex } from '@/types/market'
import { cn } from '@/lib/utils'

interface MarketStatusBarProps {
  marketStatus: MarketStatusData
  usdBrl: CurrencyRate | null
}

function getIbovIndex(indices: MarketStatusIndex[]): MarketStatusIndex | null {
  return (
    indices.find((index) => index.symbol.includes('BVSP')) ??
    indices.find((index) => index.name.toLowerCase().includes('ibov')) ??
    indices[0] ??
    null
  )
}

function isB3Open(): boolean {
  const brt = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const day = brt.getDay()
  const hour = brt.getHours() + brt.getMinutes() / 60
  return day >= 1 && day <= 5 && hour >= 10 && hour < 17
}

function formatIndexValue(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

function formatFx(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })
}

function Delta({ value }: { value: number | null | undefined }) {
  if (value == null || !Number.isFinite(value)) {
    return <span className="text-[#F4F0FF]/25">—</span>
  }

  const positive = value >= 0
  return (
    <span className={cn('tabular-nums', positive ? 'text-[#7fb59a]' : 'text-[#c98c9a]')}>
      {positive ? '+' : ''}
      {value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
    </span>
  )
}

export default function MarketStatusBar({ marketStatus, usdBrl }: MarketStatusBarProps) {
  const ibov = getIbovIndex(marketStatus.indices)
  const marketOpen = isB3Open()

  return (
    <div className="bull-frame flex flex-wrap items-center gap-x-5 gap-y-1.5 px-4 py-2.5">
      <div className="flex items-center gap-2.5 text-xs">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/30">
          IBOV
        </span>
        <span className="font-mono font-semibold tabular-nums text-[#F4F0FF]">
          {formatIndexValue(ibov?.regularMarketPrice)}
        </span>
        <Delta value={ibov?.regularMarketChangePercent} />
      </div>

      <div className="h-3 w-px bg-white/[0.08]" />

      <div className="flex items-center gap-2.5 text-xs">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/30">
          USD/BRL
        </span>
        <span className="font-mono font-semibold tabular-nums text-[#F4F0FF]">
          {formatFx(usdBrl?.bidPrice)}
        </span>
        <Delta
          value={
            usdBrl
              ? ((usdBrl.bidPrice - usdBrl.lowPrice) / usdBrl.lowPrice) * 100
              : null
          }
        />
      </div>

      <div className="ml-auto flex items-center gap-2 text-xs">
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            marketOpen ? 'bg-[#7fb59a]' : 'bg-white/20'
          )}
        />
        <span className="text-[#F4F0FF]/40">
          B3 {marketOpen ? 'aberta' : 'fechada'}
        </span>
      </div>
    </div>
  )
}
