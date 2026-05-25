import Link from 'next/link'
import { LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SignInButtonProps {
  className?: string
}

export function SignInButton({ className }: SignInButtonProps) {
  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        'relative rounded-2xl px-5 py-2 h-auto text-sm font-medium',
        'bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20',
        'hover:bg-[#8B5CF6]/20 hover:text-[#8B5CF6] hover:border-[#8B5CF6]/30',
        'hover:shadow-[0_0_20px_rgba(139,92,246,0.25)]',
        'active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]',
        'transition-all duration-300',
        className
      )}
    >
      <Link href="/auth/sign-in" className="flex items-center gap-2">
        <LogIn className="h-4 w-4" />
        Entrar
      </Link>
    </Button>
  )
}
