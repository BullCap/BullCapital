import { MarketTemperatureCard } from './MarketTemperatureCard'
import { MarketRadarCard } from './MarketRadarCard'
import { MarketInsightCard } from './MarketInsightCard'
import { TopAssetsCirclePacking } from './TopAssetsCirclePacking'
import type { MarketListingItem } from '@/types/market'

interface MarketOverviewProps {
  temperature: { value: number; label: string } | null
  radarData: Array<{ subject: string; value: number; fullMark: number }>
  insightText: string
  assets: MarketListingItem[]
}

export default function MarketOverview({
  temperature,
  radarData,
  insightText,
  assets,
}: MarketOverviewProps) {
  return (
    <section id="visao-geral" className="flex w-full flex-col items-start justify-center gap-8">
      <div className="flex flex-col gap-2">
        <p className="bull-eyebrow">Visão geral</p>
        <h2 className="font-serif text-3xl font-medium tracking-tight text-starlight md:text-4xl">
          Temperatura, radar e leitura contextual.
        </h2>
        <p className="max-w-2xl font-sans text-sm leading-7 text-starlight/50">
          Acompanhe preço, liquidez, amplitude e contexto macro vindos do pipeline da Bull.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <div className="grid flex-1 grid-cols-1 gap-5 sm:grid-cols-2">
            <MarketTemperatureCard value={temperature?.value ?? null} label={temperature?.label ?? null} />
            <MarketRadarCard data={radarData} />
          </div>

          <div className="flex-1">
            <MarketInsightCard marketTemperature={temperature?.value ?? null} text={insightText} />
          </div>
        </div>

        <div className="flex h-full min-h-[500px] w-full flex-col lg:min-h-[600px]">
          <TopAssetsCirclePacking assets={assets} />
        </div>
      </div>
    </section>
  )
}
export { MarketOverview }
