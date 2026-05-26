import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import BriefMarketPulse from './BriefMarketPulse'

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
  pulse,
}: DailyBriefHeroProps) {
  const radarLabel = `${storiesCount} ${storiesCount === 1 ? 'história' : 'histórias'} no radar`

  return (
    <section className="bull-panel-focus p-6 md:p-7">
      <GlassHighlight widthPercent={74} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="max-w-3xl">
            <p className="bull-eyebrow">
              Briefing · {dateLabel}
              {aiGenerated ? ' · IA' : ''}
            </p>
            <h2 className="mt-3 font-serif text-[2rem] leading-tight tracking-tight text-white md:text-[2.45rem]">
              {headline}
            </h2>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-[#F4F0FF]/74 md:text-[15px]">
              {summary}
            </p>
          </div>

          <ul className="grid gap-2 text-sm text-[#F4F0FF]/70 md:grid-cols-3">
            {focusPoints.map((point) => (
              <li key={point} className="border-t border-white/[0.07] pt-3 leading-5">
                {point}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4 pt-1">
            <Link
              href="/analysis"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#8B5CF6]/25 bg-[#8B5CF6]/12 px-5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#8B5CF6]/18 active:scale-[0.98]"
            >
              <Sparkles size={16} />
              Analisar
            </Link>
            <span className="text-xs uppercase tracking-[0.14em] text-[#DBEAFE]/35">
              {radarLabel} · {contextLine}
            </span>
          </div>
        </div>

        <div>
          <BriefMarketPulse {...pulse} />
        </div>
      </div>
    </section>
  )
}
