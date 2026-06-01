'use client'

import { AlertTriangle, ArrowUpRight, Brain, Info, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AiInsight } from './portfolioMock'
import { severityClass } from './portfolio-format'

interface AiInsightsPanelProps {
  insights: AiInsight[]
  onOpenTicker?: (ticker: string) => void
}

function SeverityIcon({ severity }: { severity: AiInsight['severity'] }) {
  if (severity === 'critico') return <ShieldAlert size={14} />
  if (severity === 'atencao') return <AlertTriangle size={14} />
  return <Info size={14} />
}

export default function AiInsightsPanel({ insights, onOpenTicker }: AiInsightsPanelProps) {
  return (
    <aside className="bull-frame flex h-full flex-col p-4 md:p-5">
      <div className="mb-4 flex shrink-0 items-center gap-2">
        <Brain size={16} className="text-starlight/45" />
        <div>
          <p className="bull-eyebrow">Curadoria</p>
          <h2 className="mt-1 font-serif text-lg text-[#F4F0FF]">Insights da IA</h2>
        </div>
      </div>

      {insights.length > 0 ? (
        <div className="bull-scroll min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
          {insights.map((insight) => (
            <article key={insight.id} className="bull-panel-quiet p-3.5">
              <div className="mb-2 flex items-start justify-between gap-3">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-widest',
                    severityClass(insight.severity)
                  )}
                >
                  <SeverityIcon severity={insight.severity} />
                  {insight.category}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/25">
                  {insight.severity}
                </span>
              </div>
              <h3 className="text-sm font-bold leading-5 text-[#F4F0FF]">{insight.title}</h3>
              <p className="mt-2 text-xs leading-5 text-[#F4F0FF]/55">{insight.description}</p>
              <button
                type="button"
                onClick={() => {
                  if (insight.ticker) onOpenTicker?.(insight.ticker)
                }}
                className="bull-action mt-4 min-h-8 px-3 text-xs"
              >
                {insight.cta}
                <ArrowUpRight size={13} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex min-h-48 flex-1 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 text-center text-sm text-[#F4F0FF]/45">
          Sem sinais relevantes para esta carteira no momento.
        </div>
      )}

      <p className="mt-4 shrink-0 border-t border-white/[0.06] pt-3 text-[10px] leading-5 text-[#F4F0FF]/30">
        Análises são contextuais e educacionais. Não constituem recomendação de investimento.
      </p>
    </aside>
  )
}
