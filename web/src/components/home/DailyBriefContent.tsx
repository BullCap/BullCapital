import { getDailyBrief, type DailyBriefInput } from '@/lib/actions/daily-brief'
import { cn } from '@/lib/utils'
import DailyBriefHero from './DailyBriefHero'
import MarketPulseBar from './MarketPulseBar'
import type { HeaderView } from './header-views'

// ── Fallback templates (used when AI is unavailable) ──────────────────────────

function fallbackHeadline(ibovChange: number | null, storiesCount: number): string {
  const radarContext = storiesCount > 0 ? `, ${storiesCount} histórias no radar` : ''
  if (ibovChange === null) return 'Mercado sem direção clara.'
  if (ibovChange >= 1) return `Pregão construtivo${radarContext}.`
  if (ibovChange <= -1) return storiesCount > 0
    ? `Pregão pressionado, ${storiesCount} pontos de atenção.`
    : 'Pregão pressionado.'
  return 'Pregão equilibrado.'
}

function fallbackSummary(
  ibovChange: number | null,
  sp500Change: number | null,
  vix: number | null,
  selicValue: string | null,
  marketOpen: boolean,
): string {
  const fmt = (v: number | null) => v === null ? 'sem leitura' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
  const readingFrame = marketOpen
    ? 'Com o pregão em andamento, a leitura combina direção do índice, exterior e juros antes de virar narrativa para cliente.'
    : 'Como o mercado está fora do horário regular, a leitura serve como preparação para a próxima conversa com cliente, sem sugerir ação imediata.'
  const volatilityFrame = vix !== null && vix >= 20
    ? 'A volatilidade mais alta pede atenção a ruídos externos, liquidez e nomes mais sensíveis ao ciclo.'
    : 'Com volatilidade administrável, o foco fica em entender quais vetores sustentam ou pressionam o índice.'

  const ibovLine = ibovChange === null
    ? 'Ibovespa sem leitura confiável.'
    : `Ibovespa em ${fmt(ibovChange)}.`

  const extLine = sp500Change === null
    ? 'Exterior sem leitura consolidada.'
    : `S&P 500 em ${fmt(sp500Change)}.`

  const vixLine = vix !== null
    ? `VIX em ${vix.toFixed(1)}${vix >= 20 ? ', com volatilidade elevada' : ''}.`
    : 'Volatilidade sem referência.'

  const ratesLine = selicValue
    ? `SELIC em ${selicValue}.`
    : 'Juros seguem no centro da leitura.'

  return `${ibovLine} ${extLine} ${vixLine} ${ratesLine} ${readingFrame} ${volatilityFrame}`
}

// ── Async server component ────────────────────────────────────────────────────

interface DailyBriefContentProps extends DailyBriefInput {
  contextLine: string
  dateLabel: string
  storiesCount: number
  views: HeaderView[]
}

export async function DailyBriefContent({
  ibovChange, sp500Change, vix, selicValue, marketOpen, storyHeadlines,
  contextLine, dateLabel, storiesCount, views,
}: DailyBriefContentProps) {
  const brief = await getDailyBrief({ ibovChange, sp500Change, vix, selicValue, marketOpen, storyHeadlines })

  const headline = brief?.headline ?? fallbackHeadline(ibovChange, storiesCount)
  const summary = brief?.summary ?? fallbackSummary(ibovChange, sp500Change, vix, selicValue, marketOpen)

  return (
    <>
      <MarketPulseBar views={views} />
      <DailyBriefHero
        contextLine={contextLine}
        dateLabel={dateLabel}
        headline={headline}
        storiesCount={storiesCount}
        summary={summary}
        aiGenerated={brief !== null}
      />
    </>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-full bg-ink/6', className)} />
}

export function DailyBriefSkeleton() {
  return (
    <>
      {/* Faixa de pulso */}
      <div className="px-1" aria-hidden>
        <SkeletonBar className="mb-5 h-8 w-64 rounded-control" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 lg:gap-y-0">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-2.5">
              <SkeletonBar className="h-2.5 w-16" />
              <SkeletonBar className="h-4 w-20" />
              <SkeletonBar className="h-7 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Hero editorial */}
      <div className="border-t border-hairline px-1 pt-8" aria-hidden>
        <div className="flex flex-col gap-6">
          <SkeletonBar className="h-2.5 w-28" />
          <div className="space-y-3">
            <SkeletonBar className="h-8 w-full rounded-lg" />
            <SkeletonBar className="h-8 w-4/5 rounded-lg" />
          </div>
          <div className="space-y-2">
            <SkeletonBar className="h-3.5 w-full" />
            <SkeletonBar className="h-3.5 w-11/12" />
            <SkeletonBar className="h-3.5 w-3/4" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <SkeletonBar key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
