import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getMultipleQuotes } from '@/lib/services/market'
import TerminalClient from '@/components/terminal/TerminalClient'
import AppShell from '@/components/navigation/AppShell'

import type { AssetQuote } from '@/types/market'

export default async function TerminalPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/sign-in')

  // Pré-carrega dados reais das ações populares do mercado brasileiro
  const popularTickers = ['PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'TAEE11', 'MXRF11']
  let initialQuotes: AssetQuote[] = []

  try {
    const response = await getMultipleQuotes(popularTickers)
    initialQuotes = response?.results || []
  } catch (error) {
    console.error('Failed to pre-load popular quotes for comparator:', error)
  }

  return (
    <AppShell active="terminal" contentClassName="md:max-w-none">
      <header className="px-1 mb-2">
        <p className="bull-eyebrow">Comparador</p>
        <h1 className="mt-2 font-serif text-3xl md:text-4xl tracking-tight text-[#F4F0FF]">
          Terminal de comparação
        </h1>
        <p className="mt-1 text-sm text-[#DBEAFE]/55">
          Compare ativos lado a lado com cotações, fundamentos e radar, sem transformar análise em recomendação.
        </p>
      </header>

      <TerminalClient initialQuotes={initialQuotes} />
    </AppShell>
  )
}
