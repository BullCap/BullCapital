import { redirect } from 'next/navigation'
import { Suspense, cache } from 'react'
import { auth } from '@/lib/auth'
import { getTerminalMarketSnapshot } from '@/lib/services/market'
import TerminalClient from '@/components/terminal/TerminalClient'
import AppShell from '@/components/navigation/AppShell'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

const getTerminalBootstrap = cache(async () => {
  const snapshot = await getTerminalMarketSnapshot()
  return {
    initialQuotes: snapshot.quotes.results ?? [],
    marketStatus: { indices: snapshot.marketStatus.indices ?? [] },
    usdBrl: snapshot.currency.currencies.find((currency) => currency.name === 'USD/BRL') ?? null,
  }
})

async function TerminalWorkspace() {
  const { initialQuotes, marketStatus, usdBrl } = await getTerminalBootstrap()
  return <TerminalClient initialQuotes={initialQuotes} marketStatus={marketStatus} usdBrl={usdBrl} />
}

function TerminalWorkspaceFallback() {
  return (
    <section className="bull-frame mt-4 min-h-[460px] p-6">
      <GlassHighlight widthPercent={64} />
      <div className="flex h-full min-h-[408px] flex-col justify-between gap-6">
        <div>
          <p className="bull-eyebrow">Inteligência de Carteira</p>
          <h2 className="mt-2 font-serif text-2xl text-[#F4F0FF]">Preparando terminal</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#F4F0FF]/50">
            Cotações, status de mercado e leitura consolidada da carteira estão sendo atualizados.
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
          <p className="text-xs leading-6 text-[#F4F0FF]/40">
            Assim que os dados iniciais chegarem, a mesa abre com KPIs, performance,
            alocação, risco, eventos e posições consolidadas.
          </p>
        </div>
      </div>
    </section>
  )
}

export default async function TerminalPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/sign-in')

  return (
    <AppShell active="terminal" contentClassName="md:max-w-none" sessionUser={session.user}>
      <Suspense fallback={<TerminalWorkspaceFallback />}>
        <TerminalWorkspace />
      </Suspense>
    </AppShell>
  )
}
