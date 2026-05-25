# AGENTS.md — Base de Conhecimento da Bull

> **Este é o documento canônico de contexto para qualquer agente de código (Claude Code, Cursor, Codex, Aider, etc.) trabalhando neste repositório.** Leia até o fim antes de propor mudanças. Quando algo neste arquivo entrar em conflito com seu instinto, prefira o que está escrito aqui — foi decidido após discussão de produto.

---

## 1. TL;DR para agentes (leia primeiro, sempre)

A Bull é uma **plataforma de inteligência de mercado brasileiro para profissionais financeiros** — CFPs, criadores de conteúdo financeiro e AAIs. Não é app de trader, não é robo-advisor, não é fintech generalista. O produto **embasa narrativas de mercado**; quem recomenda é o profissional. A Bull nunca diz "compre" ou "venda".

- **Stack**: Next.js 15 (App Router + PWA) + FastAPI + Postgres+pgvector
- **Idioma do produto**: pt-BR exclusivo em todo texto voltado ao usuário
- **Estética**: glassmorphism + skeuomorphism 2.0 — flat design é proibido (ver [system-design.md](system-design.md))
- **Modelo de uso**: híbrido — research na ferramenta + exportação de cards/PDFs para WhatsApp/Instagram do cliente do consultor
- **Deadline MVP B2B**: 10 de julho de 2026 (ver §13 Roadmap)

**Antes de codar qualquer coisa, confira:**
1. A feature está no escopo do MVP (§13)? Se não, pause e pergunte ao usuário.
2. O componente que você quer criar já existe? Veja §6 (inventário) — provavelmente sim.
3. A copy está em pt-BR? Se há texto em inglês voltado ao usuário, é bug.
4. A UI obedece o design system? Se tem `bg-color` sem `shadow` e `backdrop-blur`, é bug.

---

## 2. Modelo de negócio e personas

### 2.1 Pivô (decidido em 2026-05-24)

A Bull começou como app educacional para investidor PF amador (25-45 anos). Em 2026-05-24 o produto pivotou para **B2B / B2B2C de profissionais financeiros**, mantendo o mesmo código-base, design system e postura editorial — mudando apenas o **público-alvo**, **a copy** e **três features novas** (comparador, briefing diário, exportação).

### 2.2 Personas (em ordem de prioridade)

#### Persona primária 1: **Planejador financeiro CFP**
- Trabalha de forma independente ou em escritórios de planejamento; certificado pela Planejar.
- Atende 20-100 clientes PF; relação de longo prazo, não transacional.
- **Jobs to be done na Bull**:
  - Comparar 2-4 ativos para justificar uma alocação ao cliente.
  - Entender rapidamente o "porquê" de um movimento de mercado antes de uma call.
  - Gerar um material curto (PDF/imagem) explicando um ativo ou evento para enviar ao cliente via WhatsApp/email.
  - Receber um briefing matinal que vire munição para a conversa do dia.
- **NÃO precisa** (no MVP): cadastro de clientes, suitability, projeções de aposentadoria, integração com plataforma da corretora.

#### Persona primária 2: **Criador de conteúdo financeiro** (influencer)
- Posta no Instagram/YouTube/Twitter/newsletter. Audiência: 1k-500k.
- Precisa transformar movimento de mercado em narrativa publicável **rápido** (idealmente até as 10h BRT).
- **Jobs to be done na Bull**:
  - Pegar a história do dia (briefing) e transformar em post.
  - Exportar imagem de comparação ou análise pronta para Instagram/Stories.
  - Encontrar contexto histórico/macro para fundamentar o post.
- **NÃO precisa**: ferramentas de gestão de carteira, integração com CRM.

#### Persona secundária: **AAI (Agente Autônomo de Investimento)**
- Certificado Ancord, vinculado a uma corretora.
- Foco mais transacional que CFP; ciclo de decisão mais curto.
- Usa a Bull como **research secundário** — costuma ter terminal Bloomberg/Economatica.
- **Atende casos extremos do MVP** mas não é o foco do desenho da experiência.

### 2.3 Anti-persona (quem NÃO é alvo)

- Investidor PF amador buscando "qual ação comprar"
- Day trader / scalper precisando de book de ofertas, gráficos com indicadores técnicos densos
- Analista buy-side de fundo (precisa de fundamentus profundo, screener avançado, export CSV)
- Estudante de finanças aprendendo o básico

Se uma feature beneficia primariamente a anti-persona, ela **não entra**.

### 2.4 Promessa de produto

> "Munição de research e narrativa para quem precisa explicar mercado para outros."

Não somos um analista que opina pelo profissional. Somos a fundamentação que o profissional usa para opinar com mais confiança.

---

## 3. Postura editorial (regras de copy)

Estas regras são **invioláveis** e aparecem em código, UI, prompts da IA e comunicação externa:

