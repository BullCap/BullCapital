import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getMarketListings, getAssetHistory, getCurrencyRates, getMultipleQuotes } from '@/lib/services/market'
import {
  fetchSELIC,
  fetchIPCA,
  fetchMarketQuote,
  isMarketOpen,
} from '@/lib/market-utils'
import IndexCard from '@/components/home/IndexCard'
import SELICCard from '@/components/home/SELICCard'
import VixCard from '@/components/home/VixCard'
import { DailyBriefContent, DailyBriefSkeleton } from '@/components/home/DailyBriefContent'
import MarketMapSection from '@/components/home/MarketMapSection'
import MarketHighlightsSection from '@/components/home/MarketHighlightsSection'
import { SECTOR_TREEMAP_TICKERS } from '@/components/home/SectorTreeMap'
import { StoryDigestLoader, StoryDigestSkeleton } from '@/components/home/StoryDigestLoader'
import type { NewsRadarItem } from '@/lib/news-radar'
import AppShell from '@/components/navigation/AppShell'
import ScrollFocus from '@/components/ui/ScrollFocus'
import { Suspense } from 'react'

function normalizeQuoteSymbol(symbol: string) {
  return symbol.toUpperCase().replace(/\.SA$/, '').replace(/[^A-Z0-9]/g, '')
}

