import * as React from 'react'

import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex min-h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-2 text-sm text-[#F4F0FF] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.18)] transition-colors duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#F4F0FF] placeholder:text-[#F4F0FF]/35 focus-visible:border-amethyst/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst/25 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
