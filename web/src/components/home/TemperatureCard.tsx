import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import { MarketTemperatureDial } from '@/components/atoms/MarketTemperatureDial'
import type { ComputedTemperature } from '@/lib/market-utils'

interface TemperatureCardProps {
  temperature: ComputedTemperature | null
}

export default function TemperatureCard({ temperature }: TemperatureCardProps) {
  return (
    <section className="bull-digest-panel p-6">
      <GlassHighlight widthPercent={75} />

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="bull-eyebrow">Daily Digest</p>
          <h2 className="mt-2 font-serif text-xl text-[#F4F0FF]">Temperatura do mercado</h2>
        </div>
        <Link
          href="/analysis"
          className="inline-flex min-h-9 items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-3 text-xs text-[#F4F0FF]/75 transition hover:bg-white/[0.1] hover:text-[#F4F0FF]"
        >
          Ler contexto
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {temperature === null ? (
        <p className="py-10 text-center text-sm text-[#F4F0FF]/40">Dados indisponíveis</p>
      ) : (
        <div className="mt-5 grid gap-4">
          <div className="bull-recap-surface py-5">
            <MarketTemperatureDial value={temperature.value} stateName={temperature.label} />
          </div>
          <div className="bull-panel-quiet px-4 py-3">
            <p className="text-xs text-[#DBEAFE]/50">Leitura atual</p>
            <p className="mt-1 text-sm leading-6 text-[#F4F0FF]/75">
              O pulso do mercado está em {temperature.label.toLowerCase()}. Use os ativos em
              destaque para ver onde o movimento ficou mais forte.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
