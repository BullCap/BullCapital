'use client'

import Link from 'next/link'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import { CompanyIcon } from '@/components/atoms/CompanyIcon'
import { VariationBadge } from '@/components/atoms/VariationBadge'
import { buildAssetHref } from '@/lib/market-routing'
import type { MarketListingItem } from '@/types/market'

type DisplayAsset = {
  stock: string
  name: string
  close: number
  change: number
  volume: number
}

const ICONS = {
  gainers: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 3L12.5 10H3.5L8 3Z" fill="currentColor" opacity="0.8" />
    </svg>
  ),
  losers: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 13L3.5 6H12.5L8 13Z" fill="currentColor" opacity="0.8" />
    </svg>
  ),
  mostTraded: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="9" width="3" height="5" rx="0.75" fill="currentColor" opacity="0.5" />
      <rect x="6.5" y="5.5" width="3" height="8.5" rx="0.75" fill="currentColor" opacity="0.7" />
      <rect x="11" y="2" width="3" height="12" rx="0.75" fill="currentColor" opacity="0.9" />
    </svg>
  ),
  crypto: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
      <path d="M8 5V11M6.5 7H9.5M6.5 9H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    </svg>
  ),
  fixedIncome: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="3" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
      <path d="M3 8H13" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
    </svg>
  ),
}

function HighlightItem({ asset }: { asset: DisplayAsset }) {
  return (
    <Link
      href={buildAssetHref(asset.stock)}
      className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 transition-all duration-300 hover:-translate-y-px hover:border-white/10 hover:bg-white/[0.05]"
    >
      <CompanyIcon ticker={asset.stock} size={36} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-serif text-sm tracking-tight text-[#F4F0FF]">{asset.stock}</p>
        <p className="truncate text-xs text-white/40">{asset.name}</p>
      </div>
      <p className="shrink-0 text-sm font-medium text-[#F4F0FF]">
        {asset.close.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </p>
      <VariationBadge variation={asset.change} />
    </Link>
  )
}

function HighlightList({
  title,
  icon,
  data,
}: {
  title: string
  icon: React.ReactNode
  data: DisplayAsset[]
}) {
  return (
    <div className="group relative flex flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#0f0c18]/50 p-6 shadow-[inset_0_1px_0px_rgba(255,255,255,0.08),0_10px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-700">
      <div className="pointer-events-none absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[#8B5CF6]/10 blur-[80px] transition-all duration-700 group-hover:bg-[#8B5CF6]/18" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      <GlassHighlight widthPercent={50} />

      <div className="mb-5 flex items-center gap-3 px-1">
        <span className="text-white/55">{icon}</span>
        <h3 className="font-serif text-xl tracking-tight text-[#F4F0FF]">{title}</h3>
      </div>

      <div className="flex flex-col gap-2">
        {data.length > 0 ? (
          data.slice(0, 5).map((asset) => (
            <HighlightItem key={asset.stock} asset={asset} />
          ))
        ) : (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-5 text-sm text-white/35">
            Dados indisponíveis
          </div>
        )}
      </div>

    </div>
  )
}

function toDisplay(m: MarketListingItem | { stock: string; name: string; close: number; change: number; volume: number }): DisplayAsset {
  return { stock: m.stock, name: m.name, close: m.close, change: m.change, volume: m.volume }
}

import { useState } from 'react'

interface MarketHighlightsSectionProps {
  stockGainers: MarketListingItem[]
  stockLosers: MarketListingItem[]
  stockMostTraded: MarketListingItem[]
  cryptoHighlights: MarketListingItem[]
  fixedIncomeHighlights: MarketListingItem[]
}

export default function MarketHighlightsSection({
  stockGainers,
  stockLosers,
  stockMostTraded,
  cryptoHighlights,
  fixedIncomeHighlights,
}: MarketHighlightsSectionProps) {
  const [activeTab, setActiveTab] = useState<'b3' | 'alt'>('b3')

  const gainers = stockGainers.map(toDisplay)
  const losers = stockLosers.map(toDisplay)
  const mostTraded = stockMostTraded.map(toDisplay)
  const crypto = cryptoHighlights.map(toDisplay)
  const fixedIncome = fixedIncomeHighlights.map(toDisplay)

  return (
    <section>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between px-1">
        <div>
          <p className="bull-eyebrow">Pregão</p>
          <h2 className="mt-1 font-serif text-2xl tracking-tight text-[#F4F0FF]/80">
            Destaques
          </h2>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-white/[0.03] border border-white/5 p-1 select-none">
          <button
            onClick={() => setActiveTab('b3')}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition duration-300 ${
              activeTab === 'b3'
                ? 'bg-[#8B5CF6]/20 text-[#F4F0FF] border border-[#8B5CF6]/30 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                : 'text-white/40 hover:text-white border border-transparent'
            }`}
          >
            B3
          </button>
          <button
            onClick={() => setActiveTab('alt')}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition duration-300 ${
              activeTab === 'alt'
                ? 'bg-[#8B5CF6]/20 text-[#F4F0FF] border border-[#8B5CF6]/30 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                : 'text-white/40 hover:text-white border border-transparent'
            }`}
          >
            Renda fixa
          </button>
        </div>
      </div>

      {activeTab === 'b3' ? (
        <div className="mt-5 grid w-full grid-cols-1 gap-5 md:grid-cols-3">
          <HighlightList title="Altas" icon={ICONS.gainers} data={gainers} />
          <HighlightList title="Quedas" icon={ICONS.losers} data={losers} />
          <HighlightList title="Volume" icon={ICONS.mostTraded} data={mostTraded} />
        </div>
      ) : (
        <div className="mt-5 grid w-full grid-cols-1 gap-5 md:grid-cols-2">
          <HighlightList title="Tesouro" icon={ICONS.fixedIncome} data={fixedIncome} />
          <HighlightList title="Cripto" icon={ICONS.crypto} data={crypto} />
        </div>
      )}
    </section>
  )
}
