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
        'bull-action-primary h-10 rounded-xl px-4 text-sm',
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
