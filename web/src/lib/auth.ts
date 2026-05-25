import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/db'
import authConfig from '@/lib/auth.config'

const isProduction = process.env.NODE_ENV === 'production'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email
        const password = credentials?.password

        if (typeof email !== 'string' || typeof password !== 'string') return null
        if (!email || !password || password.length < 8) return null

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.passwordHash) return null

        const isValid = await compare(password, user.passwordHash)
        if (!isValid) return null

        return { id: user.id, email: user.email, name: user.name, image: user.image }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (token.id && session.user) session.user.id = token.id as string
      return session
    },
  },
  events: {
    async signIn(message) {
      console.log(`[AUTH] Sign-in completed via ${message.account?.provider ?? 'credentials'}`)
    },
    async signOut() {
      console.log('[AUTH] Sign-out completed')
    },
    async createUser(message) {
      console.log(`[AUTH] User created: ${message.user.id}`)
    },
  },
  logger: {
    error(error) {
      const e = error as Error
      console.error('[AUTH ERROR]', e.name, e.message)
    },
    warn(code) {
      console.warn('[AUTH WARNING]', code)
    },
    debug(code, metadata) {
      if (!isProduction) console.debug('[AUTH DEBUG]', code, metadata)
    },
  },
})
