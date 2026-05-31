'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'
import type { ChartMode, PerformancePoint } from './portfolioMock'
import { formatCompactMoney, formatMoney, formatPercentValue } from './portfolio-format'

interface PortfolioPerformanceChartProps {
  data: PerformancePoint[]
  mode: ChartMode
  benchmark: 'CDI' | 'Ibovespa' | 'S&P 500'
  onModeChange: (mode: ChartMode) => void
}

const modes: Array<{ key: ChartMode; label: string }> = [
  { key: 'patrimonio', label: 'Patrimônio' },
  { key: 'retorno', label: 'Retorno acumulado' },
  { key: 'pnl', label: 'P&L' },
]

function benchmarkKey(benchmark: PortfolioPerformanceChartProps['benchmark']): 'cdi' | 'ibov' | 'sp500' {
  if (benchmark === 'Ibovespa') return 'ibov'
  if (benchmark === 'S&P 500') return 'sp500'
  return 'cdi'
}

function PerformanceTooltip({
  active,
  payload,
  label,
  benchmark,
}: {
  active?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[]
  label?: string
  benchmark: PortfolioPerformanceChartProps['benchmark']
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload as PerformancePoint | undefined
  if (!point) return null
  const benchmarkValue = point[benchmarkKey(benchmark)]
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0D0B14] px-3 py-2 text-[11px] shadow-[0_18px_44px_rgba(0,0,0,0.55)]">
      <p className="mb-2 font-bold text-[#F4F0FF]/45">{label}</p>
      <div className="space-y-1.5">
        <div className="flex gap-4">
          <span className="text-[#F4F0FF]/45">Patrimônio</span>
          <span className="ml-auto font-mono font-bold text-[#F4F0FF]">{formatMoney(point.patrimonio)}</span>
        </div>
        <div className="flex gap-4">
          <span className="text-[#F4F0FF]/45">Retorno</span>
          <span className="ml-auto font-mono font-bold text-emerald-200">
            {formatPercentValue(point.retorno, { signed: true })}
          </span>
        </div>
        <div className="flex gap-4">
          <span className="text-[#F4F0FF]/45">{benchmark}</span>
          <span className="ml-auto font-mono font-bold text-[#C4B5FD]">
            {formatPercentValue(benchmarkValue, { signed: true })}
          </span>
        </div>
        <div className="flex gap-4 border-t border-white/[0.06] pt-1.5">
          <span className="text-[#F4F0FF]/45">Diferença</span>
          <span className="ml-auto font-mono font-bold text-[#F4F0FF]">
            {formatPercentValue(point.retorno - benchmarkValue, { signed: true })}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function PortfolioPerformanceChart({
  data,
  mode,
  benchmark,
  onModeChange,
}: PortfolioPerformanceChartProps) {
  const benchmarkDataKey = benchmarkKey(benchmark)
  const yTickFormatter = (value: number) => {
    if (mode === 'patrimonio' || mode === 'pnl') return formatCompactMoney(value)
    return `${value}%`
  }

  return (
    <section className="bull-panel flex flex-col p-4 md:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="bull-eyebrow">Evolução patrimonial</p>
          <h2 className="mt-0.5 font-serif text-xl text-[#F4F0FF]">Performance consolidada</h2>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-white/[0.08] bg-[#0D0B14]/70 p-1">
          {modes.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onModeChange(item.key)}
              className={cn(
                'h-8 rounded-md px-3 text-[11px] font-bold transition focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/40',
                mode === item.key
                  ? 'bg-[#8B5CF6]/20 text-[#F4F0FF]'
                  : 'text-[#F4F0FF]/40 hover:text-[#F4F0FF]/75'
              )}
              aria-pressed={mode === item.key}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {data.length > 0 ? (
        <div className="h-[300px] flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.045)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'rgba(244,240,255,0.35)' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'rgba(244,240,255,0.35)' }}
                tickLine={false}
                axisLine={false}
                width={74}
                tickFormatter={yTickFormatter}
              />
              <Tooltip content={<PerformanceTooltip benchmark={benchmark} />} />
              <Area
                type="monotone"
                dataKey={mode}
                stroke="#8B5CF6"
                fill="url(#portfolioArea)"
                strokeWidth={2.2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: '#C4B5FD' }}
              />
              {mode === 'retorno' && (
                <Line
                  type="monotone"
                  dataKey={benchmarkDataKey}
                  stroke="#F59E0B"
                  strokeWidth={1.6}
                  dot={false}
                  strokeDasharray="4 4"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-[300px] flex-1 items-center justify-center text-sm text-[#F4F0FF]/45">
          Sem histórico consolidado para o período selecionado.
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-4 text-[11px] font-bold text-[#F4F0FF]/45">
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-5 bg-[#8B5CF6]" />
          Carteira
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-5 border-t border-dashed border-[#F59E0B]" />
          {benchmark}
        </span>
      </div>
    </section>
  )
}
