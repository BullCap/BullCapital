# Bull — Plano de migração de arquitetura

> **Status**: plano aprovado para execução faseada. Define o destino e a ordem de build.
> **Decisão de direção (2026-06-10, refinada no mesmo dia)**: o produto é uma **ferramenta de análise
> e inteligência para assessores financeiros — primário: ativos; secundário: carteiras — operando em
> conjunto com o sistema multiagente**. Carteiras são **contexto de análise efêmero** (D14): entram,
> são analisadas/narradas/exportadas e expiram (retenção 1–5 dias) — **não há persistência de carteira
> a longo prazo nesta fase**. O front segue minimalismo "old Apple" — simples, tranquilo, passando
> segurança — com família de componentes reutilizáveis de auditabilidade para relatórios, narrativas e
> análises geradas pela IA (D15). A spec de features do MVP (Tier A/B/C) é o documento de produto;
> este plano define a **arquitetura** que a suporta. O antigo `arquitetura-alvo.md` segue arquivado em
> [archive/](archive/arquitetura-alvo.md).

---

## 0. Objetivo

Migrar de um monorepo onde a FastAPI mistura IA e plano de dados para a topologia de **três unidades
desacopladas**, com infra definida:

| Unidade | Infra |
|---|---|
| **Web App (Next.js)** — front + back (BFF) + módulos de negócio + cron jobs | **Vercel** |
| **AI Service (FastAPI)** — orquestrador + tools, **repo próprio (`bullcapital-ai`)** | deploy **decidido no repo próprio** (Railway é a hipótese de trabalho atual) |
| **Postgres real** — schemas isolados, fonte da verdade | **Neon** |
| **Snapshot DB** — último snapshot bom, read-only no serving | **Supabase** |
| **Redis utilitário** — rate-limit, locks, cache quente | **Upstash** |

**Decisão 2026-06-10 (D7 revisada):** o Tier 2 volta — **Supabase guarda o snapshot; Neon é o banco
real**. O snapshot é escrito por job de sync (nunca pelo caminho de request) e lido apenas como
fallback, sempre rotulado. *Ressalva operacional:* um fallback raramente lido não pode dormir —
projeto Supabase em tier pago ou com keep-alive; monitorar idade do snapshot como métrica.

**Princípio condutor:** *seams limpos antes de mover qualquer coisa.* A migração drena o plano de dados
para fora da FastAPI (deixando-a AI puro), formaliza os módulos do web e só então extrai o AI Service
para outro repo. Cada fase é deployável isoladamente.

**Fronteira deste plano:** a migração prepara a fundação (módulos, schemas, ingestão, contratos).
As features de produto do MVP (formato Bull, agregação A1, FGC A2, risco A3, etc.) entram **depois,
via Spec Kit**, por cima dos seams criados aqui.

### 0.1 Critérios de aceite da migração

Estes critérios substituem qualquer formulação vaga como "diagrama documentado". O teste é: se duas
pessoas razoáveis conseguem discordar se o critério foi cumprido, ele ainda está vago.

| Critério | Passa quando | Não passa quando |
|---|---|---|
| **Documento de arquitetura** | há diagrama editável versionado ([diagrams/arquitetura-alvo.mmd](diagrams/arquitetura-alvo.mmd)) e render Mermaid no [README de arquitetura](README.md); cada componente tem responsabilidade, "não faz" e razão de separação; fronteiras de schema/import estão normativas; resiliência e contrato SSE têm semântica operacional | existe só PNG, diagrama ASCII ou seta sem regra; componente não explica por que é unidade separada; News/AI acessam schema de mercado fora da interface pública |
| **Fluxo de deploy** | pipeline está mapeado por deployable (§8.1), com trigger, ordem, migrations, rollback e tabela de env vars; `web/.env.example` e `api/.env.example` batem com a tabela | "deploya no Vercel/Railway" sem dizer quem roda migration, se deploys são acoplados ou onde vive cada secret |
| **Setup local** | uma pessoa que não participou da implementação sobe do `git clone` até app rodando com seed, Postgres com schemas alvo, Redis local e AI Service em modo local/mock em até 30 min seguindo só o README; toda pergunta feita vira correção no README antes de fechar | depende de pergunta privada, API key paga obrigatória para desenvolver web, seed ausente ou `docker compose up` não sobe dependências locais |
| **Decisões registradas** | as decisões centrais têm ADR curto em [adrs/](adrs/): deployables/AI Service, monolito modular, banco único com schemas, BFF como porta única, fallback em dois tiers | a justificativa vive só em conversa ou em bullet solto; alguém consegue "simplificar" a fronteira sem violar um ADR explícito |

