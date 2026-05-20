'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { register } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import PasswordInput from '@/components/auth/PasswordInput'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Criando conta…' : 'Criar conta'}
    </Button>
  )
}

export default function SignUpForm() {
  const [state, formAction] = useActionState(register, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) router.push('/home')
  }, [state, router])

  return (
    <div className="glass-card relative w-full max-w-sm overflow-hidden p-8">
      <GlassHighlight widthPercent={70} />

      <div className="mb-6 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#F4F0FF]/55">
          Nova conta
        </p>
        <h1 className="mt-3 font-serif text-3xl text-[#F4F0FF]">Criar conta</h1>
        <p className="mt-2 text-sm text-[#F4F0FF]/60">Comece a investir com inteligência</p>
      </div>

      <form action={formAction} noValidate className="flex flex-col gap-4">
        {state && !state.success && state.error && (
          <p className="rounded-xl border border-[#F43F5E]/30 bg-[#F43F5E]/10 px-4 py-2 text-sm text-[#F43F5E]">
            {state.error}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name" className="text-sm text-[#F4F0FF]/70">
            Nome (opcional)
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Seu nome"
            className="bg-transparent border-white/10 text-[#F4F0FF] placeholder:text-[#F4F0FF]/40 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20"
          />
          {state && !state.success && state.fieldErrors?.name && (
            <p className="text-xs text-[#F43F5E]">{state.fieldErrors.name[0]}</p>
          )}
        </div>

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
          {state && !state.success && state.fieldErrors?.email && (
            <p className="text-xs text-[#F43F5E]">{state.fieldErrors.email[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-sm text-[#F4F0FF]/70">
            Senha
          </Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            error={
              state && !state.success ? state.fieldErrors?.password?.[0] : undefined
            }
          />
        </div>

        <SubmitButton />

        <p className="text-center text-sm text-[#F4F0FF]/50">
          <Link href="/auth/sign-in" className="text-[#8B5CF6] hover:underline">
            Já tenho uma conta
          </Link>
        </p>
      </form>
    </div>
  )
}
