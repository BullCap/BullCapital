import Link from 'next/link'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import { buildAssetHref } from '@/lib/market-routing'
import type { MarketListingItem } from '@/types/market'

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  })
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export default function BriefFixedIncomeList({ items }: { items: MarketListingItem[] }) {
  const topCount = Math.min(items.length, 4)

  return (
    <aside className="relative overflow-hidden rounded-[1.5rem] border border-white/[0.06] bg-black/30 p-4 shadow-[inset_0_1px_0px_rgba(255,255,255,0.05),0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      <GlassHighlight widthPercent={58} />

      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="bull-eyebrow">Renda fixa</p>
          <p className="mt-1 font-serif text-lg tracking-tight text-[#F4F0FF]">Tesouro em foco</p>
        </div>
        {topCount > 0 && (
          <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[#DBEAFE]/40">
            Top {topCount}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {items.length > 0 ? (
          items.slice(0, 4).map((item) => {
            const deltaTone = item.change >= 0 ? 'text-[#4ADE80]' : 'text-[#FB7185]'
            return (
              <Link
                key={item.stock}
                href={buildAssetHref(item.stock)}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 transition-all duration-300 hover:-translate-y-px hover:border-white/10 hover:bg-white/[0.05]"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#F4F0FF]">{item.stock}</p>
                  <p className="truncate text-[11px] text-white/40">{item.name}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <span className="text-[11px] font-mono tabular-nums text-[#F4F0FF]/85">
                    {formatPrice(item.close)}
                  </span>
                  <span className={`text-[10px] font-mono tabular-nums ${deltaTone}`}>
                    {formatPercent(item.change)}
                  </span>
                </div>
              </Link>
            )
          })
        ) : (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3 text-xs text-white/40">
            Dados indisponiveis no momento.
          </div>
        )}
      </div>
    </aside>
  )
}
