import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export interface BriefPulseData {
  ibovPrice: number | null
  ibovChange: number | null
  ibovHistory: number[]
  sp500Change: number | null
  vix: number | null
  selicValue: string | null
  usdBrlPrice: number | null
  usdBrlChange: number | null
  marketOpen: boolean
}

interface DailyBriefHeroProps {
  aiGenerated?: boolean
  contextLine: string
  dateLabel: string
  focusPoints: string[]
  headline: string
  storiesCount: number
  summary: string
  pulse: BriefPulseData
}

export default function DailyBriefHero({
  aiGenerated,
  contextLine,
  dateLabel,
  focusPoints,
  headline,
  storiesCount,
  summary,
}: DailyBriefHeroProps) {
  const radarLabel = `${storiesCount} ${storiesCount === 1 ? 'história' : 'histórias'} no radar`

  return (
    <section className="bull-frame px-6 py-8 sm:px-10 sm:py-10">
      <div className="flex max-w-3xl flex-col gap-6">
        <p className="bull-eyebrow">
          Briefing · {dateLabel}
          {aiGenerated ? ' · IA' : ''}
        </p>

        <h2 className="font-serif text-[2rem] leading-[1.15] tracking-tight text-starlight md:text-[2.6rem]">
          {headline}
        </h2>

        <p className="max-w-2xl text-[15px] leading-7 text-starlight/65">
          {summary}
        </p>

        <ul className="grid gap-x-8 gap-y-3 text-sm text-starlight/55 sm:grid-cols-3">
          {focusPoints.map((point) => (
            <li key={point} className="border-t border-white/[0.06] pt-3 leading-5">
              {point}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <Link
            href="/analysis"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.03] px-5 text-sm font-medium text-starlight transition-colors duration-300 hover:border-amethyst/40 hover:bg-amethyst/[0.08]"
          >
            <Sparkles size={15} />
            Analisar
          </Link>
          <span className="text-[11px] uppercase tracking-[0.14em] text-starlight/30">
            {radarLabel} · {contextLine}
          </span>
        </div>
      </div>
    </section>
  )
}
