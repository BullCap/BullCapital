import { createHmac, randomUUID } from 'node:crypto'
import type { WorkspaceScope } from './scope'

export const AI_STREAM_TOKEN_TTL_SECONDS = 5 * 60
export const AI_STREAM_TOKEN_ISSUER = 'bull-web-bff' as const
export const AI_STREAM_TOKEN_AUDIENCE = 'bull-ai-service' as const
export const AI_STREAM_TOKEN_PURPOSE = 'ai_sse' as const

export interface AiStreamTokenClaims {
  iss: typeof AI_STREAM_TOKEN_ISSUER
  aud: typeof AI_STREAM_TOKEN_AUDIENCE
  purpose: typeof AI_STREAM_TOKEN_PURPOSE
  sub: string
  workspaceId: string
  memberId: string
  role: WorkspaceScope['role']
  conversationId: string
  iat: number
  exp: number
  jti: string
}

export interface CreateAiStreamTokenOptions {
  secret: string
  conversationId?: string
  now?: Date
  ttlSeconds?: number
  jti?: string
}

export interface CreatedAiStreamToken {
  token: string
  claims: AiStreamTokenClaims
  expiresAt: string
  expiresIn: number
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function encodeJson(value: unknown): string {
  return base64url(JSON.stringify(value))
}

export function createAiStreamToken(
  scope: WorkspaceScope,
  options: CreateAiStreamTokenOptions
): CreatedAiStreamToken {
  const secret = options.secret.trim()
  if (!secret) throw new Error('API_SHARED_SECRET ausente.')

  const ttlSeconds = options.ttlSeconds ?? AI_STREAM_TOKEN_TTL_SECONDS
  const iat = Math.floor((options.now?.getTime() ?? Date.now()) / 1000)
  const exp = iat + ttlSeconds
  const conversationId = options.conversationId?.trim() || randomUUID()

  const claims: AiStreamTokenClaims = {
    iss: AI_STREAM_TOKEN_ISSUER,
    aud: AI_STREAM_TOKEN_AUDIENCE,
    purpose: AI_STREAM_TOKEN_PURPOSE,
    sub: scope.userId,
    workspaceId: scope.workspaceId,
    memberId: scope.memberId,
    role: scope.role,
    conversationId,
    iat,
    exp,
    jti: options.jti ?? randomUUID(),
  }

  const header = encodeJson({ alg: 'HS256', typ: 'JWT' })
  const payload = encodeJson(claims)
  const signingInput = `${header}.${payload}`
  const signature = base64url(createHmac('sha256', secret).update(signingInput).digest())

  return {
    token: `${signingInput}.${signature}`,
    claims,
    expiresAt: new Date(exp * 1000).toISOString(),
    expiresIn: ttlSeconds,
  }
}
