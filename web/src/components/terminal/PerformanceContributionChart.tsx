'use client'

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PerformanceContribution } from './portfolioMock'
import { formatMoney, formatPercentValue } from './portfolio-format'

interface PerformanceContributionChartProps {
  top: PerformanceContribution[]
  detractors: PerformanceContribution[]
}

function ContributionTooltip({
  active,
  payload,
}: {
  active?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[]
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload as PerformanceContribution | undefined
  if (!item) return null
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0D0B14] px-3 py-2 text-[11px] shadow-lg">
      <p className="font-mono font-bold text-[#F4F0FF]">{item.symbol}</p>
      <p className="mt-1 text-[#F4F0FF]/55">{item.name}</p>
      <p className="mt-2 font-mono font-bold text-[#F4F0FF]">{formatMoney(item.impactValue)}</p>
      <p className="font-mono text-[#F4F0FF]/55">{formatPercentValue(item.impactPct, { signed: true })}</p>
    </div>
  )
}

function ContributionBlock({
  title,
  data,
  positive,
}: {
  title: string
  data: PerformanceContribution[]
  positive: boolean
}) {
  return (
    <div className="bull-panel-quiet p-4">
      <h3 className="mb-3 text-sm font-bold text-[#F4F0FF]">{title}</h3>
      {data.length > 0 ? (
        <div className="h-[210px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 10 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: 'rgba(244,240,255,0.35)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis
                dataKey="symbol"
                type="category"
                tick={{ fontSize: 11, fill: 'rgba(244,240,255,0.65)', fontWeight: 700 }}
                tickLine={false}
                axisLine={false}
                width={58}
              />
              <Tooltip content={<ContributionTooltip />} />
              <Bar dataKey="impactPct" radius={[0, 6, 6, 0]} barSize={14}>
                {data.map((item) => (
                  <Cell key={item.symbol} fill={positive ? '#8B5CF6' : '#F43F5E'} opacity={positive ? 0.9 : 0.78} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-[210px] items-center justify-center text-xs text-[#F4F0FF]/35">
          Sem contribuição mensurada.
        </div>
      )}
    </div>
  )
}

export default function PerformanceContributionChart({
  top,
  detractors,
}: PerformanceContributionChartProps) {
  return (
    <section className="bull-panel p-4 md:p-5">
      <div className="mb-4">
        <p className="bull-eyebrow">Explicação do retorno</p>
        <h2 className="mt-0.5 font-serif text-lg text-[#F4F0FF]">Contribuição de performance</h2>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <ContributionBlock title="Top contribuidores" data={top} positive />
        <ContributionBlock title="Maiores detratores" data={detractors} positive={false} />
      </div>
    </section>
  )
}
