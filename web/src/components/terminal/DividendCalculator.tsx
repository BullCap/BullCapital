'use client'

import { useState, useEffect } from 'react'
import { HelpCircle, Info, Zap } from 'lucide-react'
import type { AssetQuote } from '@/types/market'

interface DividendState {
  ticker: string
  shares: number
  averageCost: number
  monthlyAporte: number
}

interface DividendCalculatorProps {
  state: DividendState
  onChange: (newState: DividendState) => void
  initialQuotes: AssetQuote[]
}

// Valores estimados para os dividendos dos ativos mais comuns da B3
const TICKER_DATABASE: Record<string, { name: string; price: number; dy: number }> = {
  TAEE11: { name: 'Taesa S.A.', price: 35.8, dy: 9.5 },
  BBAS3: { name: 'Banco do Brasil S.A.', price: 27.2, dy: 9.0 },
  PETR4: { name: 'Petróleo Brasileiro S.A. Petrobras', price: 38.4, dy: 14.5 },
  VALE3: { name: 'Vale S.A.', price: 62.8, dy: 8.0 },
  MXRF11: { name: 'Maxi Renda FII', price: 9.85, dy: 10.8 },
  ITUB4: { name: 'Itaú Unibanco Holding S.A.', price: 33.6, dy: 5.5 },
}

