import Link from 'next/link'
import { cn } from '@/lib/utils'

export type BarColor = 'accent' | 'positive' | 'negative'

export interface BarListItem {
  name: string
  /** Valor que define a largura da barra (usa-se o módulo). */
  value: number
  /** Texto à direita já formatado; se ausente, cai no valueFormatter. */
  label?: string
  /** Linha secundária discreta sob o nome (ex.: volume, nº de posições). */
  sublabel?: string
  href?: string
  color?: BarColor
}

interface BarListProps {
  data: BarListItem[]
  valueFormatter?: (value: number) => string
  /** Limita o número de barras renderizadas. */
  maxItems?: number
}

const FILL: Record<BarColor, string> = {
  accent: 'bg-primary/20',
  positive: 'bg-positive/20',
  negative: 'bg-negative/20',
}

const VALUE: Record<BarColor, string> = {
  accent: 'text-ink',
  positive: 'text-positive',
  negative: 'text-negative',
}

/**
 * BarList — ranking horizontal estilo Tremor Raw sobre tokens calm. Barra de
 * fundo hairline, fill semântico translúcido; valor tabular à direita. Sem
 * sombra, sem glow. Cada item vira link quando href está presente.
 */
export function BarList({ data, valueFormatter, maxItems }: BarListProps) {
  const items = maxItems ? data.slice(0, maxItems) : data
  const max = Math.max(...items.map((item) => Math.abs(item.value)), 1)

  return (
    <ol className="flex flex-col gap-2">
      {items.map((item) => {
        const color = item.color ?? 'accent'
        const width = Math.max((Math.abs(item.value) / max) * 100, 4)
        const right = item.label ?? valueFormatter?.(item.value) ?? String(item.value)

        const row = (
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex h-9 min-w-0 flex-1 items-center overflow-hidden rounded-control">
              <div
                className={cn('absolute inset-y-0 left-0 rounded-control transition-[width] duration-500', FILL[color])}
                style={{ width: `${width}%` }}
                aria-hidden
              />
              <div className="relative z-10 flex min-w-0 flex-col px-2.5 leading-tight">
                <span className="truncate text-sm font-medium text-ink">{item.name}</span>
                {item.sublabel ? (
                  <span className="truncate text-xs tabular-nums text-ink-faint">{item.sublabel}</span>
                ) : null}
              </div>
            </div>
            <span className={cn('shrink-0 text-sm font-medium tabular-nums', VALUE[color])}>{right}</span>
          </div>
        )

        return (
          <li key={item.name}>
            {item.href ? (
              <Link
                href={item.href}
                className="block rounded-control transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
              >
                {row}
              </Link>
            ) : (
              row
            )}
          </li>
        )
      })}
    </ol>
  )
}
