import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import MoverItem from './MoverItem'

interface Mover {
  ticker: string
  name: string
  price: number
  changePercent: number
  logoUrl?: string
}

interface MoversSectionProps {
  title: string
  icon: 'gainers' | 'losers'
  movers: Mover[]
}

export default function MoversSection({ title, icon, movers }: MoversSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A1625]/40 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[#8B5CF6]/10 blur-[80px]" />
      <GlassHighlight widthPercent={50} />

      <div className="mb-4 flex items-center gap-2">
        {icon === 'gainers' ? (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M7 2L12 10H2L7 2Z" fill="#8B5CF6" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M7 12L2 4H12L7 12Z" fill="#F43F5E" />
          </svg>
        )}
        <h3 className="font-serif text-lg text-[#F4F0FF]">{title}</h3>
      </div>

      {movers.length === 0 ? (
        <p className="py-4 text-center text-sm text-[#F4F0FF]/40">
          Dados de mercado indisponíveis
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {movers.slice(0, 3).map((m) => (
            <MoverItem key={m.ticker} {...m} href={`/asset/${m.ticker}`} />
          ))}
        </div>
      )}
    </div>
  )
}