**Gate geral:** Marco D não fecha até os quatro critérios acima estarem verdes. Antes disso, qualquer
checklist de "docs prontas" é parcial.

---

## 1. Arquitetura-alvo

Diagrama canônico editável: [diagrams/arquitetura-alvo.mmd](diagrams/arquitetura-alvo.mmd). O render
Mermaid vive no [README de arquitetura](README.md).

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

| Unidade | Responsabilidade | Não faz | Por que existe separada |
|---|---|---|---|
| **Web App** | UI, BFF, Módulo market/Assets (ingestão Brapi/BCB via cron), Módulo portfolio (import, reconciliação, risco, snapshots), Módulo reports (composição B2/B3 + export), Módulo user | IA, ingestão de news, gerar narrativa, acessar `news`/`ai` diretamente | fica perto de auth, sessão, cron Vercel, composição determinística e experiência do assessor; é o único deployable que conversa com browser |
| **AI Service** | Orquestrador + tools + Guardião, ingestão de news, narrativa (conversa + blocos narrativos de relatório) | servir UI, escrever em `market`/`portfolio`/`auth`, compor/exportar relatório, calcular risco/FGC/drift | isola custo/latência/falhas de LLM em processo Railway long-running e permite escalar narrativas sem acoplar o app transacional |
| **Neon** | persistência, 5 schemas isolados, snapshots de mercado e carteira | orquestração, cache quente, fila de trabalho | banco único reduz custo e complexidade operacional; schemas e roles mantêm fronteira lógica sem criar consistência distribuída |
| **Upstash** | rate-limit, locks de idempotência de cron, cache quente de quotes | fonte da verdade, snapshot read-only, ledger, fila durável | Redis é utilitário e descartável; melhora latência e protege custo, mas todo dado reconstruível precisa existir no Neon |

### 1.2 Por que 2 deployables e não 1 ou N

**Dois deployables** é o corte mínimo que separa falhas de LLM/orquestração das telas e cálculos
determinísticos. Um deployable único faria timeout/custo de IA disputar o mesmo ciclo de deploy e runtime
da experiência do assessor. Mais deployables agora (market worker, reports worker, news worker, portfolio
API própria) criariam coordenação operacional antes do volume justificar.

Dentro do Web App, o produto continua como **monolito modular**: módulos separados por interface pública,
não por processo. Extrair um módulo só é permitido quando a fronteira já estiver provada por contrato,
observabilidade e necessidade operacional.

### 1.3 Fronteiras normativas de dados e imports

- Browser acessa só o **BFF** (`web/src/app/api/*` e server actions autorizadas). O browser nunca chama
  Railway, Brapi, Neon ou Upstash diretamente.
- BFF pode chamar módulos do web e AI Service. Módulos do web não chamam o BFF.
- Cada módulo expõe apenas seu `index.ts`; import cruzado de arquivos internos (`modules/*/data`,
  `modules/*/ingest`, `modules/*/types` que não foram reexportados) é proibido.
- Só o dono do schema escreve no schema (§6.1). Leitura cruzada acontece por interface pública de módulo
  ou por role read-only explicitamente concedida ao AI Service.
- O Módulo news do AI Service **não lê `market.*` diretamente para descobrir ativos**. Quando precisar de
  universo/listagem/identidade de ativos, usa a interface pública de Assets do Módulo market (exposta pelo
  BFF ou por tool read-only versionada). Isso impede que news vire um segundo dono implícito do mercado.
