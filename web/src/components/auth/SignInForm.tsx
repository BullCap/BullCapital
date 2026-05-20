'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import PasswordInput from '@/components/auth/PasswordInput'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Entrando…' : 'Entrar'}
    </Button>
  )
}

export default function SignInForm() {
  const [state, formAction] = useActionState(login, null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const raw = searchParams.get('callbackUrl') ?? ''
  const callbackUrl = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/home'

  useEffect(() => {
    if (state?.success) router.push(callbackUrl)
  }, [state, router, callbackUrl])

  return (
    <div className="glass-card relative w-full max-w-sm overflow-hidden p-8">
      <GlassHighlight widthPercent={70} />

      <div className="mb-6 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#F4F0FF]/55">Acesso</p>
        <h1 className="mt-3 font-serif text-3xl text-[#F4F0FF]">Entrar</h1>
        <p className="mt-2 text-sm text-[#F4F0FF]/60">Acesse sua conta BullCapital</p>
      </div>

      <form action={formAction} noValidate className="flex flex-col gap-4">
        {state && !state.success && state.error && (
          <p className="rounded-xl border border-[#F43F5E]/30 bg-[#F43F5E]/10 px-4 py-2 text-sm text-[#F43F5E]">
            {state.error}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-sm text-[#F4F0FF]/70">
            E-mail
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="seu@email.com"
            className="bg-transparent border-white/10 text-[#F4F0FF] placeholder:text-[#F4F0FF]/40 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-sm text-[#F4F0FF]/70">
            Senha
          </Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Sua senha"
          />
        </div>

        <SubmitButton />

        <p className="text-center text-sm text-[#F4F0FF]/50">
          Não tem uma conta?{' '}
          <Link href="/auth/sign-up" className="text-[#8B5CF6] hover:underline">
            Criar conta
          </Link>
        </p>
      </form>
    </div>
  )
}