export default function DividendCalculator({ state, onChange, initialQuotes }: DividendCalculatorProps) {
  const [ticker, setTicker] = useState(state.ticker)
  const [shares, setShares] = useState(state.shares)
  const [averageCost, setAverageCost] = useState(state.averageCost)
  const [monthlyAporte, setMonthlyAporte] = useState(state.monthlyAporte)

  // Encontra ou estima os dados do ativo selecionado
  const getAssetData = (sym: string) => {
    const symbol = sym.toUpperCase()
    // Tenta encontrar nos dados reais pré-carregados
    const realQuote = initialQuotes.find((q) => q.symbol.toUpperCase() === symbol)
    const dbValue = TICKER_DATABASE[symbol]

    return {
      name: realQuote?.shortName || dbValue?.name || 'Ativo Customizado',
      price: realQuote?.regularMarketPrice || dbValue?.price || 30.0,
      dy: dbValue?.dy || 7.5, // Estimativa padrão
    }
  }

  const asset = getAssetData(ticker)

  // Atualiza o estado global nas mudanças de inputs
  useEffect(() => {
    onChange({
      ticker,
      shares,
      averageCost,
      monthlyAporte,
    })
  }, [ticker, shares, averageCost, monthlyAporte])

  // Cálculos matemáticos
  const dyPercentage = asset.dy
  const currentPrice = asset.price

  // Dividendo anual estimado por cota: Preço * DY%
  const annualDividendPerShare = currentPrice * (dyPercentage / 100)
  const monthlyDividendPerShare = annualDividendPerShare / 12

  // Renda mensal atual baseada no número de cotas
  const currentMonthlyPassiveIncome = shares * monthlyDividendPerShare
  const currentAnnualPassiveIncome = shares * annualDividendPerShare

  // Yield on Cost (YOC): Rendimento anual em relação ao preço médio pago pelo usuário
  const yieldOnCost = averageCost > 0 ? (annualDividendPerShare / averageCost) * 100 : 0

  // Número Mágico (Magic Number): quantidade de cotas para que os dividendos mensais paguem 1 nova cota
  const magicNumber = Math.ceil(1200 / dyPercentage)

  // Porcentagem de conclusão da meta do Número Mágico
  const progressToMagicNumber = Math.min((shares / magicNumber) * 100, 100)

  // Projeção com reinvestimento de dividendos e aportes mensais
  const getProjections = (years: number) => {
    const months = years * 12
    let projectedShares = shares
    const monthlyRate = dyPercentage / 100 / 12

    for (let i = 0; i < months; i++) {
      // Recebe dividendos
      const dividendReceived = projectedShares * monthlyDividendPerShare
      // Reinveste dividendos em novas cotas
      const sharesFromReinvestment = dividendReceived / currentPrice
      // Soma aportes mensais + reinvestimento
      projectedShares += monthlyAporte + sharesFromReinvestment
    }

    const projectedMonthlyIncome = projectedShares * monthlyDividendPerShare
    const totalInvested = shares * averageCost + monthlyAporte * currentPrice * months
    const equityValue = projectedShares * currentPrice

    return {
      shares: Math.round(projectedShares),
      monthlyIncome: projectedMonthlyIncome,
      equityValue,
      totalInvested,
    }
  }

  const proj1Yr = getProjections(1)
  const proj3Yr = getProjections(3)
  const proj5Yr = getProjections(5)
  const proj10Yr = getProjections(10)

  return (
    <div className="flex flex-col gap-6">
      {/* Formulário de Parâmetros (Adaptivo contra compressão extrema) */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5">
        {/* Ativo Ticker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#F4F0FF]/50 flex items-center gap-1">
            Ativo (B3)
            <span className="cursor-help" title="Selecione um ativo popular da B3.">
              <HelpCircle size={11} className="text-[#8B5CF6]/80" />
            </span>
          </label>
          <select
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            className="bull-select w-full text-xs md:text-sm font-bold bg-[#0A0810]/80"
          >
            <option value="TAEE11">TAEE11 (Taesa)</option>
            <option value="BBAS3">BBAS3 (Banco do Brasil)</option>
            <option value="PETR4">PETR4 (Petrobras)</option>
            <option value="VALE3">VALE3 (Vale)</option>
            <option value="MXRF11">MXRF11 (Maxi Renda FII)</option>
            <option value="ITUB4">ITUB4 (Itaú Unibanco)</option>
          </select>
        </div>

        {/* Quantidade de Cotas */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#F4F0FF]/50">Quantidade de Cotas</label>
          <input
            type="number"
            min="1"
            value={shares || ''}
            onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 0))}
            className="bull-input w-full text-xs md:text-sm font-bold bg-[#0A0810]/80"
          />
        </div>

        {/* Preço Médio */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#F4F0FF]/50">Preço Médio (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={averageCost || ''}
            onChange={(e) => setAverageCost(Math.max(0.01, parseFloat(e.target.value) || 0))}
            className="bull-input w-full text-xs md:text-sm font-bold bg-[#0A0810]/80"
          />
        </div>

        {/* Aporte Mensal (Cotas) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#F4F0FF]/50">Aporte Mensal (Cotas)</label>
          <input
            type="number"
            min="0"
            value={monthlyAporte}
            onChange={(e) => setMonthlyAporte(Math.max(0, parseInt(e.target.value) || 0))}
            className="bull-input w-full text-xs md:text-sm font-bold bg-[#0A0810]/80"
          />
        </div>
      </div>

      {/* Caixa de Info do Ativo (Integrada e Leve) */}
      <div className="flex items-center gap-2 text-[11px] font-semibold text-[#F4F0FF]/55 bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl">
        <Info size={12} className="text-[#8B5CF6] shrink-0" />
        <span className="truncate">
          Mapeado: <span className="font-bold text-[#F4F0FF]">{asset.name}</span> · Cotação estimada:{' '}
          <span className="font-bold text-[#F4F0FF]">
            {currentPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          {' '}· DY histórico: <span className="font-bold text-[#8B5CF6]">{dyPercentage.toFixed(2)}% a.a.</span>
        </span>
      </div>

      {/* Painel Horizontal de Métricas (Premium, Espaçado e sem Overlap/Compressão) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-white/[0.06] rounded-xl p-4 bg-white/[0.01]">
        {/* Renda Mensal */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C4B5FD]/60">Renda Mensal</span>
          <span className="text-base md:text-lg lg:text-xl font-sans font-black text-[#F4F0FF] tracking-tight mt-1 whitespace-nowrap">
            {currentMonthlyPassiveIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <span className="text-[10px] font-semibold text-[#F4F0FF]/40 mt-0.5 truncate">
            Equivale a {currentAnnualPassiveIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / ano
          </span>
        </div>
        {/* Yield on Cost */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C4B5FD]/60">Yield on Cost (YOC)</span>
          <span className="text-base md:text-lg lg:text-xl font-sans font-black text-[#8B5CF6] tracking-tight mt-1 whitespace-nowrap">
            {yieldOnCost.toFixed(2)}%
          </span>
          <span className="text-[10px] font-semibold text-[#F4F0FF]/40 mt-0.5 truncate">Retorno s/ preço médio</span>
        </div>
        {/* Patrimônio */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C4B5FD]/60">Patrimônio Alocado</span>
          <span className="text-base md:text-lg lg:text-xl font-sans font-black text-[#F4F0FF] tracking-tight mt-1 whitespace-nowrap">
            {(shares * currentPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <span className="text-[10px] font-semibold text-[#F4F0FF]/40 mt-0.5 truncate">
            Custo total: {(shares * averageCost).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      </div>

      {/* Efeito Número Mágico */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4 flex flex-col gap-3 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-20 h-20 bg-[#8B5CF6]/5 blur-xl pointer-events-none rounded-full" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Zap size={15} className="text-[#8B5CF6] mt-0.5 shrink-0 animate-pulse" />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#F4F0FF] uppercase tracking-wider">Efeito &quot;Número Mágico&quot;</h4>
              <p className="text-[11px] text-[#F4F0FF]/60 mt-0.5">
                Você precisa de <span className="font-bold text-[#F4F0FF]">{magicNumber} cotas</span> de {ticker} para gerar dividendos que compram 1 nova cota mensalmente.
              </p>
            </div>
          </div>
          <div className="sm:text-right shrink-0">
            <p className="text-[9px] font-bold text-[#F4F0FF]/40 uppercase tracking-widest">Progresso da Meta</p>
            <p className="text-lg font-black text-[#8B5CF6] mt-0.5">{progressToMagicNumber.toFixed(0)}%</p>
          </div>
        </div>

        {/* Barra de Progresso Fina */}
        <div className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6]/40 to-[#8B5CF6] transition-all duration-500 shadow-[0_0_8px_rgba(139,92,246,0.3)]"
            style={{ width: `${progressToMagicNumber}%` }}
          />
        </div>
        <p className="text-[10px] font-semibold text-[#F4F0FF]/45 text-center">
          Você tem {shares} cotas. Faltam {Math.max(0, magicNumber - shares)} cotas para ativar a bola de neve!
        </p>
      </div>

      {/* Tabela de Projeções Futuras */}
      <div className="flex flex-col gap-3">
        <h4 className="text-[10px] font-bold text-[#8B5CF6]/90 uppercase tracking-widest">
          Projeções Futuras (Com Reinvestimento + Aportes)
        </h4>
        <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-transparent bull-scroll">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.08] bg-white/[0.01] text-[10px] font-bold uppercase tracking-wider text-[#F4F0FF]/50">
              <tr>
                <th className="p-3">Período</th>
                <th className="p-3">Total de Cotas</th>
                <th className="p-3">Renda Passiva Mensal</th>
                <th className="p-3">Patrimônio Estimado</th>
                <th className="p-3">Total Investido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-[#F4F0FF]/70">
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="p-3 font-extrabold text-[#F4F0FF]">1 Ano</td>
                <td className="p-3 font-medium">{proj1Yr.shares} cotas</td>
                <td className="p-3 text-[#8B5CF6] font-extrabold">
                  {proj1Yr.monthlyIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="p-3 font-medium">{proj1Yr.equityValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td className="p-3 text-[#F4F0FF]/40">{proj1Yr.totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="p-3 font-extrabold text-[#F4F0FF]">3 Anos</td>
                <td className="p-3 font-medium">{proj3Yr.shares} cotas</td>
                <td className="p-3 text-[#8B5CF6] font-extrabold">
                  {proj3Yr.monthlyIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="p-3 font-medium">{proj3Yr.equityValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td className="p-3 text-[#F4F0FF]/40">{proj3Yr.totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="p-3 font-extrabold text-[#F4F0FF]">5 Anos</td>
                <td className="p-3 font-medium">{proj5Yr.shares} cotas</td>
                <td className="p-3 text-[#8B5CF6] font-extrabold">
                  {proj5Yr.monthlyIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="p-3 font-medium">{proj5Yr.equityValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td className="p-3 text-[#F4F0FF]/40">{proj5Yr.totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="p-3 font-extrabold text-[#F4F0FF]">10 Anos</td>
                <td className="p-3 font-medium">{proj10Yr.shares} cotas</td>
                <td className="p-3 text-[#8B5CF6] font-black text-sm">
                  {proj10Yr.monthlyIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="p-3 font-extrabold text-[#F4F0FF]">
                  {proj10Yr.equityValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="p-3 text-[#F4F0FF]/40">{proj10Yr.totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
