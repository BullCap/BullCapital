import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface DailyBriefHeroProps {
  aiGenerated?: boolean
  contextLine: string
  dateLabel: string
  headline: string
  storiesCount: number
  summary: string
}

/**
 * DailyBriefHero — bloco editorial do briefing do dia. Manchete e leitura do
 * pregão; o pulso de mercado vive na faixa acima (MarketPulseBar). Superfície
 * flat (sem moldura): só uma hairline no topo separa do pulso de mercado.
 */
export default function DailyBriefHero({
  aiGenerated,
  contextLine,
  dateLabel,
  headline,
  storiesCount,
  summary,
}: DailyBriefHeroProps) {
  const radarLabel =
    storiesCount > 0
      ? `${storiesCount} ${storiesCount === 1 ? 'história' : 'histórias'} no radar · `
      : ''

  return (
    <section className="border-t border-hairline px-1 pt-8">
      <div className="flex flex-col gap-7 py-2">
        <p className="text-xs font-medium uppercase tracking-eyebrow text-ink-faint">
          Briefing · {dateLabel}
          {aiGenerated ? ' · IA' : ''}
        </p>

        <h2 className="max-w-5xl font-serif text-hero font-medium leading-[1.08] text-amethyst-light">
          {headline}
        </h2>

        <p className="max-w-4xl text-lg leading-9 text-ink-soft">{summary}</p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Button asChild>
            <Link href="/analysis">Analisar</Link>
          </Button>
          <span className="text-xs uppercase tracking-eyebrow text-ink-faint">
            {radarLabel}
            {contextLine}
          </span>
        </div>
      </div>
    </section>
  )
}
