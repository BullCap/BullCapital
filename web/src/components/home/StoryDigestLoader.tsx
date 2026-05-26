import { getNewsRadarItems } from '@/lib/news-radar'
import StoryDigestSection from './StoryDigestSection'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

export function StoryDigestSkeleton() {
  return (
    <section id="stories" className="bull-panel p-5 md:p-6">
      <GlassHighlight widthPercent={64} />
      <div>
        <div>
          <p className="bull-eyebrow">Histórias</p>
          <h2 className="mt-2 font-serif text-xl text-[#F4F0FF]">Radar</h2>
        </div>
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
