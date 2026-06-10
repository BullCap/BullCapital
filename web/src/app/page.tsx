import { redirect } from 'next/navigation'
import { Suspense, cache } from 'react'
import Link from 'next/link'
import { Activity, ArrowRight, Database, Layers3, Newspaper, ShieldCheck, Sparkles } from 'lucide-react'
import { auth } from '@/lib/auth'

import Header from '@/components/landing/Header'
import DynamicTitle from '@/components/landing/DynamicTitle'
import SearchBar from '@/components/landing/SearchBar'
import TopAssetsSection from '@/components/landing/TopAssetsSection'
import MarketOverview from '@/components/landing/MarketOverview'
import MarketHighlights from '@/components/landing/MarketHighlights'
import Footer from '@/components/landing/Footer'
import { getLandingMarketSnapshot } from '@/modules/market'
import { computeTemperature } from '@/lib/market-utils'
import type { AssetQuote, LandingMarketSnapshot, MarketListingItem } from '@/types/market'

interface LandingMovers {
  gainers: MarketListingItem[]
  losers: MarketListingItem[]
  mostTraded: MarketListingItem[]
}

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

const getLandingSnapshot = cache(async (): Promise<LandingMarketSnapshot> => getLandingMarketSnapshot())

const getLandingMovers = cache(async (): Promise<LandingMovers> => {
  const snapshot = await getLandingSnapshot()

  return {
    gainers: snapshot.gainers?.stocks ?? [],
    losers: snapshot.losers?.stocks ?? [],
    mostTraded: snapshot.mostTraded?.stocks ?? [],
  }
})

function quoteFor(quotes: AssetQuote[], symbol: string) {
  return quotes.find((quote) => quote.symbol === symbol) ?? null
}

function getLandingPulse(snapshot: LandingMarketSnapshot) {
  const ibov = quoteFor(snapshot.quotes.results ?? [], '^BVSP')
  const vix = quoteFor(snapshot.quotes.results ?? [], '^VIX')
  const usdBrl = snapshot.currency.currencies?.find((currency) => currency.name === 'USD/BRL') ?? null
  const usdBrlChange = usdBrl && usdBrl.lowPrice > 0
    ? +(((usdBrl.bidPrice - usdBrl.lowPrice) / usdBrl.lowPrice) * 100).toFixed(2)
    : null

  return {
    ibovChange: ibov?.regularMarketChangePercent ?? null,
    vix: vix?.regularMarketPrice ?? null,
    usdBrlChange,
  }
}

async function LandingTopAssetsPanel() {
  const snapshot = await getLandingSnapshot()
  return <TopAssetsSection assets={snapshot.topAssets?.stocks ?? []} />
}

async function LandingOverviewPanel() {
  const snapshot = await getLandingSnapshot()
  const topAssets = snapshot.topAssets?.stocks ?? []
  const movers = await getLandingMovers()
  const pulse = getLandingPulse(snapshot)
  const allVisible = [...movers.gainers, ...movers.losers]
  const marketBreadth = allVisible.length > 0
    ? (allVisible.filter((asset) => asset.change > 0).length / allVisible.length) * 100
    : null
  const temperature = pulse.ibovChange !== null
    ? computeTemperature({
        ibovChange: pulse.ibovChange,
        vix: pulse.vix,
        usdBrlChange: pulse.usdBrlChange,
        marketBreadth,
      })
    : null
  const radarData = buildLandingRadar(movers.gainers, movers.losers, movers.mostTraded)
  const insightText = buildLandingInsight(pulse.ibovChange, movers.gainers, movers.losers)

  return (
    <MarketOverview
      temperature={temperature ? { value: temperature.value, label: temperature.label } : null}
      radarData={radarData}
      insightText={insightText}
      assets={topAssets}
    />
  )
}

async function LandingHighlightsPanel() {
  const movers = await getLandingMovers()
  return <MarketHighlights gainers={movers.gainers} losers={movers.losers} mostTraded={movers.mostTraded} />
}

