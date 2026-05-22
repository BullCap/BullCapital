import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { buildAssetHref } from '@/lib/market-routing'
import { getAssetNews, getMarketListings } from '@/lib/services/market'
import {
  computeTemperature,
  fetchSELIC,
  fetchIndexFromBrapi,
  isMarketOpen,
} from '@/lib/market-utils'
import TemperatureCard from '@/components/home/TemperatureCard'
import IndexCard from '@/components/home/IndexCard'
import SELICCard from '@/components/home/SELICCard'
import VixCard from '@/components/home/VixCard'
import MoversSection from '@/components/home/MoversSection'
import { DailyBriefContent, DailyBriefSkeleton } from '@/components/home/DailyBriefContent'
import type { SuggestedPrompt } from '@/components/home/DailyBriefHero'
import MarketBubbleMap from '@/components/home/MarketBubbleMap'
import MarketPlaybookSection from '@/components/home/MarketPlaybookSection'
import WatchlistRadarSection from '@/components/home/WatchlistRadarSection'
import type { RadarPulseItem } from '@/components/home/RadarPulseSection'
import StoryDigestSection, { type StoryDigestItem } from '@/components/home/StoryDigestSection'
import AppShell from '@/components/navigation/AppShell'
import ScrollFocus from '@/components/ui/ScrollFocus'
import { Suspense } from 'react'

function getGreeting(name: string | null, email: string | null): string {
  const brt = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const hour = brt.getHours()
  const firstName = name?.trim().split(/\s+/)[0] ?? email?.split('@')[0] ?? 'você'
  if (hour < 12) return `Bom dia, ${firstName}.`
  if (hour < 18) return `Boa tarde, ${firstName}.`
  return `Boa noite, ${firstName}.`
}

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2
      ? (parts[0][0]! + parts[parts.length - 1][0]!).toUpperCase()
      : parts[0]!.slice(0, 2).toUpperCase()
  }
  return email?.[0]?.toUpperCase() ?? '?'
}

function formatPercent(value: number | null) {
  if (value === null) return 'n/d'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}


