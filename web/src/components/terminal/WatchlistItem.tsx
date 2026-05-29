'use client'

import { Minus, Plus, X } from 'lucide-react'
import { CompanyIcon } from '@/components/atoms/CompanyIcon'
import { VariationBadge } from '@/components/atoms/VariationBadge'
import { cn } from '@/lib/utils'
import type { TerminalAssetSnapshot } from './terminal-metrics'
import { formatCurrency } from './terminal-metrics'

interface WatchlistItemProps {
  asset: TerminalAssetSnapshot
  active: boolean
  inCompareSet: boolean
  compareDisabled: boolean
  onFocus: () => void
  onToggleCompare: () => void
  onRemove: () => void
}

export default function WatchlistItem({
  asset,
  active,
  inCompareSet,
  compareDisabled,
  onFocus,
  onToggleCompare,
  onRemove,
}: WatchlistItemProps) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 border-b border-white/[0.05] px-3 py-2.5 transition-colors',
        active ? 'bg-[#8B5CF6]/[0.08]' : 'hover:bg-white/[0.025]'
      )}
    >
      <button
        type="button"
        onClick={onFocus}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left outline-none"
      >
        <CompanyIcon
          ticker={asset.symbol}
          size={28}
          className="shrink-0 rounded-sm border border-white/[0.08] bg-[#0A0810]/70"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="text-xs font-bold tracking-wide text-[#F4F0FF]">
              {asset.symbol}
            </span>
            {asset.change == null ? (
              <span className="text-[10px] text-[#F4F0FF]/25">—</span>
            ) : (
              <VariationBadge variation={asset.change} />
            )}
          </span>
          <span className="mt-0.5 block truncate text-[10px] text-[#F4F0FF]/35">
            {asset.name}
          </span>
        </span>
        <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-[#F4F0FF]/65">
          {formatCurrency(asset.price)}
        </span>
      </button>

      <button
        type="button"
        onClick={onToggleCompare}
        disabled={compareDisabled && !inCompareSet}
        title={inCompareSet ? 'Remover da análise' : 'Adicionar à análise'}
        aria-pressed={inCompareSet}
        className={cn(
          'flex size-6 shrink-0 items-center justify-center border transition disabled:cursor-not-allowed disabled:opacity-25',
          inCompareSet
            ? 'border-[#8B5CF6]/40 bg-[#8B5CF6]/15 text-[#F4F0FF]'
            : 'border-white/[0.08] bg-transparent text-[#F4F0FF]/35 hover:border-[#8B5CF6]/30 hover:text-[#F4F0FF]'
        )}
      >
        {inCompareSet ? <Minus size={11} /> : <Plus size={11} />}
        <span className="sr-only">
          {inCompareSet ? 'Remover da análise' : 'Adicionar à análise'}
        </span>
      </button>

      <button
        type="button"
        onClick={onRemove}
        title="Remover da watchlist"
        className="flex size-6 shrink-0 items-center justify-center border border-transparent text-[#F4F0FF]/20 opacity-0 transition group-hover:opacity-100 hover:border-white/[0.08] hover:text-[#F4F0FF]/55"
      >
        <X size={11} />
        <span className="sr-only">Remover da watchlist</span>
      </button>
    </div>
  )
}
