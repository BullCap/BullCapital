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
        <div className="flex flex-col divide-y divide-white/[0.06]">
          {news.map((item, i) => (
            <Link
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 py-3.5 first:pt-0 last:pb-0 transition hover:opacity-80"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-5 text-[#F4F0FF]/85 line-clamp-2 group-hover:text-[#F4F0FF]">
                  {item.title}
                </p>
                <p className="mt-1.5 text-[11px] text-[#DBEAFE]/45">
                  {item.publisher}
                  {item.publishedAt > 0 && (
                    <span className="ml-2 text-[#F4F0FF]/30">{timeAgo(item.publishedAt)}</span>
                  )}
                </p>
              </div>
              <ArrowUpRight
                size={14}
                className="mt-0.5 shrink-0 text-[#F4F0FF]/25 group-hover:text-[#F4F0FF]/55 transition"
              />
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
