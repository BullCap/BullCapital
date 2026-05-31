export type PortfolioId = 'principal' | 'dividendos' | 'growth'
export type TimeRange = '1D' | '7D' | '1M' | '6M' | 'YTD' | '12M'
export type ChartMode = 'patrimonio' | 'retorno' | 'pnl'
export type StatusTone = 'positivo' | 'neutro' | 'atencao' | 'risco'
export type InsightCategory = 'risco' | 'performance' | 'alocacao' | 'mercado' | 'dividendos'
export type InsightSeverity = 'informativo' | 'atencao' | 'critico'
export type EventImpact = 'baixo' | 'medio' | 'alto'

export interface PortfolioKpi {
  label: string
  value: string
  variation: number
  tone: StatusTone
  badge: string
  sparkline: number[]
}

export interface PerformancePoint {
  date: string
  patrimonio: number
  retorno: number
  pnl: number
  cdi: number
  ibov: number
  sp500: number
}

export interface AllocationItem {
  label: string
  value: number
  color: string
}

export interface HoldingFundamentals {
  pl: number | null
  pvp: number | null
  roe: number | null
  dy: number | null
}

export interface PortfolioHolding {
  symbol: string
  name: string
  className: string
  sector: string
  quantity: number
  avgPrice: number
  currentPrice: number
  pnl: number
  returnPct: number
  weight: number
  dividendYield: number
  volatility: number
  status: string
  tone: StatusTone
  recentHistory: Array<{ date: string; price: number }>
  news: string[]
  fundamentals: HoldingFundamentals
  benchmarkReturn: number
  sectorReturn: number
  highlightReason: string
}

export interface AiInsight {
  id: string
  category: InsightCategory
  severity: InsightSeverity
  title: string
  description: string
  cta: string
  ticker?: string
}

export interface PerformanceContribution {
  symbol: string
  name: string
  impactValue: number
  impactPct: number
}

export interface RiskMetric {
  label: string
  value: string
  detail: string
  tone: StatusTone
}

export interface CorrelationCell {
  left: string
  right: string
  value: number
}

export interface MarketEvent {
  id: string
  asset: string
  type: string
  impact: EventImpact
  date: string
  summary: string
}

export interface PortfolioData {
  id: PortfolioId
  name: string
  description: string
  updatedMinutesAgo: number
  benchmark: 'CDI' | 'Ibovespa' | 'S&P 500'
  kpis: PortfolioKpi[]
  performanceHistory: PerformancePoint[]
  allocationByClass: AllocationItem[]
  allocationBySector: AllocationItem[]
  allocationByRisk: AllocationItem[]
  allocationByLiquidity: AllocationItem[]
  holdings: PortfolioHolding[]
  aiInsights: AiInsight[]
  performanceContribution: {
    top: PerformanceContribution[]
    detractors: PerformanceContribution[]
  }
  riskMetrics: RiskMetric[]
  correlation: CorrelationCell[]
  marketEvents: MarketEvent[]
}

export const portfolioOptions: Array<{ id: PortfolioId; name: string }> = [
  { id: 'principal', name: 'Carteira Principal' },
  { id: 'dividendos', name: 'Carteira Dividendos' },
  { id: 'growth', name: 'Carteira Growth' },
]

export const timeRangeOptions: TimeRange[] = ['1D', '7D', '1M', '6M', 'YTD', '12M']

const performanceHistory: PerformancePoint[] = [
  { date: '02/01', patrimonio: 824500, retorno: 0, pnl: 0, cdi: 0, ibov: 0, sp500: 0 },
  { date: '17/01', patrimonio: 831200, retorno: 0.81, pnl: 6700, cdi: 0.45, ibov: 0.28, sp500: 0.51 },
  { date: '01/02', patrimonio: 826800, retorno: 0.28, pnl: 2300, cdi: 0.91, ibov: -0.6, sp500: 1.1 },
  { date: '16/02', patrimonio: 846900, retorno: 2.72, pnl: 22400, cdi: 1.36, ibov: 1.55, sp500: 1.8 },
  { date: '04/03', patrimonio: 858100, retorno: 4.08, pnl: 33600, cdi: 1.81, ibov: 2.35, sp500: 2.1 },
  { date: '19/03', patrimonio: 851300, retorno: 3.25, pnl: 26800, cdi: 2.25, ibov: 1.62, sp500: 1.2 },
  { date: '03/04', patrimonio: 872900, retorno: 5.87, pnl: 48400, cdi: 2.74, ibov: 3.8, sp500: 2.65 },
  { date: '18/04', patrimonio: 884600, retorno: 7.29, pnl: 60100, cdi: 3.18, ibov: 4.25, sp500: 3.1 },
  { date: '03/05', patrimonio: 879400, retorno: 6.66, pnl: 54900, cdi: 3.64, ibov: 3.76, sp500: 2.58 },
  { date: '17/05', patrimonio: 896200, retorno: 8.7, pnl: 71700, cdi: 4.08, ibov: 5.22, sp500: 3.42 },
  { date: '31/05', patrimonio: 912840, retorno: 10.72, pnl: 88340, cdi: 4.54, ibov: 6.11, sp500: 4.08 },
]

