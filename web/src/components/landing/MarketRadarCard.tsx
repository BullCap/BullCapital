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
    <div className="group relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A1625]/40 p-6 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-700 hover:-translate-y-1.5 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-1px_2px_rgba(0,0,0,0.8),0_15px_30px_rgba(0,0,0,0.5)]">
      <div className="pointer-events-none absolute -top-10 h-64 w-64 rounded-full bg-[#8B5CF6]/10 blur-[80px] transition-all duration-700 group-hover:bg-[#8B5CF6]/20" />
      <GlassHighlight widthPercent={80} />

      <h2 className="z-10 mb-2 mt-2 text-balance font-serif text-sm font-bold uppercase tracking-widest text-[#F4F0FF]">
        Dinâmica Atual
      </h2>

      {data.length > 0 ? (
        <div className="z-10 h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'rgba(244, 240, 255, 0.6)', fontSize: 10, fontFamily: 'serif' }}
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Mercado" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="z-10 text-sm text-[#F4F0FF]/40">Dados indisponíveis</p>
      )}
    </div>
  )
}
export { MarketRadarCard }
