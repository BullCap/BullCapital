import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

import Header from '@/components/landing/Header'
import DynamicTitle from '@/components/landing/DynamicTitle'
import SearchBar from '@/components/landing/SearchBar'
import Grainient from '@/components/landing/Grainient'
import TopAssetsSection from '@/components/landing/TopAssetsSection'
import MarketOverview from '@/components/landing/MarketOverview'
import MarketHighlights from '@/components/landing/MarketHighlights'
import Footer from '@/components/landing/Footer'
import { getMarketListings, getCurrencyRates } from '@/lib/services/market'
import { computeTemperature, fetchMarketQuote } from '@/lib/market-utils'
import type { MarketListingItem } from '@/types/market'

function buildLandingRadar(
  gainers: MarketListingItem[],
  losers: MarketListingItem[],
  mostTraded: MarketListingItem[]
) {
  const movers = [...gainers, ...losers]
  if (movers.length === 0) return []

  const positiveRatio = (movers.filter((asset) => asset.change > 0).length / movers.length) * 100
  const avgAbsMove = movers.reduce((sum, asset) => sum + Math.abs(asset.change), 0) / movers.length
  const avgVolume = mostTraded.reduce((sum, asset) => sum + asset.volume, 0) / Math.max(1, mostTraded.length)

  return [
    { subject: 'Amplitude', value: Math.round(positiveRatio), fullMark: 100 },
    { subject: 'Volatilidade', value: Math.min(100, Math.round(avgAbsMove * 12)), fullMark: 100 },
    { subject: 'Liquidez', value: Math.min(100, Math.round(avgVolume / 20_000_000)), fullMark: 100 },
    {
      subject: 'Assimetria',
      value: Math.min(100, Math.round(Math.abs((gainers[0]?.change ?? 0) - (losers[0]?.change ?? 0)) * 8)),
      fullMark: 100,
    },
    { subject: 'Fluxo', value: Math.min(100, Math.round(mostTraded.length * 16)), fullMark: 100 },
  ]
}

function buildLandingInsight(
  ibovChange: number | null,
  gainers: MarketListingItem[],
  losers: MarketListingItem[]
) {
  if (ibovChange === null && gainers.length === 0 && losers.length === 0) {
    return 'Dados reais de mercado indisponíveis no momento. A leitura contextual será retomada quando as fontes responderem.'
  }

  const direction = ibovChange === null ? 'sem leitura consolidada do índice' : ibovChange >= 0 ? 'em alta' : 'em queda'
  const topGainer = gainers[0]?.stock
  const topLoser = losers[0]?.stock
  const moversText = topGainer && topLoser
    ? `${topGainer} aparece entre as maiores altas, enquanto ${topLoser} concentra pressão na ponta negativa`
    : 'os destaques do pregão seguem concentrados nos ativos com maior variação'

  return `O Ibovespa aparece ${direction} na leitura atual. ${moversText}. Esta é uma leitura contextual de dados, sem recomendação de investimento.`
}

