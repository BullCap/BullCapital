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
        'relative rounded-xl px-3 py-1.5 text-sm font-medium transition-colors duration-300',
        isActive ? 'text-starlight' : 'text-starlight/48 hover:text-starlight/78',
        className
      )}
    >
      {children}
      {isActive && (
        <span className="absolute inset-x-2 -bottom-px h-px bg-gradient-to-r from-transparent via-starlight/40 to-transparent" />
      )}
    </Link>
  )
}
