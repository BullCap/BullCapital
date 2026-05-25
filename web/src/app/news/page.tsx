import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getWatchlist } from '@/lib/actions/watchlist'
import { getNewsRadarItems } from '@/lib/news-radar'
import AppShell from '@/components/navigation/AppShell'
import NewsRadarFeed from '@/components/news/NewsRadarFeed'
import ScrollFocus from '@/components/ui/ScrollFocus'
import WatchlistRadarSection from '@/components/home/WatchlistRadarSection'
import { getMarketListings } from '@/lib/services/market'
import { buildAssetHref } from '@/lib/market-routing'
import type { RadarPulseItem } from '@/components/home/RadarPulseSection'

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
      description: `${gainers[0].ticker} sobe ${formatPercent(gainers[0].changePercent)} e pode ajudar a testar se o fluxo comprador tem continuidade.`,
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
    description: 'Abra a análise do mercado para juntar juros, humor local e os nomes que puxam a narração do pregão.',
    href: '/analysis',
    tone: 'neutral',
  })

  return items.slice(0, 4)
}

export default async function NewsPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/sign-in')

  const watchlist = await getWatchlist()
  
  const [items, gainersRes, losersRes] = await Promise.all([
    getNewsRadarItems(watchlist),
    getMarketListings({ sortBy: 'change', sortOrder: 'desc', limit: 3, type: 'stock' }),
    getMarketListings({ sortBy: 'change', sortOrder: 'asc', limit: 3, type: 'stock' }),
  ])

  const followedStories = items.filter((item) => item.scopes.includes('watchlist')).length

  const gainersRaw = gainersRes?.stocks ?? []
  const losersRaw = losersRes?.stocks ?? []
  
  const gainers = gainersRaw.map((s) => ({
    ticker: s.stock,
    changePercent: s.change,
  }))
  const losers = losersRaw.map((s) => ({
    ticker: s.stock,
    changePercent: s.change,
  }))
  
  const radarItems = buildRadarItems(gainers, losers)

  return (
    <AppShell active="news">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem] 2xl:grid-cols-[1fr_24rem] items-start w-full">
        {/* Coluna Esquerda: Feed Principal de Notícias */}
        <div className="flex flex-col gap-5 min-w-0">
          <header className="px-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="bull-eyebrow">Radar Editorial</p>
                <h1 className="mt-2 font-serif text-3xl tracking-tight text-[#F4F0FF]">Notícias</h1>
                <p className="mt-1 max-w-xl text-sm leading-6 text-[#DBEAFE]/55">
                  Manchetes confirmadas para cruzar fonte, ativo e contexto de mercado.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="bull-chip">{items.length} histórias</span>
              <span className="bull-chip">{followedStories} da sua lista</span>
            </div>
          </header>

          <ScrollFocus>
            <NewsRadarFeed hasWatchlist={watchlist.length > 0} items={items} />
          </ScrollFocus>
        </div>

        {/* Coluna Direita (Sticky): Meu Radar / Portfólio do Usuário */}
        <div className="hidden xl:grid xl:content-start xl:gap-5 xl:sticky xl:top-24 w-full">
          <WatchlistRadarSection fallbackItems={radarItems} />
        </div>
      </div>
    </AppShell>
  )
}
