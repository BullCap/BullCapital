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

const TABS: { id: MapViewMode; label: string }[] = [
  { id: 'ranking', label: 'Ranking' },
  { id: 'sectors', label: 'Setores' },
]

export default function MarketMapSection({ assets }: MarketMapSectionProps) {
  const [viewMode, setViewMode] = useState<MapViewMode>('sectors')

  return (
    <section className="bull-frame relative flex h-full flex-col overflow-hidden p-6">

      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="bull-eyebrow">
            {viewMode === 'ranking' ? 'Mapa de Impacto' : 'Mapa por Setor'}
          </p>
          <h2 className="mt-1.5 font-serif text-xl text-[#F4F0FF]">
            {viewMode === 'ranking' ? 'Movers do pregão' : 'Setores do Ibovespa'}
          </h2>
        </div>

        <div className="bull-segmented">
          <div className="relative flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className="bull-tab min-w-[5.25rem]"
                data-active={viewMode === tab.id}
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
