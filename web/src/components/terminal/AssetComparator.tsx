'use client'

import { useState } from 'react'
import { CircleDot, HelpCircle } from 'lucide-react'
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

const ASSET_LABELS: Record<string, string> = {
  PETR4: 'Petrobras PN',
  VALE3: 'Vale ON',
  BBAS3: 'Banco do Brasil ON',
  ITUB4: 'Itaú Unibanco PN',
  TAEE11: 'Taesa Unit',
  MXRF11: 'Maxi Renda FII',
}

type MetricKey = 'dy' | 'pl' | 'pvp' | 'roe' | 'evEbitda' | 'volume'
type HighlightMode = 'higher' | 'lower'

function normalizePercent(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null
  return value > 0 && value < 1 ? value * 100 : value
}

function formatNumber(value: number | null, formatter: (val: number) => string) {
  return value == null || !Number.isFinite(value) ? 'n/d' : formatter(value)
}

export default function AssetComparator({ state, onChange, initialQuotes }: AssetComparatorProps) {
  const [tickerA, setTickerA] = useState(state.tickerA)
  const [tickerB, setTickerB] = useState(state.tickerB)

  const updateTickerA = (value: string) => {
    const nextTicker = value.toUpperCase()
    setTickerA(nextTicker)
    onChange({ tickerA: nextTicker, tickerB })
  }

  const updateTickerB = (value: string) => {
    const nextTicker = value.toUpperCase()
    setTickerB(nextTicker)
    onChange({ tickerA, tickerB: nextTicker })
  }

  // Obtém dados vindos do backend de mercado. Fallback local é apenas de rótulo.
  const getAssetData = (tickerSymbol: string) => {
    const symbol = tickerSymbol.toUpperCase()
    const realQuote = initialQuotes.find((q) => q.symbol.toUpperCase() === symbol)

    return {
      symbol,
      name: realQuote?.shortName || ASSET_LABELS[symbol] || 'Ativo',
      price: realQuote?.regularMarketPrice ?? null,
      change: realQuote?.regularMarketChangePercent ?? null,
      dy: normalizePercent(realQuote?.dividendYield),
      pl: realQuote?.trailingPE ?? null,
      pvp: realQuote?.pBook ?? null,
      roe: normalizePercent(realQuote?.roe),
      evEbitda: realQuote?.evEbitda ?? null,
      volume: realQuote?.regularMarketVolume ?? realQuote?.averageVolume ?? null,
    }
  }

  const assetA = getAssetData(tickerA)
  const assetB = getAssetData(tickerB)

  const getHighlight = (valueA: number | null, valueB: number | null, mode: HighlightMode) => {
    if (valueA == null || valueB == null || valueA === valueB) return 'draw'
    if (mode === 'lower') return valueA < valueB ? 'A' : 'B'
    return valueA > valueB ? 'A' : 'B'
  }

  const renderComparisonRow = (
    label: string,
    key: MetricKey,
    formatter: (val: number) => string,
    mode: HighlightMode
  ) => {
    const valA = assetA[key]
    const valB = assetB[key]
    const highlight = getHighlight(valA, valB, mode)

    return (
      <tr className="border-b border-white/[0.04] hover:bg-white/[0.01] transition-colors">
        <td className="p-3 font-semibold text-xs text-[#F4F0FF]/70 text-left">{label}</td>
        <td
          className={cn(
            'p-3 text-center transition-all duration-300',
            highlight === 'A'
              ? 'bg-[#8B5CF6]/10 text-[#F4F0FF] font-bold text-xs border-l-2 border-[#8B5CF6]'
              : 'text-[#F4F0FF]/50 font-medium text-xs'
          )}
        >
          <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
            {formatNumber(valA, formatter)}
            {highlight === 'A' && <CircleDot size={11} className="text-[#8B5CF6] shrink-0" />}
          </div>
        </td>
        <td
          className={cn(
            'p-3 text-center transition-all duration-300',
            highlight === 'B'
              ? 'bg-[#8B5CF6]/10 text-[#F4F0FF] font-bold text-xs border-r-2 border-[#8B5CF6]'
              : 'text-[#F4F0FF]/50 font-medium text-xs'
          )}
        >
          <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
            {formatNumber(valB, formatter)}
            {highlight === 'B' && <CircleDot size={11} className="text-[#8B5CF6] shrink-0" />}
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
            onChange={(e) => updateTickerA(e.target.value)}
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
            onChange={(e) => updateTickerB(e.target.value)}
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
            {assetA.price == null
              ? 'n/d'
              : assetA.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <div className="mt-2 shrink-0">
            <VariationBadge variation={assetA.change ?? 0} />
          </div>
        </div>

        {/* Ativo B Card */}
        <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 flex flex-col items-center text-center overflow-hidden">
          <p className="text-sm font-extrabold tracking-wide text-[#8B5CF6] uppercase">{assetB.symbol}</p>
          <p className="text-[10px] font-semibold text-[#F4F0FF]/50 mt-0.5 truncate max-w-full">{assetB.name}</p>
          <p className="text-lg md:text-xl font-sans font-black mt-2 text-[#F4F0FF] whitespace-nowrap">
            {assetB.price == null
              ? 'n/d'
              : assetB.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <div className="mt-2 shrink-0">
            <VariationBadge variation={assetB.change ?? 0} />
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
            {renderComparisonRow('Dividend Yield', 'dy', (v) => `${v.toFixed(2)}%`, 'higher')}
            {renderComparisonRow('Preço / Lucro (P/L)', 'pl', (v) => `${v.toFixed(1)}x`, 'lower')}
            {renderComparisonRow('P/VP', 'pvp', (v) => `${v.toFixed(2)}x`, 'lower')}
            {renderComparisonRow('ROE', 'roe', (v) => `${v.toFixed(2)}%`, 'higher')}
            {renderComparisonRow('EV/EBITDA', 'evEbitda', (v) => `${v.toFixed(1)}x`, 'lower')}
            {renderComparisonRow('Volume', 'volume', (v) => v.toLocaleString('pt-BR'), 'higher')}
          </tbody>
        </table>
      </div>

      {/* Nota sobre leitura quantitativa */}
      <div className="flex gap-2 text-[10px] font-semibold text-[#F4F0FF]/40 italic justify-center text-center">
        <HelpCircle size={11} className="mt-0.5 shrink-0 text-[#8B5CF6]" />
        <span>
          Destaques em ametista indicam apenas maior ou menor valor relativo na linha, sem juízo de recomendação.
        </span>
      </div>
    </div>
  )
}
