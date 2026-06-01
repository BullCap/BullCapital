'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { login } from '@/app/actions/auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import PasswordInput from '@/components/auth/PasswordInput'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bull-action-primary min-h-12 w-full"
    >
      {pending ? 'Entrando…' : 'Entrar'}
    </button>
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
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center flex flex-col items-center">
        <img
          src="/icons/icon-192.png"
          alt="Logo BCAP"
          className="h-16 w-16 rounded-[1.25rem] border border-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.4)] mb-4"
        />
        <p className="bull-eyebrow">BullCapital</p>
        <h1 className="mt-3 font-serif text-4xl text-[#F4F0FF]">Research de mercado</h1>
        <p className="mt-2 text-sm text-[#DBEAFE]/55">
          Dados brasileiros para briefing, comparação e narrativa profissional
        </p>
      </div>

      <div className="bull-frame p-8">
        <GlassHighlight widthPercent={70} />

        <div className="mb-6 text-center">
          <p className="bull-eyebrow">Acesso</p>
          <p className="mt-3 font-serif text-2xl text-[#F4F0FF]">Entrar no workspace</p>
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
              className="bg-white/[0.02]"
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
    </div>
  )
}
