import Link from 'next/link'
import { ArrowRight, Newspaper, Sparkles } from 'lucide-react'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import BriefMarketPulse from './BriefMarketPulse'
import BriefFixedIncomeList from './BriefFixedIncomeList'
import type { MarketListingItem } from '@/types/market'

export interface SuggestedPrompt {
  label: string
  href: string
}

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
  suggestedPrompts?: SuggestedPrompt[]
  summary: string
  pulse: BriefPulseData
  fixedIncomeHighlights: MarketListingItem[]
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
  pulse,
  fixedIncomeHighlights,
}: DailyBriefHeroProps) {
  return (
    <section className="bull-panel-focus p-8 md:p-10">
      <GlassHighlight widthPercent={74} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bull-chip text-[11px] px-3.5 py-1.5 bg-white/[0.04] border-white/[0.06]">{dateLabel}</span>
          <span className="bull-chip text-[11px] px-3.5 py-1.5 bg-white/[0.04] border-white/[0.06]">{storiesCount} histórias no radar</span>
          {aiGenerated && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[#C4B5FD] font-semibold">
              <Sparkles size={9} className="animate-pulse" />
              IA
            </span>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="flex flex-col gap-6 min-w-0">
            <div className="max-w-3xl">
              <p className="bull-eyebrow">Briefing diário</p>
              <h2 className="mt-3 font-serif text-[2.5rem] leading-tight text-white tracking-tight md:text-[3.15rem]">
                {headline}
              </h2>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-relaxed text-[#F4F0FF]/85 md:text-[17px]">
                {summary}
              </p>
              <p className="mt-4 text-[10px] uppercase tracking-[0.16em] font-extrabold text-[#DBEAFE]/40">
                {contextLine}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {focusPoints.map((point) => (
                <div key={point} className="bull-panel-quiet px-5 py-4.5 flex items-center">
                  <p className="text-[15px] font-bold leading-relaxed text-white">{point}</p>
                </div>
              ))}
            </div>

            {suggestedPrompts && suggestedPrompts.length > 0 && (
              <div className="flex flex-col gap-3 mt-2">
                <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[#DBEAFE]/35">
                  Perguntas do dia
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {suggestedPrompts.map((prompt) => (
                    <Link
                      key={prompt.href}
                      href={prompt.href}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#8B5CF6]/15 bg-[#8b5cf6]/5 px-4 py-1 text-[11px] font-medium text-[#C4B5FD] transition-all duration-300 hover:bg-[#8B5CF6]/14 hover:border-[#8B5CF6]/35 active:scale-[0.97]"
                    >
                      <Sparkles size={11} />
                      {prompt.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3.5 sm:flex-row mt-3">
              <Link
                href="/analysis"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#8B5CF6]/30 bg-gradient-to-b from-[#8B5CF6]/20 to-[#8B5CF6]/8 px-6 text-sm font-semibold tracking-wide text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(139,92,246,0.18),inset_0_1px_1px_rgba(255,255,255,0.18)] active:translate-y-0 active:scale-[0.98]"
              >
                <Sparkles size={16} />
                Abrir leitura do mercado
              </Link>
              <Link
                href="/news"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 text-sm font-medium text-[#F4F0FF]/85 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.08] hover:shadow-[0_12px_24px_rgba(0,0,0,0.35)] active:translate-y-0 active:scale-[0.98]"
              >
                <Newspaper size={16} />
                Abrir radar de notícias
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <BriefMarketPulse {...pulse} />
            <BriefFixedIncomeList items={fixedIncomeHighlights} />
          </div>
        </div>
      </div>
    </section>
  )
}