1. **Nunca recomendar compra/venda/hold.** Nem direta nem indiretamente ("este ativo está barato", "momento atrativo de entrada" — proibido). Análise descreve, contextualiza, levanta riscos — nunca aconselha.
2. **Sempre pt-BR.** Brasileiro, não português europeu. Sem code-switching para inglês exceto termos técnicos consagrados (ETF, IPO, P/L).
3. **Ancorada em ativo / evento / indicador.** Não existe IA conversacional aberta; toda análise parte de um contexto concreto (um ticker, uma notícia, uma variação macro).
4. **Disclaimer permanente e não-dismissível** em qualquer tela que expõe análise IA. Padrão atual: "Análises são contextuais e educacionais. Não constituem recomendação de investimento."
5. **Tom: calmo, sério, editorial.** Como uma boa revista de economia, não como um app de fintech vibrante. Zero gamificação, zero emoji em UI, zero linguagem motivacional ("rumo aos seus objetivos!").
6. **Números sempre formatados em pt-BR**: vírgula decimal, ponto de milhar, R$ antes do valor, `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`.

---

## 4. Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│  Browser / Android PWA (instalável via Chrome)          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Next.js 15 — App Router + Server Components      │  │
│  │  - Auth: NextAuth v5 (Credentials + JWT)          │  │
│  │  - PWA: manifest + service worker                 │  │
│  │  - BFF: server actions chamam Brapi + FastAPI     │  │
│  │  - Capacitor 8 instalado (preparação Android nativo)│  │
│  └─────────┬─────────────────────────────────┬───────┘  │
└────────────┼─────────────────────────────────┼──────────┘
             │                                 │
             ▼                                 ▼
     ┌───────────────┐               ┌──────────────────┐
     │  Brapi SDK    │               │  FastAPI (Python)│
     │  Mercado BR   │               │  Análise IA      │
     │  (REST)       │               │  - Agno + gpt-4o │
     └───────────────┘               │  - SQLAlchemy 2  │
                                     └────────┬─────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │  PostgreSQL 16   │
                                     │  + pgvector      │
                                     │  - users/sessions│
                                     │    (Prisma)      │
                                     │  - analyses +    │
                                     │    embeddings    │
                                     │    (SQLAlchemy)  │
                                     └──────────────────┘
