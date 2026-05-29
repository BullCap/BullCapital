'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { fetchAssetHistory } from '@/lib/actions/market'
import type { AssetHistoricalPrice } from '@/types/market'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

export function PriceChartSkeleton() {
  return (
    <section className="bull-panel p-4 md:p-5" aria-hidden="true">
      <GlassHighlight widthPercent={65} />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="bull-eyebrow">Preço</p>
          <div className="mt-1.5 flex gap-3">
            <div className="h-2.5 w-24 animate-pulse rounded-full bg-white/[0.05]" />
            <div className="h-2.5 w-20 animate-pulse rounded-full bg-white/[0.04]" style={{ animationDelay: '40ms' }} />
          </div>
        </div>
        <div className="inline-flex rounded-xl border border-white/[0.08] bg-black/20 p-0.5">
          {['1D', '1M', '3M', '6M', '1A'].map((label, i) => (
            <div
              key={label}
              className="min-h-8 min-w-10 rounded-lg px-2.5 text-xs font-medium text-[#F4F0FF]/20 flex items-center justify-center"
            >
              {label}
            </div>
          ))}
        </div>
      </div>
      <div
        className="h-[260px] animate-pulse rounded-2xl bg-white/[0.04]"
        style={{ animationDelay: '80ms' }}
      />
    </section>
  )
}

type Range = '1d' | '1mo' | '3mo' | '6mo' | '1y'

const RANGE_LABELS: Record<Range, string> = {
  '1d': '1D',
  '1mo': '1M',
  '3mo': '3M',
  '6mo': '6M',
  '1y': '1A',
}
const COLOR_UP = '#22C55E'
const COLOR_DOWN = '#EF4444'

interface PriceChartClientProps {
  ticker: string
  initialHistory: AssetHistoricalPrice[]
  isMarketOpen: boolean
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function PriceTooltip({
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

  // Resolve data from the first non-null payload entry
  const raw = (payload.find((p) => p.dataKey === 'close') ?? payload[0])
    ?.payload as { close?: number; high?: number; low?: number; isUp?: boolean } | undefined

  const close = typeof raw?.close === 'number' ? raw.close : undefined
  const high = typeof raw?.high === 'number' ? raw.high : undefined
  const low = typeof raw?.low === 'number' ? raw.low : undefined
  const color = raw?.isUp ? COLOR_UP : COLOR_DOWN

  return (
    <div
      style={{
        background: 'rgba(10,8,20,0.96)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '0.875rem',
        color: '#F4F0FF',
        fontSize: 12,
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        minWidth: 148,
      }}
    >
      <div style={{ color: 'rgba(244,240,255,0.42)', fontSize: 10, marginBottom: 8, letterSpacing: '0.04em' }}>
        {label}
      </div>
      {typeof close === 'number' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: 'rgba(244,240,255,0.6)' }}>Fechamento</span>
          <span style={{ color, fontWeight: 600 }}>{formatBRL(close)}</span>
        </div>
      )}
      {typeof high === 'number' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 5 }}>
          <span style={{ color: 'rgba(244,240,255,0.6)' }}>Máxima</span>
          <span style={{ color: 'rgba(244,240,255,0.85)' }}>{formatBRL(high)}</span>
        </div>
      )}
      {typeof low === 'number' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 5 }}>
          <span style={{ color: 'rgba(244,240,255,0.6)' }}>Mínima</span>
          <span style={{ color: 'rgba(244,240,255,0.85)' }}>{formatBRL(low)}</span>
        </div>
      )}
    </div>
  )
}

function resolveHistory(
  history: AssetHistoricalPrice[],
) {
  if (history && history.length > 0) return { history, isMock: false }
  return { history: [], isMock: false }
}

function buildDomain(closes: number[]): [number, number] {
  if (closes.length === 0) return [0, 100]
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const pad = (max - min) * 0.08 || max * 0.015
  return [min - pad, max + pad]
}

function CustomActiveDot(props: {
  cx?: number
  cy?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any
}) {
  const { cx, cy, payload } = props
  if (typeof cx !== 'number' || typeof cy !== 'number' || !payload) return null
  const dotColor = payload.isUp ? COLOR_UP : COLOR_DOWN

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={dotColor}
      stroke="#080B12"
      strokeWidth={2}
    />
  )
}

