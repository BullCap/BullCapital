'use client'

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts'
import type { MarketRadarDataPoint } from '@/types/market'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

interface RadarSectionProps {
  data: MarketRadarDataPoint[] | null
}

export default function RadarSection({ data }: RadarSectionProps) {
  const averageScore =
    data && data.length > 0
      ? Math.round(data.reduce((total, point) => total + point.value, 0) / data.length)
      : null

  return (
    <section className="bull-panel p-4 md:p-5">
      <GlassHighlight widthPercent={60} />

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="bull-eyebrow">Perfil</p>
          <h2 className="mt-1 font-serif text-xl text-[#F4F0FF]">Scores do ativo</h2>
        </div>
        {averageScore !== null && (
          <div className="flex items-baseline gap-2">
            <p className="text-[10px] uppercase tracking-widest text-[#F4F0FF]/40">Pulso</p>
            <p className="text-2xl font-medium leading-none text-[#F4F0FF]">{averageScore}</p>
          </div>
        )}
      </div>

      {!data || data.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center">
          <p className="text-sm text-[#F4F0FF]/40">Análise indisponível</p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-center">
            <div className="rounded-2xl border border-white/[0.06] bg-black/15 px-1 py-3 shadow-[inset_0_1px_14px_rgba(0,0,0,0.26)]">
              <ResponsiveContainer width="100%" height={224}>
                <RadarChart data={data} cx="50%" cy="52%" outerRadius="70%">
                  <defs>
                    <radialGradient id="bull-asset-radar-fill">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.24} />
                      <stop offset="65%" stopColor="#8B5CF6" stopOpacity={0.14} />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.04} />
                    </radialGradient>
                  </defs>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: 'rgba(244,240,255,0.62)', fontSize: 10 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      background: '#111827',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '0.875rem',
                      color: '#F4F0FF',
                      fontSize: 12,
                    }}
                    formatter={(value) => [`${value}/100`, 'Pontuação']}
                    labelStyle={{ color: 'rgba(219,234,254,0.55)', fontSize: 11 }}
                  />
                  <Radar
                    name="Ativo"
                    dataKey="value"
                    stroke="#A78BFA"
                    fill="url(#bull-asset-radar-fill)"
                    fillOpacity={1}
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: '#A78BFA', stroke: '#0D0B14', strokeWidth: 1.25 }}
                    isAnimationActive
                    animationDuration={700}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-2">
              {data.map((point) => (
                <div key={point.metric} className="grid grid-cols-[minmax(0,1fr)_2rem] items-center gap-3">
                  <div>
                    <div className="mb-1 flex items-center justify-between gap-3 text-[11px]">
                      <span className="truncate text-[#F4F0FF]/50">{point.metric}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <span
                        style={{ width: `${point.value}%` }}
                        className="block h-full rounded-full bg-[#A78BFA]"
                      />
                    </div>
                  </div>
                  <span className="text-right text-[11px] font-medium text-[#F4F0FF]/70">{point.value}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