- O Módulo portfolio nunca passa objetos de carteira para a ingestão de mercado; passa apenas lista global
  deduplicada de tickers (D11).

---

## 2. Estado atual (ponto de partida)

Monorepo pnpm com dois deployables.

**`web/` — Next.js 15** (BFF + UI). Rotas: `/`, `/auth/*`, `/home`, `/asset/[ticker]`, `/analysis`,
`/news`, `/search`, `/terminal`. Dados via server actions ([web/src/lib/actions/](../web/src/lib/actions/))
+ [services/market.ts](../web/src/lib/services/market.ts) (Brapi SDK direto) +
[internal-api.ts](../web/src/lib/internal-api.ts) (chama FastAPI). Auth NextAuth + Prisma.

**AI Service (FastAPI)** — extraído para o repo **`bullcapital-ai`** em 2026-06-10 (F7a); os caminhos
`api/...` abaixo descrevem o estado herdado, agora no repo novo — com **duas responsabilidades misturadas**:

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
| D1 | Produto = **análise e inteligência para assessores** — primário: ativos; secundário: carteiras — em conjunto com o sistema multiagente (2026-06-10) | spec de features do MVP é o doc de produto; carteira é input de análise, não entidade gerida; reescrever AGENTS.md §2/§13 |
| D2 | **News é ingestão exclusiva da IA**; sem aba de news no front | remover `/news`, `components/news`; schema `news` é do AI Service; scheduler de news fica no Railway como está |
| D3 | **yfinance removido**; resiliência via último snapshot bom rotulado | sem scraper não-licenciado; eixo de failover = staleness |
| D4 | Redis = **Upstash, utilitário** (rate-limit, locks de cron, cache quente) | remove rate-limiter in-process do `main.py`; Redis não é "tier" arquitetural nem fonte de verdade |
| D5 | Seams internos primeiro; extração do AI Service só depois dos seams | módulo com interface limpa hoje = extração barata amanhã |
| D6 | Infra: **Vercel** (front + back/BFF + cron) · **Neon** (Postgres único) · **Upstash** (Redis); deploy do AI Service é **decisão do repo `bullcapital-ai`** (Railway como hipótese de trabalho) | sem Supabase; Railway Postgres descomissionado quando a migração de schema terminar; o monorepo só exige do AI Service o contrato de borda (F0) e a role D9 |
| D7 | **(revisada 2026-06-10)** Neon = banco real (fonte da verdade); **Supabase = Snapshot DB Tier 2** — último snapshot bom de mercado, sincronizado por job (cron) e **read-only no serving** | envelope `{source, ts, stale}` em toda leitura; app nunca escreve no Supabase no caminho de request; exige tier pago/keep-alive (free tier pausa por inatividade) e monitoramento da idade do snapshot |
| D8 | **Ingestão dirigida pelo universo das carteiras**, EOD-first | universo = `SELECT DISTINCT ticker` de carteiras+watchlists, **deduplicado e global** (nunca per-user) + baseline fixo (IBOV + FIIs líquidos); job principal 1×/dia pós-fechamento; intraday best-effort durante o pregão |
| D9 | AI Service acessa o **mesmo Neon com role escopada** | write em `news`/`ai`; **read-only** em `market`/`portfolio`; sem read replica, sem segundo banco |
| D10 | **Snapshot de carteira existe dentro da janela de retenção** (revisado por D14): imutável enquanto vive, gravado no import e na valorização EOD, expira junto com a carteira | reprodutibilidade do relatório **dentro da sessão de análise**; o artefato durável é o relatório exportado (com hash + snapshot_ts impressos), não o banco; série temporal longa de drift fica **fora desta fase** |
| D11 | **Privacidade na ingestão**: pipeline de mercado recebe lista de tickers, nunca objetos/IDs de carteira | `ingest_runs` e logs sem identificadores de cliente; baseline (D8) impede que o universo espelhe uma carteira individual em base pequena; LGPD pesa no schema `portfolio` (CPF+patrimônio), não na ingestão |
| D12 | **Análise = dois planos distintos.** Análise *determinística* (A3: exposição, concentração, FGC, drift) é código do Módulo portfolio (web); análise *narrada* (conversa, relatório macro B3) é do AI Service, sempre por cima de números do núcleo | nenhum cálculo de risco no AI Service; nenhuma chamada a LLM nos módulos do web; a fronteira é o contrato de envelope (F0) |
| D13 | **Relatório é composto no web, narrado na IA.** Módulo reports (web) monta B2/B3 a partir de `portfolio.snapshots` + `market.*` e solicita ao AI Service apenas **blocos narrativos descritivos** (Guardião fail-closed); todo relatório referencia o `snapshot_id` que o originou | reprodutibilidade: re-render do relatório do dia X usa o snapshot do dia X (D10), nunca dado vivo; export PDF no web (`@react-pdf/renderer` serverless-friendly; Puppeteer só se a fidelidade exigir — validar na spec) |
| D14 | **Carteira é efêmera** (2026-06-10): schema `portfolio` é workspace de análise com **retenção de 1–5 dias** (TTL configurável, default 5); expurgo diário via cron; nada de carteira sobrevive à janela | sem persistência longa de CPF/patrimônio → superfície LGPD encolhe drasticamente; o assessor re-importa quando quiser nova análise; o que ele guarda é o **relatório exportado**; universo de ingestão (D8) encolhe automaticamente quando carteiras expiram (baseline mantém o aquecimento) |
| D15 | **Front: minimalismo "old Apple" + família de componentes de auditabilidade** — componentes reutilizáveis que tornam verificável o que a IA gerou: chip de provenance (`source`/`ts`/`stale` do envelope F0), referência de snapshot, distinção visual número-determinístico vs prosa-narrada, disclaimer não-dismissível | todo número exibido é rastreável ao envelope; nenhuma narrativa aparece sem moldura de procedência; especificação visual vive no [system-design.md](../system-design.md); os componentes entram via Spec Kit junto das telas |

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
│   ├── reports/                  # composição B2/B3 + export PDF (D13; domínio via Spec Kit)
│   │   └── index.ts              # seam; lê portfolio/market via interfaces públicas, narrativa via BFF↔AI
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
Brapi ──timeout / 5xx / rate-limit──► Upstash (cache TTL 1-5min) ──miss──► Neon market.* (banco real)
                                                                               │ indisponível
                                                                               ▼
                                                                   Supabase (Snapshot DB, read-only)
                                                                               │
                                                                   envelope {source, ts, stale}
