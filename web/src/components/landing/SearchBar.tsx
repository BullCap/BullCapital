'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

export default function SearchBar() {
  const [isFocused, setIsFocused] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Redirect to login or home with the query parameter
    router.push(`/auth/sign-in?callbackUrl=/home&q=${encodeURIComponent(query)}`)
  }

  return (
    <form
      onSubmit={handleSearch}
      className="group relative mt-8 w-full max-w-2xl"
    >
      <div
        className={`relative flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-2 pl-4 backdrop-blur-2xl transition-colors duration-300 ${
          isFocused
            ? 'border-amethyst/30 bg-amethyst/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.075)]'
            : 'shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_14px_36px_rgba(0,0,0,0.2)]'
        }`}
      >
        <GlassHighlight className="opacity-40" />
        <Search
          className={`size-5 shrink-0 transition-colors duration-300 ${
            isFocused ? 'text-starlight/80' : 'text-starlight/38'
          }`}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex.: PETR4 vs VALE3 com fundamentos e macro"
          className="w-full bg-transparent py-2.5 text-sm text-starlight/88 outline-none placeholder:text-starlight/32 sm:text-base"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <button
          type="submit"
          className="bull-action-primary mr-1 min-h-10 rounded-xl px-4 text-xs"
        >
          Acessar
        </button>
      </div>
    </form>
  )
}
