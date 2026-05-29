'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  Newspaper,
  Search,
  Terminal,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  Bell,
  MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

const NAV_ITEMS = [
  { label: 'Mercado', href: '/home', icon: BarChart3 },
  { label: 'Notícias', href: '/news', icon: Newspaper },
  { label: 'Buscar', href: '/search', icon: Search },
  { label: 'Carteira', href: '/terminal', icon: Terminal },
  { label: 'Análises', href: '/analysis', icon: Sparkles },
] as const

const COPILOT_PROMPTS = [
  'Como o mercado reagiu hoje?',
  'Quais setores se destacaram?',
  'O que pode mover o mercado amanhã?',
]

const SIDEBAR_STORAGE_KEY = 'bull-sidebar-collapsed'
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

interface B2BSidebarProps {
  initialCollapsed?: boolean
  initials?: string
  userName?: string
  userEmail?: string
}

export default function B2BSidebar({
  initialCollapsed = false,
  initials = 'BC',
  userName = 'Consultor',
  userEmail,
}: B2BSidebarProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const [chatQuery, setChatQuery] = useState('')
  const pathname = usePathname()
  const router = useRouter()

  // Sync collapsed state to persistent storage for the next server-rendered navigation.
  useEffect(() => {
    const root = document.documentElement
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed))
    document.cookie = `${SIDEBAR_STORAGE_KEY}=${String(collapsed)}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; samesite=lax`

    if (collapsed) {
      root.classList.add('sidebar-collapsed')
    } else {
      root.classList.remove('sidebar-collapsed')
    }
    return () => {
      root.classList.remove('sidebar-collapsed')
    }
  }, [collapsed])

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatQuery.trim()) return
    const query = encodeURIComponent(chatQuery.trim())
    setChatQuery('')
    router.push(`/analysis?q=${query}`)
  }

  const isNavItemActive = (href: string) => {
    if (href === '/home') return pathname === '/home'
    return pathname.startsWith(href)
  }

  const renderNavLinks = () => {
    return NAV_ITEMS.map((item) => {
      const active = isNavItemActive(item.href)
      return (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'group relative flex h-11 items-center rounded-lg text-sm font-medium transition-all duration-300',
            collapsed ? 'mx-auto w-12 justify-center px-0' : 'w-full gap-3 px-3',
            active
              ? 'border border-[#94a3b8]/20 bg-[#94a3b8]/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]'
              : 'text-[#94a3b8]/60 hover:bg-white/[0.03] hover:text-white'
          )}
          aria-current={active ? 'page' : undefined}
        >
          <item.icon size={18} className={cn('shrink-0 transition-transform duration-300 group-hover:scale-105', active ? 'text-white' : 'text-[#94a3b8]/50 group-hover:text-[#94a3b8]/80')} />
          <span
            className={cn(
              'transition-all duration-500 whitespace-nowrap overflow-hidden',
              collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[12rem] opacity-100'
            )}
          >
            {item.label}
          </span>
          {active && !collapsed && (
            <span className="absolute right-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white/80" />
          )}
          
          {/* Tooltip for collapsed mode */}
          {collapsed && (
            <div className="pointer-events-none absolute left-14 z-50 rounded-lg border border-white/[0.08] bg-[#0F0E15] px-2.5 py-1.5 text-xs text-white opacity-0 shadow-xl transition-opacity duration-300 group-hover:opacity-100">
              {item.label}
            </div>
          )}
        </Link>
      )
    })
  }

  return (
    <aside
      className={cn(
        'hidden lg:flex shrink-0 flex-col border-r border-white/[0.06] bg-[#090C12]/95 backdrop-blur-2xl transition-all duration-500 ease-out sticky top-0 h-screen z-40',
        collapsed ? 'w-[5.25rem]' : 'w-[20rem]'
      )}
    >
      <GlassHighlight widthPercent={collapsed ? 80 : 40} className="via-white/10" />

      {/* 1. Header (Logo & Collapse Button) */}
      <header
        className={cn(
          'relative z-10 flex h-[4.5rem] shrink-0 items-center border-b border-white/[0.04]',
          collapsed ? 'justify-center px-0' : 'justify-between px-4'
        )}
      >
        <div
          className={cn(
            'flex items-center gap-3 overflow-hidden transition-all duration-500',
            collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[14rem] opacity-100'
          )}
        >
          <span className="bull-brand-mark shrink-0 animate-pulse-glow" />
          <span className="font-serif text-[19px] font-bold tracking-tight text-white whitespace-nowrap">
            BullCapital
          </span>
        </div>

        {/* Collapse trigger (Desktop Only) */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="relative z-20 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-[#94a3b8]/60 hover:bg-white/5 hover:text-white"
          aria-label={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </header>

      {/* 2. Main Navigation Links */}
      <nav className="flex flex-col gap-1 px-3 py-4 border-b border-white/[0.04]" aria-label="Navegação lateral">
        {renderNavLinks()}
      </nav>

      {/* 3a. Collapsed copilot bubble — fora do overflow-y-auto para o tooltip não ser clipado */}
      {collapsed && (
        <div className="group relative flex justify-center px-3 pt-5 pb-2">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#94a3b8]/25 bg-[#94a3b8]/10 text-white shadow-lg transition hover:scale-105 active:scale-95"
            aria-label="Abrir Copiloto"
          >
            <Sparkles size={16} className="text-white" />
          </button>
          <div className="pointer-events-none absolute left-[4.5rem] top-1/2 -translate-y-1/2 z-50 rounded-lg border border-white/[0.08] bg-[#0C0F15] px-2.5 py-1.5 text-xs text-white opacity-0 shadow-xl transition-opacity duration-300 group-hover:opacity-100 whitespace-nowrap">
            Falar com Copiloto
          </div>
        </div>
      )}

      {/* 3b. Expanded copilot panel */}
      {!collapsed && (
        <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4 scrollbar-none">
          <div className="flex items-center gap-2 px-3">
            <Sparkles size={16} className="text-[#cbd5e1] shrink-0 animate-pulse-glow" />
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#94a3b8]/60 whitespace-nowrap">
              Copiloto IA
            </span>
            <span className="rounded bg-[#94a3b8]/10 px-1.5 py-0.5 text-[8px] font-extrabold text-[#cbd5e1] ml-auto shrink-0">
              PRO
            </span>
          </div>

          <p className="px-3 mt-3 text-xs leading-relaxed text-[#94a3b8]/50">
            Munição de research e narrativa em tempo real para embasar suas decisões de alocação.
          </p>

          <div className="mt-4 space-y-1.5">
            {COPILOT_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => router.push(`/analysis?q=${encodeURIComponent(prompt)}`)}
                className="flex w-full items-center gap-2 rounded-lg border border-white/[0.03] bg-white/[0.01] px-3 py-2.5 text-left text-[11px] text-[#cbd5e1]/75 transition-all duration-300 hover:border-[#94a3b8]/20 hover:bg-white/[0.04] hover:text-white"
              >
                <MessageSquare size={12} className="shrink-0 text-[#94a3b8]/40" />
                <span className="truncate">{prompt}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="mt-auto pt-6">
            <div className="relative flex items-center rounded-lg border border-white/[0.06] bg-black/25 px-2.5 py-1.5 shadow-[inset_0_1px_1px_rgba(0,0,0,0.3)] focus-within:border-[#94a3b8]/40 transition-colors duration-300">
              <input
                type="text"
                placeholder="Pergunte algo sobre o mercado..."
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                className="w-full bg-transparent px-1.5 text-xs text-white placeholder-[#94a3b8]/30 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!chatQuery.trim()}
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white transition-all duration-300',
                  chatQuery.trim()
                    ? 'bg-[#94a3b8]/80 hover:bg-[#94a3b8] cursor-pointer'
                    : 'bg-white/[0.03] text-[#94a3b8]/30 cursor-not-allowed'
                )}
                aria-label="Enviar pergunta"
              >
                <Send size={11} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Footer (Profile, Notifications & Settings) */}
      <footer className="shrink-0 p-3 border-t border-white/[0.04] bg-black/10">
        <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
          {/* User Initials Circle */}
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-[11px] font-bold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
            {initials}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0C0F15] bg-[#4ADE80]" />
          </div>

          {/* User Details */}
          <div
            className={cn(
              'flex flex-1 flex-col overflow-hidden transition-all duration-500 whitespace-nowrap',
              collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[12rem] opacity-100'
            )}
          >
            <p className="text-xs font-bold text-white truncate">{userName}</p>
            <p className="text-[10px] text-[#94a3b8]/40 truncate">{userEmail ?? 'Consultor CFP'}</p>
          </div>

          {/* Notification triggers */}
          {!collapsed && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8]/50 hover:bg-white/5 hover:text-white"
                aria-label="Notificações"
              >
                <Bell size={14} />
              </button>
            </div>
          )}
        </div>
      </footer>
    </aside>
  )
}
