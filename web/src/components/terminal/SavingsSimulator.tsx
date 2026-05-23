'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Info, HelpCircle, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SavingsState {
  initialCapital: number
  monthlyAporte: number
  annualYield: number
  periodYears: number
  adjustInflation: boolean
}

interface SavingsSimulatorProps {
  state: SavingsState
  onChange: (newState: SavingsState) => void
}

export default function SavingsSimulator({ state, onChange }: SavingsSimulatorProps) {
  const [initialCapital, setInitialCapital] = useState(state.initialCapital)
  const [monthlyAporte, setMonthlyAporte] = useState(state.monthlyAporte)
  const [annualYield, setAnnualYield] = useState(state.annualYield)
  const [periodYears, setPeriodYears] = useState(state.periodYears)
  const [adjustInflation, setAdjustInflation] = useState(state.adjustInflation)

  useEffect(() => {
    onChange({
      initialCapital,
      monthlyAporte,
      annualYield,
      periodYears,
      adjustInflation,
    })
  }, [initialCapital, monthlyAporte, annualYield, periodYears, adjustInflation])

  // Parâmetros de inflação
  const ESTIMATED_INFLATION_RATE = 4.5 // 4.5% IPCA médio estimado

  // Rentabilidade nominal ou real (descontando inflação)
  // Fórmula de Fisher: (1 + taxa_real) = (1 + taxa_nominal) / (1 + inflação)
  const nominalRate = annualYield / 100
  const inflationRate = ESTIMATED_INFLATION_RATE / 100
  const realRate = adjustInflation ? (1 + nominalRate) / (1 + inflationRate) - 1 : nominalRate

  const monthlyRate = Math.pow(1 + realRate, 1 / 12) - 1

  // Cálculo das projeções ano a ano
  const yearByYearData: Array<{
    year: number
    total: number
    invested: number
    interest: number
  }> = []

  let accumulatedTotal = initialCapital
  let accumulatedInvested = initialCapital

  for (let year = 1; year <= periodYears; year++) {
    for (let month = 1; month <= 12; month++) {
      // Juros do mês
      const interestEarned = accumulatedTotal * monthlyRate
      // Aporte do mês
      accumulatedTotal += interestEarned + monthlyAporte
      accumulatedInvested += monthlyAporte
    }

    yearByYearData.push({
      year,
      total: accumulatedTotal,
      invested: accumulatedInvested,
      interest: Math.max(0, accumulatedTotal - accumulatedInvested),
    })
  }

  // Valores finais
  const finalTotal = accumulatedTotal
  const finalInvested = accumulatedInvested
  const finalInterest = Math.max(0, finalTotal - finalInvested)

  // Para renderizar o gráfico, descobrimos o valor máximo de referência
  const maxVal = finalTotal || 1

  // Gerenciamento de hover nas colunas do gráfico
  const [hoveredYear, setHoveredYear] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]">
          <TrendingUp size={20} />
        </div>
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#F4F0FF]">Simulador de Renda Variável</h2>
          <p className="text-xs text-[#F4F0FF]/50">Calcule a mágica dos juros compostos com aportes periódicos.</p>
        </div>
      </div>

      {/* Formulário de Parâmetros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Capital Inicial */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#F4F0FF]/60">Aporte Inicial (R$)</label>
          <input
            type="number"
            min="0"
            value={initialCapital || ''}
            onChange={(e) => setInitialCapital(Math.max(0, parseInt(e.target.value) || 0))}
            className="h-10 rounded-xl border border-white/10 bg-[#1A1625]/60 px-3 text-sm text-[#F4F0FF] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] transition"
          />
        </div>

        {/* Aporte Mensal */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#F4F0FF]/60">Aporte Mensal (R$)</label>
          <input
            type="number"
            min="0"
            value={monthlyAporte || ''}
            onChange={(e) => setMonthlyAporte(Math.max(0, parseInt(e.target.value) || 0))}
            className="h-10 rounded-xl border border-white/10 bg-[#1A1625]/60 px-3 text-sm text-[#F4F0FF] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] transition"
          />
        </div>

        {/* Rentabilidade Anual Esperada */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#F4F0FF]/60 flex items-center gap-1">
            Retorno Anual (%)
            <span className="cursor-help" title="Rentabilidade média anual projetada. O Ibovespa rende historicamente ~10% a 12% a.a.">
              <HelpCircle size={12} className="text-[#F4F0FF]/40" />
            </span>
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={annualYield || ''}
            onChange={(e) => setAnnualYield(Math.max(0.1, parseFloat(e.target.value) || 0))}
            className="h-10 rounded-xl border border-white/10 bg-[#1A1625]/60 px-3 text-sm text-[#F4F0FF] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] transition"
          />
        </div>

        {/* Período em Anos */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#F4F0FF]/60">Período (Anos)</label>
          <select
            value={periodYears}
            onChange={(e) => setPeriodYears(parseInt(e.target.value))}
            className="h-10 rounded-xl border border-white/10 bg-[#1A1625]/60 px-3 text-sm text-[#F4F0FF] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] transition"
          >
            <option value={5}>5 Anos</option>
            <option value={10}>10 Anos</option>
            <option value={15}>15 Anos</option>
            <option value={20}>20 Anos</option>
            <option value={30}>30 Anos</option>
          </select>
        </div>
      </div>

      {/* Caixa de Toggle: Desconto da Inflação */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Flame size={16} className={cn('transition-all duration-300', adjustInflation ? 'text-[#8B5CF6]' : 'text-[#F4F0FF]/40')} />
          <div>
            <h4 className="text-xs font-semibold text-[#F4F0FF]">Descontar Inflação Real (IPCA)</h4>
            <p className="text-[10px] text-[#F4F0FF]/40">
              Desconta 4,5% ao ano das projeções para mostrar o poder de compra real acumulado.
            </p>
          </div>
        </div>
        <button
          onClick={() => setAdjustInflation(!adjustInflation)}
          className={cn(
            'w-10 h-6 flex items-center rounded-full p-0.5 transition-colors duration-300 focus:outline-none',
            adjustInflation ? 'bg-[#8B5CF6]' : 'bg-white/[0.06] border border-white/10'
          )}
        >
          <div
            className={cn(
              'bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300',
              adjustInflation ? 'translate-x-4' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      {/* Info explicativa se ativo */}
      {adjustInflation && (
        <div className="flex items-center gap-3 rounded-xl border border-[#8B5CF6]/10 bg-[#8B5CF6]/5 p-3 text-xs text-[#F4F0FF]/70">
          <Info size={14} className="text-[#8B5CF6] shrink-0" />
          <p>
            Exibindo **Ganho Real Ajustado**: Sua taxa de retorno nominal de{' '}
            <span className="font-semibold text-[#F4F0FF]">{annualYield.toFixed(1)}%</span> está descontada pelo IPCA
            médio estimado de <span className="font-semibold text-[#F4F0FF]">4,50% ao ano</span>. A taxa de retorno real
            aplicada é de{' '}
            <span className="font-semibold text-[#8B5CF6]">{(realRate * 100).toFixed(2)}% ao ano</span>.
          </p>
        </div>
      )}

      {/* Cards de Resultados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Patrimônio Líquido Acumulado */}
        <div className="relative rounded-2xl border border-white/5 bg-white/[0.03] p-4 flex flex-col gap-1 overflow-hidden">
          <p className="text-xs font-semibold text-[#F4F0FF]/50 uppercase tracking-wider">Patrimônio Acumulado</p>
          <p className="text-2xl font-serif font-bold text-[#F4F0FF] mt-1">
            {finalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-xs text-[#8B5CF6] font-semibold">
            {adjustInflation ? 'Em poder de compra atual (Ganho Real)' : 'Valor Bruto Nominal'}
          </p>
        </div>

        {/* Total Investido */}
        <div className="relative rounded-2xl border border-white/5 bg-white/[0.03] p-4 flex flex-col gap-1 overflow-hidden">
          <p className="text-xs font-semibold text-[#F4F0FF]/50 uppercase tracking-wider">Total Investido (Principal)</p>
          <p className="text-2xl font-serif font-bold text-[#F4F0FF]/80 mt-1">
            {finalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-xs text-[#F4F0FF]/40">
            Aportes de R$ {monthlyAporte.toLocaleString('pt-BR')} / mês
          </p>
        </div>

        {/* Total em Juros Compostos */}
        <div className="relative rounded-2xl border border-white/5 bg-white/[0.03] p-4 flex flex-col gap-1 overflow-hidden">
          <p className="text-xs font-semibold text-[#F4F0FF]/50 uppercase tracking-wider">Ganho em Juros Compostos</p>
          <p className="text-2xl font-serif font-bold text-[#8B5CF6] mt-1">
            {finalInterest.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-xs text-[#F4F0FF]/40">
            Representa {((finalInterest / finalTotal) * 100 || 0).toFixed(1)}% do montante total
          </p>
        </div>
      </div>

      {/* Gráfico de Barras Estilizadas do Crescimento */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-[#F4F0FF]/60 uppercase tracking-wider">Curva de Crescimento Anual</h4>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1.5 text-[#F4F0FF]/60">
              <span className="w-2.5 h-2.5 bg-white/[0.1] rounded-sm inline-block" /> Investido
            </span>
            <span className="flex items-center gap-1.5 text-[#8B5CF6]">
              <span className="w-2.5 h-2.5 bg-[#8B5CF6] rounded-sm inline-block animate-pulse" /> Juros Acumulados
            </span>
          </div>
        </div>

        {/* Área do Gráfico */}
        <div className="rounded-2xl border border-white/5 bg-black/20 p-5 md:p-6 flex flex-col justify-end min-h-[220px]">
          <div className="flex items-end justify-between h-40 gap-1.5 md:gap-3">
            {yearByYearData.map((data) => {
              const investedHeight = (data.invested / maxVal) * 100
              const interestHeight = (data.interest / maxVal) * 100
              const isHovered = hoveredYear === data.year

              return (
                <div
                  key={data.year}
                  onMouseEnter={() => setHoveredYear(data.year)}
                  onMouseLeave={() => setHoveredYear(null)}
                  className="flex-1 flex flex-col justify-end items-center h-full group relative cursor-pointer"
                >
                  {/* Tooltip Hover Ano */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-3 z-20 w-44 rounded-xl border border-white/10 bg-[#1A1625]/95 p-2 text-[10px] text-[#F4F0FF] shadow-2xl backdrop-blur-md pointer-events-none text-left">
                      <p className="font-bold text-[#8B5CF6] mb-1">Ano {data.year}</p>
                      <div className="flex justify-between gap-2 text-white/70">
                        <span>Total:</span>
                        <span className="font-bold text-white">{data.total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="flex justify-between gap-2 text-white/50">
                        <span>Investido:</span>
                        <span>{data.invested.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="flex justify-between gap-2 text-[#8B5CF6]/85">
                        <span>Juros:</span>
                        <span>{data.interest.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                  )}

                  {/* Barras Empilhadas */}
                  <div className="w-full flex flex-col justify-end rounded-t-md overflow-hidden bg-white/[0.02] h-full relative transition-all duration-300 group-hover:bg-white/[0.04]">
                    {/* Barra de Juros (Topo) */}
                    <div
                      className={cn(
                        'w-full bg-[#8B5CF6] transition-all duration-300 rounded-t-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]',
                        isHovered ? 'opacity-100 bg-[#8B5CF6]/90' : 'opacity-75'
                      )}
                      style={{ height: `${interestHeight}%` }}
                    />
                    {/* Barra Investido (Base) */}
                    <div
                      className="w-full bg-white/[0.12] transition-all duration-300 border-t border-white/5"
                      style={{ height: `${investedHeight}%` }}
                    />
                  </div>

                  {/* Label Ano */}
                  <span className="text-[10px] text-[#F4F0FF]/40 mt-2 font-mono group-hover:text-[#F4F0FF]/70 transition-colors">
                    A{data.year}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
