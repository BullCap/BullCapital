'use client'

import { useOptimistic, useTransition } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { followTicker, unfollowTicker } from '@/lib/actions/watchlist'

interface FollowButtonProps {
  ticker: string
  initialFollowing: boolean
}

export default function FollowButton({ ticker, initialFollowing }: FollowButtonProps) {
  const [optimisticFollowing, setOptimisticFollowing] = useOptimistic(initialFollowing)
  const [, startTransition] = useTransition()

  function toggle() {
    const next = !optimisticFollowing
    startTransition(async () => {
      setOptimisticFollowing(next)
      if (next) {
        await followTicker(ticker)
      } else {
        await unfollowTicker(ticker)
      }
    })
  }

  return (
    <button
      onClick={toggle}
      aria-label={optimisticFollowing ? `Deixar de seguir ${ticker}` : `Seguir ${ticker}`}
      className={`inline-flex min-h-10 items-center gap-2 rounded-2xl border px-4 text-sm transition hover:-translate-y-0.5 ${
        optimisticFollowing
          ? 'border-[#8B5CF6]/40 bg-[#8B5CF6]/15 text-[#C4B5FD] hover:bg-[#8B5CF6]/22'
          : 'border-white/10 bg-white/[0.05] text-[#F4F0FF]/70 hover:bg-white/[0.09] hover:text-[#F4F0FF]'
      }`}
    >
      {optimisticFollowing ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
      {optimisticFollowing ? 'Seguindo' : 'Seguir'}
    </button>
  )
}
