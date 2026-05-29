import { redirect } from 'next/navigation'
import { Suspense, cache } from 'react'
import { auth } from '@/lib/auth'
import { getMarketRadarData, getAssetHistory, getAssetNews } from '@/lib/services/market'
import { fetchMarketQuote, isMarketOpen } from '@/lib/market-utils'
import { normalizeTicker } from '@/lib/market-routing'
import AssetHeader, { AssetHeaderSkeleton } from '@/components/asset/AssetHeader'
import FollowButton from '@/components/asset/FollowButton'
import PriceChartClient, { PriceChartSkeleton } from '@/components/asset/PriceChartClient'
import RadarSection, { RadarSectionSkeleton } from '@/components/asset/RadarSection'
import AssetAnalysisCTA from '@/components/asset/AssetAnalysisCTA'
import AssetNewsSection, { AssetNewsSectionSkeleton } from '@/components/asset/AssetNewsSection'
import AssetProfileCard from '@/components/asset/AssetProfileCard'
import AssetQuotesTable, { AssetQuotesTableSkeleton } from '@/components/asset/AssetQuotesTable'
import { isFollowing } from '@/lib/actions/watchlist'
import AppShell from '@/components/navigation/AppShell'
import ScrollFocus from '@/components/ui/ScrollFocus'

interface AssetPageProps {
  params: Promise<{ ticker: string }>
}

const getAssetQuote = cache(async (ticker: string) => fetchMarketQuote(ticker))

const getAssetHistoryData = cache(async (ticker: string) => {
  const historyData = await getAssetHistory([ticker], '1mo')
  return historyData?.results?.[0]?.history ?? []
})

const getAssetRadar = cache(async (ticker: string) => getMarketRadarData(ticker))

const getAssetNewsData = cache(async (ticker: string) => getAssetNews(ticker))

const getFollowingState = cache(async (ticker: string) => isFollowing(ticker))

async function AssetHeaderPanel({ ticker }: { ticker: string }) {
  const [quoteResult, followingResult] = await Promise.allSettled([
    getAssetQuote(ticker),
    getFollowingState(ticker),
  ])
  const quote = quoteResult.status === 'fulfilled' ? quoteResult.value : null
  const following = followingResult.status === 'fulfilled' ? followingResult.value : false

  return (
    <AssetHeader
      ticker={ticker}
      name={quote?.name ?? null}
      price={quote?.price ?? null}
      changePercent={quote?.changePercent ?? null}
      followButton={<FollowButton ticker={ticker} initialFollowing={following} />}
    />
  )
}

async function PriceChartPanel({ ticker }: { ticker: string }) {
  const initialHistory = await getAssetHistoryData(ticker)

  return (
    <PriceChartClient
      ticker={ticker}
      initialHistory={initialHistory}
      isMarketOpen={isMarketOpen()}
    />
  )
}

async function QuotesTablePanel({ ticker }: { ticker: string }) {
  const initialHistory = await getAssetHistoryData(ticker)
  return <AssetQuotesTable ticker={ticker} history={initialHistory} />
}

async function RadarPanel({ ticker }: { ticker: string }) {
  const radarData = await getAssetRadar(ticker)
  return <RadarSection data={radarData?.data ?? null} />
}

async function AssetNewsPanel({ ticker }: { ticker: string }) {
  const news = await getAssetNewsData(ticker)
  return <AssetNewsSection news={news} />
}

async function AssetProfilePanel({ ticker }: { ticker: string }) {
  const radarData = await getAssetRadar(ticker)
  return <AssetProfileCard ticker={ticker} profile={radarData?.profile ?? null} />
}

export default async function AssetPage({ params }: AssetPageProps) {
  const session = await auth()
  if (!session?.user) redirect('/auth/sign-in')

  const { ticker: rawTicker } = await params
  const ticker = normalizeTicker(rawTicker) || rawTicker

  return (
    <AppShell
      active="market"
      contentClassName="md:max-w-none xl:max-w-[1560px] 2xl:max-w-[1720px]"
      sessionUser={session.user}
    >
      <ScrollFocus>
        <Suspense fallback={<AssetHeaderSkeleton ticker={ticker} />}>
          <AssetHeaderPanel ticker={ticker} />
        </Suspense>
      </ScrollFocus>

      <div className="grid w-full grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <ScrollFocus>
            <Suspense fallback={<PriceChartSkeleton />}>
              <PriceChartPanel ticker={ticker} />
            </Suspense>
          </ScrollFocus>
          <ScrollFocus>
            <Suspense fallback={<RadarSectionSkeleton />}>
              <RadarPanel ticker={ticker} />
            </Suspense>
          </ScrollFocus>
          <ScrollFocus>
            <Suspense fallback={<AssetQuotesTableSkeleton ticker={ticker} />}>
              <QuotesTablePanel ticker={ticker} />
            </Suspense>
          </ScrollFocus>
          <ScrollFocus>
            <Suspense fallback={<AssetNewsSectionSkeleton />}>
              <AssetNewsPanel ticker={ticker} />
            </Suspense>
          </ScrollFocus>
        </div>

        <aside className="flex w-full flex-col gap-5 xl:sticky xl:top-24">
          <ScrollFocus>
            <Suspense fallback={<AssetProfileCard ticker={ticker} profile={null} />}>
              <AssetProfilePanel ticker={ticker} />
            </Suspense>
          </ScrollFocus>
          <ScrollFocus>
            <AssetAnalysisCTA ticker={ticker} />
          </ScrollFocus>
        </aside>
      </div>
    </AppShell>
  )
}
