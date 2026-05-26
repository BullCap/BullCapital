'use client'

import { useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Eye,
  EyeOff,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Compass,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Sparkles,
  Globe,
  ArrowUpRight,
  ShieldCheck,
  BookOpen,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import { CompanyIcon } from '@/components/atoms/CompanyIcon'
import type { MarketListingItem } from '@/types/market'

interface HomeClientProps {
  firstName: string
  greetingStart: string
  dateLabel: string
  dataLabel: string
  heroSummary: string
  ibov: { price: number; changePercent: number } | null
  sp500: { price: number; changePercent: number } | null
  vix: number | null
  usdBrl: { bidPrice: number; askPrice: number } | null
  usdBrlChange: number | null
  selicRate: string | null
  ibovHistory: { date: string; close: number }[]
  sp500History: { date: string; close: number }[]
  gainers: MarketListingItem[]
  losers: MarketListingItem[]
  mostTraded: MarketListingItem[]
}

const CAROUSEL_SLIDES = [
  {
    id: 0,
    category: 'EM UM VISLUMBRE',
    title: 'Panorama Geral de Fechamento',
    text: '', // Filled dynamically by heroSummary
    icon: Globe,
  },
  {
    id: 1,
    category: 'MESA DE CÂMBIO',
    title: 'Dólar e Fluxo Estrangeiro',
    text: 'O fluxo de capital estrangeiro no mercado local impulsionou a liquidez, enquanto dados de inflação nos EUA mais moderados trouxeram alívio ao câmbio doméstico.',
    icon: Compass,
  },
  {
    id: 2,
    category: 'ANÁLISE SETORIAL',
    title: 'Commodities e Defensivos',
    text: 'Papéis ligados a commodities (minério de ferro e petróleo) sustentaram o índice no pregão de hoje, compensando a queda no setor financeiro e varejo.',
    icon: Sparkles,
  }
]

// B2B Model Portfolio Data Definitions
const MODELS_DATA = {
  conservadora: {
    name: 'Carteira Modelo Conservadora',
    advisedValue: 18250000,
    changePercent: 0.85,
    allocation: '90% Renda Fixa, 10% Ações',
    volatility: 'Baixa (Curva Linear)'
  },
  moderada: {
    name: 'Carteira Modelo Moderada',
    advisedValue: 20400000,
    changePercent: 1.34,
    allocation: '50% Renda Fixa, 40% Ações, 10% FIIs',
    volatility: 'Média (Volatilidade Suave)'
  },
  sofisticada: {
    name: 'Carteira Modelo Sofisticada',
    advisedValue: 9600000,
    changePercent: 2.84,
    allocation: '20% Renda Fixa, 60% Ações, 10% FIIs, 10% Global',
    volatility: 'Alta (Volatilidade Ativa)'
  }
} as const

// B2B Client Drift / Rebalancing Alerts Data
const REBALANCING_ALERTS = [
  {
    id: 0,
    clientName: 'Ana Souza',
    profile: 'Moderada',
    advisedValue: 4250000,
    targetAllocation: '50% Renda Fixa, 50% Variável',
    currentAllocation: '43.2% Renda Fixa, 56.8% Variável',
    drift: 6.8, // +6.8% Equities drift
    driftDirection: 'up', // Over-allocated in variable income
    assetToTrim: 'VALE3 (Vale)',
    recommendation: 'Reduzir R$ 290.000 em VALE3 e alocar em Letras Financeiras / IPCA+.'
  },
  {
    id: 1,
    clientName: 'Roberto Mendes',
    profile: 'Conservadora',
    advisedValue: 12800000,
    targetAllocation: '90% Renda Fixa, 10% Variável',
    currentAllocation: '94.2% Renda Fixa, 5.8% Variável',
    drift: -4.2, // -4.2% Equities drift
    driftDirection: 'down', // Under-allocated in variable income
    assetToTrim: 'Aportar Recursos',
    recommendation: 'Alocar R$ 540.000 em Fundos de Dividendos defensivos (Taesa/Alupar).'
  },
  {
    id: 2,
    clientName: 'Carla Dias',
    profile: 'Sofisticada',
    advisedValue: 5650000,
    targetAllocation: '20% Renda Fixa, 80% Variável',
    currentAllocation: '14.6% Renda Fixa, 85.4% Variável',
    drift: 5.4, // +5.4% Equities drift
    driftDirection: 'up',
    assetToTrim: 'PETR4 (Petrobras)',
    recommendation: 'Realizar lucros parciais de R$ 305.000 em PETR4 e direcionar para FIIs de Tijolo.'
  }
]

export default function HomeClient({
  firstName,
  greetingStart,
  dateLabel,
  dataLabel,
  heroSummary,
  ibov,
  sp500,
  vix,
  usdBrl,
  usdBrlChange,
  selicRate,
  ibovHistory,
  gainers,
  losers,
  mostTraded,
}: HomeClientProps) {
  const router = useRouter()

  // 1. Core B2B View Controls
  const [dashboardMode, setDashboardMode] = useState<'consolidated' | 'models' | 'alerts'>('consolidated')
  const [selectedModel, setSelectedModel] = useState<'conservadora' | 'moderada' | 'sofisticada'>('moderada')
  
  // 2. Interactive States
  const [showBalance, setShowBalance] = useState(true)
  const [activeRange, setActiveRange] = useState<'1D' | '1M' | '3M' | 'YTD' | '1Y'>('1M')
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [adviceFeedback, setAdviceFeedback] = useState<Record<number, 'up' | 'down'>>({})

  // 3. SVG Interactive Chart Refs
  const chartRef = useRef<SVGSVGElement>(null)

  // 4. B2B Portfolio Advised Value Calculations
  const baseAdvised = 48250000 // R$ 48.25M base
  const dailyChangePercent = ibov?.changePercent ?? 1.28
  
  const advisedChange = useMemo(() => {
    return baseAdvised * (dailyChangePercent / 100)
  }, [dailyChangePercent])
  
  const advisedTotal = useMemo(() => {
    return baseAdvised + advisedChange
  }, [advisedChange])

  // Get active history points based on selected range and selected dashboardMode
  const chartPoints = useMemo(() => {
    const rawData = ibovHistory.length > 0 ? ibovHistory : [
      { date: '01/05', close: 112000 },
      { date: '05/05', close: 114200 },
      { date: '10/05', close: 113100 },
      { date: '15/05', close: 115900 },
      { date: '20/05', close: 117200 },
      { date: '25/05', close: 118234 },
    ]

    // Slice based on active range first
    let sliced = rawData
    if (activeRange === '1D') {
      sliced = rawData.slice(-6)
    } else if (activeRange === '1M') {
      sliced = rawData.slice(-20)
    } else if (activeRange === '3M') {
      sliced = rawData.slice(-60)
    } else if (activeRange === 'YTD') {
      sliced = rawData.slice(-100)
    } else if (activeRange === '1Y') {
      sliced = rawData
    }

    // Adapt curves dynamically based on Model Portfolio selection for incredibly rich visuals
    if (dashboardMode === 'models') {
      return sliced.map((p, i) => {
        let adaptedClose = p.close
        const ratio = i / (sliced.length - 1 || 1)
        
        if (selectedModel === 'conservadora') {
          // Extremely linear, steady growth with low volatility simulating fixed-income CDI accumulation
          const startClose = 110000
          adaptedClose = startClose + ratio * 8500 + Math.sin(ratio * 12) * 350
        } else if (selectedModel === 'sofisticada') {
          // Highly volatile, aggressive swings representing 80%+ stock/global exposure
          adaptedClose = p.close + Math.sin(ratio * 18) * 4500 - Math.cos(ratio * 6) * 2200
        } else {
          // Moderada: mild, realistic market volatility
          adaptedClose = p.close + Math.sin(ratio * 8) * 1200
        }
        
        return {
          date: p.date,
          close: Math.round(adaptedClose),
          index: i
        }
      })
    }

    return sliced.map((p, i) => ({
      ...p,
      index: i,
    }))
  }, [ibovHistory, activeRange, dashboardMode, selectedModel])

  // Calculate SVG paths
  const svgMetrics = useMemo(() => {
    if (chartPoints.length === 0) return { linePath: '', areaPath: '', points: [] }
    const minVal = Math.min(...chartPoints.map((d) => d.close))
    const maxVal = Math.max(...chartPoints.map((d) => d.close))
    const span = maxVal - minVal || 1

    const width = 800
    const height = 180

    const points = chartPoints.map((d, i) => {
      const x = (i / (chartPoints.length - 1)) * width
      const y = height - 10 - ((d.close - minVal) / span) * (height - 30)
      return { x, y, ...d }
    })

    const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')
    const areaPath = `${linePath} L ${points[points.length - 1]!.x} 180 L ${points[0]!.x} 180 Z`

    return { linePath, areaPath, points }
  }, [chartPoints])

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!chartRef.current || svgMetrics.points.length === 0) return
    const rect = chartRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const svgWidth = rect.width
    const pointsCount = svgMetrics.points.length

    const ratio = Math.max(0, Math.min(1, mouseX / svgWidth))
    const index = Math.round(ratio * (pointsCount - 1))
    setHoverIndex(index)
  }

  const handleMouseLeave = () => {
    setHoverIndex(null)
  }

  const activeHoverPoint = hoverIndex !== null && svgMetrics.points[hoverIndex] ? svgMetrics.points[hoverIndex] : null

  // Helpers for text formatting
  const formatBRL = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2).replace('.', ',')}%`
  }

  // Generate WhatsApp pitch prompt for a client rebalance drift
  const handleGenerateProposal = (alert: typeof REBALANCING_ALERTS[number]) => {
    const driftText = `${alert.driftDirection === 'up' ? 'excesso' : 'déficit'} de ${Math.abs(alert.drift)}% em cotação variável`
    const prompt = `Formule uma proposta de rebalanceamento amigável e extremamente profissional para o cliente ${alert.clientName} (perfil de risco ${alert.profile}). Explique que devido às movimentações recentes do mercado, a carteira sofreu um desvio (drift) de ${driftText}. Contextualize a seguinte ação tática para avaliação do profissional: "${alert.recommendation}". Conclua estruturando a mensagem em um formato perfeito para envio rápido via WhatsApp.`
    
    router.push(`/analysis?q=${encodeURIComponent(prompt)}`)
  }

  // Advisor guidelines
  const ADVICE_CARDS = [
    {
      id: 0,
      title: 'Aproveitar IPCA+ acima de 6,2% a.a.',
      description: 'Taxas reais de juros atingiram patamares ideais para proteção patrimonial de longo prazo. Sugira travar rendimentos em carteiras com perfil moderado.',
      tag: 'Renda Fixa',
      time: 'Diretriz ativa',
    },
    {
      id: 1,
      title: 'Redução tática em Estatais (Vale/Petrobras)',
      description: 'A volatilidade política e oscilação nas commodities justificam um rebalanceamento defensivo para dividendos de utilidade pública (energia/saneamento).',
      tag: 'Ações BR',
      time: 'Diretriz ativa',
    }
  ]

  return (
    <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_24rem] 2xl:grid-cols-[minmax(0,1fr)_27rem] mt-2 lg:mt-0">
      
      {/* LEFT COLUMN: Main Dashboard */}
      <div className="min-w-0 flex flex-col gap-6">
        
        {/* 1. Header & Greeting */}
        <header className="px-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#94a3b8]/40">{dateLabel}</p>
            <h1 className="mt-1 font-serif text-[28px] lg:text-[34px] leading-tight tracking-tight text-white">
              {greetingStart}, <span className="font-semibold text-gradient-amethyst">{firstName}</span>.
            </h1>
          </div>
          
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/[0.04] bg-white/[0.02] px-3.5 py-1.5 text-xs text-[#cbd5e1]/60">
              <ShieldCheck size={13} className="text-[#4ade80]" /> CFP® Credenciado
            </span>
          </div>
        </header>

        {/* B2B Segmented View Pill Control (Astor Style) */}
        <div className="px-1">
          <div className="flex border border-white/[0.06] bg-black/20 p-1 rounded-xl w-full sm:w-fit backdrop-blur-2xl shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
            {(['consolidated', 'models', 'alerts'] as const).map((mode) => {
              const label = mode === 'consolidated' ? 'Consolidado' : mode === 'models' ? 'Carteiras Modelo' : 'Alertas de Rebalanceamento'
              const active = dashboardMode === mode
              
              return (
                <button
                  key={mode}
                  onClick={() => {
                    setDashboardMode(mode)
                    setHoverIndex(null) // reset hover chart
                  }}
                  className={cn(
                    'flex-1 sm:flex-none px-4 py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all duration-300 focus:outline-none whitespace-nowrap',
                    active
                      ? 'bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_4px_10px_rgba(0,0,0,0.2)]'
                      : 'text-[#94a3b8]/50 hover:text-white hover:bg-white/[0.02]'
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. Main Interactive Dashboard Section */}
        {dashboardMode === 'alerts' ? (
          /* B2B REBALANCING / ALERTS MONITORING DASHBOARD PANEL */
          <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111520]/40 p-6 sm:p-8 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_20px_45px_rgba(0,0,0,0.65)] min-h-[350px]">
            <GlassHighlight widthPercent={60} className="via-white/10" />
            
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F43F5E] flex items-center gap-1.5">
                <AlertTriangle size={12} className="animate-pulse" /> Monitor de Enquadramento de Carteiras
              </span>
              <h2 className="font-serif text-2xl font-semibold text-white tracking-tight">
                Clientes em Desvio de Suitability (Drift)
              </h2>
              <p className="text-xs text-[#cbd5e1]/50 max-w-2xl leading-relaxed mt-1">
                Os seguintes clientes desviaram do enquadramento alvo do perfil de risco devido às variações nos ativos. Selecione para estruturar o pitch de rebalanceamento instantaneamente com IA.
              </p>
            </div>

            {/* List of client drift cards */}
            <div className="mt-7 space-y-4">
              {REBALANCING_ALERTS.map((alert) => (
                <div
                  key={alert.id}
                  className="relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 backdrop-blur-xl transition hover:border-[#94a3b8]/20 hover:bg-white/[0.02]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      {/* Avatar initial badge */}
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-[13px] font-bold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                        {alert.clientName.split(' ').map(n => n[0]).join('')}
                      </span>
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{alert.clientName}</h4>
                          <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold text-[#cbd5e1]/60 border border-white/[0.06]">
                            Perfil {alert.profile}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-[#94a3b8]/50">
                          Patrimônio sob gestão: <span className="font-bold text-white/80">{formatBRL(alert.advisedValue)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Drift status indicators */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 md:ml-auto md:mr-8 text-xs">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-[#94a3b8]/40 uppercase tracking-widest font-bold">Target Alvo</span>
                        <span className="text-[#cbd5e1] font-semibold mt-1 truncate max-w-[8.5rem]">{alert.targetAllocation}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-[9px] text-[#94a3b8]/40 uppercase tracking-widest font-bold">Alocação Atual</span>
                        <span className="text-white font-bold mt-1 truncate max-w-[8.5rem]">{alert.currentAllocation}</span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[9px] text-[#94a3b8]/40 uppercase tracking-widest font-bold">Desvio Registrado</span>
                        <span className={cn(
                          'font-bold mt-1 flex items-center gap-1',
                          alert.driftDirection === 'up' ? 'text-[#4ade80]' : 'text-[#F43F5E]'
                        )}>
                          {alert.driftDirection === 'up' ? '+' : ''}{alert.drift}% {alert.driftDirection === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        </span>
                      </div>
                    </div>

                    {/* Generate Trade Pitch button */}
                    <button
                      onClick={() => handleGenerateProposal(alert)}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-white text-[#07060A] px-4 text-xs font-bold transition hover:bg-[#cbd5e1] active:scale-[0.98] shadow-md w-full md:w-auto shrink-0"
                    >
                      <Sparkles size={13} /> Gerar Proposta IA
                    </button>
                  </div>
                  
                  {/* Actionable Trade recommendations below card */}
                  <div className="mt-3.5 border-t border-white/[0.03] pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                    <span className="text-[#94a3b8]/50 leading-relaxed">
                      <span className="font-bold text-[#94a3b8]/70">Tese Proposta:</span> {alert.recommendation}
                    </span>
                    
                    <span className="text-[10px] text-[#F43F5E]/60 flex items-center gap-1.5 shrink-0 self-end sm:self-auto font-medium">
                      Exposição excessiva em: {alert.assetToTrim}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          /* PORTFOLIO PERFORMANCE DASHBOARD (Consolidado or Carteiras Modelo) */
          <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111520]/40 p-6 sm:p-8 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_20px_45px_rgba(0,0,0,0.65)]">
            <GlassHighlight widthPercent={50} className="via-white/10" />
            
            {/* Custom Model Portfolio selection row */}
            {dashboardMode === 'models' && (
              <div className="grid gap-3.5 sm:grid-cols-3 mb-6">
                {(['conservadora', 'moderada', 'sofisticada'] as const).map((modelKey) => {
                  const model = MODELS_DATA[modelKey]
                  const active = selectedModel === modelKey
                  
                  return (
                    <button
                      key={modelKey}
                      onClick={() => {
                        setSelectedModel(modelKey)
                        setHoverIndex(null) // reset hover point
                      }}
                      className={cn(
                        'relative overflow-hidden rounded-lg border p-4 text-left backdrop-blur-2xl transition duration-300 focus:outline-none',
                        active 
                          ? 'border-[#cbd5e1]/30 bg-white/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]' 
                          : 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02]'
                      )}
                    >
                      <span className="text-[9px] font-bold text-[#94a3b8]/50 uppercase tracking-widest leading-none block">
                        Perfil {modelKey}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-1.5 leading-none">{model.name.replace('Carteira Modelo ', '')}</h4>
                      <p className="text-[10px] text-[#cbd5e1]/60 mt-2 font-semibold leading-none">{formatBRL(model.advisedValue)}</p>
                      
                      <div className="flex items-center justify-between mt-3 text-[9px] text-[#94a3b8]/40 leading-none">
                        <span>{model.volatility}</span>
                        <span className="text-[#4ade80] font-bold">{formatPercent(model.changePercent)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#94a3b8]/50 flex items-center gap-1.5">
                  {dashboardMode === 'models' ? MODELS_DATA[selectedModel].name : 'Patrimônio sob Aconselhamento'}
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-[#94a3b8]/40 hover:text-white transition focus:outline-none"
                    aria-label={showBalance ? 'Ocultar saldo' : 'Exibir saldo'}
                  >
                    {showBalance ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </span>
                
                <div className="mt-2.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="font-serif text-[28px] sm:text-[38px] font-semibold leading-none text-white tracking-tight">
                    {showBalance 
                      ? formatBRL(dashboardMode === 'models' ? MODELS_DATA[selectedModel].advisedValue : advisedTotal) 
                      : 'R$ •••••••••••'}
                  </span>
                  
                  <span className={cn(
                    'text-xs sm:text-sm font-semibold flex items-center gap-1 leading-none py-1 px-2.5 rounded-lg backdrop-blur-md',
                    (dashboardMode === 'models' ? MODELS_DATA[selectedModel].changePercent : dailyChangePercent) >= 0 
                      ? 'text-[#4ade80] border border-[#4ade80]/10 bg-[#4ade80]/5' 
                      : 'text-[#F43F5E] border border-[#F43F5E]/10 bg-[#F43F5E]/5'
                  )}>
                    {(dashboardMode === 'models' ? MODELS_DATA[selectedModel].changePercent : dailyChangePercent) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {showBalance 
                      ? `${formatBRL(dashboardMode === 'models' ? (MODELS_DATA[selectedModel].advisedValue * (MODELS_DATA[selectedModel].changePercent / 100)) : advisedChange)} (${formatPercent(dashboardMode === 'models' ? MODELS_DATA[selectedModel].changePercent : dailyChangePercent)})` 
                      : formatPercent(dashboardMode === 'models' ? MODELS_DATA[selectedModel].changePercent : dailyChangePercent)}
                  </span>
                </div>
              </div>
              
              {/* Interactive hover details */}
              <div className={cn(
                'h-12 min-w-[9.5rem] rounded-lg border border-white/[0.04] bg-white/[0.01] px-3.5 py-1.5 flex flex-col justify-center transition-all duration-300',
                activeHoverPoint ? 'opacity-100 border-[#94a3b8]/20 bg-white/[0.03]' : 'opacity-0 pointer-events-none'
              )}>
                {activeHoverPoint && (
                  <>
                    <span className="text-[9px] font-bold text-[#94a3b8]/40 uppercase tracking-widest leading-none">
                      {dashboardMode === 'models' ? 'Rendimento Nominal' : 'Pontos do Índice'}
                    </span>
                    <span className="text-[13px] font-bold text-white leading-none mt-1.5">
                      {dashboardMode === 'models' 
                        ? formatBRL(activeHoverPoint.close) 
                        : `${activeHoverPoint.close.toLocaleString('pt-BR')} pts`}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Sparkline Canvas */}
            <div className="relative mt-7 w-full h-[180px] overflow-hidden select-none">
              <svg
                ref={chartRef}
                viewBox="0 0 800 180"
                preserveAspectRatio="none"
                className="w-full h-full cursor-crosshair overflow-visible"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <defs>
                  <linearGradient id="chart-area-glow" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#4ade80" stopOpacity="0.22" />
                    <stop offset="70%" stopColor="#4ade80" stopOpacity="0.02" />
                    <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Grid line on hover */}
                {activeHoverPoint && (
                  <line
                    x1={activeHoverPoint.x}
                    y1={0}
                    x2={activeHoverPoint.x}
                    y2={180}
                    stroke="rgba(148, 163, 184, 0.15)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                )}
                
                {/* Glow Area Path */}
                {svgMetrics.areaPath && (
                  <path d={svgMetrics.areaPath} fill="url(#chart-area-glow)" />
                )}
                
                {/* Stroke Line Path */}
                {svgMetrics.linePath && (
                  <path
                    d={svgMetrics.linePath}
                    fill="none"
                    stroke="#4ade80"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                
                {/* Glowing anchor point at cursor hover */}
                {activeHoverPoint && (
                  <>
                    <circle
                      cx={activeHoverPoint.x}
                      cy={activeHoverPoint.y}
                      r={6}
                      fill="#4ade80"
                      fillOpacity={0.25}
                    />
                    <circle
                      cx={activeHoverPoint.x}
                      cy={activeHoverPoint.y}
                      r={3}
                      fill="white"
                      stroke="#4ade80"
                      strokeWidth={1.5}
                    />
                  </>
                )}
              </svg>
            </div>

            {/* Time range selectors below chart */}
            <div className="mt-5 flex items-center justify-between border-t border-white/[0.04] pt-5">
              <div className="flex gap-1.5">
                {(['1D', '1M', '3M', 'YTD', '1Y'] as const).map((range) => {
                  const active = activeRange === range
                  return (
                    <button
                      key={range}
                      onClick={() => setActiveRange(range)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 focus:outline-none',
                        active 
                          ? 'bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]' 
                          : 'text-[#94a3b8]/50 hover:bg-white/[0.02] hover:text-[#cbd5e1]'
                      )}
                    >
                      {range}
                    </button>
                  )
                })}
              </div>
              
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#4ade80] animate-pulse" />
                <span className="text-[10px] font-bold text-[#94a3b8]/40 uppercase tracking-widest">
                  {dashboardMode === 'models' ? MODELS_DATA[selectedModel].allocation : 'Tempo Real (IBOV)'}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* 3. "EM UM VISLUMBRE" Carousel Card */}
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111520]/45 p-6 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_12px_36px_rgba(0,0,0,0.35)]">
          <GlassHighlight widthPercent={30} className="via-white/5" />
          
          {(() => {
            const activeSlide = CAROUSEL_SLIDES[carouselIndex]!
            const Icon = activeSlide.icon
            const textContent = activeSlide.id === 0 ? heroSummary : activeSlide.text

            return (
              <div className="flex flex-col gap-4 min-h-[140px] justify-between">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#94a3b8]/50">
                      {activeSlide.category}
                    </span>
                    <h3 className="mt-1 font-serif text-lg font-semibold text-white">
                      {activeSlide.title}
                    </h3>
                  </div>
                  
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#cbd5e1]">
                    <Icon size={16} />
                  </span>
                </div>
                
                <p className="text-sm leading-relaxed text-[#cbd5e1]/80 max-w-4xl">
                  {textContent}
                </p>
                
                <div className="mt-2 flex items-center justify-between border-t border-white/[0.04] pt-4">
                  <div className="flex gap-2">
                    {CAROUSEL_SLIDES.map((slide) => {
                      const active = carouselIndex === slide.id
                      return (
                        <button
                          key={slide.id}
                          onClick={() => setCarouselIndex(slide.id)}
                          className={cn(
                            'h-1.5 rounded-full transition-all duration-500 focus:outline-none',
                            active ? 'w-6 bg-white/80' : 'w-1.5 bg-white/20'
                          )}
                          aria-label={`Slide ${slide.id + 1}`}
                        />
                      )
                    })}
                  </div>
                  
                  <Link 
                    href="/analysis" 
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white/60 hover:text-white transition"
                  >
                    Abrir no Copiloto <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            )
          })()}
        </section>

        {/* 4. "DIRETRIZES DE ALOCAÇÃO" (Advice) */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#94a3b8]/40 px-1 mt-2">
            Diretrizes de alocação em acompanhamento
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            {ADVICE_CARDS.map((card) => {
              const feedback = adviceFeedback[card.id]
              
              return (
                <article
                  key={card.id}
                  className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111520]/30 p-6 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.02]"
                >
                  <GlassHighlight widthPercent={40} className="via-white/5" />
                  
                  <div className="flex flex-col h-full justify-between gap-5">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#94a3b8]/60">
                          {card.tag}
                        </span>
                        <span className="text-[9px] text-[#94a3b8]/30 font-semibold">{card.time}</span>
                      </div>
                      
                      <h3 className="mt-3.5 font-serif text-[16px] font-bold text-white leading-snug">
                        {card.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-[#cbd5e1]/60">
                        {card.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-white/[0.04] pt-4 mt-auto">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setAdviceFeedback({ ...adviceFeedback, [card.id]: 'up' })}
                          className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-lg border transition focus:outline-none',
                            feedback === 'up'
                              ? 'border-[#4ade80]/20 bg-[#4ade80]/10 text-[#4ade80]'
                              : 'border-white/[0.04] bg-white/[0.02] text-[#94a3b8]/40 hover:text-white hover:bg-white/[0.06]'
                          )}
                          aria-label="Marcar como útil"
                        >
                          <ThumbsUp size={11} />
                        </button>
                        <button
                          onClick={() => setAdviceFeedback({ ...adviceFeedback, [card.id]: 'down' })}
                          className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-lg border transition focus:outline-none',
                            feedback === 'down'
                              ? 'border-[#F43F5E]/20 bg-[#F43F5E]/10 text-[#F43F5E]'
                              : 'border-white/[0.04] bg-white/[0.02] text-[#94a3b8]/40 hover:text-white hover:bg-white/[0.06]'
                          )}
                          aria-label="Marcar como não útil"
                        >
                          <ThumbsDown size={11} />
                        </button>
                      </div>
                      
                      <Link 
                        href="/analysis"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#94a3b8]/70 hover:text-white transition"
                      >
                        Estudo Completo <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {/* 5. Additional Market Digests */}
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111520]/25 p-6 backdrop-blur-2xl mt-2">
          <div className="grid gap-6 md:grid-cols-3">
            
            {/* Movers: Highs */}
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#4ade80] flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" /> Maiores Altas
              </p>
              <div className="space-y-3.5">
                {gainers.slice(0, 5).map((asset) => (
                  <Link key={asset.stock} href={`/asset/${asset.stock}`} className="flex items-center gap-3.5 group">
                    <CompanyIcon ticker={asset.stock} size={26} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold leading-none text-white transition group-hover:text-gradient-amethyst">{asset.stock}</p>
                      <p className="mt-1.5 truncate text-[10px] text-[#94a3b8]/40 leading-none">{asset.name}</p>
                    </div>
                    <div className="shrink-0 text-right text-[11px] leading-tight">
                      <p className="text-white/80">{asset.close.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      <p className="text-[#4ade80] font-semibold mt-1">
                        {formatPercent(asset.change)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Movers: Lows */}
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F43F5E] flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F43F5E]" /> Maiores Quedas
              </p>
              <div className="space-y-3.5">
                {losers.slice(0, 5).map((asset) => (
                  <Link key={asset.stock} href={`/asset/${asset.stock}`} className="flex items-center gap-3.5 group">
                    <CompanyIcon ticker={asset.stock} size={26} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold leading-none text-white transition group-hover:text-gradient-amethyst">{asset.stock}</p>
                      <p className="mt-1.5 truncate text-[10px] text-[#94a3b8]/40 leading-none">{asset.name}</p>
                    </div>
                    <div className="shrink-0 text-right text-[11px] leading-tight">
                      <p className="text-white/80">{asset.close.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      <p className="text-[#F43F5E] font-semibold mt-1">
                        {formatPercent(asset.change)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Movers: Most Traded */}
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white/40" /> Mais Negociados
              </p>
              <div className="space-y-3.5">
                {mostTraded.slice(0, 5).map((asset) => (
                  <Link key={asset.stock} href={`/asset/${asset.stock}`} className="flex items-center gap-3.5 group">
                    <CompanyIcon ticker={asset.stock} size={26} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold leading-none text-white transition group-hover:text-gradient-amethyst">{asset.stock}</p>
                      <p className="mt-1.5 truncate text-[10px] text-[#94a3b8]/40 leading-none">{asset.name}</p>
                    </div>
                    <div className="shrink-0 text-right text-[11px] leading-tight">
                      <p className="text-white/80">{asset.close.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      <p className={cn('font-semibold mt-1', asset.change >= 0 ? 'text-[#4ade80]' : 'text-[#F43F5E]')}>
                        {formatPercent(asset.change)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </section>

      </div>

      {/* RIGHT COLUMN: Desktop Sticky Sidebar */}
      <aside className="hidden xl:block">
        <div className="sticky top-[5.5rem] space-y-6">
          
          {/* A. Indices & Rates List */}
          <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111520]/25 p-5 backdrop-blur-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#94a3b8]/40 mb-4">
              Monitor de Indicadores
            </p>
            
            <div className="space-y-4">
              {/* IBOV */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Ibovespa</p>
                  <p className="text-[9px] text-[#94a3b8]/40 leading-none mt-1">{dataLabel}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-white">
                    {ibov ? ibov.price.toLocaleString('pt-BR') : '--'} pts
                  </p>
                  <p className={cn('text-[10px] font-bold leading-none mt-1', (ibov?.changePercent ?? 0) >= 0 ? 'text-[#4ade80]' : 'text-[#F43F5E]')}>
                    {ibov ? formatPercent(ibov.changePercent) : '--'}
                  </p>
                </div>
              </div>
              
              {/* S&P 500 */}
              <div className="flex items-center justify-between border-t border-white/[0.04] pt-3.5">
                <div>
                  <p className="text-xs font-bold text-white">S&P 500</p>
                  <p className="text-[9px] text-[#94a3b8]/40 leading-none mt-1">Mercado Nova York</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-white">
                    {sp500 ? sp500.price.toLocaleString('en-US') : '--'}
                  </p>
                  <p className={cn('text-[10px] font-bold leading-none mt-1', (sp500?.changePercent ?? 0) >= 0 ? 'text-[#4ade80]' : 'text-[#F43F5E]')}>
                    {sp500 ? formatPercent(sp500.changePercent) : '--'}
                  </p>
                </div>
              </div>

              {/* DÓLAR */}
              <div className="flex items-center justify-between border-t border-white/[0.04] pt-3.5">
                <div>
                  <p className="text-xs font-bold text-white">USD / BRL</p>
                  <p className="text-[9px] text-[#94a3b8]/40 leading-none mt-1">Cotação Comercial</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-white">
                    {usdBrl ? usdBrl.bidPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '--'}
                  </p>
                  <p className={cn('text-[10px] font-bold leading-none mt-1', (usdBrlChange ?? 0) >= 0 ? 'text-[#4ade80]' : 'text-[#F43F5E]')}>
                    {usdBrlChange !== null ? formatPercent(usdBrlChange) : '--'}
                  </p>
                </div>
              </div>

              {/* SELIC */}
              <div className="flex items-center justify-between border-t border-white/[0.04] pt-3.5">
                <div>
                  <p className="text-xs font-bold text-white">Taxa SELIC</p>
                  <p className="text-[9px] text-[#94a3b8]/40 leading-none mt-1">Banco Central</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-white">{selicRate ?? '--'}%</p>
                  <p className="text-[9px] text-[#94a3b8]/35 leading-none mt-1">Meta Vigente</p>
                </div>
              </div>

              {/* VIX */}
              <div className="flex items-center justify-between border-t border-white/[0.04] pt-3.5">
                <div>
                  <p className="text-xs font-bold text-white">Índice VIX</p>
                  <p className="text-[9px] text-[#94a3b8]/40 leading-none mt-1">Volatilidade (Medo)</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-white">
                    {vix ? vix.toFixed(2) : '--'}
                  </p>
                  <p className="text-[9px] text-[#94a3b8]/35 leading-none mt-1">Aversão global</p>
                </div>
              </div>
            </div>
          </section>

          {/* B. Radar Watchlist Quick View */}
          <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111520]/25 p-5 backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#94a3b8]/40">
                Ativos em Foco
              </p>
              <Link href="/search" className="text-[10px] font-bold text-[#cbd5e1]/50 hover:text-white transition">
                Buscar Todos
              </Link>
            </div>
            
            <div className="space-y-3.5">
              {mostTraded.slice(0, 4).map((asset) => (
                <div key={asset.stock} className="flex items-center justify-between group">
                  <Link href={`/asset/${asset.stock}`} className="flex items-center gap-3 group">
                    <CompanyIcon ticker={asset.stock} size={22} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white transition group-hover:text-gradient-amethyst">{asset.stock}</p>
                      <p className="text-[9px] text-[#94a3b8]/40 truncate w-[7rem] leading-none mt-0.5">{asset.name}</p>
                    </div>
                  </Link>
                  <div className="text-right text-[11px] leading-tight">
                    <p className="text-white/80">{asset.close.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    <p className={cn('font-semibold mt-0.5', asset.change >= 0 ? 'text-[#4ade80]' : 'text-[#F43F5E]')}>
                      {formatPercent(asset.change)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/search"
              className="mt-5 flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] py-2 text-xs font-bold text-white transition hover:bg-white/[0.05] hover:border-white/[0.12]"
            >
              <Plus size={13} /> Monitorar Novo Ativo
            </Link>
          </section>

          {/* C. Actionable IA Insight Brief */}
          <section className="relative overflow-hidden rounded-2xl border border-[#94a3b8]/15 bg-[linear-gradient(150deg,rgba(148,163,184,0.05)_0%,rgba(18,21,32,0.75)_50%,rgba(18,21,32,0.95)_100%)] p-6 backdrop-blur-2xl shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
            <div className="pointer-events-none absolute -left-10 top-0 h-28 w-28 rounded-full bg-[#cbd5e1]/5 blur-[60px]" />
            
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white">
              <BookOpen size={14} />
            </span>
            
            <h3 className="mt-4 font-serif text-[16px] font-bold text-white leading-snug">
              Precisa embasar uma história para um cliente?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#cbd5e1]/60">
              Gere narrativas personalizadas baseadas nos dados fundamentais mais recentes e históricos setoriais em segundos.
            </p>
            
            <Link
              href="/analysis"
              className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-white text-[#07060A] py-2.5 text-xs font-bold transition hover:bg-[#cbd5e1] hover:scale-[1.01] active:scale-[0.99] shadow-lg"
            >
              Iniciar Pesquisa IA
            </Link>
          </section>

        </div>
      </aside>

    </div>
  )
}
