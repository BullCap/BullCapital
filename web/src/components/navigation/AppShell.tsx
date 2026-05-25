import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { auth } from '@/lib/auth'
import AppDock, { type AppDockSection } from './AppDock'
import AppHeader from './AppHeader'
import Grainient from '@/components/landing/Grainient'

interface AppShellProps {
  active: AppDockSection
  children: ReactNode
  contentClassName?: string
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

export default async function AppShell({ active, children, contentClassName }: AppShellProps) {
  const session = await auth()
  const initials = session?.user
    ? getInitials(session.user.name ?? null, session.user.email ?? null)
    : undefined

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden text-[#F4F0FF]">
      {/* Fixed WebGL Background — same visual language as landing, calmer for dashboard use */}
      <div className="pointer-events-none fixed inset-0 -z-50 h-screen w-screen opacity-[0.28]">
        <Grainient
          color1="#0D0B14"
          color2="#8B5CF6"
          color3="#0D0B14"
          timeSpeed={0.12}
          colorBalance={0}
          warpStrength={1.8}
          warpFrequency={5}
          warpSpeed={1.0}
          warpAmplitude={45}
          blendAngle={0}
          blendSoftness={0.08}
          rotationAmount={280}
          noiseScale={2}
          grainAmount={0.05}
          grainScale={2}
          grainAnimated={true}
          contrast={1.3}
          gamma={1}
          saturation={0.9}
          centerX={0}
          centerY={0}
          zoom={0.9}
          className="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050409]/30 via-[#050409]/65 to-[#050409]" />
      </div>

      {/* Fixed glass pill header with nav (desktop) + notch animation */}
      <AppHeader initials={initials} />

      {/* Content — top padding clears the fixed header */}
      <div className="mx-auto flex w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1760px] flex-col gap-5 px-4 pb-40 pt-[5.5rem] sm:px-6 md:pb-10 lg:px-8 lg:pt-[6rem]">
        <section
          className={cn(
            'mx-auto flex w-full max-w-sm flex-col gap-5 md:max-w-3xl lg:max-w-none',
            contentClassName
          )}
        >
          {children}
        </section>
      </div>

      {/* Bottom dock — mobile only (desktop nav is in the header) */}
      <AppDock active={active} />
    </main>
  )
}
