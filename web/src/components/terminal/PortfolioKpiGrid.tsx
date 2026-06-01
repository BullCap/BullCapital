'use client'

import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts'
import { cn } from '@/lib/utils'
import type { PortfolioKpi } from './portfolioMock'
import { formatPercentValue, toneClass } from './portfolio-format'

interface PortfolioKpiGridProps {
  kpis: PortfolioKpi[]
}

export default function PortfolioKpiGrid({ kpis }: PortfolioKpiGridProps) {
  if (kpis.length === 0) {
    return (
      <section className="bull-frame p-5 text-sm text-[#F4F0FF]/45">
        Sem indicadores consolidados para esta carteira.
      </section>
    )
  }

  return (
    <section className="bull-frame p-3 md:p-4">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <p className="bull-eyebrow">Resumo financeiro</p>
        <span className="text-xs text-starlight/35">{kpis.length} métricas</span>
      </div>
      <div className="grid gap-0 divide-y divide-white/[0.06] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 2xl:grid-cols-8">
      {kpis.map((kpi) => {
        const positiveVariation = kpi.variation >= 0
        return (
          <article key={kpi.label} className="relative min-h-[7.75rem] p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p
                  title={kpi.label}
                  className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-[#F4F0FF]/35"
                >
                  {kpi.label}
                </p>
                <p className="mt-1.5 font-sans text-xl font-medium tabular-nums text-[#F4F0FF]">
                  {kpi.value}
                </p>
              </div>
              <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium', toneClass(kpi.tone))}>
                {kpi.badge}
              </span>
            </div>

            <div className="mt-2.5 flex items-end gap-3">
              <div className="h-7 min-w-0 flex-1" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={kpi.sparkline.map((value, index) => ({ index, value }))}>
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                    <Line
                      type="monotone"
                      dataKey="value"
                      dot={false}
                      stroke={positiveVariation ? '#7fb59a' : '#c98c9a'}
                      strokeWidth={1.8}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <span
                className={cn(
                  'font-mono text-xs font-bold tabular-nums',
                  positiveVariation ? 'text-[#7fb59a]' : 'text-[#c98c9a]'
                )}
              >
                {formatPercentValue(kpi.variation, { signed: true })}
              </span>
            </div>
          </article>
        )
      })}
      </div>
    </section>
  )
}
