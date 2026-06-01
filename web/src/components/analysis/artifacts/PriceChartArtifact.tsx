'use client'

import { useEffect, useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import { fetchAssetHistory } from '@/lib/actions/market'
import type { AssetHistoricalPrice } from '@/types/market'

type Range = '1d' | '1mo' | '3mo'

interface PriceChartArtifactProps {
  ticker: string
  title?: string
  range?: Range | '1y'
  chartNote?: string
}

const RANGE_LABELS: Record<Range, string> = { '1d': '1D', '1mo': '1M', '3mo': '3M' }
const SHIMMER_HEIGHTS = [40, 58, 44, 68, 52, 76, 62, 72, 58, 82, 68, 88]

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function PriceChartArtifact({ ticker, title, range = '1mo', chartNote }: PriceChartArtifactProps) {
  const [data, setData] = useState<AssetHistoricalPrice[]>([])
  const [activeRange, setActiveRange] = useState<Range>(range === '1y' ? '3mo' : range)
  const [isUnavailable, setIsUnavailable] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    fetchAssetHistory(ticker, activeRange)
      .then((res) => {
        const result =
          res?.results?.find((r) => r.symbol === ticker) ??
          res?.results?.find((r) => r.symbol?.toUpperCase() === ticker.toUpperCase()) ??
          res?.results?.[0]

        if (cancelled) return

        const history = result?.history ?? []
        if (history.length > 0) {
          setData(history)
          setIsUnavailable(false)
          return
        }

        setData([])
        setIsUnavailable(true)
      })
      .catch(() => {
        if (!cancelled) {
          setData([])
          setIsUnavailable(true)
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
  }, [ticker, activeRange])

  const first = data[0]?.close ?? 0
  const last = data[data.length - 1]?.close ?? 0
  const positive = last >= first
  const stroke = positive ? '#7fb59a' : '#c98c9a'
  // Sanitise ticker so special chars (e.g. ^ in ^BVSP) don't break SVG id / url() refs
  const gradId = `pchart-${ticker.replace(/[^a-zA-Z0-9]/g, '_')}-${activeRange}`

  return (
    <section className="bull-frame p-5">
      <GlassHighlight widthPercent={55} />

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="bull-eyebrow">Série de preços</p>
          {title && <h3 className="mt-1.5 font-serif text-lg text-[#F4F0FF]">{title}</h3>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isUnavailable && (
            <span className="mr-1 rounded-full border border-white/[0.06] bg-white/[0.025] px-2 py-1 text-[10px] text-starlight/55">
              Indisponível
            </span>
          )}
          {(['1d', '1mo', '3mo'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setActiveRange(r)}
              className={`rounded-lg px-2 py-1 text-[11px] transition ${
                activeRange === r
                  ? 'bg-white/[0.065] text-starlight'
                  : 'text-[#F4F0FF]/35 hover:text-[#F4F0FF]/60'
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-white/[0.06] bg-black/15 shadow-[inset_0_1px_18px_rgba(0,0,0,0.3)]">
        {loading ? (
          /* Shimmer skeleton that looks like bars */
          <div className="flex h-[160px] items-end gap-[3px] px-4 pb-4 pt-6">
            {SHIMMER_HEIGHTS.map((h, i) => (
              <div
                key={i}
                className="flex-1 animate-pulse rounded-sm bg-white/[0.07]"
                style={{ height: `${h}%`, animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
        ) : data.length < 2 ? (
          <div className="flex h-[160px] items-center justify-center">
            <p className="text-xs text-[#F4F0FF]/30">Série histórica indisponível</p>
          </div>
        ) : (
          <div className="px-1 pb-2 pt-4">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stroke} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={stroke} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip
                  contentStyle={{
                    background: '#111827',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem',
                    fontSize: 12,
                    color: '#F4F0FF',
                  }}
                  formatter={(v) => [formatBRL(Number(v)), ticker]}
                  labelFormatter={() => ''}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={stroke}
                  strokeWidth={2}
                  fill={`url(#${gradId})`}
                  dot={false}
                  isAnimationActive
                  animationDuration={700}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {chartNote && (
        <p className="mt-3 text-xs leading-5 text-[#F4F0FF]/45">{chartNote}</p>
      )}
    </section>
  )
}
