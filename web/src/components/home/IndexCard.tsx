import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import { VariationBadge } from '@/components/atoms/VariationBadge'

interface IndexCardProps {
  name: string
  price: number | null
  changePercent: number | null
  isOpen: boolean
}

export default function IndexCard({ name, price, changePercent, isOpen }: IndexCardProps) {
  return (
    <div className="relative flex flex-col gap-2 overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A1625]/40 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
      <GlassHighlight widthPercent={80} />

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#F4F0FF]/55">
          {name}
        </p>
        {!isOpen && (
          <span className="rounded-full border border-[#F43F5E]/30 bg-[#F43F5E]/10 px-2 py-0.5 text-[10px] text-[#F43F5E]">
            Fechado
          </span>
        )}
      </div>

      {price === null ? (
        <p className="text-sm text-[#F4F0FF]/40">Dados indisponíveis</p>
      ) : (
        <>
          <p className="font-serif text-2xl font-semibold text-[#F4F0FF]">
            {price.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <VariationBadge variation={changePercent ?? 0} />
        </>
      )}
    </div>
  )
}