```

### 4.1 Decisões arquiteturais (não revisitar sem motivo forte)

| Decisão | Motivo |
|---|---|
| PWA, não app nativo | Distribuição via link no WhatsApp, sem app store, Android-first |
| Capacitor instalado mas não em produção | Preparação para wrapper Android nativo pós-MVP (spec 006) |
| Next.js como BFF | Auth + server actions para Brapi + chamadas ao FastAPI. UI fica burra |
| FastAPI separado | Toda lógica de IA, embeddings, prompts pesados — não polui o Next |
| Postgres único | MVP usa um banco; Prisma para auth, SQLAlchemy async para análises |
| pgvector | Embeddings de análises para retrieval futuro (spec 005 conversation) |
| Sem Redis no MVP | Cache via Next.js `revalidate` e cache do Brapi SDK |

### 4.2 O que **não** está na arquitetura (e por quê)

- **Redis / cache layer**: prematuro. Brapi tem rate limit aceitável, Next cacheia bem.
- **Sistema de filas (Celery/RQ)**: o job de briefing diário pode ser cron no FastAPI; ainda não justifica fila.
- **Microsserviços além do FastAPI**: um serviço de IA é suficiente.
- **GraphQL**: REST + server actions são suficientes para o escopo.
- **Mobile app nativo (Swift/Kotlin)**: Capacitor cobre Android quando necessário.

---

## 5. Stack técnica

### 5.1 Web (`web/`)

| Camada | Escolha | Versão | Observações |
|---|---|---|---|
| Framework | Next.js | 15.2 | App Router, RSC, Server Actions |
| Runtime | Node | ≥20 | Engine em `package.json` |
| Linguagem | TypeScript | 5.7 | `strict: true`, sem `any` implícito |
| Styling | Tailwind CSS | 3.x | Config em [web/tailwind.config.ts](web/tailwind.config.ts) |
| Componentes | shadcn/ui + Radix | — | Em [web/src/components/ui/](web/src/components/ui/) |
| Animação | motion (Framer) | 12.x | Usar com parcimônia, transições longas (700ms) |
| Auth | NextAuth | 5.0-beta.30 | Credentials + JWT + Prisma adapter |
| ORM | Prisma | 7.x | Schema em [web/prisma/schema.prisma](web/prisma/schema.prisma) |
| DB driver | `@prisma/adapter-pg` + `pg` | — | Adapter para Postgres |
| Charts | Recharts | 3.x | Já usado em PriceChartClient, MarketTreeMap |
| Markdown | react-markdown + remark-gfm | — | Análises IA renderizam markdown |
| Validação | Zod | 4.x | Schemas em server actions |
| Wrapper nativo | Capacitor | 8.x | Instalado, não ativo ainda |
| Testes | Vitest + Testing Library | — | `pnpm test` |
| Hash de senha | bcryptjs | 3.x | Em auth |

**Não adicione**: Redux/Zustand (use React state + server actions), styled-components (Tailwind only), date-fns/dayjs (use `Intl.DateTimeFormat`), axios (use `fetch`).

### 5.2 API (`api/`)

| Camada | Escolha | Observações |
|---|---|---|
| Framework | FastAPI | Async, Pydantic v2 |
| Runtime | Python | 3.11 (`target-version` no ruff) |
| ORM | SQLAlchemy | 2.x async |
| Vectors | pgvector | Embeddings de análise |
| Agente IA | Agno | Framework de agentes; ver [api/app/agent/](api/app/agent/) |
| Modelo | OpenAI gpt-4o | Configurado em `core/config.py` |
| Data de mercado | yfinance | Fallback secundário; Brapi é o primário (no web) |
| Lint | Ruff | Config em `pyproject.toml` |
| Type check | mypy strict | `python_version = "3.11"` |
| Testes | pytest + pytest-asyncio | `pnpm` não roda aqui |

**Não adicione**: Django (FastAPI é a escolha), Flask, Celery/RQ (sem fila no MVP), LangChain (Agno é o framework).

### 5.3 Infra / DevOps

- **Deploy web**: Vercel (Next.js)
- **Deploy api**: Railway (config em `railway.toml`)
- **Deploy DB**: Railway Postgres
- **Local dev**: `docker-compose.yml` sobe Postgres + API
- **Domínio**: bullcapital.com.br
- **Email transacional**: Resend (planejado para Sprint 2 do briefing diário)

---

## 6. Inventário do código (o que já existe — REUTILIZE)

> **Regra crítica**: antes de criar componente, função ou rota, busque aqui. Duplicação é o maior fator de degradação deste repo.

### 6.1 Rotas (`web/src/app/`)

| Rota | Arquivo | Função | Status |
|---|---|---|---|
| `/` | [page.tsx](web/src/app/page.tsx) | Landing pública; redireciona autenticados para `/home` | ✅ |
| `/auth/sign-in` | [auth/](web/src/app/auth/) | Login email+senha | ✅ |
| `/auth/sign-up` | [auth/](web/src/app/auth/) | Cadastro email+senha | ✅ |
| `/home` | [home/page.tsx](web/src/app/home/page.tsx) | Daily brief + movers + índices + radar | ✅ |
| `/asset/[ticker]` | [asset/[ticker]/page.tsx](web/src/app/asset/[ticker]/page.tsx) | Detalhe de ativo: header, chart, radar, news, perfil | ✅ |
| `/analysis` | [analysis/](web/src/app/analysis/) | Conversa IA ancorada a ativo (spec 005) | ✅ |
| `/news` | [news/page.tsx](web/src/app/news/page.tsx) | Feed editorial de notícias | ✅ |
| `/search` | [search/](web/src/app/search/) | Busca de ativos | ✅ |
| `/terminal` | [terminal/](web/src/app/terminal/) | Simuladores (será reorganizado no pivô — ver §13) | ⚠️ pivô |
| `/api/...` | [api/](web/src/app/api/) | Rotas API internas do Next | — |
| `/conversation` (action) | [conversation/](web/src/app/conversation/) | Server actions de conversa | — |

### 6.2 Componentes-chave (`web/src/components/`)

**Atoms** ([atoms/](web/src/components/atoms/)) — primitivos reutilizáveis, **sem dependências**:
- `MarketTemperatureDial.tsx` — dial SVG do termômetro de mercado. Props: `{ value, stateName }`.
- `VariationBadge.tsx` — badge de variação de preço (verde/rosa). **Usar em todo lugar** com mudança de preço.
- `GlassHighlight.tsx` — shimmer do topo de cards de vidro. Props: `{ widthPercent, className }`. **Obrigatório em todo card.**
- `CompanyIcon.tsx` — ícone/logo do ativo.
- `MarkdownBody.tsx` — renderiza markdown da IA com estilo editorial.

**Home** ([home/](web/src/components/home/)) — composição do dashboard diário:
- `DailyBriefHero.tsx`, `DailyBriefContent.tsx` — briefing do topo
- `TemperatureCard.tsx`, `VixCard.tsx`, `SELICCard.tsx`, `IndexCard.tsx` — cards de indicadores
- `MoversSection.tsx`, `MoverItem.tsx` — top gainers/losers
- `RadarPulseSection.tsx`, `WatchlistRadarSection.tsx` — radar shortlist
- `MarketBubbleMap.tsx`, `MarketMapSection.tsx`, `MarketTreeMap.tsx` — visualizações de mercado
- `StoryDigestSection.tsx`, `StoryDigestLoader.tsx`, `StoryNote.tsx` — digest de notícias
- `AnalysisCTA.tsx` — CTA para conversa IA
- `MarketPlaybookSection.tsx` — playbook do mercado

**Asset** ([asset/](web/src/components/asset/)):
- `AssetHeader.tsx`, `AssetProfileCard.tsx`, `AssetNewsSection.tsx`, `AssetQuotesTable.tsx`
- `PriceChartClient.tsx` — gráfico com Recharts
- `RadarSection.tsx` — radar chart (5 dimensões)
- `FollowButton.tsx`, `AssetAnalysisCTA.tsx`

**Analysis** ([analysis/](web/src/components/analysis/)) — conversa IA:
- `AnalysisClient.tsx`, `AnalysisSkeleton.tsx`
- `ConversationThread.tsx`, `ConversationInput.tsx`, `ConversationSuggestions.tsx`, `ConversationDisclaimer.tsx`, `ConversationArtifacts.tsx`
- `MetricStoryModal.tsx` — modal de história por métrica
- `artifacts/` — artefatos renderizáveis dentro da conversa

**Terminal** ([terminal/](web/src/components/terminal/)) — simuladores:
- `TerminalClient.tsx`, `TerminalCopilot.tsx` — shell do terminal
- `AssetComparator.tsx` — **será promovido a tela top-level no pivô** (§13)
- `DividendCalculator.tsx`, `SavingsSimulator.tsx` — **serão ocultados no pivô** (não atendem CFP/influencer)
- `OpenFinancePortfolio.tsx` — untracked; **deixar fora do MVP** (não combina com B2B)

**Navigation** ([navigation/](web/src/components/navigation/)):
- `AppShell.tsx` — shell unificado (spec 006); contém o layout para phone/tablet/desktop
- `AppDock.tsx` — navegação primária
- `AccountMenu.tsx` — dropdown de conta
- `NavigationProgress.tsx`, `PageLoadingContent.tsx` — feedback de navegação

**News**, **Search**, **Auth**, **UI** (shadcn primitives) — auto-explicativos.

### 6.3 Serviços e libs (`web/src/lib/`)

- **[services/market.ts](web/src/lib/services/market.ts)** — integrações com Brapi SDK. **Não reescrever.** 7 funções:
  - `getMarketRadarData(ticker)` — scores do radar (Rentabilidade, Momentum, Liquidez, Valuation, Tendência)
  - `getMarketListings(params)` — listings paginados com workaround de BDR
  - `getMultipleQuotes(tickers)` — batch de quotes
  - `getMarketIndicators()` — SELIC + IPCA (cache 24h)
  - `searchAssets(query)` — busca por ticker/nome
  - `getMarketStatus()` — IBOV, S&P, VIX, VXBR (com fallback Yahoo)
  - `getAssetHistory(tickers, range)` — histórico com cache em camadas
- **[actions/](web/src/lib/actions/)** — server actions (chamáveis do client):
  - `analysis.ts`, `conversation.ts`, `daily-brief.ts`, `market.ts`, `story-brief.ts`, `watchlist.ts`
- **[auth.ts](web/src/lib/auth.ts)**, **[auth.config.ts](web/src/lib/auth.config.ts)** — NextAuth v5
- **[db.ts](web/src/lib/db.ts)** — Prisma client singleton
- **[market-routing.ts](web/src/lib/market-routing.ts)**, **[market-utils.ts](web/src/lib/market-utils.ts)** — helpers de roteamento e formatação
- **[news-radar.ts](web/src/lib/news-radar.ts)** — fonte de news radar
- **[metric-stories.ts](web/src/lib/metric-stories.ts)** — histórias por métrica do radar
- **[market-history.mock.ts](web/src/lib/market-history.mock.ts)** — mocks de histórico (dev only)

### 6.4 Tipos (`web/src/types/`)

- **[market.ts](web/src/types/market.ts)** — todos os tipos de domínio de mercado. **Importar daqui**, nunca redefinir.

### 6.5 API Python (`api/app/`)

```
api/app/
├── main.py                    # FastAPI bootstrap, CORS, lifespan
├── core/
│   ├── config.py              # Pydantic settings (env vars)
│   └── database.py            # SQLAlchemy async session
├── api/routes/
│   ├── analysis.py            # POST/GET /api/v1/analysis
│   ├── conversation.py        # POST /api/v1/conversation (spec 005)
│   ├── market.py              # Endpoints de mercado (yfinance fallback)
│   └── health.py              # GET /health
├── agent/
│   ├── base.py                # AbstractBaseAgent
│   └── market_analysis.py     # MarketAnalysisAgent (Agno + gpt-4o, lazy init)
├── models/
│   ├── analysis.py            # Analysis ORM (pgvector)
│   └── conversation.py        # Conversation + Message (pgvector)
└── services/
    └── yfinance_market.py     # Fallback yfinance
