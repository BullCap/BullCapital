import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import { VariationBadge } from '@/components/atoms/VariationBadge'

interface IndexCardProps {
  name: string
  price: number | null
  changePercent: number | null
  isOpen: boolean
}

const UP_SPARKLINE = [
  19, 21, 20, 23, 22, 27, 24, 29, 28, 32, 29, 35, 33, 37, 34, 40, 38, 43, 39, 46, 44,
]
const DOWN_SPARKLINE = [
  46, 43, 45, 40, 42, 36, 39, 33, 35, 30, 34, 27, 29, 24, 27, 20, 23, 17, 20, 14, 16,
]

function getSparklinePath(values: number[]) {
  const width = 120
  const height = 34
  const min = Math.min(...values)
  const max = Math.max(...values)
  const spread = Math.max(max - min, 1)
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width
    const y = height - ((value - min) / spread) * (height - 4) - 2

    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  return {
    area: `M0,${height} L${points.join(' L')} L${width},${height} Z`,
    line: `M${points.join(' L')}`,
  }
}

export default function IndexCard({ name, price, changePercent, isOpen }: IndexCardProps) {
  const modelSeries = (changePercent ?? 0) >= 0 ? UP_SPARKLINE : DOWN_SPARKLINE
  const isRelativePositive = modelSeries[modelSeries.length - 1] >= modelSeries[0]
  const sparkline = getSparklinePath(modelSeries)
  const tone = isRelativePositive ? '#4ADE80' : '#FB7185'

  return (
    <div className="bull-panel flex min-h-[9.5rem] flex-col gap-2 p-5">
      <GlassHighlight widthPercent={80} />

      <div className="flex items-center justify-between gap-2">
        <p className="bull-eyebrow">{name}</p>
        {!isOpen && (
          <span className="rounded-full border border-[#F43F5E]/30 bg-[#F43F5E]/10 px-2 py-0.5 text-[10px] text-[#F43F5E]">
            Fechado
          </span>
        )}
      </div>

      {price === null ? (
        <p className="text-sm text-[#F4F0FF]/40">Dados indisponíveis</p>
      ) : (
        <>
          <p className="mt-auto font-serif text-2xl font-semibold text-[#F4F0FF]">
            {price.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] uppercase text-[#DBEAFE]/35">Série modelo</p>
          <svg viewBox="0 0 120 34" aria-hidden="true" className="h-8 w-full overflow-visible">
            <path d={sparkline.area} fill={tone} fillOpacity="0.1" />
            <path
              d={sparkline.line}
              fill="none"
              stroke={tone}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
          <VariationBadge variation={changePercent ?? 0} />
        </>
      )}
    </div>
  )
}