function buildAskHref(headline: string, tickers: string[]): string {
  const anchor = tickers.find((t) => !t.startsWith('^')) ?? tickers[0]
  if (!anchor) return `/analysis?q=${encodeURIComponent(headline)}`
  const q = `Explique o impacto desta notícia: "${headline.slice(0, 120)}"`
  return `/analysis?ticker=${encodeURIComponent(anchor)}&q=${encodeURIComponent(q)}`
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

function buildStoryNote(tickers: string[]) {
  if (tickers.includes('^BVSP')) return 'Use esta manchete para entender o clima geral do mercado brasileiro antes de entrar nos nomes individuais.'
  if (tickers.includes('PETR4')) return 'Se a historia ganhar tracao, PETR4 pode contaminar humor de indice e nomes ligados a commodities.'
  if (tickers.includes('VALE3')) return 'Vale funciona como leitura de fluxo global e ajuda a testar apetite por exportadoras.'
  if (tickers.includes('ITUB4')) return 'Bancos costumam ajudar a confirmar se o movimento do indice e amplo ou concentrado.'
  return 'Vale acompanhar como essa historia conversa com os sinais de preco e risco do dia.'
}

function buildTopStories(
  storiesByTicker: Array<{ items: Awaited<ReturnType<typeof getAssetNews>>; ticker: string }>
): StoryDigestItem[] {
  const deduped = new Map<string, StoryDigestItem>()

  for (const source of storiesByTicker) {
    for (const item of source.items) {
      if (!item.link) continue
      const existing = deduped.get(item.link)
      if (existing) {
        if (!existing.tickers.includes(source.ticker)) existing.tickers.push(source.ticker)
        continue
      }

      deduped.set(item.link, {
        headline: item.title,
        href: item.link,
        note: buildStoryNote([source.ticker]),
        publishedAt: item.publishedAt,
        publisher: item.publisher,
        relatedHref: source.ticker.startsWith('^') ? '/analysis' : buildAssetHref(source.ticker),
        relatedLabel: source.ticker.startsWith('^') ? 'Ler mercado' : `Abrir ${source.ticker}`,
        tickers: [source.ticker],
        askHref: buildAskHref(item.title, [source.ticker]),
      })
    }
  }

  return Array.from(deduped.values())
    .map((story) => ({
      ...story,
      note: buildStoryNote(story.tickers),
    }))
    .sort((left, right) => right.publishedAt - left.publishedAt)
    .slice(0, 4)
}

function buildRadarItems(
  gainers: Array<{ ticker: string; changePercent: number }>,
  losers: Array<{ ticker: string; changePercent: number }>,
  stories: StoryDigestItem[]
): RadarPulseItem[] {
  const items: RadarPulseItem[] = []

  if (gainers[0]) {
    items.push({
      ticker: gainers[0].ticker,
      label: 'Forca entre as maiores altas',
      description: `${gainers[0].ticker} sobe ${formatPercent(gainers[0].changePercent)} e pode ajudar a testar se o fluxo comprador tem continuidade.`,
      href: buildAssetHref(gainers[0].ticker),
      tone: 'up',
    })
  }

  if (losers[0]) {
    items.push({
      ticker: losers[0].ticker,
      label: 'Pressao entre as maiores baixas',
      description: `${losers[0].ticker} cai ${formatPercent(losers[0].changePercent)} e merece leitura de risco para ver se o movimento e isolado ou setorial.`,
      href: buildAssetHref(losers[0].ticker),
      tone: 'down',
    })
  }

  const storyTicker = stories.find((story) => story.tickers[0] && !story.tickers[0].startsWith('^'))?.tickers[0]
  if (storyTicker) {
    items.push({
      ticker: storyTicker,
      label: 'Historia com chance de gerar follow-up',
      description: `${storyTicker} apareceu no noticiario do dia e vale cruzar a manchete com preco, radar e leitura contextual.`,
      href: `/analysis?ticker=${encodeURIComponent(storyTicker)}`,
      tone: 'neutral',
    })
  }

  items.push({
    ticker: 'B3',
    label: 'Leitura completa do mercado',
    description: 'Abra a analise do mercado para juntar juros, humor local e os nomes que puxam a narracao do pregão.',
    href: '/analysis',
    tone: 'neutral',
  })

  return items.slice(0, 4)
}

export default async function HomePage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/sign-in')

  const storyTickers = ['^BVSP', 'PETR4', 'VALE3', 'ITUB4'] as const

  const [
    ibovResult,
    sp500Result,
    vixResult,
    selicResult,
    gainersResult,
    losersResult,
    ibovNews,
    petrNews,
    valeNews,
    itubNews,
  ] =
    await Promise.allSettled([
      fetchIndexFromBrapi('^BVSP'),
      fetchIndexFromBrapi('^GSPC'),
      fetchIndexFromBrapi('^VIX'),
      fetchSELIC(),
      getMarketListings({ sortBy: 'change', sortOrder: 'desc', limit: 6, type: 'stock' }),
      getMarketListings({ sortBy: 'change', sortOrder: 'asc', limit: 6, type: 'stock' }),
      getAssetNews(storyTickers[0], 4),
      getAssetNews(storyTickers[1], 3),
      getAssetNews(storyTickers[2], 3),
      getAssetNews(storyTickers[3], 3),
    ])

  const ibov = ibovResult.status === 'fulfilled' ? ibovResult.value : null
  const sp500 = sp500Result.status === 'fulfilled' ? sp500Result.value : null
  const vix = vixResult.status === 'fulfilled' ? (vixResult.value?.price ?? null) : null

  const temperature = ibov ? computeTemperature(ibov.changePercent, vix) : null

  const selicData = selicResult.status === 'fulfilled' ? selicResult.value : null

  const gainersRaw = gainersResult.status === 'fulfilled' ? (gainersResult.value?.stocks ?? []) : []
  const losersRaw = losersResult.status === 'fulfilled' ? (losersResult.value?.stocks ?? []) : []

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

  const topStories = buildTopStories([
    { ticker: storyTickers[0], items: ibovNews.status === 'fulfilled' ? ibovNews.value : [] },
    { ticker: storyTickers[1], items: petrNews.status === 'fulfilled' ? petrNews.value : [] },
    { ticker: storyTickers[2], items: valeNews.status === 'fulfilled' ? valeNews.value : [] },
    { ticker: storyTickers[3], items: itubNews.status === 'fulfilled' ? itubNews.value : [] },
  ])

  const radarItems = buildRadarItems(gainers, losers, topStories)
  const marketOpen = isMarketOpen()
  const selicValue = selicData?.rate ?? null
  const dateLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
  }).format(new Date())
  const contextLine = marketOpen ? 'pregao em andamento' : 'mercado fora do horario regular'
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
      description: 'Abra a analise principal para juntar macro, narrativa e os nomes que puxam o dia.',
      href: '/analysis',
      label: 'analise guiada',
      tone: 'analysis' as const,
    },
    {
      title: storyTicker ? `Investigar ${storyTicker}` : 'Explorar o ativo em destaque',
      description: storyTicker
        ? `${storyTicker} apareceu no radar de noticias e vale cruzar manchete, preco e scores.`
        : 'Use o detalhe do ativo para sair do painel e validar o movimento com mais contexto.',
      href: storyTicker ? buildAssetHref(storyTicker) : '/search',
      label: storyTicker ? 'detalhe do ativo' : 'buscar ativo',
      tone: 'asset' as const,
    },
    {
      title: 'Voltar para as historias do dia',
      description: 'Passe pelas manchetes com mais potencial de follow-up antes de entrar em tese.',
      href: '#stories',
      label: 'noticias priorizadas',
      tone: 'news' as const,
    },
  ]

  const greeting = getGreeting(session.user.name ?? null, session.user.email ?? null)
  const initials = getInitials(session.user.name ?? null, session.user.email ?? null)
  const storyLine = topStories.length > 0
    ? `${topStories.length} históri${topStories.length === 1 ? 'a relevante' : 'as relevantes'} no radar de hoje.`
    : 'Aqui está o que está movendo o mercado.'

  return (
    <AppShell active="market" contentClassName="md:max-w-none">
      <header className="flex items-start justify-between gap-4 px-1">
        <div>
          <p className="bull-eyebrow">{dateLabel}</p>
          <h1 className="mt-2 font-serif text-3xl text-[#F4F0FF]">{greeting}</h1>
          <p className="mt-1 text-sm text-[#DBEAFE]/55">{storyLine}</p>
        </div>
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#8B5CF6]/35 bg-[#8B5CF6]/15 text-sm font-semibold tracking-wide text-[#C4B5FD]"
        >
          {initials}
        </span>
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
        />
      </Suspense>

      <div className="grid gap-5 xl:items-start xl:grid-cols-[minmax(0,1fr)_22rem]">

        {/* ── Main column ── */}
        <div className="grid content-start gap-5">
          <ScrollFocus>
            <StoryDigestSection stories={topStories} />
          </ScrollFocus>

          <ScrollFocus>
            <TemperatureCard temperature={temperature} />
          </ScrollFocus>
          <ScrollFocus>
            <MarketBubbleMap assets={bubbleAssets} />
          </ScrollFocus>

          <div className="grid gap-5 md:grid-cols-2">
            <ScrollFocus>
              <IndexCard
                name="IBOVESPA"
                price={ibov?.price ?? null}
                changePercent={ibov?.changePercent ?? null}
                isOpen={marketOpen}
              />
            </ScrollFocus>
            <ScrollFocus>
              <IndexCard
                name="S&P 500"
                price={sp500?.price ?? null}
                changePercent={sp500?.changePercent ?? null}
                isOpen={marketOpen}
              />
            </ScrollFocus>
            <ScrollFocus className="md:col-span-2">
              <SELICCard selic={selicData} />
            </ScrollFocus>
            <ScrollFocus className="md:col-span-2 xl:hidden">
              <VixCard value={vix} />
            </ScrollFocus>
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
            <MarketPlaybookSection actions={playbookActions} />
          </ScrollFocus>
        </div>

        {/* ── Sticky right sidebar (xl+) ── */}
        <div className="hidden xl:grid xl:content-start xl:gap-5 xl:sticky xl:top-5">
          <VixCard value={vix} />
          <WatchlistRadarSection fallbackItems={radarItems} />
        </div>

      </div>
    </AppShell>
  )
}
