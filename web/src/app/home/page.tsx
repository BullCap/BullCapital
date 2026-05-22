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
import MoversSection from '@/components/home/MoversSection'
import AnalysisCTA from '@/components/home/AnalysisCTA'
import DailyBriefHero from '@/components/home/DailyBriefHero'
import MarketBubbleMap from '@/components/home/MarketBubbleMap'
import RadarPulseSection, { type RadarPulseItem } from '@/components/home/RadarPulseSection'
import StoryDigestSection, { type StoryDigestItem } from '@/components/home/StoryDigestSection'
import AppShell from '@/components/navigation/AppShell'
import ScrollFocus from '@/components/ui/ScrollFocus'

function formatPercent(value: number | null) {
  if (value === null) return 'n/d'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

function buildHeadline(
  ibovChange: number | null,
  vix: number | null,
  storiesCount: number
) {
  if (ibovChange === null) return 'O mercado abriu o dia pedindo confirmacao de contexto.'
  if (ibovChange >= 1) return `A sessao comeca construtiva, com tracao visivel em bolsa e ${storiesCount} historias puxando o radar.`
  if (ibovChange <= -1) return `O dia abre pressionado, com o humor mais fragil e ${storiesCount} pontos de atencao no fluxo.`
  if (vix !== null && vix >= 20) return `O mercado segue seletivo: pouca direcao no indice e volatilidade pedindo leitura mais cuidadosa.`
  return `O pregão abre equilibrado, com movimento moderado no indice e historias suficientes para separar ruido de sinal.`
}

function buildSummary(
  ibovChange: number | null,
  marketOpen: boolean,
  selic: string | null,
  sp500Change: number | null,
  vix: number | null
) {
  const marketLine = marketOpen ? 'pregao em andamento' : 'mercado fora do horario regular'
  const ibovLine =
    ibovChange === null
      ? 'O Ibovespa ainda nao conseguiu formar uma leitura confiavel.'
      : `O Ibovespa marca ${formatPercent(ibovChange)}, o que ajuda a medir o apetite local por risco.`
  const usLine =
    sp500Change === null
      ? 'O exterior segue sem leitura consolidada.'
      : `Lá fora, o S&P 500 aparece em ${formatPercent(sp500Change)}.`
  const riskLine =
    vix === null ? 'A volatilidade segue sem referencia clara.' : `O VIX roda perto de ${vix.toFixed(1)}.`
  const ratesLine = selic ? `No pano de fundo, a SELIC segue em ${selic}.` : 'Os juros locais seguem como pano de fundo importante.'

  return `${ibovLine} Com ${marketLine}, o foco agora e separar movimentos tecnicos de mudancas reais de narrativa. ${usLine} ${riskLine} ${ratesLine}`
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
  const headline = buildHeadline(ibov?.changePercent ?? null, vix, topStories.length)
  const summary = buildSummary(
    ibov?.changePercent ?? null,
    marketOpen,
    selicValue,
    sp500?.changePercent ?? null,
    vix
  )
  const focusPoints = [
    `Ibovespa em ${formatPercent(ibov?.changePercent ?? null)} e S&P em ${formatPercent(sp500?.changePercent ?? null)}.`,
    vix !== null ? `Volatilidade perto de ${vix.toFixed(1)}: ajuste o nivel de conviccao antes de seguir o fluxo.` : 'Volatilidade sem referencia forte: prefira confirmar movimento antes de reagir.',
    selicValue ? `A ancora de juros segue em ${selicValue}, o que ainda pesa na leitura de valor e risco.` : 'Juros continuam relevantes para separar impulso tatico de narrativa mais estrutural.',
  ]
  const dateLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
  }).format(new Date())
  const contextLine = marketOpen ? 'pregao em andamento' : 'mercado fora do horario regular'

  return (
    <AppShell active="market" contentClassName="md:max-w-none">
      <header className="flex items-end justify-between gap-4 px-1">
        <div>
          <p className="bull-eyebrow">BullCapital</p>
          <h1 className="mt-2 font-serif text-3xl text-[#F4F0FF]">Morning update</h1>
          <p className="mt-1 text-sm text-[#DBEAFE]/55">Leitura diaria do mercado brasileiro</p>
        </div>
        <span className="bull-chip shrink-0">B3</span>
      </header>

      <ScrollFocus>
        <DailyBriefHero
          contextLine={contextLine}
          dateLabel={dateLabel}
          focusPoints={focusPoints}
          headline={headline}
          storiesCount={topStories.length}
          summary={summary}
        />
      </ScrollFocus>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.95fr)]">
        <div className="grid gap-5">
          <ScrollFocus>
            <TemperatureCard temperature={temperature} />
          </ScrollFocus>
          <ScrollFocus>
            <MarketBubbleMap assets={bubbleAssets} />
          </ScrollFocus>
        </div>
        <div className="grid gap-5">
          <ScrollFocus>
            <StoryDigestSection stories={topStories} />
          </ScrollFocus>
          <ScrollFocus>
            <RadarPulseSection items={radarItems} />
          </ScrollFocus>
          <ScrollFocus>
            <AnalysisCTA />
          </ScrollFocus>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
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
        <ScrollFocus>
          <SELICCard selic={selicData} />
        </ScrollFocus>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ScrollFocus>
          <MoversSection title="Maiores altas" icon="gainers" movers={gainers} />
        </ScrollFocus>
        <ScrollFocus>
          <MoversSection title="Maiores baixas" icon="losers" movers={losers} />
        </ScrollFocus>
      </div>
    </AppShell>
  )
}
