'use client'

import { ChevronRight } from 'lucide-react'
import { CompanyIcon } from '@/components/atoms/CompanyIcon'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import { VariationBadge } from '@/components/atoms/VariationBadge'
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
    <section className="bull-frame p-0">
      <GlassHighlight widthPercent={60} />
      
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
              <thead className="sticky top-0 z-10 bg-[#10131c]/95 backdrop-blur">
                <tr className="border-b border-white/[0.06] text-[10px] font-medium uppercase tracking-[0.14em] text-[#F4F0FF]/30">
                  <th className="px-5 py-4 first:rounded-s-xl last:rounded-e-xl">Ativo</th>
                  <th className="px-3 py-4 first:rounded-s-xl last:rounded-e-xl">Classe</th>
                  <th className="px-3 py-4 first:rounded-s-xl last:rounded-e-xl">Setor</th>
                  <th className="px-3 py-4 text-right first:rounded-s-xl last:rounded-e-xl">Qtd.</th>
                  <th className="px-3 py-4 text-right first:rounded-s-xl last:rounded-e-xl">Preço médio</th>
                  <th className="px-3 py-4 text-right first:rounded-s-xl last:rounded-e-xl">Preço atual</th>
                  <th className="px-3 py-4 text-right first:rounded-s-xl last:rounded-e-xl">P&L</th>
                  <th className="px-3 py-4 text-center first:rounded-s-xl last:rounded-e-xl">Rent.</th>
                  <th className="px-3 py-4 text-right first:rounded-s-xl last:rounded-e-xl">Peso</th>
                  <th className="px-3 py-4 text-right first:rounded-s-xl last:rounded-e-xl">DY</th>
                  <th className="px-3 py-4 text-right first:rounded-s-xl last:rounded-e-xl">Vol.</th>
                  <th className="px-5 py-4 first:rounded-s-xl last:rounded-e-xl">Status</th>
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
                      <td className="px-5 py-3.5">
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
                      <td className="px-3 py-3.5 text-xs text-[#F4F0FF]/55">{holding.className}</td>
                      <td className="px-3 py-3.5 text-xs text-[#F4F0FF]/55">{holding.sector}</td>
                      <td className="px-3 py-3.5 text-right font-mono text-xs text-[#F4F0FF]/60">
                        {holding.quantity.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-xs text-[#F4F0FF]/60">
                        {formatMoney(holding.avgPrice)}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-xs font-bold text-[#F4F0FF]">
                        {formatMoney(holding.currentPrice)}
                      </td>
                      <td
                        className={cn(
                          'px-3 py-3.5 text-right font-mono text-xs font-bold',
                          pnlPositive ? 'text-[#7fb59a]' : 'text-[#c98c9a]'
                        )}
                      >
                        {formatMoney(holding.pnl)}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <VariationBadge variation={holding.returnPct} />
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-xs text-[#F4F0FF]/70">
                        {formatPercentValue(holding.weight)}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-xs text-[#F4F0FF]/70">
                        {formatPercentValue(holding.dividendYield)}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-xs text-[#F4F0FF]/70">
                        {formatPercentValue(holding.volatility)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide', toneClass(holding.tone))}>
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
                className="bull-card-calm p-4 text-left focus:outline-none focus:ring-2 focus:ring-amethyst/30"
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
                    <p className={cn('mt-1 font-mono font-bold', holding.pnl >= 0 ? 'text-[#7fb59a]' : 'text-[#c98c9a]')}>
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
