'use client'

import { ChevronRight } from 'lucide-react'
import { CompanyIcon } from '@/components/atoms/CompanyIcon'
import { cn } from '@/lib/utils'
import type { PortfolioHolding } from './portfolioMock'
import { formatMoney, formatPercentValue, toneClass } from './portfolio-format'

interface HoldingsTableProps {
  holdings: PortfolioHolding[]
  onSelectHolding: (holding: PortfolioHolding) => void
}

export default function HoldingsTable({ holdings, onSelectHolding }: HoldingsTableProps) {
  const sortedHoldings = [...holdings].sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))

  return (
    <section className="bull-panel overflow-hidden p-0">
      <div className="flex flex-col gap-2 border-b border-white/[0.06] p-4 md:flex-row md:items-end md:justify-between md:p-5">
        <div>
          <p className="bull-eyebrow">Posições</p>
          <h2 className="mt-0.5 font-serif text-lg text-[#F4F0FF]">Tabela inteligente de ativos</h2>
        </div>
        <p className="text-xs text-[#F4F0FF]/40">Ordenada por impacto absoluto no resultado.</p>
      </div>

      {sortedHoldings.length > 0 ? (
        <>
          <div className="bull-scroll hidden max-h-[460px] overflow-auto xl:block">
            <table className="w-full min-w-[1180px] border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-[#0D0B14]/95 backdrop-blur">
                <tr className="border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/30">
                  <th className="px-5 py-3">Ativo</th>
                  <th className="px-3 py-3">Classe</th>
                  <th className="px-3 py-3">Setor</th>
                  <th className="px-3 py-3 text-right">Qtd.</th>
                  <th className="px-3 py-3 text-right">Preço médio</th>
                  <th className="px-3 py-3 text-right">Preço atual</th>
                  <th className="px-3 py-3 text-right">P&L</th>
                  <th className="px-3 py-3 text-right">Rent.</th>
                  <th className="px-3 py-3 text-right">Peso</th>
                  <th className="px-3 py-3 text-right">DY</th>
                  <th className="px-3 py-3 text-right">Vol.</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedHoldings.map((holding) => {
                  const pnlPositive = holding.pnl >= 0
                  return (
                    <tr
                      key={holding.symbol}
                      tabIndex={0}
                      onClick={() => onSelectHolding(holding)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') onSelectHolding(holding)
                      }}
                      className="cursor-pointer border-b border-white/[0.04] transition hover:bg-white/[0.035] focus:bg-white/[0.04] focus:outline-none"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <CompanyIcon
                            ticker={holding.symbol}
                            size={30}
                            className="rounded-md border border-white/[0.08] bg-[#0A0810]/70"
                          />
                          <div className="min-w-0">
                            <p className="font-mono text-sm font-bold text-[#F4F0FF]">{holding.symbol}</p>
                            <p className="truncate text-xs text-[#F4F0FF]/35">{holding.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-[#F4F0FF]/55">{holding.className}</td>
                      <td className="px-3 py-3 text-xs text-[#F4F0FF]/55">{holding.sector}</td>
                      <td className="px-3 py-3 text-right font-mono text-xs text-[#F4F0FF]/60">
                        {holding.quantity.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs text-[#F4F0FF]/60">
                        {formatMoney(holding.avgPrice)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs font-bold text-[#F4F0FF]">
                        {formatMoney(holding.currentPrice)}
                      </td>
                      <td
                        className={cn(
                          'px-3 py-3 text-right font-mono text-xs font-bold',
                          pnlPositive ? 'text-emerald-300' : 'text-rose-300'
                        )}
                      >
                        {formatMoney(holding.pnl)}
                      </td>
                      <td
                        className={cn(
                          'px-3 py-3 text-right font-mono text-xs font-bold',
                          holding.returnPct >= 0 ? 'text-emerald-300' : 'text-rose-300'
                        )}
                      >
                        {formatPercentValue(holding.returnPct, { signed: true })}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs text-[#F4F0FF]/70">
                        {formatPercentValue(holding.weight)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs text-[#F4F0FF]/70">
                        {formatPercentValue(holding.dividendYield)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs text-[#F4F0FF]/70">
                        {formatPercentValue(holding.volatility)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn('rounded-full border px-2 py-1 text-[10px] font-bold', toneClass(holding.tone))}>
                          {holding.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-3 xl:hidden">
            {sortedHoldings.map((holding) => (
              <button
                key={holding.symbol}
                type="button"
                onClick={() => onSelectHolding(holding)}
                className="bull-panel-quiet p-4 text-left focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/40"
              >
                <div className="flex items-center gap-3">
                  <CompanyIcon
                    ticker={holding.symbol}
                    size={32}
                    className="rounded-md border border-white/[0.08] bg-[#0A0810]/70"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-bold text-[#F4F0FF]">{holding.symbol}</p>
                    <p className="truncate text-xs text-[#F4F0FF]/35">{holding.name}</p>
                  </div>
                  <ChevronRight size={16} className="text-[#F4F0FF]/25" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-[#F4F0FF]/30">P&L</p>
                    <p className={cn('mt-1 font-mono font-bold', holding.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
                      {formatMoney(holding.pnl)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#F4F0FF]/30">Peso</p>
                    <p className="mt-1 font-mono font-bold text-[#F4F0FF]">{formatPercentValue(holding.weight)}</p>
                  </div>
                  <div>
                    <p className="text-[#F4F0FF]/30">Status</p>
                    <p className="mt-1 truncate font-bold text-[#F4F0FF]/70">{holding.status}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="flex min-h-48 items-center justify-center p-6 text-sm text-[#F4F0FF]/45">
          Nenhum ativo encontrado nesta carteira.
        </div>
      )}
    </section>
  )
}
