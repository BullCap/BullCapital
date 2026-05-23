'use client'

import { useState, useEffect } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { fetchAssetHistory } from '@/lib/actions/market'
import type { AssetHistoricalPrice } from '@/types/market'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import { getMockAssetHistory } from '@/lib/market-history.mock'

type Range = '1d' | '1mo' | '3mo'

const RANGE_LABELS: Record<Range, string> = {
  '1d': '1D',
  '1mo': '1M',
  '3mo': '3M',
}

interface PriceChartClientProps {
  ticker: string
  initialHistory: AssetHistoricalPrice[]
  quotePrice: number | null
  quoteChangePercent: number | null
  isMarketOpen: boolean
}

const MIN_SERIES_POINTS = 12

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function PriceTooltip({
  active,
  payload,
  label,
  chartTone,
}: {
  active?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[]
  label?: string
  chartTone: string
}) {
  if (!active || !payload?.length) return null

  const point = payload[0]?.payload as { close?: number; high?: number; low?: number } | undefined
  const close = typeof point?.close === 'number' ? point.close : undefined
  const high = typeof point?.high === 'number' ? point.high : undefined
  const low = typeof point?.low === 'number' ? point.low : undefined

  return (
    <div
      style={{
        background: '#111827',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '1rem',
        color: '#F4F0FF',
        fontSize: 12,
        padding: '10px 12px',
      }}
    >
      <div style={{ color: 'rgba(244,240,255,0.55)', fontSize: 11, marginBottom: 6 }}>{label}</div>
      {typeof close === 'number' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ color: 'rgba(244,240,255,0.8)' }}>Preço</span>
          <span style={{ color: chartTone }}>{formatBRL(close)}</span>
        </div>
      )}
      {typeof high === 'number' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 6 }}>
          <span style={{ color: 'rgba(244,240,255,0.8)' }}>Máxima</span>
          <span style={{ color: 'rgba(244,240,255,0.9)' }}>{formatBRL(high)}</span>
        </div>
      )}
      {typeof low === 'number' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 6 }}>
          <span style={{ color: 'rgba(244,240,255,0.8)' }}>Mínima</span>
          <span style={{ color: 'rgba(244,240,255,0.9)' }}>{formatBRL(low)}</span>
        </div>
      )}
    </div>
  )
}

function resolveHistory(
  history: AssetHistoricalPrice[],
  range: Range,
  quotePrice: number | null,
  quoteChangePercent: number | null
) {
  if (history.length >= MIN_SERIES_POINTS) {
    return { history, isMock: false }
  }

  const anchorPrice = history[history.length - 1]?.close ?? quotePrice

  return {
    history: getMockAssetHistory(range, anchorPrice, quoteChangePercent),
    isMock: true,
  }
}

