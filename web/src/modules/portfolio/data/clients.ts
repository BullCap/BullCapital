// Clients of the workspace (a âncora de tenancy do domínio portfolio — o
// domínio completo de carteira entra via Spec Kit, D10). Every function takes
// a resolved WorkspaceScope: no query runs without tenant bounds.
import { prisma } from '@/lib/db'
import type { WorkspaceScope } from '@/modules/user'

export interface ClientInput {
  name: string
  cpf?: string | null
  email?: string | null
}

/** CPF normalizado para 11 dígitos — chave do FGC por CPF×instituição (A2). */
export function normalizeCpf(cpf: string | null | undefined): string | null {
  if (!cpf) return null
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) throw new Error('CPF deve ter 11 dígitos.')
  return digits
}

export function listClients(scope: WorkspaceScope) {
  return prisma.client.findMany({
    where: { workspaceId: scope.workspaceId, status: 'ACTIVE' },
    orderBy: { name: 'asc' },
  })
}

export function getClient(scope: WorkspaceScope, id: string) {
  return prisma.client.findFirst({
    where: { id, workspaceId: scope.workspaceId },
  })
}

export function createClient(scope: WorkspaceScope, input: ClientInput) {
  return prisma.client.create({
    data: {
      workspaceId: scope.workspaceId,
      advisorId: scope.memberId,
      name: input.name,
      cpf: normalizeCpf(input.cpf),
      email: input.email || null,
    },
  })
}

export async function updateClient(scope: WorkspaceScope, id: string, input: Partial<ClientInput>) {
  const { count } = await prisma.client.updateMany({
    where: { id, workspaceId: scope.workspaceId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.cpf !== undefined && { cpf: normalizeCpf(input.cpf) }),
      ...(input.email !== undefined && { email: input.email || null }),
    },
  })
  return count > 0 ? getClient(scope, id) : null
}

export async function archiveClient(scope: WorkspaceScope, id: string): Promise<boolean> {
  const { count } = await prisma.client.updateMany({
    where: { id, workspaceId: scope.workspaceId },
    data: { status: 'ARCHIVED' },
  })
  return count > 0
}
