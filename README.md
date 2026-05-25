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

```
Browser / Mobile (PWA)
    └── Next.js 15 (App Router, Server Components, PWA)
            ├── Auth: NextAuth v5 (email/password, JWT)
            ├── Dados de mercado: Brapi SDK → renda variável, índices, câmbio
            └── Análise por IA: FastAPI (api/) ← análises contextuais
                    └── PostgreSQL 16 + pgVector
                            ├── Usuários / sessões (Prisma)
                            └── Análises / histórico de conversa + embeddings (SQLAlchemy async)
```

**Fluxo de dados:**

```
Cliente → Next.js Server Action → FastAPI /api/v1/* → Agno + OpenAI gpt-4o
                                           ↓
                                     Brapi (dados de mercado)
                                           ↓
                              PostgreSQL + pgVector (persistência)
```

**Decisões de arquitetura:**

| Decisão | Motivo |
|---|---|
| PWA em vez de app nativo | Zero atrito de app store; mercado brasileiro é dominado por Android com excelente suporte a PWA Chrome |
| FastAPI como backend único | Concentra chamadas Brapi + inferência de IA; um banco, um serviço |
| Next.js como BFF | Gerencia auth, serve o PWA, chama o FastAPI para análise |
| Sem Turborepo | Overhead desnecessário para equipe pequena |
| NextAuth com Credentials | Sem OAuth para o MVP; email/senha com bcrypt |

---

## Stack Técnica

| Camada | Escolha | Versão |
|---|---|---|
| Frontend | Next.js + React | 15 / 19 |
| Linguagem (web) | TypeScript strict | 5.7 |
| Estilização | Tailwind CSS + shadcn/ui | latest |
| Auth | NextAuth v5 | 5.x |
| ORM (web) | Prisma + pg adapter | 7 |
| Backend | FastAPI | latest |
| ORM (api) | SQLAlchemy async | 2 |
| Agente de IA | Agno + OpenAI gpt-4o | latest |
| Vetores | pgVector | 0.8 |
| Dados de mercado | Brapi SDK | latest |
| Banco de dados | PostgreSQL | 16 |
| Container | Docker Compose | v2 |

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
├── api/                        # Serviço FastAPI (Python)
│   ├── app/
│   │   ├── agent/
│   │   │   ├── base.py         # AbstractBaseAgent
│   │   │   └── market_analysis.py  # MarketAnalysisAgent (Agno + gpt-4o)
│   │   ├── api/routes/
│   │   │   ├── analysis.py     # POST/GET /api/v1/analysis
│   │   │   ├── conversation.py # POST /api/v1/conversation
│   │   │   └── health.py       # GET /api/v1/health
│   │   ├── core/
│   │   │   ├── config.py       # Pydantic settings
│   │   │   └── database.py     # SQLAlchemy async session
│   │   └── models/
│   │       └── conversation.py # Conversation + Message + embeddings
│   ├── requirements.txt
│   └── requirements-dev.txt
│
├── specs/                      # Especificações de features (Spec Kit)
│   ├── 001-mvp-bootstrap/
│   ├── 002-auth-screens/
│   ├── 003-home-screen/
│   ├── 004-asset-detail/
│   └── 005-ai-conversation/
│
├── docker-compose.yml          # PostgreSQL 16 + serviço API
├── system-design.md            # Design system completo
└── CLAUDE.md                   # Instruções para agentes de IA
```

---

## Primeiros Passos

### Pré-requisitos

- Node.js >= 20
- pnpm >= 9 (`npm install -g pnpm`)
- Docker Desktop com Compose v2
- Python 3.11+

### 1. Clone e instale

```bash
git clone <repo-url>
cd BullCapital

cd web && pnpm install && cd ..
```

### 2. Configure as variáveis de ambiente

```bash
# Web
cp web/.env.local.example web/.env.local
# Preencha: NEXTAUTH_SECRET, NEXTAUTH_URL, DATABASE_URL, ANALYSIS_API_URL

# API
cp api/.env.example api/.env
# Preencha: DATABASE_URL, BRAPI_KEY, OPENAI_API_KEY, CORS_ORIGINS
```

Gere o `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 3. Suba o banco de dados

```bash
docker compose up -d db
docker compose ps   # confirme que está healthy
```

### 4. Rode as migrations

```bash
cd web
pnpm prisma migrate dev
```

### 5. Inicie a aplicação web

```bash
cd web && pnpm dev
# → http://localhost:3000
```

### 6. Inicie a API (necessário para análises com IA)

```bash
cd api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
# → http://localhost:8001
```

### Verificação

1. `http://localhost:3000` → landing page com fundo escuro
2. `http://localhost:3000/home` → redireciona para sign-in
3. `http://localhost:3000/auth/sign-up` → formulário de cadastro
4. Crie uma conta, faça login → redireciona para `/home`

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

