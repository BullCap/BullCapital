import { GlassHighlight } from '@/components/atoms/GlassHighlight'

interface BriefMarketPulseProps {
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

const COLOR_UP = '#4ADE80'
const COLOR_DOWN = '#FB7185'

function getSparklinePath(values: number[], width = 280, height = 96) {
  if (values.length < 2) return { area: '', line: '' }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const spread = Math.max(max - min, 1)
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width
    const y = height - ((value - min) / spread) * (height - 8) - 4
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return {
    area: `M0,${height} L${points.join(' L')} L${width},${height} Z`,
    line: `M${points.join(' L')}`,
  }
}

function formatPercent(value: number | null): string {
  if (value === null) return 'n/d'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

function formatPrice(value: number | null, fractionDigits = 0): string {
  if (value === null) return 'n/d'
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

function MetricRow({
  label,
  value,
  delta,
  emphasize,
}: {
  label: string
  value: string
  delta?: number | null
  emphasize?: boolean
}) {
  const deltaTone =
    delta === null || delta === undefined
      ? 'text-[#DBEAFE]/40'
      : delta >= 0
        ? 'text-[#4ADE80]'
        : 'text-[#FB7185]'

  return (
    <div className="flex items-center justify-between border-b border-white/[0.04] py-2 last:border-b-0">
      <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-[#DBEAFE]/45">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className={`font-mono text-sm tabular-nums ${emphasize ? 'font-semibold text-[#F4F0FF]' : 'text-[#F4F0FF]/85'}`}>
          {value}
        </span>
        {delta !== undefined && (
          <span className={`font-mono text-[11px] tabular-nums ${deltaTone}`}>
            {formatPercent(delta ?? null)}
          </span>
        )}
      </div>
    </div>
  )
}

export default function BriefMarketPulse({
  ibovPrice,
  ibovChange,
  ibovHistory,
  sp500Change,
  vix,
  selicValue,
  usdBrlPrice,
  usdBrlChange,
  marketOpen,
}: BriefMarketPulseProps) {
  const series = ibovHistory.length >= 2 ? ibovHistory : []
  const isPositive = (ibovChange ?? 0) >= 0
  const tone = isPositive ? COLOR_UP : COLOR_DOWN
  const sparkline = getSparklinePath(series)

  return (
    <aside className="relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.06] bg-black/30 p-5 shadow-[inset_0_1px_0px_rgba(255,255,255,0.05),0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      <GlassHighlight widthPercent={60} />

      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="bull-eyebrow">Ibovespa</p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-white">
            {formatPrice(ibovPrice)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
              isPositive
                ? 'border-[#4ADE80]/30 bg-[#4ADE80]/10 text-[#4ADE80]'
                : 'border-[#FB7185]/30 bg-[#FB7185]/10 text-[#FB7185]'
            }`}
          >
            {formatPercent(ibovChange)}
          </span>
          {!marketOpen && (
            <span className="rounded-full border border-[#F43F5E]/25 bg-[#F43F5E]/10 px-2 py-0.5 text-[9px] uppercase tracking-wider font-semibold text-[#F43F5E]/90">
              Fechado
            </span>
          )}
        </div>
      </div>

      {series.length >= 2 ? (
        <div className="rounded-2xl border border-white/[0.04] bg-black/20 px-2 py-3">
          <svg viewBox="0 0 280 96" aria-hidden="true" className="h-20 w-full overflow-visible">
            <defs>
              <linearGradient id="brief-pulse-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={tone} stopOpacity={0.22} />
                <stop offset="100%" stopColor={tone} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <path d={sparkline.area} fill="url(#brief-pulse-fill)" />
            <path
              d={sparkline.line}
              fill="none"
              stroke={tone}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
              className={isPositive ? 'drop-shadow-[0_1px_3px_rgba(74,222,128,0.35)]' : 'drop-shadow-[0_1px_3px_rgba(251,113,133,0.35)]'}
            />
          </svg>
          <p className="mt-2 text-[10px] uppercase tracking-[0.14em] font-semibold text-[#DBEAFE]/30">
            Últimos pregões
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.04] bg-black/20 px-3 py-6 text-center text-xs text-[#DBEAFE]/40">
          Série indisponível
        </div>
      )}

      <div className="mt-4 flex-1">
        <MetricRow label="S&P 500" value={formatPercent(sp500Change)} delta={sp500Change} emphasize />
        <MetricRow label="USD / BRL" value={formatPrice(usdBrlPrice, 4)} delta={usdBrlChange} />
        <MetricRow label="VIX" value={vix !== null ? vix.toFixed(2) : 'n/d'} />
        <MetricRow label="SELIC" value={selicValue ?? 'n/d'} />
      </div>
    </aside>
  )
}
