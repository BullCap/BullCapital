'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Logo } from './Logo'
import { HeaderNav } from './HeaderNav'
import { UserMenu } from './UserMenu'
import { SignInButton } from './SignInButton'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

type User = {
  name?: string | null
  email?: string | null
  image?: string | null
}

export function Header({ user }: { user?: User }) {
  const [shrinks, setShrink] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setShrink(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (pathname?.startsWith('/api-docs')) {
    return null
  }

  return (
    <header
      className={`fixed left-0 right-0 z-50 mx-auto h-16 max-w-[90%] overflow-hidden rounded-full border border-white/10 bg-[#1A1625]/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-700 ease-in-out ${
        shrinks ? 'top-4 w-[924px]' : 'top-8 w-[1280px]'
      }`}
    >
      <GlassHighlight className="via-white/40" />
      <div className="relative mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <Logo />
        <HeaderNav />
        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
    </header>
  )
}
export default Header
