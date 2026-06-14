import type { ReactNode } from 'react'
import { Info, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PanelEmptyState {
  icon?: LucideIcon
  label: string
  action?: ReactNode
}

interface PanelProps {
  /** Título curto do bloco (text-lg). Sem slot de subtítulo, by design. */
  title?: string
  /** Metodologia — vira InfoHint (ícone + tooltip), nunca texto fixo. */
  hint?: string
  /** Controles do painel (Tabs, botões) alinhados à direita no header. */
  actions?: ReactNode
  /** Reservado a disclaimer/CTA; nunca texto metodológico. */
  footer?: ReactNode
  /** Variante única de destaque (hero da ficha, briefing). */
  emphasis?: boolean
  /** Estado vazio do bloco. */
  empty?: PanelEmptyState
  /** Apenas para col-span no PanelGrid. */
  className?: string
  children?: ReactNode
}

/**
 * Panel — a superfície calm única do design system (shadcn + Tremor Raw).
 * Hairline + fundo quase imperceptível, sem glow/sombra projetada. Hover só
 * clareia a borda. Todo bloco de dados da app vive dentro de um Panel.
 */
export default function Panel({
  title,
  hint,
  actions,
  footer,
  emphasis = false,
  empty,
  className,
  children,
}: PanelProps) {
  const hasHeader = Boolean(title || actions)
  const EmptyIcon = empty?.icon

  return (
    <section
      className={cn(
        'rounded-panel border p-4 transition-colors duration-300 sm:p-5',
        emphasis
          ? 'border-primary/20 bg-primary/4 hover:border-primary/30'
          : 'border-hairline bg-white/[0.018] hover:border-hairline-strong',
        className
      )}
    >
      {hasHeader ? (
        <header className="mb-4 flex items-start justify-between gap-3">
          {title ? (
            <h3 className="flex items-center gap-1.5 text-lg font-medium leading-tight text-ink">
              {title}
              {hint ? <InfoHint content={hint} /> : null}
            </h3>
          ) : (
            <span />
          )}
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}

      {empty ? (
        <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
          {EmptyIcon ? <EmptyIcon className="size-6 text-ink-faint" aria-hidden /> : null}
          <p className="text-sm text-ink-muted">{empty.label}</p>
          {empty.action}
        </div>
      ) : (
        children
      )}

      {footer ? <footer className="mt-4 border-t border-hairline pt-4">{footer}</footer> : null}
    </section>
  )
}

/**
 * InfoHint — ícone de metodologia. Tooltip Radix entra numa etapa posterior do
 * 011; por ora usa o title nativo para não bloquear o piloto.
 */
function InfoHint({ content }: { content: string }) {
  return (
    <span
      title={content}
      className="inline-flex cursor-help text-ink-faint transition-colors hover:text-ink-muted"
      aria-label={content}
    >
      <Info className="size-3.5" aria-hidden />
    </span>
  )
}