```

- **Sync do snapshot:** job de cron copia o "último bom" de `market.*` (Neon) para o Supabase após
  cada run EOD (e opcionalmente após runs intraday). O caminho de request nunca escreve no Supabase.

- **Degradação visível**: nunca cai em silêncio; nunca fabrica número.
- O "último snapshot bom" **é** a tabela `market.asset_quotes` com `updated_at` no Neon. Não há provider
  separado nem segundo banco (D7).
- **Quem escreve snapshot:** apenas o Módulo market, via ingestão Brapi/BCB e jobs EOD/intraday. BFF,
  portfolio, reports e AI Service leem como read-only.
- **Fallback para snapshot** dispara quando a fonte primária falha e o cache Redis está ausente, velho para
  o TTL do tipo de dado ou indisponível. Redis indisponível nunca bloqueia leitura se o Neon tem último bom.
- **Até 15 min de atraso em pregão aberto:** resposta pode ser servida como `source: "snapshot"` com
  `stale: false`, exibindo "Atualizado há X min". Acima do limiar, `stale: true` e a UI exibe dado
  cacheado/snapshot com aviso de idade.
- **Tiers de UI:** dado fresco (`source: "brapi"|"bcb_sgs"`) aparece normal com timestamp; dado cacheado
  (`source: "cache"`) aparece normal com timestamp discreto; dado snapshot stale (`source: "snapshot",
  stale: true`) aparece em modo leitura, com aviso de atraso e sem ação que dependa de preço fresco.

### 6.4 Carteira efêmera e snapshots (D10 + D14 — entram com o domínio portfolio)

```
import ──► portfolio.* (workspace, TTL 1-5 dias) ──► análise · narrativa · relatório exportado
                    │                                            │
            cron de expurgo diário                    artefato durável fica com o assessor
            (deleta carteira + snapshots vencidos)    (PDF com hash + snapshot_ts impressos)
