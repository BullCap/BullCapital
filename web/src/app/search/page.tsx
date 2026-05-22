import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getAssetNews } from '@/lib/services/market'
import SearchClient from '@/components/search/SearchClient'
import AccountMenu from '@/components/navigation/AccountMenu'
import AppDock from '@/components/navigation/AppDock'
import ScrollFocus from '@/components/ui/ScrollFocus'

export default async function SearchPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/sign-in')

  const [newsIbov, newsPetr, newsVale, newsItub] = await Promise.all([
    getAssetNews('^BVSP', 4),
    getAssetNews('PETR4', 3),
    getAssetNews('VALE3', 3),
    getAssetNews('ITUB4', 3),
  ])

  const seen = new Set<string>()
  const news = [...newsIbov, ...newsPetr, ...newsVale, ...newsItub]
    .filter((item) => {
      if (!item.link || seen.has(item.link)) return false
      seen.add(item.link)
      return true
    })
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, 8)

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col gap-5 px-4 pb-44 pt-6">
      <header className="flex items-start justify-between gap-4 px-1">
        <div>
          <p className="bull-eyebrow">BullCapital</p>
          <h1 className="mt-2 font-serif text-3xl text-[#F4F0FF]">Buscar ativo</h1>
          <p className="mt-1 text-sm text-[#DBEAFE]/55">Encontre ações, FIIs e BDRs da B3</p>
        </div>
        <AccountMenu />
      </header>

      <ScrollFocus>
        <SearchClient news={news} />
      </ScrollFocus>
      <AppDock active="search" />
    </main>
  )
}
