'use client'

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import type { AnalysisRadarData } from '@/lib/actions/analysis'

interface RadarChartArtifactProps {
  title?: string
  chartNote?: string
  radarData: AnalysisRadarData
}

export function RadarChartArtifact({ title, chartNote, radarData }: RadarChartArtifactProps) {
  const points = Object.entries(radarData)
    .filter(([, v]) => v !== undefined)
    .map(([metric, value]) => ({ metric, value: value as number }))

  const avg = points.length
    ? Math.round(points.reduce((s, p) => s + p.value, 0) / points.length)
    : null

  return (
    <section className="bull-frame p-5">
      <GlassHighlight widthPercent={60} />
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="bull-eyebrow">Perfil do ativo</p>
          {title && <h3 className="mt-1.5 font-serif text-lg text-[#F4F0FF]">{title}</h3>}
        </div>
        {avg !== null && (
          <div className="flex flex-col items-center gap-0.5">
            <p className="text-[10px] uppercase tracking-widest text-[#F4F0FF]/40">Pulso</p>
            <p className="text-2xl font-medium leading-none text-[#F4F0FF]">{avg}</p>
          </div>
        )}
      </div>

      {points.length < 3 ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-xs text-[#F4F0FF]/30">Dados de radar indisponíveis</p>
        </div>
      ) : (
        <>
          <div className="rounded-[1.75rem] border border-white/[0.06] bg-black/15 px-1 pb-2 pt-4 shadow-[inset_0_1px_18px_rgba(0,0,0,0.3)]">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={points} cx="50%" cy="50%" outerRadius="68%">
                <defs>
                  <radialGradient id="artifact-radar-fill">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.04} />
                  </radialGradient>
                </defs>
                <PolarGrid stroke="rgba(255,255,255,0.09)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(244,240,255,0.65)', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', fontSize: 12, color: '#F4F0FF' }}
                  formatter={(v) => [`${v}/100`, 'Score']}
                  labelStyle={{ color: 'rgba(219,234,254,0.55)', fontSize: 11 }}
                />
                <Radar dataKey="value" stroke="#A78BFA" fill="url(#artifact-radar-fill)" strokeWidth={2.5}
                  dot={{ r: 3, fill: '#A78BFA', stroke: '#0D0B14', strokeWidth: 1.5 }}
                  isAnimationActive animationDuration={800}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 grid gap-2">
            {points.map((p) => (
              <div key={p.metric} className="grid grid-cols-[1fr_2rem] items-center gap-3">
                <div>
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="text-[#F4F0FF]/50">{p.metric}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <span style={{ width: `${p.value}%` }} className="block h-full rounded-full bg-gradient-to-r from-[#82759F] to-[#B1A9C4]" />
                  </div>
                </div>
                <span className="text-right text-[11px] font-medium text-[#F4F0FF]/70">{p.value}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {chartNote && (
        <p className="mt-3 text-xs leading-5 text-[#F4F0FF]/45">{chartNote}</p>
      )}
    </section>
  )
}
