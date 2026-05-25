'use client'

import { useState, useEffect } from 'react'
import { Landmark, Check, Plus, RefreshCw, AlertTriangle, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  // Montagem do Gráfico de Rosca SVG Vectorizado
  const renderSVGDonut = () => {
    const { stocksPercent, fixedIncomePercent, fiisPercent, globalPercent } = consolidated
    const radius = 55
    const strokeWidth = 14
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
      { percent: fixedIncomePercent, color: '#4ADE80' }, // Mint Green
      { percent: stocksPercent, color: '#8B5CF6' },      // Amethyst Purple
      { percent: fiisPercent, color: '#06B6D4' },        // Cyan Blue
      { percent: globalPercent, color: '#F59E0B' },      // Amber
    ].filter((s) => s.percent > 0)

    return (
      <svg className="w-44 h-44 transform -rotate-90 filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.35)]">
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
              className="transition-all duration-700 ease-out"
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
      return 'Conecte instituições financeiras abaixo para analisar a alocação e obter auditoria de carteira.'
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
      {/* Cabeçalho do Open Finance */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-white/[0.06] bg-white/[0.01] rounded-2xl">
        <div>
          <h3 className="text-sm font-bold text-[#F4F0FF] flex items-center gap-2">
            <Landmark size={15} className="text-[#8B5CF6]" />
            Consolidador Open Finance
          </h3>
          <p className="text-[10px] font-semibold text-[#F4F0FF]/45 mt-0.5">
            Sincronize e gerencie carteiras externas integrando custódias de múltiplos bancos.
          </p>
        </div>
        <div className="flex gap-2">
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
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-extrabold transition cursor-pointer select-none relative overflow-hidden',
                  isActive
                    ? 'border-white/[0.12] bg-[#0A0810] text-[#F4F0FF] shadow-[0_4px_12px_rgba(0,0,0,0.4)]'
                    : 'border-white/[0.05] bg-white/[0.01] text-[#F4F0FF]/35 hover:bg-white/[0.03] hover:text-[#F4F0FF]/60'
                )}
                title={`Clique para ${isActive ? 'desconectar' : 'sincronizar'} custódia do ${bank.name}`}
              >
                {isSyncing ? (
                  <RefreshCw size={10} className="animate-spin text-[#8B5CF6]" />
                ) : isActive ? (
                  <Check size={10} className="text-[#4ADE80]" />
                ) : (
                  <Plus size={10} />
                )}
                {key}
              </button>
            )
          })}
        </div>
      </div>

      {/* Se nenhum banco conectado */}
      {consolidated.totalCapital === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-black/15 py-12 px-6 text-center flex flex-col items-center justify-center min-h-[300px]">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[#F4F0FF]/30">
            <Landmark size={20} />
          </span>
          <h4 className="mt-4 text-xs font-bold text-[#F4F0FF]">Nenhuma carteira sincronizada</h4>
          <p className="mt-2 text-[10px] leading-5 text-[#F4F0FF]/40 max-w-xs">
            Use os botões no cabeçalho acima para sincronizar contas de investimento externas (XP, Itaú, BTG, Nubank) e gerar a leitura analítica consolidada do seu patrimônio.
          </p>
        </div>
      ) : (
        <>
          {/* Dashboard Superior: Gráficos de Pizza & Distribuição de Alocação */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Gráfico Rosca SVG (45%) */}
            <div className="md:col-span-5 flex flex-col items-center justify-center border border-white/[0.06] bg-black/10 rounded-2xl p-5 min-h-[220px]">
              <div className="relative flex items-center justify-center">
                {renderSVGDonut()}
                <div className="absolute flex flex-col items-center text-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#F4F0FF]/40">Consolidado</span>
                  <span className="text-base font-black font-sans text-white tracking-tight mt-0.5">
                    {consolidated.totalCapital >= 1000 ? `R$ ${(consolidated.totalCapital / 1000)}k` : `R$ ${consolidated.totalCapital}`}
                  </span>
                  <span className="text-[8px] font-semibold text-[#8B5CF6] mt-0.5">
                    {consolidated.activeCount} contas integradas
                  </span>
                </div>
              </div>
            </div>

            {/* Listas de Alocação Proporcional (75%) */}
            <div className="md:col-span-7 flex flex-col gap-3.5 border border-white/[0.06] bg-white/[0.01] rounded-2xl p-5 min-h-[220px]">
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#8B5CF6]/90">Distribuição por Classes</h4>
              
              <div className="flex flex-col gap-3">
                {/* Renda Fixa */}
                {consolidated.fixedIncomePercent > 0 && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1.5 text-[#4ADE80]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
                        Renda Fixa (CDI/CDB)
                      </span>
                      <span className="text-[#F4F0FF]/80">{consolidated.fixedIncomePercent.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                      <div className="h-full bg-[#4ADE80] rounded-full transition-all duration-700" style={{ width: `${consolidated.fixedIncomePercent}%` }} />
                    </div>
                  </div>
                )}

                {/* Ações */}
                {consolidated.stocksPercent > 0 && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1.5 text-[#8B5CF6]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                        Ações Brasileiras (B3)
                      </span>
                      <span className="text-[#F4F0FF]/80">{consolidated.stocksPercent.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                      <div className="h-full bg-[#8B5CF6] rounded-full transition-all duration-700" style={{ width: `${consolidated.stocksPercent}%` }} />
                    </div>
                  </div>
                )}

                {/* FIIs */}
                {consolidated.fiisPercent > 0 && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1.5 text-[#06B6D4]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
                        Fundos Imobiliários (FIIs)
                      </span>
                      <span className="text-[#F4F0FF]/80">{consolidated.fiisPercent.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                      <div className="h-full bg-[#06B6D4] rounded-full transition-all duration-700" style={{ width: `${consolidated.fiisPercent}%` }} />
                    </div>
                  </div>
                )}

                {/* Global */}
                {consolidated.globalPercent > 0 && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1.5 text-[#F59E0B]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                        Global & Multimercado
                      </span>
                      <span className="text-[#F4F0FF]/80">{consolidated.globalPercent.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                      <div className="h-full bg-[#F59E0B] rounded-full transition-all duration-700" style={{ width: `${consolidated.globalPercent}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seção 2: Métricas de Volatilidade, Beta & Rendimentos */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 border border-white/[0.06] rounded-xl p-4 bg-white/[0.01]">
            {/* Sharpe Ratio */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C4B5FD]/60">Índice Sharpe</span>
              <span className="text-base font-sans font-black text-[#F4F0FF] tracking-tight mt-1 whitespace-nowrap">
                {consolidated.sharpe.toFixed(2)}x
              </span>
              <span className="text-[10px] font-semibold text-[#4ADE80] mt-0.5 truncate">
                {consolidated.sharpe > 1.2 ? 'Eficiência Excelente ✦' : 'Eficiência Adequada'}
              </span>
            </div>

            {/* Beta Consolidado */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C4B5FD]/60">Beta Consolidado</span>
              <span className="text-base font-sans font-black text-[#8B5CF6] tracking-tight mt-1 whitespace-nowrap">
                {consolidated.beta.toFixed(2)}
              </span>
              <span className="text-[10px] font-semibold text-[#F4F0FF]/40 mt-0.5 truncate">
                {consolidated.beta > 0.8 ? 'Moderado/Agressivo (B3)' : 'Carteira Defensiva'}
              </span>
            </div>

            {/* Volatilidade */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C4B5FD]/60">Volatilidade Anual</span>
              <span className="text-base font-sans font-black text-[#F4F0FF] tracking-tight mt-1 whitespace-nowrap">
                {consolidated.volatility.toFixed(2)}%
              </span>
              <span className="text-[10px] font-semibold text-[#F4F0FF]/40 mt-0.5 truncate">
                Desvio padrão histórico
              </span>
            </div>

            {/* Rendimento Mensal Projetado */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C4B5FD]/60">Rendimento Mensal</span>
              <span className="text-base font-sans font-black text-[#4ADE80] tracking-tight mt-1 whitespace-nowrap">
                {consolidated.projectedMonthlyYield.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <span className="text-[10px] font-semibold text-[#C4B5FD]/60 mt-0.5 truncate">
                Divs / JCP consolidados
              </span>
            </div>
          </div>

          {/* Divisão de Custódia por Instituição */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[10px] font-bold text-[#8B5CF6]/90 uppercase tracking-widest">Diluição Patrimonial por Banco</h4>
            <div className="rounded-xl border border-white/[0.06] bg-black/10 p-4 grid gap-3">
              {syncedBanks.map((bankId) => {
                const bank = INSTITUTIONS[bankId]!
                const share = (bank.capital / consolidated.totalCapital) * 100
                return (
                  <div key={bankId} className="flex items-center justify-between gap-4">
                    <span className="text-[11px] font-bold text-[#F4F0FF] min-w-[7rem] truncate">{bank.name}</span>
                    <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden max-w-sm">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${share}%`, backgroundColor: bank.color }} />
                    </div>
                    <div className="text-right text-[11px] font-bold whitespace-nowrap">
                      <span>{bank.capital.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                      <span className="text-[#F4F0FF]/30 ml-2 font-mono text-[10px]">({share.toFixed(0)}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bloco de Auditoria de Rebalanceamento */}
          <div className="flex gap-3 text-[11px] leading-relaxed font-semibold text-[#F4F0FF]/75 bg-[#8B5CF6]/5 border-l-2 border-[#8B5CF6]/40 p-4 rounded-r-xl rounded-bl-xl items-start relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6]/5 to-transparent pointer-events-none" />
            <Sparkles size={14} className="mt-0.5 shrink-0 text-[#C4B5FD] animate-pulse-glow" />
            <div className="relative z-10 flex-1">
              <span className="font-bold text-[#C4B5FD] text-[9px] uppercase tracking-wider block mb-1">
                Auditoria Proativa de Portfólio
              </span>
              <p className="italic text-[#F4F0FF]/75 leading-relaxed">{getBalancingInsight()}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
