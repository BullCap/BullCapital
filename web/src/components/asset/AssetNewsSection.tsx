import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import type { AssetNewsItem } from '@/types/market'

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp)
  if (seconds < 3600) return `há ${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `há ${Math.floor(seconds / 3600)}h`
  return `há ${Math.floor(seconds / 86400)}d`
}

interface AssetNewsSectionProps {
  news: AssetNewsItem[]
}

export function AssetNewsSectionSkeleton() {
  return (
    <section className="bull-panel p-5" aria-hidden="true">
      <GlassHighlight widthPercent={55} />
      <p className="bull-eyebrow mb-4">Notícias recentes</p>
      <div className="flex flex-col divide-y divide-white/[0.05]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-4 py-4 first:pt-0 last:pb-0">
            <div
              className="h-20 w-20 sm:h-20 sm:w-28 shrink-0 animate-pulse rounded-xl bg-white/[0.06]"
              style={{ animationDelay: `${i * 60}ms` }}
            />
            <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
              <div className="space-y-2">
                <div
                  className="h-3.5 w-full animate-pulse rounded-full bg-white/[0.06]"
                  style={{ animationDelay: `${i * 60 + 25}ms` }}
                />
                <div
                  className="h-3.5 w-4/5 animate-pulse rounded-full bg-white/[0.05]"
                  style={{ animationDelay: `${i * 60 + 50}ms` }}
                />
              </div>
              <div
                className="h-2.5 w-28 animate-pulse rounded-full bg-white/[0.04]"
                style={{ animationDelay: `${i * 60 + 75}ms` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function AssetNewsSection({ news }: AssetNewsSectionProps) {
  return (
    <section className="bull-panel p-5">
      <GlassHighlight widthPercent={55} />

      <p className="bull-eyebrow mb-4">Notícias recentes</p>

      {news.length === 0 ? (
        <div className="flex h-24 items-center justify-center">
          <p className="text-sm text-[#F4F0FF]/40">Nenhuma notícia disponível</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-white/[0.05]">
          {news.map((item, i) => (
            <Link
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex gap-4 py-4 first:pt-0 last:pb-0 transition hover:opacity-95"
            >
              {/* Thumbnail image block on the left */}
              <div className="relative h-20 w-20 sm:h-20 sm:w-28 shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-black/30 select-none">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#8B5CF6]/15 to-[#0D0B14]/40">
                    <span className="text-[10px] font-bold text-[#8B5CF6] tracking-widest leading-none">BULL</span>
                  </div>
                )}
              </div>

              {/* Title & Metadata details */}
              <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                <div>
                  <p className="text-sm font-semibold leading-snug text-[#F4F0FF]/85 group-hover:text-[#C4B5FD] transition-colors duration-300 line-clamp-2">
                    {item.title}
                  </p>
                </div>
                
                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#DBEAFE]/40 leading-none">
                  <span className="font-semibold text-[#F4F0FF]/35">{item.publisher}</span>
                  {item.publishedAt > 0 && (
                    <>
                      <span className="text-[#F4F0FF]/15">•</span>
                      <span>{timeAgo(item.publishedAt)}</span>
                    </>
                  )}
                </p>
              </div>

              <ArrowUpRight
                size={14}
                className="mt-0.5 shrink-0 text-[#F4F0FF]/25 group-hover:text-[#F4F0FF]/65 transition duration-300"
              />
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
