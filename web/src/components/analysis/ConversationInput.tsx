'use client'

import { useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'

interface ConversationInputProps {
  onSubmit: (question: string) => void
  disabled: boolean
  ticker: string
  initialValue?: string
}

export function ConversationInput({ onSubmit, disabled, ticker, initialValue }: ConversationInputProps) {
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
    <div className="flex items-end gap-3 rounded-[1.35rem] border border-white/[0.1] bg-white/[0.06] px-4 py-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.11)]">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={`Pergunte sobre ${ticker}…`}
        className="min-h-[28px] flex-1 resize-none bg-transparent text-sm text-[#F4F0FF] placeholder:text-[#F4F0FF]/35 focus:outline-none disabled:opacity-50"
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-[#09111D] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="Enviar pergunta"
      >
        <ArrowUp size={15} />
      </button>
    </div>
  )
}
