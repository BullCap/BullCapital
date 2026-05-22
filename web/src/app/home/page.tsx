import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getMarketListings } from '@/lib/services/market'
import {
  computeTemperature,
  fetchSELIC,
  fetchIndexFromBrapi,
  isMarketOpen,
} from '@/lib/market-utils'
import TemperatureCard from '@/components/home/TemperatureCard'
import IndexCard from '@/components/home/IndexCard'
import SELICCard from '@/components/home/SELICCard'
import MoversSection from '@/components/home/MoversSection'
import AnalysisCTA from '@/components/home/AnalysisCTA'
import MarketBubbleMap from '@/components/home/MarketBubbleMap'
import AppDock from '@/components/navigation/AppDock'
import ScrollFocus from '@/components/ui/ScrollFocus'

export default async function HomePage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/sign-in')

  // All 5 fetches in parallel — each is free-tier compatible (1 ticker per Brapi call)
  const [ibovResult, sp500Result, vixResult, selicResult, gainersResult, losersResult] =
    await Promise.allSettled([
      fetchIndexFromBrapi('^BVSP'),
      fetchIndexFromBrapi('^GSPC'),
      fetchIndexFromBrapi('^VIX'),
      fetchSELIC(),
      getMarketListings({ sortBy: 'change', sortOrder: 'desc', limit: 6, type: 'stock' }),
      getMarketListings({ sortBy: 'change', sortOrder: 'asc', limit: 6, type: 'stock' }),
    ])

  const ibov = ibovResult.status === 'fulfilled' ? ibovResult.value : null
  const sp500 = sp500Result.status === 'fulfilled' ? sp500Result.value : null
  const vix = vixResult.status === 'fulfilled' ? (vixResult.value?.price ?? null) : null

  const temperature = ibov ? computeTemperature(ibov.changePercent, vix) : null

  const selicData = selicResult.status === 'fulfilled' ? selicResult.value : null

  const gainersRaw = gainersResult.status === 'fulfilled' ? (gainersResult.value?.stocks ?? []) : []
  const losersRaw = losersResult.status === 'fulfilled' ? (losersResult.value?.stocks ?? []) : []

  const gainers = gainersRaw.map((s) => ({
    ticker: s.stock,
    name: s.name,
    price: s.close,
    changePercent: s.change,
  }))
  const losers = losersRaw.map((s) => ({
    ticker: s.stock,
    name: s.name,
    price: s.close,
    changePercent: s.change,
  }))
  const bubbleAssets = Array.from(
    new Map([...gainersRaw, ...losersRaw].map((asset) => [asset.stock, asset])).values()
  )

  const marketOpen = isMarketOpen()

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col gap-5 px-4 pb-44 pt-6">
      <header className="flex items-end justify-between gap-4 px-1">
        <div>
          <p className="bull-eyebrow">BullCapital</p>
          <h1 className="mt-2 font-serif text-3xl text-[#F4F0FF]">Mercado hoje</h1>
          <p className="mt-1 text-sm text-[#DBEAFE]/55">Sinais do pregão brasileiro</p>
        </div>
        <span className="bull-chip shrink-0">B3</span>
      </header>

      <ScrollFocus>
        <TemperatureCard temperature={temperature} />
      </ScrollFocus>

      <div className="grid grid-cols-2 gap-4">
        <ScrollFocus>
          <IndexCard
            name="IBOVESPA"
            price={ibov?.price ?? null}
            changePercent={ibov?.changePercent ?? null}
            isOpen={marketOpen}
          />
        </ScrollFocus>
        <ScrollFocus>
          <IndexCard
            name="S&P 500"
            price={sp500?.price ?? null}
            changePercent={sp500?.changePercent ?? null}
            isOpen={marketOpen}
          />
        </ScrollFocus>
      </div>

      <ScrollFocus>
        <MarketBubbleMap assets={bubbleAssets} />
      </ScrollFocus>

      <ScrollFocus>
        <SELICCard selic={selicData} />
      </ScrollFocus>

      <ScrollFocus>
        <MoversSection title="Maiores altas" icon="gainers" movers={gainers} />
      </ScrollFocus>
      <ScrollFocus>
        <MoversSection title="Maiores baixas" icon="losers" movers={losers} />
      </ScrollFocus>

      <ScrollFocus>
        <AnalysisCTA />
      </ScrollFocus>
      <AppDock active="market" />
    </main>
  )
}