```

### 6.6 Specs já entregues (`specs/`)

| ID | Nome | Status |
|---|---|---|
| 001 | mvp-bootstrap | entregue |
| 002 | auth-screens | entregue |
| 003 | home-screen | entregue |
| 004 | asset-detail | entregue |
| 005 | ai-conversation | entregue |
| 006 | unified-ui-flow | entregue (PWA + Capacitor prep) |
| 007 | daily-market-brief | entregue (vira base do email do Sprint 2) |

Novas specs do MVP B2B: **008-comparador**, **009-briefing-diario-email**, **010-export-pdf** (a criar — §13).

---

## 7. Design system (resumo)

> **Fonte de verdade detalhada**: [system-design.md](system-design.md). O resumo aqui existe para você não precisar abrir o arquivo a cada decisão pequena.

### 7.1 Filosofia

**"The Financial Reading Room"** — calma, contemplação, materialidade digital. Vidro espesso + esqueleto físico. Sala de leitura financeira, não sala de pregão.

### 7.2 Cores (tokens, não improvisar)

| Token | Hex | Uso |
|---|---|---|
| Void | `#0D0B14` | Background base (infinito) |
| Surface | `#1A1625` | Base sólida de cards |
| Starlight | `#F4F0FF` | Texto primário |
| Amethyst | `#8B5CF6` | Acento, estados ativos, positivo, glow |
| Rose | `#F43F5E` | Negativo, alertas |
| Glass Rim | `rgba(255,255,255,0.1-0.2)` | Bordas de vidro |
| Shadow | `rgba(0,0,0,0.4-0.6)` | Sombras projetadas |

