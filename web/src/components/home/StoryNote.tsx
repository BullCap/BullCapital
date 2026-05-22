import { getStoryBrief } from '@/lib/actions/story-brief'

interface StoryNoteProps {
  headline: string
  tickers: string[]
  fallback: string
}

export async function StoryNote({ headline, tickers, fallback }: StoryNoteProps) {
  const brief = await getStoryBrief(headline, tickers)
  return (
    <p className="mt-2 text-sm leading-5 text-[#F4F0FF]/62">{brief ?? fallback}</p>
  )
}

export function StoryNoteSkeleton() {
  return (
    <div className="mt-2 space-y-1.5" aria-hidden>
      <div className="h-3 w-full animate-pulse rounded-full bg-white/[0.06]" />
      <div className="h-3 w-4/5 animate-pulse rounded-full bg-white/[0.05]" style={{ animationDelay: '80ms' }} />
    </div>
  )
}
