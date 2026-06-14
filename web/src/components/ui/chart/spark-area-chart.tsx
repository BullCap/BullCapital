'use client'

import { Area, AreaChart, ResponsiveContainer } from 'recharts'

export type SparkTrend = 'up' | 'down' | 'flat'

const TREND_COLOR: Record<SparkTrend, string> = {
  up: 'var(--color-positive)',
  down: 'var(--color-negative)',
  flat: 'var(--color-ink-faint)',
}

interface SparkAreaChartProps {
  data: number[]
  trend?: SparkTrend
  height?: number
  className?: string
}

/**
 * SparkAreaChart — sparkline estilo Tremor Raw sobre recharts: sem eixos, sem
 * grid, stroke fino, fill em gradiente curto. Cor derivada do trend (tokens
 * positive/negative/ink-faint). Consome a paleta de séries do design system.
 */
export function SparkAreaChart({ data, trend = 'flat', height = 32, className }: SparkAreaChartProps) {
  if (data.length < 2) return null

  const color = TREND_COLOR[trend]
  const chartData = data.map((value, index) => ({ index, value }))
  const gradientId = `spark-fill-${trend}`

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
