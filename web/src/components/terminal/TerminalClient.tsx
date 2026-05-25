'use client'

import { useState, useEffect } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import type { AssetQuote } from '@/types/market'
import AssetComparator from './AssetComparator'
import TerminalCopilot from './TerminalCopilot'

export type SimulatorTab = 'compare'

interface TerminalClientProps {
  initialQuotes: AssetQuote[]
}

export default function TerminalClient({ initialQuotes }: TerminalClientProps) {
  const [activeTab] = useState<SimulatorTab>('compare')
  const [isLoaded, setIsLoaded] = useState(false)

  const [compareState, setCompareState] = useState({
    tickerA: 'PETR4',
    tickerB: 'VALE3',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCompare = localStorage.getItem('bull_terminal_compare')
      if (savedCompare) {
        try {
          setCompareState(JSON.parse(savedCompare))
        } catch (_) {}
      }
      setIsLoaded(true)
    }
  }, [])

  const updateCompareState = (newState: typeof compareState) => {
    setCompareState(newState)
    localStorage.setItem('bull_terminal_compare', JSON.stringify(newState))
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8B5CF6]/30 border-t-[#8B5CF6]" />
          <p className="text-sm text-[#F4F0FF]/40 font-medium">Carregando Terminal de Trabalho...</p>
        </div>
      </div>
    )
  }

  const getCopilotContext = () => {
    return {
      type: 'compare' as const,
      title: 'Comparador de Ativos B3',
      data: compareState,
    }
  }

  return (
    <div className="flex flex-col gap-5 mt-6">
      {/* Abas - Apenas Comparador no MVP B2B */}
      <div className="bull-dock-shell flex p-1 rounded-2xl bg-black/35 border border-white/[0.08] max-w-[200px] w-full">
        <button
          className="flex flex-1 items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold rounded-xl transition border border-white/[0.08] bg-white/[0.09] text-[#F4F0FF] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] font-bold cursor-default"
        >
          <ArrowLeftRight size={14} />
          Comparador
        </button>
      </div>

      {/* Grid: simulador (esq) + copiloto (dir) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_24rem] gap-6 items-start">
        <div className="relative rounded-[2rem] border border-white/[0.08] bg-[#0f0c18]/50 backdrop-blur-2xl shadow-[inset_0_1px_0px_rgba(255,255,255,0.08),0_18px_48px_rgba(0,0,0,0.45)] overflow-hidden p-5 md:p-6 min-h-[460px]">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {activeTab === 'compare' && (
            <AssetComparator
              state={compareState}
              onChange={updateCompareState}
              initialQuotes={initialQuotes}
            />
          )}
        </div>

        <div className="lg:sticky lg:top-24">
          <TerminalCopilot activeContext={getCopilotContext()} />
        </div>
      </div>
    </div>
  )
}