const holdings: PortfolioHolding[] = [
  {
    symbol: 'PETR4',
    name: 'Petrobras PN',
    className: 'Ações',
    sector: 'Energia',
    quantity: 4200,
    avgPrice: 33.42,
    currentPrice: 38.74,
    pnl: 22344,
    returnPct: 15.92,
    weight: 17.8,
    dividendYield: 9.4,
    volatility: 27.6,
    status: 'P&L concentrado',
    tone: 'atencao',
    recentHistory: [
      { date: 'Jan', price: 34.1 },
      { date: 'Fev', price: 35.6 },
      { date: 'Mar', price: 37.2 },
      { date: 'Abr', price: 36.4 },
      { date: 'Mai', price: 38.74 },
    ],
    news: ['Brent sustenta sessão positiva para energia', 'Mercado acompanha política de dividendos'],
    fundamentals: { pl: 5.8, pvp: 1.21, roe: 24.2, dy: 9.4 },
    benchmarkReturn: 6.11,
    sectorReturn: 8.2,
    highlightReason: 'Concentrou parte relevante do P&L positivo no mês e elevou a exposição a energia.',
  },
  {
    symbol: 'VALE3',
    name: 'Vale ON',
    className: 'Ações',
    sector: 'Commodities',
    quantity: 2800,
    avgPrice: 61.4,
    currentPrice: 66.18,
    pnl: 13384,
    returnPct: 7.79,
    weight: 20.3,
    dividendYield: 6.1,
    volatility: 31.4,
    status: 'Exposição elevada',
    tone: 'atencao',
    recentHistory: [
      { date: 'Jan', price: 62.5 },
      { date: 'Fev', price: 60.8 },
      { date: 'Mar', price: 64.2 },
      { date: 'Abr', price: 65.1 },
      { date: 'Mai', price: 66.18 },
    ],
    news: ['Minério de ferro fecha semana em alta', 'China divulga novos dados de atividade industrial'],
    fundamentals: { pl: 7.2, pvp: 1.48, roe: 19.8, dy: 6.1 },
    benchmarkReturn: 6.11,
    sectorReturn: 7.6,
    highlightReason: 'A valorização recente aumentou o peso de commodities e a sensibilidade a China.',
  },
  {
    symbol: 'ITUB4',
    name: 'Itaú Unibanco PN',
    className: 'Ações',
    sector: 'Bancos',
    quantity: 5100,
    avgPrice: 31.9,
    currentPrice: 34.12,
    pnl: 11322,
    returnPct: 6.96,
    weight: 19.1,
    dividendYield: 7.1,
    volatility: 19.3,
    status: 'Dentro do plano',
    tone: 'positivo',
    recentHistory: [
      { date: 'Jan', price: 32.2 },
      { date: 'Fev', price: 33.4 },
      { date: 'Mar', price: 33.9 },
      { date: 'Abr', price: 34.7 },
      { date: 'Mai', price: 34.12 },
    ],
    news: ['Bancos reagem a leitura de inadimplência', 'Curva de juros fecha na ponta longa'],
    fundamentals: { pl: 8.9, pvp: 1.68, roe: 21.4, dy: 7.1 },
    benchmarkReturn: 6.11,
    sectorReturn: 5.9,
    highlightReason: 'Mantém contribuição positiva com volatilidade abaixo da média das ações da carteira.',
  },
  {
    symbol: 'BBAS3',
    name: 'Banco do Brasil ON',
    className: 'Ações',
    sector: 'Bancos',
    quantity: 2200,
    avgPrice: 27.1,
    currentPrice: 29.88,
    pnl: 6116,
    returnPct: 10.26,
    weight: 7.2,
    dividendYield: 8.2,
    volatility: 22.8,
    status: 'Dividendos em foco',
    tone: 'positivo',
    recentHistory: [
      { date: 'Jan', price: 27.4 },
      { date: 'Fev', price: 28.1 },
      { date: 'Mar', price: 29.2 },
      { date: 'Abr', price: 30.4 },
      { date: 'Mai', price: 29.88 },
    ],
    news: ['Setor financeiro ganha fluxo após resultados', 'Mercado monitora margem financeira'],
    fundamentals: { pl: 4.9, pvp: 0.92, roe: 18.6, dy: 8.2 },
    benchmarkReturn: 6.11,
    sectorReturn: 5.9,
    highlightReason: 'Contribuiu para o yield projetado sem elevar muito o risco agregado.',
  },
  {
    symbol: 'TAEE11',
    name: 'Taesa UNIT',
    className: 'Ações',
    sector: 'Energia elétrica',
    quantity: 1800,
    avgPrice: 35.8,
    currentPrice: 34.66,
    pnl: -2052,
    returnPct: -3.18,
    weight: 6.8,
    dividendYield: 10.3,
    volatility: 13.7,
    status: 'Pressão no preço',
    tone: 'neutro',
    recentHistory: [
      { date: 'Jan', price: 35.5 },
      { date: 'Fev', price: 36.2 },
      { date: 'Mar', price: 35.1 },
      { date: 'Abr', price: 34.4 },
      { date: 'Mai', price: 34.66 },
    ],
    news: ['Defensivas de dividendos ficam estáveis', 'Setor elétrico acompanha revisão tarifária'],
    fundamentals: { pl: 6.6, pvp: 1.9, roe: 28.1, dy: 10.3 },
    benchmarkReturn: 6.11,
    sectorReturn: 2.1,
    highlightReason: 'Reduz volatilidade agregada, mas ficou abaixo do retorno da carteira no período.',
  },
  {
    symbol: 'MXRF11',
    name: 'Maxi Renda FII',
    className: 'FIIs',
    sector: 'Recebíveis',
    quantity: 9000,
    avgPrice: 10.18,
    currentPrice: 9.72,
    pnl: -4140,
    returnPct: -4.52,
    weight: 9.6,
    dividendYield: 12.1,
    volatility: 8.8,
    status: 'Abaixo do preço médio',
    tone: 'atencao',
    recentHistory: [
      { date: 'Jan', price: 10.08 },
      { date: 'Fev', price: 9.96 },
      { date: 'Mar', price: 9.88 },
      { date: 'Abr', price: 9.8 },
      { date: 'Mai', price: 9.72 },
    ],
    news: ['IFIX opera de lado com juros futuros', 'Proventos mensais seguem no radar dos FIIs'],
    fundamentals: { pl: null, pvp: 0.98, roe: null, dy: 12.1 },
    benchmarkReturn: 4.54,
    sectorReturn: -1.8,
    highlightReason: 'Pressionou retorno, mas ajudou a reduzir volatilidade e elevar yield projetado.',
  },
]

