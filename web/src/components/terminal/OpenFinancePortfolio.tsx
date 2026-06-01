'use client'

import { useState, useEffect } from 'react'
import { Landmark, Check, Plus, RefreshCw, Sparkles, Info, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

interface OpenFinanceState {
  syncedBanks: string[]
  totalCapital: number
  stocksPercent: number
  fixedIncomePercent: number
  fiisPercent: number
  riskScore: number
}

interface OpenFinancePortfolioProps {
  state: OpenFinanceState
  onChange: (newState: OpenFinanceState) => void
}

interface Institution {
  id: string
  name: string
  fullName: string
  color: string
  accentColor: string
  bgAccent: string
  capital: number
  fixedIncome: number
  stocks: number
  fiis: number
  global: number
  volatility: number
  beta: number
  sharpe: number
  yieldRate: number // dividend yield anual estimado
}

const INSTITUTIONS: Record<string, Institution> = {
  XP: {
    id: 'XP',
    name: 'XP Investimentos',
    fullName: 'XP Corretora de Valores',
    color: '#FFD700',
    accentColor: 'rgba(245, 158, 11, 0.4)',
    bgAccent: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
    capital: 85000,
    fixedIncome: 20000,
    stocks: 35000,
    fiis: 20000,
    global: 10000,
    volatility: 14.5,
    beta: 1.12,
    sharpe: 1.10,
    yieldRate: 8.8,
  },
  ITAU: {
    id: 'ITAU',
    name: 'Itaú Unibanco',
    fullName: 'Itaú Personnalité S.A.',
    color: '#FF5E00',
    accentColor: 'rgba(249, 115, 22, 0.4)',
    bgAccent: 'border-orange-500/20 bg-orange-500/5 text-orange-400',
    capital: 45000,
    fixedIncome: 40000,
    stocks: 0,
    fiis: 5000,
    global: 0,
    volatility: 4.8,
    beta: 0.05,
    sharpe: 1.40,
    yieldRate: 7.2,
  },
  BTG: {
    id: 'BTG',
    name: 'BTG Pactual',
    fullName: 'BTG Pactual Asset Management',
    color: '#00D2FF',
    accentColor: 'rgba(6, 182, 212, 0.4)',
    bgAccent: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400',
    capital: 35000,
    fixedIncome: 20000,
    stocks: 0,
    fiis: 0,
    global: 15000,
    volatility: 8.5,
    beta: 0.52,
    sharpe: 1.15,
    yieldRate: 7.8,
  },
  NUBANK: {
    id: 'NUBANK',
    name: 'Nubank',
    fullName: 'Nu Financeira S.A.',
    color: '#A855F7',
    accentColor: 'rgba(168, 85, 247, 0.4)',
    bgAccent: 'border-purple-500/20 bg-purple-500/5 text-purple-400',
    capital: 15000,
    fixedIncome: 15000,
    stocks: 0,
    fiis: 0,
    global: 0,
    volatility: 3.2,
    beta: 0.01,
    sharpe: 1.80,
    yieldRate: 10.75, // conta rendendo 100% CDI
  },
}

export default function OpenFinancePortfolio({ state, onChange }: OpenFinancePortfolioProps) {
  const [syncedBanks, setSyncedBanks] = useState<string[]>(state.syncedBanks)
  const [syncingBank, setSyncingBank] = useState<string | null>(null)

  // Dispara a sincronização de dados após modificação na seleção
  useEffect(() => {
    const calculated = getConsolidatedData()
    onChange({
      syncedBanks,
      totalCapital: calculated.totalCapital,
      stocksPercent: Math.round(calculated.stocksPercent),
      fixedIncomePercent: Math.round(calculated.fixedIncomePercent),
      fiisPercent: Math.round(calculated.fiisPercent),
      riskScore: Math.round(calculated.volatility * 5),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncedBanks])

  // Trata o clique para sincronizar/desconectar banco com micro-animação
  const handleToggleBank = (bankId: string) => {
    if (syncedBanks.includes(bankId)) {
      setSyncedBanks(syncedBanks.filter((id) => id !== bankId))
    } else {
      setSyncingBank(bankId)
      setTimeout(() => {
        setSyncedBanks([...syncedBanks, bankId])
        setSyncingBank(null)
      }, 750) // Efeito de sincronização
    }
  }

  // Calcula todo o consolidado com base nos bancos ativos
  const getConsolidatedData = () => {
    let totalCapital = 0
    let fixedIncome = 0
    let stocks = 0
    let fiis = 0
    let global = 0
    let weightedVol = 0
    let weightedBeta = 0
    let weightedSharpe = 0
    let totalYieldIncome = 0

    const activeInstitutions = syncedBanks.map((id) => INSTITUTIONS[id]).filter(Boolean) as Institution[]

    if (activeInstitutions.length > 0) {
      activeInstitutions.forEach((bank) => {
        totalCapital += bank.capital
        fixedIncome += bank.fixedIncome
        stocks += bank.stocks
        fiis += bank.fiis
        global += bank.global
        
        weightedVol += bank.volatility * bank.capital
        weightedBeta += bank.beta * bank.capital
        weightedSharpe += bank.sharpe * bank.capital
        totalYieldIncome += (bank.yieldRate / 100) * bank.capital
      })

      weightedVol = weightedVol / totalCapital
      weightedBeta = weightedBeta / totalCapital
      weightedSharpe = weightedSharpe / totalCapital
    }

    const stocksPercent = totalCapital > 0 ? (stocks / totalCapital) * 100 : 0
    const fixedIncomePercent = totalCapital > 0 ? (fixedIncome / totalCapital) * 100 : 0
    const fiisPercent = totalCapital > 0 ? (fiis / totalCapital) * 100 : 0
    const globalPercent = totalCapital > 0 ? (global / totalCapital) * 100 : 0

    return {
      totalCapital,
      fixedIncome,
      stocks,
      fiis,
      global,
      stocksPercent,
      fixedIncomePercent,
      fiisPercent,
      globalPercent,
      volatility: weightedVol,
      beta: weightedBeta,
      sharpe: weightedSharpe,
      projectedMonthlyYield: totalYieldIncome / 12,
      activeCount: activeInstitutions.length,
    }
  }

  const consolidated = getConsolidatedData()

  // Montagem do Gráfico de Rosca SVG Vectorizado como um dial mecânico brilhante
  const renderSVGDonut = () => {
    const { stocksPercent, fixedIncomePercent, fiisPercent, globalPercent } = consolidated
    const radius = 58
    const strokeWidth = 12
    const circumference = 2 * Math.PI * radius

    // Se nenhum banco ativo, renderiza círculo cinza de fallback
    if (consolidated.totalCapital === 0) {
      return (
        <svg className="w-40 h-40 transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
        </svg>
      )
    }

    let accumulatedOffset = 0

    // Frações
    const segments = [
      { percent: fixedIncomePercent, color: '#4ADE80', glow: 'rgba(74, 222, 128, 0.4)' }, // Mint Green
      { percent: stocksPercent, color: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.4)' },      // Amethyst Purple
      { percent: fiisPercent, color: '#06B6D4', glow: 'rgba(6, 182, 212, 0.4)' },        // Cyan Blue
      { percent: globalPercent, color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.4)' },      // Amber
    ].filter((s) => s.percent > 0)

    return (
      <svg className="w-44 h-44 transform -rotate-90 animate-[spin_20s_linear_infinite_paused] hover:[animation-play-state:running]">
        {segments.map((segment, index) => {
          const dashArray = (segment.percent / 100) * circumference
          const dashOffset = accumulatedOffset
          accumulatedOffset -= dashArray

          return (
            <circle
              key={index}
              cx="88"
              cy="88"
              r={radius}
              fill="transparent"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashArray} ${circumference}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 6px ${segment.glow})`,
              }}
              className="transition-all duration-700 ease-out hover:stroke-[14px]"
            />
          )
        })}
      </svg>
    )
  }

  // Define rebalanceamento proativo baseado no perfil de alocação ativado
  const getBalancingInsight = () => {
    const { totalCapital, stocksPercent, fixedIncomePercent, activeCount } = consolidated

    if (activeCount === 0) {
      return 'Conecte instituições financeiras acima para analisar a alocação e obter auditoria de carteira.'
    }

    if (stocksPercent > 40) {
      return 'Exposição agressiva: A alocação em Ações está acima do limite prudente (40%). Recomenda-se balancear futuros aportes na Renda Fixa ou em FIIs defensivos da B3.'
    }
    
    if (fixedIncomePercent > 70) {
      return 'Exposição ultraconservadora: Mais de 70% da carteira está em Renda Fixa. Considere expor gradualmente até 15% em ações blue-chips via corretora para capturar ganhos reais acima da inflação.'
    }

    if (totalCapital > 130000 && activeCount >= 3) {
      return 'Perfil Altamente Diversificado: Excelente diluição de custódia institucional! Otimize custos de custódia XP e BTG verificando isenções por volume de capital.'
    }

    return 'Alocação equilibrada e diversificada! Siga monitorando a correlação dos ativos no detalhe para evitar overlap setorial.'
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho do Open Finance - Thick Glass Card */}
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A1625]/40 p-6 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.4)] transition-all duration-700">
        <GlassHighlight widthPercent={60} />
        <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-[#8B5CF6]/10 blur-[80px]" />
        
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-bold text-[#F4F0FF] flex items-center gap-2">
              <Landmark size={18} className="text-[#8B5CF6] filter drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
              Consolidador Open Finance
            </h3>
            <p className="text-xs text-[#F4F0FF]/50 mt-1 max-w-xl">
              Sincronize e gerencie carteiras externas de forma automatizada, integrando custódias de múltiplos bancos brasileiros e corretoras.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            {Object.keys(INSTITUTIONS).map((key) => {
              const bank = INSTITUTIONS[key]!
              const isActive = syncedBanks.includes(key)
              const isSyncing = syncingBank === key
              return (
                <button
                  key={key}
                  onClick={() => handleToggleBank(key)}
                  disabled={syncingBank !== null}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-2xl border text-[11px] font-extrabold transition-all duration-300 cursor-pointer select-none relative overflow-hidden active:scale-95 active:translate-y-[1px]',
                    isActive
                      ? 'border-[#8B5CF6]/50 bg-[#1A1625]/85 text-[#F4F0FF] shadow-[0_0_15px_rgba(139,92,246,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)]'
                      : 'border-white/5 bg-[#1A1625]/20 text-[#F4F0FF]/40 hover:border-white/15 hover:bg-[#1A1625]/50 hover:text-[#F4F0FF]/80 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.6)]'
                  )}
                  title={`Clique para ${isActive ? 'desconectar' : 'sincronizar'} custódia do ${bank.name}`}
                >
                  {isSyncing ? (
                    <RefreshCw size={11} className="animate-spin text-[#8B5CF6]" />
                  ) : isActive ? (
                    <Check size={11} className="text-[#4ADE80] filter drop-shadow-[0_0_4px_rgba(74,222,128,0.5)]" />
                  ) : (
                    <Plus size={11} />
                  )}
                  {key}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Se nenhum banco conectado */}
      {consolidated.totalCapital === 0 ? (
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#1A1625]/20 py-16 px-6 text-center flex flex-col items-center justify-center min-h-[340px] backdrop-blur-md shadow-[inset_0_-2px_6px_rgba(0,0,0,0.6)]">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-[#1A1625]/40 text-[#F4F0FF]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
            <Landmark size={24} />
          </span>
          <h4 className="mt-5 text-sm font-bold text-[#F4F0FF]">Nenhuma carteira sincronizada</h4>
          <p className="mt-2 text-xs leading-6 text-[#F4F0FF]/40 max-w-sm">
            Use os botões de Open Finance no cabeçalho acima para conectar contas externas de investimento (XP, Itaú, BTG, Nubank) e consolidar seu patrimônio.
          </p>
        </section>
      ) : (
        <>
          {/* KPI Trio Grid (Estilo Horizontal do AbacatePay em Versão Glassmorphic) */}
          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A1625]/30 p-6 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-2px_6px_rgba(0,0,0,0.6)]">
            <div className="flex flex-col gap-6 md:flex-row md:items-stretch md:justify-between">
              
              {/* Bloco 1: Patrimônio Consolidado */}
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-xs text-[#F4F0FF]/40">
                  <span>Patrimônio Consolidado</span>
                  <div className="tooltip cursor-pointer text-[#F4F0FF]/35 hover:text-[#F4F0FF]" data-tip="Soma integral das posições de custódia sincronizadas ativas.">
                    <Info size={13} />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-sans text-2xl font-semibold tracking-tight text-[#F4F0FF]">
                    {consolidated.totalCapital.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[10px] font-bold text-[#8B5CF6] uppercase bg-[#8B5CF6]/10 px-2 py-0.5 rounded-full">
                    {consolidated.activeCount} bancos
                  </span>
                </div>
              </div>

              {/* Divisor Vertical */}
              <div className="hidden md:block w-px h-auto bg-white/10 my-0 mx-6 self-stretch" />

              {/* Bloco 2: Proventos Mensais */}
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-xs text-[#F4F0FF]/40">
                  <span>Rendimento Mensal Projetado</span>
                  <div className="tooltip cursor-pointer text-[#F4F0FF]/35 hover:text-[#F4F0FF]" data-tip="Estimativa proporcional de dividendos e proventos mensais.">
                    <Info size={13} />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-sans text-2xl font-semibold tracking-tight text-[#4ADE80] filter drop-shadow-[0_0_8px_rgba(74,222,128,0.2)]">
                    {consolidated.projectedMonthlyYield.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span className="text-[10px] font-bold text-[#4ADE80] uppercase bg-[#4ADE80]/10 px-2 py-0.5 rounded-full">
                    DY Estimado
                  </span>
                </div>
              </div>

              {/* Divisor Vertical */}
              <div className="hidden md:block w-px h-auto bg-white/10 my-0 mx-6 self-stretch" />

              {/* Bloco 3: Eficiência */}
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-xs text-[#F4F0FF]/40">
                  <span>Risco & Sharpe</span>
                  <div className="tooltip cursor-pointer text-[#F4F0FF]/35 hover:text-[#F4F0FF]" data-tip="Medida de retorno ajustada ao risco e correlação da carteira.">
                    <Info size={13} />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="font-sans text-2xl font-semibold tracking-tight text-[#F4F0FF]">
                    {consolidated.sharpe.toFixed(2)}x
                  </span>
                  <div className="flex flex-col text-[9px] font-bold text-[#F4F0FF]/45">
                    <span>Vol: {consolidated.volatility.toFixed(1)}%</span>
                    <span>Beta: {consolidated.beta.toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Seção Central: Distribuição e Detalhe Técnico */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Visualização de Dial Físico Brilhante (40%) */}
            <section className="lg:col-span-5 relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A1625]/45 p-6 flex flex-col items-center justify-center min-h-[260px] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-2px_6px_rgba(0,0,0,0.6)]">
              <GlassHighlight widthPercent={60} />
              <div className="relative flex items-center justify-center">
                {renderSVGDonut()}
                <div className="absolute flex flex-col items-center text-center">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#F4F0FF]/40">Consolidado</span>
                  <span className="font-sans text-xl font-black text-white tracking-tight mt-0.5">
                    {consolidated.totalCapital >= 1000 ? `R$ ${(consolidated.totalCapital / 1000).toFixed(0)}k` : `R$ ${consolidated.totalCapital}`}
                  </span>
                  <span className="text-[8px] font-semibold text-[#8B5CF6] uppercase tracking-wider bg-[#8B5CF6]/15 px-2 py-0.5 rounded-full mt-1.5">
                    {consolidated.activeCount} Contas
                  </span>
                </div>
              </div>
            </section>

            {/* Listas de Alocação por Classes de Ativo (60%) */}
            <section className="lg:col-span-7 relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A1625]/45 p-6 flex flex-col justify-between min-h-[260px] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-2px_6px_rgba(0,0,0,0.6)]">
              <GlassHighlight widthPercent={60} />
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#8B5CF6]/90 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                Distribuição de Custódia
              </h4>
              
              <div className="flex flex-col gap-4 mt-4 flex-1 justify-center">
                {/* Renda Fixa */}
                {consolidated.fixedIncomePercent > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-2 text-[#4ADE80]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] shadow-[0_0_6px_#4ADE80]" />
                        Renda Fixa (CDI/CDB)
                      </span>
                      <span className="text-[#F4F0FF]/80 font-mono">{consolidated.fixedIncomePercent.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
                      <div className="h-full bg-[#4ADE80] rounded-full transition-all duration-700 shadow-[0_0_8px_#4ADE80]" style={{ width: `${consolidated.fixedIncomePercent}%` }} />
                    </div>
                  </div>
                )}

                {/* Ações */}
                {consolidated.stocksPercent > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-2 text-[#8B5CF6]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] shadow-[0_0_6px_#8B5CF6]" />
                        Ações Brasileiras (B3)
                      </span>
                      <span className="text-[#F4F0FF]/80 font-mono">{consolidated.stocksPercent.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
                      <div className="h-full bg-[#8B5CF6] rounded-full transition-all duration-700 shadow-[0_0_8px_#8B5CF6]" style={{ width: `${consolidated.stocksPercent}%` }} />
                    </div>
                  </div>
                )}

                {/* FIIs */}
                {consolidated.fiisPercent > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-2 text-[#06B6D4]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] shadow-[0_0_6px_#06B6D4]" />
                        Fundos Imobiliários (FIIs)
                      </span>
                      <span className="text-[#F4F0FF]/80 font-mono">{consolidated.fiisPercent.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
                      <div className="h-full bg-[#06B6D4] rounded-full transition-all duration-700 shadow-[0_0_8px_#06B6D4]" style={{ width: `${consolidated.fiisPercent}%` }} />
                    </div>
                  </div>
                )}

                {/* Global */}
                {consolidated.globalPercent > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-2 text-[#F59E0B]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shadow-[0_0_6px_#F59E0B]" />
                        Global & Multimercado
                      </span>
                      <span className="text-[#F4F0FF]/80 font-mono">{consolidated.globalPercent.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
                      <div className="h-full bg-[#F59E0B] rounded-full transition-all duration-700 shadow-[0_0_8px_#F59E0B]" style={{ width: `${consolidated.globalPercent}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Custódia por Instituição Financeira */}
          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A1625]/30 p-6 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-2px_6px_rgba(0,0,0,0.6)]">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#8B5CF6]/90 flex items-center gap-1.5 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
              Diluição Patrimonial por Banco
            </h4>
            
            <div className="rounded-2xl border border-white/5 bg-[#0D0B14]/40 p-5 grid gap-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
              {syncedBanks.map((bankId) => {
                const bank = INSTITUTIONS[bankId]!
                const share = (bank.capital / consolidated.totalCapital) * 100
                return (
                  <div key={bankId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span className="text-xs font-bold text-[#F4F0FF] min-w-[10rem] truncate flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bank.color, boxShadow: `0 0 6px ${bank.color}` }} />
                      {bank.name}
                    </span>
                    <div className="flex-1 h-2.5 bg-white/[0.03] rounded-full overflow-hidden max-w-md shadow-[inset_0_1px_1px_rgba(0,0,0,0.8)]">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${share}%`, backgroundColor: bank.color }} />
                    </div>
                    <div className="text-right text-xs font-bold font-mono whitespace-nowrap">
                      <span className="text-[#F4F0FF]">
                        {bank.capital.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[#F4F0FF]/30 ml-2">({share.toFixed(0)}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Bloco de Auditoria de Rebalanceamento Proativo (Editorial Note) */}
          <section className="relative overflow-hidden rounded-tr-[2rem] rounded-bl-[2rem] rounded-tl-lg rounded-br-lg border border-white/15 bg-[#8B5CF6]/5 p-6 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_10px_20px_rgba(0,0,0,0.3)]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6]/5 to-transparent pointer-events-none" />
            <div className="relative z-10 flex gap-4 items-start">
              <span className="flex items-center justify-center size-8 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 text-[#C4B5FD] shadow-[0_0_10px_rgba(139,92,246,0.3)] mt-0.5 shrink-0">
                <Sparkles size={15} className="animate-pulse" />
              </span>
              <div className="flex-1">
                <span className="font-bold text-[#C4B5FD] text-[10px] uppercase tracking-widest block mb-1">
                  Auditoria Proativa de Portfólio
                </span>
                <h3 className="font-serif text-lg text-[#F4F0FF] italic tracking-wide">
                  "{getBalancingInsight()}"
                </h3>
              </div>
              <div className="hidden sm:block text-[#F4F0FF]/30 hover:text-[#F4F0FF] transition-all">
                <ArrowUpRight size={18} />
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
