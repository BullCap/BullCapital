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
      className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors duration-300 ${
        optimisticFollowing
          ? 'border-[#82759F]/35 bg-[#82759F]/12 text-[#B1A9C4] hover:bg-[#82759F]/18'
          : 'border-white/[0.07] bg-white/[0.025] text-[#F4F0FF]/70 hover:border-white/[0.12] hover:bg-white/[0.045] hover:text-[#F4F0FF]'
      }`}
    >
      {optimisticFollowing ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
      {optimisticFollowing ? 'Seguindo' : 'Seguir'}
    </button>
  )
}
