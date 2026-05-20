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
import ChatCTA from '@/components/home/ChatCTA'

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
      getMarketListings({ sortBy: 'change', sortOrder: 'desc', limit: 3, type: 'stock' }),
      getMarketListings({ sortBy: 'change', sortOrder: 'asc', limit: 3, type: 'stock' }),
    ])

  const ibov = ibovResult.status === 'fulfilled' ? ibovResult.value : null
  const sp500 = sp500Result.status === 'fulfilled' ? sp500Result.value : null
  const vix = vixResult.status === 'fulfilled' ? vixResult.value?.price ?? null : null

  const temperature = ibov ? computeTemperature(ibov.changePercent, vix) : null

  const selicData = selicResult.status === 'fulfilled' ? selicResult.value : null

  const gainersRaw =
    gainersResult.status === 'fulfilled' ? (gainersResult.value?.stocks ?? []) : []
  const losersRaw =
    losersResult.status === 'fulfilled' ? (losersResult.value?.stocks ?? []) : []

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

  const marketOpen = isMarketOpen()

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="font-serif text-3xl text-[#F4F0FF]">Visão Geral</h1>
        <p className="mt-1 text-sm text-[#F4F0FF]/50">Mercado brasileiro hoje</p>
      </div>

      <TemperatureCard temperature={temperature} />

      <div className="grid grid-cols-2 gap-4">
        <IndexCard
          name="IBOVESPA"
          price={ibov?.price ?? null}
          changePercent={ibov?.changePercent ?? null}
          isOpen={marketOpen}
        />
        <IndexCard
          name="S&P 500"
          price={sp500?.price ?? null}
          changePercent={sp500?.changePercent ?? null}
          isOpen={marketOpen}
        />
      </div>

      <SELICCard selic={selicData} />

      <MoversSection title="Maiores altas" icon="gainers" movers={gainers} />
      <MoversSection title="Maiores baixas" icon="losers" movers={losers} />

      <ChatCTA />
    </main>
  )
}
