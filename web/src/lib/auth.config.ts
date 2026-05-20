import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

/**
 * Edge-compatible auth config used by middleware.
 * MUST NOT import or reference any Node.js-only modules (pg, bcryptjs, etc.)
 * The authorize callback lives in auth.ts which runs in the Node.js runtime.
 */
export default {
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      // authorize callback is in auth.ts (Node.js runtime only)
    }),
  ],
  pages: {
    signIn: '/auth/sign-in',
    error: '/auth/sign-in',
  },
} satisfies NextAuthConfig
