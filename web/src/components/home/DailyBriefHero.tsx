import Link from 'next/link'
import { ArrowRight, Newspaper, Sparkles } from 'lucide-react'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

export interface SuggestedPrompt {
  label: string
  href: string
}

interface DailyBriefHeroProps {
  aiGenerated?: boolean
  contextLine: string
  dateLabel: string
  focusPoints: string[]
  headline: string
  storiesCount: number
  suggestedPrompts?: SuggestedPrompt[]
  summary: string
}

export default function DailyBriefHero({
  aiGenerated,
  contextLine,
  dateLabel,
  focusPoints,
  headline,
  storiesCount,
  suggestedPrompts,
  summary,
}: DailyBriefHeroProps) {
  return (
    <section className="bull-panel-focus p-6 md:p-7">
      <GlassHighlight widthPercent={74} />

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bull-chip">{dateLabel}</span>
          <span className="bull-chip">{storiesCount} historias no radar</span>
          {aiGenerated && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#8B5CF6]/20 bg-[#8B5CF6]/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-[#8B5CF6]/60">
              <Sparkles size={9} />
              IA
            </span>
          )}
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

        {suggestedPrompts && suggestedPrompts.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#DBEAFE]/42">
              Perguntas do dia
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt) => (
                <Link
                  key={prompt.href}
                  href={prompt.href}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#8B5CF6]/25 bg-[#8B5CF6]/10 px-4 text-xs font-medium text-[#C4B5FD] transition hover:bg-[#8B5CF6]/18 hover:text-[#DDD6FE]"
                >
                  <Sparkles size={11} />
                  {prompt.label}
                </Link>
              ))}
            </div>
          </div>
        )}

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
