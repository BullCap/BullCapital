import { getDailyBrief, type DailyBriefInput } from '@/lib/actions/daily-brief'
import DailyBriefHero, { type SuggestedPrompt } from './DailyBriefHero'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

// ── Fallback templates (used when AI is unavailable) ──────────────────────────

function fallbackHeadline(ibovChange: number | null, storiesCount: number): string {
  if (ibovChange === null) return 'O mercado aguarda sinais mais claros para definir direção.'
  if (ibovChange >= 1) return `Pregão abre construtivo, com tração visível e ${storiesCount} histórias no radar.`
  if (ibovChange <= -1) return `O dia abre pressionado, com humor mais frágil e ${storiesCount} pontos de atenção.`
  return `Pregão equilibrado: movimento moderado no índice e histórias suficientes para separar ruído de sinal.`
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
    ? 'O Ibovespa ainda não formou leitura confiável.'
    : `O Ibovespa opera em ${fmt(ibovChange)}, ${ibovChange >= 0 ? 'sinalizando algum apetite por risco local' : 'refletindo pressão no humor do investidor'}.`

  const extLine = sp500Change === null
    ? 'O exterior segue sem leitura consolidada.'
    : `Lá fora, o S&P 500 aparece em ${fmt(sp500Change)}, ${sp500Change >= 0 ? 'o que reduz parte da pressão externa' : 'adicionando mais cautela ao cenário global'}.`

  const vixLine = vix !== null
    ? `O VIX em ${vix.toFixed(1)} ${vix >= 20 ? 'indica volatilidade elevada — momento de calibrar convicção antes de reagir' : 'sugere um ambiente relativamente controlado de risco'}.`
    : 'A volatilidade implícita segue sem referência clara.'

  const ratesLine = selicValue
    ? `Com SELIC em ${selicValue}, o custo de capital permanece como pano de fundo relevante para leitura de valor.`
    : 'Os juros seguem como pano de fundo importante para separar impulso tático de narrativa estrutural.'

  return `${ibovLine} Com ${status}, o foco é separar movimentos técnicos de mudanças reais de narrativa. ${extLine} ${vixLine} ${ratesLine}`
}

function fallbackFocusPoints(
  ibovChange: number | null,
  vix: number | null,
  selicValue: string | null,
): [string, string, string] {
  const fmt = (v: number | null) => v === null ? 'n/d' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
  return [
    `Ibovespa em ${fmt(ibovChange)} — principal leitura de apetite local.`,
    vix !== null ? `VIX em ${vix.toFixed(1)}: ajuste convicção antes de seguir o fluxo.` : 'Volatilidade sem referência forte no momento.',
    selicValue ? `SELIC em ${selicValue} — ancora de custo de capital no cenário.` : 'Juros seguem relevantes para separar impulso de narrativa.',
  ]
}

// ── Async server component ────────────────────────────────────────────────────

interface DailyBriefContentProps extends DailyBriefInput {
  contextLine: string
  dateLabel: string
  storiesCount: number
  suggestedPrompts: SuggestedPrompt[]
}

export async function DailyBriefContent({
  ibovChange, sp500Change, vix, selicValue, marketOpen, storyHeadlines,
  contextLine, dateLabel, storiesCount, suggestedPrompts,
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
      suggestedPrompts={suggestedPrompts}
      summary={summary}
      aiGenerated={brief !== null}
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
          {storiesCount > 0 && <span className="bull-chip">{storiesCount} historias no radar</span>}
        </div>
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
        <div className="grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bull-panel-quiet px-4 py-3">
              <div className="h-3 w-full animate-pulse rounded-full bg-white/[0.06]" style={{ animationDelay: `${i * 60}ms` }} />
              <div className="mt-2 h-3 w-3/4 animate-pulse rounded-full bg-white/[0.05]" style={{ animationDelay: `${i * 60 + 40}ms` }} />
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="h-12 w-48 animate-pulse rounded-2xl bg-white/[0.06]" />
          <div className="h-12 w-40 animate-pulse rounded-2xl bg-white/[0.04]" />
        </div>
      </div>
    </section>
  )
}
