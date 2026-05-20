import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import { MarketTemperatureDial } from '@/components/atoms/MarketTemperatureDial'
import type { ComputedTemperature } from '@/lib/market-utils'

interface TemperatureCardProps {
  temperature: ComputedTemperature | null
}

export default function TemperatureCard({ temperature }: TemperatureCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A1625]/40 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute -top-10 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[#8B5CF6]/15 blur-[80px]" />
      <GlassHighlight widthPercent={75} />

      <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-[#F4F0FF]/55">
        Temperatura do Mercado
      </p>

      {temperature === null ? (
        <p className="text-center text-sm text-[#F4F0FF]/40">Dados indisponíveis</p>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <MarketTemperatureDial value={temperature.value} stateName={temperature.label} />
          <p className="font-serif text-lg text-[#F4F0FF]">{temperature.label}</p>
        </div>
      )}
    </div>
  )
}
