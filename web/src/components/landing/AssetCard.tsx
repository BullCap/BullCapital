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
  const themeColor = isPositive ? '#7FB59A' : '#C98C9A'

  return (
    <div
      className="bull-card-calm group relative flex h-48 cursor-default flex-col justify-between p-6"
    >
      <GlassHighlight className="opacity-45" />

      {/* Header: name + variation badge */}
      <div className="z-10 flex w-full items-start justify-between">
        <h3 className="font-serif text-xl font-medium tracking-tight text-starlight">
          {asset.name}
        </h3>
        <VariationBadge variation={asset.variation} />
      </div>

      <div className="z-10 mt-2 flex-1">
        <p className="font-sans text-3xl font-medium tracking-tight text-starlight">{asset.value}</p>
      </div>

      {asset.history.length >= 2 && (
        <div className="pointer-events-none absolute bottom-0 left-0 h-[45%] w-full opacity-45 transition-opacity duration-700 group-hover:opacity-70">
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
                    ? 'drop-shadow(0px -4px 8px rgba(127,181,154,0.24))'
                    : 'drop-shadow(0px -4px 8px rgba(201,140,154,0.24))',
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
