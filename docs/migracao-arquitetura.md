# Bull — Plano de migração de arquitetura

> **Status**: plano aprovado para execução faseada. Define o destino e a ordem de build.
> **Decisão de direção (2026-06-10)**: o produto é **gestão de carteiras + inteligência de mercado
> para assessores financeiros**. Esta revisão substitui a nota de 2026-06-09 ("retorno a inteligência
> de mercado pura") — as duas frentes se fundem: o núcleo determinístico de carteira é o produto; a
> inteligência de mercado (Assets, contexto, narrativa de IA) é a camada que o serve. A spec de
> features do MVP (Tier A/B/C — agregação, FGC, risco, rebalanceamento, vencimentos, triagem,
> relatórios, chat multiagente) é o documento de produto; este plano define a **arquitetura** que a
> suporta. O antigo `arquitetura-alvo.md` segue arquivado em [archive/](archive/arquitetura-alvo.md).

---

## 0. Objetivo

Migrar de um monorepo onde a FastAPI mistura IA e plano de dados para a topologia de **três unidades
desacopladas**, com infra definida:

| Unidade | Infra |
|---|---|
| **Web App (Next.js)** — BFF + módulos de negócio + cron jobs | **Vercel** |
| **AI Service (FastAPI)** — orquestrador + tools, repo separado | **Railway** |
| **Postgres único** — schemas isolados | **Neon** |
| **Redis utilitário** — rate-limit, locks, cache quente | **Upstash** |

**Sem Supabase e sem segundo banco.** O conceito de "Snapshot DB Tier 2 em provider separado" foi
descartado (ver D7): snapshot é tabela no próprio Neon, com staleness rotulada na leitura.

**Princípio condutor:** *seams limpos antes de mover qualquer coisa.* A migração drena o plano de dados
para fora da FastAPI (deixando-a AI puro), formaliza os módulos do web e só então extrai o AI Service
para outro repo. Cada fase é deployável isoladamente.

**Fronteira deste plano:** a migração prepara a fundação (módulos, schemas, ingestão, contratos).
As features de produto do MVP (formato Bull, agregação A1, FGC A2, risco A3, etc.) entram **depois,
via Spec Kit**, por cima dos seams criados aqui.

---

## 1. Arquitetura-alvo

```
                          Client (Browser) — SSE / HTTP
                                     │
        ┌────────────────────────────┴───────────────────────┐
        ▼                                                     ▼
┌─────────────────────────────────────────┐      ┌──────────────────────────────┐
│ DEPLOYABLE 1 — Web App (Next.js)         │      │ DEPLOYABLE 2 — AI Service     │
│ VERCEL · BFF + módulos + cron            │      │ RAILWAY · FastAPI · repo      │
│                                          │      │ separado                      │
│  Camada BFF — auth · routing · circuit   │◀────▶│  Orquestrador (dispara·       │
│  breakers   (/api)                       │ SSE  │  consolida) + Guardião        │
│        │           │           │         │      │     │      │       │          │
│        ▼           ▼           ▼         │      │     ▼      ▼       ▼          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐  │      │  Carteira Notíc.  Contexto    │
│  │ Módulo   │ │ Módulo   │ │ Módulo   │  │      │  (tools read-only sobre       │
│  │ market   │ │ portfolio│ │ user     │  │      │   Postgres, role escopada)    │
│  │ Brapi +  │ │ import · │ │ auth/    │  │      │  + ingestão de news (RSS)     │
│  │ BCB SGS  │ │ risco ·  │ │ perfil   │  │      └──────────────────────────────┘
│  │ + cron   │ │ snapshots│ │          │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘  │
└───────┼────────────┼────────────┼────────┘
        ▼            ▼            ▼
┌──────────────────────────────────────────────────────────────────┐
│ NEON — PostgreSQL · schema isolation (banco único)                 │
│   market · portfolio · auth · news · ai (pgvector)                 │
└──────────────────────────────────────────────────────────────────┘
        ▲
┌────────────────────────┐
│ UPSTASH — Redis         │  rate-limit · locks de cron · cache quente de quotes
└────────────────────────┘
```

### 1.1 Responsabilidade de cada unidade

| Unidade | Responsabilidade | Não faz |
|---|---|---|
| **Web App** | UI, BFF, Módulo market (ingestão Brapi/BCB via cron), Módulo portfolio (import, reconciliação, risco, snapshots), Módulo user | IA, ingestão de news |
| **AI Service** | Orquestrador + tools + Guardião, ingestão de news, narrativa | servir UI, escrever em `market`/`portfolio`/`auth` |
| **Neon** | persistência, 5 schemas isolados | — |
| **Upstash** | rate-limit, locks de idempotência de cron, cache quente | fonte da verdade, "tier" arquitetural |

---

## 2. Estado atual (ponto de partida)

Monorepo pnpm com dois deployables.

**`web/` — Next.js 15** (BFF + UI). Rotas: `/`, `/auth/*`, `/home`, `/asset/[ticker]`, `/analysis`,
`/news`, `/search`, `/terminal`. Dados via server actions ([web/src/lib/actions/](../web/src/lib/actions/))
+ [services/market.ts](../web/src/lib/services/market.ts) (Brapi SDK direto) +
[internal-api.ts](../web/src/lib/internal-api.ts) (chama FastAPI). Auth NextAuth + Prisma.

**`api/` — FastAPI**, hoje com **duas responsabilidades misturadas**:

- *Plano de IA*: [agent/](../api/app/agent/) (Agno + gpt-4o), rotas `analysis`/`conversation`/`comparator`,
  models `analysis`/`conversation` (pgvector).
- *Plano de dados*: rota `market` + ingestão ([market_ingest.py](../api/app/services/market_ingest.py),
  [market_db.py](../api/app/services/market_db.py), [bcb_sgs.py](../api/app/services/bcb_sgs.py),
  [news_ingest.py](../api/app/services/news_ingest.py), [news_feeds.py](../api/app/services/news_feeds.py),
  [yfinance_market.py](../api/app/services/yfinance_market.py)), schedulers asyncio no
  [main.py](../api/app/main.py). Tudo grava no schema único `ai`.

**Sem Redis** (rate-limiter in-process). **Sem domínio de carteira** (não existe schema/módulo
`portfolio`). Fallback de mercado é yfinance (sai — D3).

---

## 3. Gap analysis

| Peça do alvo | Hoje | Ação |
|---|---|---|
| Deployable 2 = só IA, repo separado, Railway | FastAPI faz IA **+** ingestão de dados | drenar dados → web; news fica na IA; extrair repo |
| Módulo market no web (Brapi + BCB, cron Vercel) | dividido entre `services/market.ts` (web) e ingestão (api) | consolidar no web; schedulers → Vercel Cron + route handlers |
| Módulo portfolio no web | não existe | criar seam vazio na migração; domínio entra via Spec Kit |
| Módulo user no web | já existe (NextAuth + Prisma) | formalizar como módulo |
| News = ingestão exclusiva da IA | ingestão na FastAPI **+** aba `/news` no front | **manter na IA, remover front** |
| Camada BFF explícita (`/api`) | server actions dispersas | consolidar routing/auth/circuit-breaker |
| Schema isolation (market/portfolio/auth/news/ai) | tudo no schema `ai` + Prisma | separar schemas no Neon |
| Redis utilitário (Upstash) | nenhum | adicionar para rate-limit/locks/cache |
| Snapshot de mercado | fallback = yfinance | tabela no Neon + envelope staleness; **remover yfinance** |
| Snapshot de carteira (append-only) | não existe | criar com o domínio portfolio (Spec Kit) |
| BFF ↔ AI via SSE | parcial ([conversation/stream](../web/src/app/api/conversation/stream)) | generalizar |

---

## 4. Decisões travadas

| # | Decisão | Consequência |
|---|---|---|
| D1 | Produto = gestão de carteiras + inteligência de mercado para assessores (2026-06-10) | spec de features do MVP é o doc de produto; reescrever AGENTS.md §2/§13 |
| D2 | **News é ingestão exclusiva da IA**; sem aba de news no front | remover `/news`, `components/news`; schema `news` é do AI Service; scheduler de news fica no Railway como está |
| D3 | **yfinance removido**; resiliência via último snapshot bom rotulado | sem scraper não-licenciado; eixo de failover = staleness |
| D4 | Redis = **Upstash, utilitário** (rate-limit, locks de cron, cache quente) | remove rate-limiter in-process do `main.py`; Redis não é "tier" arquitetural nem fonte de verdade |
| D5 | Seams internos primeiro; extração do AI Service só depois dos seams | módulo com interface limpa hoje = extração barata amanhã |
| D6 | Infra: **Vercel** (web+cron) · **Neon** (Postgres único) · **Upstash** (Redis) · **Railway** (AI Service) | sem Supabase; Railway Postgres descomissionado quando a migração de schema terminar |
| D7 | **Snapshot de mercado = tabela no Neon** com envelope `{source, ts, stale}` calculado na leitura | sem segundo banco; um Postgres separado só protegeria contra queda do próprio Neon — cenário em que auth/portfolio já caíram junto |
| D8 | **Ingestão dirigida pelo universo das carteiras**, EOD-first | universo = `SELECT DISTINCT ticker` de carteiras+watchlists, **deduplicado e global** (nunca per-user) + baseline fixo (IBOV + FIIs líquidos); job principal 1×/dia pós-fechamento; intraday best-effort durante o pregão |
| D9 | AI Service acessa o **mesmo Neon com role escopada** | write em `news`/`ai`; **read-only** em `market`/`portfolio`; sem read replica, sem segundo banco |
| D10 | **Snapshot de carteira é conceito de produto**: `portfolio.snapshots` append-only e imutável (a cada import + job EOD de valorização) | série temporal de drift, reprodutibilidade de relatórios e trilha de evidência (linha CVM "informa e evidencia"); entra via Spec Kit junto do domínio portfolio |
| D11 | **Privacidade na ingestão**: pipeline de mercado recebe lista de tickers, nunca objetos/IDs de carteira | `ingest_runs` e logs sem identificadores de cliente; baseline (D8) impede que o universo espelhe uma carteira individual em base pequena; LGPD pesa no schema `portfolio` (CPF+patrimônio), não na ingestão |

### 4.1 Item aberto (decisão recomendada, confirmar)

A home consome news indiretamente via daily brief / story digest
([StoryDigestSection](../web/src/components/home/StoryDigestSection.tsx),
[story-brief.ts](../web/src/lib/actions/story-brief.ts),
[daily-brief.ts](../web/src/lib/actions/daily-brief.ts)).

**Recomendado:** os componentes da home **ficam por ora**, com a fonte atual, até o contrato BFF↔AI
existir — aí a fonte muda para o brief narrado pelo AI Service. A aba standalone `/news` some já (F2);
a narrativa derivada permanece. A home inteira será redesenhada quando as telas do produto de assessor
(lista de clientes / book) entrarem via Spec Kit.

---

## 5. Estrutura-alvo do Web App

```
web/src/
├── app/
│   ├── api/                      # CAMADA BFF — routing, auth guard, circuit breakers, SSE proxy p/ AI
│   │   └── cron/                 # route handlers idempotentes (Vercel Cron, protegidos por CRON_SECRET)
│   ├── (rotas de UI)             # home, asset, analysis, search, terminal, auth  (news REMOVIDA)
│   └── ...
├── modules/                      # NOVO — módulos de negócio
│   ├── market/                   # Brapi + BCB SGS + cadeia de resiliência
│   │   ├── data/                 # acesso a Postgres (schema market) + Upstash
│   │   ├── ingest/               # lógica de ingestão (chamada pelos handlers de cron)
│   │   ├── types.ts
│   │   └── index.ts              # interface pública do módulo
│   ├── portfolio/                # import · reconciliação · risco/FGC · snapshots  (domínio via Spec Kit)
│   │   └── index.ts              # seam criado na migração; conteúdo entra com as specs do MVP
│   └── user/                     # auth/perfil (NextAuth + Prisma, schema auth)
└── lib/                          # utils compartilhados (market-utils, cn, etc.)
```

**Regras de seam:** cada módulo expõe só seu `index.ts`; a BFF chama módulos, módulos não chamam a BFF;
nenhum acesso a Postgres fora de `modules/*/data`. O módulo `market` recebe **lista de tickers**, nunca
estruturas de carteira (D11).

---

## 6. Plano de dados

### 6.1 Schema isolation (Neon, banco único)

| Schema | Dono (escreve) | Lê |
|---|---|---|
| `market` | Módulo market (web) | market/portfolio (web), tools do AI Service (read-only) |
| `portfolio` | Módulo portfolio (web) | portfolio (web), tools do AI Service (read-only) |
| `auth` | Módulo user (web, Prisma) | Módulo user |
| `news` | AI Service | tools do AI Service |
| `ai` (pgvector) | AI Service | AI Service |

**Migração:** o schema único `ai` de hoje é desmembrado. Tabelas de mercado/quotes/macro → `market`;
news → `news`; analysis/conversation/embeddings permanecem em `ai`. Ownership de migrations:
Prisma para `market`/`portfolio`/`auth` (web); Alembic para `news`/`ai` (AI Service).
**Credenciais:** role do AI Service com grants write(`news`,`ai`) + read(`market`,`portfolio`) — D9.

### 6.2 Ingestão de mercado (Módulo market)

```
universo = DISTINCT tickers (carteiras + watchlists) ∪ baseline (IBOV + FIIs líquidos)
   │
   ├─ Job EOD (1×/dia, ~18h30 BRT) ─► valoriza tudo, grava histórico   ← o run que importa
   ├─ Intraday best-effort (5-15min, só em pregão; handler checa sessão B3)
   └─ Macro BCB SGS (1×/dia) — SELIC, IPCA, PTAX (fonte oficial, gratuita; já existe em bcb_sgs.py)
```

- **Vercel Cron → route handlers** em `app/api/cron/*`, protegidos por `CRON_SECRET`, upserts
  idempotentes, lock por job (`pg_try_advisory_lock` — padrão já usado no
  [main.py](../api/app/main.py#L55) — ou `SET NX EX` no Upstash).
- **Tabela `market.ingest_runs`** (job, started_at, finished_at, ok_count, fail_count, source) —
  observabilidade barata; alimenta o rótulo de staleness.
- **Batches** via endpoint batch da Brapi, em chunks que cabem no timeout da function.
- **Crédito privado (CDB/LCI/LCA/CRI) não entra na ingestão** — não tem feed; valor vem do import e
  envelhece até o re-import (idade exposta na UI).
- EOD-first reduz a dependência da Brapi de "de pé o dia todo" para "responde 1×/dia".

### 6.3 Resiliência de leitura (sem segundo banco)

```
Brapi ──falha / rate-limit──► Upstash (cache TTL 1-5min) ──miss──► Neon market.* (último bom)
                                                                        │
                                              resposta SEMPRE com envelope {source, ts, stale}
```

- **Degradação visível**: nunca cai em silêncio; nunca fabrica número.
- O "último snapshot bom" **é** a tabela `market.asset_quotes` com `updated_at` — não há Tier 2.

### 6.4 Snapshot de carteira (D10 — entra com o domínio portfolio)

- `portfolio.snapshots`: append-only, imutável; gravado a cada import e no job EOD de valorização.
- Conteúdo: posições + preços usados + métricas calculadas (alocação %, exposição FGC, drift).
- Entrega: série temporal de drift (A5), reprodutibilidade de relatórios, trilha de evidência (CVM).
- Volume irrelevante no MVP; arquivamento frio (Vercel Blob) só se um dia pesar.

---

## 7. AI Service (Deployable 2) — alvo de scaffold

Reduzir o `api/` ao essencial de IA e preparar extração para repo próprio (Railway).

**Permanece:** [agent/](../api/app/agent/), rotas `analysis`/`conversation`/`comparator`,
models `analysis`/`conversation`, ingestão de **news** ([news_ingest.py](../api/app/services/news_ingest.py),
[news_feeds.py](../api/app/services/news_feeds.py)) — o scheduler asyncio de news fica como está
(Railway é processo long-running) — orquestrador + tools **read-only** sobre Postgres (role D9).

**Sai:** ingestão de mercado/macro ([market_ingest.py](../api/app/services/market_ingest.py),
[market_db.py](../api/app/services/market_db.py), [bcb_sgs.py](../api/app/services/bcb_sgs.py) — migra
para o web), rota `market`, [yfinance_market.py](../api/app/services/yfinance_market.py), schedulers de
mercado do [main.py](../api/app/main.py).

**Contrato de borda:** BFF ↔ AI via SSE; toda resposta carrega envelope de provenance
(`source`, `snapshot_ts`, `stale`, `tenant`). **Invariante:** tools só emitem números presentes na
saída do núcleo determinístico; Guardião fail-closed em toda resposta.

---

## 8. Ordem de build (faseada)

Cada fase é independente e deployável.

| Fase | Entrega | Depende de |
|---|---|---|
| **F0 — Seams/contratos** | contrato do dado que as tools leem (snapshot + envelope) + contrato BFF↔AI (SSE) | — |
| **F1 — Estrutura de módulos** | `web/src/modules/{market,portfolio,user}/` + camada BFF em `app/api/`; mover `services/market.ts` p/ market | F0 |
| **F2 — Remover news do front** | apagar `/news`, `components/news`; manter ingestão na IA; digest da home fica (§4.1) | — (paralelo) |
| **F3 — Drenar ingestão da FastAPI** | ingestão de mercado/macro → Módulo market (Vercel Cron + handlers idempotentes + `ingest_runs`); universo D8 | F1 |
| **F4 — Resiliência-lite** | Upstash (rate-limit, locks, cache) + envelope staleness na leitura; remover yfinance e rate-limiter in-process | F3 |
| **F5 — Schema isolation no Neon** | desmembrar schema `ai` em `market`/`news`/`ai` + criar `portfolio`/`auth`; ownership de migrations; role escopada (D9) | F3 |
| **F6 — FastAPI → scaffold** | apagar serviços/rotas/schedulers de dados; sobra orquestrador + tools + analysis/conv/comp | F3, F5 |
| **F7 — Extrair AI Service p/ repo separado (Railway)** | mover `api/` para repo próprio; credencial escopada (D9); descomissionar Railway Postgres | F6 |
| **F8 — Docs** | reescrever AGENTS.md §2/§4/§6/§13 alinhados ao produto de assessor e à topologia final | conforme fases fecham |

**Depois da migração (via Spec Kit):** domínio portfolio (formato Bull, import A1, FGC A2, risco A3,
snapshots D10) e telas do produto de assessor. A migração só deixa o seam pronto.

---

## 9. Reconciliação de documentação

- **Arquivado** [archive/arquitetura-alvo.md](archive/arquitetura-alvo.md) com banner de substituição. ✅
- **AGENTS.md banner/§2/§13**: apontam para doc movido (`docs/arquitetura-alvo.md`) — corrigir para
  este plano; registrar direção de 2026-06-10 (gestão de carteiras para assessores).
- **AGENTS.md §4 (Arquitetura)**: substituir diagrama pelo de deployables (§1 aqui) quando Marco B fechar.
- **AGENTS.md §6 (Inventário)**: remover superfícies de news do front após F2.

---

## 10. Tensões / open items

1. **Home digest** (§4.1) — fica com fonte atual até o contrato BFF↔AI existir; home será redesenhada
   com as telas do produto de assessor. *Confirmar no redesign.*
2. **Fonte única de quotes (Brapi)** — mitigada por EOD-first + BCB SGS (macro oficial) + staleness
   rotulada. Segunda fonte licenciada (B3 UP2DATA, Cedro) só se diligência de cliente exigir. *Pós-MVP.*
3. **Plano Vercel** — múltiplos crons + timeouts maiores exigem plano Pro; validar limites antes da F3.
4. **Região/DPA Neon** — schema `portfolio` carrega CPF+patrimônio (LGPD-material); verificar região e
   termos de processamento antes de dado real de cliente. *Antes do domínio portfolio.*
5. **Migração de dados Railway Postgres → Neon** — janela e backfill; sequenciar dentro da F5.

---

## 11. Riscos

| Risco | Mitigação |
|---|---|
| Migração de schema quebra ingestão em produção | desmembrar schema em F5 com janela e backfill; manter `ai` lendo durante transição |
| Cron serverless perde execuções | handlers idempotentes + advisory lock (padrão já usado no [main.py](../api/app/main.py#L55)); EOD-first torna o run diário o único crítico |
| Extração do AI Service vaza acoplamento de DB | F0 fixa o contrato de borda; D9 fixa o acesso (role escopada, read-only fora de `news`/`ai`) |
| Fonte de mercado única (pós-yfinance) | EOD-first + envelope de staleness + BCB SGS para macro; 2ª fonte licenciada se diligência exigir |
| Vazamento de PII via pipeline de ingestão | D11: ingestão só vê tickers; logs/`ingest_runs` sem IDs de cliente; baseline impede espelhamento em base pequena |

---

## 12. Roadmap

Quatro marcos. Cada marco agrupa fases da §8, é deployável ao fim, e tem critério de pronto explícito.
A sequência respeita as dependências; F2 corre em paralelo a qualquer momento.

### Marco A — Fundação e seams (F0 · F1 · F2)
**Tema:** fixar contratos e formalizar os módulos do web sem mover lógica de dados ainda.

- [x] F0 — contratos versionados em [contracts/data-envelope.md](contracts/data-envelope.md) e
      [contracts/bff-ai-sse.md](contracts/bff-ai-sse.md); tipos em `modules/market/types.ts`
- [x] F1 — `web/src/modules/{market,portfolio,user}/`; `services/market.ts` → Módulo market
- [x] F2 — remover front de news (`/news`, `components/news`); ingestão segue na IA; digest fica (§4.1)

**Pronto quando:** módulos têm `index.ts` público, BFF roteia por eles, front de news removido,
contratos de borda revisados e versionados.

### Marco B — Ingestão no web + resiliência (F3 · F4)
**Tema:** o Módulo market vira dono da ingestão e ganha degradação rotulada.

- [ ] F3 — ingestão de mercado/macro → Módulo market (Vercel Cron + handlers idempotentes + `ingest_runs`); universo D8
- [ ] F4 — Upstash (rate-limit/locks/cache) + envelope staleness; remover yfinance e rate-limiter in-process

**Pronto quando:** mercado é servido pelo módulo com cadeia Brapi→Upstash→Neon, degradação rotulada,
zero dependência de yfinance. **Resolver antes:** open item §10.3 (plano Vercel).

### Marco C — Isolamento e redução do AI Service (F5 · F6)
**Tema:** separar schemas no Neon e reduzir a FastAPI ao núcleo de IA.

- [ ] F5 — schemas `market`/`portfolio`/`auth`/`news`/`ai` no Neon; ownership de migrations; role escopada (D9); migrar dados do Railway Postgres
- [ ] F6 — apagar serviços/rotas/schedulers de dados da FastAPI; sobra orquestrador + tools + analysis/conv/comp

**Pronto quando:** 5 schemas isolados com donos claros, FastAPI sem código de plano de dados, tools
read-only sobre Postgres.

### Marco D — Extração e documentação (F7 · F8)
**Tema:** o AI Service vira repo próprio no Railway; docs refletem a realidade.

- [ ] F7 — mover `api/` para repo separado; credencial escopada; descomissionar Railway Postgres
- [ ] F8 — reescrever AGENTS.md §2/§4/§6/§13 alinhados ao novo desenho

**Pronto quando:** dois repos deployam independentemente, AGENTS.md descreve a topologia de 3 unidades.

### Resumo de sequência

```
Marco A ──► Marco B ──► Marco C ──► Marco D ──► domínio portfolio via Spec Kit (A1, A2, ...)
(F0·F1·F2)  (F3·F4)     (F5·F6)     (F7·F8)
   │
   └─ F2 pode correr em paralelo a qualquer momento
```

> Sem datas: o roadmap é ordenado por dependência/severidade, não por calendário. Atribuir janelas quando
> os open items §10 estiverem resolvidos.
