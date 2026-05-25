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
    <section id="visao-geral" className="flex w-full flex-col items-start justify-center gap-16">
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-4xl font-bold tracking-tight text-[#F4F0FF] opacity-80">
          Visão Geral com Dados PRO
        </h2>
        <p className="max-w-lg font-sans text-sm leading-relaxed text-[#F4F0FF]/40">
          Acompanhe preço, liquidez, amplitude e contexto macro vindos do pipeline Brapi PRO da Bull.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-8">
          <div className="grid flex-1 grid-cols-1 gap-8 sm:grid-cols-2">
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
