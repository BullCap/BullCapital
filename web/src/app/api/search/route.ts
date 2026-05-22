import { NextRequest, NextResponse } from 'next/server'
import { searchAssets } from '@/lib/services/market'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (q.trim().length < 2) {
    return NextResponse.json({ results: [] })
  }
  const data = await searchAssets(q.trim(), 8)
  return NextResponse.json({ results: data.results })
}
