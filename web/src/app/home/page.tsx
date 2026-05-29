import { redirect } from 'next/navigation'
import { Suspense, cache } from 'react'
import { auth } from '@/lib/auth'
import { getHomeHighlightsSnapshot, getMarketPulseSnapshot } from '@/lib/services/market'
import { isMarketOpen } from '@/lib/market-utils'
import IndexCard, { IndexCardSkeleton } from '@/components/home/IndexCard'
import SELICCard, { SELICCardSkeleton } from '@/components/home/SELICCard'
import VixCard, { VixCardSkeleton } from '@/components/home/VixCard'
import { DailyBriefContent, DailyBriefSkeleton } from '@/components/home/DailyBriefContent'
import type { BriefPulseData } from '@/components/home/DailyBriefHero'
import MarketMapSection from '@/components/home/MarketMapSection'
import MarketHighlightsSection from '@/components/home/MarketHighlightsSection'
import { StoryDigestLoader, StoryDigestSkeleton } from '@/components/home/StoryDigestLoader'
import AppShell from '@/components/navigation/AppShell'
import ScrollFocus from '@/components/ui/ScrollFocus'
import type {
  AssetQuote,
  CurrencyRate,
  HomeHighlightsSnapshot,
  MarketListingItem,
  PrimeRateEntry,
} from '@/types/market'

function normalizeQuoteSymbol(symbol: string) {
  return symbol.toUpperCase().replace(/\.SA$/, '').replace(/[^A-Z0-9]/g, '')
}

interface MarketQuoteSummary {
  price: number
  changePercent: number
  name: string | null
}

interface CoreMarketPulse {
  ibov: MarketQuoteSummary | null
  sp500: MarketQuoteSummary | null
  vix: number | null
  selicData: { rate: string; date: string } | null
  ipcaData: { rate: string; date: string } | null
  ibovCloses: number[]
  sp500Closes: number[]
  usdBrl: CurrencyRate | null
  usdBrlChange: number | null
  selicValue: string | null
  marketOpen: boolean
  contextLine: string
  briefPulse: BriefPulseData
}

interface MarketHighlightsData {
  gainers: MarketListingItem[]
  losers: MarketListingItem[]
  mostTraded: MarketListingItem[]
  crypto: MarketListingItem[]
  fixedIncome: MarketListingItem[]
}

function emptyMarketHighlightsData(): MarketHighlightsData {
  return {
    gainers: [],
    losers: [],
    mostTraded: [],
    crypto: [],
    fixedIncome: [],
  }
}

function quoteSummary(quotes: AssetQuote[], symbol: string): MarketQuoteSummary | null {
  const quote = quotes.find((item) => item.symbol === symbol)
  if (!quote) return null

  return {
    price: Number(quote.regularMarketPrice ?? 0),
    changePercent: Number(quote.regularMarketChangePercent ?? 0),
    name: quote.longName ?? quote.shortName ?? null,
  }
}

function formatMacroEntry(entry: PrimeRateEntry | undefined): { rate: string; date: string } | null {
  if (!entry) return null
  const numValue = typeof entry.value === 'number' ? entry.value : parseFloat(String(entry.value))
  if (Number.isNaN(numValue)) return null

  return {
    rate: `${numValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}% a.a.`,
    date: entry.date,
  }
}

const getCoreMarketPulse = cache(async (): Promise<CoreMarketPulse> => {
  const marketOpen = isMarketOpen()
  const snapshot = await getMarketPulseSnapshot()
  const quotes = snapshot.quotes.results ?? []
  const ibov = quoteSummary(quotes, '^BVSP')
  const sp500 = quoteSummary(quotes, '^GSPC')
  const vixQuote = quoteSummary(quotes, '^VIX')
  const vix = vixQuote?.price ?? null
  const selicData = formatMacroEntry(snapshot.indicators.selic?.[0])
  const ipcaData = formatMacroEntry(snapshot.indicators.inflation?.[0])
  const usdBrl = snapshot.currency.currencies?.find((c) => c.name === 'USD/BRL') ?? null
  const usdBrlChange = usdBrl
    ? usdBrl.lowPrice > 0
      ? +((usdBrl.bidPrice - usdBrl.lowPrice) / usdBrl.lowPrice * 100).toFixed(2)
      : null
    : null

  const ibovHistory = snapshot.history.results?.find((r) => r.symbol === '^BVSP')?.history ?? []
  const sp500History = snapshot.history.results?.find((r) => r.symbol === '^GSPC')?.history ?? []
  const ibovCloses = ibovHistory.map((h) => h.close).filter(Number.isFinite)
  const sp500Closes = sp500History.map((h) => h.close).filter(Number.isFinite)
  const selicValue = selicData?.rate ?? null
  const contextLine = marketOpen ? 'pregão em andamento' : 'mercado fora do horário regular'

  return {
    ibov,
    sp500,
    vix,
    selicData,
    ipcaData,
    ibovCloses,
    sp500Closes,
    usdBrl,
    usdBrlChange,
    selicValue,
    marketOpen,
    contextLine,
    briefPulse: {
      ibovPrice: ibov?.price ?? null,
      ibovChange: ibov?.changePercent ?? null,
      ibovHistory: ibovCloses,
      sp500Change: sp500?.changePercent ?? null,
      vix,
      selicValue,
      usdBrlPrice: usdBrl?.bidPrice ?? null,
      usdBrlChange,
      marketOpen,
    },
  }
})

