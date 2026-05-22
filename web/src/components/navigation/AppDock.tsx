import Link from 'next/link'
import { ArrowUp, BarChart3, Search, Sparkles } from 'lucide-react'
import { normalizeTicker } from '@/lib/market-routing'
import { cn } from '@/lib/utils'

type AppDockSection = 'market' | 'search' | 'analysis'

interface AppDockProps {
  active: AppDockSection
  ticker?: string
}

export default function AppDock({ active, ticker }: AppDockProps) {
  const normalizedTicker = ticker ? normalizeTicker(ticker) : ''
  const advisorHref = normalizedTicker
    ? `/analysis?ticker=${encodeURIComponent(normalizedTicker)}`
    : '/analysis'
  const focusLabel = normalizedTicker ? normalizedTicker : 'o mercado'

  return (
    <aside className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
      <div className="bull-dock-shell pointer-events-auto mx-auto flex max-w-sm flex-col gap-2 p-2">
        <Link
          href={advisorHref}
          className="bull-command-bar bull-dock-cta flex min-h-12 items-center gap-3 px-3 py-2.5 transition hover:border-[#60A5FA]/30"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#60A5FA]/20 bg-[#3B82F6]/15 text-[#DBEAFE]">
            <Sparkles size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-[#F4F0FF]/80">
              Pergunte sobre {focusLabel}
            </span>
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DBEAFE] text-[#09111D] shadow-[0_8px_22px_rgba(96,165,250,0.25)]">
            <ArrowUp size={15} />
          </span>
        </Link>

        <nav
          className="grid grid-cols-3 gap-1 rounded-[1.45rem] border border-white/[0.08] bg-black/35 p-1"
          aria-label="Navegação principal"
        >
          <Link
            href="/home"
            className={cn(
              'bull-dock-link flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[1.1rem] px-3 text-[11px] transition',
              active === 'market'
                ? 'border border-white/[0.08] bg-white/[0.09] text-[#F4F0FF] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]'
                : 'text-[#F4F0FF]/55 hover:bg-white/[0.05] hover:text-[#F4F0FF]/85'
            )}
          >
            <BarChart3 size={16} />
            Mercado
          </Link>
          <Link
            href="/search"
            className={cn(
              'bull-dock-link flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[1.1rem] px-3 text-[11px] transition',
              active === 'search'
                ? 'border border-white/[0.08] bg-white/[0.09] text-[#F4F0FF] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]'
                : 'text-[#F4F0FF]/55 hover:bg-white/[0.05] hover:text-[#F4F0FF]/85'
            )}
          >
            <Search size={16} />
            Buscar
          </Link>
          <Link
            href="/analysis"
            className={cn(
              'bull-dock-link flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[1.1rem] px-3 text-[11px] transition',
              active === 'analysis'
                ? 'border border-white/[0.08] bg-white/[0.09] text-[#F4F0FF] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]'
                : 'text-[#F4F0FF]/55 hover:bg-white/[0.05] hover:text-[#F4F0FF]/85'
            )}
          >
            <Sparkles size={16} />
            Análises
          </Link>
        </nav>
      </div>
    </aside>
  )
}
