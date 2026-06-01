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
    <header className="bull-frame px-4 py-3.5 md:px-5 md:py-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="bull-eyebrow">Mesa do analista</p>
          <h1 className="mt-1 font-serif text-2xl font-medium text-[#F4F0FF]">
            Terminal
          </h1>
          <p className="mt-1 text-sm text-starlight/45">Watchlist, comparação e leitura consolidada em um só lugar.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/35">
              Carteira
            </span>
            <select
              value={selectedPortfolio}
              onChange={(event) => onPortfolioChange(event.target.value as PortfolioId)}
              className="h-10 rounded-xl border border-white/[0.08] bg-[#0D0B14]/80 px-3 text-sm font-medium text-[#F4F0FF] outline-none transition focus:border-amethyst/45"
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
            <div className="bull-segmented">
              {timeRangeOptions.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => onRangeChange(range)}
                  className={cn(
                    'bull-tab min-h-8 min-w-10 px-2.5 text-[11px]',
                    selectedRange === range && 'bg-white/[0.065] text-[#F4F0FF]'
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
              className="bull-action h-10 px-3 text-xs"
            >
              <FileText size={14} />
              Gerar relatório
            </button>
            <span className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 text-xs font-medium text-starlight/55">
              <Clock3 size={13} />
              Atualizado há {updatedMinutesAgo} min
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
