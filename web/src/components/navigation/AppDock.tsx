import Link from 'next/link'
import { BarChart3, Newspaper, Search, Sparkles, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AppDockSection = 'market' | 'news' | 'search' | 'analysis' | 'terminal'

interface AppDockProps {
  active: AppDockSection
}

const DOCK_ITEMS = [
  { key: 'market', href: '/home', label: 'Mercado', icon: BarChart3 },
  { key: 'news', href: '/news', label: 'Notícias', icon: Newspaper },
  { key: 'search', href: '/search', label: 'Buscar', icon: Search },
  { key: 'terminal', href: '/terminal', label: 'Terminal', icon: Terminal },
  { key: 'analysis', href: '/analysis', label: 'Análises', icon: Sparkles },
] as const

export default function AppDock({ active }: AppDockProps) {
  return (
    <aside className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] lg:hidden">
      <div className="bull-dock-shell pointer-events-auto mx-auto flex max-w-sm flex-col gap-2 p-2 lg:max-w-none">
        <nav
          className="grid grid-cols-5 gap-1 rounded-[1.45rem] border border-white/[0.08] bg-black/35 p-1 lg:grid-cols-1"
          aria-label="Navegação principal"
        >
          {DOCK_ITEMS.map((item) => {
            const isActive = active === item.key
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  'bull-dock-link flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[1.1rem] px-2 text-[11px] transition lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-sm',
                  isActive
                    ? 'border border-white/[0.08] bg-white/[0.09] text-[#F4F0FF] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]'
                    : 'text-[#F4F0FF]/55 hover:bg-white/[0.05] hover:text-[#F4F0FF]/85'
                )}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
