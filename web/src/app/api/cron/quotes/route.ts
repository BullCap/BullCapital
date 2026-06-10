// Intraday quote refresh — best-effort during the B3 session (plan §6.2).
// Triggered by Vercel Cron; idempotent; lease-locked against concurrent runs.
import { ingestAllQuotes, isB3Session, runIngestJob } from '@/modules/market/ingest'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (!isB3Session()) {
    return Response.json({ skipped: 'outside B3 session' })
  }

  const result = await runIngestJob('quotes-intraday', 240, ingestAllQuotes)
  if (!result) {
    return Response.json({ skipped: 'lease held by another run' })
  }
  return Response.json(result)
}
