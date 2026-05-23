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
    <div className="flex items-end gap-3 rounded-[1.35rem] border border-white/[0.08] bg-[#0F0C18]/65 px-4 py-3 shadow-[inset_0_1px_0px_rgba(255,255,255,0.06),0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 group/input focus-within:border-[#8B5CF6]/45 focus-within:shadow-[inset_0_2px_4px_rgba(0,0,0,0.55),0_0_24px_rgba(139,92,246,0.18)] focus-within:bg-[#0f0c18]/95">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={`Pergunte sobre ${subjectLabel}…`}
        className="min-h-[28px] flex-1 resize-none bg-transparent text-sm text-[#F4F0FF] placeholder:text-[#F4F0FF]/25 focus:outline-none disabled:opacity-50"
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6] text-white transition-all duration-300 hover:bg-[#a78bfa] hover:shadow-[0_0_12px_rgba(139,92,246,0.5)] active:scale-[0.92] disabled:cursor-not-allowed disabled:bg-white/[0.04] disabled:text-[#F4F0FF]/25 disabled:shadow-none"
        aria-label="Enviar pergunta"
      >
        <ArrowUp size={15} />
      </button>
    </div>
  )
}
