'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import type { AssetHistoricalPrice } from '@/types/market'

interface AssetQuotesTableProps {
  ticker: string
  history: AssetHistoricalPrice[]
}

function toValidDate(timestamp: number) {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return null
  const multiplier = timestamp > 1_000_000_000_000 ? 1 : 1000
  const date = new Date(timestamp * multiplier)
  return Number.isNaN(date.getTime()) ? null : date
}

export function AssetQuotesTableSkeleton({ ticker }: { ticker: string }) {
  const cols = ['Data', 'Abertura', 'Fechamento', 'Variação', 'Mínimo', 'Máximo', 'Volume']
  return (
    <section className="bull-panel relative overflow-hidden p-4 md:p-5" aria-hidden="true">
      <GlassHighlight widthPercent={55} />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="bull-eyebrow">OHLCV</p>
          <h3 className="mt-1 font-serif text-lg text-[#F4F0FF]">{ticker.toUpperCase()}</h3>
        </div>
        <div className="h-9 w-28 animate-pulse rounded-xl bg-white/[0.05]" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-black/20">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#161222] text-[#F4F0FF]/40 border-b border-white/[0.08]">
            <tr>
              {cols.map((h, j) => (
                <th
                  key={h}
                  className={`px-4 py-3 font-semibold uppercase tracking-wider ${j > 0 ? 'text-right' : ''}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {[0, 1, 2, 3, 4].map((i) => (
              <tr key={i}>
                {cols.map((_, j) => (
                  <td key={j} className={`px-4 py-3 ${j > 0 ? 'text-right' : ''}`}>
                    <div
                      className="inline-block h-3 animate-pulse rounded-full bg-white/[0.05]"
                      style={{
                        width: j === 0 ? '5rem' : '3.5rem',
                        animationDelay: `${i * 25 + j * 8}ms`,
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function AssetQuotesTable({ ticker, history }: AssetQuotesTableProps) {
  const [copied, setCopied] = useState(false)

  if (!history || history.length === 0) {
    return (
      <section className="bull-panel p-5">
        <GlassHighlight widthPercent={55} />
        <p className="bull-eyebrow mb-3">OHLCV diário</p>
        <div className="flex h-24 items-center justify-center">
          <p className="text-sm text-[#F4F0FF]/40">Histórico de cotações indisponível</p>
        </div>
      </section>
    )
  }

  // Format historical series, sort chronologically, calculate variations, then reverse to show latest first.
  // High, low, open and volume are displayed only when the backend returns real OHLCV values.
  const sortedHistory = [...history]
    .filter((day) => toValidDate(day.timestamp) && Number.isFinite(day.close) && day.close > 0)
    .sort((a, b) => a.timestamp - b.timestamp)

  if (sortedHistory.length === 0) {
    return (
      <section className="bull-panel p-5">
        <GlassHighlight widthPercent={55} />
        <p className="bull-eyebrow mb-3">OHLCV diário</p>
        <div className="flex h-24 items-center justify-center">
          <p className="text-sm text-[#F4F0FF]/40">Histórico de cotações indisponível</p>
        </div>
      </section>
    )
  }

  const rows = sortedHistory.map((day, idx) => {
    const prevDay = sortedHistory[idx - 1]
    let change = 0
    if (prevDay && prevDay.close > 0) {
      change = ((day.close - prevDay.close) / prevDay.close) * 100
    }

    const dateObj = toValidDate(day.timestamp) ?? new Date(0)
    
    return {
      date: new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Sao_Paulo',
      }).format(dateObj),
      open: day.open ?? null,
      close: day.close,
      high: day.high ?? null,
      low: day.low ?? null,
      volume: day.volume ?? null,
      change,
      timestamp: day.timestamp,
    }
  }).reverse() // Show latest date first

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const formatOptionalBRL = (val: number | null) => {
    return val === null ? 'n/d' : formatBRL(val)
  }

  const formatChange = (val: number) => {
    return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`
  }

  // Export quote data as a clean CSV text block copied to clipboard.
  const handleExportCSV = () => {
    const header = 'Data;Abertura;Fechamento;Variacao;Minimo;Maximo;Volume\n'
    const csvContent = rows
      .map(
        (r) =>
          `${r.date};${r.open?.toFixed(2).replace('.', ',') ?? ''};${r.close.toFixed(2).replace('.', ',')};${formatChange(
            r.change
          )};${r.low?.toFixed(2).replace('.', ',') ?? ''};${r.high?.toFixed(2).replace('.', ',') ?? ''};${r.volume ?? ''}`
      )
      .join('\n')
    
    navigator.clipboard.writeText(header + csvContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="bull-panel relative overflow-hidden p-4 md:p-5">
      <GlassHighlight widthPercent={55} />

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="bull-eyebrow">OHLCV</p>
          <h3 className="mt-1 font-serif text-lg text-[#F4F0FF]">{ticker.toUpperCase()}</h3>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs text-[#F4F0FF]/60 transition hover:bg-white/[0.08] hover:text-[#F4F0FF] active:scale-[0.98]"
          title="Copiar dados como CSV"
        >
          {copied ? (
            <>
              <Check size={12} className="text-[#22C55E]" />
              Copiado!
            </>
          ) : (
            <>
              <Copy size={12} />
              Exportar CSV
            </>
          )}
        </button>
      </div>

      {/* Spreadsheet container with fixed height scroll */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-black/20">
        <div className="bull-scroll max-h-[260px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-[#161222] text-[#F4F0FF]/40 border-b border-white/[0.08] z-10 select-none">
              <tr>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Data</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Abertura</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Fechamento</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Variação</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Mínimo</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Máximo</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Volume</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-white/[0.03] text-[#F4F0FF]/80">
              {rows.map((row, index) => {
                const isUp = row.change > 0
                const isDown = row.change < 0
                const changeColor = isUp
                  ? 'text-[#22C55E]'
                  : isDown
                    ? 'text-[#F43F5E]'
                    : 'text-[#F4F0FF]/40'

                return (
                  <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-[#F4F0FF]">{row.date}</td>
                    <td className="px-4 py-3 text-right text-[#F4F0FF]/60">
                      {formatOptionalBRL(row.open)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#F4F0FF]">
                      {formatBRL(row.close)}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${changeColor}`}>
                      {formatChange(row.change)}
                    </td>
                    <td className="px-4 py-3 text-right text-[#F4F0FF]/60">
                      {formatOptionalBRL(row.low)}
                    </td>
                    <td className="px-4 py-3 text-right text-[#F4F0FF]/60">
                      {formatOptionalBRL(row.high)}
                    </td>
                    <td className="px-4 py-3 text-right text-[#F4F0FF]/60">
                      {row.volume?.toLocaleString('pt-BR') ?? 'n/d'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
