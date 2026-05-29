'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchTerminalHistory } from '@/lib/actions/terminal'
import { cn } from '@/lib/utils'
import { CHART_COLORS } from './AssetComparator'
import type { TerminalAssetSnapshot, TerminalMetricKey } from './terminal-metrics'
import { formatMetricValue, TERMINAL_METRICS } from './terminal-metrics'

type Range = '1mo' | '3mo' | '6mo' | '1y'

const RANGES: { key: Range; label: string }[] = [
  { key: '1mo', label: '1M' },
  { key: '3mo', label: '3M' },
  { key: '6mo', label: '6M' },
  { key: '1y', label: '1A' },
]

interface ComparatorChartsProps {
  assets: TerminalAssetSnapshot[]
}

function LineTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="border border-white/[0.08] bg-[#0D0B14] px-3 py-2 text-[11px] shadow-lg">
      <p className="mb-1.5 text-[#F4F0FF]/35">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-3">
          <span className="h-px w-3 shrink-0" style={{ background: entry.color, height: 2 }} />
          <span className="font-mono font-bold text-[#F4F0FF]/70">{entry.dataKey}</span>
          <span className="ml-auto font-mono font-bold text-[#F4F0FF]">
            {typeof entry.value === 'number'
              ? `${entry.value >= 0 ? '+' : ''}${entry.value.toFixed(2)}%`
              : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[]
}) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="border border-white/[0.08] bg-[#0D0B14] px-3 py-2 text-[11px] shadow-lg">
      <p className="font-mono font-bold text-[#F4F0FF]">{entry.name}</p>
      <p className="mt-0.5 font-mono text-[#F4F0FF]/55">{entry.payload.formatted}</p>
    </div>
  )
}

