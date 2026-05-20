import NextAuth from 'next-auth'
import authConfig from '@/lib/auth.config'

const { auth } = NextAuth(authConfig)

/**
 * Protected routes that require authentication
 */
const protectedRoutes = ['/dashboard', '/settings', '/portfolio']

/**
 * Auth routes that should redirect authenticated users
 */
const authRoutes = ['/sign-in', '/sign-up']

/**
 * API routes that should always be accessible
 */
const publicApiRoutes = ['/api/auth', '/']

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const pathname = nextUrl.pathname

  // Allow public API routes
  const isPublicApiRoute = publicApiRoutes.some((route) => pathname.startsWith(route))
  if (isPublicApiRoute) return

  // Redirect authenticated users away from auth pages
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  if (isAuthRoute && isLoggedIn) {
    return Response.redirect(new URL('/dashboard', nextUrl))
  }

  // Protect routes that require authentication
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  if (isProtectedRoute && !isLoggedIn) {
    const signInUrl = new URL('/sign-in', nextUrl)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return Response.redirect(signInUrl)
  }

  return
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
