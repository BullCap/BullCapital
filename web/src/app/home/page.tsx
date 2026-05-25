import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { buildAssetHref } from '@/lib/market-routing'
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
import MoversSection from '@/components/home/MoversSection'
import { DailyBriefContent, DailyBriefSkeleton } from '@/components/home/DailyBriefContent'
import type { SuggestedPrompt } from '@/components/home/DailyBriefHero'
import MarketMapSection from '@/components/home/MarketMapSection'
import MarketPlaybookSection from '@/components/home/MarketPlaybookSection'
import MarketHighlightsSection from '@/components/home/MarketHighlightsSection'
import WatchlistRadarSection from '@/components/home/WatchlistRadarSection'
import { SECTOR_TREEMAP_TICKERS } from '@/components/home/SectorTreeMap'
import type { RadarPulseItem } from '@/components/home/RadarPulseSection'
import { StoryDigestLoader, StoryDigestSkeleton } from '@/components/home/StoryDigestLoader'
import type { NewsRadarItem } from '@/lib/news-radar'
import AppShell from '@/components/navigation/AppShell'
import ScrollFocus from '@/components/ui/ScrollFocus'
import { Suspense } from 'react'



function formatPercent(value: number | null) {
  if (value === null) return 'n/d'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}
function buildSuggestedPrompts(
  ibovChange: number | null,
  vix: number | null,
  topMover: { ticker: string; changePercent: number } | null,
  leadStoryTicker: string | null,
  marketOpen: boolean
): SuggestedPrompt[] {
  const prompts: SuggestedPrompt[] = []

  if (ibovChange !== null) {
    const direction = ibovChange >= 0 ? 'alta' : 'queda'
    const label = `Por que o Ibovespa está em ${direction} hoje?`
    prompts.push({
      label,
      href: `/analysis?ticker=%5EBVSP&q=${encodeURIComponent(label)}`,
    })
  }

  if (topMover) {
    const label = `O que explica o movimento de ${topMover.ticker}?`
    prompts.push({
      label,
      href: `/analysis?ticker=${encodeURIComponent(topMover.ticker)}&q=${encodeURIComponent(label)}`,
    })
  }

  if (vix !== null && vix >= 20) {
    const label = `O VIX em ${vix.toFixed(1)} representa risco real para a B3?`
    prompts.push({
      label,
      href: `/analysis?ticker=%5EBVSP&q=${encodeURIComponent(label)}`,
    })
  } else if (leadStoryTicker && leadStoryTicker !== (topMover?.ticker ?? '')) {
    const label = `Qual o impacto de ${leadStoryTicker} no mercado hoje?`
    prompts.push({
      label,
      href: `/analysis?ticker=${encodeURIComponent(leadStoryTicker)}&q=${encodeURIComponent(label)}`,
    })
  }

  if (prompts.length < 3 && !marketOpen) {
    prompts.push({
      label: 'O que acompanhar antes da abertura de amanhã?',
      href: `/analysis?ticker=%5EBVSP&q=${encodeURIComponent('O que acompanhar antes da abertura de amanhã?')}`,
    })
  }

  return prompts.slice(0, 3)
}

