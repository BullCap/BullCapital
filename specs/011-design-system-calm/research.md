# Research — Design System Calm (011)

Fase 0. Todas as incógnitas do Technical Context resolvidas. Auditoria de base feita em 12/jun/2026 na sessão de especificação.

## R1. Estratégia de tokens: Tailwind v4 `@theme` como fonte única

**Decision**: Todos os tokens (cor semântica, tipo, raio, espaçamento) vivem no bloco `@theme` de `globals.css`. As variáveis shadcn (`--color-background`, `--color-card`, ...) são definidas diretamente com os valores calm — eliminando a indireção `hsl(var(--x))` herdada do shadcn v3 e o bloco `:root` paralelo ("BullCapital Design System Tokens"). Cores da marca viram tokens semânticos (`--color-surface`, `--color-surface-raised`, `--color-ink`, `--color-ink-muted`, `--color-accent`, `--color-positive`, `--color-negative`, `--color-warning`, `--color-hairline`, `--color-hairline-strong`).

**Rationale**: O Tailwind v4 gera utilities a partir do `@theme` nativamente (`bg-surface`, `text-ink-muted`, `border-hairline`); um único lugar define tudo e o resto do CSS some. A duplicação atual (`@theme` com um conjunto de hex + `:root` com outro + system-design.md com um terceiro) é exatamente o que causou a divergência.

**Alternatives considered**: (a) Manter o padrão shadcn `hsl(var(--x))` — rejeitado: é o estilo v3, adiciona indireção sem ganho num app dark-only de tema único; (b) CSS vars custom fora do `@theme` — rejeitado: não gera utilities, perpetua `bg-[var(--surface)]`.

**Valores de referência (paleta calm, derivada da camada `bull-card-calm`/`bull-frame` existente)**:
- `void` (fundo de página): `#0C0F15` — o valor do `:root` atual, já usado pelo `themeColor` do PWA e pelas telas; os valores `#050308`/`#0D0A13` do `@theme` antigo são descartados.
- `ink` (texto): `#E2DEF0` com escala de opacidade padronizada em 4 passos: 100% (títulos/valores), 70% (corpo), 48% (suporte), 35% (meta/desabilitado). Hoje há ~12 opacidades distintas.
- `accent` (amethyst dessaturado): `#82759F` — o tom já usado na prática; o `#8B5CF6` do system-design.md antigo é descartado (saturado demais para a direção calm). Scrollbar e focus rings migram de `rgba(139,92,246,…)` para o accent.
- Tendência: `--color-positive: #7FB59A`, `--color-negative: #C98C9A` (já existentes como `bull-trend-*`), `--color-warning: #D0B982` (já usado no StalenessChip).
- Hairline: `rgba(255,255,255,0.06)` padrão, `0.12` strong (hover/focus).

## R2. Escala tipográfica: 6 passos nomeados

**Decision**: Redefinir a escala de texto no `@theme` com 6 passos que cobrem o uso real do app:

| Token | Tamanho/leading | Uso |
|---|---|---|
| `text-2xs` | 10px / 14px | meta, ticks de eixo, células densas |
| `text-xs` | 11px / 16px | labels, eyebrows, badges |
| `text-sm` | 13px / 20px | corpo padrão do app |
| `text-base` | 15px / 24px | corpo destacado, inputs |
| `text-lg` | 18px / 26px | título de painel |
| `text-display` | clamp(28px→36px) / 1.1, serif | título de página (PageHeader) |

Valores numéricos grandes (KPI) usam `text-display`-adjacent via componente (`Panel`/`Stat`), sempre `tabular-nums`, peso `font-medium`. Tracking de eyebrow padronizado num único valor: `0.14em` (o mais usado hoje, 18 ocorrências).

**Rationale**: A auditoria achou 20 tamanhos arbitrários (370+ ocorrências, incluindo `text-[5px]`–`text-[9px]` ilegíveis). 6 passos cobrem todos os casos reais; o que não couber é sinal de excesso de hierarquia (FR-010).

**Alternatives considered**: manter a escala default do Tailwind (12/14/16/18...) — rejeitado: o app é denso e dark; 12px default é grande para meta e 16px grande para corpo, o que foi exatamente o que empurrou os devs para valores arbitrários.

## R3. Raio de borda: 2 níveis semânticos

**Decision**: `--radius-control: 10px` (botões, inputs, tabs, chips internos usam `rounded-control`; pills continuam `rounded-full`) e `--radius-panel: 16px` (Panel, dialogs, superfícies). Os 9 valores arbitrários (`1.1rem`–`2.5rem`) e o trio shadcn sm/md/lg derivado são eliminados.

**Rationale**: Regra documentável ("controles 10, painéis 16, pills full") é o que mantém consistência entre agentes/devs. O `2rem+` do system-design.md antigo é parte da estética skeuomórfica descartada.

## R4. Espaçamento: ritmo fixo de 2 gaps

