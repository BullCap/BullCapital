'use client'

import React from 'react'
import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts'
import { VariationBadge } from '@/components/atoms/VariationBadge'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

export type AssetData = {
  id: string
  name: string
  value: string
  variation: number
  history: { value: number }[]
}

interface AssetCardProps {
  asset: AssetData
}

export default function AssetCard({ asset }: AssetCardProps) {
  const isPositive = asset.variation >= 0
  const themeColor = isPositive ? '#8B5CF6' : '#F43F5E'
  const glowClass = isPositive
    ? 'shadow-[0_0_20px_rgba(139,92,246,0.15)]'
    : 'shadow-[0_0_20px_rgba(0,0,0,0.4)]'

  return (
    <div
      className={`group relative flex h-48 cursor-default flex-col justify-between rounded-[2rem] border border-white/10 bg-[#1A1625]/40 p-6 backdrop-blur-2xl transition-all duration-700 ${glowClass} overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.4)] hover:-translate-y-1.5 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-1px_2px_rgba(0,0,0,0.8),0_15px_30px_rgba(0,0,0,0.5)]`}
    >
      <GlassHighlight />

      {/* Header: name + variation badge */}
      <div className="z-10 flex w-full items-start justify-between transition-transform duration-500 group-hover:translate-x-1">
        <h3 className="font-serif text-xl tracking-tight text-[#F4F0FF] drop-shadow-sm">
          {asset.name}
        </h3>
        <VariationBadge variation={asset.variation} />
      </div>

      {/* Value */}
      <div className="z-10 mt-2 flex-1 transition-transform duration-500 group-hover:translate-x-1">
        <p className="font-sans text-3xl font-light tracking-tight text-[#F4F0FF]">{asset.value}</p>
      </div>

      {/* Sparkline Overlay */}
      {asset.history.length >= 2 && (
        <div className="pointer-events-none absolute bottom-0 left-0 h-[45%] w-full opacity-50 transition-opacity duration-700 group-hover:opacity-85">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={asset.history} margin={{ top: 10, bottom: 10, left: 0, right: 0 }}>
              <YAxis domain={['dataMin', 'dataMax']} hide />
              <Line
                type="monotone"
                dataKey="value"
                stroke={themeColor}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                style={{
                  filter: isPositive
                    ? 'drop-shadow(0px -4px 8px rgba(139,92,246,0.6))'
                    : 'drop-shadow(0px -4px 8px rgba(244,63,94,0.6))',
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
export { AssetCard }
