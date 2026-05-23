import NextAuth from 'next-auth'
import authConfig from '@/lib/auth.config'

const { auth } = NextAuth(authConfig)

const protectedRoutes = ['/home', '/asset', '/analysis', '/news', '/search']

const authRoutes = ['/auth/sign-in', '/auth/sign-up']

const publicApiRoutes = ['/api/auth']

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const pathname = nextUrl.pathname

  const isPublicApiRoute = publicApiRoutes.some((route) => pathname.startsWith(route))
  if (isPublicApiRoute) return

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  if (isAuthRoute && isLoggedIn) {
    return Response.redirect(new URL('/home', nextUrl))
  }

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  if (isProtectedRoute && !isLoggedIn) {
    const signInUrl = new URL('/auth/sign-in', nextUrl)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return Response.redirect(signInUrl)
  }

  return
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
