// Tenancy scope resolution (workspace → assessor → cliente). Every data-layer
// function in domain modules takes a resolved WorkspaceScope — queries never
// run with tenant bounds derived ad hoc from the session at call sites.
import { cache } from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { WorkspaceRole } from '@/generated/prisma/client'

export interface WorkspaceScope {
  userId: string
  workspaceId: string
  /** WorkspaceMember id of the acting advisor — FK target of portfolio.clients. */
  memberId: string
  role: WorkspaceRole
}

export class ScopeError extends Error {
  constructor(readonly reason: 'unauthenticated' | 'no-workspace') {
    super(reason === 'unauthenticated' ? 'Sessão ausente ou expirada.' : 'Usuário sem workspace.')
    this.name = 'ScopeError'
  }
}

/** Creates a personal workspace with the user as OWNER (signup + lazy backfill). */
export async function createWorkspaceForUser(userId: string, name?: string | null) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  const workspace = await prisma.workspace.create({
    data: {
      name: name ?? user.name ?? user.email.split('@')[0],
      members: { create: { userId, role: 'OWNER' } },
    },
    include: { members: true },
  })
  return workspace.members[0]
}

/**
 * Resolves the caller's scope from the NextAuth session. Deduped per request
 * (React cache). Users created outside the signup action (e.g. a future OAuth
 * adapter flow) get their workspace lazily on first resolution.
 */
export const getScope = cache(async (): Promise<WorkspaceScope | null> => {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return null

  const membership =
    (await prisma.workspaceMember.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })) ?? (await createWorkspaceForUser(userId))

  return {
    userId,
    workspaceId: membership.workspaceId,
    memberId: membership.id,
    role: membership.role,
  }
})

/** Scope or throw — for BFF routes/server actions that require a tenant. */
export async function requireScope(): Promise<WorkspaceScope> {
  const scope = await getScope()
  if (!scope) throw new ScopeError('unauthenticated')
  return scope
}
