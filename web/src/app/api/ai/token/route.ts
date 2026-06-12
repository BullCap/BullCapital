import { z } from 'zod'
import { ANALYSIS_API_URL } from '@/lib/internal-api'
import { createAiStreamToken, requireScope, ScopeError } from '@/modules/user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STREAM_PATH = '/api/v1/conversation/stream'

const TokenRequestSchema = z
  .object({
    conversationId: z
      .string()
      .trim()
      .min(1)
      .max(128)
      .regex(/^[A-Za-z0-9._:-]+$/)
      .optional(),
  })
  .strict()

function noStoreJson(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers)
  headers.set('Cache-Control', 'no-store')
  return Response.json(body, { ...init, headers })
}

function normalizeStreamUrl(baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, '')
  if (base.endsWith('/conversation/stream')) return base
  if (base.endsWith('/api/v1')) return `${base}/conversation/stream`
  return `${base}${STREAM_PATH}`
}

function getStreamBaseUrl(): string | null {
  const publicUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL?.trim()
  if (publicUrl) return publicUrl
  return process.env.NODE_ENV === 'production' ? null : ANALYSIS_API_URL
}

async function readJson(req: Request): Promise<unknown> {
  const text = await req.text()
  if (!text.trim()) return {}
  return JSON.parse(text)
}

export async function POST(req: Request) {
  let scope
  try {
    scope = await requireScope()
  } catch (error) {
    if (error instanceof ScopeError) {
      return noStoreJson({ error: 'Não autorizado.' }, { status: 401 })
    }
    throw error
  }

  let payload: unknown
  try {
    payload = await readJson(req)
  } catch {
    return noStoreJson({ error: 'JSON inválido.' }, { status: 400 })
  }

  const parsed = TokenRequestSchema.safeParse(payload)
  if (!parsed.success) {
    return noStoreJson({ error: 'Payload inválido.' }, { status: 400 })
  }

  const secret = process.env.API_SHARED_SECRET?.trim()
  if (!secret) {
    return noStoreJson({ error: 'Serviço de IA não configurado.' }, { status: 503 })
  }

  const publicBaseUrl = getStreamBaseUrl()
  if (!publicBaseUrl) {
    return noStoreJson({ error: 'URL pública do serviço de IA não configurada.' }, { status: 503 })
  }

  const token = createAiStreamToken(scope, {
    secret,
    conversationId: parsed.data.conversationId,
  })

  return noStoreJson({
    streamUrl: normalizeStreamUrl(publicBaseUrl),
    token: token.token,
    tokenType: 'Bearer',
    expiresAt: token.expiresAt,
    expiresIn: token.expiresIn,
    conversationId: token.claims.conversationId,
  })
}
