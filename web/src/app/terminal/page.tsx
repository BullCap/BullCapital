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
    <section className="bull-panel mt-4 min-h-[460px] p-6">
      <GlassHighlight widthPercent={64} />
      <div className="flex h-full min-h-[408px] flex-col justify-between gap-6">
        <div>
          <p className="bull-eyebrow">Mesa</p>
          <h2 className="mt-2 font-serif text-2xl text-[#F4F0FF]">Preparando terminal</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#F4F0FF]/50">
            Cotações, status de mercado e câmbio estão sendo atualizados.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]">
          <div className="min-h-[18rem] rounded-[1.75rem] border border-white/[0.08] bg-black/20" />
          <div className="min-h-[18rem] rounded-[1.75rem] border border-white/[0.08] bg-black/20" />
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
      <header className="px-1 mb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#F4F0FF]/35">
          Mesa do Analista
        </p>
        <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-[#F4F0FF]">
          Terminal Bull
        </h1>
      </header>

      <Suspense fallback={<TerminalWorkspaceFallback />}>
        <TerminalWorkspace />
      </Suspense>
    </AppShell>
  )
}
