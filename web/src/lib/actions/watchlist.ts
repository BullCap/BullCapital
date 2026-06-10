'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { normalizeTicker } from '@/lib/market-routing'

async function requireUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('unauthenticated')
  return session.user.id
}

export async function getWatchlist(): Promise<string[]> {
  try {
    const userId = await requireUserId()
    const items = await prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { ticker: true },
    })
    return items.map((i) => i.ticker)
  } catch {
    return []
  }
}

export async function followTicker(ticker: string): Promise<void> {
  const normalized = normalizeTicker(ticker)
  if (!normalized) return
  const userId = await requireUserId()
  await prisma.watchlistItem.upsert({
    where: { userId_ticker: { userId, ticker: normalized } },
    create: { userId, ticker: normalized },
    update: {},
  })
  revalidatePath('/home')
  revalidatePath(`/asset/${normalized}`)
}

export async function unfollowTicker(ticker: string): Promise<void> {
  const normalized = normalizeTicker(ticker)
  if (!normalized) return
  const userId = await requireUserId()
  await prisma.watchlistItem.deleteMany({ where: { userId, ticker: normalized } })
  revalidatePath('/home')
  revalidatePath(`/asset/${normalized}`)
}

export async function isFollowing(ticker: string): Promise<boolean> {
  try {
    const normalized = normalizeTicker(ticker)
    if (!normalized) return false
    const userId = await requireUserId()
    const item = await prisma.watchlistItem.findUnique({
      where: { userId_ticker: { userId, ticker: normalized } },
      select: { id: true },
    })
    return item !== null
  } catch {
    return false
  }
}