### 7.3 Tipografia

- **Playfair Display** (serif) — títulos, nomes de ativo, manchetes
- **Inter** (sans) — corpo, dados numéricos, labels
- Letter-spacing levemente reduzido em headings; números nunca em bold agressivo

### 7.4 Anatomia de card de vidro (decora COM ESTAS classes)

```tsx
<section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#1A1625]/40 p-8 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.4)]">
  <GlassHighlight widthPercent={60} />
  {/* glow opcional */}
  <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-[#8B5CF6]/15 blur-[100px]" />
  {/* conteúdo */}
</section>
```

### 7.5 Regras de ouro (proibições)

1. **Flat design proibido.** Toda superfície tem profundidade.
2. **Semáforo agressivo proibido.** Sem verde/vermelho puros — use Amethyst/Rose pastel sob vidro.
3. **Cantos retos proibidos.** Mínimo `rounded-xl`, cards `rounded-[2.5rem]`.
4. **Backdrop-blur obrigatório** em todo card translúcido.
5. **Respiro editorial obrigatório**: 2.5rem de padding ao redor de texto IA.
6. **Fuga de planilhas obrigatória**: se parecer Excel, refatorar para cards/cúpulas.
7. **Sem skeleton loaders.** Usar Suspense com empty states elegantes.
8. **Sem emoji em UI**, mesmo em microcopy.

---

## 8. Dados de mercado e integrações externas

| Fonte | Uso | Onde |
|---|---|---|
| **Brapi** | Quotes, históricos, listings, indicadores BR, busca | [services/market.ts](web/src/lib/services/market.ts) |
| **Yahoo Finance** (via yfinance no Python) | Fallback para índices internacionais quando Brapi falha | [api/app/services/yfinance_market.py](api/app/services/yfinance_market.py) |
| **OpenAI gpt-4o** | Análises e conversas via Agno | [api/app/agent/](api/app/agent/) |
| **Resend** | Email transacional (planejado Sprint 2) | a configurar |
| **News (RSS/feeds)** | Notícias do mercado | [news-radar.ts](web/src/lib/news-radar.ts) |

**Regra crítica de IA**: a IA nunca **gera** números de mercado. Os números vêm de Brapi/Yahoo; a IA escreve **narrativa em cima** dos números. Se um agente sugerir prompt onde a IA inventa preços, multiplica fundamentos ou estima dividendos — recusar.

---

## 9. Convenções de código

### 9.1 TypeScript / Next.js

- **Server Components por padrão.** `"use client"` só quando precisar de estado/interação no browser.
- **Server actions** para chamadas a Brapi e FastAPI — não chamar Brapi do client.
- **Não fazer fetch direto do client para a API externa.** Sempre passar por server action ou route handler.
- **Imports**: use o alias `@/` (configurado em `tsconfig.json`).
- **Nomeação**:
  - Componentes: `PascalCase.tsx`
  - Hooks: `useFooBar.ts`
  - Server actions: nome do domínio (`analysis.ts`, `market.ts`)
  - Tipos: `PascalCase` exportados, evite `I` prefix
- **Strict mode**: `strict: true` no tsconfig. Nada de `any` exceto em adapter de lib sem types.
- **Componentes de UI**: composição > props gigantes. Se um componente passa de ~250 linhas, separar.

### 9.2 Tailwind

- Use **tokens do design system** (cores hex acima); evite cores arbitrárias.
- Combine classes via `cn(...)` (em [lib/utils.ts](web/src/lib/utils.ts)).
- Variantes de componente via `class-variance-authority` (já em deps).

