import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getMarketRadarData, getAssetHistory, getAssetNews } from '@/lib/services/market'
import { fetchIndexFromBrapi, isMarketOpen } from '@/lib/market-utils'
import { normalizeTicker } from '@/lib/market-routing'
import AssetHeader from '@/components/asset/AssetHeader'
import PriceChartClient from '@/components/asset/PriceChartClient'
import RadarSection from '@/components/asset/RadarSection'
import AssetAnalysisCTA from '@/components/asset/AssetAnalysisCTA'
import AssetNewsSection from '@/components/asset/AssetNewsSection'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import AppShell from '@/components/navigation/AppShell'
import ScrollFocus from '@/components/ui/ScrollFocus'

interface AssetPageProps {
  params: Promise<{ ticker: string }>
}

export default async function AssetPage({ params }: AssetPageProps) {
  const session = await auth()
  if (!session?.user) redirect('/auth/sign-in')

  const { ticker: rawTicker } = await params
  const ticker = normalizeTicker(rawTicker) || rawTicker

  const [quoteResult, historyResult, radarResult, newsResult] = await Promise.allSettled([
    fetchIndexFromBrapi(ticker),      // header — free tier, always works
    getAssetHistory([ticker], '1mo'), // chart
    getMarketRadarData(ticker),       // radar scores — graceful fallback if paid-tier fails
    getAssetNews(ticker),             // news
  ])

  // Header — sourced from free-tier quote, never from radar
  const quote = quoteResult.status === 'fulfilled' ? quoteResult.value : null
  const price = quote?.price ?? null
  const changePercent = quote?.changePercent ?? null
  const name = quote?.name ?? null

  // Radar scores only
  const radarData = radarResult.status === 'fulfilled' ? radarResult.value : null
  const radarPoints = radarData?.data ?? null

  const historyData = historyResult.status === 'fulfilled' ? historyResult.value : null
  const initialHistory = historyData?.results?.[0]?.history ?? []
  const news = newsResult.status === 'fulfilled' ? newsResult.value : []

  if (quote === null && initialHistory.length === 0) {
    return (
      <AppShell active="market" contentClassName="gap-6">
        <ScrollFocus>
          <div className="bull-panel p-8 text-center">
            <GlassHighlight widthPercent={60} />
            <p className="bull-eyebrow">Ativo</p>
            <h1 className="mt-3 font-serif text-3xl text-[#F4F0FF]">{ticker.toUpperCase()}</h1>
            <p className="mt-3 text-sm text-[#F4F0FF]/50">Ativo não encontrado</p>
            <Link
              href="/home"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-[#F4F0FF]/70 transition hover:bg-white/10"
            >
              Voltar ao início
            </Link>
          </div>
        </ScrollFocus>
      </AppShell>
    )
  }

  return (
    <AppShell active="market">
      <ScrollFocus>
        <AssetHeader ticker={ticker} name={name} price={price} changePercent={changePercent} />
      </ScrollFocus>
      <ScrollFocus>
        <PriceChartClient
          ticker={ticker}
          initialHistory={initialHistory}
          quotePrice={price}
          quoteChangePercent={changePercent}
          isMarketOpen={isMarketOpen()}
        />
      </ScrollFocus>
      <ScrollFocus>
        <RadarSection data={radarPoints} />
      </ScrollFocus>
      <ScrollFocus>
        <AssetNewsSection news={news} />
      </ScrollFocus>
      <ScrollFocus>
        <AssetAnalysisCTA ticker={ticker} />
      </ScrollFocus>
    </AppShell>
  )
}
