'use client'

import { Scale } from 'lucide-react'
import { CompanyIcon } from '@/components/atoms/CompanyIcon'
import { VariationBadge } from '@/components/atoms/VariationBadge'
import { cn } from '@/lib/utils'
import type { TerminalAssetSnapshot } from './terminal-metrics'
import { formatCurrency, formatMetricValue, TERMINAL_METRICS } from './terminal-metrics'

interface AssetFocusProps {
  asset: TerminalAssetSnapshot
  compareSet: string[]
  onToggleCompare: (ticker: string) => void
}

export default function AssetFocus({ asset, compareSet, onToggleCompare }: AssetFocusProps) {
  const inCompareSet = compareSet.includes(asset.symbol)
  const compareDisabled = compareSet.length >= 8 && !inCompareSet

  return (
    <section className="border border-white/[0.08] bg-[#0D0B14]/70">
      {/* Cabeçalho do ativo */}
      <div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CompanyIcon
            ticker={asset.symbol}
            size={40}
            className="shrink-0 rounded-sm border border-white/[0.08] bg-[#0A0810]/70"
          />
          <div className="min-w-0">
            <p className="font-mono text-xl font-bold leading-none text-[#F4F0FF]">
              {asset.symbol}
            </p>
            <p className="mt-1 truncate text-xs text-[#F4F0FF]/40">{asset.name}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <div>
            <p className="font-mono text-2xl font-bold tabular-nums text-[#F4F0FF]">
              {formatCurrency(asset.price)}
            </p>
            <div className="mt-1 flex justify-end">
              {asset.change == null ? (
                <span className="text-xs text-[#F4F0FF]/25">—</span>
              ) : (
                <VariationBadge variation={asset.change} />
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleCompare(asset.symbol)}
            disabled={compareDisabled}
            className={cn(
              'inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-30',
              inCompareSet
                ? 'border-[#8B5CF6]/40 bg-[#8B5CF6]/15 text-[#F4F0FF]'
                : 'border-white/[0.08] bg-transparent text-[#F4F0FF]/50 hover:border-[#8B5CF6]/30 hover:text-[#F4F0FF]'
            )}
          >
            <Scale size={12} />
            {inCompareSet ? 'Em análise' : 'Comparar'}
          </button>
        </div>
      </div>

      {/* Tabela de métricas */}
      <div>
        {TERMINAL_METRICS.map((metric, index) => (
          <div
            key={metric.key}
            className={cn(
              'flex items-center justify-between px-5 py-3',
              index < TERMINAL_METRICS.length - 1 && 'border-b border-white/[0.05]'
            )}
          >
            <div className="flex items-baseline gap-3">
              <span className="w-20 text-xs font-bold text-[#F4F0FF]/55">
                {metric.shortLabel}
              </span>
              <span className="hidden text-[11px] text-[#F4F0FF]/25 sm:block">
                {metric.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#F4F0FF]/20">
                {metric.mode === 'higher' ? '↑ melhor' : '↓ melhor'}
              </span>
              <span className="w-24 text-right font-mono text-sm font-bold tabular-nums text-[#F4F0FF]">
                {formatMetricValue(asset.metrics[metric.key], metric.formatter)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Hint para comparação */}
      {!inCompareSet && (
        <div className="border-t border-white/[0.05] px-5 py-3">
          <p className="text-[10px] text-[#F4F0FF]/25">
            Use <span className="text-[#F4F0FF]/40">+</span> na watchlist ou &ldquo;Comparar&rdquo; para análise side-by-side.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="border-t border-white/[0.05] px-5 py-3">
        <p className="text-[10px] text-[#F4F0FF]/25">
          Análises contextuais. Não constituem recomendação de investimento.
        </p>
      </div>
    </section>
  )
}
