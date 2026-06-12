// Small shared atoms of the client portfolio area: staleness chip, severity
// badge, disclaimer and section scaffolding. Server-safe (no client hooks).
import type { ReactNode } from 'react'
import { Clock3, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConcentrationAlertLevel } from '@/modules/portfolio'
import { ALERT_LEVEL_LABELS, alertLevelClass, formatAge } from './format'

/** Honest data-age labelling — "atualizado há X" instead of "AO VIVO". */
export function StalenessChip({ ageDays, stale }: { ageDays: number; stale: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium',
        stale
          ? 'border-[#d0b982]/25 bg-[#d0b982]/10 text-[#ead9ad]'
          : 'border-white/[0.07] bg-white/[0.03] text-starlight/55'
      )}
    >
      <Clock3 size={11} />
      {formatAge(ageDays)}
      {stale && ' — reimporte a planilha'}
    </span>
  )
}

export function SeverityBadge({ level }: { level: ConcentrationAlertLevel }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]',
        alertLevelClass(level)
      )}
    >
      {ALERT_LEVEL_LABELS[level]}
    </span>
  )
}

/** Mandatory disclaimer on anything that can be copied to an end client. */
export function DisclaimerNote({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3 text-[11px] leading-5 text-starlight/40',
        className
      )}
    >
      <ShieldAlert size={13} className="mt-0.5 shrink-0 text-starlight/30" />
      <span>
        Este material é descritivo e não constitui recomendação de investimento. Os números
        derivam do snapshot importado pelo assessor e da política definida por ele; a decisão
        é sempre do profissional responsável.
      </span>
    </p>
  )
}

interface SectionProps {
  eyebrow: string
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/** Standard section card of the ficha: hairline frame, serif title, editorial breathing. */
export function FichaSection({ eyebrow, title, description, actions, children, className }: SectionProps) {
  return (
    <section className={cn('bull-card-calm p-6 md:p-8', className)}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="bull-eyebrow">{eyebrow}</p>
          <h2 className="mt-1.5 font-serif text-xl text-starlight md:text-2xl">{title}</h2>
          {description && (
            <p className="mt-1.5 max-w-xl text-[13px] leading-6 text-starlight/45">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <div className="mt-6">{children}</div>
    </section>
  )
}

/** Methodology footnote — how a number was computed (transparency is a sales argument). */
export function MethodologyNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 border-t border-white/[0.05] pt-4 text-[11px] leading-5 text-starlight/35">
      {children}
    </p>
  )
}
