'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface PasswordInputProps {
  id: string
  name: string
  placeholder?: string
  autoComplete?: string
  disabled?: boolean
  error?: string
}

export default function PasswordInput({
  id,
  name,
  placeholder,
  autoComplete,
  disabled,
  error,
}: PasswordInputProps) {
  const [show, setShow] = useState(false)

  return (
    <div>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required
          minLength={8}
          className="pr-11 bg-transparent border-white/10 text-[#F4F0FF] placeholder:text-[#F4F0FF]/40 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20"
        />
        <button
          type="button"
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setShow((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center text-[#F4F0FF]/40 transition hover:text-[#F4F0FF]/70"
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-[#F43F5E]">{error}</p>}
    </div>
  )
}
