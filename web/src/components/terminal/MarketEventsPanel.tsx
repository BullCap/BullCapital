import { CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MarketEvent } from './portfolioMock'
import { impactClass } from './portfolio-format'

interface MarketEventsPanelProps {
  events: MarketEvent[]
}

export default function MarketEventsPanel({ events }: MarketEventsPanelProps) {
  return (
    <section className="bull-panel p-4 md:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="bull-eyebrow">Mercado</p>
          <h2 className="mt-0.5 font-serif text-lg text-[#F4F0FF]">Eventos que impactam a carteira</h2>
        </div>
        <CalendarClock size={16} className="mt-0.5 text-[#F4F0FF]/35" />
      </div>

      {events.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {events.map((event) => (
            <article key={event.id} className="bull-panel-quiet p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 px-2 py-1 font-mono text-[10px] font-bold text-[#C4B5FD]">
                  {event.asset}
                </span>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/45">
                  {event.type}
                </span>
                <span className={cn('rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-widest', impactClass(event.impact))}>
                  impacto {event.impact}
                </span>
                <span className="ml-auto text-[10px] text-[#F4F0FF]/30">{event.date}</span>
              </div>
              <p className="text-sm leading-6 text-[#F4F0FF]/65">{event.summary}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex min-h-36 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-sm text-[#F4F0FF]/40">
          Nenhum evento relevante mapeado para esta carteira.
        </div>
      )}
    </section>
  )
}