export default async function HomePage() {
  const session = await auth()

  if (session?.user) {
    redirect('/home')
  }

  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }
    : undefined

  const [
    ibovResult,
    vixResult,
    fxResult,
    topAssetsResult,
    gainersResult,
    losersResult,
    mostTradedResult,
  ] = await Promise.allSettled([
    fetchMarketQuote('^BVSP'),
    fetchMarketQuote('^VIX'),
    getCurrencyRates(['USD-BRL']),
    getMarketListings({ sortBy: 'market_cap_basic', sortOrder: 'desc', limit: 25, type: 'stock' }),
    getMarketListings({ sortBy: 'change', sortOrder: 'desc', limit: 5, type: 'stock' }),
    getMarketListings({ sortBy: 'change', sortOrder: 'asc', limit: 5, type: 'stock' }),
    getMarketListings({ sortBy: 'volume', sortOrder: 'desc', limit: 5, type: 'stock' }),
  ])

  const ibov = ibovResult.status === 'fulfilled' ? ibovResult.value : null
  const vix = vixResult.status === 'fulfilled' ? (vixResult.value?.price ?? null) : null
  const fxData = fxResult.status === 'fulfilled' ? fxResult.value : null
  const usdBrl = fxData?.currencies?.find((currency) => currency.name === 'USD/BRL') ?? null
  const usdBrlChange = usdBrl && usdBrl.lowPrice > 0
    ? +(((usdBrl.bidPrice - usdBrl.lowPrice) / usdBrl.lowPrice) * 100).toFixed(2)
    : null

  const topAssets = topAssetsResult.status === 'fulfilled' ? (topAssetsResult.value?.stocks ?? []) : []
  const gainers = gainersResult.status === 'fulfilled' ? (gainersResult.value?.stocks ?? []) : []
  const losers = losersResult.status === 'fulfilled' ? (losersResult.value?.stocks ?? []) : []
  const mostTraded = mostTradedResult.status === 'fulfilled' ? (mostTradedResult.value?.stocks ?? []) : []
  const allVisible = [...gainers, ...losers]
  const marketBreadth = allVisible.length > 0
    ? (allVisible.filter((asset) => asset.change > 0).length / allVisible.length) * 100
    : null
  const temperature = ibov
    ? computeTemperature({
        ibovChange: ibov.changePercent,
        vix,
        usdBrlChange,
        marketBreadth,
      })
    : null
  const radarData = buildLandingRadar(gainers, losers, mostTraded)
  const insightText = buildLandingInsight(ibov?.changePercent ?? null, gainers, losers)

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden text-[#F4F0FF]">
      {/* Fixed WebGL Background Animation */}
      <div className="pointer-events-none fixed inset-0 -z-50 h-screen w-screen opacity-70">
        <Grainient
          color1="#0D0B14"
          color2="#5227FF"
          color3="#0D0B14"
          timeSpeed={0.25}
          colorBalance={0.1}
          warpStrength={2.5}
          warpFrequency={4.5}
          warpSpeed={2.5}
          warpAmplitude={45}
          blendAngle={15}
          blendSoftness={0.08}
          rotationAmount={350}
          noiseScale={2.5}
          grainAmount={0.08}
          grainScale={1.5}
          grainAnimated={true}
          contrast={1.4}
          gamma={1.1}
          saturation={1.2}
          centerX={0}
          centerY={0}
          zoom={0.8}
          className="h-full w-full"
        />
        {/* Soft shadow overlay to blend WebGL with the dark void background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0D0B14]/40 to-[#0D0B14]" />
      </div>

      {/* Dynamic Floating Header */}
      <Header user={user} />

      {/* Hero Section */}
      <section className="relative flex min-h-[680px] w-full flex-col items-center justify-center gap-8 px-6 pt-28">
        <DynamicTitle />
        <SearchBar />
        <div className="flex max-w-3xl flex-wrap items-center justify-center gap-2">
          {['Fundamentos completos', 'OHLCV profundo', 'FIIs, macro e derivativos'].map((label) => (
            <span key={label} className="bull-chip min-h-8 text-[11px]">
              {label}
            </span>
          ))}
        </div>
      </section>



      {/* Content Sections */}
      <div className="z-10 mx-auto flex w-full max-w-7xl flex-col items-start gap-32 px-6 py-12">
        {/* Top Asset Cards */}
        <TopAssetsSection assets={topAssets} />

        {/* Visão Geral */}
        <MarketOverview
          temperature={temperature ? { value: temperature.value, label: temperature.label } : null}
          radarData={radarData}
          insightText={insightText}
          assets={topAssets}
        />

        {/* Destaques */}
        <MarketHighlights gainers={gainers} losers={losers} mostTraded={mostTraded} />
      </div>

      {/* Institutional Glass Footer */}
      <Footer />
    </main>
  )
}