export default function ComparatorCharts({ assets }: ComparatorChartsProps) {
  const [range, setRange] = useState<Range>('3mo')
  const [historyMap, setHistoryMap] = useState<Record<string, Array<{ ts: number; close: number }>>>({})
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<TerminalMetricKey>('dy')

  const tickers = assets.map((a) => a.symbol)
  const tickerKey = tickers.join(',')

  useEffect(() => {
    if (tickers.length === 0) return
    let cancelled = false
    setLoadingHistory(true)
    fetchTerminalHistory(tickers, range).then((results) => {
      if (cancelled) return
      const map: Record<string, Array<{ ts: number; close: number }>> = {}
      for (const result of results) {
        if (Array.isArray(result.history) && result.history.length > 0) {
          map[result.symbol] = result.history
            .map((p) => ({ ts: p.timestamp, close: p.close }))
            .sort((a, b) => a.ts - b.ts)
        }
      }
      setHistoryMap(map)
      setLoadingHistory(false)
    })
    return () => { cancelled = true }
  // tickerKey and range are the real deps; tickers array identity changes every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickerKey, range])

  // Build normalised % change series for each ticker
  const lineData = useMemo(() => {
    const presentTickers = tickers.filter((t) => historyMap[t]?.length)
    if (presentTickers.length === 0) return []

    // Collect all unique dates
    const allDates = new Map<number, string>()
    for (const t of presentTickers) {
      for (const p of historyMap[t]) {
        if (!allDates.has(p.ts)) {
          allDates.set(
            p.ts,
            new Date(p.ts * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
          )
        }
      }
    }

    // Baseline: first available close per ticker
    const bases: Record<string, number> = {}
    for (const t of presentTickers) {
      const first = historyMap[t][0]
      if (first) bases[t] = first.close
    }

    // Build a lookup by ts per ticker for O(1) access
    const byTs: Record<string, Map<number, number>> = {}
    for (const t of presentTickers) {
      byTs[t] = new Map(historyMap[t].map((p) => [p.ts, p.close]))
    }

    return Array.from(allDates.entries())
      .sort(([a], [b]) => a - b)
      .map(([ts, date]) => {
        const point: Record<string, number | string> = { date }
        for (const t of presentTickers) {
          const close = byTs[t].get(ts)
          if (close != null && bases[t]) {
            point[t] = parseFloat((((close - bases[t]) / bases[t]) * 100).toFixed(2))
          }
        }
        return point
      })
  }, [historyMap, tickers])

  // Build donut data from snapshot metrics
  const metricDef = TERMINAL_METRICS.find((m) => m.key === selectedMetric)
  const donutData = useMemo(() => {
    return assets
      .map((a, i) => {
        const raw = a.metrics[selectedMetric]
        return {
          symbol: a.symbol,
          value: raw != null && Number.isFinite(raw) ? Math.abs(raw) : 0,
          formatted: raw != null ? formatMetricValue(raw, metricDef!.formatter) : 'n/d',
          color: CHART_COLORS[i % CHART_COLORS.length],
          hasValue: raw != null && Number.isFinite(raw),
        }
      })
      .filter((d) => d.hasValue && d.value > 0)
  }, [assets, selectedMetric, metricDef])

  const presentInChart = tickers.filter((t) => lineData.some((p) => p[t] != null))

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* ── Historical line chart ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/35">
            Variação relativa
          </p>
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={cn(
                  'border px-2.5 py-1 text-[10px] font-bold transition',
                  range === r.key
                    ? 'border-[#8B5CF6]/40 bg-[#8B5CF6]/15 text-[#F4F0FF]'
                    : 'border-white/[0.08] text-[#F4F0FF]/40 hover:text-[#F4F0FF]'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {loadingHistory ? (
          <div className="flex h-[200px] items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border border-[#8B5CF6]/30 border-t-[#8B5CF6]" />
          </div>
        ) : lineData.length > 1 ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lineData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: 'rgba(244,240,255,0.3)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 9, fill: 'rgba(244,240,255,0.3)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v}%`}
                  width={46}
                />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                <Tooltip content={<LineTooltip />} />
                {presentInChart.map((ticker, i) => (
                  <Line
                    key={ticker}
                    type="monotone"
                    dataKey={ticker}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    dot={false}
                    strokeWidth={1.5}
                    connectNulls
                    activeDot={{ r: 3, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {presentInChart.map((ticker, i) => (
                <div key={ticker} className="flex items-center gap-1.5">
                  <span
                    className="h-px w-3 shrink-0"
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length], height: 2 }}
                  />
                  <span className="text-[10px] font-bold text-[#F4F0FF]/45">{ticker}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-xs text-[#F4F0FF]/30">
            Sem dados históricos para o período
          </div>
        )}
      </div>

      {/* ── Donut chart ── */}
      <div className="border-t border-white/[0.06] pt-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/35">
            Distribuição
          </p>
          <div className="flex flex-wrap gap-1">
            {TERMINAL_METRICS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelectedMetric(m.key)}
                className={cn(
                  'border px-2 py-0.5 text-[10px] font-bold transition',
                  selectedMetric === m.key
                    ? 'border-[#8B5CF6]/40 bg-[#8B5CF6]/15 text-[#F4F0FF]'
                    : 'border-white/[0.08] text-[#F4F0FF]/40 hover:text-[#F4F0FF]'
                )}
              >
                {m.shortLabel}
              </button>
            ))}
          </div>
        </div>

        {donutData.length >= 2 ? (
          <div className="flex items-center gap-5">
            <div className="shrink-0">
              <PieChart width={130} height={130}>
                <Pie
                  data={donutData}
                  cx={65}
                  cy={65}
                  innerRadius={40}
                  outerRadius={60}
                  dataKey="value"
                  paddingAngle={2}
                  nameKey="symbol"
                >
                  {donutData.map((entry) => (
                    <Cell key={entry.symbol} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </div>

            <div className="min-w-0 flex-1 space-y-2.5">
              {donutData.map((entry) => (
                <div key={entry.symbol} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: entry.color }}
                    />
                    <span className="text-xs font-bold text-[#F4F0FF]/65">{entry.symbol}</span>
                  </div>
                  <span className="font-mono text-xs font-bold tabular-nums text-[#F4F0FF]">
                    {entry.formatted}
                  </span>
                </div>
              ))}
              <p className="pt-1 text-[10px] text-[#F4F0FF]/20">
                {metricDef?.mode === 'lower' ? '↓ menor é melhor' : '↑ maior é melhor'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-[130px] items-center justify-center text-xs text-[#F4F0FF]/30">
            {donutData.length === 1
              ? 'Adicione mais ativos para comparar'
              : `Sem dados de ${metricDef?.label ?? selectedMetric}`}
          </div>
        )}
      </div>
    </div>
  )
}
