'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function NavLink({ href, children, className }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        'relative px-3 py-1.5 text-sm font-medium transition-all duration-300 rounded-xl',
        isActive ? 'text-[#F4F0FF]' : 'text-[#F4F0FF]/50 hover:text-[#F4F0FF]/80',
        className
      )}
    >
      {children}
      {/* Active indicator glow */}
      {isActive && (
        <span className="absolute inset-x-1 -bottom-px h-px bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
      )}
    </Link>
  )
}
