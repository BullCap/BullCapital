'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ScrollFocusProps extends React.HTMLAttributes<HTMLDivElement> {
  threshold?: number
  rootMargin?: string
}

export default function ScrollFocus({
  className,
  threshold = 0,
  rootMargin = '0px 0px -12% 0px',
  ...props
}: ScrollFocusProps) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [active, setActive] = React.useState(false)

  React.useEffect(() => {
    const node = ref.current
    if (!node) return

    if (typeof IntersectionObserver === 'undefined') {
      setActive(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return (
    <div
      ref={ref}
      data-scroll-focus={active ? 'active' : 'idle'}
      className={cn('scroll-focus', className)}
      {...props}
    />
  )
}
