import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { normalizeTicker } from '@/lib/market-routing'
import AnalysisClient from '@/components/analysis/AnalysisClient'
import AppShell from '@/components/navigation/AppShell'

interface AnalysisPageProps {
  searchParams: Promise<{ ticker?: string | string[]; q?: string | string[]; source?: string | string[] }>
}

export default async function AnalysisPage({ searchParams }: AnalysisPageProps) {
  const session = await auth()
  if (!session?.user) redirect('/auth/sign-in')

  const params = await searchParams
  const rawTicker = Array.isArray(params.ticker) ? params.ticker[0] : params.ticker
  const ticker = rawTicker ? normalizeTicker(rawTicker) : undefined
  const focusLabel = ticker ? ticker.toUpperCase() : 'mercado'
  const initialQuestion = Array.isArray(params.q) ? params.q[0] : (params.q ?? undefined)
  const rawSource = Array.isArray(params.source) ? params.source[0] : params.source
  const source = rawSource === 'news' ? 'news' as const : undefined

  return (
    <AppShell active="analysis">
      <header className="px-1">
        <p className="bull-eyebrow">Advisor</p>
        <h1 className="mt-2 font-serif text-3xl text-[#F4F0FF]">Análises contextuais</h1>
        <p className="mt-1 text-sm text-[#F4F0FF]/50">
          Leituras ancoradas em ativo, evento ou indicador. Sem recomendação de compra ou venda.
        </p>
      </header>

      <AnalysisClient
        ticker={ticker}
        focusLabel={focusLabel}
        initialQuestion={initialQuestion}
        source={source}
      />
    </AppShell>
  )
}