### 9.3 Python / FastAPI

- **Async sempre**: rotas, sessões de DB, chamadas externas.
- **Pydantic v2** para schemas; validação no boundary.
- **mypy strict**: tipagem completa.
- **Ruff**: lint + format. Rodar antes de commit.
- **Não criar abstração antes da terceira ocorrência.** Não tem `BaseService` se só existe um service.

### 9.4 Git / commits

- Conventional commits: `feat:`, `fix:`, `style:`, `perf:`, `refactor:`, `docs:`, `chore:`. Config em `commitlint.config.cjs`.
- Mensagens podem ser pt-BR ou en, mas consistentes dentro do mesmo PR.
- Branch por feature: `008-comparador`, `009-briefing-diario`, etc.
- Não commitar `.env.local`, `node_modules`, `__pycache__`.
- **Não commitar** `OpenFinancePortfolio.tsx` (untracked) sem decisão explícita (§13).

### 9.5 Pull requests

- Título conciso (<70 chars), conventional commit.
- Description: Summary (1-3 bullets) + Test plan (checklist).
- Não usar `--no-verify` para pular hooks.
- Não usar `--amend` para commits já pushed.

---

## 10. Workflow com spec-kit

O repo usa **Spec Kit** (Anthropic) — fluxo documentado em [specs/](specs/). Cada feature passa pelas fases:

1. **`/speckit-specify`** → cria `spec.md` (user stories, FRs, edge cases)
2. **`/speckit-clarify`** (opcional) → pergunta até 5 dúvidas para fechar lacunas
3. **`/speckit-plan`** → cria `plan.md` (decisões técnicas, arquitetura da feature)
4. **`/speckit-tasks`** → gera `tasks.md` dependency-ordered
5. **`/speckit-analyze`** (opcional) → audita consistência entre spec/plan/tasks
6. **`/speckit-implement`** → executa as tasks
7. **`/speckit-checklist`** (opcional) → checklist customizado

**Onde encontrar artefatos**: `specs/<id>-<nome>/spec.md|plan.md|tasks.md`.

**Convenção de ID**: número incremental zero-padded (`008-comparador`). Branch igual ao diretório.

**Para o pivô B2B (§13)**, criar specs: 008, 009, 010.

---

## 11. Variáveis de ambiente

### 11.1 `web/.env.local`

```bash
NEXTAUTH_SECRET=               # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://bullcapital:bullcapital@localhost:5432/bullcapital
ANALYSIS_API_URL=http://localhost:8001/api/v1  # FastAPI URL
API_SHARED_SECRET=             # mesmo valor no web e na API quando habilitado
RESEND_API_KEY=                # planejado Sprint 2
```

### 11.2 `api/.env`

```bash
DATABASE_URL=postgresql+asyncpg://bullcapital:bullcapital@db:5432/bullcapital
DATABASE_SSL=false
OPENAI_API_KEY=
API_SHARED_SECRET=             # protege chamadas server-to-server Vercel -> Railway
BRAPI_KEY=                     # https://brapi.dev — apenas no backend/API
CORS_ORIGINS=http://localhost:3000
```

### 11.3 Segredos em produção

- Vercel: env vars do dashboard
- Railway: env vars do dashboard
- Nunca commitar; nunca colar em PR description.

---

## 12. Comandos essenciais

```bash
# Web — desenvolvimento local
cd web
pnpm install
pnpm dev                        # http://localhost:3000
pnpm db:migrate                 # cria/atualiza schema Prisma
pnpm db:studio                  # GUI do Prisma
pnpm lint                       # ESLint
pnpm type-check                 # tsc --noEmit
pnpm test                       # Vitest
pnpm build                      # produção

# API — desenvolvimento local
cd api
python -m uvicorn app.main:app --reload --port 8001
ruff check .                    # lint
mypy app/                       # type check
pytest                          # testes

# Stack completa via docker-compose
docker compose up               # Postgres + API
# web roda separado com `pnpm dev`
```

---

## 13. Roadmap MVP B2B (até 10/jul/2026)

> **Hoje**: 2026-05-24. **Deadline**: 2026-07-10. **Janela**: 47 dias, ~6,5 sprints semanais.

### 13.1 Mapa geral

| Sprint | Janela | Foco |
|---|---|---|
| 0 | 24-31/mai | Pivô narrativo + arquivamento de telas fora do escopo + specs novas |
| 1 | 01-07/jun | Comparador de ativos top-level (`/comparador`) |
| 2 | 08-14/jun | Briefing diário por email (cron + Resend) |
| 3 | 15-21/jun | Exportação PDF/imagem (Puppeteer) |
| 4 | 22-28/jun | Polimento + perfil profissional + onboarding novo |
| 5 | 29/jun-05/jul | Beta fechado com 5-10 CFPs/influencers |
| 6 | 06-10/jul | Última milha: bugfix + lançamento público |

