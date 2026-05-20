import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getMarketStatus, getMarketIndicators, getMultipleQuotes } from '@/lib/services/market'
import {
  CURATED_TICKERS,
  computeTemperature,
  formatSELIC,
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

  const [statusResult, indicatorsResult, quotesResult] = await Promise.allSettled([
    getMarketStatus(),
    getMarketIndicators(),
    getMultipleQuotes(CURATED_TICKERS),
  ])

  const status = statusResult.status === 'fulfilled' ? statusResult.value : null
  const ibov = status?.indices.find((i) => i.symbol === '^BVSP') ?? null
  const sp500 = status?.indices.find((i) => i.symbol === '^GSPC') ?? null
  const vix = status?.indices.find((i) => i.symbol === '^VIX')?.regularMarketPrice ?? null

  const temperature = ibov ? computeTemperature(ibov.regularMarketChangePercent, vix) : null

  const indicators = indicatorsResult.status === 'fulfilled' ? indicatorsResult.value : null
  const selicData = formatSELIC(indicators?.selic ?? [])

  const quotes =
    quotesResult.status === 'fulfilled' ? (quotesResult.value.results ?? []) : []
  const gainers = [...quotes]
    .sort((a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent)
    .slice(0, 3)
    .map((q) => ({
      ticker: q.symbol,
      name: q.shortName,
      price: q.regularMarketPrice,
      changePercent: q.regularMarketChangePercent,
      logoUrl: q.logourl || undefined,
    }))
  const losers = [...quotes]
    .sort((a, b) => a.regularMarketChangePercent - b.regularMarketChangePercent)
    .slice(0, 3)
    .map((q) => ({
      ticker: q.symbol,
      name: q.shortName,
      price: q.regularMarketPrice,
      changePercent: q.regularMarketChangePercent,
      logoUrl: q.logourl || undefined,
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
          price={ibov?.regularMarketPrice ?? null}
          changePercent={ibov?.regularMarketChangePercent ?? null}
          isOpen={marketOpen}
        />
        <IndexCard
          name="S&P 500"
          price={sp500?.regularMarketPrice ?? null}
          changePercent={sp500?.regularMarketChangePercent ?? null}
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
