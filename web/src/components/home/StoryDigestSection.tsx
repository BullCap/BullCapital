import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

export interface StoryDigestItem {
  headline: string
  href: string
  note: string
  publishedAt: number
  publisher: string
  relatedHref?: string
  relatedLabel?: string
  tickers: string[]
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp)
  if (seconds < 3600) return `ha ${Math.max(1, Math.floor(seconds / 60))}m`
  if (seconds < 86400) return `ha ${Math.floor(seconds / 3600)}h`
  return `ha ${Math.floor(seconds / 86400)}d`
}

interface StoryDigestSectionProps {
  stories: StoryDigestItem[]
}

export default function StoryDigestSection({ stories }: StoryDigestSectionProps) {
  return (
    <section id="stories" className="bull-panel p-5 md:p-6">
      <GlassHighlight widthPercent={64} />

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="bull-eyebrow">Historias do dia</p>
          <h2 className="mt-2 font-serif text-xl text-[#F4F0FF]">O que mudou no radar</h2>
        </div>
        <Link
          href="/search"
          className="inline-flex min-h-9 items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-3 text-xs text-[#F4F0FF]/75 transition hover:bg-white/[0.1] hover:text-[#F4F0FF]"
        >
          Ver mais
          <ArrowRight size={13} />
        </Link>
      </div>

      {stories.length === 0 ? (
        <div className="mt-5 flex h-28 items-center justify-center rounded-[1.5rem] border border-white/[0.06] bg-black/15 px-6 text-center">
          <p className="text-sm text-[#F4F0FF]/42">Nenhuma historia relevante disponivel agora.</p>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {stories.map((story) => (
            <article key={story.href} className="bull-panel-quiet p-3.5">
              <div className="flex flex-wrap gap-2">
                {story.tickers.map((ticker) => (
                  <span key={`${story.href}-${ticker}`} className="bull-chip min-h-7 px-2.5 py-1 text-[11px]">
                    {ticker}
                  </span>
                ))}
              </div>

              <Link
                href={story.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-3 block"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[15px] font-medium leading-6 text-[#F4F0FF] group-hover:text-white">
                    {story.headline}
                  </h3>
                  <ArrowUpRight
                    size={14}
                    className="mt-1 shrink-0 text-[#F4F0FF]/25 transition group-hover:text-[#F4F0FF]/55"
                  />
                </div>
              </Link>

                <p className="mt-2 text-sm leading-5 text-[#F4F0FF]/62">{story.note}</p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#DBEAFE]/42">
                  {story.publisher}
                  {story.publishedAt > 0 ? ` · ${timeAgo(story.publishedAt)}` : ''}
                </p>
                {story.relatedHref && story.relatedLabel ? (
                  <Link
                    href={story.relatedHref}
                    className="inline-flex min-h-9 items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-3 text-xs text-[#F4F0FF]/76 transition hover:bg-white/[0.1] hover:text-[#F4F0FF]"
                  >
                    {story.relatedLabel}
                    <ArrowRight size={13} />
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
