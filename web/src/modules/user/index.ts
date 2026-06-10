// Public interface of the user module (auth/profile — NextAuth + Prisma).
// Consumers import from '@/modules/user' only — never from internal files.
// Seam rules: docs/migracao-arquitetura.md §5.
export { handlers, signIn, signOut, auth } from '@/lib/auth'
