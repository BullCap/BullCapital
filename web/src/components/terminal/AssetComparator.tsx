'use client'

import { useState, useEffect } from 'react'
import { ArrowLeftRight, HelpCircle, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AssetQuote } from '@/types/market'
import { VariationBadge } from '@/components/atoms/VariationBadge'

interface CompareState {
  tickerA: string
  tickerB: string
}

interface AssetComparatorProps {
  state: CompareState
  onChange: (newState: CompareState) => void
  initialQuotes: AssetQuote[]
}

// Banco de dados estático complementar com scores e múltiplos para ativos populares da B3
const COMPARE_DATABASE: Record<
  string,
  {
    name: string
    price: number
    change: number
    dy: number
    pl: number
    radar: {
      rentabilidade: number
      momentum: number
      liquidez: number
      valuation: number
      tendencia: number
    }
  }
> = {
  PETR4: {
    name: 'Petrobras PN',
    price: 38.4,
    change: 1.25,
    dy: 14.5,
    pl: 4.2,
    radar: { rentabilidade: 95, momentum: 78, liquidez: 99, valuation: 88, tendencia: 72 },
  },
  VALE3: {
    name: 'Vale ON',
    price: 62.8,
    change: -0.85,
    dy: 8.0,
    pl: 6.5,
    radar: { rentabilidade: 82, momentum: 45, liquidez: 98, valuation: 74, tendencia: 50 },
  },
  BBAS3: {
    name: 'Banco do Brasil ON',
    price: 27.2,
    change: 2.1,
    dy: 9.0,
    pl: 4.5,
    radar: { rentabilidade: 90, momentum: 82, liquidez: 95, valuation: 85, tendencia: 80 },
  },
  ITUB4: {
    name: 'Itaú Unibanco PN',
    price: 33.6,
    change: 0.45,
    dy: 5.5,
    pl: 8.8,
    radar: { rentabilidade: 88, momentum: 65, liquidez: 97, valuation: 55, tendencia: 60 },
  },
  TAEE11: {
    name: 'Taesa Unit',
    price: 35.8,
    change: -0.12,
    dy: 9.5,
    pl: 9.8,
    radar: { rentabilidade: 75, momentum: 50, liquidez: 85, valuation: 60, tendencia: 55 },
  },
  MXRF11: {
    name: 'Maxi Renda FII',
    price: 9.85,
    change: 0.05,
    dy: 10.8,
    pl: 10.2,
    radar: { rentabilidade: 70, momentum: 55, liquidez: 92, valuation: 68, tendencia: 58 },
  },
}