export default async function HomePage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/sign-in')

  const [
    ibovResult,
    sp500Result,
    vixResult,
    selicResult,
    ipcaResult,
    gainersResult,
    losersResult,
    historyResult,
    fxResult,
    mostTradedResult,
    treemapResult,
    cryptoResult,
    fixedIncomeResult,
  ] =
    await Promise.allSettled([
      fetchMarketQuote('^BVSP'),
      fetchMarketQuote('^GSPC'),
      fetchMarketQuote('^VIX'),
      fetchSELIC(),
      fetchIPCA(),
      getMarketListings({ sortBy: 'change', sortOrder: 'desc', limit: 6, type: 'stock' }),
      getMarketListings({ sortBy: 'change', sortOrder: 'asc', limit: 6, type: 'stock' }),
      getAssetHistory(['^BVSP', '^GSPC'], '1mo'),
      getCurrencyRates(['USD-BRL']),
      getMarketListings({ sortBy: 'volume', sortOrder: 'desc', limit: 6, type: 'stock' }),
      getMultipleQuotes(SECTOR_TREEMAP_TICKERS),
      getMarketListings({ limit: 6, type: 'crypto' }),
      getMarketListings({ limit: 6, type: 'fixed_income' }),
    ])

  const ibov = ibovResult.status === 'fulfilled' ? ibovResult.value : null
  const sp500 = sp500Result.status === 'fulfilled' ? sp500Result.value : null
  const vix = vixResult.status === 'fulfilled' ? (vixResult.value?.price ?? null) : null
  const fxData = fxResult.status === 'fulfilled' ? fxResult.value : null
  const usdBrl = fxData?.currencies?.find((c) => c.name === 'USD/BRL') ?? null
  const usdBrlChange = usdBrl
    ? usdBrl.lowPrice > 0
      ? +((usdBrl.bidPrice - usdBrl.lowPrice) / usdBrl.lowPrice * 100).toFixed(2)
      : null
    : null

  const historyData = historyResult.status === 'fulfilled' ? historyResult.value : null
  const ibovHistory = historyData?.results?.find((r) => r.symbol === '^BVSP')?.history ?? []
  const sp500History = historyData?.results?.find((r) => r.symbol === '^GSPC')?.history ?? []
  const ibovCloses = ibovHistory.map((h) => h.close).filter(Number.isFinite)
  const sp500Closes = sp500History.map((h) => h.close).filter(Number.isFinite)

  const selicData = selicResult.status === 'fulfilled' ? selicResult.value : null
  const ipcaData = ipcaResult.status === 'fulfilled' ? ipcaResult.value : null

  const gainersRaw = gainersResult.status === 'fulfilled' ? (gainersResult.value?.stocks ?? []) : []
  const losersRaw = losersResult.status === 'fulfilled' ? (losersResult.value?.stocks ?? []) : []
  const mostTradedRaw = mostTradedResult.status === 'fulfilled' ? (mostTradedResult.value?.stocks ?? []) : []
  const cryptoRaw = cryptoResult.status === 'fulfilled' ? (cryptoResult.value?.stocks ?? []) : []
  const fixedIncomeRaw = fixedIncomeResult.status === 'fulfilled' ? (fixedIncomeResult.value?.stocks ?? []) : []

  const bubbleAssets = Array.from(
    new Map([...gainersRaw, ...losersRaw].map((asset) => [asset.stock, asset])).values()
  )

  const treemapQuotes = treemapResult.status === 'fulfilled' ? (treemapResult.value?.results ?? []) : []
  const treemapAssets = treemapQuotes.map((q) => ({
    stock: normalizeQuoteSymbol(q.symbol),
    name: q.shortName ?? q.longName ?? q.symbol,
    close: q.regularMarketPrice,
    change: q.regularMarketChangePercent,
    volume: q.regularMarketVolume ?? 0,
    marketCap: q.marketCap ?? null,
    logo: null,
    sector: q.sector ?? null,
    type: 'stock' as const,
  }))
  const mapAssets = Array.from(
    new Map([...bubbleAssets, ...treemapAssets].map((asset) => [asset.stock, asset])).values()
  )

  const topStories: NewsRadarItem[] = []

  const marketOpen = isMarketOpen()
  const selicValue = selicData?.rate ?? null
  const dateLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
  }).format(new Date())
  const contextLine = marketOpen ? 'pregão em andamento' : 'mercado fora do horário regular'

  const brt = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const hour = brt.getHours()
  const firstName = session.user.name?.trim().split(/\s+/)[0] ?? session.user.email?.split('@')[0] ?? 'você'
  const greetingStart = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const storyLine = topStories.length > 0
    ? `${topStories.length} históri${topStories.length === 1 ? 'a' : 'as'} no radar.`
    : contextLine

  const briefPulse = {
    ibovPrice: ibov?.price ?? null,
    ibovChange: ibov?.changePercent ?? null,
    ibovHistory: ibovCloses,
    sp500Change: sp500?.changePercent ?? null,
    vix,
    selicValue,
    usdBrlPrice: usdBrl?.bidPrice ?? null,
    usdBrlChange,
    marketOpen,
  }

  return (
    <AppShell
      active="market"
      contentClassName="md:max-w-none xl:max-w-[1560px] 2xl:max-w-[1720px]"
      sessionUser={session.user}
    >
      <header className="flex flex-col gap-4 px-1 pb-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="bull-eyebrow">{dateLabel}</p>
          <h1 className="mt-2 font-serif text-3xl tracking-tight text-[#F4F0FF] md:text-4xl">
            {greetingStart}, <span className="text-gradient-amethyst font-semibold">{firstName}</span>.
          </h1>
          <p className="mt-1 text-sm text-[#DBEAFE]/50">{storyLine}</p>
        </div>
      </header>

      <div className="space-y-6">
        <section className="space-y-4">
          <div className="px-1">
            <p className="bull-eyebrow">Mercado</p>
            <h2 className="mt-1 font-serif text-2xl tracking-tight text-[#F4F0FF]/80">Agora</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <ScrollFocus>
              <IndexCard
                name="IBOVESPA"
                price={ibov?.price ?? null}
                changePercent={ibov?.changePercent ?? null}
                isOpen={marketOpen}
                historyData={ibovCloses}
              />
            </ScrollFocus>
            <ScrollFocus>
              <IndexCard
                name="S&P 500"
                price={sp500?.price ?? null}
                changePercent={sp500?.changePercent ?? null}
                isOpen={marketOpen}
                historyData={sp500Closes}
              />
            </ScrollFocus>
            <ScrollFocus>
              <SELICCard selic={selicData} ipca={ipcaData} />
            </ScrollFocus>
            <ScrollFocus>
              <VixCard value={vix} />
            </ScrollFocus>
          </div>
        </section>

        <Suspense fallback={<DailyBriefSkeleton dateLabel={dateLabel} storiesCount={topStories.length} />}>
          <DailyBriefContent
            ibovChange={ibov?.changePercent ?? null}
            sp500Change={sp500?.changePercent ?? null}
            vix={vix}
            selicValue={selicValue}
            marketOpen={marketOpen}
            storyHeadlines={topStories.map((s) => s.headline)}
            contextLine={contextLine}
            dateLabel={dateLabel}
            storiesCount={topStories.length}
            pulse={briefPulse}
          />
        </Suspense>

        <ScrollFocus>
          <MarketHighlightsSection
            stockGainers={gainersRaw}
            stockLosers={losersRaw}
            stockMostTraded={mostTradedRaw}
            cryptoHighlights={cryptoRaw}
            fixedIncomeHighlights={fixedIncomeRaw}
          />
        </ScrollFocus>

        <div className="grid gap-6 2xl:grid-cols-[0.9fr_1.1fr] 2xl:items-stretch">
          <ScrollFocus>
            <Suspense fallback={<StoryDigestSkeleton />}>
              <StoryDigestLoader />
            </Suspense>
          </ScrollFocus>

          <ScrollFocus>
            <MarketMapSection assets={mapAssets} />
          </ScrollFocus>
        </div>
      </div>
    </AppShell>
  )
}
