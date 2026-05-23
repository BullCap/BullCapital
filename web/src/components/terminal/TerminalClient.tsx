'use client'

import { useState, useEffect } from 'react'
import { Landmark, ArrowLeftRight, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AssetQuote } from '@/types/market'
import DividendCalculator from './DividendCalculator'
import AssetComparator from './AssetComparator'
import SavingsSimulator from './SavingsSimulator'
import TerminalCopilot from './TerminalCopilot'

export type SimulatorTab = 'dividends' | 'compare' | 'savings'

interface TerminalClientProps {
  initialQuotes: AssetQuote[]
}

export default function TerminalClient({ initialQuotes }: TerminalClientProps) {
  // Sincroniza a aba ativa com localStorage
  const [activeTab, setActiveTab] = useState<SimulatorTab>('dividends')
  const [isLoaded, setIsLoaded] = useState(false)

  // Estados dos simuladores (para fins de comunicação com o Copiloto de IA)
  const [dividendState, setDividendState] = useState({
    ticker: 'TAEE11',
    shares: 100,
    averageCost: 35.0,
    monthlyAporte: 10,
  })

  const [compareState, setCompareState] = useState({
    tickerA: 'PETR4',
    tickerB: 'VALE3',
  })

  const [savingsState, setSavingsState] = useState({
    initialCapital: 5000,
    monthlyAporte: 1000,
    annualYield: 11,
    periodYears: 10,
    adjustInflation: false,
  })

  // Carrega do localStorage ao montar no cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('bull_terminal_active_tab') as SimulatorTab
      if (savedTab && ['dividends', 'compare', 'savings'].includes(savedTab)) {
        setActiveTab(savedTab)
      }

      const savedDividend = localStorage.getItem('bull_terminal_dividend')
      if (savedDividend) {
        try {
          setDividendState(JSON.parse(savedDividend))
        } catch (_) {}
      }

      const savedCompare = localStorage.getItem('bull_terminal_compare')
      if (savedCompare) {
        try {
          setCompareState(JSON.parse(savedCompare))
        } catch (_) {}
      }

      const savedSavings = localStorage.getItem('bull_terminal_savings')
      if (savedSavings) {
        try {
          setSavingsState(JSON.parse(savedSavings))
        } catch (_) {}
      }

      setIsLoaded(true)
    }
  }, [])

  // Sincroniza mudanças no localStorage
  const handleTabChange = (tab: SimulatorTab) => {
    setActiveTab(tab)
    localStorage.setItem('bull_terminal_active_tab', tab)
  }

  const updateDividendState = (newState: typeof dividendState) => {
    setDividendState(newState)
    localStorage.setItem('bull_terminal_dividend', JSON.stringify(newState))
  }

  const updateCompareState = (newState: typeof compareState) => {
    setCompareState(newState)
    localStorage.setItem('bull_terminal_compare', JSON.stringify(newState))
  }

  const updateSavingsState = (newState: typeof savingsState) => {
    setSavingsState(newState)
    localStorage.setItem('bull_terminal_savings', JSON.stringify(newState))
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8B5CF6]/30 border-t-[#8B5CF6]"></div>
          <p className="text-sm text-[#F4F0FF]/40 font-medium">Carregando Terminal de Trabalho...</p>
        </div>
      </div>
    )
  }

  // Coleta dados resumidos para o Copiloto dependendo da aba ativa
  const getCopilotContext = () => {
    switch (activeTab) {
      case 'dividends':
        return {
          type: 'dividends' as const,
          title: 'Calculadora de Dividendos (Viver de Renda)',
          data: dividendState,
        }
      case 'compare':
        return {
          type: 'compare' as const,
          title: 'Comparador de Ativos B3',
          data: compareState,
        }
      case 'savings':
        return {
          type: 'savings' as const,
          title: 'Simulador de Renda Variável e Juros Compostos',
          data: savingsState,
        }
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_24rem] gap-6 items-start mt-6">
      {/* ── Coluna Esquerda: Simuladores ── */}
      <div className="flex flex-col gap-5">
        {/* Abas Superiores */}
        <div className="bull-dock-shell flex p-1 rounded-2xl bg-black/35 border border-white/[0.08] max-w-lg">
          <button
            onClick={() => handleTabChange('dividends')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold rounded-xl transition',
              activeTab === 'dividends'
                ? 'border border-white/[0.08] bg-white/[0.09] text-[#F4F0FF] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] font-bold'
                : 'text-[#F4F0FF]/55 hover:bg-white/[0.03] hover:text-[#F4F0FF]/80'
            )}
          >
            <Landmark size={14} />
            Dividendos
          </button>
          <button
            onClick={() => handleTabChange('compare')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold rounded-xl transition',
              activeTab === 'compare'
                ? 'border border-white/[0.08] bg-white/[0.09] text-[#F4F0FF] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] font-bold'
                : 'text-[#F4F0FF]/55 hover:bg-white/[0.03] hover:text-[#F4F0FF]/80'
            )}
          >
            <ArrowLeftRight size={14} />
            Comparador
          </button>
          <button
            onClick={() => handleTabChange('savings')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold rounded-xl transition',
              activeTab === 'savings'
                ? 'border border-white/[0.08] bg-white/[0.09] text-[#F4F0FF] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] font-bold'
                : 'text-[#F4F0FF]/55 hover:bg-white/[0.03] hover:text-[#F4F0FF]/80'
            )}
          >
            <TrendingUp size={14} />
            Renda Variável
          </button>
        </div>

        {/* Conteúdo Ativo com Efeito Vidro */}
        <div className="relative rounded-[2rem] border border-white/10 bg-[#1A1625]/40 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_12px_40px_rgba(0,0,0,0.4)] overflow-hidden p-6 md:p-8 min-h-[460px]">
          {/* Brilho Shimmer Superior */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {activeTab === 'dividends' && (
            <DividendCalculator
              state={dividendState}
              onChange={updateDividendState}
              initialQuotes={initialQuotes}
            />
          )}

          {activeTab === 'compare' && (
            <AssetComparator
              state={compareState}
              onChange={updateCompareState}
              initialQuotes={initialQuotes}
            />
          )}

          {activeTab === 'savings' && (
            <SavingsSimulator
              state={savingsState}
              onChange={updateSavingsState}
            />
          )}
        </div>
      </div>

      {/* ── Coluna Direita: Copiloto de IA ── */}
      <div className="lg:sticky lg:top-6">
        <TerminalCopilot activeContext={getCopilotContext()} />
      </div>
    </div>
  )
}
