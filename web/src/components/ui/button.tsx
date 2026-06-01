import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst/35 disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        default:
          'border border-amethyst/20 bg-amethyst/[0.12] text-[#F4F0FF] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_10px_22px_rgba(0,0,0,0.2)] hover:border-amethyst/35 hover:bg-amethyst/[0.18]',
        secondary:
          'border border-white/[0.07] bg-white/[0.025] text-[#F4F0FF]/75 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:border-white/[0.12] hover:bg-white/[0.045] hover:text-[#F4F0FF]',
        ghost: 'text-[#F4F0FF]/75 hover:bg-white/5 hover:text-[#F4F0FF]',
        outline:
          'border border-white/[0.10] bg-transparent text-[#F4F0FF]/75 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-white/[0.035] hover:text-[#F4F0FF]',
        destructive:
          'border border-[#F43F5E]/25 bg-[#F43F5E]/15 text-[#F4F0FF] hover:bg-[#F43F5E]/25',
      },
      size: {
        default: 'px-5 py-2.5',
        sm: 'min-h-9 px-3',
        lg: 'min-h-11 px-6',
        icon: 'size-10',
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
