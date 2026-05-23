import { redirect } from 'next/navigation'
import { Newspaper } from 'lucide-react'
import { auth } from '@/lib/auth'
import { getWatchlist } from '@/lib/actions/watchlist'
import { getNewsRadarItems } from '@/lib/news-radar'
import AppShell from '@/components/navigation/AppShell'
import NewsRadarFeed from '@/components/news/NewsRadarFeed'
import ScrollFocus from '@/components/ui/ScrollFocus'

export default async function NewsPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/sign-in')

  const watchlist = await getWatchlist()
  const items = await getNewsRadarItems(watchlist)
  const followedStories = items.filter((item) => item.scopes.includes('watchlist')).length

  return (
    <AppShell active="news" contentClassName="md:max-w-4xl">
      <header className="px-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="bull-eyebrow">Radar</p>
            <h1 className="mt-2 font-serif text-3xl text-[#F4F0FF]">Notícias</h1>
            <p className="mt-1 max-w-xl text-sm leading-6 text-[#DBEAFE]/55">
              Manchetes confirmadas para cruzar fonte, ativo e contexto.
            </p>
          </div>
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-[1rem] border border-[#60A5FA]/20 bg-[#3B82F6]/12 text-[#DBEAFE]/78"
          >
            <Newspaper size={19} />
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="bull-chip">{items.length} historias</span>
          <span className="bull-chip">{followedStories} da sua lista</span>
        </div>
      </header>

      <ScrollFocus>
        <NewsRadarFeed hasWatchlist={watchlist.length > 0} items={items} />
      </ScrollFocus>
    </AppShell>
  )
}
