'use client'

import { Clock3, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PortfolioId, TimeRange } from './portfolioMock'
import { portfolioOptions, timeRangeOptions } from './portfolioMock'

interface PortfolioHeaderProps {
  selectedPortfolio: PortfolioId
  selectedRange: TimeRange
  updatedMinutesAgo: number
  onPortfolioChange: (portfolioId: PortfolioId) => void
  onRangeChange: (range: TimeRange) => void
}

export default function PortfolioHeader({
  selectedPortfolio,
  selectedRange,
  updatedMinutesAgo,
  onPortfolioChange,
  onRangeChange,
}: PortfolioHeaderProps) {
  return (
    <header className="bull-panel-focus px-4 py-3.5 md:px-5 md:py-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="bull-eyebrow">Portfolio Intelligence</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-[#F4F0FF]">
            Inteligência de Carteira
          </h1>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/35">
              Carteira
            </span>
            <select
              value={selectedPortfolio}
              onChange={(event) => onPortfolioChange(event.target.value as PortfolioId)}
              className="h-10 rounded-lg border border-white/[0.08] bg-[#0D0B14]/80 px-3 text-sm font-semibold text-[#F4F0FF] outline-none transition focus:border-[#8B5CF6]/45"
              aria-label="Selecionar carteira"
            >
              {portfolioOptions.map((portfolio) => (
                <option key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/35">
              Período
            </legend>
            <div className="flex rounded-lg border border-white/[0.08] bg-[#0D0B14]/70 p-1">
              {timeRangeOptions.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => onRangeChange(range)}
                  className={cn(
                    'h-8 min-w-10 rounded-md px-2.5 text-[11px] font-bold transition focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/40',
                    selectedRange === range
                      ? 'bg-[#8B5CF6]/20 text-[#F4F0FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                      : 'text-[#F4F0FF]/40 hover:text-[#F4F0FF]/75'
                  )}
                  aria-pressed={selectedRange === range}
                >
                  {range}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center gap-2 sm:self-end">
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 text-xs font-bold text-[#F4F0FF]/70 transition hover:border-[#8B5CF6]/30 hover:text-[#F4F0FF] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/40"
            >
              <FileText size={14} />
              Gerar relatório
            </button>
            <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-emerald-400/10 bg-emerald-400/10 px-3 text-xs font-bold text-emerald-100">
              <Clock3 size={13} />
              Atualizado há {updatedMinutesAgo} min
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
