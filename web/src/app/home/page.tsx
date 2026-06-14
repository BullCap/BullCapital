import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import AppShell from '@/components/navigation/AppShell'
import { getMarketPulseSnapshot } from '@/modules/market'
import { isMarketOpen } from '@/lib/market-utils'
import { DailyBriefContent, DailyBriefSkeleton } from '@/components/home/DailyBriefContent'
import { HomeMarketSections, HomeMarketSectionsSkeleton } from '@/components/home/HomeMarketSections'
import { buildHeaderViews, type BriefPulseData } from '@/components/home/header-views'
import { getScope } from '@/modules/user/scope'
import { listClients } from '@/modules/portfolio'
import type { MarketPulseSnapshot } from '@/types/market'

const norm = (symbol: string) => symbol.replace(/[\^/-]/g, '').toUpperCase()

function quoteOf(snapshot: MarketPulseSnapshot, symbol: string) {
  return snapshot.quotes.results.find((quote) => norm(quote.symbol) === norm(symbol)) ?? null
}

function closesOf(snapshot: MarketPulseSnapshot, ...candidates: string[]): number[] {
  const wanted = candidates.map(norm)
  const result = snapshot.history.results.find((entry) => wanted.includes(norm(entry.symbol)))
  if (!result) return []
  return result.history
    .map((point) => point.close)
    .filter((close): close is number => close !== null && close !== undefined)
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const parsed = typeof value === 'number' ? value : Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function buildPulse(snapshot: MarketPulseSnapshot): BriefPulseData {
  const ibov = quoteOf(snapshot, '^BVSP')
  const sp500 = quoteOf(snapshot, '^GSPC')
  const vix = quoteOf(snapshot, '^VIX')
  const usdBrl = snapshot.currency.currencies.find((rate) => rate.name?.toUpperCase().includes('USD')) ?? null
  const usdBrlChange =
    usdBrl && usdBrl.lowPrice > 0
      ? +(((usdBrl.bidPrice - usdBrl.lowPrice) / usdBrl.lowPrice) * 100).toFixed(2)
      : null

  const selicSeries = snapshot.indicators.selic
    .map((entry) => toNumber(entry.value))
    .filter((value): value is number => value !== null)
  const selicLatest = selicSeries[0] ?? null

  return {
    ibovPrice: ibov?.regularMarketPrice ?? null,
    ibovChange: ibov?.regularMarketChangePercent ?? null,
    ibovHistory: closesOf(snapshot, '^BVSP'),
    sp500Change: sp500?.regularMarketChangePercent ?? null,
    sp500History: closesOf(snapshot, '^GSPC'),
    vix: vix?.regularMarketPrice ?? null,
    vixHistory: closesOf(snapshot, '^VIX'),
    selicValue:
      selicLatest !== null
        ? `${selicLatest.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
        : null,
    selicHistory: [...selicSeries].reverse(),
    usdBrlPrice: usdBrl?.bidPrice ?? null,
    usdBrlChange,
    usdBrlHistory: closesOf(snapshot, 'USD-BRL', 'USD/BRL'),
    marketOpen: isMarketOpen(),
  }
}

async function clientCountForScope(): Promise<number | null> {
  try {
    const scope = await getScope()
    if (!scope) return null
    return (await listClients(scope)).length
  } catch {
    return null
  }
}

async function HomeBrief({ dateLabel }: { dateLabel: string }) {
  const [snapshot, clientCount] = await Promise.all([getMarketPulseSnapshot(), clientCountForScope()])
  const pulse = buildPulse(snapshot)
  const views = buildHeaderViews(pulse, snapshot.indicators, { clientCount })

  const updatedLabel = snapshot.updatedAt
    ? new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      }).format(new Date(snapshot.updatedAt))
    : null

  return (
    <DailyBriefContent
      ibovChange={pulse.ibovChange}
      sp500Change={pulse.sp500Change}
      vix={pulse.vix}
      selicValue={pulse.selicValue}
      marketOpen={pulse.marketOpen}
      storyHeadlines={[]}
      contextLine={updatedLabel ? `atualizado às ${updatedLabel}` : 'leitura consolidada do dia'}
      dateLabel={dateLabel}
      storiesCount={0}
      views={views}
    />
  )
}

export default async function HomePage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/sign-in')

  const dateLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
  }).format(new Date())

  const brt = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const hour = brt.getHours()
  const firstName =
    session.user.name?.trim().split(/\s+/)[0] ?? session.user.email?.split('@')[0] ?? 'você'
  const greetingStart = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <AppShell
      active="market"
      contentClassName="md:max-w-none xl:max-w-[1560px] 2xl:max-w-[1720px]"
      sessionUser={session.user}
    >
      <header className="px-1">
        <h1 className="font-serif text-display font-medium text-ink">
          {greetingStart}, <span className="text-amethyst-light">{firstName}</span>.
        </h1>
      </header>

      <Suspense fallback={<DailyBriefSkeleton />}>
        <HomeBrief dateLabel={dateLabel} />
      </Suspense>

      <Suspense fallback={<HomeMarketSectionsSkeleton />}>
        <HomeMarketSections />
      </Suspense>
    </AppShell>
  )
}
