import { redirect } from 'next/navigation'
import { Suspense, cache } from 'react'
import { auth } from '@/lib/auth'
import { getWatchlist } from '@/lib/actions/watchlist'
import { getNewsRadarItems } from '@/lib/news-radar'
import AppShell from '@/components/navigation/AppShell'
import NewsRadarFeed from '@/components/news/NewsRadarFeed'
import ScrollFocus from '@/components/ui/ScrollFocus'
import WatchlistRadarSection from '@/components/home/WatchlistRadarSection'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import { getMarketListings, getMultipleQuotes } from '@/lib/services/market'
import { buildAssetHref } from '@/lib/market-routing'
import type { RadarPulseItem } from '@/components/home/RadarPulseSection'
import type { NewsRadarItem } from '@/lib/news-radar'
import type { AssetQuote } from '@/types/market'

interface NewsPageData {
  watchlist: string[]
  items: NewsRadarItem[]
  followedStories: number
  radarItems: RadarPulseItem[]
  watchlistQuotes: AssetQuote[]
}

function formatPercent(value: number | null) {
  if (value === null) return 'n/d'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

function buildRadarItems(
  gainers: Array<{ ticker: string; changePercent: number }>,
  losers: Array<{ ticker: string; changePercent: number }>
): RadarPulseItem[] {
  const items: RadarPulseItem[] = []

  if (gainers[0]) {
    items.push({
      ticker: gainers[0].ticker,
      label: 'Força entre as maiores altas',
      description: `${gainers[0].ticker} sobe ${formatPercent(gainers[0].changePercent)} e ajuda a testar se o fluxo do pregão tem continuidade.`,
      href: buildAssetHref(gainers[0].ticker),
      tone: 'up',
    })
  }

  if (losers[0]) {
    items.push({
      ticker: losers[0].ticker,
      label: 'Pressão entre as maiores baixas',
      description: `${losers[0].ticker} cai ${formatPercent(losers[0].changePercent)} e merece leitura de risco para ver se o movimento é isolado ou setorial.`,
      href: buildAssetHref(losers[0].ticker),
      tone: 'down',
    })
  }

  items.push({
    ticker: 'B3',
    label: 'Leitura completa do mercado',
    description: 'Abra a análise do mercado para juntar juros, humor local e os nomes que puxam a narrativa do pregão.',
    href: '/analysis',
    tone: 'neutral',
  })

  return items.slice(0, 4)
}

const getNewsPageData = cache(async (): Promise<NewsPageData> => {
  const watchlist = await getWatchlist()

  const [itemsResult, gainersResult, losersResult, quotesResult] = await Promise.allSettled([
    getNewsRadarItems(watchlist),
    getMarketListings({ sortBy: 'change', sortOrder: 'desc', limit: 3, type: 'stock' }),
    getMarketListings({ sortBy: 'change', sortOrder: 'asc', limit: 3, type: 'stock' }),
    // Fetch watchlist quotes in parallel — sidebar used to do this sequentially after all above resolved
    watchlist.length > 0 ? getMultipleQuotes(watchlist.slice(0, 8)) : Promise.resolve({ results: [] as AssetQuote[] }),
  ])

  const items = itemsResult.status === 'fulfilled' ? itemsResult.value : []
  const gainersRaw = gainersResult.status === 'fulfilled' ? (gainersResult.value?.stocks ?? []) : []
  const losersRaw = losersResult.status === 'fulfilled' ? (losersResult.value?.stocks ?? []) : []
  const gainers = gainersRaw.map((s) => ({
    ticker: s.stock,
    changePercent: s.change,
  }))
  const losers = losersRaw.map((s) => ({
    ticker: s.stock,
    changePercent: s.change,
  }))

  return {
    watchlist,
    items,
    followedStories: items.filter((item) => item.scopes.includes('watchlist')).length,
    radarItems: buildRadarItems(gainers, losers),
    watchlistQuotes: quotesResult.status === 'fulfilled' ? quotesResult.value.results : [],
  }
})

async function NewsFeedPanel() {
  const { watchlist, items, followedStories } = await getNewsPageData()

  return (
    <>
      <div className="flex flex-wrap gap-2 px-1">
        <span className="bull-chip">{items.length} histórias</span>
        <span className="bull-chip">{followedStories} da sua lista</span>
      </div>

      <NewsRadarFeed hasWatchlist={watchlist.length > 0} items={items} />
    </>
  )
}

async function NewsSidebarPanel() {
  const { radarItems, watchlist, watchlistQuotes } = await getNewsPageData()
  return <WatchlistRadarSection fallbackItems={radarItems} watchlist={watchlist} initialQuotes={watchlistQuotes} />
}

function NewsSidebarFallback() {
  return (
    <section className="bull-panel h-full p-5 md:p-6">
      <GlassHighlight widthPercent={58} />
      <p className="bull-eyebrow">Radar do dia</p>
      <h2 className="mt-2 font-serif text-xl text-[#F4F0FF]">Nomes para acompanhar</h2>
      <div className="mt-5 rounded-[1.5rem] border border-white/[0.06] bg-black/15 px-5 py-8 text-center">
        <p className="text-sm text-[#F4F0FF]/42">Radar em atualização.</p>
      </div>
    </section>
  )
}

export default async function NewsPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/sign-in')

  return (
    <AppShell active="news" sessionUser={session.user}>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem] 2xl:grid-cols-[1fr_24rem] items-start w-full">
        {/* Coluna Esquerda: Feed Principal de Notícias */}
        <div className="flex flex-col gap-5 min-w-0">
          <header className="px-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="bull-eyebrow">Radar editorial com Brapi PRO</p>
                <h1 className="mt-2 font-serif text-3xl tracking-tight text-[#F4F0FF]">Notícias</h1>
                <p className="mt-1 max-w-xl text-sm leading-6 text-[#DBEAFE]/55">
                  Manchetes confirmadas para cruzar fonte, ativo, preço, fundamentos e macro.
                </p>
              </div>
            </div>
          </header>

          <ScrollFocus>
            <Suspense
              fallback={
                <>
                  <div className="flex flex-wrap gap-2 px-1">
                    <span className="bull-chip">Radar em atualização</span>
                  </div>
                  <NewsRadarFeed hasWatchlist={false} items={[]} />
                </>
              }
            >
              <NewsFeedPanel />
            </Suspense>
          </ScrollFocus>
        </div>

        {/* Coluna Direita (Sticky): Meu Radar / Portfólio do Usuário */}
        <div className="hidden xl:grid xl:content-start xl:gap-5 xl:sticky xl:top-24 w-full">
          <Suspense fallback={<NewsSidebarFallback />}>
            <NewsSidebarPanel />
          </Suspense>
        </div>
      </div>
    </AppShell>
  )
}
