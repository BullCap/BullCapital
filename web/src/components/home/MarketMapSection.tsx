'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import MarketImpactBars from './MarketImpactBars'
import SectorTreeMap from './SectorTreeMap'
import type { MarketListingItem } from '@/types/market'

interface MarketMapSectionProps {
  assets: MarketListingItem[]
}

type MapViewMode = 'ranking' | 'sectors'

const TABS: { id: MapViewMode; label: string; width: number }[] = [
  { id: 'ranking', label: 'Ranking', width: 84 },
  { id: 'sectors', label: 'Setores', width: 84 },
]

export default function MarketMapSection({ assets }: MarketMapSectionProps) {
  const [viewMode, setViewMode] = useState<MapViewMode>('sectors')
  const activeIndex = TABS.findIndex((tab) => tab.id === viewMode)
  const slideLeft = TABS.slice(0, activeIndex).reduce((sum, tab) => sum + tab.width, 0)
  const slideWidth = TABS[activeIndex]?.width ?? 84

  return (
    <section className="bull-panel relative flex h-full flex-col overflow-hidden p-5">
      <div className="absolute -left-10 -top-10 -z-10 h-32 w-32 rounded-full bg-[#8B5CF6]/10 blur-[40px]" />

      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="bull-eyebrow">
            {viewMode === 'ranking' ? 'Mapa de Impacto' : 'Mapa por Setor'}
          </p>
          <h2 className="mt-1.5 font-serif text-xl text-[#F4F0FF]">
            {viewMode === 'ranking' ? 'Movers do pregão' : 'Setores da Ibovespa'}
          </h2>
        </div>

        <div className="relative flex h-9 shrink-0 items-center rounded-xl bg-black/35 p-0.5 border border-white/[0.06] w-fit">
          <div className="relative flex">
            <div
              className="absolute top-0 bottom-0 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 transition-all duration-300 ease-out"
              style={{ left: `${slideLeft}px`, width: `${slideWidth}px` }}
            />
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`z-10 px-3.5 py-1 text-xs font-semibold tracking-wider transition duration-300 ${
                  viewMode === tab.id ? 'text-[#C4B5FD]' : 'text-[#F4F0FF]/40 hover:text-[#F4F0FF]/60'
                }`}
                style={{ width: `${tab.width}px` }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative flex-1">
        <AnimatePresence mode="wait">
          {viewMode === 'ranking' ? (
            <motion.div
              key="ranking-view"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <MarketImpactBars assets={assets} maxRows={18} showHeader={false} />
            </motion.div>
          ) : (
            <motion.div
              key="sectors-view"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <SectorTreeMap assets={assets} showHeader={false} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
