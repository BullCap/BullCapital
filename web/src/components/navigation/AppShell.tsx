import type { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import AppDock, { type AppDockSection } from './AppDock'

interface AppShellProps {
  active: AppDockSection
  children: ReactNode
  contentClassName?: string
}

export default function AppShell({ active, children, contentClassName }: AppShellProps) {
  return (
    <main className="min-h-screen px-4 pb-40 pt-5 sm:px-6 md:pb-10 lg:px-8 lg:pt-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="flex min-h-14 items-center px-1">
          <Link href="/home" className="bull-wordmark" aria-label="Bull home">
            <span className="bull-brand-mark" />
            <span>Bull</span>
          </Link>
        </header>

        <div className="grid gap-5 lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:items-start">
          <AppDock active={active} />
          <section
            className={cn(
              'mx-auto flex w-full max-w-sm flex-col gap-5 md:max-w-3xl lg:max-w-none',
              contentClassName
            )}
          >
            {children}
          </section>
        </div>
      </div>
    </main>
  )
}
