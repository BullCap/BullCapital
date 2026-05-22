import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { normalizeTicker } from '@/lib/market-routing'
import AnalysisClient from '@/components/analysis/AnalysisClient'
import AppDock from '@/components/navigation/AppDock'

interface AnalysisPageProps {
  searchParams: Promise<{ ticker?: string | string[] }>
}

export default async function AnalysisPage({ searchParams }: AnalysisPageProps) {
  const session = await auth()
  if (!session?.user) redirect('/auth/sign-in')

  const params = await searchParams
  const rawTicker = Array.isArray(params.ticker) ? params.ticker[0] : params.ticker
  const ticker = rawTicker ? normalizeTicker(rawTicker) : undefined
  const focusLabel = ticker ? ticker.toUpperCase() : 'mercado'

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col gap-5 px-4 pb-44 pt-6">
      <header className="px-1">
        <p className="bull-eyebrow">BullCapital Advisor</p>
        <h1 className="mt-2 font-serif text-3xl text-[#F4F0FF]">Análises</h1>
        <p className="mt-1 text-sm text-[#F4F0FF]/50">Leituras guiadas por contexto.</p>
      </header>

      <AnalysisClient ticker={ticker} focusLabel={focusLabel} />

      <AppDock active="analysis" ticker={ticker} />
    </main>
  )
}
