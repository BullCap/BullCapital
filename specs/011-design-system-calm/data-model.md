# Data Model — Design System Calm (011)

Feature de apresentação: não há entidades de banco. O "modelo de dados" aqui é o inventário de tokens e a taxonomia de componentes — os contratos que o resto do código consome.

## 1. Tokens (`@theme`, globals.css)

### Cor (semântica, dark-only)

| Token | Valor | Papel |
|---|---|---|
| `--color-void` | `#0C0F15` | Fundo de página |
| `--color-surface` | `rgba(255,255,255,0.018)` sobre void | Corpo do Panel |
| `--color-surface-raised` | `#12161F` | Popover, dialog, dropdown (opaco) |
| `--color-ink` | `#E2DEF0` | Texto pleno |
| `--color-ink-soft` | ink @ 70% | Corpo |
| `--color-ink-muted` | ink @ 48% | Suporte |
| `--color-ink-faint` | ink @ 35% | Meta, disabled |
| `--color-accent` | `#82759F` | Ação primária, foco, ativo |
| `--color-positive` | `#7FB59A` | Tendência de alta |
| `--color-negative` | `#C98C9A` | Tendência de baixa |
| `--color-warning` | `#D0B982` | Staleness, atenção |
| `--color-hairline` | `rgba(255,255,255,0.06)` | Borda padrão |
| `--color-hairline-strong` | `rgba(255,255,255,0.12)` | Borda hover/focus |

Regra: **nenhum hex fora do `@theme`** (exceto a ponte `--color-fd-*` do fumadocs, que referencia os mesmos valores).

### Tipografia (6 passos — ver research R2)

`text-2xs(10)`, `text-xs(11)`, `text-sm(13)`, `text-base(15)`, `text-lg(18)`, `text-display(clamp 28–36, serif)`. Tracking de eyebrow único: `0.14em`. Números: sempre `tabular-nums`.

### Raio (2 níveis)

`--radius-control: 10px` · `--radius-panel: 16px` · pills `rounded-full`.

### Espaçamento (ritmo de bloco)

Entre painéis e no PanelGrid: `gap-6`. Dentro do painel: `gap-4`, padding `p-5` (mobile `p-4`). Micro-alinhamento (`gap-1/2`) livre.

## 2. Taxonomia de componentes

```text
Camada 0 — tokens          @theme (globals.css)
Camada 1 — primitivos      components/ui/* (button, card, input, label, avatar,
                           dropdown-menu, separator, tabs, select, dialog, badge,
                           tooltip, skeleton, toast)
Camada 2 — layout          components/layout/* (PageHeader, Panel, PanelGrid, InfoHint)
                           + AppShell(width preset)
Camada 3 — data-viz        components/ui/chart/* (BarList, CategoryBar, Tracker,
                           SparkChart) + chartTheme.ts (recharts direto)
Camada 4 — features        components/{clients,home,asset,terminal,search,analysis}/*
                           compõem camadas 1–3; não definem superfície/escala próprias
```

Invariantes (enforcement por API + lint de PR):
- Camada 4 não usa `rounded-[*]`, `text-[*px]`, hex, nem classes `bull-*`.
- Toda superfície de bloco é `<Panel>`; toda página declara `width` preset no AppShell.
- Painel: máx. 2 níveis de texto fixo (`title` + conteúdo); metodologia via `hint`.

## 3. Estados padrão (por primitivo)

| Estado | Mecanismo |
|---|---|
| Loading | `<Skeleton>` com shape do conteúdo final (substitui skeletons ad-hoc) |
| Empty | Slot `empty` do Panel (ícone + 1 frase + ação opcional) |
| Error | Inline no Panel (corpo) ou `toast` para transientes |
| Hover | Apenas `border-hairline → hairline-strong` (sem translate/glow) |
| Focus | `ring-2 ring-accent/35` em todos os interativos |
| Reduced motion | Bloco global `prefers-reduced-motion` existente, mantido |

## 4. Mapa de migração (de → para)

| Legado | Substituto |
|---|---|
| `.glass-card`, `.bull-panel`, `.bull-panel-focus`, `.bull-panel-quiet`, `.bull-frame`, `.bull-card-calm` | `<Panel>` (única superfície) |
| `.bull-action`, `.bull-action-primary`, `.bull-icon-button` | `<Button variant=secondary/default size=icon>` |
| `.bull-input`, `.bull-select` | `<Input>`, `<Select>` |
| `.bull-tab`, `.bull-segmented(-grid)` | `<Tabs>` |
| `.bull-chip`, `.bull-suggestion-pill` | `<Badge>` / `<Button variant=pill>` |
| `.bull-stat-label/value`, `.bull-eyebrow` | tipografia da escala (`text-xs uppercase tracking-eyebrow text-ink-faint`, `text-lg tabular-nums`) |
| `.bull-page-header/title/subtitle` | `<PageHeader>` |
| `.bull-asset-hero`, `.bull-advisor-stage`, `.bull-digest-panel` | `<Panel emphasis>` (variante única de destaque) |
| `contentClassName` (string livre) | `width: 'wide' \| 'focus'` |
| nivo CirclePacking (landing) | grade de destaque com superfície calm |