function buildRadarItems(
  gainers: Array<{ ticker: string; changePercent: number }>,
  losers: Array<{ ticker: string; changePercent: number }>,
  stories: NewsRadarItem[]
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

  const storyTicker = stories.find((story) => story.tickers[0] && !story.tickers[0].startsWith('^'))?.tickers[0]
  if (storyTicker) {
    items.push({
      ticker: storyTicker,
      label: 'História com chance de gerar follow-up',
      description: `${storyTicker} apareceu no noticiário do dia e vale cruzar a manchete com preço, radar e leitura contextual.`,
      href: `/analysis?ticker=${encodeURIComponent(storyTicker)}`,
      tone: 'neutral',
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

  const treemapQuotes = treemapResult.status === 'fulfilled' ? (treemapResult.value?.results ?? []) : []
  const treemapAssets = treemapQuotes.map((q) => ({
    stock: q.symbol,
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

  const radarItems = buildRadarItems(gainers, losers, topStories)
  const marketOpen = isMarketOpen()
  const selicValue = selicData?.rate ?? null
  const dateLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
  }).format(new Date())
  const contextLine = marketOpen ? 'pregão em andamento' : 'mercado fora do horário regular'
  const leadStory = topStories[0]
  const storyTicker = leadStory?.tickers.find((ticker) => !ticker.startsWith('^'))
  const topMover = gainers[0] ?? losers[0] ?? null
  const suggestedPrompts = buildSuggestedPrompts(
    ibov?.changePercent ?? null,
    vix,
    topMover ?? null,
    storyTicker ?? null,
    marketOpen
  )
  const playbookActions = [
    {
      title: 'Ler o mercado por inteiro',
      description: 'Abra a análise principal para juntar macro, narrativa e os nomes que puxam o dia.',
      href: '/analysis',
      label: 'análise guiada',
      tone: 'analysis' as const,
    },
    {
      title: storyTicker ? `Investigar ${storyTicker}` : 'Explorar o ativo em destaque',
      description: storyTicker
        ? `${storyTicker} apareceu no radar de notícias e vale cruzar manchete, preço e scores.`
        : 'Use o detalhe do ativo para sair do painel e validar o movimento com mais contexto.',
      href: storyTicker ? buildAssetHref(storyTicker) : '/search',
      label: storyTicker ? 'detalhe do ativo' : 'buscar ativo',
      tone: 'asset' as const,
    },
    {
      title: 'Voltar para as histórias do dia',
      description: 'Passe pelas manchetes com mais potencial de follow-up antes de entrar em tese.',
      href: '#stories',
      label: 'notícias priorizadas',
      tone: 'news' as const,
    },
  ]

  const brt = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const hour = brt.getHours()
  const firstName = session.user.name?.trim().split(/\s+/)[0] ?? session.user.email?.split('@')[0] ?? 'você'
  const greetingStart = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const storyLine = topStories.length > 0
    ? `${topStories.length} históri${topStories.length === 1 ? 'a relevante' : 'as relevantes'} no radar de hoje.`
    : 'Veja o radar do dia para acompanhar o mercado.'

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
    <AppShell active="market" contentClassName="md:max-w-none">
      <header className="px-1 pb-2">
        <p className="bull-eyebrow">{dateLabel}</p>
        <h1 className="mt-2 font-serif text-3xl md:text-4xl tracking-tight text-[#F4F0FF]">
          {greetingStart}, <span className="text-gradient-amethyst font-semibold">{firstName}</span>.
        </h1>
        <p className="mt-1 text-sm text-[#DBEAFE]/55">{storyLine}</p>
      </header>

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
          suggestedPrompts={suggestedPrompts}
          pulse={briefPulse}
          fixedIncomeHighlights={fixedIncomeRaw}
        />
      </Suspense>

      <div className="grid gap-5">
        <ScrollFocus>
          <Suspense fallback={<StoryDigestSkeleton />}>
            <StoryDigestLoader />
          </Suspense>
        </ScrollFocus>

        <ScrollFocus>
          <MarketHighlightsSection
            stockGainers={gainersRaw}
            stockLosers={losersRaw}
            stockMostTraded={mostTradedRaw}
            cryptoHighlights={cryptoRaw}
            fixedIncomeHighlights={fixedIncomeRaw}
          />
        </ScrollFocus>

        <ScrollFocus>
          <MarketMapSection assets={mapAssets} />
        </ScrollFocus>

        <div className="px-1 pt-3">
          <p className="bull-eyebrow">Panorama Macro</p>
          <h2 className="mt-1 font-serif text-2xl tracking-tight text-[#F4F0FF]/80">Índices & Juros</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
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

        <div className="px-1 pt-3">
          <p className="bull-eyebrow">Fluxo do Pregão</p>
          <h2 className="mt-1 font-serif text-2xl tracking-tight text-[#F4F0FF]/80">Destaques do Dia</h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <ScrollFocus>
            <MoversSection title="Maiores altas" icon="gainers" movers={gainers} />
          </ScrollFocus>
          <ScrollFocus>
            <MoversSection title="Maiores baixas" icon="losers" movers={losers} />
          </ScrollFocus>
        </div>

        <ScrollFocus>
          <WatchlistRadarSection fallbackItems={radarItems} />
        </ScrollFocus>

        <ScrollFocus>
          <MarketPlaybookSection actions={playbookActions} />
        </ScrollFocus>
      </div>
    </AppShell>
  )
}
