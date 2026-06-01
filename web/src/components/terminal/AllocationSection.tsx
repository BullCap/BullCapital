'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { AllocationItem } from './portfolioMock'

interface AllocationSectionProps {
  byClass: AllocationItem[]
  bySector: AllocationItem[]
  byRisk: AllocationItem[]
  byLiquidity: AllocationItem[]
}

function calmColor(color: string): string {
  const palette: Record<string, string> = {
    '#8B5CF6': '#82759F',
    '#A78BFA': '#B1A9C4',
    '#22D3EE': '#8fa6c6',
    '#F59E0B': '#d0b982',
    '#EC4899': '#c98c9a',
    '#22C55E': '#7fb59a',
    '#F43F5E': '#c98c9a',
    '#64748B': '#7f8796',
    '#94A3B8': '#9aa3b2',
  }

  return palette[color.toUpperCase()] ?? color
}

function AllocationTooltip({
  active,
  payload,
}: {
  active?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[]
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload as AllocationItem | undefined
  if (!item) return null
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0D0B14] px-3 py-2 text-[11px] shadow-lg">
      <p className="font-bold text-[#F4F0FF]">{item.label}</p>
      <p className="mt-0.5 font-mono text-[#F4F0FF]/55">{item.value.toLocaleString('pt-BR')}%</p>
    </div>
  )
}

function DonutCard({ title, data }: { title: string; data: AllocationItem[] }) {
  return (
    <article className="bull-card-calm p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-[#F4F0FF]">{title}</h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/25">
          Exposição
        </span>
      </div>

      {data.length > 0 ? (
        <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-3">
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} innerRadius={38} outerRadius={58} paddingAngle={2} dataKey="value" nameKey="label">
                  {data.map((item) => (
                    <Cell key={item.label} fill={calmColor(item.color)} stroke="rgba(13,11,20,0.9)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<AllocationTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="min-w-0 space-y-2">
            {data.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: calmColor(item.color) }} />
                  <span className="truncate text-xs text-[#F4F0FF]/58">{item.label}</span>
                </span>
                <span className="font-mono text-xs font-bold tabular-nums text-[#F4F0FF]">
                  {item.value.toLocaleString('pt-BR')}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center text-xs text-[#F4F0FF]/35">
          Sem dados de alocação.
        </div>
      )}
    </article>
  )
}

function StackedCard({ title, data }: { title: string; data: AllocationItem[] }) {
  return (
    <article className="bull-card-calm p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-[#F4F0FF]">{title}</h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/25">
          Composição
        </span>
      </div>
      {data.length > 0 ? (
        <>
          <div className="flex h-3 overflow-hidden rounded-full bg-white/[0.04]">
            {data.map((item) => (
              <div
                key={item.label}
                className="h-full"
                style={{ width: `${item.value}%`, backgroundColor: calmColor(item.color) }}
                title={`${item.label}: ${item.value}%`}
              />
            ))}
          </div>
          <div className="mt-4 space-y-2.5">
            {data.map((item) => (
              <div key={item.label} className="grid grid-cols-[minmax(0,1fr)_3rem] items-center gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: calmColor(item.color) }} />
                  <span className="truncate text-xs text-[#F4F0FF]/58">{item.label}</span>
                </span>
                <span className="text-right font-mono text-xs font-bold tabular-nums text-[#F4F0FF]">
                  {item.value.toLocaleString('pt-BR')}%
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex h-24 items-center justify-center text-xs text-[#F4F0FF]/35">
          Sem dados de composição.
        </div>
      )}
    </article>
  )
}

export default function AllocationSection({
  byClass,
  bySector,
  byRisk,
  byLiquidity,
}: AllocationSectionProps) {
  return (
    <section className="bull-frame p-4 md:p-5">
      <div className="mb-4">
        <p className="bull-eyebrow">Alocação</p>
        <h2 className="mt-0.5 font-serif text-lg text-[#F4F0FF]">Mapa de exposição</h2>
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        <DonutCard title="Por classe" data={byClass} />
        <DonutCard title="Por setor" data={bySector} />
        <StackedCard title="Por risco" data={byRisk} />
        <StackedCard title="Por liquidez" data={byLiquidity} />
      </div>
    </section>
  )
}
