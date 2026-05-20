import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border border-white/10 bg-[#8B5CF6]/20 text-[#F4F0FF] shadow-[inset_0_1px_2px_rgba(255,255,255,0.18),0_8px_18px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 hover:bg-[#8B5CF6]/30',
        secondary:
          'border border-white/10 bg-[#1A1625]/50 text-[#F4F0FF] shadow-[inset_0_1px_2px_rgba(255,255,255,0.12)] hover:bg-[#1A1625]/70',
        ghost: 'text-[#F4F0FF]/75 hover:bg-white/5 hover:text-[#F4F0FF]',
        outline:
          'border border-white/15 bg-transparent text-[#F4F0FF] shadow-[inset_0_1px_2px_rgba(255,255,255,0.08)] hover:bg-white/5',
        destructive:
          'border border-[#F43F5E]/25 bg-[#F43F5E]/15 text-[#F4F0FF] hover:bg-[#F43F5E]/25',
      },
      size: {
        default: 'px-5 py-2.5',
        sm: 'min-h-9 rounded-xl px-3',
        lg: 'min-h-12 rounded-2xl px-7',
        icon: 'size-11 rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
