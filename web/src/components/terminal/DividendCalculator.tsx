'use client'

import { useState, useEffect } from 'react'
import { HelpCircle, Info, Landmark, Percent, Zap } from 'lucide-react'
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
  };

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
  // Dividendos mensais >= Preço Atual -> Cotas * (AnnualDividend / 12) >= Preço Atual
  // Cotas >= (12 * Preço Atual) / AnnualDividend -> Cotas >= 12 / (DY / 100) -> Cotas >= 1200 / DY
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
    const totalInvested = (shares * averageCost) + (monthlyAporte * currentPrice * months)
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
      {/* Cabeçalho */}
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]">
          <Landmark size={20} />
        </div>
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#F4F0FF]">Calculadora de Dividendos</h2>
          <p className="text-xs text-[#F4F0FF]/50">Projete sua renda passiva com reinvestimento automático.</p>
        </div>
      </div>

      {/* Formulário de Parâmetros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Ativo Ticker */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#F4F0FF]/85 flex items-center gap-1">
            Ativo (B3)
            <span className="cursor-help" title="Selecione um ativo popular ou digite um ticker customizado da B3.">
              <HelpCircle size={13} className="text-[#8B5CF6]/80" />
            </span>
          </label>
          <select
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            className="bull-select w-full text-base font-bold"
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
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#F4F0FF]/85">Quantidade de Cotas</label>
          <input
            type="number"
            min="1"
            value={shares || ''}
            onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 0))}
            className="bull-input w-full text-base font-bold"
          />
        </div>

        {/* Preço Médio */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#F4F0FF]/85">Preço Médio (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={averageCost || ''}
            onChange={(e) => setAverageCost(Math.max(0.01, parseFloat(e.target.value) || 0))}
            className="bull-input w-full text-base font-bold"
          />
        </div>

        {/* Aporte Mensal (Cotas) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#F4F0FF]/85">Aporte Mensal (Cotas)</label>
          <input
            type="number"
            min="0"
            value={monthlyAporte}
            onChange={(e) => setMonthlyAporte(Math.max(0, parseInt(e.target.value) || 0))}
            className="bull-input w-full text-base font-bold"
          />
        </div>
      </div>

      {/* Caixa de Info do Ativo Ativo */}
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs font-semibold text-[#F4F0FF]/80">
        <Info size={15} className="text-[#8B5CF6] shrink-0" />
        <p>
          Mapeado: <span className="font-bold text-[#F4F0FF]">{asset.name} ({ticker})</span>. Preço de Mercado estimado:{' '}
          <span className="font-bold text-[#F4F0FF]">
            {currentPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          . Dividend Yield histórico mapeado:{' '}
          <span className="font-bold text-[#8B5CF6]">{dyPercentage.toFixed(2)}% ao ano</span>.
        </p>
      </div>

      {/* Grid de Resultados Primários */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Renda Passiva Mensal */}
        <div className="relative rounded-2xl border border-white/5 bg-white/[0.03] p-4 sm:p-5 flex flex-col gap-1 overflow-hidden">
          <p className="text-xs font-bold text-[#8B5CF6]/95 uppercase tracking-widest">Renda Mensal Estimada</p>
          <p className="text-xl sm:text-2xl xl:text-3xl font-sans font-black text-[#F4F0FF] tracking-tight leading-tight break-words mt-1.5">
            {currentMonthlyPassiveIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-xs font-bold text-[#F4F0FF]/55 mt-1">
            Equivale a {currentAnnualPassiveIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / ano
          </p>
        </div>

        {/* Yield On Cost */}
        <div className="relative rounded-2xl border border-white/5 bg-white/[0.03] p-4 sm:p-5 flex flex-col gap-1 overflow-hidden">
          <p className="text-xs font-bold text-[#8B5CF6]/95 uppercase tracking-widest">Yield on Cost (YOC)</p>
          <p className="text-xl sm:text-2xl xl:text-3xl font-sans font-black text-[#8B5CF6] tracking-tight leading-tight break-words mt-1.5">{yieldOnCost.toFixed(2)}%</p>
          <p className="text-xs font-bold text-[#F4F0FF]/55 mt-1">Retorno sobre o preço médio investido</p>
        </div>

        {/* Custo Total vs Patrimônio */}
        <div className="relative rounded-2xl border border-white/5 bg-white/[0.03] p-4 sm:p-5 flex flex-col gap-1 overflow-hidden">
          <p className="text-xs font-bold text-[#8B5CF6]/95 uppercase tracking-widest">Patrimônio Alocado</p>
          <p className="text-xl sm:text-2xl xl:text-3xl font-sans font-black text-[#F4F0FF] tracking-tight leading-tight break-words mt-1.5">
            {(shares * currentPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-xs font-bold text-[#F4F0FF]/55 mt-1">
            Custo total de compra: {(shares * averageCost).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      {/* Número Mágico */}
      <div className="rounded-2xl border border-white/10 bg-[#8B5CF6]/5 p-6 flex flex-col gap-3.5 relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute right-0 top-0 w-24 h-24 bg-[#8B5CF6]/10 blur-2xl pointer-events-none rounded-full" />

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Zap size={18} className="text-[#8B5CF6] animate-pulse" />
            <div>
              <h4 className="text-base font-bold text-[#F4F0FF]">Efeito &quot;Número Mágico&quot;</h4>
              <p className="text-xs font-semibold text-[#F4F0FF]/70">
                Você precisa de <span className="font-bold text-[#F4F0FF]">{magicNumber} cotas</span> de {ticker} para gerar dividendos que compram 1 nova cota mensalmente.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-bold text-[#F4F0FF]/50">Progresso da Meta</p>
            <p className="text-xl font-black text-[#8B5CF6]">{progressToMagicNumber.toFixed(0)}%</p>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6]/50 to-[#8B5CF6] transition-all duration-500"
            style={{ width: `${progressToMagicNumber}%` }}
          />
        </div>
        <p className="text-xs font-bold text-[#F4F0FF]/55 text-center">
          Você tem {shares} cotas. Faltam {Math.max(0, magicNumber - shares)} cotas para ativar a bola de neve!
        </p>
      </div>

      {/* Tabela de Projeções Futuras */}
      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-bold text-[#8B5CF6]/95 uppercase tracking-widest">
          Projeções Futuras (Com Reinvestimento + Aportes)
        </h4>
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/15 bull-scroll">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-[#F4F0FF]/90">
              <tr>
                <th className="p-4">Período</th>
                <th className="p-4">Total de Cotas</th>
                <th className="p-4">Renda Passiva Mensal</th>
                <th className="p-4">Patrimônio Estimado</th>
                <th className="p-4">Total Investido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[#F4F0FF]/80">
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="p-4 font-extrabold text-[#F4F0FF]">1 Ano</td>
                <td className="p-4 font-bold">{proj1Yr.shares} cotas</td>
                <td className="p-4 text-[#8B5CF6] font-black text-sm">
                  {proj1Yr.monthlyIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="p-4 font-bold">{proj1Yr.equityValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td className="p-4 font-semibold text-[#F4F0FF]/50">{proj1Yr.totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="p-4 font-extrabold text-[#F4F0FF]">3 Anos</td>
                <td className="p-4 font-bold">{proj3Yr.shares} cotas</td>
                <td className="p-4 text-[#8B5CF6] font-black text-sm">
                  {proj3Yr.monthlyIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="p-4 font-bold">{proj3Yr.equityValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td className="p-4 font-semibold text-[#F4F0FF]/50">{proj3Yr.totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="p-4 font-extrabold text-[#F4F0FF]">5 Anos</td>
                <td className="p-4 font-bold">{proj5Yr.shares} cotas</td>
                <td className="p-4 text-[#8B5CF6] font-black text-sm">
                  {proj5Yr.monthlyIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="p-4 font-bold">{proj5Yr.equityValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td className="p-4 font-semibold text-[#F4F0FF]/50">{proj5Yr.totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="p-4 font-extrabold text-[#F4F0FF]">10 Anos</td>
                <td className="p-4 font-bold">{proj10Yr.shares} cotas</td>
                <td className="p-4 text-[#8B5CF6] font-black text-base">
                  {proj10Yr.monthlyIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="p-4 font-extrabold text-[#F4F0FF]">
                  {proj10Yr.equityValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="p-4 font-semibold text-[#F4F0FF]/50">{proj10Yr.totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
