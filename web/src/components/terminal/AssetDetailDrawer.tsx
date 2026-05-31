'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CompanyIcon } from '@/components/atoms/CompanyIcon'
import { cn } from '@/lib/utils'
import type { PortfolioHolding } from './portfolioMock'
import { formatMoney, formatPercentValue, toneClass } from './portfolio-format'

interface AssetDetailDrawerProps {
  holding: PortfolioHolding | null
  onClose: () => void
}

export default function AssetDetailDrawer({ holding, onClose }: AssetDetailDrawerProps) {
  useEffect(() => {
    if (!holding) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [holding, onClose])

  return (
    <>
      {holding && (
        <button
          type="button"
          aria-label="Fechar detalhe do ativo"
          className="fixed inset-0 z-40 bg-[#0D0B14]/65"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-[31rem] flex-col border-l border-white/[0.08] bg-[#0D0B14] shadow-[0_0_70px_rgba(0,0,0,0.55)] transition-transform duration-300',
          holding ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-hidden={!holding}
      >
        {holding && (
          <>
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <CompanyIcon
                  ticker={holding.symbol}
                  size={36}
                  className="rounded-md border border-white/[0.08] bg-[#0A0810]/70"
                />
                <div className="min-w-0">
                  <p className="font-mono text-lg font-bold text-[#F4F0FF]">{holding.symbol}</p>
                  <p className="truncate text-xs text-[#F4F0FF]/40">{holding.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] text-[#F4F0FF]/45 transition hover:text-[#F4F0FF] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/40"
              >
                <X size={15} />
                <span className="sr-only">Fechar</span>
              </button>
            </div>

            <div className="bull-scroll min-h-0 flex-1 overflow-y-auto p-5">
              <div className="bull-panel-focus p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/35">
                      Preço atual
                    </p>
                    <p className="mt-2 font-mono text-3xl font-semibold text-[#F4F0FF]">
                      {formatMoney(holding.currentPrice)}
                    </p>
                  </div>
                  <span className={cn('rounded-full border px-2 py-1 text-[10px] font-bold', toneClass(holding.tone))}>
                    {holding.status}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-[#F4F0FF]/58">{holding.highlightReason}</p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                {[
                  ['Posição', formatPercentValue(holding.weight)],
                  ['P&L', formatMoney(holding.pnl)],
                  ['Rentabilidade', formatPercentValue(holding.returnPct, { signed: true })],
                  ['Dividend yield', formatPercentValue(holding.dividendYield)],
                ].map(([label, value]) => (
                  <div key={label} className="bull-panel-quiet p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/30">{label}</p>
                    <p className="mt-2 font-mono text-sm font-bold text-[#F4F0FF]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 bull-panel-quiet p-4">
                <h3 className="text-sm font-bold text-[#F4F0FF]">Histórico recente</h3>
                <div className="mt-3 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={holding.recentHistory}>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: 'rgba(244,240,255,0.35)' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis hide domain={['dataMin', 'dataMax']} />
                      <Tooltip
                        contentStyle={{
                          background: '#0D0B14',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 8,
                          color: '#F4F0FF',
                        }}
                        formatter={(value) => formatMoney(Number(value))}
                      />
                      <Line type="monotone" dataKey="price" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-3 bull-panel-quiet p-4">
                <h3 className="text-sm font-bold text-[#F4F0FF]">Indicadores básicos</h3>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Metric label="P/L" value={holding.fundamentals.pl == null ? 'n/d' : `${holding.fundamentals.pl.toLocaleString('pt-BR')}x`} />
                  <Metric label="P/VP" value={holding.fundamentals.pvp == null ? 'n/d' : `${holding.fundamentals.pvp.toLocaleString('pt-BR')}x`} />
                  <Metric label="ROE" value={holding.fundamentals.roe == null ? 'n/d' : formatPercentValue(holding.fundamentals.roe)} />
                  <Metric label="DY" value={holding.fundamentals.dy == null ? 'n/d' : formatPercentValue(holding.fundamentals.dy)} />
                </div>
              </div>

              <div className="mt-3 bull-panel-quiet p-4">
                <h3 className="text-sm font-bold text-[#F4F0FF]">Benchmark e setor</h3>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Metric label="Ativo" value={formatPercentValue(holding.returnPct, { signed: true })} />
                  <Metric label="Benchmark" value={formatPercentValue(holding.benchmarkReturn, { signed: true })} />
                  <Metric label="Setor" value={formatPercentValue(holding.sectorReturn, { signed: true })} />
                  <Metric label="Volatilidade" value={formatPercentValue(holding.volatility)} />
                </div>
              </div>

              <div className="mt-3 bull-panel-quiet p-4">
                <h3 className="text-sm font-bold text-[#F4F0FF]">Notícias e sinais</h3>
                <div className="mt-3 space-y-2">
                  {holding.news.map((item) => (
                    <p key={item} className="rounded-lg border border-white/[0.05] bg-white/[0.025] px-3 py-2 text-xs leading-5 text-[#F4F0FF]/58">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.05] bg-white/[0.025] px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/25">{label}</p>
      <p className="mt-1 font-mono text-xs font-bold text-[#F4F0FF]">{value}</p>
    </div>
  )
}
