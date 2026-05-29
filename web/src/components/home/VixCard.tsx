import { GlassHighlight } from '@/components/atoms/GlassHighlight'

interface VixCardProps {
  value: number | null
}

function getVixLabel(value: number | null) {
  if (value === null) return 'Sem leitura'
  if (value >= 25) return 'Stress'
  if (value >= 20) return 'Atencao'
  if (value >= 15) return 'Equilibrio'
  return 'Calmo'
}

export function VixCardSkeleton() {
  return (
    <div className="bull-panel flex h-full min-h-[9.5rem] flex-col gap-4 p-5" aria-hidden="true">
      <GlassHighlight widthPercent={58} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="bull-eyebrow">Volatilidade</p>
          <p className="mt-2 font-serif text-2xl text-[#F4F0FF]">VIX</p>
        </div>
        <div
          className="h-6 w-20 animate-pulse rounded-full bg-white/[0.06]"
          style={{ animationDelay: '60ms' }}
        />
      </div>
      <div
        className="mt-auto h-10 w-20 animate-pulse rounded-lg bg-white/[0.08]"
        style={{ animationDelay: '120ms' }}
      />
    </div>
  )
}

export default function VixCard({ value }: VixCardProps) {
  const label = getVixLabel(value)

  return (
    <div className="bull-panel flex h-full min-h-[9.5rem] flex-col gap-4 p-5">
      <GlassHighlight widthPercent={58} />

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="bull-eyebrow">Volatilidade</p>
          <p className="mt-2 font-serif text-2xl text-[#F4F0FF]">VIX</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-[#DBEAFE]/55">
          {label}
        </span>
      </div>

      {value === null ? (
        <p className="text-sm text-[#F4F0FF]/40">Dados indisponiveis</p>
      ) : (
        <>
          <p className="mt-auto font-serif text-4xl leading-none text-[#F4F0FF]">
            {value.toFixed(1)}
          </p>
        </>
      )}
    </div>
  )
}
