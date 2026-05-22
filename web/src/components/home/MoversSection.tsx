import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import MoverItem from './MoverItem'
import { buildAssetHref } from '@/lib/market-routing'

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
    <section className="bull-panel p-5">
      <GlassHighlight widthPercent={50} />

      <div className="mb-4 flex items-center gap-2">
        {icon === 'gainers' ? (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M7 2L12 10H2L7 2Z" fill="#4ADE80" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M7 12L2 4H12L7 12Z" fill="#F43F5E" />
          </svg>
        )}
        <h3 className="font-serif text-lg text-[#F4F0FF]">{title}</h3>
      </div>

      {movers.length === 0 ? (
        <p className="py-4 text-center text-sm text-[#F4F0FF]/40">Dados de mercado indisponíveis</p>
      ) : (
        <div className="flex flex-col gap-2">
          {movers.slice(0, 3).map((m) => (
            <MoverItem key={m.ticker} {...m} href={buildAssetHref(m.ticker)} />
          ))}
        </div>
      )}
    </section>
  )
}
