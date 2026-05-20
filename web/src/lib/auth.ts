import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/db'
import authConfig from '@/lib/auth.config'

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
      console.log(
        `✅ [AUTH LOG] User signed in! Provider: ${message.account?.provider} | Email: ${message.user.email}`
      )
    },
    async signOut() {
      console.log('✅ [AUTH LOG] User signed out')
    },
    async createUser(message) {
      console.log(`✅ [AUTH LOG] New user created: ${message.user.email}`)
    },
  },
  logger: {
    error(error) {
      console.error('❌ [AUTH ERROR]', error.name, error.message)
    },
    warn(code) {
      console.warn('⚠️ [AUTH WARNING]', code)
    },
    debug(code, metadata) {
      console.debug('🐛 [AUTH DEBUG]', code, metadata)
    },
  },
})
