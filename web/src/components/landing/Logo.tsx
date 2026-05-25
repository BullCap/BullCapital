import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
}


export function Logo({ className }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn('bull-wordmark group flex items-center gap-3 transition-all duration-300', className)}
      aria-label="BullCapital home"
    >
      <span className="bull-brand-mark size-8 rounded-lg" />
      <span className="flex items-baseline font-serif font-bold text-[#F4F0FF] text-[22px] tracking-wide">
        BCAP
      </span>
    </Link>
  )
}

