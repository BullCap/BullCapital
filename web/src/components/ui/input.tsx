import * as React from 'react'

import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex min-h-11 w-full rounded-2xl border border-white/10 bg-[#1A1625]/45 px-4 py-2 text-sm text-[#F4F0FF] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),inset_0_-1px_3px_rgba(0,0,0,0.45)] transition duration-500 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#F4F0FF] placeholder:text-[#F4F0FF]/40 focus-visible:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/40 disabled:cursor-not-allowed disabled:opacity-50',
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
