# BullCapital

Plataforma de inteligência de mercado brasileiro. Combina dados de mercado em tempo real, dashboards visuais e análises contextuais geradas por IA para que investidores acompanhem ativos, indicadores macro e tendências sem depender de uma superfície genérica de chat.

> **Tese do produto**: BullCapital não é uma IA que diz onde investir. É um radar que detecta sinais relevantes de mercado e os traduz em cards de análise claros, fundamentados em fontes, e prontos para relatórios.

---

## Sumário

- [Arquitetura](#arquitetura)
- [Stack Técnica](#stack-técnica)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Primeiros Passos](#primeiros-passos)
- [Como Trabalhar no Projeto](#como-trabalhar-no-projeto)
- [Design System](#design-system)
- [Especificações de Features](#especificações-de-features)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Comandos Úteis](#comandos-úteis)
- [Regras Importantes](#regras-importantes)

---

## Arquitetura

> Documento canônico: [docs/README.md](docs/README.md) (diagramas Mermaid versionados + ADRs).
> Plano de migração: [docs/migracao-arquitetura.md](docs/migracao-arquitetura.md).

**Stack final:** Vercel (este repo: front + back) + host do time de IA (repo `bullcapital-ai` — qualquer
um que rode FastAPI com SSE de longa duração) + **Neon** (banco único) + **Upstash** (Redis utilitário).
Quatro peças, um banco, contrato explícito entre os times.

```
Browser / PWA
    ├── HTTPS → Next.js (Vercel) — BFF + módulos market/portfolio/reports/user + cron de ingestão
    │               └── Neon Postgres (schemas: market, portfolio, auth, news, ai, snapshots)
    └── SSE direto → AI Service (repo bullcapital-ai) — narração com Guardião estrutural
                        └── lê o MESMO Neon com role escopada (write news/ai; read-only market/portfolio)
```

**Decisões de arquitetura (resumo — ADRs em [docs/adrs/](docs/adrs/)):**

| Decisão | Motivo |
|---|---|
| Banco unificado no Neon; schema = contrato entre os times (ADR 0007) | roles do Postgres como enforcement; mudança em `market`/`portfolio` é breaking change (expand-contract); PITR cobre corrupção |
| Snapshots em schema próprio com `snapshot_id` | staleness rotulada na leitura; export EOD p/ Vercel Blob é o pára-quedas opcional |
| SSE direto do cliente p/ IA com token curto assinado pela BFF (ADR 0008) | elimina re-emitter, hop duplo e limite de duração de função na Vercel; BFF emite credencial, não proxia stream |
| Sem circuit breaker no MVP | estado de breaker em memória serverless é teatro; timeout + retry com backoff; se importar um dia, estado vai pro Upstash |
| Ingestão (cron Brapi/BCB) no web app | o módulo market é dono do schema dele; locks de idempotência no Upstash |
| Guardião estrutural, não filtro pós-hoc | LLM preenche slots de template restrito; número só entra por referência ao payload determinístico |
| IA v1 = um endpoint de narração | news/RSS, embeddings (pgvector no schema `ai`) e orquestração de tools são v2 |
| PWA em vez de app nativo | zero atrito de app store; Android-first |
| NextAuth com Credentials | sem OAuth no MVP; email/senha com bcrypt |

---

## Stack Técnica

| Camada | Escolha | Versão |
|---|---|---|
| Frontend | Next.js + React | 15 / 19 |
| Linguagem (web) | TypeScript strict | 5.7 |
| Estilização | Tailwind CSS + shadcn/ui | latest |
| Auth | NextAuth v5 | 5.x |
| ORM (web) | Prisma + pg adapter | 7 |
| AI Service | FastAPI (repo `bullcapital-ai`) | latest |
| Dados de mercado | Brapi + BCB SGS (ingestão no web) | latest |
| Banco de dados | PostgreSQL 16 — Neon em produção | 16 |
| Redis | Upstash (rate-limit, locks, cache) | F4+ |
| Container (dev) | Docker Compose | v2 |

---

## Estrutura do Projeto

```
BullCapital/
├── web/                        # Aplicação Next.js (PWA)
│   ├── src/
│   │   ├── app/                # App Router do Next.js
│   │   │   ├── (auth)/         # Rotas: /auth/sign-in, /auth/sign-up
│   │   │   ├── analysis/       # Tela de análise de ativos
│   │   │   ├── asset/[ticker]/ # Detalhe de ativo
│   │   │   ├── home/           # Dashboard principal
│   │   │   └── search/         # Busca de ativos
│   │   ├── components/
│   │   │   ├── atoms/          # Componentes base reutilizáveis
│   │   │   │   ├── MarketTemperatureDial.tsx  # Gauge SVG de temperatura
│   │   │   │   ├── VariationBadge.tsx         # Badge de variação %
│   │   │   │   └── GlassHighlight.tsx         # Efeito glassmorphism
│   │   │   ├── analysis/       # Componentes da tela de análise
│   │   │   ├── asset/          # Componentes do detalhe de ativo
│   │   │   ├── home/           # Componentes do dashboard
│   │   │   ├── navigation/     # AppDock (barra de navegação)
│   │   │   └── ui/             # shadcn/ui components
│   │   └── lib/
│   │       ├── actions/        # Server Actions (analysis.ts, conversation.ts)
│   │       ├── services/
│   │       │   └── market.ts   # Integrações Brapi (NÃO modificar)
│   │       └── auth.ts         # Configuração NextAuth
│   ├── prisma/
│   │   └── schema.prisma       # Schema de auth (User, Account, Session)
│   └── public/                 # Assets PWA, ícones, manifest
│
├── specs/                      # Especificações de features (Spec Kit)
│   ├── 001-mvp-bootstrap/
│   ├── 002-auth-screens/
│   ├── 003-home-screen/
│   ├── 004-asset-detail/
│   └── 005-ai-conversation/
│
├── docs/                       # Arquitetura: plano, diagramas, ADRs, contratos
├── docker-compose.yml          # Postgres 16 + AI Service (build de ../bullcapital-ai)
├── system-design.md            # Design system completo
└── CLAUDE.md                   # Instruções para agentes de IA

> O AI Service (FastAPI) vive no repo separado `bullcapital-ai`, clonado lado a lado.
```

---

## Primeiros Passos

### Pré-requisitos

- Node.js >= 20
- pnpm >= 9 (`npm install -g pnpm`)
- Docker com Compose v2

> Este repo é **front + back (Next.js)**. O AI Service (FastAPI) vive no repo `bullcapital-ai` e só é
> necessário para conversa IA e news — o setup abaixo funciona sem ele.

### 1. Clone e instale

```bash
git clone <repo-url>
cd BullCapital

cd web && pnpm install && cd ..
```

### 2. Configure as variáveis de ambiente

```bash
cp web/.env.example web/.env.local
```

Para dev local, basta preencher:

```bash
NEXTAUTH_SECRET=        # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://bullcapital:bullcapital@localhost:5432/bullcapital
DIRECT_URL=postgresql://bullcapital:bullcapital@localhost:5432/bullcapital
CRON_SECRET=dev-cron-secret
```

`BRAPI_KEY` é opcional (o seed cobre as telas); `ANALYSIS_API_URL` só importa com o AI Service rodando.

### 3. Suba o banco de dados

```bash
docker compose up -d db
docker compose ps   # confirme que está healthy
```

### 4. Migrations + seed

```bash
cd web
pnpm db:migrate
pnpm db:seed     # usuário dev + tabelas de mercado + dados sintéticos
```

O seed cria `dev@bullcapital.app` / `senha123456` e dados de mercado suficientes para as telas
renderizarem **sem nenhuma API key**.

### 5. Inicie a aplicação web

```bash
pnpm dev
# → http://localhost:3000
```

### 6. (Opcional) Dados reais de mercado

Com `BRAPI_KEY` preenchida, dispare o cron de ingestão manualmente:

```bash
curl -H "Authorization: Bearer dev-cron-secret" http://localhost:3000/api/cron/eod
# verifique: SELECT * FROM ai.ingest_runs ORDER BY finished_at DESC LIMIT 1;
```

### 7. (Opcional) AI Service — conversa IA e news

```bash
git clone <bullcapital-ai> ../bullcapital-ai   # lado a lado com este repo
docker compose up -d api                        # builda de ../bullcapital-ai
# → http://localhost:8001 (ou rode uvicorn dentro do repo da IA)
```

### Verificação

1. `http://localhost:3000` → landing com dados de mercado (PETR4, VALE3, Ibovespa)
2. `http://localhost:3000/home` → redireciona para sign-in
3. Login com `dev@bullcapital.app` / `senha123456` → `/home` com indicadores
4. `http://localhost:3000/terminal` → watchlist com quotes do seed
5. `curl` sem o header de auth em `/api/cron/eod` → `401`

> **Validação do critério §0.1:** outra pessoa, em máquina limpa, deve cronometrar do `git clone` até o
> passo 5 acima (meta: ≤ 30 min). Toda dúvida que surgir vira patch neste README antes de fechar.

---

## Como Trabalhar no Projeto

### Fluxo de feature

O projeto usa **Spec Kit** — um sistema de especificação incremental baseado em arquivos markdown dentro de `specs/`.

```
specs/<número>-<nome-da-feature>/
├── spec.md       # O quê e por quê (requisitos, critérios de aceite)
├── plan.md       # Como (design técnico, contratos de API, esquema de dados)
├── tasks.md      # Checklist ordenado por dependências
├── research.md   # Investigações e decisões relevantes
└── data-model.md # Modelos de dados da feature
```

**Comandos de agente disponíveis** (via Claude Code):

| Comando | O que faz |
|---|---|
| `/speckit-specify` | Cria ou atualiza `spec.md` a partir de descrição em linguagem natural |
| `/speckit-plan` | Gera `plan.md` com design técnico |
| `/speckit-tasks` | Gera `tasks.md` ordenado por dependências |
| `/speckit-implement` | Executa as tasks do `tasks.md` |
| `/speckit-analyze` | Valida consistência entre spec, plan e tasks |

### Convenção de branches

```
<número>-<slug-da-feature>
# Exemplos:
005-ai-conversation
006-unified-ui-flow
```

### Server Actions vs. API Routes

- **Dados de mercado** → módulo `web/src/modules/market` (lê o Postgres direto), exposto por Server
  Actions em `web/src/lib/actions/`
- **Narrativa de IA** → AI Service no repo `bullcapital-ai`; o stream SSE vai direto do cliente com
  token curto emitido pela BFF (ADR 0008)
- **Não há API routes Next.js** para lógica de negócio — use Server Actions

### Adicionando uma nova tela

1. Crie em `web/src/app/<nome>/page.tsx`
2. Adicione a rota protegida em `web/src/middleware.ts` (array `protectedRoutes`)
3. Use Server Components por padrão; Client Components (`"use client"`) só quando necessário (interatividade, hooks de estado)
4. Importe tipos de mercado de `web/src/types/market.ts` — não redefina

### Adicionando um novo endpoint na API de IA

1. Endpoint vive no repo `bullcapital-ai` (FastAPI)
2. Se muda eventos SSE/envelope, é bump de contrato: atualize `docs/contracts/` aqui e siga a regra
   produtor-antes-do-consumidor (§8.1 do plano)
3. Mudança nos schemas `market`/`portfolio` do Neon é breaking change para a IA — expand-contract

---

## Design System

Filosofia: **"The Financial Reading Room"** — calmo, contextual, sério mas acessível. **Flat-editorial** (reescrito 01-jun-2026): clareza por tipografia e respiro, não por material. Ver [system-design.md](system-design.md) para a spec completa.

### Tokens de cor

| Token | Hex | Uso |
|---|---|---|
| Void | `#050308` | Background da página |
| Surface | `#0D0A13` | Superfície sólida de cards |
| Surface-2 | `#12161F` | Elevação (hover) |
| Starlight | `#e2def0` | Texto primário |
| Muted | `rgba(226,222,240,.55)` | Texto secundário |
| Amethyst | `#82759F` | Acento único — sem glow |
| Border | `rgba(255,255,255,.06–.10)` | Separação entre superfícies |

### Tipografia

- **Playfair Display** (serif) — títulos, títulos de cards, ênfase
- **Inter** (sans-serif) — corpo, labels, números

### Anatomia de cards

```tsx
<div className="rounded-2xl border border-white/[0.06] bg-surface p-6">
  {/* hierarquia por tipografia + espaço, não por sombra/glow */}
  {/* conteúdo */}
</div>
```

### Componentes obrigatórios

| Componente | Onde usar |
|---|---|
| `VariationBadge` | Qualquer variação percentual de ativo |

### Regras invioláveis

1. Flat obrigatório — superfícies sólidas, separação por borda 1px + tom. Sem `backdrop-blur`, glow ou stack de `inset-shadow`
2. Nenhuma cor fora da paleta acima; um acento só (Amethyst)
3. Cantos contidos — `rounded-xl`/`rounded-2xl` (`rounded-[2.5rem]` é legado)
4. Baixa densidade — corte conteúdo antes de adicionar caixas
5. Todo texto para o usuário em **português brasileiro (pt-BR)**
6. Sem skeleton loaders — use Suspense com estados vazios elegantes

---

## Especificações de Features

| # | Feature | Status |
|---|---|---|
| 001 | MVP Bootstrap | Concluído |
| 002 | Auth Screens | Concluído |
| 003 | Home Screen | Concluído |
| 004 | Asset Detail | Concluído |
| 005 | AI Conversation | Em desenvolvimento |

---

## Variáveis de Ambiente

### `web/.env.local`

```bash
NEXTAUTH_SECRET=           # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://bullcapital:bullcapital@localhost:5432/bullcapital   # Neon pooled em prod
DIRECT_URL=postgresql://bullcapital:bullcapital@localhost:5432/bullcapital    # Neon direto em prod (migrations)
CRON_SECRET=               # protege /api/cron/*
BRAPI_KEY=                 # opcional em dev (seed cobre as telas); ingestão real
ANALYSIS_API_URL=http://localhost:8001/api/v1   # AI Service (repo bullcapital-ai)
API_SHARED_SECRET=         # assina o token curto de stream; mesmo valor na IA
```

Tabela normativa completa (incluindo Upstash/Blob e as vars do host da IA): [§8.2 do plano](docs/migracao-arquitetura.md).
As env vars do AI Service vivem no repo `bullcapital-ai`.

---

## Comandos Úteis

```bash
# Web
cd web
pnpm dev                        # Dev server em :3000
pnpm build                      # Build de produção
pnpm type-check                 # Checagem TypeScript (sem emit)
pnpm lint                       # ESLint
pnpm test                       # Vitest
pnpm db:migrate                 # Aplicar novas migrations
pnpm db:seed                    # Usuário dev + dados de mercado sintéticos
pnpm prisma studio              # UI do banco em :5555

# Ingestão manual (com BRAPI_KEY)
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/eod

# AI Service (repo separado, clone lado a lado)
docker compose up -d api        # builda de ../bullcapital-ai

# Docker
docker compose up -d db         # Apenas banco de dados
docker compose up -d            # Todos os serviços
docker compose down             # Parar serviços
docker compose down -v          # Parar e limpar volumes (reseta o banco)
docker compose logs -f api      # Logs do serviço API
```

### Troubleshooting comum

**"DATABASE_URL must start with protocol `prisma://`"**
→ Verifique que `prisma` e `@prisma/client` são ambos `^7.4.2`

**"Cannot find module '@/generated/prisma'"**
→ Execute `pnpm prisma generate`

**Dados de mercado retornando null**
→ Rode `pnpm db:seed` (dados de dev) ou defina `BRAPI_KEY` no `web/.env.local` e dispare
`/api/cron/eod`. A chave nunca vai para o client.

**Serviço `db` não sobe**
→ Porta 5432 em uso. Execute `lsof -i :5432` e pare o Postgres local

---

## Regras Importantes

**Nunca:**
- Modificar `web/src/lib/services/market.ts` — já funciona, não toque
- Modificar `web/prisma/schema.prisma` — schema de auth, está completo
- Adicionar OAuth ou login social — fora do escopo MVP
- Usar texto em inglês na interface — tudo pt-BR
- Usar material/glass decorativo (`backdrop-blur`, glow) — o design é flat-editorial
- Adicionar rastreamento de portfólio, Open Finance, ou alertas — fora do MVP
- Criar um chat de IA genérico — análises sempre partem de um ativo ou evento concreto
- Dividir em dois bancos de dados — um Postgres (Neon), schemas isolados, roles como fronteira (ADR 0007)

**Sempre:**
- Importar tipos de mercado de `web/src/types/market.ts`
- Usar Server Actions/BFF para dados (única exceção: SSE de narração, direto com token — ADR 0008)
- Formatar moeda com `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`
- Adicionar `GlassHighlight` ao topo de todo card
- Proteger novas rotas autenticadas no `middleware.ts`
