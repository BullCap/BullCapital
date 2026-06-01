import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export interface BriefPulseData {
  ibovPrice: number | null
  ibovChange: number | null
  ibovHistory: number[]
  sp500Change: number | null
  sp500History: number[]
  vix: number | null
  vixHistory: number[]
  selicValue: string | null
  selicHistory: number[]
  usdBrlPrice: number | null
  usdBrlChange: number | null
  usdBrlHistory: number[]
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

const EMPTY_VALUE = 'n/d'

function formatPoints(value: number | null): string {
  if (value === null) return EMPTY_VALUE
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

function formatMoney(value: number | null): string {
  if (value === null) return EMPTY_VALUE
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatPercent(value: number | null): string {
  if (value === null) return EMPTY_VALUE
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`
}

function formatVix(value: number | null): string {
  if (value === null) return EMPTY_VALUE
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function getSparklinePath(values: number[], width = 128, height = 30) {
  if (values.length < 2) return { line: '', area: '' }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const spread = Math.max(max - min, 1)
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width
    const y = height - ((value - min) / spread) * (height - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  return {
    area: `M0,${height} L${points.join(' L')} L${width},${height} Z`,
    line: `M${points.join(' L')}`,
  }
}

function MiniTrend({ series, tone }: { series: number[]; tone: 'down' | 'neutral' | 'up' }) {
  if (series.length < 2) return null

  const color = tone === 'up' ? '#7FB59A' : tone === 'down' ? '#E7A1B0' : '#9CA3AF'
  const sparkline = getSparklinePath(series)

  return (
    <div className="mt-2 h-8 overflow-hidden">
      <svg viewBox="0 0 128 30" aria-hidden="true" className="h-full w-full overflow-visible">
        <path d={sparkline.area} fill={color} fillOpacity="0.08" />
        <path
          d={sparkline.line}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </div>
  )
}

function BriefMetric({
  label,
  value,
  detail,
  series = [],
  tone = 'neutral',
}: {
  detail?: string
  label: string
  series?: number[]
  tone?: 'down' | 'neutral' | 'up'
  value: string
}) {
  const toneClass = tone === 'up' ? 'bull-trend-up' : tone === 'down' ? 'bull-trend-down' : 'text-starlight/55'

  return (
    <div className="border-t border-white/[0.06] py-3 first:border-t-0 first:pt-0">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-starlight/35">{label}</p>
      <div className="mt-1.5 flex items-end justify-between gap-3">
        <p className="font-sans text-xl font-medium tabular-nums text-starlight">{value}</p>
        {detail ? (
          <p className={`shrink-0 text-sm font-medium tabular-nums ${toneClass}`}>{detail}</p>
        ) : null}
      </div>
      <MiniTrend series={series} tone={tone} />
    </div>
  )
}

export default function DailyBriefHero({
  aiGenerated,
  contextLine,
  dateLabel,
  focusPoints,
  headline,
  pulse,
  storiesCount,
  summary,
}: DailyBriefHeroProps) {
  const radarLabel = storiesCount > 0
    ? `${storiesCount} ${storiesCount === 1 ? 'história' : 'histórias'} no radar · `
    : ''
  const ibovTone = (pulse.ibovChange ?? 0) >= 0 ? 'up' : 'down'
  const sp500Tone = (pulse.sp500Change ?? 0) >= 0 ? 'up' : 'down'
  const usdTone = (pulse.usdBrlChange ?? 0) >= 0 ? 'up' : 'down'

  return (
    <section className="bull-frame px-6 py-8 sm:px-10 sm:py-10">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <p className="bull-eyebrow">
            Briefing · {dateLabel}
            {aiGenerated ? ' · IA' : ''}
          </p>

          <h2 className="max-w-4xl font-serif text-[2.15rem] leading-[1.12] text-starlight md:text-[3rem]">
            {headline}
          </h2>

          <p className="max-w-5xl text-base leading-8 text-starlight/65 md:text-[17px]">
            {summary}
          </p>

          <ul className="grid gap-x-8 gap-y-3 text-sm text-starlight/55 sm:grid-cols-3">
            {focusPoints.map((point) => (
              <li key={point} className="border-t border-white/[0.06] pt-3 leading-6">
                {point}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <Link
              href="/analysis"
              className="bull-action-primary"
            >
              <Sparkles size={15} />
              Analisar
            </Link>
            <span className="text-[11px] uppercase tracking-[0.14em] text-starlight/30">
              {radarLabel}{contextLine}
            </span>
          </div>
        </div>

        <aside className="bull-card-calm p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="bull-eyebrow">Pulso</p>
              <h3 className="mt-1 font-serif text-lg text-starlight">Mesa da manhã</h3>
            </div>
            <span
              className={`h-2 w-2 rounded-full ${pulse.marketOpen ? 'bg-[#7fb59a]' : 'bg-starlight/25'}`}
              aria-hidden="true"
            />
          </div>

          <div>
            <BriefMetric
              label="Ibovespa"
              value={formatPoints(pulse.ibovPrice)}
              detail={formatPercent(pulse.ibovChange)}
              series={pulse.ibovHistory}
              tone={ibovTone}
            />
            <BriefMetric
              label="S&P 500"
              value={formatPercent(pulse.sp500Change)}
              detail="exterior"
              series={pulse.sp500History}
              tone={sp500Tone}
            />
            <BriefMetric
              label="USD/BRL"
              value={formatMoney(pulse.usdBrlPrice)}
              detail={formatPercent(pulse.usdBrlChange)}
              series={pulse.usdBrlHistory}
              tone={usdTone}
            />
            <BriefMetric
              label="Selic"
              value={pulse.selicValue ?? EMPTY_VALUE}
              detail="juros"
              series={pulse.selicHistory}
            />
            <BriefMetric
              label="VIX"
              value={formatVix(pulse.vix)}
              detail="volatilidade"
              series={pulse.vixHistory}
            />
          </div>
        </aside>
      </div>
    </section>
  )
}