### 13.2 Sprint 0 — Pivô e fundação (24-31/mai)

**Objetivo**: alinhar produto ao novo público sem código de feature novo.

- [ ] Reescrever copy de `/` (landing), `/auth/sign-in`, `/auth/sign-up`, `/home` hero para falar com CFP/influencer
- [ ] Ocultar `DividendCalculator` e `SavingsSimulator` do nav (manter código em `terminal/`)
- [ ] Decidir destino de `OpenFinancePortfolio.tsx` (recomendação: stash, não commitar — pós-MVP)
- [ ] Criar specs `008-comparador`, `009-briefing-diario`, `010-export-pdf` via `/speckit-specify`
- [ ] Setup conta Resend e validar domínio de envio
- [ ] Validar build/deploy de Puppeteer no Vercel (POC — pode ser pesado)
- [ ] Atualizar `system-design.md` se design ganhar tom mais "profissional" (provavelmente não muda)

**Entrega**: nova narrativa pública + 3 specs prontas + Resend operacional.

### 13.3 Sprint 1 — Comparador top-level (01-07/jun)

**Objetivo**: rota `/comparador` permite selecionar 2-4 ativos e gerar análise comparativa.

- [ ] Rota `/comparador` com picker de tickers (usa `searchAssets`)
- [ ] Layout grid responsivo (1 col mobile, 2 col tablet, 4 col desktop)
- [ ] Cards por ativo: header + radar + métricas-chave + variação
- [ ] Endpoint `/api/v1/comparator` (FastAPI) que recebe N tickers e retorna narrativa IA
- [ ] Server action `comparator.ts` em `web/src/lib/actions/`
- [ ] CTA "Exportar comparação" (botão presente mas com placeholder até Sprint 3)
- [ ] Reaproveitar `AssetComparator.tsx` do terminal (extrair lógica)

**Entrega**: CFP/influencer consegue comparar PETR4 vs VALE3 vs ITUB4 e ler narrativa pt-BR.

### 13.4 Sprint 2 — Briefing diário por email (08-14/jun)

**Objetivo**: assinante recebe email às 7h BRT em dias úteis.

- [ ] Job cron no FastAPI (APScheduler ou cron de container) — 6h45 BRT
- [ ] Pipeline: puxa top movers + índices + 1 evento macro + 1 notícia → gera narrativa via Agno → renderiza HTML
- [ ] Template de email com branding Bull (rounded glass mantém em email? testar)
- [ ] Integração Resend
- [ ] Tabela `email_subscriptions` (Prisma): `userId`, `dailyBriefEnabled`, `createdAt`
- [ ] Tela `/configuracoes/notificacoes` (mínima): toggle "Receber briefing diário"
- [ ] Guarantee: IA não inventa números — pipeline injeta números reais no prompt e a IA só escreve

**Entrega**: assinantes recebem email útil às 7h BRT.

### 13.5 Sprint 3 — Exportação PDF/imagem (15-21/jun)

**Objetivo**: botão "Exportar" funcional em análise, asset, comparador.

- [ ] Decisão técnica POC (no Sprint 0): Puppeteer (mais flexível) vs `@react-pdf/renderer` (mais leve)
- [ ] Rota `/export/[type]/[id]` que renderiza versão print-ready
- [ ] Templates: análise individual, comparação, briefing
- [ ] Branding: logo BCAP + nome do consultor (campo opcional `profile.displayName`)
- [ ] Format selector: PDF A4 portrait (para email) e PNG quadrado 1080×1080 (para Instagram)
- [ ] Botão presente em `/asset/[ticker]`, `/analysis`, `/comparador`
- [ ] Watermark sutil "via Bull" no rodapé

**Entrega**: CFP gera PDF para cliente; influencer gera PNG para Stories.

### 13.6 Sprint 4 — Polimento e perfil (22-28/jun)

**Objetivo**: produto sente que é para profissional.

- [ ] Página `/perfil`: nome de exibição, foto opcional, registro profissional (CFP/Ancord/CNPI), copy "exportações terão seu nome"
- [ ] Onboarding em 3 telas após signup: "Você é CFP/AAI/Criador?", "Quais ativos acompanha?", "Quer briefing diário?"
- [ ] Revisão completa de copy pt-BR (consistência de tom)
- [ ] Audit de performance mobile (PWA, Android-first)
- [ ] Audit a11y (contraste, foco, leitor de tela)
- [ ] Configurar Sentry para produção

**Entrega**: produto polido pronto para beta real.

### 13.7 Sprint 5 — Beta fechado (29/jun-05/jul)

**Objetivo**: 5-10 profissionais reais usando por 1 semana.

- [ ] Recrutar betas: 3 CFPs do network + 3 influencers BR + 3 AAIs
- [ ] Grupo WhatsApp ou Discord para feedback síncrono
- [ ] PostHog ou Plausible para tracking de uso
- [ ] Daily de bugfix (2h/dia)
- [ ] Documento "issues do beta" priorizado P0/P1/P2