const platformPillars = [
  {
    icon: Database,
    title: 'Dados de mercado prontos para leitura',
    description: 'Quotes, OHLCV, fundamentos, FIIs, macro e câmbio passam por cache, normalização e contexto antes da interface.',
  },
  {
    icon: Newspaper,
    title: 'Briefing editorial diário',
    description: 'O mercado vira narrativa: pulso, destaques, mapa de calor, histórias no radar e disclaimers consistentes.',
  },
  {
    icon: Sparkles,
    title: 'Copiloto para explicar ativos',
    description: 'Perguntas sobre empresas, setores e cenários geram artefatos visuais e respostas auditáveis para times de análise.',
  },
]

const workflowSteps = [
  'Ingestão PRO',
  'Normalização',
  'Contexto macro',
  'Leitura editorial',
]

function LandingSectionHeading({
  eyebrow,
  title,
  description,
}: {
  description: string
  eyebrow: string
  title: string
}) {
  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <p className="bull-eyebrow">{eyebrow}</p>
      <h2 className="font-serif text-3xl font-medium leading-tight text-starlight md:text-4xl">
        {title}
      </h2>
      <p className="text-sm leading-7 text-starlight/50 md:text-[15px]">
        {description}
      </p>
    </div>
  )
}

function ProductPillars() {
  return (
    <section id="produto" className="grid gap-5 md:grid-cols-3">
      {platformPillars.map((pillar) => {
        const Icon = pillar.icon

        return (
          <article key={pillar.title} className="bull-card-calm p-6">
            <span className="inline-flex size-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-starlight/60">
              <Icon size={18} />
            </span>
            <h3 className="mt-6 font-serif text-xl font-medium text-starlight">{pillar.title}</h3>
            <p className="mt-3 text-sm leading-7 text-starlight/50">{pillar.description}</p>
          </article>
        )
      })}
    </section>
  )
}