```

- `portfolio.snapshots`: imutável **enquanto vive**; gravado no import e na valorização EOD; expira
  junto com a carteira de origem.
- Conteúdo: posições + preços usados + métricas calculadas (alocação %, exposição FGC, drift).
- **Expurgo:** route handler de cron diário (`/api/cron/cleanup`, mesmo padrão dos demais: idempotente,
  lease lock, linha em `ingest_runs`) deleta carteiras e snapshots além do TTL. Expurgo é **delete real**,
  não soft-delete — é a promessa de privacidade do D14.
- **Fora desta fase:** série temporal longa de drift, trilha de evidência multi-mês, histórico entre
  re-imports. Se o produto provar necessidade, reabrir D14 com opt-in explícito do assessor.

### 6.5 Análise e relatórios (D12/D13 — entram via Spec Kit)

```
portfolio.snapshots + market.*  ──►  Módulo reports (web)  ──►  documento composto
        (números, snapshot_id)         │            ▲                 │
                                       ▼            │                 ▼
                              AI Service: blocos narrativos      export PDF/imagem
                              descritivos (Guardião, envelope)   (@react-pdf/renderer)
```

- **B2 (pacote p/ mesa):** 100% determinístico — posição completa + métricas + contexto; sem LLM.
- **B3 (relatório macro):** esqueleto e números do web; narrativa descritiva solicitada ao AI Service
  por bloco, com envelope de provenance; nenhum número entra no texto que não esteja no payload enviado.
- **Persistência:** `portfolio.reports` (metadados: tipo, `snapshot_id`, hash do conteúdo, gerado_em),
  sujeito ao mesmo TTL do workspace (D14). O artefato durável é o **export** que o assessor baixa, com
  hash e `snapshot_ts` impressos no rodapé — auditável sem o sistema reter a carteira.
- **A3 (risco/exposição):** funções puras no Módulo portfolio; mesmas funções alimentam tela, snapshot
  e relatório — um único caminho de cálculo, três superfícies.

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

**Superfície futura (D13):** endpoint de **bloco narrativo de relatório** — recebe payload
determinístico (números + contexto do snapshot), devolve prosa descritiva validada pelo Guardião.
Mesmo contrato de envelope da conversa; sem acesso a dado fora do payload + tools read-only.

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
| **F7 — Extrair AI Service p/ repo separado** | mover `api/` para repo próprio; credencial escopada (D9); descomissionar Railway Postgres | **antecipada em 2026-06-10**: repo `bullcapital-ai` criado antes de F5/F6; a redução a scaffold (F6) acontece no repo novo |
| **F8 — Docs** | reescrever AGENTS.md §2/§4/§6/§13 alinhados ao produto de assessor e à topologia final | conforme fases fecham |

**Depois da migração (via Spec Kit):** domínio portfolio (formato Bull, import A1, FGC A2, risco A3,
snapshots D10), relatórios (B2/B3 + export, D13) e telas do produto de assessor. A migração só deixa
os seams (`modules/{portfolio,reports}`) e os contratos prontos.

### 8.1 Fluxo de deploy por deployable

| Deployable | Trigger de build | Ordem de subida | Migrations | Rollback |
|---|---|---|---|---|
| **Web App (Vercel)** | mudanças em `web/**`, `docs/contracts/**`, `docs/migracao-arquitetura.md` quando contrato afeta BFF | depois de migrations Prisma quando houver mudança de schema; independente do AI quando não há mudança de contrato | `pnpm prisma migrate deploy` usando `DIRECT_URL`; release owner valida plano antes de produção | rollback de app no Vercel; migration só reverte por migration corretiva, nunca por `reset` |
| **AI Service (repo `bullcapital-ai`)** | repo próprio desde F7a; consome `docs/contracts/**` do monorepo como contrato versionado | independente do Web App, exceto bump de contrato SSE/envelope que exige compatibilidade backward por uma versão | Alembic para schemas `news`/`ai` quando existir; roda antes do deploy do serviço | rollback para versão anterior compatível; migration reversa só se for explicitamente segura; detalhes finais são decisão do repo próprio |
| **Neon Postgres** | migration revisada em PR | antes do app que depende da mudança | Prisma owns `market`/`portfolio`/`auth`; Alembic owns `news`/`ai`; grants D9 no mesmo release | restore/branch Neon apenas para incidente; caminho normal é migration forward |
| **Upstash Redis** | alteração de infra/env | sem ordem quando usado como cache/lock; nunca pré-requisito para servir snapshot | não aplica | pode ser limpo/recriado sem perda de fonte da verdade |

Mudança em contrato BFF↔AI ou envelope exige: bump de versão, testes/fixtures dos dois lados e deploy em
ordem compatível (produtor novo emitindo campos opcionais antes de consumidor exigir campos obrigatórios).

### 8.2 Variáveis de ambiente normativas

| Nome | Deployable | Exemplo não sensível | Onde vive o secret real | Obrigatória |
|---|---|---|---|---|
| `DATABASE_URL` | Web | `postgresql://user:pass@host-pooler/db?sslmode=require` | Vercel env / `.env.local` | sim |
| `DIRECT_URL` | Web | `postgresql://user:pass@host/db?sslmode=require` | Vercel env / `.env.local` | sim para migrations |
| `NEXTAUTH_SECRET` | Web | valor de `openssl rand -base64 32` | Vercel env / `.env.local` | sim |
| `NEXTAUTH_URL` | Web | `https://app.bullcapital.com.br` | Vercel env / `.env.local` | sim |
| `ANALYSIS_API_URL` | Web | `https://ai.bullcapital.com.br/api/v1` | Vercel env / `.env.local` | sim |
| `API_SHARED_SECRET` | Web + AI Service | valor aleatório compartilhado | Vercel env + Railway variables | sim em produção |
| `BRAPI_KEY` | Web | `brapi_xxx` | Vercel env | sim para ingestão real; opcional em dev com seed/mock |
| `CRON_SECRET` | Web | valor aleatório | Vercel env | sim em produção |
| `OPENROUTER_API_KEY` | Web | `sk-or-...` | Vercel env / `.env.local` | opcional; legado do daily/story brief até mover narrativa para AI Service |
| `UPSTASH_REDIS_REST_URL` | Web | `https://x.upstash.io` | Vercel env | F4+ |
| `UPSTASH_REDIS_REST_TOKEN` | Web | `AX...` | Vercel env | F4+ |
| `DATABASE_URL` | AI Service | `postgresql+asyncpg://user:pass@host/db?ssl=require` | Railway variables / `.env` | sim |
| `DATABASE_SSL` | AI Service | `true` | Railway variables / `.env` | sim em produção |
| `DATABASE_CA_CERT` | AI Service | caminho ou PEM | Railway variables | opcional |
| `OPENAI_API_KEY` | AI Service | `sk-...` | Railway variables | sim para IA real; substituível por mock/local em dev |
| `OPENROUTER_API_KEY` | AI Service | `sk-or-...` | Railway variables | opcional |
| `OPENROUTER_MODEL` | AI Service | `deepseek/deepseek-v4-flash` | Railway variables | opcional |
| `BRAPI_KEY` | AI Service | `brapi_xxx` | Railway variables | transitório até F6; opcional quando `MARKET_SCHEDULERS_ENABLED=false` |
| `CORS_ORIGINS` | AI Service | `https://app.bullcapital.com.br,http://localhost:3000` | Railway variables / `.env` | sim |
| `MARKET_SCHEDULERS_ENABLED` | AI Service | `false` | Railway variables / `.env` | sim até F6 para desligar plano de dados |
| `LOG_LEVEL` | AI Service | `INFO` | Railway variables / `.env` | opcional |

Cada deployable mantém exatamente um exemplo versionado: [../web/.env.example](../web/.env.example) no
monorepo e `.env.example` no repo `bullcapital-ai`. Qualquer nova env var só passa em PR se a tabela e o
exemplo forem atualizados juntos.

### 8.3 Setup local validável

O setup local alvo precisa permitir desenvolvimento do Web App sem conta paga de LLM.

- `docker compose up` deve subir Postgres pgvector, Redis local/compatível e AI Service.
- O banco local deve criar os schemas `market`, `portfolio`, `auth`, `news`, `ai` ou rodar migration única
  que os crie.
- `pnpm --filter web db:seed` deve criar usuário de dev e dados mínimos de mercado/carteira suficientes
  para `/home`, `/terminal` e uma chamada BFF↔AI.
- AI Service deve aceitar modo `mock` ou endpoint local compatível com OpenAI para narrativas de dev. Sem
  isso, o critério de setup local não fecha.
- Validação final: outra pessoa em máquina limpa, sem contexto privado, registra o tempo do `git clone` até
  app navegável. Meta: até 30 min. Toda dúvida vira patch no README antes de fechar.

---

## 9. Reconciliação de documentação

- **Arquivado** [archive/arquitetura-alvo.md](archive/arquitetura-alvo.md) com banner de substituição. ✅
- **AGENTS.md banner/§2/§13**: já apontam para este plano e registram a direção de 2026-06-10
  (gestão de carteiras para assessores). ✅
- **AGENTS.md §4 (Arquitetura)**: substituir diagrama pelo de deployables (§1 aqui) quando Marco B fechar.
- **AGENTS.md §6 (Inventário)**: remover superfícies de news do front após F2.

---

## 10. Tensões / open items

1. **Home digest** (§4.1) — fica com fonte atual até o contrato BFF↔AI existir; home será redesenhada
   com as telas do produto de assessor. *Confirmar no redesign.*
2. **Fonte única de quotes (Brapi)** — mitigada por EOD-first + BCB SGS (macro oficial) + staleness
   rotulada. Segunda fonte licenciada (B3 UP2DATA, Cedro) só se diligência de cliente exigir. *Pós-MVP.*
3. **Plano Vercel** — múltiplos crons + timeouts maiores exigem plano Pro; validar limites antes da F3.
4. **Região/DPA Neon** — schema `portfolio` carrega CPF+patrimônio durante a janela de retenção
   (LGPD-material mesmo efêmero); verificar região e termos de processamento antes de dado real de
   cliente. Avaliar na spec de import se o CPF é sequer necessário nesta fase (pseudônimo/apelido de
   cliente pode bastar para análise efêmera). *Antes do domínio portfolio.*
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
| Expurgo (D14) falha em silêncio e carteiras sobrevivem ao TTL | cleanup é cron com lease + linha em `ingest_runs`; monitorar última execução; delete real verificável por query de auditoria (nenhuma linha além do TTL) |

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

- [x] F7a — `api/` extraído para o repo `bullcapital-ai` (2026-06-10, antecipado); `railway.toml` foi junto; docker-compose aponta para clone lado a lado
- [ ] F7b — credencial escopada (D9) no Neon; descomissionar Railway Postgres; decisão de deploy do AI Service registrada no repo próprio
- [ ] F8 — reescrever AGENTS.md §2/§4/§6/§13 alinhados ao novo desenho; fechar critérios §0.1

**Pronto quando:** dois repos deployam independentemente, AGENTS.md descreve a topologia de 3 unidades,
diagrama/README/ADRs/env/setup estão verificáveis pelos critérios §0.1.

### Resumo de sequência

```
Marco A ──► Marco B ──► Marco C ──► Marco D ──► domínio portfolio via Spec Kit (A1, A2, ...)
(F0·F1·F2)  (F3·F4)     (F5·F6)     (F7·F8)
   │
   └─ F2 pode correr em paralelo a qualquer momento
```

> Sem datas: o roadmap é ordenado por dependência/severidade, não por calendário. Atribuir janelas quando
> os open items §10 estiverem resolvidos.
