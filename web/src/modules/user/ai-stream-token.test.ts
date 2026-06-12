import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { createAiStreamToken } from './ai-stream-token'
import type { WorkspaceScope } from './scope'

const scope: WorkspaceScope = {
  userId: 'user-1',
  workspaceId: 'workspace-1',
  memberId: 'member-1',
  role: 'OWNER',
}

function decodeSegment<T>(segment: string): T {
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8')) as T
}

function sign(input: string, secret: string): string {
  return createHmac('sha256', secret).update(input).digest('base64url')
}

describe('createAiStreamToken', () => {
  it('creates an HS256 token scoped to the workspace and conversation', () => {
    const created = createAiStreamToken(scope, {
      secret: 'shared-secret',
      conversationId: 'conv-1',
      now: new Date('2026-06-11T12:00:00.000Z'),
      ttlSeconds: 60,
      jti: 'token-1',
    })

    const [header, payload, signature] = created.token.split('.')

    expect(decodeSegment(header)).toEqual({ alg: 'HS256', typ: 'JWT' })
    expect(decodeSegment(payload)).toMatchObject({
      iss: 'bull-web-bff',
      aud: 'bull-ai-service',
      purpose: 'ai_sse',
      sub: 'user-1',
      workspaceId: 'workspace-1',
      memberId: 'member-1',
      role: 'OWNER',
      conversationId: 'conv-1',
      iat: 1781179200,
      exp: 1781179260,
      jti: 'token-1',
    })
    expect(signature).toBe(sign(`${header}.${payload}`, 'shared-secret'))
    expect(created.expiresAt).toBe('2026-06-11T12:01:00.000Z')
    expect(created.expiresIn).toBe(60)
  })

  it('fails closed when the shared secret is missing', () => {
    expect(() => createAiStreamToken(scope, { secret: '   ' })).toThrow('API_SHARED_SECRET')
  })
})