**Entrega**: lista priorizada de issues para Sprint 6.

### 13.8 Sprint 6 — Última milha (06-10/jul)

**Objetivo**: lançamento público em 10/jul.

- [ ] Bugfix P0 e P1 do beta
- [ ] Página de pricing (mesmo que "grátis durante o lançamento")
- [ ] Landing atualizada com depoimentos do beta
- [ ] Plano de comunicação 10/jul: post LinkedIn pessoal + posts orgânicos dos 3 influencers
- [ ] Plano de observabilidade pós-lançamento (alerts no Sentry, dashboard de uso)

**Entrega**: Bull pública em produção em 10/jul/2026.

### 13.9 Parking lot (pós-10/jul, sem prazo no MVP)

- Cadastro/gestão de clientes do consultor
- API/webhook para CRM
- Modelos de carteira (model portfolios)
- Open Finance / B3 / brokerage integrations
- Pagamento / billing (lançamento começa grátis)
- Mobile native app via Capacitor
- Suitability automatizado
- Watchlists com alertas push

### 13.10 Riscos visíveis

1. **PDF rendering em produção**: Puppeteer no Vercel/Railway pode falhar por tamanho. *Mitigação*: POC no Sprint 0; fallback `@react-pdf/renderer`.
2. **IA hallucinando números**: queima credibilidade do consultor que envia ao cliente. *Mitigação*: pipeline sempre injeta números reais; IA só escreve narrativa.
3. **Recrutar 10 betas**: começar a aquecer rede agora.
4. **Sprint 0 começou no meio da semana**: se atrasar 2 dias, comer da folga do Sprint 4 (polimento).
5. **Resend domain validation**: pode levar 24-48h; iniciar no Sprint 0 imediatamente.

---

## 14. O que NÃO fazer

### 14.1 Produto

- ❌ Recomendar compra/venda/hold (direta ou indireta).
- ❌ Adicionar IA conversacional aberta (sem ancoragem em ativo/evento).
- ❌ Construir features para investidor PF amador ou day trader.
- ❌ Adicionar gamificação, badges, streaks.
- ❌ Usar inglês em texto voltado ao usuário.

### 14.2 Arquitetura

- ❌ Adicionar Redis, Celery, microsserviço novo sem necessidade comprovada.
- ❌ Splittar Postgres em dois bancos.
- ❌ Adicionar GraphQL.
- ❌ Trocar Next.js por outro framework.
- ❌ Trocar FastAPI por Django.
- ❌ Reescrever `services/market.ts` — funciona.

### 14.3 UI / código

- ❌ Flat design (sem shadow + backdrop-blur).
- ❌ Verde/vermelho puros (use Amethyst/Rose).
- ❌ Cantos retos (mínimo `rounded-xl`).
- ❌ Criar componente novo sem checar §6.
- ❌ Reescrever um componente que já existe — estenda.
- ❌ Adicionar libs grandes sem justificativa (Redux, axios, styled-components, date-fns, MUI).
- ❌ Usar `any` em TypeScript.
- ❌ Pular hooks de commit (`--no-verify`).
- ❌ Skeleton loaders (use Suspense + empty states).
- ❌ Emoji em UI.

### 14.4 Workflow

- ❌ Implementar feature fora do roadmap (§13) sem confirmação do usuário.
- ❌ Pular o ciclo Spec Kit (specify → plan → tasks → implement) em feature de qualquer porte.
- ❌ Commitar `.env*` ou outros segredos.
- ❌ Force-push em `main`.
- ❌ Amend em commits já pushed.

---

## 15. Como pedir ajuda quando estiver perdido

1. **Antes de codar**: leia `spec.md` da feature ativa em [specs/](specs/).
2. **Antes de criar componente**: busque em §6.2 e em [web/src/components/](web/src/components/).
3. **Antes de criar rota nova**: cheque §6.1.
4. **Dúvida sobre design**: §7 + [system-design.md](system-design.md).
5. **Dúvida sobre copy**: §3 + leia copy de telas existentes.
6. **Dúvida sobre escopo do MVP**: §13. Se a feature não está lá, pare e pergunte ao usuário.
7. **Bug de produção**: cheque Sentry (a configurar Sprint 4), depois Vercel/Railway logs.

---

## 16. Manutenção deste documento

Este arquivo evolui com o produto. Atualize quando:

- Uma feature do roadmap (§13) for entregue (mover para "entregue")
- Uma decisão arquitetural mudar (§4.1)
- Um componente novo for criado (§6.2)
- Uma regra de copy/design mudar (§3, §7)
- Uma dependência grande for adicionada/removida (§5)

**Sempre que houver conflito entre AGENTS.md e o código**, o código é a fonte de verdade — mas atualize o AGENTS.md no mesmo PR para refletir a realidade.
