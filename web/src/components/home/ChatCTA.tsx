import Link from 'next/link'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

export default function ChatCTA() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 p-8 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_0_40px_rgba(139,92,246,0.15)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-[#8B5CF6]/20 blur-[60px]" />
      <GlassHighlight widthPercent={70} />

      <h2 className="mb-2 font-serif text-2xl text-[#F4F0FF]">Pergunte sobre o mercado</h2>
      <p className="mb-6 text-sm text-[#F4F0FF]/60">
        Nossa IA explica o que está acontecendo em linguagem simples
      </p>
      <Link
        href="/chat"
        className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#8B5CF6]/40 bg-[#8B5CF6]/20 px-8 py-3 text-sm font-medium text-[#F4F0FF] transition hover:-translate-y-0.5 hover:bg-[#8B5CF6]/30"
      >
        Conversar com a IA
      </Link>
    </div>
  )
}
