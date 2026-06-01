'use client'

import React from 'react'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'

interface LandingRadarPoint {
  subject: string
  value: number
  fullMark: number
}

interface MarketRadarCardProps {
  data: LandingRadarPoint[]
}

export default function MarketRadarCard({ data }: MarketRadarCardProps) {
  return (
    <div className="bull-card-calm group relative flex h-full w-full flex-col items-center justify-center p-6 text-center">
      <GlassHighlight widthPercent={80} className="opacity-45" />

      <h2 className="bull-eyebrow z-10 mb-2 mt-2">
        Dinâmica Atual
      </h2>

      {data.length > 0 ? (
        <div className="z-10 h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'rgba(226, 222, 240, 0.52)', fontSize: 10, fontFamily: 'Inter, sans-serif' }}
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Mercado" dataKey="value" stroke="#82759F" fill="#82759F" fillOpacity={0.22} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="z-10 text-sm text-starlight/40">Dados indisponíveis</p>
      )}
    </div>
  )
}
export { MarketRadarCard }
