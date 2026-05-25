import { auth } from '@/lib/auth'
import { ANALYSIS_API_URL, internalApiHeaders } from '@/lib/internal-api'

const API_URL = ANALYSIS_API_URL

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return new Response('Não autorizado', { status: 401 })
  }

  const body = await req.json()

  let upstream: Response
  try {
    upstream = await fetch(`${API_URL}/conversation/stream`, {
      method: 'POST',
      headers: internalApiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    })
  } catch {
    return new Response('Serviço indisponível', { status: 502 })
  }

  if (!upstream.ok || !upstream.body) {
    return new Response('Falha no stream', { status: upstream.status })
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
