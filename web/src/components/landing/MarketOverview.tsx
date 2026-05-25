import { MarketTemperatureCard } from './MarketTemperatureCard'
import { MarketRadarCard } from './MarketRadarCard'
import { MarketInsightCard } from './MarketInsightCard'
import { TopAssetsCirclePacking } from './TopAssetsCirclePacking'

export default function MarketOverview() {
  return (
    <section id="visao-geral" className="flex w-full flex-col items-start justify-center gap-16">
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-4xl font-bold tracking-tight text-[#F4F0FF] opacity-80">
          Visão Geral de Mercado
        </h2>
        <p className="max-w-lg font-sans text-sm leading-relaxed text-[#F4F0FF]/40">
          Acompanhe os principais indicadores de saúde do mercado, sentimento dos investidores e a
          movimentação dos ativos em tempo real.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-8">
          <div className="grid flex-1 grid-cols-1 gap-8 sm:grid-cols-2">
            <MarketTemperatureCard />
            <MarketRadarCard />
          </div>

          <div className="flex-1">
            <MarketInsightCard marketTemperature={92} />
          </div>
        </div>

        <div className="flex h-full min-h-[500px] w-full flex-col lg:min-h-[600px]">
          <TopAssetsCirclePacking />
        </div>
      </div>
    </section>
  )
}
export { MarketOverview }
