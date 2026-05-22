const API_URL = process.env.ANALYSIS_API_URL ?? 'http://localhost:8001/api/v1'

export async function POST(req: Request) {
  const body = await req.json()

  let upstream: Response
  try {
    upstream = await fetch(`${API_URL}/conversation/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
