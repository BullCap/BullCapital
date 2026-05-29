import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { cn } from '@/lib/utils'
import { auth } from '@/lib/auth'
import AppDock, { type AppDockSection } from './AppDock'
import B2BSidebar from './B2BSidebar'

const SIDEBAR_COLLAPSED_COOKIE = 'bull-sidebar-collapsed'

interface AppShellProps {
  active: AppDockSection
  children: ReactNode
  contentClassName?: string
  sessionUser?: {
    name?: string | null
    email?: string | null
  } | null
  skipUserLookup?: boolean
}

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2
      ? (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
      : parts[0]!.slice(0, 2).toUpperCase()
  }
  return email?.[0]?.toUpperCase() ?? '?'
}

export default async function AppShell({
  active,
  children,
  contentClassName,
  sessionUser,
  skipUserLookup = false,
}: AppShellProps) {
  let shellUser = sessionUser ?? null
  let initialSidebarCollapsed = false

  if (!skipUserLookup) {
    const cookieStore = await cookies()
    initialSidebarCollapsed = cookieStore.get(SIDEBAR_COLLAPSED_COOKIE)?.value === 'true'
    if (!shellUser) {
      const session = await auth()
      shellUser = session?.user ?? null
    }
  }

  const initials = shellUser
    ? getInitials(shellUser.name ?? null, shellUser.email ?? null)
    : undefined

  return (
    <main className="flex min-h-screen text-[#F4F0FF]">
      {/* Collapsible left sidebar — desktop only, pushes content in the same flex layer */}
      <B2BSidebar
        initialCollapsed={initialSidebarCollapsed}
        initials={initials}
        userName={shellUser?.name ?? undefined}
        userEmail={shellUser?.email ?? undefined}
      />

      {/* Content — flex-1 takes remaining space after sidebar */}
      <div className="flex-1 min-w-0 flex flex-col gap-5 px-3 pb-40 pt-6 sm:px-5 md:pb-10 lg:px-6 lg:pt-8 2xl:px-8">
        <section
          className={cn(
            'mx-auto flex w-full max-w-sm flex-col gap-5 md:max-w-3xl lg:max-w-none',
            contentClassName
          )}
        >
          {children}
        </section>
      </div>

      {/* Bottom dock — mobile only */}
      <AppDock active={active} />
    </main>
  )
}
