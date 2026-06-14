# Contracts — Componentes de Layout e Data-viz (011)

Contratos de props dos componentes novos. Camada 4 (features) só consome estas APIs.

## AppShell (alterado)

```ts
interface AppShellProps {
  active: AppDockSection
  width?: 'wide' | 'focus'        // default 'wide'; SUBSTITUI contentClassName
  children: ReactNode
  sessionUser?: { name?: string | null; email?: string | null } | null
  skipUserLookup?: boolean
}
// wide  → mx-auto w-full max-w-[1560px]
// focus → mx-auto w-full max-w-[880px]
// Coluna interna: flex flex-col gap-6 (ritmo de bloco fixo)
```

## PageHeader

```ts
interface PageHeaderProps {
  title: string                    // text-display (serif)
  eyebrow?: string                 // ÚNICO eyebrow permitido na página
  meta?: ReactNode                 // chips de status (StalenessChip, posição de data…)
  actions?: ReactNode              // botões à direita (wrap no mobile)
  backHref?: string                // seta de retorno (subpáginas)
}
```

## Panel

```ts
interface PanelProps {
  title?: string                   // text-lg; sem slot de subtítulo (by design)
  hint?: string                    // metodologia → InfoHint (tooltip), nunca texto fixo
  actions?: ReactNode              // controles do painel (Tabs, botões) no header
  footer?: ReactNode               // reservado a disclaimer/CTA; nunca texto metodológico
  emphasis?: boolean               // variante única de destaque (hero da ficha, briefing)
  empty?: { icon?: LucideIcon; label: string; action?: ReactNode }  // estado vazio
  className?: string               // só para col-span no grid
  children: ReactNode
}
// Superfície: rounded-panel border border-hairline bg-surface p-5 (mobile p-4)
// Hover: border-hairline-strong. Sem glow, sem translate, sem sombra projetada.
```

## PanelGrid

```ts
interface PanelGridProps {
  children: ReactNode              // Panels com col-span via className
  className?: string
}
// grid grid-cols-1 gap-6 md:grid-cols-12
// Filhos declaram md:col-span-{4,6,8,12}; default 12.
// Colapso mobile: sempre 1 coluna, mesma ordem do DOM.
```

## InfoHint

```ts
interface InfoHintProps { content: string }  // ícone Info 14px + Tooltip Radix
```

## ui/chart/BarList

```ts
interface BarListItem { name: string; value: number; label?: string;  // "R$ 770.000"
  sublabel?: string;               // "4 posições"
  href?: string; color?: 'accent' | 'positive' | 'negative' }
interface BarListProps {
  data: BarListItem[]
  valueFormatter?: (v: number) => string
  maxItems?: number                // resto colapsa em "ver todos"
}
// Barra: fundo hairline, fill accent @ 30%; valor text-sm tabular-nums à direita.
```

## ui/chart/CategoryBar

```ts
interface CategoryBarSegment { label: string; value: number; color?: string }
interface CategoryBarProps {
  segments: CategoryBarSegment[]   // percentuais; soma ≤ 100
  marker?: number                  // alvo da política (linha vertical)
  showLegend?: boolean
}
```

## ui/chart/Tracker

```ts
interface TrackerProps {
  value: number; max: number       // ex.: exposição vs. limite FGC
  status?: 'ok' | 'warning' | 'over'
  label?: string
}
// over → fill negative; warning → warning; ok → accent. Sem track de fundo pesado.
```

## ui/chart/SparkChart

```ts
interface SparkChartProps {
  data: number[]
  trend?: 'up' | 'down' | 'flat'   // define cor (positive/negative/ink-muted)
  height?: number                  // default 32
}
// recharts AreaChart sem eixos/grid; stroke 1.5px; fill gradient 8% → 0.
```

## chartTheme.ts (usos diretos de recharts)

```ts
export const chartTheme = {
  grid: 'var(--color-hairline)',
  axis: { tick: { fill: 'var(--color-ink-faint)', fontSize: 10 } },
  tooltip: { /* surface-raised, border hairline, radius-control */ },
  series: ['var(--color-accent)', 'var(--color-positive)', 'var(--color-negative)',
           'var(--color-warning)', /* + 2 tons derivados */],
}
```

## Primitivos novos (anatomia shadcn padrão, tematizados via tokens)

`tabs.tsx` (Radix Tabs; substitui `.bull-segmented`/`.bull-tab`), `select.tsx` (Radix Select; substitui `.bull-select`), `dialog.tsx` (Radix Dialog, surface-raised), `badge.tsx` (variants: neutral/accent/positive/negative/warning; substitui chips e SeverityBadge), `tooltip.tsx` (Radix), `skeleton.tsx` (pulse em hairline), `toast.tsx` (sonner-style ou Radix Toast — decidir na task pela menor dependência).

Compromissos de contrato:
- Nenhum componente aceita `style` ou cor por prop livre — variantes nomeadas apenas.
- Todos os interativos: alvo de toque ≥ 44px no mobile, `focus-visible:ring-2 ring-accent/35`.
- Labels de formulário acima do input; erro abaixo; nunca placeholder-como-label.
