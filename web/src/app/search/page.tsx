import { redirect } from 'next/navigation'
import { Suspense, cache } from 'react'
import { auth } from '@/lib/auth'
import { getAssetNews } from '@/modules/market'
import SearchClient, { RecentNewsWidget } from '@/components/search/SearchClient'
import AppShell from '@/components/navigation/AppShell'
import ScrollFocus from '@/components/ui/ScrollFocus'

const getSearchNews = cache(async () => {
  const [newsIbov, newsPetr, newsVale, newsItub] = await Promise.all([
    getAssetNews('^BVSP', 4),
    getAssetNews('PETR4', 3),
    getAssetNews('VALE3', 3),
    getAssetNews('ITUB4', 3),
  ])

  const seen = new Set<string>()
  return [...newsIbov, ...newsPetr, ...newsVale, ...newsItub]
    .filter((item) => {
      if (!item.link || seen.has(item.link)) return false
      seen.add(item.link)
      return true
    })
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, 8)
})

async function RecentNewsPanel() {
  const news = await getSearchNews()
  return <RecentNewsWidget news={news} />
}

export default async function SearchPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/sign-in')

  return (
    <AppShell active="search" sessionUser={session.user}>
      <header className="bull-page-header">
        <div>
          <p className="bull-eyebrow">Pesquisa</p>
          <h1 className="bull-page-title mt-2">Buscar ativo</h1>
          <p className="bull-page-subtitle mt-1">
            Encontre ações, FIIs, cripto e renda fixa para abrir análise contextual.
          </p>
        </div>
      </header>

      <ScrollFocus>
        <SearchClient
          mobileNews={
            <Suspense fallback={<RecentNewsWidget news={[]} />}>
              <RecentNewsPanel />
            </Suspense>
          }
          desktopNews={
            <Suspense fallback={<RecentNewsWidget news={[]} />}>
              <RecentNewsPanel />
            </Suspense>
          }
        />
      </ScrollFocus>
    </AppShell>
  )
}
