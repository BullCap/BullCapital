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
      {/* Formulário de Parâmetros (Adaptivo contra compressão extrema) */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5">
        {/* Capital Inicial */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#F4F0FF]/50">Aporte Inicial (R$)</label>
          <input
            type="number"
            min="0"
            value={initialCapital || ''}
            onChange={(e) => setInitialCapital(Math.max(0, parseInt(e.target.value) || 0))}
            className="bull-input w-full text-xs md:text-sm font-bold bg-[#0A0810]/80"
          />
        </div>

        {/* Aporte Mensal */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#F4F0FF]/50">Aporte Mensal (R$)</label>
          <input
            type="number"
            min="0"
            value={monthlyAporte || ''}
            onChange={(e) => setMonthlyAporte(Math.max(0, parseInt(e.target.value) || 0))}
            className="bull-input w-full text-xs md:text-sm font-bold bg-[#0A0810]/80"
          />
        </div>

        {/* Rentabilidade Anual Esperada */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#F4F0FF]/50 flex items-center gap-1">
            Retorno Anual (%)
            <span className="cursor-help" title="Rentabilidade média anual projetada.">
              <HelpCircle size={11} className="text-[#8B5CF6]/80" />
            </span>
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={annualYield || ''}
            onChange={(e) => setAnnualYield(Math.max(0.1, parseFloat(e.target.value) || 0))}
            className="bull-input w-full text-xs md:text-sm font-bold bg-[#0A0810]/80"
          />
        </div>

        {/* Período em Anos */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#F4F0FF]/50">Período (Anos)</label>
          <select
            value={periodYears}
            onChange={(e) => setPeriodYears(parseInt(e.target.value))}
            className="bull-select w-full text-xs md:text-sm font-bold bg-[#0A0810]/80"
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
      <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-white/[0.06] bg-white/[0.01]">
        <div className="flex items-center gap-2.5">
          <Flame size={14} className={cn('transition-all duration-300 shrink-0', adjustInflation ? 'text-[#8B5CF6]' : 'text-[#F4F0FF]/30')} />
          <div>
            <h4 className="text-xs font-bold text-[#F4F0FF]">Descontar Inflação Real (IPCA)</h4>
            <p className="text-[10px] font-semibold text-[#F4F0FF]/45 mt-0.5">
              Desconta 4,5% ao ano para mostrar o poder de compra real acumulado.
            </p>
          </div>
        </div>
        <button
          onClick={() => setAdjustInflation(!adjustInflation)}
          className={cn(
            'w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-300 focus:outline-none cursor-pointer',
            adjustInflation ? 'bg-[#8B5CF6]' : 'bg-white/[0.04] border border-white/10'
          )}
        >
          <div
            className={cn(
              'bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300',
              adjustInflation ? 'translate-x-4' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      {/* Info explicativa se ativo */}
      {adjustInflation && (
        <div className="flex items-center gap-2 text-[11px] font-semibold text-[#F4F0FF]/55 bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl">
          <Info size={12} className="text-[#8B5CF6] shrink-0" />
          <span>
            Exibindo **Ganho Real Ajustado** · Retorno nominal:{' '}
            <span className="font-bold text-[#F4F0FF]">{annualYield.toFixed(1)}%</span> descontado por IPCA médio (4,50% a.a.) · Retorno real aplicado:{' '}
            <span className="font-bold text-[#8B5CF6]">{(realRate * 100).toFixed(2)}% a.a.</span>
          </span>
        </div>
      )}

      {/* Painel Horizontal de Métricas (Premium, Espaçado e sem Overlap/Compressão) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-white/[0.06] rounded-xl p-4 bg-white/[0.01]">
        {/* Patrimônio Acumulado */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C4B5FD]/60">Patrimônio Acumulado</span>
          <span className="text-base md:text-lg lg:text-xl font-sans font-black text-[#F4F0FF] tracking-tight mt-1 whitespace-nowrap">
            {finalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <span className="text-[10px] font-semibold text-[#8B5CF6] mt-0.5 truncate">
            {adjustInflation ? 'Poder de compra real' : 'Valor nominal bruto'}
          </span>
        </div>
        {/* Total Investido */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C4B5FD]/60">Total Investido</span>
          <span className="text-base md:text-lg lg:text-xl font-sans font-black text-[#F4F0FF] tracking-tight mt-1 whitespace-nowrap">
            {finalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <span className="text-[10px] font-semibold text-[#F4F0FF]/40 mt-0.5 truncate">
            Aportes de R$ {monthlyAporte.toLocaleString('pt-BR')} / mês
          </span>
        </div>
        {/* Juros Compostos */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C4B5FD]/60">Juros Acumulados</span>
          <span className="text-base md:text-lg lg:text-xl font-sans font-black text-[#8B5CF6] tracking-tight mt-1 whitespace-nowrap">
            {finalInterest.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <span className="text-[10px] font-semibold text-[#F4F0FF]/40 mt-0.5 truncate">
            Representa {((finalInterest / finalTotal) * 100 || 0).toFixed(1)}% do total
          </span>
        </div>
      </div>

      {/* Gráfico de Barras Estilizadas do Crescimento */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold text-[#8B5CF6]/90 uppercase tracking-widest">Curva de Crescimento Anual</h4>
          <div className="flex items-center gap-4 text-[9px] font-semibold">
            <span className="flex items-center gap-1.5 text-[#F4F0FF]/60 uppercase tracking-wider">
              <span className="w-2 h-2 bg-white/[0.1] rounded-sm inline-block" /> Investido
            </span>
            <span className="flex items-center gap-1.5 text-[#8B5CF6] uppercase tracking-wider">
              <span className="w-2 h-2 bg-[#8B5CF6] rounded-sm inline-block animate-pulse" /> Juros
            </span>
          </div>
        </div>

        {/* Área do Gráfico */}
        <div className="rounded-xl border border-white/[0.06] bg-black/10 p-5 flex flex-col justify-end min-h-[220px]">
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
                    <div className="absolute bottom-full mb-3 z-20 w-40 rounded-xl border border-white/[0.08] bg-[#0A0810]/95 p-2.5 text-[9px] text-[#F4F0FF] shadow-2xl backdrop-blur-md pointer-events-none text-left font-sans">
                      <p className="font-extrabold text-[#8B5CF6] mb-1">Ano {data.year}</p>
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
                  <div className="w-full flex flex-col justify-end rounded-t bg-white/[0.01] h-full relative transition-all duration-300 group-hover:bg-white/[0.03]">
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
                      className="w-full bg-white/[0.1] transition-all duration-300 border-t border-white/5"
                      style={{ height: `${investedHeight}%` }}
                    />
                  </div>

                  {/* Label Ano */}
                  <span className="text-[9px] text-[#F4F0FF]/30 mt-2 font-mono group-hover:text-[#F4F0FF]/60 transition-colors uppercase">
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
