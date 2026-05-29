'use client'

import { useEffect, useState } from 'react'
import { BarChart2, Loader, Sparkles, Table2, X } from 'lucide-react'
import { MarkdownBody } from '@/components/atoms/MarkdownBody'
import { CompanyIcon } from '@/components/atoms/CompanyIcon'
import { VariationBadge } from '@/components/atoms/VariationBadge'
import { cn } from '@/lib/utils'
import { requestComparatorNarrative } from '@/lib/actions/comparator'
import type { TerminalAssetSnapshot, TerminalMetricKey } from './terminal-metrics'
import { formatCurrency, formatMetricValue, TERMINAL_METRICS } from './terminal-metrics'
import ComparatorCharts from './ComparatorCharts'

type ComparatorView = 'metrics' | 'charts'

interface AssetComparatorProps {
  assets: TerminalAssetSnapshot[]
  onRemoveTicker: (ticker: string) => void
}

function getBestIndex(
  assets: TerminalAssetSnapshot[],
  key: TerminalMetricKey,
  mode: 'higher' | 'lower'
): number {
  const values = assets.map((a) => a.metrics[key])
  const valid = values.filter((v): v is number => v != null && Number.isFinite(v))
  if (valid.length < 2) return -1
  const target = mode === 'higher' ? Math.max(...valid) : Math.min(...valid)
  return values.findIndex((v) => v === target)
}