export default function AssetComparator({ state, onChange, initialQuotes }: AssetComparatorProps) {
  const [tickerA, setTickerA] = useState(state.tickerA)
  const [tickerB, setTickerB] = useState(state.tickerB)

  useEffect(() => {
    onChange({ tickerA, tickerB })
  }, [tickerA, tickerB])

  // Obtém dados completos de um ticker
  const getAssetData = (tickerSymbol: string) => {
    const symbol = tickerSymbol.toUpperCase()
    const dbValue = COMPARE_DATABASE[symbol]
    // Tenta encontrar nos dados reais pré-carregados
    const realQuote = initialQuotes.find((q) => q.symbol.toUpperCase() === symbol)

    return {
      symbol,
      name: realQuote?.shortName || dbValue?.name || 'Ativo Customizado',
      price: realQuote?.regularMarketPrice || dbValue?.price || 30.0,
      change: realQuote?.regularMarketChangePercent || dbValue?.change || 0.0,
      dy: dbValue?.dy || 7.5,
      pl: dbValue?.pl || 8.0,
      radar: dbValue?.radar || {
        rentabilidade: 70,
        momentum: 60,
        liquidez: 80,
        valuation: 65,
        tendencia: 60,
      },
    }
  }

  const assetA = getAssetData(tickerA)
  const assetB = getAssetData(tickerB)

  // Determina qual valor é melhor (para radar e DY maior é melhor, para P/L menor é melhor)
  const getWinner = (key: 'rentabilidade' | 'momentum' | 'liquidez' | 'valuation' | 'tendencia' | 'dy' | 'pl') => {
    if (key === 'pl') {
      return assetA.pl < assetB.pl ? 'A' : assetA.pl > assetB.pl ? 'B' : 'draw'
    }
    if (key === 'dy') {
      return assetA.dy > assetB.dy ? 'A' : assetA.dy < assetB.dy ? 'B' : 'draw'
    }
    const scoreA = assetA.radar[key]
    const scoreB = assetB.radar[key]
    return scoreA > scoreB ? 'A' : scoreA < scoreB ? 'B' : 'draw'
  }

  const renderComparisonRow = (
    label: string,
    key: 'rentabilidade' | 'momentum' | 'liquidez' | 'valuation' | 'tendencia' | 'dy' | 'pl',
    formatter: (val: number) => string
  ) => {
    const winner = getWinner(key)
    const valA = key === 'dy' ? assetA.dy : key === 'pl' ? assetA.pl : assetA.radar[key]
    const valB = key === 'dy' ? assetB.dy : key === 'pl' ? assetB.pl : assetB.radar[key]

    return (
      <tr className="border-b border-white/[0.04] hover:bg-white/[0.01] transition-colors">
        <td className="p-3 font-semibold text-xs text-[#F4F0FF]/70 text-left">{label}</td>
        <td
          className={cn(
            'p-3 text-center transition-all duration-300',
            winner === 'A'
              ? 'bg-[#8B5CF6]/10 text-[#F4F0FF] font-bold text-xs border-l-2 border-[#8B5CF6]'
              : 'text-[#F4F0FF]/50 font-medium text-xs'
          )}
        >
          <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
            {formatter(valA)}
            {winner === 'A' && <Trophy size={11} className="text-[#8B5CF6] shrink-0" />}
          </div>
        </td>
        <td
          className={cn(
            'p-3 text-center transition-all duration-300',
            winner === 'B'
              ? 'bg-[#8B5CF6]/10 text-[#F4F0FF] font-bold text-xs border-r-2 border-[#8B5CF6]'
              : 'text-[#F4F0FF]/50 font-medium text-xs'
          )}
        >
          <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
            {formatter(valB)}
            {winner === 'B' && <Trophy size={11} className="text-[#8B5CF6] shrink-0" />}
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Selects de Ativos */}
      <div className="grid grid-cols-2 gap-4">
        {/* Ativo A */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#F4F0FF]/50">Ativo A (Primário)</label>
          <select
            value={tickerA}
            onChange={(e) => setTickerA(e.target.value.toUpperCase())}
            className="bull-select w-full text-xs md:text-sm font-bold bg-[#0A0810]/80"
          >
            <option value="PETR4">PETR4 (Petrobras)</option>
            <option value="VALE3">VALE3 (Vale)</option>
            <option value="BBAS3">BBAS3 (Banco do Brasil)</option>
            <option value="ITUB4">ITUB4 (Itaú Unibanco)</option>
            <option value="TAEE11">TAEE11 (Taesa)</option>
            <option value="MXRF11">MXRF11 (Maxi Renda FII)</option>
          </select>
        </div>

        {/* Ativo B */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#F4F0FF]/50">Ativo B (Secundário)</label>
          <select
            value={tickerB}
            onChange={(e) => setTickerB(e.target.value.toUpperCase())}
            className="bull-select w-full text-xs md:text-sm font-bold bg-[#0A0810]/80"
          >
            <option value="VALE3">VALE3 (Vale)</option>
            <option value="PETR4">PETR4 (Petrobras)</option>
            <option value="BBAS3">BBAS3 (Banco do Brasil)</option>
            <option value="ITUB4">ITUB4 (Itaú Unibanco)</option>
            <option value="TAEE11">TAEE11 (Taesa)</option>
            <option value="MXRF11">MXRF11 (Maxi Renda FII)</option>
          </select>
        </div>
      </div>

      {/* Alerta se forem idênticos */}
      {tickerA === tickerB && (
        <div className="rounded-xl border border-yellow-500/10 bg-yellow-500/5 p-3 text-[10px] font-bold text-yellow-300/80 text-center">
          Você selecionou o mesmo ativo para ambas as colunas. Altere um deles para ver a comparação de métricas.
        </div>
      )}

      {/* Bloco de Destaque / Cotação (Mais leve e simétrico) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Ativo A Card */}
        <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 flex flex-col items-center text-center overflow-hidden">
          <p className="text-sm font-extrabold tracking-wide text-[#8B5CF6] uppercase">{assetA.symbol}</p>
          <p className="text-[10px] font-semibold text-[#F4F0FF]/50 mt-0.5 truncate max-w-full">{assetA.name}</p>
          <p className="text-lg md:text-xl font-sans font-black mt-2 text-[#F4F0FF] whitespace-nowrap">
            {assetA.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <div className="mt-2 shrink-0">
            <VariationBadge variation={assetA.change} />
          </div>
        </div>

        {/* Ativo B Card */}
        <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 flex flex-col items-center text-center overflow-hidden">
          <p className="text-sm font-extrabold tracking-wide text-[#8B5CF6] uppercase">{assetB.symbol}</p>
          <p className="text-[10px] font-semibold text-[#F4F0FF]/50 mt-0.5 truncate max-w-full">{assetB.name}</p>
          <p className="text-lg md:text-xl font-sans font-black mt-2 text-[#F4F0FF] whitespace-nowrap">
            {assetB.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <div className="mt-2 shrink-0">
            <VariationBadge variation={assetB.change} />
          </div>
        </div>
      </div>

      {/* Tabela de Comparação Minimalista */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-transparent bull-scroll">
        <table className="w-full text-center text-xs">
          <thead className="border-b border-white/[0.08] bg-white/[0.01] text-[10px] font-bold uppercase tracking-wider text-[#F4F0FF]/50">
            <tr>
              <th className="p-3 text-left">Critério de Análise</th>
              <th className="p-3">{assetA.symbol}</th>
              <th className="p-3">{assetB.symbol}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {/* Dividend Yield */}
            {renderComparisonRow('Dividend Yield (Histórico)', 'dy', (v) => `${v.toFixed(2)}%`)}
            {/* Preço sobre Lucro (P/L) */}
            {renderComparisonRow('Preço / Lucro (P/L)', 'pl', (v) => `${v.toFixed(1)}x`)}
            {/* Rentabilidade Radar */}
            {renderComparisonRow('Nota: Rentabilidade', 'rentabilidade', (v) => `${v}/100`)}
            {/* Momentum Radar */}
            {renderComparisonRow('Nota: Momentum', 'momentum', (v) => `${v}/100`)}
            {/* Liquidez Radar */}
            {renderComparisonRow('Nota: Liquidez', 'liquidez', (v) => `${v}/100`)}
            {/* Valuation Radar */}
            {renderComparisonRow('Nota: Valuation', 'valuation', (v) => `${v}/100`)}
            {/* Tendência Radar */}
            {renderComparisonRow('Nota: Tendência', 'tendencia', (v) => `${v}/100`)}
          </tbody>
        </table>
      </div>

      {/* Nota sobre P/L */}
      <div className="flex gap-2 text-[10px] font-semibold text-[#F4F0FF]/40 italic justify-center text-center">
        <HelpCircle size={11} className="mt-0.5 shrink-0 text-[#8B5CF6]" />
        <span>
          Nota: Para o P/L, o menor múltiplo é o vencedor (destacado em Ametista), pois sinaliza desconto em relação aos lucros.
        </span>
      </div>
    </div>
  )
}
