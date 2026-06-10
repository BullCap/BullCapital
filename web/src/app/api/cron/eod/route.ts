// EOD run — the one that matters (plan §6.2): quotes + daily OHLCV + macro/PTAX
// after the B3 close. Triggered by Vercel Cron; idempotent; lease-locked.
import {
  ingestAllQuotes,
  ingestAllHistories,
  ingestMacro,
  runIngestJob,
} from '@/modules/market/ingest'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const result = await runIngestJob('eod', 900, async () => {
    const quotes = await ingestAllQuotes()
    const histories = await ingestAllHistories('1mo')
    const macro = await ingestMacro()
    return {
      okCount: quotes.okCount + histories.okCount + macro.okCount,
      failCount: quotes.failCount + histories.failCount + macro.failCount,
    }
  })

  if (!result) {
    return Response.json({ skipped: 'lease held by another run' })
  }
  return Response.json(result)
}