export const portfolios: PortfolioData[] = [
  {
    id: 'principal',
    name: 'Carteira Principal',
    description: 'Mandato balanceado com ações Brasil, FIIs, renda fixa e caixa operacional.',
    updatedMinutesAgo: 12,
    benchmark: 'CDI',
    kpis: [
      { label: 'Patrimônio total', value: 'R$ 912.840', variation: 2.04, tone: 'positivo', badge: 'acima do mês', sparkline: [82, 83, 82, 85, 86, 85, 88, 90, 91] },
      { label: 'Rentabilidade', value: '+10,72%', variation: 1.46, tone: 'positivo', badge: 'período', sparkline: [0, 1, 0.4, 2.7, 4.1, 3.2, 5.9, 8.7, 10.7] },
      { label: 'P&L absoluto', value: 'R$ 88.340', variation: 8.12, tone: 'positivo', badge: 'realizado + aberto', sparkline: [0, 6, 2, 22, 33, 26, 48, 71, 88] },
      { label: 'Volatilidade', value: '16,8%', variation: -0.7, tone: 'neutro', badge: 'estimada', sparkline: [18, 17.2, 16.9, 17.4, 16.8, 16.5, 16.9, 16.8] },
      { label: 'DY projetado', value: '7,2%', variation: 0.4, tone: 'positivo', badge: '12 meses', sparkline: [6.5, 6.7, 6.9, 6.8, 7.0, 7.1, 7.2] },
      { label: 'Score de risco', value: '64/100', variation: 3.0, tone: 'atencao', badge: 'moderado alto', sparkline: [58, 59, 61, 62, 64, 63, 64] },
      { label: 'Número de ativos', value: '18', variation: 0, tone: 'neutro', badge: 'monitorados', sparkline: [17, 17, 18, 18, 18] },
      { label: 'Caixa disponível', value: 'R$ 46.120', variation: -1.2, tone: 'neutro', badge: '5,1%', sparkline: [52, 49, 47, 46, 46] },
    ],
    performanceHistory,
    allocationByClass: [
      { label: 'Ações', value: 58, color: '#8B5CF6' },
      { label: 'FIIs', value: 16, color: '#22D3EE' },
      { label: 'Renda fixa', value: 14, color: '#A78BFA' },
      { label: 'Caixa', value: 5, color: '#94A3B8' },
      { label: 'Internacional', value: 7, color: '#F59E0B' },
    ],
    allocationBySector: [
      { label: 'Bancos', value: 26.3, color: '#8B5CF6' },
      { label: 'Commodities', value: 20.3, color: '#F59E0B' },
      { label: 'Energia', value: 17.8, color: '#EC4899' },
      { label: 'FIIs', value: 16, color: '#22D3EE' },
      { label: 'Outros', value: 19.6, color: '#64748B' },
    ],
    allocationByRisk: [
      { label: 'Conservador', value: 28, color: '#22C55E' },
      { label: 'Moderado', value: 39, color: '#8B5CF6' },
      { label: 'Agressivo', value: 33, color: '#F59E0B' },
    ],
    allocationByLiquidity: [
      { label: 'D+0', value: 71, color: '#8B5CF6' },
      { label: 'D+1', value: 12, color: '#22D3EE' },
      { label: 'D+30', value: 11, color: '#F59E0B' },
      { label: 'Baixa liquidez', value: 6, color: '#F43F5E' },
    ],
    holdings,
    aiInsights: [
      {
        id: 'risk-financeiro',
        category: 'risco',
        severity: 'atencao',
        title: 'Exposição financeira acima da política interna',
        description: 'Bancos representam 26,3% da carteira. Somando crédito privado financeiro, a exposição chega a 38%.',
        cta: 'Ver detalhes',
      },
      {
        id: 'pnl-petr4',
        category: 'performance',
        severity: 'informativo',
        title: 'PETR4 concentrou o P&L positivo',
        description: 'O ativo respondeu por 42% do P&L positivo do mês, elevando a dependência de energia no resultado recente.',
        cta: 'Abrir ativo',
        ticker: 'PETR4',
      },
      {
        id: 'fiis-vol',
        category: 'alocacao',
        severity: 'informativo',
        title: 'FIIs reduziram volatilidade agregada',
        description: 'A parcela de FIIs suavizou a oscilação da carteira, apesar de ter pressionado o retorno no período.',
        cta: 'Comparar impacto',
      },
      {
        id: 'commodities',
        category: 'mercado',
        severity: 'atencao',
        title: 'Commodities ganharam peso por marcação a mercado',
        description: 'VALE3 valorizou e levou a exposição a commodities para 20,3%, ponto relevante para monitorar China e minério.',
        cta: 'Ver detalhes',
        ticker: 'VALE3',
      },
      {
        id: 'dy',
        category: 'dividendos',
        severity: 'informativo',
        title: 'Yield projetado subiu para 7,2%',
        description: 'A alta veio de bancos, energia elétrica e FIIs de recebíveis após os últimos comunicados de proventos.',
        cta: 'Ver detalhes',
      },
    ],
    performanceContribution: {
      top: [
        { symbol: 'PETR4', name: 'Petrobras PN', impactValue: 22344, impactPct: 2.71 },
        { symbol: 'VALE3', name: 'Vale ON', impactValue: 13384, impactPct: 1.62 },
        { symbol: 'ITUB4', name: 'Itaú Unibanco PN', impactValue: 11322, impactPct: 1.37 },
        { symbol: 'BBAS3', name: 'Banco do Brasil ON', impactValue: 6116, impactPct: 0.74 },
      ],
      detractors: [
        { symbol: 'MXRF11', name: 'Maxi Renda FII', impactValue: -4140, impactPct: -0.5 },
        { symbol: 'TAEE11', name: 'Taesa UNIT', impactValue: -2052, impactPct: -0.25 },
        { symbol: 'BOVA11', name: 'ETF Ibovespa', impactValue: -1180, impactPct: -0.14 },
      ],
    },
    riskMetrics: [
      { label: 'Top 5 ativos', value: '74,0%', detail: 'concentração do patrimônio', tone: 'atencao' },
      { label: 'Maior posição', value: '20,3%', detail: 'VALE3', tone: 'atencao' },
      { label: 'Setor máximo', value: '38,0%', detail: 'financeiro ampliado', tone: 'risco' },
      { label: 'Correlação média', value: '0,48', detail: 'entre ativos líquidos', tone: 'neutro' },
      { label: 'Volatilidade', value: '16,8%', detail: 'anualizada estimada', tone: 'neutro' },
      { label: 'Drawdown máximo', value: '-6,4%', detail: 'janela de 12 meses', tone: 'positivo' },
    ],
    correlation: [
      { left: 'PETR4', right: 'VALE3', value: 0.42 },
      { left: 'PETR4', right: 'ITUB4', value: 0.36 },
      { left: 'VALE3', right: 'ITUB4', value: 0.31 },
      { left: 'ITUB4', right: 'BBAS3', value: 0.74 },
      { left: 'TAEE11', right: 'MXRF11', value: 0.18 },
      { left: 'VALE3', right: 'MXRF11', value: 0.12 },
    ],
    marketEvents: [
      { id: 'evt-1', asset: 'VALE3', type: 'Macro', impact: 'alto', date: 'Hoje, 09:12', summary: 'Minério de ferro avançou após dados industriais da China melhores que o esperado.' },
      { id: 'evt-2', asset: 'PETR4', type: 'Commodities', impact: 'medio', date: 'Hoje, 08:45', summary: 'Brent abriu em alta e favorece leitura de energia na carteira.' },
      { id: 'evt-3', asset: 'MXRF11', type: 'Provento', impact: 'medio', date: 'Ontem, 18:02', summary: 'FII manteve distribuição mensal, sustentando yield projetado da carteira.' },
      { id: 'evt-4', asset: 'ITUB4', type: 'Setor', impact: 'baixo', date: 'Ontem, 16:30', summary: 'Curva de juros fechou e reduziu pressão sobre bancos de alta qualidade.' },
    ],
  },
  {
    id: 'dividendos',
    name: 'Carteira Dividendos',
    description: 'Foco em renda recorrente, empresas maduras, FIIs e previsibilidade de caixa.',
    updatedMinutesAgo: 18,
    benchmark: 'CDI',
    kpis: [
      { label: 'Patrimônio total', value: 'R$ 684.220', variation: 0.86, tone: 'positivo', badge: 'estável', sparkline: [65, 66, 66, 67, 68, 68] },
      { label: 'Rentabilidade', value: '+6,14%', variation: 0.62, tone: 'positivo', badge: 'período', sparkline: [0, 0.8, 1.7, 2.5, 4.2, 6.1] },
      { label: 'P&L absoluto', value: 'R$ 39.560', variation: 4.1, tone: 'positivo', badge: 'aberto', sparkline: [0, 5, 11, 16, 27, 39] },
      { label: 'Volatilidade', value: '10,9%', variation: -1.1, tone: 'positivo', badge: 'controlada', sparkline: [12, 11.7, 11.1, 10.9] },
      { label: 'DY projetado', value: '9,1%', variation: 0.8, tone: 'positivo', badge: '12 meses', sparkline: [8.4, 8.6, 8.8, 9.1] },
      { label: 'Score de risco', value: '48/100', variation: -2, tone: 'neutro', badge: 'moderado', sparkline: [51, 50, 49, 48] },
      { label: 'Número de ativos', value: '22', variation: 0, tone: 'neutro', badge: 'monitorados', sparkline: [22, 22, 22] },
      { label: 'Caixa disponível', value: 'R$ 31.780', variation: -0.4, tone: 'neutro', badge: '4,6%', sparkline: [34, 32, 31] },
    ],
    performanceHistory,
    allocationByClass: [
      { label: 'Ações', value: 44, color: '#8B5CF6' },
      { label: 'FIIs', value: 31, color: '#22D3EE' },
      { label: 'Renda fixa', value: 18, color: '#A78BFA' },
      { label: 'Caixa', value: 7, color: '#94A3B8' },
    ],
    allocationBySector: [
      { label: 'Bancos', value: 24, color: '#8B5CF6' },
      { label: 'Energia elétrica', value: 19, color: '#EC4899' },
      { label: 'Recebíveis', value: 18, color: '#22D3EE' },
      { label: 'Saneamento', value: 9, color: '#A78BFA' },
      { label: 'Outros', value: 30, color: '#64748B' },
    ],
    allocationByRisk: [
      { label: 'Conservador', value: 45, color: '#22C55E' },
      { label: 'Moderado', value: 42, color: '#8B5CF6' },
      { label: 'Agressivo', value: 13, color: '#F59E0B' },
    ],
    allocationByLiquidity: [
      { label: 'D+0', value: 62, color: '#8B5CF6' },
      { label: 'D+1', value: 10, color: '#22D3EE' },
      { label: 'D+30', value: 21, color: '#F59E0B' },
      { label: 'Baixa liquidez', value: 7, color: '#F43F5E' },
    ],
    holdings,
    aiInsights: [],
    performanceContribution: { top: [], detractors: [] },
    riskMetrics: [],
    correlation: [],
    marketEvents: [],
  },
  {
    id: 'growth',
    name: 'Carteira Growth',
    description: 'Exposição a crescimento, tecnologia, small caps selecionadas e exterior.',
    updatedMinutesAgo: 7,
    benchmark: 'Ibovespa',
    kpis: [
      { label: 'Patrimônio total', value: 'R$ 438.910', variation: 3.2, tone: 'positivo', badge: 'acima do benchmark', sparkline: [39, 40, 42, 41, 43, 44] },
      { label: 'Rentabilidade', value: '+13,8%', variation: 2.4, tone: 'positivo', badge: 'período', sparkline: [0, 1, 3, 2.2, 7, 13.8] },
      { label: 'P&L absoluto', value: 'R$ 53.240', variation: 9.6, tone: 'positivo', badge: 'aberto', sparkline: [0, 4, 11, 8, 27, 53] },
      { label: 'Volatilidade', value: '24,7%', variation: 1.9, tone: 'atencao', badge: 'elevada', sparkline: [22, 23, 24, 24.7] },
      { label: 'DY projetado', value: '2,4%', variation: -0.2, tone: 'neutro', badge: '12 meses', sparkline: [2.8, 2.7, 2.5, 2.4] },
      { label: 'Score de risco', value: '78/100', variation: 5, tone: 'risco', badge: 'alto', sparkline: [70, 72, 76, 78] },
      { label: 'Número de ativos', value: '14', variation: 0, tone: 'neutro', badge: 'monitorados', sparkline: [14, 14, 14] },
      { label: 'Caixa disponível', value: 'R$ 18.430', variation: -2.1, tone: 'neutro', badge: '4,2%', sparkline: [25, 22, 18] },
    ],
    performanceHistory,
    allocationByClass: [
      { label: 'Ações', value: 68, color: '#8B5CF6' },
      { label: 'ETFs', value: 14, color: '#22D3EE' },
      { label: 'Internacional', value: 14, color: '#F59E0B' },
      { label: 'Caixa', value: 4, color: '#94A3B8' },
    ],
    allocationBySector: [
      { label: 'Tecnologia', value: 24, color: '#22D3EE' },
      { label: 'Consumo', value: 18, color: '#8B5CF6' },
      { label: 'Commodities', value: 16, color: '#F59E0B' },
      { label: 'Financeiro', value: 14, color: '#EC4899' },
      { label: 'Outros', value: 28, color: '#64748B' },
    ],
    allocationByRisk: [
      { label: 'Conservador', value: 10, color: '#22C55E' },
      { label: 'Moderado', value: 32, color: '#8B5CF6' },
      { label: 'Agressivo', value: 58, color: '#F59E0B' },
    ],
    allocationByLiquidity: [
      { label: 'D+0', value: 76, color: '#8B5CF6' },
      { label: 'D+1', value: 11, color: '#22D3EE' },
      { label: 'D+30', value: 8, color: '#F59E0B' },
      { label: 'Baixa liquidez', value: 5, color: '#F43F5E' },
    ],
    holdings,
    aiInsights: [],
    performanceContribution: { top: [], detractors: [] },
    riskMetrics: [],
    correlation: [],
    marketEvents: [],
  },
]

const principal = portfolios[0]!

for (const portfolio of portfolios) {
  if (portfolio.id === 'principal') continue
  portfolio.aiInsights = principal.aiInsights
  portfolio.performanceContribution = principal.performanceContribution
  portfolio.riskMetrics = principal.riskMetrics
  portfolio.correlation = principal.correlation
  portfolio.marketEvents = principal.marketEvents
}

export function getPortfolioById(id: PortfolioId): PortfolioData {
  return portfolios.find((portfolio) => portfolio.id === id) ?? principal
}
