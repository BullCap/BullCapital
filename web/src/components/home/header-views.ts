import type { SparkTrend } from '@/components/ui/chart/spark-area-chart'
import type { MarketIndicatorsData } from '@/types/market'

/** Pulso macro de mercado — fonte da view "Macro" do header. */
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

/** Célula já formatada de uma view do header (serializável p/ o client). */
export interface HeaderMetricCell {
  label: string
  value: string
  delta?: string
  trend?: SparkTrend
  caption?: string
  series?: number[]
}

export interface HeaderView {
  id: string
  label: string
  cells: HeaderMetricCell[]
}

/** Agregados de carteira do workspace. Só clientes têm dado real na V1. */
export interface CarteirasData {
  clientCount: number | null
}

const EMPTY = '—'

function formatPoints(value: number | null): string {
  if (value === null) return EMPTY
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

function formatMoney(value: number | null, digits = 2): string {
  if (value === null) return EMPTY
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function formatPercent(value: number | null): string {
  if (value === null) return EMPTY
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${Math.abs(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`
}

function formatDecimal(value: number | null): string {
  if (value === null) return EMPTY
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function trendOf(change: number | null): SparkTrend {
  if (change === null) return 'flat'
  return change >= 0 ? 'up' : 'down'
}

function vixCaption(value: number | null): string {
  if (value === null) return 'sem leitura'
  if (value < 15) return 'volatilidade baixa'
  if (value <= 25) return 'volatilidade moderada'
  return 'volatilidade elevada'
}

/** Último valor de uma série de indicador (mais recente primeiro) como "X,XX%". */
function latestPercent(entries?: Array<{ value: string | number }>): string {
  const raw = entries?.[0]?.value
  if (raw === undefined || raw === null) return EMPTY
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'))
  if (!Number.isFinite(n)) return EMPTY
  return `${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

/**
 * buildHeaderViews — monta as views do pulso do header a partir do dado real.
 * Macro (mercado), Carteiras (livro do assessor) e Renda Fixa (juros/inflação).
 * Carteiras só tem nº de clientes na V1; o resto fica em "—" até o pipeline de
 * import de posições existir (não fabricamos número).
 */
export function buildHeaderViews(
  pulse: BriefPulseData,
  indicators: MarketIndicatorsData,
  carteiras: CarteirasData,
): HeaderView[] {
  const macro: HeaderView = {
    id: 'macro',
    label: 'Macro',
    cells: [
      {
        label: 'Ibovespa',
        value: formatPoints(pulse.ibovPrice),
        delta: formatPercent(pulse.ibovChange),
        trend: trendOf(pulse.ibovChange),
        series: pulse.ibovHistory,
      },
      {
        label: 'S&P 500',
        value: formatPercent(pulse.sp500Change),
        caption: 'exterior',
        trend: trendOf(pulse.sp500Change),
        series: pulse.sp500History,
      },
      {
        label: 'USD/BRL',
        value: formatMoney(pulse.usdBrlPrice, 4),
        delta: formatPercent(pulse.usdBrlChange),
        trend: trendOf(pulse.usdBrlChange),
        series: pulse.usdBrlHistory,
      },
      { label: 'Selic', value: pulse.selicValue ?? EMPTY, caption: 'meta de juros' },
      { label: 'VIX', value: formatDecimal(pulse.vix), caption: vixCaption(pulse.vix) },
    ],
  }

  const count = carteiras.clientCount
  const carteirasView: HeaderView = {
    id: 'carteiras',
    label: 'Carteiras',
    cells: [
      {
        label: 'Clientes',
        value: count === null ? EMPTY : count.toLocaleString('pt-BR'),
        caption: count === null ? 'sem leitura' : count === 1 ? 'cliente ativo' : 'clientes ativos',
      },
      { label: 'Patrimônio', value: EMPTY, caption: 'em breve' },
      { label: 'Concentração', value: EMPTY, caption: 'em breve' },
      { label: 'Vencimentos 30d', value: EMPTY, caption: 'em breve' },
      { label: 'Alertas', value: EMPTY, caption: 'em breve' },
    ],
  }

  const rendaFixa: HeaderView = {
    id: 'renda-fixa',
    label: 'Renda Fixa',
    cells: [
      { label: 'Selic', value: pulse.selicValue ?? latestPercent(indicators.selic), caption: 'meta de juros' },
      { label: 'CDI', value: latestPercent(indicators.cdi), caption: 'interbancário' },
      { label: 'IPCA', value: latestPercent(indicators.inflation), caption: 'inflação 12m' },
      { label: 'IGP-M', value: latestPercent(indicators.igpm), caption: 'índice geral' },
    ],
  }

  return [macro, carteirasView, rendaFixa]
}