export default function PriceChartClient({
  ticker,
  initialHistory,
  isMarketOpen,
}: PriceChartClientProps) {
  const initialSeries = resolveHistory(initialHistory)
  const [range, setRange] = useState<Range>('1mo')
  const [history, setHistory] = useState<AssetHistoricalPrice[]>(initialSeries.history)
  const [isMockHistory, setIsMockHistory] = useState(initialSeries.isMock)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (range === '1mo') {
      const series = resolveHistory(initialHistory)
      setHistory(series.history)
      setIsMockHistory(series.isMock)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    fetchAssetHistory(ticker, range)
      .then((result) => {
        if (!cancelled) {
          const series = resolveHistory(
            result.results?.[0]?.history ?? []
          )
          setHistory(series.history)
          setIsMockHistory(series.isMock)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHistory([])
          setIsMockHistory(true)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [initialHistory, range, ticker])

  const { chartData, refPrice, seriesHigh, seriesLow, maxVal, minVal } = useMemo(() => {
    const ref = history[0]?.close ?? null

    const data = history.map((h) => {
      const d = new Date(h.timestamp * 1000)
      const date =
        range === '1d'
          ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

      const close = h.close
      // Clamp datasets for split-color areas, anchored at ref
      const closeAbove = ref !== null ? Math.max(close, ref) : close
      const closeBelow = ref !== null ? Math.min(close, ref) : close
      const isUp = ref !== null ? close >= ref : true

      return { date, close, high: h.high, low: h.low, closeAbove, closeBelow, isUp }
    })

    const highs = history.map((h) => h.high ?? h.close).filter((v) => Number.isFinite(v) && v > 0)
    const lows = history.map((h) => h.low ?? h.close).filter((v) => Number.isFinite(v) && v > 0)
    const closes = history.map((h) => h.close).filter((v) => Number.isFinite(v) && v > 0)

    return {
      chartData: data,
      refPrice: ref,
      seriesHigh: highs.length > 0 ? Math.max(...highs) : null,
      seriesLow: lows.length > 0 ? Math.min(...lows) : null,
      maxVal: closes.length > 0 ? Math.max(...closes) : null,
      minVal: closes.length > 0 ? Math.min(...closes) : null,
    }
  }, [history, range])

  const closes = chartData.map((d) => d.close).filter((v): v is number => Number.isFinite(v))
  const [domainMin, domainMax] = buildDomain(closes)

  const baselinePercent = useMemo(() => {
    if (refPrice === null || maxVal === null || minVal === null || maxVal === minVal) return 0.5
    const pct = (maxVal - refPrice) / (maxVal - minVal)
    return Math.max(0, Math.min(1, pct))
  }, [refPrice, maxVal, minVal])

  return (
    <section className="bull-panel p-4 md:p-5">
      <GlassHighlight widthPercent={65} />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="bull-eyebrow">Preço</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#DBEAFE]/45">
            {isMockHistory && <span>Série indisponível na fonte</span>}
            {typeof seriesHigh === 'number' && seriesHigh > 0 && (
              <span>Máxima: {formatBRL(seriesHigh)}</span>
            )}
            {typeof seriesLow === 'number' && seriesLow > 0 && (
              <span>Mínima: {formatBRL(seriesLow)}</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {isMockHistory && (
            <span className="rounded-full border border-[#60A5FA]/20 bg-[#3B82F6]/10 px-2 py-1 text-[10px] text-[#DBEAFE]/70">
              Indisponível
            </span>
          )}
          {!isMarketOpen && range === '1d' && (
            <span className="rounded-full border border-[#F43F5E]/30 bg-[#F43F5E]/10 px-2 py-0.5 text-[10px] text-[#F43F5E]">
              Mercado fechado
            </span>
          )}
          <div className="inline-flex rounded-xl border border-white/[0.08] bg-black/20 p-0.5">
            {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`relative min-h-8 min-w-10 rounded-lg px-2.5 text-xs font-medium transition-colors ${
                  range === r ? 'bg-[#3B82F6]/18 text-[#F4F0FF]' : 'text-[#F4F0FF]/40 hover:text-[#F4F0FF]/70'
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[260px] items-center justify-center">
          <p className="text-sm text-[#F4F0FF]/40">Carregando...</p>
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center">
          <p className="text-sm text-[#F4F0FF]/40">Histórico indisponível</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-black/15 pb-2 pt-3 shadow-[inset_0_1px_14px_rgba(0,0,0,0.28)]">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                {/* Green fill — fades downward from line toward reference */}
                <linearGradient id="bull-area-up" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLOR_UP} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={COLOR_UP} stopOpacity={0.02} />
                </linearGradient>
                {/* Red fill — fades upward from line toward reference */}
                <linearGradient id="bull-area-down" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLOR_DOWN} stopOpacity={0.02} />
                  <stop offset="100%" stopColor={COLOR_DOWN} stopOpacity={0.28} />
                </linearGradient>
                {/* Split stroke line — green above baseline, red below */}
                <linearGradient id="bull-stroke-split" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLOR_UP} />
                  <stop offset={`${baselinePercent * 100}%`} stopColor={COLOR_UP} />
                  <stop offset={`${baselinePercent * 100}%`} stopColor={COLOR_DOWN} />
                  <stop offset="100%" stopColor={COLOR_DOWN} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="rgba(255,255,255,0.042)" vertical={false} />

              <XAxis
                dataKey="date"
                tick={{ fill: '#F4F0FF', fontSize: 10, opacity: 0.36 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[domainMin, domainMax]}
                tick={{ fill: '#F4F0FF', fontSize: 10, opacity: 0.36 }}
                axisLine={false}
                tickLine={false}
                width={65}
                tickFormatter={(v: number) =>
                  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                }
              />

              {/* Reference line — opening price of the selected range */}
              {refPrice !== null && (
                <ReferenceLine
                  y={refPrice}
                  stroke="rgba(255,255,255,0.18)"
                  strokeDasharray="4 3"
                  strokeWidth={1}
                />
              )}

              <Tooltip
                cursor={{ stroke: 'rgba(219,234,254,0.14)', strokeWidth: 1, strokeDasharray: '4 3' }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                content={(props: any) => <PriceTooltip {...props} />}
              />

              {/* Green area: clamped at refPrice from below — only shows above reference */}
              <Area
                type="linear"
                dataKey="closeAbove"
                baseValue={refPrice ?? undefined}
                stroke="none"
                fill="url(#bull-area-up)"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                legendType="none"
              />

              {/* Red area: clamped at refPrice from above — only shows below reference */}
              <Area
                type="linear"
                dataKey="closeBelow"
                baseValue={refPrice ?? undefined}
                stroke="none"
                fill="url(#bull-area-down)"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                legendType="none"
              />

              {/* Price line — rendered on top, dual stroke color by baseline transition */}
              <Area
                type="linear"
                dataKey="close"
                stroke="url(#bull-stroke-split)"
                strokeWidth={2}
                fill="none"
                dot={false}
                activeDot={<CustomActiveDot />}
                isAnimationActive
                animationDuration={700}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
