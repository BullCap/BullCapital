# Implementation Plan: Design System Calm — Unificação Visual do Frontend

**Branch**: `011-design-system-calm` | **Date**: 2026-06-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/011-design-system-calm/spec.md`

## Summary

Unificar o frontend num único sistema visual "calm": fonte única de tokens no `@theme` do Tailwind v4, primitivos shadcn completos tematizados via tokens, sistema de grid de página (PageShell/PageHeader/Panel/PanelGrid), blocos de data-viz estilo Tremor Raw sobre recharts, e regras de redução de ruído textual. Migração incremental com a ficha do cliente como piloto. Inclui reescrita do `system-design.md` e amendment da constitution (Princípio II) — ambos aprovados pelo dono em 12/jun/2026.

## Technical Context

**Language/Version**: TypeScript 5.7, React 19.2, Next.js 16 (App Router, RSC)

**Primary Dependencies**: Tailwind CSS v4 (`@theme` + `@tailwindcss/postcss`), Radix UI primitives (avatar/dropdown/label/separator/slot já instalados; adicionar tabs/select/dialog/tooltip/toast conforme necessário), class-variance-authority + tailwind-merge + clsx (já instalados), lucide-react (ícones — manter, já é a família do projeto), recharts 3.x (única lib de gráficos ao final), motion 12.x (única lib de animação ao final)

**Removed Dependencies**: `@nivo/circle-packing`, `@react-spring/web` (usados apenas em `components/landing/TopAssetsCirclePacking.tsx`)

**Storage**: N/A (feature puramente de apresentação; nenhuma mudança de schema/Prisma)

**Testing**: Vitest + Testing Library (suíte existente em `web`), `pnpm type-check`, `pnpm lint`; verificação visual manual mobile (390px) + desktop nas rotas migradas

**Target Platform**: Web PWA (Android-first) + desktop; Capacitor shell

**Project Type**: Web application (frontend only — diretório `web/`)

**Performance Goals**: Sem regressão de LCP/CLS; bundle reduz com remoção de 2 dependências; `backdrop-blur` mantido apenas em superfícies fixas já existentes

**Constraints**: Dark-only; pt-BR em toda UI; migração incremental (app funcional a cada etapa); `/docs` (fumadocs) não pode regredir; `OpenFinancePortfolio.tsx` (local, não versionado) não pode quebrar o build local

**Scale/Scope**: ~7 rotas autenticadas (home, clients + 3 subrotas, asset, terminal, search, analysis, settings), ~80 componentes em `web/src/components`, globals.css de 810 linhas → alvo < 300

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Nota |
|---|---|---|
| I. Ship First, Refine Later | PASS | Migração incremental; cada etapa entrega app funcional. Piloto na tela de maior valor B2B (ficha do cliente). |
| II. Presentation Is the Moat | **AMENDMENT** | O princípio exige literalmente glassmorphism ("every card gets the glass treatment"). O dono decidiu em 12/jun/2026 mudar a direção para "calm" (hairline, superfície única, sem glow). O **intent** (qualidade visual como moat, nunca shippar tela fora do design system) é preservado e reforçado — muda a estética prescrita, não o princípio. Este plano inclui amendment do texto do Princípio II e do "What Blocks a Merge" (flat design → fora do design system calm). |
| III. AI Interprets Signals | PASS | Não toca a lógica de IA. |
| IV. Portuguese Always | PASS | Redução de ruído remove redundância; copy permanece pt-BR. |
| V. Mobile-First Constraints | PASS | FR-015 preserva dock/colapso/safe-areas; verificação 390px na DoD de cada etapa. |
| VI. Scope Discipline | PASS (nota) | A constitution v1.1 é pré-pivô (persona B2C, 4 telas). O escopo atual é governado por AGENTS.md §13 pós-pivô. O amendment registra essa atualização de governança. |

**Gate pós-design (re-check)**: nenhuma violação nova introduzida pelas decisões de design (research.md). O amendment é a única exceção e está justificado em Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/011-design-system-calm/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões de stack e alternativas
├── data-model.md        # Fase 1 — inventário de tokens e taxonomia de componentes
├── quickstart.md        # Fase 1 — como construir uma página no sistema novo
├── contracts/
│   └── components.md    # Fase 1 — contratos de props dos componentes de layout e data-viz
└── tasks.md             # Fase 2 — gerado por /speckit-tasks
```

### Source Code (repository root)

```text
web/src/
├── app/
│   ├── globals.css                  # REESCRITO: @theme única fonte de tokens + ~6 utilities
│   ├── layout.tsx                   # Mantém fontes; sem mudança estrutural
│   ├── clients/                     # PILOTO: page.tsx + [id]/ + policy/ + import/ migram para PageShell
│   ├── home/                        # Etapa 2 de migração
│   ├── asset/[ticker]/              # Etapa 3
│   ├── terminal/                    # Etapa 3
│   ├── search/                      # Etapa 3
│   ├── analysis/                    # Etapa 3
│   └── settings/                    # Etapa 3
├── components/
│   ├── ui/                          # Primitivos shadcn completados e re-tematizados
│   │   ├── button.tsx               # Re-tematizado via tokens (sem hex)
│   │   ├── card.tsx                 # Vira a superfície calm única
│   │   ├── input.tsx, label.tsx, avatar.tsx, dropdown-menu.tsx, separator.tsx
│   │   ├── tabs.tsx, select.tsx, dialog.tsx, badge.tsx, tooltip.tsx,
│   │   │   skeleton.tsx, toast.tsx  # NOVOS
│   │   └── chart/                   # NOVOS blocos data-viz (estilo Tremor Raw, copy-paste)
│   │       ├── bar-list.tsx
│   │       ├── category-bar.tsx
│   │       ├── tracker.tsx
│   │       └── spark-chart.tsx
│   ├── layout/                      # NOVO sistema de grid de página
│   │   ├── PageShell.tsx            # presets: wide | focus
│   │   ├── PageHeader.tsx           # título + meta + ações
│   │   ├── Panel.tsx                # superfície calm única (header/body/footer slots)
│   │   ├── PanelGrid.tsx            # grid 12 col, gap fixo
│   │   └── InfoHint.tsx             # tooltip de metodologia (mata rodapés fixos)
│   ├── navigation/AppShell.tsx      # Passa a delegar largura ao PageShell
│   ├── clients/*                    # Migram para Panel/PageHeader/blocos de chart
│   ├── home/*                       # Idem
│   ├── asset/*, terminal/*, search/*, analysis/*  # Idem
│   └── landing/TopAssetsCirclePacking.tsx  # Substituído (remove nivo/react-spring)
system-design.md                     # REESCRITO na direção calm
.specify/memory/constitution.md      # Amendment Princípio II + merge gates (v1.2.0)
```

**Structure Decision**: tudo vive em `web/` (frontend-only). Novidades concentradas em `components/ui/chart/` e `components/layout/`; o resto é migração in-place. Nenhuma mudança em `api/`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Amendment do Princípio II da constitution (glassmorphism obrigatório → direção calm) | O documento atual *exige* glow/sombras/glass em todo card — é a causa raiz do ruído visual que esta feature elimina. Decisão explícita do dono em 12/jun/2026 com discussão documentada (spec §Contexto). | "Manter glass e só reduzir ruído" foi oferecido ao dono e rejeitado em favor da reescrita completa na direção calm. |
