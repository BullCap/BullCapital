import { getDailyBrief, type DailyBriefInput } from '@/lib/actions/daily-brief'
import DailyBriefHero, { type BriefPulseData } from './DailyBriefHero'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

// ── Fallback templates (used when AI is unavailable) ──────────────────────────

function fallbackHeadline(ibovChange: number | null, storiesCount: number): string {
  if (ibovChange === null) return 'Mercado sem direção clara.'
  if (ibovChange >= 1) return `Pregão construtivo, ${storiesCount} histórias no radar.`
  if (ibovChange <= -1) return `Pregão pressionado, ${storiesCount} pontos de atenção.`
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
  const status = marketOpen ? 'pregão em andamento' : 'fora do horário regular'

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

  return `${ibovLine} ${extLine} ${vixLine} ${ratesLine} ${status}.`
}

function fallbackFocusPoints(
  ibovChange: number | null,
  vix: number | null,
  selicValue: string | null,
): [string, string, string] {
  const fmt = (v: number | null) => v === null ? 'n/d' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
  return [
    `Ibovespa ${fmt(ibovChange)}.`,
    vix !== null ? `VIX ${vix.toFixed(1)}.` : 'Volatilidade sem leitura.',
    selicValue ? `SELIC ${selicValue}.` : 'Juros no radar.',
  ]
}

// ── Async server component ────────────────────────────────────────────────────

interface DailyBriefContentProps extends DailyBriefInput {
  contextLine: string
  dateLabel: string
  storiesCount: number
  pulse: BriefPulseData
}

export async function DailyBriefContent({
  ibovChange, sp500Change, vix, selicValue, marketOpen, storyHeadlines,
  contextLine, dateLabel, storiesCount, pulse,
}: DailyBriefContentProps) {
  const brief = await getDailyBrief({ ibovChange, sp500Change, vix, selicValue, marketOpen, storyHeadlines })

  const headline = brief?.headline ?? fallbackHeadline(ibovChange, storiesCount)
  const summary = brief?.summary ?? fallbackSummary(ibovChange, sp500Change, vix, selicValue, marketOpen)
  const focusPoints = brief?.focusPoints ?? fallbackFocusPoints(ibovChange, vix, selicValue)

  return (
    <DailyBriefHero
      contextLine={contextLine}
      dateLabel={dateLabel}
      focusPoints={focusPoints}
      headline={headline}
      storiesCount={storiesCount}
      summary={summary}
      aiGenerated={brief !== null}
      pulse={pulse}
    />
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function DailyBriefSkeleton({ dateLabel, storiesCount }: { dateLabel: string; storiesCount: number }) {
  return (
    <section className="bull-panel-focus p-6 md:p-7" aria-hidden>
      <GlassHighlight widthPercent={74} />
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bull-chip">{dateLabel}</span>
          {storiesCount > 0 && <span className="bull-chip">{storiesCount} histórias no radar</span>}
        </div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="flex flex-col gap-5 min-w-0">
            <div className="max-w-3xl">
              <div className="h-2.5 w-20 animate-pulse rounded-full bg-white/[0.07]" />
              <div className="mt-4 space-y-3">
                <div className="h-9 w-full animate-pulse rounded-2xl bg-white/[0.06]" />
                <div className="h-9 w-4/5 animate-pulse rounded-2xl bg-white/[0.05]" style={{ animationDelay: '60ms' }} />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3.5 w-full animate-pulse rounded-full bg-white/[0.05]" style={{ animationDelay: '100ms' }} />
                <div className="h-3.5 w-5/6 animate-pulse rounded-full bg-white/[0.04]" style={{ animationDelay: '160ms' }} />
                <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-white/[0.04]" style={{ animationDelay: '220ms' }} />
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-8 rounded-full bg-white/[0.04] px-4 py-3">
                  <div className="h-3 w-full animate-pulse rounded-full bg-white/[0.06]" style={{ animationDelay: `${i * 60}ms` }} />
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="h-[22rem] w-full animate-pulse rounded-[1.75rem] bg-white/[0.04]" />
          </div>
        </div>
      </div>
    </section>
  )
}
