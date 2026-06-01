interface QuoteSummary {
  price: number
  changePercent: number
}

interface MarketPulseFrameProps {
  ibov: QuoteSummary | null
  sp500: QuoteSummary | null
  selic: { rate: string } | null
  ipca: { rate: string } | null
  vix: number | null
  marketOpen: boolean
}

const EM_DASH = '—'

function formatPoints(value: number | null | undefined): string {
  if (value === null || value === undefined) return EM_DASH
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

function formatPercentSigned(value: number | null | undefined): string {
  if (value === null || value === undefined) return EM_DASH
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  const abs = Math.abs(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${sign}${abs}%`
}

function vixCaption(value: number | null): string {
  if (value === null) return 'sem leitura'
  if (value < 15) return 'volatilidade baixa'
  if (value <= 25) return 'volatilidade moderada'
  return 'volatilidade elevada'
}

/**
 * Bloco de dado calmo: label discreto em cima, valor forte, e uma linha de
 * apoio embaixo (variacao com tom dessaturado, ou um contexto curto).
 */
function Stat({
  label,
  value,
  change,
  caption,
  className = '',
}: {
  label: string
  value: string
  change?: number | null
  caption?: string
  className?: string
}) {
  const hasChange = change !== undefined && change !== null
  const trendClass = hasChange
    ? change >= 0
      ? 'bull-trend-up'
      : 'bull-trend-down'
    : ''

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <p className="bull-stat-label">{label}</p>
      <p className="bull-stat-value">{value}</p>
      {hasChange ? (
        <p className={`text-[13px] font-medium tabular-nums ${trendClass}`}>
          {formatPercentSigned(change)}
        </p>
      ) : caption ? (
        <p className="text-[13px] font-medium text-starlight/35">{caption}</p>
      ) : (
        <p className="text-[13px] font-medium text-starlight/20">{EM_DASH}</p>
      )}
    </div>
  )
}

/**
 * "Agora" — pulso do mercado numa moldura unica (hairline), no lugar dos quatro
 * cards de vidro flutuantes. Traducao do padrao do AbacatePay para o tema dark:
 * borda fina, divisores verticais, respiro generoso, zero glow.
 */
export default function MarketPulseFrame({
  ibov,
  sp500,
  selic,
  ipca,
  vix,
  marketOpen,
}: MarketPulseFrameProps) {
  const dividerCell = 'md:border-l md:border-white/[0.06] md:pl-6 lg:pl-8'

  return (
    <div className="bull-frame px-6 py-7 sm:px-8 sm:py-8">
      <div className="mb-6 flex items-center gap-2.5">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            marketOpen ? 'bg-[#7fb59a]' : 'bg-starlight/25'
          }`}
          aria-hidden="true"
        />
        <span className="text-[12px] font-medium tracking-wide text-starlight/45">
          {marketOpen ? 'Pregão em andamento' : 'Mercado fora do horário regular'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4 md:gap-y-0">
        <Stat
          label="Ibovespa"
          value={formatPoints(ibov?.price)}
          change={ibov?.changePercent ?? null}
        />
        <Stat
          label="S&P 500"
          value={formatPoints(sp500?.price)}
          change={sp500?.changePercent ?? null}
          className={dividerCell}
        />
        <Stat
          label="Selic"
          value={selic?.rate ?? EM_DASH}
          caption={ipca ? `IPCA ${ipca.rate}` : undefined}
          className={dividerCell}
        />
        <Stat
          label="VIX"
          value={vix !== null ? vix.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : EM_DASH}
          caption={vixCaption(vix)}
          className={dividerCell}
        />
      </div>
    </div>
  )
}