const getHomeMarketSnapshot = cache(async (): Promise<HomeHighlightsSnapshot> => getHomeHighlightsSnapshot())

const getMarketHighlightsData = cache(async (): Promise<MarketHighlightsData> => {
  const snapshot = await getHomeMarketSnapshot()

  return {
    gainers: snapshot.gainers?.stocks ?? [],
    losers: snapshot.losers?.stocks ?? [],
    mostTraded: snapshot.mostTraded?.stocks ?? [],
    crypto: snapshot.crypto?.stocks ?? [],
    fixedIncome: snapshot.fixedIncome?.stocks ?? [],
  }
})

const getMarketMapAssets = cache(async (): Promise<MarketListingItem[]> => {
  const [highlights, snapshot] = await Promise.all([getMarketHighlightsData(), getHomeMarketSnapshot()])
  const bubbleAssets = Array.from(
    new Map([...highlights.gainers, ...highlights.losers].map((asset) => [asset.stock, asset])).values()
  )
  const treemapQuotes = snapshot.treemapQuotes?.results ?? []
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

  return Array.from(
    new Map([...bubbleAssets, ...treemapAssets].map((asset) => [asset.stock, asset])).values()
  )
})

async function MarketNowSection() {
  const { ibov, sp500, vix, selicData, ipcaData, ibovCloses, sp500Closes, marketOpen } =
    await getCoreMarketPulse()

  return (
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
  )
}

function MarketNowFallback() {
  const marketOpen = isMarketOpen()

  return (
    <section className="space-y-4">
      <div className="px-1">
        <p className="bull-eyebrow">Mercado</p>
        <h2 className="mt-1 font-serif text-2xl tracking-tight text-[#F4F0FF]/80">Agora</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <ScrollFocus><IndexCardSkeleton name="IBOVESPA" isOpen={marketOpen} /></ScrollFocus>
        <ScrollFocus><IndexCardSkeleton name="S&P 500" isOpen={marketOpen} /></ScrollFocus>
        <ScrollFocus><SELICCardSkeleton /></ScrollFocus>
        <ScrollFocus><VixCardSkeleton /></ScrollFocus>
      </div>
    </section>
  )
}

async function DailyBriefPanel({ dateLabel }: { dateLabel: string }) {
  const { ibov, sp500, vix, selicValue, marketOpen, contextLine, briefPulse } = await getCoreMarketPulse()

  return (
    <DailyBriefContent
      ibovChange={ibov?.changePercent ?? null}
      sp500Change={sp500?.changePercent ?? null}
      vix={vix}
      selicValue={selicValue}
      marketOpen={marketOpen}
      storyHeadlines={[]}
      contextLine={contextLine}
      dateLabel={dateLabel}
      storiesCount={0}
      pulse={briefPulse}
    />
  )
}


async function MarketHighlightsPanel() {
  const highlights = await getMarketHighlightsData()

  return (
    <MarketHighlightsSection
      stockGainers={highlights.gainers}
      stockLosers={highlights.losers}
      stockMostTraded={highlights.mostTraded}
      cryptoHighlights={highlights.crypto}
      fixedIncomeHighlights={highlights.fixedIncome}
    />
  )
}

function MarketHighlightsFallback() {
  const highlights = emptyMarketHighlightsData()

  return (
    <MarketHighlightsSection
      stockGainers={highlights.gainers}
      stockLosers={highlights.losers}
      stockMostTraded={highlights.mostTraded}
      cryptoHighlights={highlights.crypto}
      fixedIncomeHighlights={highlights.fixedIncome}
    />
  )
}

async function MarketMapPanel() {
  const assets = await getMarketMapAssets()
  return <MarketMapSection assets={assets} />
}

export default async function HomePage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/sign-in')

  const marketOpen = isMarketOpen()
  const dateLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
  }).format(new Date())
  const contextLine = marketOpen ? 'pregão em andamento' : 'mercado fora do horário regular'

  const brt = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const hour = brt.getHours()
  const firstName = session.user.name?.trim().split(/\s+/)[0] ?? session.user.email?.split('@')[0] ?? 'você'
  const greetingStart = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

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
          <p className="mt-1 text-sm text-[#DBEAFE]/50">{contextLine}</p>
        </div>
      </header>

      <div className="space-y-6">
        <Suspense fallback={<MarketNowFallback />}>
          <MarketNowSection />
        </Suspense>

        <Suspense fallback={<DailyBriefSkeleton dateLabel={dateLabel} storiesCount={0} />}>
          <DailyBriefPanel dateLabel={dateLabel} />
        </Suspense>

        <ScrollFocus>
          <Suspense fallback={<MarketHighlightsFallback />}>
            <MarketHighlightsPanel />
          </Suspense>
        </ScrollFocus>

        <div className="grid gap-6 2xl:grid-cols-[0.9fr_1.1fr] 2xl:items-stretch">
          <ScrollFocus>
            <Suspense fallback={<StoryDigestSkeleton />}>
              <StoryDigestLoader />
            </Suspense>
          </ScrollFocus>

          <ScrollFocus>
            <Suspense fallback={<MarketMapSection assets={[]} />}>
              <MarketMapPanel />
            </Suspense>
          </ScrollFocus>
        </div>
      </div>
    </AppShell>
  )
}
