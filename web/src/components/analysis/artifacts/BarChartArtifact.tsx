import { GlassHighlight } from '@/components/atoms/GlassHighlight'

interface Bar {
  label: string
  value: number
  color?: 'positive' | 'negative' | 'neutral'
}

interface BarChartArtifactProps {
  title?: string
  eyebrow?: string
  bars: Bar[]
  chartNote?: string
}

const COLOR_MAP = {
  positive: 'from-[#6D28D9] to-[#8B5CF6]',
  negative: 'from-[#9F1239] to-[#F43F5E]',
  neutral: 'from-[#1E3A5F] to-[#3B82F6]',
}

export function BarChartArtifact({ title, eyebrow, bars, chartNote }: BarChartArtifactProps) {
  if (!bars.length) return null
  const max = Math.max(...bars.map((b) => b.value), 1)

  return (
    <section className="bull-panel p-5">
      <GlassHighlight widthPercent={55} />
      {eyebrow && <p className="bull-eyebrow">{eyebrow}</p>}
      {title && <h3 className="mt-1.5 font-serif text-lg text-[#F4F0FF]">{title}</h3>}

      <div className="mt-4 flex flex-col gap-3">
        {bars.map((bar, i) => {
          const pct = Math.round((bar.value / max) * 100)
          const gradient = COLOR_MAP[bar.color ?? 'neutral']
          return (
            <div key={`${bar.label}-${i}`}>
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="text-[#F4F0FF]/60">{bar.label}</span>
                <span className="font-medium text-[#F4F0FF]/75">{bar.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {chartNote && (
        <p className="mt-3 text-xs leading-5 text-[#F4F0FF]/45">{chartNote}</p>
      )}
    </section>
  )
}
