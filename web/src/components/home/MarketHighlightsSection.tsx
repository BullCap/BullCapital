'use client'

import Link from 'next/link'
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
      className="flex items-center gap-3 rounded-xl border border-transparent px-4 py-2.5 transition-colors duration-300 hover:border-white/[0.06] hover:bg-white/[0.025]"
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
    <div className="bull-card-calm flex flex-1 flex-col p-6">
      <div className="mb-4 flex items-center gap-3 px-1">
        <span className="text-starlight/40">{icon}</span>
        <h3 className="font-serif text-lg tracking-tight text-starlight">{title}</h3>
      </div>

      <div className="flex flex-col gap-0.5">
        {data.length > 0 ? (
          data.slice(0, 5).map((asset) => (
            <HighlightItem key={asset.stock} asset={asset} />
          ))
        ) : (
          <div className="px-4 py-5 text-sm text-starlight/30">
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

export function MarketHighlightsSkeleton() {
  const titles = ['Altas', 'Quedas', 'Volume'] as const
  return (
    <section aria-hidden="true">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between px-1">
        <div>
          <p className="bull-eyebrow">Pregão</p>
          <h2 className="mt-1 font-serif text-2xl tracking-tight text-[#F4F0FF]/80">Destaques</h2>
        </div>
      </div>
      <div className="mt-5 grid w-full grid-cols-1 gap-5 md:grid-cols-3">
        {titles.map((title, cardIdx) => (
          <div key={title} className="bull-card-calm flex flex-1 flex-col p-6">
            <div className="mb-4 flex items-center gap-3 px-1">
              <div
                className="h-4 w-4 animate-pulse rounded bg-white/[0.06]"
                style={{ animationDelay: `${cardIdx * 60}ms` }}
              />
              <h3 className="font-serif text-lg tracking-tight text-starlight">{title}</h3>
            </div>
            <div className="flex flex-col gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3"
                >
                  <div
                    className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-white/[0.07]"
                    style={{ animationDelay: `${cardIdx * 60 + i * 35}ms` }}
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className="h-3 w-14 animate-pulse rounded-full bg-white/[0.06]"
                      style={{ animationDelay: `${cardIdx * 60 + i * 35 + 15}ms` }}
                    />
                    <div
                      className="mt-1.5 h-2.5 w-24 animate-pulse rounded-full bg-white/[0.04]"
                      style={{ animationDelay: `${cardIdx * 60 + i * 35 + 30}ms` }}
                    />
                  </div>
                  <div
                    className="h-3 w-14 animate-pulse rounded-full bg-white/[0.06]"
                    style={{ animationDelay: `${cardIdx * 60 + i * 35 + 45}ms` }}
                  />
                  <div
                    className="h-6 w-16 animate-pulse rounded-full bg-white/[0.05]"
                    style={{ animationDelay: `${cardIdx * 60 + i * 35 + 60}ms` }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

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
        <div className="bull-segmented">
          <button
            onClick={() => setActiveTab('b3')}
            className="bull-tab"
            data-active={activeTab === 'b3'}
          >
            B3
          </button>
          <button
            onClick={() => setActiveTab('alt')}
            className="bull-tab"
            data-active={activeTab === 'alt'}
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
