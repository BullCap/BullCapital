import { getNewsRadarItems } from '@/lib/news-radar'
import StoryDigestSection from './StoryDigestSection'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function StoryDigestSkeleton() {
  return (
    <section id="stories" className="bull-panel p-5 md:p-6">
      <GlassHighlight widthPercent={64} />
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="bull-eyebrow">Historias do dia</p>
          <h2 className="mt-2 font-serif text-xl text-[#F4F0FF]">O que mudou no radar</h2>
        </div>
        <Link
          href="/news"
          className="inline-flex min-h-9 items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-3 text-xs text-[#F4F0FF]/75 transition hover:bg-white/[0.1] hover:text-[#F4F0FF]"
        >
          Abrir radar
          <ArrowRight size={13} />
        </Link>
      </div>
      <div className="mt-5 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bull-panel-quiet h-28 animate-pulse p-3.5" />
        ))}
      </div>
    </section>
  )
}

export async function StoryDigestLoader() {
  const stories = await getNewsRadarItems()
  return <StoryDigestSection stories={stories.slice(0, 4)} />
}