**Decision**: `gap-panel-inner = 1rem (gap-4)` dentro de painéis; `gap-panel = 1.5rem (gap-6)` entre painéis (e como gap do PanelGrid). Padding interno de Panel: `p-5` (mobile `p-4`). Section spacing vertical da página: `gap-6`. Micro-gaps (`gap-1`/`gap-2`) continuam livres para alinhamento fino de ícone+texto.

**Rationale**: A divergência visível nas screenshots vem dos gaps de bloco (3/4/5/6/8 misturados no mesmo nível hierárquico). Fixar o nível de bloco resolve 90% sem burocratizar o nível micro.

## R5. Data-viz: blocos estilo Tremor Raw copy-paste sobre recharts

**Decision**: Não instalar pacote `@tremor/react`. Copiar/adaptar 4 blocos do Tremor Raw (BarList, CategoryBar, Tracker, SparkChart) para `components/ui/chart/`, tematizados com os tokens calm. Recharts permanece a engine para line/area/treemap existentes; um `chartTheme.ts` central define cores/grid/tooltip para os usos diretos de recharts.

**Rationale**: Tremor Raw é copy-paste (mesma filosofia shadcn: você é dono do código), construído sobre Tailwind + Radix + recharts — zero dependência nova, mesma base. O pacote `@tremor/react` clássico traria um segundo theme provider e classes próprias (viola "um sistema por projeto").

**Mapeamento de uso**:
- `BarList` → composição por classe/instituição/emissor (ficha do cliente), altas/baixas/volume (home)
- `CategoryBar` → carteira vs. política-alvo (delta por classe), barra de composição do hero
- `Tracker`/`ProgressBar` → exposição FGC por instituição (% do limite)
- `SparkChart` → pulso de mercado (IBOV, S&P, USD/BRL, VIX)

**Alternatives considered**: (a) instalar `@tremor/react` — rejeitado (acima); (b) shadcn charts oficial — viável, mas os blocos *não-chart* do Tremor (BarList/CategoryBar/Tracker) são justamente os que o produto mais usa e não existem no shadcn charts; adotamos a anatomia do shadcn para os charts recharts (config de cores via CSS vars) e os blocos Tremor para o resto.

## R6. Remoção de `@nivo/circle-packing` + `@react-spring/web`

**Decision**: Único consumidor é `components/landing/TopAssetsCirclePacking.tsx` (landing pública). Substituir por uma grade estática de destaque (cards de ativos com a superfície calm) ou pelo `SectorTreeMap` já existente; remover as duas dependências. `ogl` (`Grainient.tsx`, landing) fica fora do escopo desta feature — anotado para revisão futura.

**Rationale**: Landing é vitrine; circle-packing animado por física é a estética antiga. Duas dependências saem do bundle com mudança em 1 arquivo.

## R7. Estrutura do AppShell vs. PageShell

**Decision**: `AppShell` (server component: sidebar + dock + auth) permanece dono da navegação, mas perde o `contentClassName` livre. Ganha prop `width: 'wide' | 'focus'` que aplica os presets: `wide` = `max-w-[1560px]` (dashboards), `focus` = `max-w-[880px]` (formulários/fluxos). `PageShell` é implementado *dentro* do AppShell (não é um wrapper extra por página) para evitar boilerplate; `PageHeader`, `Panel`, `PanelGrid` e `InfoHint` são componentes de composição usados pelas páginas.

**Rationale**: As 7 páginas já passam pelo AppShell; mudar a prop de string livre para enum fecha a porta da divergência no mesmo lugar onde ela nasceu. O valor `2xl:max-w-[1720px]` é descartado (um breakpoint a menos de variação).

## R8. Redução de ruído — mecânica

**Decision**:
- `Panel` aceita `title` (text-lg) e opcional `hint` (string → renderiza `InfoHint`, um ícone de info com Tooltip Radix). Não há slot para subtítulo nem rodapé de texto — a ausência do slot é o enforcement.
- Eyebrows deixam de ser o padrão de seção: `PageHeader` tem 1 eyebrow opcional (contexto da página, ex. "FICHA CONSOLIDADA"); painéis usam apenas `title`. Resultado: máx. 1 eyebrow por página, melhor que o teto do FR-011.
- Disclaimers obrigatórios (compliance) permanecem — 1 por página, no rodapé, via `DisclaimerNote` existente re-tematizado.

**Rationale**: Regra aplicada por API de componente > regra escrita em doc. O texto metodológico continua acessível (tooltip), atendendo o "sem perda de informação" do SC-005.

## R9. Compat fumadocs (/docs)

**Decision**: Manter o bloco de ponte `--color-fd-*` em `globals.css`, atualizando apenas os valores para os tokens novos (mesmos hex, agora únicos). Nenhuma mudança estrutural em `/docs`.

## R10. Animação

**Decision**: `motion` (motion/react) é a única lib de animação do app pós-feature (react-spring sai junto com o nivo). Keyframes CSS existentes (`float`, `pulse-glow`, `nav-progress`) são revisados: `pulse-glow` e `float` saem com a estética antiga; `nav-progress` fica. `prefers-reduced-motion` mantém o bloco global existente.
