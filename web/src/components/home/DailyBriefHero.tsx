import Link from 'next/link'
import { ArrowRight, Newspaper, Sparkles } from 'lucide-react'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

interface DailyBriefHeroProps {
  contextLine: string
  dateLabel: string
  focusPoints: string[]
  headline: string
  storiesCount: number
  summary: string
}

export default function DailyBriefHero({
  contextLine,
  dateLabel,
  focusPoints,
  headline,
  storiesCount,
  summary,
}: DailyBriefHeroProps) {
  return (
    <section className="bull-panel-focus p-6 md:p-7">
      <GlassHighlight widthPercent={74} />

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bull-chip">{dateLabel}</span>
          <span className="bull-chip">{storiesCount} historias no radar</span>
        </div>

        <div className="max-w-3xl">
          <p className="bull-eyebrow">Daily brief</p>
          <h2 className="mt-3 font-serif text-[2rem] leading-tight text-[#F4F0FF] md:text-[2.35rem]">
            {headline}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#F4F0FF]/68 md:text-[15px]">
            {summary}
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[#DBEAFE]/46">
            {contextLine}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {focusPoints.map((point) => (
            <div key={point} className="bull-panel-quiet px-4 py-3">
              <p className="text-sm leading-6 text-[#F4F0FF]/74">{point}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/analysis"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#60A5FA]/25 bg-[#3B82F6]/16 px-5 text-sm font-medium text-[#F4F0FF] transition hover:-translate-y-0.5 hover:bg-[#3B82F6]/24"
          >
            <Sparkles size={16} />
            Abrir leitura do mercado
          </Link>
          <Link
            href="/search"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 text-sm text-[#F4F0FF]/78 transition hover:bg-white/[0.1] hover:text-[#F4F0FF]"
          >
            <Newspaper size={16} />
            Procurar um ativo
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  )
}