export default function AssetComparator({ assets, onRemoveTicker }: AssetComparatorProps) {
  const [view, setView] = useState<ComparatorView>('metrics')
  const [narrative, setNarrative] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const assetKey = assets.map((a) => a.symbol).join(',')
  useEffect(() => {
    setNarrative(null)
  }, [assetKey])

  const handleNarrative = async () => {
    if (loading) return
    setLoading(true)
    setNarrative(null)
    const result = await requestComparatorNarrative(
      assets.map((a) => ({
        symbol: a.symbol,
        name: a.name,
        price: a.price,
        change: a.change,
        metrics: a.metrics,
      }))
    )
    setNarrative(result?.narrative ?? null)
    setLoading(false)
  }

  const cols = assets.length
  const colTemplate = `7rem repeat(${cols}, 10rem)`

  return (
    <section className="flex min-w-0 flex-col border border-white/[0.08] bg-[#0D0B14]/70">
      {/* Tab bar */}
      <div className="flex shrink-0 border-b border-white/[0.08]">
        <button
          type="button"
          onClick={() => setView('metrics')}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 border-b-2 px-4 text-[10px] font-bold uppercase tracking-widest transition',
            view === 'metrics'
              ? 'border-[#8B5CF6] text-[#F4F0FF]'
              : 'border-transparent text-[#F4F0FF]/35 hover:text-[#F4F0FF]/70'
          )}
        >
          <Table2 size={11} />
          Indicadores
        </button>
        <button
          type="button"
          onClick={() => setView('charts')}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 border-b-2 px-4 text-[10px] font-bold uppercase tracking-widest transition',
            view === 'charts'
              ? 'border-[#8B5CF6] text-[#F4F0FF]'
              : 'border-transparent text-[#F4F0FF]/35 hover:text-[#F4F0FF]/70'
          )}
        >
          <BarChart2 size={11} />
          Gráficos
        </button>

        {/* Asset chips — always visible */}
        <div className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto px-3">
          {assets.map((asset, i) => (
            <div
              key={asset.symbol}
              className="flex shrink-0 items-center gap-1 border border-white/[0.08] py-0.5 pl-1.5 pr-1"
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="font-mono text-[10px] font-bold text-[#F4F0FF]/70">
                {asset.symbol}
              </span>
              <button
                type="button"
                onClick={() => onRemoveTicker(asset.symbol)}
                className="flex size-4 items-center justify-center text-[#F4F0FF]/20 hover:text-[#F4F0FF]/60 transition"
              >
                <X size={9} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Indicadores view ── */}
      {view === 'metrics' && (
        <div className="overflow-x-auto">
          {/* Asset header row */}
          <div
            className="grid border-b border-white/[0.06]"
            style={{ gridTemplateColumns: colTemplate }}
          >
            <div className="flex items-end px-4 py-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/25">
                Indicador
              </span>
            </div>
            {assets.map((asset) => (
              <div key={asset.symbol} className="border-l border-white/[0.06] px-3 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <CompanyIcon
                    ticker={asset.symbol}
                    size={20}
                    className="shrink-0 rounded-sm border border-white/[0.08] bg-[#0A0810]/70"
                  />
                  <p className="truncate font-mono text-xs font-bold text-[#F4F0FF]">
                    {asset.symbol}
                  </p>
                </div>
                <div className="mt-1.5 flex flex-wrap items-baseline gap-1">
                  <span className="font-mono text-sm font-bold tabular-nums text-[#F4F0FF]">
                    {formatCurrency(asset.price)}
                  </span>
                  {asset.change != null && <VariationBadge variation={asset.change} />}
                </div>
              </div>
            ))}
          </div>

          {/* Metric rows */}
          {TERMINAL_METRICS.map((metric, rowIndex) => {
            const bestIdx = getBestIndex(assets, metric.key, metric.mode)
            const isLast = rowIndex === TERMINAL_METRICS.length - 1
            return (
              <div
                key={metric.key}
                className={cn('grid', !isLast && 'border-b border-white/[0.04]')}
                style={{ gridTemplateColumns: colTemplate }}
              >
                <div className="flex flex-col justify-center px-4 py-3">
                  <p className="text-xs font-bold text-[#F4F0FF]/55">{metric.shortLabel}</p>
                  <p className="mt-0.5 text-[10px] text-[#F4F0FF]/25">
                    {metric.mode === 'higher' ? '↑ maior' : '↓ menor'}
                  </p>
                </div>
                {assets.map((asset, idx) => (
                  <div
                    key={asset.symbol}
                    className={cn(
                      'flex items-center border-l border-white/[0.04] px-3 py-3',
                      idx === bestIdx && 'bg-[#8B5CF6]/[0.05]'
                    )}
                  >
                    <span
                      className={cn(
                        'font-mono text-sm font-bold tabular-nums',
                        idx === bestIdx ? 'text-[#C4B5FD]' : 'text-[#F4F0FF]/60'
                      )}
                    >
                      {formatMetricValue(asset.metrics[metric.key], metric.formatter)}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 border-t border-white/[0.05] px-4 py-2.5">
            <p className="text-[10px] text-[#F4F0FF]/25">
              Destaque = melhor valor. Análises contextuais — não constituem recomendação.
            </p>
            <button
              type="button"
              onClick={handleNarrative}
              disabled={loading}
              className="inline-flex shrink-0 items-center gap-1.5 border border-white/[0.08] px-3 py-1.5 text-[10px] font-bold text-[#F4F0FF]/45 transition hover:border-[#8B5CF6]/30 hover:text-[#C4B5FD] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {loading ? <Loader size={10} className="animate-spin" /> : <Sparkles size={10} />}
              {loading ? 'Gerando...' : 'Leitura IA'}
            </button>
          </div>

          {/* Narrative */}
          {narrative && (
            <div className="border-t border-white/[0.06] px-4 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/30">
                  Leitura contextual
                </span>
                <button
                  type="button"
                  onClick={() => setNarrative(null)}
                  className="flex size-5 items-center justify-center text-[#F4F0FF]/25 transition hover:text-[#F4F0FF]/60"
                >
                  <X size={11} />
                </button>
              </div>
              <MarkdownBody className="text-xs leading-6 text-[#F4F0FF]/70">{narrative}</MarkdownBody>
            </div>
          )}
        </div>
      )}

      {/* ── Gráficos view ── */}
      {view === 'charts' && <ComparatorCharts assets={assets} />}
    </section>
  )
}

// Exported so ComparatorCharts can share the same palette — kept in sync
export const CHART_COLORS = [
  '#8B5CF6',
  '#22D3EE',
  '#F59E0B',
  '#EC4899',
  '#10B981',
  '#F97316',
  '#6366F1',
  '#84CC16',
  '#F43F5E',
  '#A78BFA',
]
