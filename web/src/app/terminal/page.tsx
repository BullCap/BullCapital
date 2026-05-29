import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getCurrencyRates, getMarketStatus, getMultipleQuotes } from '@/lib/services/market'
import TerminalClient from '@/components/terminal/TerminalClient'
import AppShell from '@/components/navigation/AppShell'

import type { AssetQuote, CurrencyRate, MarketStatusData } from '@/types/market'

export default async function TerminalPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/sign-in')

  // Pré-carrega dados reais dos ativos padrão da mesa.
  const defaultTickers = ['PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'TAEE11', 'MXRF11']
  let initialQuotes: AssetQuote[] = []
  let marketStatus: MarketStatusData = { indices: [] }
  let usdBrl: CurrencyRate | null = null

  try {
    const [response, status, fxData] = await Promise.all([
      getMultipleQuotes(defaultTickers),
      getMarketStatus(),
      getCurrencyRates(['USD-BRL']),
    ])
    initialQuotes = response?.results || []
    marketStatus = { indices: status.indices ?? [] }
    usdBrl = fxData.currencies.find((currency) => currency.name === 'USD/BRL') ?? null
  } catch (error) {
    console.error('Failed to pre-load terminal market data:', error)
  }

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

      <TerminalClient initialQuotes={initialQuotes} marketStatus={marketStatus} usdBrl={usdBrl} />
    </AppShell>
  )
}
