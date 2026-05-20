import React from 'react'
import { cn } from '@/lib/utils'

interface GlassHighlightProps {
  widthPercent?: number
  className?: string
}

export function GlassHighlight({ widthPercent = 60, className }: GlassHighlightProps) {
  const insetPercent = (100 - widthPercent) / 2

  return (
    <div
      className={cn(
        'pointer-events-none absolute top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent',
        className
      )}
      style={{ left: `${insetPercent}%`, width: `${widthPercent}%` }}
    />
  )
}
