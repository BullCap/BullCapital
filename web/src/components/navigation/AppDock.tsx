import Link from 'next/link'
import { BarChart3, Newspaper, Search, Sparkles, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AppDockSection = 'market' | 'news' | 'search' | 'analysis' | 'terminal'

interface AppDockProps {
  active: AppDockSection
}

export default function AppDock({ active }: AppDockProps) {
  return (
    <aside className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] lg:pointer-events-auto lg:sticky lg:top-6 lg:inset-auto lg:px-0 lg:pb-0">
      <div className="bull-dock-shell pointer-events-auto mx-auto flex max-w-sm flex-col gap-2 p-2 lg:max-w-none">
        <nav
          className="grid grid-cols-5 gap-1 rounded-[1.45rem] border border-white/[0.08] bg-black/35 p-1 lg:grid-cols-1"
          aria-label="Navegação principal"
        >
          <Link
            href="/home"
            className={cn(
              'bull-dock-link flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[1.1rem] px-3 text-[11px] transition lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:text-sm',
              active === 'market'
                ? 'border border-white/[0.08] bg-white/[0.09] text-[#F4F0FF] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]'
                : 'text-[#F4F0FF]/55 hover:bg-white/[0.05] hover:text-[#F4F0FF]/85'
            )}
          >
            <BarChart3 size={16} />
            Mercado
          </Link>
          <Link
            href="/news"
            className={cn(
              'bull-dock-link flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[1.1rem] px-2 text-[11px] transition lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-sm',
              active === 'news'
                ? 'border border-white/[0.08] bg-white/[0.09] text-[#F4F0FF] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]'
                : 'text-[#F4F0FF]/55 hover:bg-white/[0.05] hover:text-[#F4F0FF]/85'
            )}
          >
            <Newspaper size={16} />
            Notícias
          </Link>
          <Link
            href="/search"
            className={cn(
              'bull-dock-link flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[1.1rem] px-3 text-[11px] transition lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:text-sm',
              active === 'search'
                ? 'border border-white/[0.08] bg-white/[0.09] text-[#F4F0FF] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]'
                : 'text-[#F4F0FF]/55 hover:bg-white/[0.05] hover:text-[#F4F0FF]/85'
            )}
          >
            <Search size={16} />
            Buscar
          </Link>
          <Link
            href="/terminal"
            className={cn(
              'bull-dock-link flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[1.1rem] px-3 text-[11px] transition lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:text-sm',
              active === 'terminal'
                ? 'border border-white/[0.08] bg-white/[0.09] text-[#F4F0FF] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]'
                : 'text-[#F4F0FF]/55 hover:bg-white/[0.05] hover:text-[#F4F0FF]/85'
            )}
          >
            <Terminal size={16} />
            Terminal
          </Link>
          <Link
            href="/analysis"
            className={cn(
              'bull-dock-link flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[1.1rem] px-3 text-[11px] transition lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:text-sm',
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
