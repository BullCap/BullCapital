import { cn } from '@/lib/utils'
import type { CorrelationCell, RiskMetric } from './portfolioMock'
import { toneClass } from './portfolio-format'

interface RiskOverviewProps {
  metrics: RiskMetric[]
  correlation: CorrelationCell[]
}

function correlationColor(value: number): string {
  if (value >= 0.7) return 'rgba(244,63,94,0.34)'
  if (value >= 0.45) return 'rgba(245,158,11,0.28)'
  if (value >= 0.25) return 'rgba(139,92,246,0.24)'
  return 'rgba(34,211,238,0.18)'
}

export default function RiskOverview({ metrics, correlation }: RiskOverviewProps) {
  return (
    <section className="bull-panel p-4 md:p-5">
      <div className="mb-4">
        <p className="bull-eyebrow">Risco</p>
        <h2 className="mt-0.5 font-serif text-lg text-[#F4F0FF]">Concentração e correlação</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {metrics.map((metric) => (
          <article key={metric.label} className="bull-panel-quiet p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-[#F4F0FF]/45">{metric.label}</p>
                <p className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-[#F4F0FF]">
                  {metric.value}
                </p>
              </div>
              <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold', toneClass(metric.tone))}>
                {metric.tone}
              </span>
            </div>
            <p className="mt-2 truncate text-xs text-[#F4F0FF]/40">{metric.detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-3 bull-panel-quiet p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-[#F4F0FF]">Mapa simples de correlação</h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/25">
            Pares líquidos
          </span>
        </div>
        {correlation.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {correlation.map((cell) => (
              <div
                key={`${cell.left}-${cell.right}`}
                className="rounded-lg border border-white/[0.06] px-3 py-2"
                style={{ backgroundColor: correlationColor(cell.value) }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs font-bold text-[#F4F0FF]">
                    {cell.left} / {cell.right}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#F4F0FF]">
                    {cell.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-24 items-center justify-center text-sm text-[#F4F0FF]/40">
            Sem matriz de correlação disponível.
          </div>
        )}
      </div>
    </section>
  )
}
