'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  ChevronsUpDown,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sparkles,
  Terminal,
  Users,
} from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTooltip,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Mercado', href: '/home', icon: BarChart3 },
  { label: 'Clientes', href: '/clients', icon: Users },
  { label: 'Buscar', href: '/search', icon: Search },
  { label: 'Terminal', href: '/terminal', icon: Terminal },
  { label: 'Análises', href: '/analysis', icon: Sparkles },
] as const

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
}: B2BSidebarProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setCollapsed(initialCollapsed)
  }, [initialCollapsed])

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

  const isNavItemActive = (href: string) => {
    if (href === '/home') return pathname === '/home'
    return pathname.startsWith(href)
  }

  const sidebarState = collapsed ? 'collapsed' : 'expanded'

  return (
    <Sidebar
      state={sidebarState}
      className={mounted ? 'transition-[width] duration-500 ease-out' : 'transition-none'}
    >
      <SidebarHeader
        className={cn(
          'border-b border-white/[0.035]',
          collapsed ? 'justify-center gap-0 px-0' : 'justify-between px-3'
        )}
      >
        <div
          className={cn(
            'flex items-center overflow-hidden',
            mounted ? 'transition-all duration-500' : 'transition-none',
            collapsed ? 'max-w-0 opacity-0' : 'max-w-[11rem] opacity-100'
          )}
        >
          <span className="whitespace-nowrap font-serif text-[16px] font-semibold tracking-tight text-[#F4F0FF]">
            BullCapital
          </span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="size-7 shrink-0 rounded-md text-[#F4F0FF]/46 hover:bg-white/[0.05] hover:text-[#F4F0FF]/82"
          aria-label={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </Button>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarMenu className="gap-1.5">
            {NAV_ITEMS.map((item) => {
              const active = isNavItemActive(item.href)

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    size={collapsed ? 'icon' : 'default'}
                    className={cn(collapsed && 'mx-auto')}
                  >
                    <Link href={item.href} aria-current={active ? 'page' : undefined}>
                      <item.icon
                        className={cn(
                          'transition-colors duration-300',
                          active ? 'text-[#F4F0FF]' : 'text-[#F4F0FF]/42'
                        )}
                      />
                      <span
                        className={cn(
                          'overflow-hidden whitespace-nowrap',
                          mounted ? 'transition-all duration-500' : 'transition-none',
                          collapsed ? 'max-w-0 opacity-0' : 'max-w-[10rem] opacity-100'
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                  {collapsed && <SidebarTooltip>{item.label}</SidebarTooltip>}
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <Separator className="bg-white/[0.035]" />

      <SidebarFooter className="bg-black/10">
        <Link
          href="/settings"
          aria-label="Conta e configurações"
          className={cn(
            'flex items-center rounded-md p-1.5 transition-colors hover:bg-white/[0.05]',
            collapsed ? 'justify-center' : 'gap-2.5'
          )}
        >
          <Avatar className="size-7 shrink-0 rounded-md border border-white/[0.07]">
            <AvatarFallback className="rounded-md bg-white/[0.04] text-[10px] font-semibold text-[#F4F0FF]">
              {initials}
            </AvatarFallback>
          </Avatar>

          <span
            className={cn(
              'flex-1 truncate whitespace-nowrap text-[12px] font-medium text-[#F4F0FF]/82',
              mounted ? 'transition-all duration-500' : 'transition-none',
              collapsed ? 'max-w-0 opacity-0' : 'max-w-[9.5rem] opacity-100'
            )}
          >
            {userName}
          </span>

          {!collapsed && (
            <ChevronsUpDown size={13} className="shrink-0 text-[#F4F0FF]/42" />
          )}
        </Link>
      </SidebarFooter>
    </Sidebar>
  )
}
