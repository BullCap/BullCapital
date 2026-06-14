import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PanelGridProps {
  /** Panels declaram col-span via className (md:col-span-{4,6,8,12}); default 12. */
  children: ReactNode
  className?: string
}

/**
 * PanelGrid — grid de página de 12 colunas com gap fixo (ritmo de bloco do
 * design system calm). Colapsa para 1 coluna no mobile, mantendo a ordem do DOM.
 */
export default function PanelGrid({ children, className }: PanelGridProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-6 md:grid-cols-12', className)}>{children}</div>
  )
}
