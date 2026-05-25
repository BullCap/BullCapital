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
      className={`group relative mt-10 w-full max-w-2xl transition-all duration-300 ${
        isFocused ? 'scale-[1.02]' : 'scale-100'
      }`}
    >
      <div
        className={`relative flex items-center gap-3 rounded-full border border-white/10 bg-[#1A1625]/40 p-2 pl-5 backdrop-blur-2xl transition-all duration-700 ${
          isFocused
            ? 'shadow-[inset_0_0_12px_rgba(139,92,246,0.4),inset_0_1px_1px_rgba(139,92,246,0.3),0_8px_32px_rgba(0,0,0,0.4)]'
            : 'shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.4)]'
        }`}
      >
        <GlassHighlight />
        <Search
          className={`size-5 shrink-0 transition-colors duration-300 ${
            isFocused ? 'text-[#8B5CF6]' : 'text-white/50'
          }`}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex.: Notícias de hoje da Petrobras e impactos"
          className="w-full bg-transparent text-sm text-[#F4F0FF]/90 placeholder-[#F4F0FF]/40 outline-none sm:text-base py-2.5"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <button
          type="submit"
          className="relative inline-flex min-h-10 items-center justify-center rounded-full border border-white/10 bg-[#8B5CF6]/20 px-5 text-xs font-semibold text-[#F4F0FF] shadow-[inset_0_1px_2px_rgba(255,255,255,0.18),0_4px_12px_rgba(0,0,0,0.35)] transition duration-500 hover:scale-[1.03] hover:bg-[#8B5CF6]/30 active:scale-[0.98] mr-1"
        >
          Analisar
        </button>
      </div>
    </form>
  )
}
