'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export function NavigationProgress() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const navigatingRef = useRef(false)

  useEffect(() => {
    if (navigatingRef.current) {
      navigatingRef.current = false
      setVisible(false)
    }
  }, [pathname])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      try {
        const url = new URL(anchor.href)
        if (url.origin !== window.location.origin) return
        if (url.pathname === window.location.pathname && !url.hash) return
        if (url.hash && url.pathname === window.location.pathname) return
        navigatingRef.current = true
        setVisible(true)
      } catch {
        // URL inválida — ignora
      }
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed top-0 inset-x-0 z-[60] h-[2px] overflow-hidden pointer-events-none">
      <div className="h-full w-full bg-gradient-to-r from-transparent via-[#8B5CF6] to-[#A78BFA] animate-nav-progress" />
    </div>
  )
}
