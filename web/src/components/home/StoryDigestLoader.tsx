import { getNewsRadarItems } from '@/lib/news-radar'
import StoryDigestSection from './StoryDigestSection'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

export function StoryDigestSkeleton() {
  return (
    <section id="stories" className="bull-panel p-5 md:p-6" aria-hidden="true">
      <GlassHighlight widthPercent={64} />
      <div>
        <div>
          <p className="bull-eyebrow">Histórias</p>
          <h2 className="mt-2 font-serif text-xl text-[#F4F0FF]">Radar</h2>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <article key={i} className="bull-panel-quiet p-3.5 flex flex-col gap-2">
            {/* Ticker Badges Skeleton */}
            <div className="flex flex-wrap gap-1.5">
              {[0, 1].map((tickerIdx) => (
                <div
                  key={tickerIdx}
                  className="h-6 w-12 animate-pulse rounded border border-white/[0.04] bg-white/[0.03]"
                  style={{ animationDelay: `${i * 80 + tickerIdx * 30}ms` }}
                />
              ))}
            </div>

            {/* Headline Skeleton */}
            <div className="mt-2 space-y-1.5">
              <div
                className="h-4 w-11/12 animate-pulse rounded-full bg-white/[0.06]"
                style={{ animationDelay: `${i * 80 + 30}ms` }}
              />
              <div
                className="h-4 w-2/3 animate-pulse rounded-full bg-white/[0.05]"
                style={{ animationDelay: `${i * 80 + 50}ms` }}
              />
            </div>

            {/* StoryNote Brief Skeleton */}
            <div className="mt-2.5 space-y-1.5">
              <div
                className="h-3 w-full animate-pulse rounded-full bg-white/[0.04]"
                style={{ animationDelay: `${i * 80 + 70}ms` }}
              />
              <div
                className="h-3 w-5/6 animate-pulse rounded-full bg-white/[0.03]"
                style={{ animationDelay: `${i * 80 + 90}ms` }}
              />
            </div>

            {/* Footer metadata skeleton */}
            <div className="mt-3">
              <div
                className="h-3 w-28 animate-pulse rounded-full bg-white/[0.04]"
                style={{ animationDelay: `${i * 80 + 110}ms` }}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export async function StoryDigestLoader() {
  const stories = await getNewsRadarItems()
  return <StoryDigestSection stories={stories.slice(0, 4)} />
}
