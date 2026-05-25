import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getAssetNews } from '@/lib/services/market'
import SearchClient from '@/components/search/SearchClient'
import AppShell from '@/components/navigation/AppShell'
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
    <AppShell active="search">
      <header className="px-1">
        <p className="bull-eyebrow">Busca</p>
        <h1 className="mt-2 font-serif text-3xl text-[#F4F0FF]">Buscar ativo</h1>
        <p className="mt-1 text-sm text-[#DBEAFE]/55">
          Encontre ativos da B3 e abra leituras com preço, histórico, fundamentos e notícias.
        </p>
      </header>

      <ScrollFocus>
        <SearchClient news={news} />
      </ScrollFocus>
    </AppShell>
  )
}