- **Tudo que acessa dados de mercado ou IA** → Server Action em `web/src/lib/actions/`
- **Lógica de IA e análise pesada** → FastAPI em `api/`
- **Não há API routes Next.js** para lógica de negócio — use Server Actions

### Adicionando uma nova tela

1. Crie em `web/src/app/<nome>/page.tsx`
2. Adicione a rota protegida em `web/src/middleware.ts` (array `protectedRoutes`)
3. Use Server Components por padrão; Client Components (`"use client"`) só quando necessário (interatividade, hooks de estado)
4. Importe tipos de mercado de `web/src/types/market.ts` — não redefina

### Adicionando um novo endpoint na API

1. Crie o arquivo de rota em `api/app/api/routes/<nome>.py`
2. Registre o router em `api/app/api/__init__.py`
3. Adicione o contrato no `plan.md` da feature correspondente
4. Chame via Server Action no Next.js — nunca direto do cliente

---

## Design System

Filosofia: **"The Financial Reading Room"** — calmo, contextual, sério mas acessível. Não é um terminal de trading.

### Tokens de cor

| Token | Hex | Uso |
|---|---|---|
| Void | `#0D0B14` | Background mais profundo |
| Surface | `#1A1625` | Background de cards |
| Starlight | `#F4F0FF` | Texto primário |
| Amethyst | `#8B5CF6` | Acento, positivo, destaques |
| Rose | `#F43F5E` | Negativo, alertas |
| Glass | `rgba(255,255,255,0.05–0.15)` | Camadas de vidro |

### Tipografia

- **Playfair Display** (serif) — títulos, títulos de cards, ênfase
- **Inter** (sans-serif) — corpo, labels, números

### Anatomia de cards

```tsx
<div className="rounded-[2.5rem] border border-white/10 bg-[#1A1625]/40 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
  <GlassHighlight widthPercent={60} />
  {/* conteúdo */}
</div>
```

### Componentes obrigatórios

| Componente | Onde usar |
|---|---|
| `GlassHighlight` | Topo de todo card/painel |
| `VariationBadge` | Qualquer variação percentual de ativo |
| `MarketTemperatureDial` | Gauge de temperatura de mercado |

### Regras invioláveis

1. Nenhum design plano — toda superfície tem profundidade (sombra, blur, highlight)
2. Nenhuma cor fora da paleta acima
3. Todos os cantos arredondados — mínimo `rounded-xl`, cards `rounded-[2.5rem]`
4. Glassmorphism em todo card — `backdrop-blur`, `bg-.../40`, `border-white/10`
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
DATABASE_URL=postgresql://bullcapital:bullcapital@localhost:5432/bullcapital
ANALYSIS_API_URL=http://localhost:8001/api/v1
API_SHARED_SECRET=         # mesmo valor configurado na API, quando habilitado
```

### `api/.env`

```bash
DATABASE_URL=postgresql+asyncpg://bullcapital:bullcapital@localhost:5432/bullcapital
DATABASE_SSL=false
API_SHARED_SECRET=         # mesmo valor configurado no web, quando habilitado
BRAPI_KEY=                 # brapi.dev — fica apenas no backend/API
OPENAI_API_KEY=            # platform.openai.com
CORS_ORIGINS=http://localhost:3000
```

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
pnpm prisma migrate dev         # Aplicar novas migrations
pnpm prisma studio              # UI do banco em :5555

# API
cd api
uvicorn app.main:app --reload --port 8001   # Dev server em :8001

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
→ Normal sem `BRAPI_KEY` na API. Defina no `api/.env` ou Railway, nunca no web/client

**Serviço `db` não sobe**
→ Porta 5432 em uso. Execute `lsof -i :5432` e pare o Postgres local

---

## Regras Importantes

**Nunca:**
- Modificar `web/src/lib/services/market.ts` — já funciona, não toque
- Modificar `web/prisma/schema.prisma` — schema de auth, está completo
- Adicionar OAuth ou login social — fora do escopo MVP
- Usar texto em inglês na interface — tudo pt-BR
- Usar design plano — sempre aplique glassmorphism
- Adicionar rastreamento de portfólio, Open Finance, ou alertas — fora do MVP
- Criar um chat de IA genérico — análises sempre partem de um ativo ou evento concreto
- Dividir em dois bancos de dados — um PostgreSQL para tudo no MVP

**Sempre:**
- Importar tipos de mercado de `web/src/types/market.ts`
- Usar Server Actions para chamadas ao FastAPI (nunca do cliente)
- Formatar moeda com `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`
- Adicionar `GlassHighlight` ao topo de todo card
- Proteger novas rotas autenticadas no `middleware.ts`