export default function PriceChartClient({
  ticker,
  initialHistory,
  quotePrice,
  quoteChangePercent,
  isMarketOpen,
}: PriceChartClientProps) {
  const initialSeries = resolveHistory(initialHistory, '1mo', quotePrice, quoteChangePercent)
  const [range, setRange] = useState<Range>('1mo')
  const [history, setHistory] = useState<AssetHistoricalPrice[]>(initialSeries.history)
  const [isMockHistory, setIsMockHistory] = useState(initialSeries.isMock)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (range === '1mo') {
      const series = resolveHistory(initialHistory, range, quotePrice, quoteChangePercent)
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
            result.results?.[0]?.history ?? [],
            range,
            quotePrice,
            quoteChangePercent
          )
          setHistory(series.history)
          setIsMockHistory(series.isMock)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHistory(getMockAssetHistory(range, quotePrice, quoteChangePercent))
          setIsMockHistory(true)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [initialHistory, quoteChangePercent, quotePrice, range, ticker])

  const chartData = history.map((h) => {
    const d = new Date(h.timestamp * 1000)
    const date =
      range === '1d'
        ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    return { date, close: h.close, high: h.high, low: h.low }
  })
  const priceMove =
    chartData.length > 1 ? chartData[chartData.length - 1].close - chartData[0].close : 0
  const chartTone = priceMove >= 0 ? '#4ADE80' : '#FB7185'
  const chartGradientId = priceMove >= 0 ? 'bull-price-rise' : 'bull-price-dip'

  const highs = history
    .map((h) => (typeof h.high === 'number' ? h.high : h.close))
    .filter((value) => Number.isFinite(value) && value > 0)
  const lows = history
    .map((h) => (typeof h.low === 'number' ? h.low : h.close))
    .filter((value) => Number.isFinite(value) && value > 0)
  const seriesHigh = highs.length > 0 ? Math.max(...highs) : null
  const seriesLow = lows.length > 0 ? Math.min(...lows) : null

  return (
    <section className="bull-panel p-5">
      <GlassHighlight widthPercent={65} />

      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="bull-eyebrow">Histórico de Preço</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#DBEAFE]/45">
            {isMockHistory && <span>Série modelo</span>}
            {typeof seriesHigh === 'number' && seriesHigh > 0 && <span>Máxima: {formatBRL(seriesHigh)}</span>}
            {typeof seriesLow === 'number' && seriesLow > 0 && <span>Mínima: {formatBRL(seriesLow)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isMockHistory && (
            <span className="rounded-full border border-[#60A5FA]/20 bg-[#3B82F6]/10 px-2 py-1 text-[10px] text-[#DBEAFE]/70">
              Modelo
            </span>
          )}
          {!isMarketOpen && range === '1d' && (
            <span className="rounded-full border border-[#F43F5E]/30 bg-[#F43F5E]/10 px-2 py-0.5 text-[10px] text-[#F43F5E]">
              Mercado fechado
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 inline-flex rounded-[1.1rem] border border-white/[0.08] bg-black/20 p-1 shadow-[inset_0_2px_8px_rgba(0,0,0,0.38)]">
        {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`relative min-h-9 min-w-[3rem] rounded-[0.85rem] px-3 py-1 text-xs font-medium transition-colors ${
              range === r ? 'text-[#F4F0FF]' : 'text-[#F4F0FF]/40 hover:text-[#F4F0FF]/70'
            }`}
          >
            {range === r && (
              <span className="absolute inset-0 rounded-[0.85rem] border border-[#60A5FA]/25 bg-[#3B82F6]/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_20px_rgba(59,130,246,0.16)]" />
            )}
            <span className="relative z-10">{RANGE_LABELS[r]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-[224px] items-center justify-center">
          <p className="text-sm text-[#F4F0FF]/40">Carregando...</p>
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex h-[224px] items-center justify-center">
          <p className="text-sm text-[#F4F0FF]/40">Histórico indisponível</p>
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-white/[0.06] bg-black/15 pb-2 pt-4 shadow-[inset_0_1px_18px_rgba(0,0,0,0.32)]">
          <ResponsiveContainer width="100%" height={224}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={chartGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartTone} stopOpacity={0.34} />
                  <stop offset="70%" stopColor={chartTone} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={chartTone} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#F4F0FF', fontSize: 10, opacity: 0.4 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: '#F4F0FF', fontSize: 10, opacity: 0.4 }}
                axisLine={false}
                tickLine={false}
                width={65}
                tickFormatter={(v: number) =>
                  v.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }
              />
              <Tooltip
                cursor={{ stroke: 'rgba(219,234,254,0.18)', strokeDasharray: '4 4' }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                content={(props: any) => <PriceTooltip {...props} chartTone={chartTone} />}
              />
              <Area
                type="linear"
                dataKey="close"
                stroke={chartTone}
                strokeWidth={2.5}
                fill={`url(#${chartGradientId})`}
                dot={false}
                activeDot={{ r: 4, fill: chartTone, stroke: '#080B12', strokeWidth: 2 }}
                isAnimationActive
                animationDuration={850}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <Link
        href={`/analysis?ticker=${ticker}`}
        className="mt-4 flex min-h-12 items-center justify-between gap-3 rounded-[1.5rem] border border-[#60A5FA]/15 bg-[#3B82F6]/10 px-4 text-sm text-[#F4F0FF]/80 transition hover:border-[#60A5FA]/30 hover:bg-[#3B82F6]/15"
      >
        <span>
          <span className="block text-xs text-[#DBEAFE]/45">Advisor</span>
          Explicar movimento
        </span>
        <ArrowUpRight size={16} />
      </Link>
    </section>
  )
}
