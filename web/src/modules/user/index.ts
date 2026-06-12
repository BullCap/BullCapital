// Public interface of the user module (auth/profile/tenancy — NextAuth + Prisma).
// Consumers import from '@/modules/user' only — never from internal files.
// Seam rules: docs/migracao-arquitetura.md §5.
export { handlers, signIn, signOut, auth } from '@/lib/auth'
export { getScope, requireScope, createWorkspaceForUser, ScopeError } from './scope'
export { createAiStreamToken } from './ai-stream-token'
export type { WorkspaceScope } from './scope'
export type { AiStreamTokenClaims, CreatedAiStreamToken } from './ai-stream-token'
