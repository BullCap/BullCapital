'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import MarketBubbleMap from './MarketBubbleMap'
import MarketTreeMap from './MarketTreeMap'
import type { MarketListingItem } from '@/types/market'

interface MarketMapSectionProps {
  assets: MarketListingItem[]
}

type MapViewMode = 'bubble' | 'treemap'

export default function MarketMapSection({ assets }: MarketMapSectionProps) {
  const [viewMode, setViewMode] = useState<MapViewMode>('bubble')

  return (
    <section className="bull-panel p-5 relative overflow-hidden">
      {/* Glow Highlight */}
      <div className="absolute -left-10 -top-10 -z-10 h-32 w-32 rounded-full bg-[#8B5CF6]/10 blur-[40px]" />

      {/* Unified Premium Header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="bull-eyebrow">
            {viewMode === 'bubble' ? 'Mapa de Impacto' : 'Mapa dos Ativos'}
          </p>
          <h2 className="mt-1.5 font-serif text-xl text-[#F4F0FF]">
            {viewMode === 'bubble' ? 'Ativos em movimento' : 'Mapa de calor flat'}
          </h2>
        </div>

        {/* Sliding Tab Toggle Switch */}
        <div className="relative flex h-9 shrink-0 items-center rounded-xl bg-black/35 p-0.5 border border-white/[0.06] w-fit">
          <div className="relative flex">
            {/* Sliding backdrop */}
            <div
              className={`absolute top-0 bottom-0 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 transition-all duration-300 ease-out`}
              style={{
                left: viewMode === 'bubble' ? '0px' : '76px',
                width: viewMode === 'bubble' ? '76px' : '86px',
              }}
            />
            
            <button
              onClick={() => setViewMode('bubble')}
              className={`z-10 px-3.5 py-1 text-xs font-semibold tracking-wider transition duration-300 ${
                viewMode === 'bubble' ? 'text-[#C4B5FD]' : 'text-[#F4F0FF]/40 hover:text-[#F4F0FF]/60'
              }`}
              style={{ width: '76px' }}
            >
              Bolhas
            </button>
            
            <button
              onClick={() => setViewMode('treemap')}
              className={`z-10 px-3.5 py-1 text-xs font-semibold tracking-wider transition duration-300 ${
                viewMode === 'treemap' ? 'text-[#C4B5FD]' : 'text-[#F4F0FF]/40 hover:text-[#F4F0FF]/60'
              }`}
              style={{ width: '86px' }}
            >
              Treemap
            </button>
          </div>
        </div>
      </div>

      {/* Map Content Renderer with AnimatePresence */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {viewMode === 'bubble' ? (
            <motion.div
              key="bubble-view"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {/* Render bubble map directly without its container layout */}
              <div className="inner-map-wrap">
                <MarketBubbleMap assets={assets} showHeader={false} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="treemap-view"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="inner-map-wrap">
                <MarketTreeMap assets={assets} showHeader={false} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
