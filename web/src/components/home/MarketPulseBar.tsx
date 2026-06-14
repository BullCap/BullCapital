'use client'

import { useState } from 'react'
import { SparkAreaChart } from '@/components/ui/chart/spark-area-chart'
import { cn } from '@/lib/utils'
import type { HeaderMetricCell, HeaderView } from './header-views'

const EMPTY = '—'

/** Número de colunas do grid por quantidade de células (classes estáticas p/ Tailwind). */
const COLS: Record<number, string> = {
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
}

function Metric({ label, value, delta, trend = 'flat', caption, series = [] }: HeaderMetricCell) {
  const deltaClass =
    trend === 'up' ? 'text-positive' : trend === 'down' ? 'text-negative' : 'text-ink-faint'

  return (
    <div className="flex min-w-0 flex-col gap-2 border-hairline px-0 py-1 sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:pl-6">
      <p className="text-xs font-medium uppercase tracking-eyebrow text-ink-faint">{label}</p>
      <p className="text-lg font-medium tabular-nums leading-none text-ink">{value}</p>
      {delta ? (
        <p className={cn('text-sm font-medium tabular-nums leading-none', deltaClass)}>{delta}</p>
      ) : caption ? (
        <p className="text-sm font-medium leading-none text-ink-muted">{caption}</p>
      ) : (
        <p className="text-sm leading-none text-ink-faint">{EMPTY}</p>
      )}
      <SparkAreaChart data={series} trend={trend} height={28} className="mt-1" />
    </div>
  )
}

/**
 * MarketPulseBar — faixa de pulso do header sobre superfície flat (sem moldura).
 * Multi-view: botões alternam entre Macro, Carteiras e Renda Fixa; cada view é
 * um conjunto de células já formatadas no servidor (ver buildHeaderViews). Só os
 * separadores verticais finos entre as células dividem o espaço.
 */
export default function MarketPulseBar({ views }: { views: HeaderView[] }) {
  const [activeId, setActiveId] = useState(views[0]?.id)
  const active = views.find((view) => view.id === activeId) ?? views[0]
  if (!active) return null

  return (
    <section className="px-1">
      <div className="mb-5 inline-flex items-center gap-0.5 rounded-control border border-hairline p-0.5">
        {views.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => setActiveId(view.id)}
            data-active={view.id === active.id}
            className="rounded-[7px] px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink data-[active=true]:bg-white/[0.06] data-[active=true]:text-ink"
          >
            {view.label}
          </button>
        ))}
      </div>

      <div
        className={cn(
          'grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:gap-y-0',
          COLS[active.cells.length] ?? 'lg:grid-cols-5'
        )}
      >
        {active.cells.map((cell) => (
          <Metric key={cell.label} {...cell} />
        ))}
      </div>
    </section>
  )
}
