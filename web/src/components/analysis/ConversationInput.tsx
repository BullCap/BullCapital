'use client'

import { useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'

interface ConversationInputProps {
  onSubmit: (question: string) => void
  disabled: boolean
  subjectLabel: string
  initialValue?: string
}

export function ConversationInput({ onSubmit, disabled, subjectLabel, initialValue }: ConversationInputProps) {
  const [value, setValue] = useState(initialValue ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function submit() {
    const q = value.trim()
    if (!q || disabled) return
    onSubmit(q)
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`
  }

  return (
    <div className="flex items-end gap-3 rounded-2xl border border-white/[0.08] bg-[#0F0C18]/65 px-4 py-3 transition-colors duration-300 group/input focus-within:border-amethyst/40 focus-within:bg-[#0f0c18]/90">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={`Pergunte sobre ${subjectLabel}…`}
        className="min-h-[28px] flex-1 resize-none bg-transparent text-sm text-starlight placeholder:text-starlight/25 focus:outline-none disabled:opacity-50"
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amethyst text-white transition-colors duration-300 hover:bg-amethyst-light active:scale-[0.94] disabled:cursor-not-allowed disabled:bg-white/[0.04] disabled:text-starlight/25"
        aria-label="Enviar pergunta"
      >
        <ArrowUp size={15} />
      </button>
    </div>
  )
}
