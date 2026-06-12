'use client'

import { useActionState, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { createClientAction, type ClientActionState } from '@/app/actions/clients'

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null
  return <p className="mt-1 text-[11px] text-[#e8bdc6]">{messages[0]}</p>
}

export function NewClientForm() {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState<ClientActionState, FormData>(
    createClientAction,
    null
  )

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="bull-action-primary">
        <Plus size={15} />
        Novo cliente
      </button>
    )
  }

  return (
    <form
      action={formAction}
      className="bull-card-calm w-full p-5 md:p-6"
      aria-label="Cadastrar novo cliente"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="bull-eyebrow">Novo cliente</p>
          <p className="mt-1 text-[12px] text-starlight/45">
            O CPF é a chave da cobertura FGC por instituição — pode ser preenchido depois.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="bull-icon-button size-8"
          aria-label="Fechar formulário"
        >
          <X size={13} />
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="client-name" className="bull-stat-label">
            Nome
          </label>
          <input
            id="client-name"
            name="name"
            required
            placeholder="Maria Albuquerque"
            className="mt-1.5 w-full rounded-lg border border-white/[0.07] bg-black/25 px-3 py-2.5 text-[13px] text-starlight placeholder:text-starlight/25 focus:border-amethyst/40 focus:outline-none"
          />
          <FieldError messages={state?.fieldErrors?.name} />
        </div>
        <div>
          <label htmlFor="client-cpf" className="bull-stat-label">
            CPF <span className="normal-case tracking-normal text-starlight/30">(opcional)</span>
          </label>
          <input
            id="client-cpf"
            name="cpf"
            inputMode="numeric"
            placeholder="000.000.000-00"
            className="mt-1.5 w-full rounded-lg border border-white/[0.07] bg-black/25 px-3 py-2.5 text-[13px] text-starlight placeholder:text-starlight/25 focus:border-amethyst/40 focus:outline-none"
          />
          <FieldError messages={state?.fieldErrors?.cpf} />
        </div>
        <div>
          <label htmlFor="client-email" className="bull-stat-label">
            E-mail <span className="normal-case tracking-normal text-starlight/30">(opcional)</span>
          </label>
          <input
            id="client-email"
            name="email"
            type="email"
            placeholder="maria@exemplo.com.br"
            className="mt-1.5 w-full rounded-lg border border-white/[0.07] bg-black/25 px-3 py-2.5 text-[13px] text-starlight placeholder:text-starlight/25 focus:border-amethyst/40 focus:outline-none"
          />
          <FieldError messages={state?.fieldErrors?.email} />
        </div>
      </div>

      {state?.error && !state.fieldErrors && (
        <p className="mt-3 text-[12px] text-[#e8bdc6]">{state.error}</p>
      )}

      <div className="mt-5 flex items-center gap-2">
        <button type="submit" disabled={pending} className="bull-action-primary">
          {pending ? 'Cadastrando…' : 'Cadastrar cliente'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="bull-action">
          Cancelar
        </button>
      </div>
    </form>
  )
}