function HeroTerminalPreview() {
  return (
    <aside className="bull-frame relative min-h-[31rem] p-5 md:p-6">
      <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-starlight/25 to-transparent" />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="bull-eyebrow">Terminal editorial</p>
          <h3 className="mt-2 font-serif text-2xl font-medium text-starlight">Do dado bruto à tese explicável.</h3>
        </div>
        <span className="rounded-full border border-[#7fb59a]/25 bg-[#7fb59a]/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#9fceb4]">
          online
        </span>
      </div>

      <div className="mt-7 grid gap-3">
        {workflowSteps.map((step, index) => (
          <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/[0.055] bg-white/[0.018] p-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-black/20 text-xs font-medium tabular-nums text-starlight/55">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-starlight/82">{step}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.035]">
                <div
                  className="h-full rounded-full bg-starlight/35"
                  style={{ width: `${38 + index * 15}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-amethyst/15 bg-amethyst/[0.055] p-4">
        <div className="flex items-center gap-2 text-starlight/70">
          <Layers3 size={16} />
          <p className="text-xs font-medium uppercase tracking-[0.14em]">Leitura composta</p>
        </div>
        <p className="mt-3 text-sm leading-7 text-starlight/58">
          A BullCapital combina mercado, macro e notícias para montar uma sala de leitura financeira
          com contexto, rastreabilidade e linguagem pronta para decisão.
        </p>
      </div>
    </aside>
  )
}

function WorkflowSection() {
  return (
    <section className="bull-frame grid gap-8 p-6 md:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
      <LandingSectionHeading
        eyebrow="Método"
        title="Uma camada de inteligência entre o terminal e a decisão."
        description="A nova landing acompanha o produto: menos brilho, mais leitura. A interface privilegia densidade, hierarquia e contexto — sem abrir mão de dados ao vivo."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: 'Governança', text: 'Disclaimers e leitura contextual por padrão.', icon: ShieldCheck },
          { label: 'Mercado', text: 'Pulso, amplitude, volatilidade e liquidez em uma visão.', icon: Activity },
          { label: 'Copiloto', text: 'Respostas com artefatos para explicar o racional.', icon: Sparkles },
          { label: 'Pipeline', text: 'Cache e ingestão para manter a experiência responsiva.', icon: Database },
        ].map((item) => {
          const Icon = item.icon

          return (
            <div key={item.label} className="bull-card-calm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-9 items-center justify-center rounded-xl border border-white/[0.06] bg-black/20 text-starlight/55">
                  <Icon size={16} />
                </span>
                <p className="font-serif text-lg text-starlight">{item.label}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-starlight/48">{item.text}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
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

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-[var(--void)] text-starlight">
      <div className="pointer-events-none fixed inset-0 -z-50">
        <div className="absolute left-1/2 top-[-18rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-amethyst/[0.08] blur-[130px]" />
        <div className="absolute bottom-[-18rem] right-[-10rem] h-[34rem] w-[34rem] rounded-full bg-cobalt/[0.08] blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.045),transparent_34%),linear-gradient(180deg,rgba(12,15,21,0)_0%,#0C0F15_78%)]" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,.75)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.75)_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      <Header user={user} />

      <section className="mx-auto grid min-h-screen w-full max-w-[1560px] gap-10 px-6 pb-20 pt-32 md:px-8 lg:grid-cols-[minmax(0,1fr)_30rem] lg:items-center lg:pt-36 xl:px-10 2xl:grid-cols-[minmax(0,1fr)_34rem]">
        <div className="max-w-5xl">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="bull-chip min-h-8 text-[11px]">Market intelligence</span>
            <span className="bull-chip min-h-8 text-[11px]">B3 · Macro · Notícias</span>
          </div>

          <DynamicTitle />

          <p className="mt-7 max-w-3xl text-base leading-8 text-starlight/58 md:text-lg">
            A BullCapital é a sala de leitura financeira para times que precisam transformar
            dados de mercado em briefing, análise e contexto explicável — com a estética sóbria
            do novo terminal.
          </p>

          <SearchBar />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/auth/sign-in?callbackUrl=/home" className="bull-action-primary">
              Entrar na plataforma
              <ArrowRight size={15} />
            </Link>
            <Link href="#visao-geral" className="bull-action">
              Ver dados ao vivo
            </Link>
          </div>

          <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              ['Briefing', 'Mesa da manhã com pulso de mercado.'],
              ['Terminal', 'Comparador e artefatos visuais.'],
              ['Copiloto', 'Perguntas com contexto rastreável.'],
            ].map(([label, text]) => (
              <div key={label} className="border-t border-white/[0.06] pt-3">
                <p className="bull-stat-label">{label}</p>
                <p className="mt-2 text-sm leading-6 text-starlight/50">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <HeroTerminalPreview />
      </section>

      <div className="z-10 mx-auto flex w-full max-w-[1560px] flex-col gap-24 px-6 pb-12 md:px-8 xl:px-10">
        <ProductPillars />

        <WorkflowSection />

        <LandingSectionHeading
          eyebrow="Mercado ao vivo"
          title="A camada pública também usa dados reais do pipeline."
          description="A vitrine abaixo é alimentada pelos mesmos snapshots de mercado que sustentam a área autenticada."
        />

        <Suspense fallback={<TopAssetsSection assets={[]} />}>
          <LandingTopAssetsPanel />
        </Suspense>

        <Suspense
          fallback={
            <MarketOverview
              temperature={null}
              radarData={[]}
              insightText="Dados reais de mercado indisponíveis no momento."
              assets={[]}
            />
          }
        >
          <LandingOverviewPanel />
        </Suspense>

        <Suspense fallback={<MarketHighlights gainers={[]} losers={[]} mostTraded={[]} />}>
          <LandingHighlightsPanel />
        </Suspense>
      </div>

      <Footer />
    </main>
  )
}
