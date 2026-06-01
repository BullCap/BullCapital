'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Newspaper, Search, Sparkles, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

const NAV_ITEMS = [
  { label: 'Mercado', href: '/home', icon: BarChart3 },
  { label: 'Notícias', href: '/news', icon: Newspaper },
  { label: 'Buscar', href: '/search', icon: Search },
  { label: 'Terminal', href: '/terminal', icon: Terminal },
  { label: 'Análises', href: '/analysis', icon: Sparkles },
] as const

function isNavActive(itemHref: string, pathname: string): boolean {
  if (itemHref === '/home') return pathname === '/home'
  return pathname.startsWith(itemHref)
}

interface AppHeaderProps {
  initials?: string
}

export default function AppHeader({ initials }: AppHeaderProps) {
  const [shrinks, setShrink] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setShrink(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed left-0 right-0 z-50 backdrop-blur-2xl transition-all duration-700 ease-in-out',
        // Mobile: flat full-width sticky bar
        'top-0 border-b border-white/[0.07] bg-[#0f0c18]/80',
        // Desktop: animated pill shape
        'lg:mx-auto lg:overflow-hidden lg:rounded-full lg:border lg:border-white/10 lg:bg-[#0f0c18]/55 lg:shadow-[inset_0_1px_1px_rgba(255,255,255,0.09),inset_0_-2px_6px_rgba(0,0,0,0.5),0_12px_32px_rgba(0,0,0,0.55)]',
        shrinks ? 'lg:top-2 lg:max-w-[780px]' : 'lg:top-4 lg:max-w-[92%]'
      )}
    >
      <GlassHighlight className="hidden lg:block via-white/30" />
      {/* Safe-area spacer for notched devices — mobile only */}
      <div className="lg:hidden" style={{ height: 'env(safe-area-inset-top)' }} aria-hidden="true" />

      <div className="relative flex h-14 items-center justify-between px-5 gap-3">
        {/* Logo */}
        <Link href="/home" className="bull-wordmark shrink-0" aria-label="BullCapital home">
          <span className="bull-brand-mark" />
          <span className="hidden items-baseline font-serif font-bold text-[#F4F0FF] text-[20px] tracking-wide sm:flex">
            BCAP
          </span>
        </Link>

        {/* Desktop navigation — hidden on mobile, AppDock handles that */}
        <nav
          className="hidden lg:flex items-center gap-0.5"
          aria-label="Navegação principal"
        >
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(item.href, pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-500',
                  active
                    ? 'border border-white/[0.08] bg-white/[0.09] text-[#F4F0FF] shadow-[inset_0_1px_1px_rgba(255,255,255,0.10)]'
                    : 'text-[#F4F0FF]/55 hover:bg-white/[0.05] hover:text-[#F4F0FF]/80'
                )}
              >
                <item.icon size={14} className="shrink-0" />
                <span
                  className={cn(
                    'transition-all duration-700 overflow-hidden whitespace-nowrap',
                    shrinks ? 'max-w-0 opacity-0 xl:max-w-[8rem] xl:opacity-100' : 'max-w-[8rem] opacity-100'
                  )}
                >
                  {item.label}
                </span>
                {/* Active underline glow — from old BC NavLink */}
                {active && (
                  <span className="absolute inset-x-2 -bottom-[1px] h-px bg-gradient-to-r from-transparent via-[#8B5CF6]/70 to-transparent" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User initials avatar */}
        {initials ? (
          <span
            aria-hidden="true"
            className="hidden sm:flex shrink-0 h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[11px] font-semibold tracking-wide text-[#F4F0FF] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_4px_12px_rgba(0,0,0,0.3)] backdrop-blur-xl"
          >
            {initials}
          </span>
        ) : (
          <div className="hidden sm:block w-8" />
        )}
      </div>
    </header>
  )
}
