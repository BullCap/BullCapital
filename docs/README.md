# Bull - README de arquitetura

Este README é o ponto de entrada para a arquitetura alvo da migração. O plano normativo completo está em
[migracao-arquitetura.md](migracao-arquitetura.md).

## Diagrama canônico

Fonte editável versionada: [diagrams/arquitetura-alvo.mmd](diagrams/arquitetura-alvo.mmd).

```mermaid
flowchart TB
  client["Client Browser/PWA"]

  subgraph web["Deployable 1: Web App - Next.js / Vercel"]
    bff["BFF (/api): auth, routing, circuit breakers, SSE re-emitter"]
    market["Modulo market / Assets: Brapi, BCB SGS, cron, snapshots"]
    portfolio["Modulo portfolio: import, reconciliacao, risco, FGC, snapshots"]
    reports["Modulo reports: composicao B2/B3, export, snapshot_id"]
    user["Modulo user: auth, perfil, sessao"]
  end

  subgraph ai["Deployable 2: AI Service - FastAPI / Railway"]
    orchestrator["Orquestrador: dispara tools em paralelo e consolida"]
    guardian["Guardiao: valida provenance e bloqueia recomendacao"]
    tools["Tools read-only: portfolio, market/assets, contexto"]
    news["Modulo news: RSS, contexto e escrita em news"]
  end

  neon[("Neon Postgres - banco real\nschemas: market, portfolio, auth, news, ai")]
  redis[("Upstash Redis\nrate-limit, locks, cache quente")]
  supabase[("Supabase - Snapshot DB Tier 2\nultimo snapshot bom, read-only no serving")]

  client <-->|"HTTPS / SSE"| bff
  bff <-->|"SSE normalizado"| orchestrator

  bff --> market
  bff --> portfolio
  bff --> reports
  bff --> user

  reports -->|"blocos narrativos"| bff
  orchestrator --> tools
  orchestrator --> guardian
  news -->|"usa interface publica de Assets\npara universo/identidade"| tools

  market -->|"write market"| neon
  portfolio -->|"write portfolio"| neon
  user -->|"write auth"| neon
  news -->|"write news"| neon
  orchestrator -->|"write ai"| neon
  tools -->|"read-only market/portfolio"| neon

  market <-->|"cache quente / locks"| redis
  bff -->|"rate-limit"| redis

  market -->|"sync pos-EOD (cron)"| supabase
  market -.->|"fallback de leitura, sempre rotulado"| supabase
```

## Fluxo de deploy e variáveis de ambiente

Fonte editável versionada: [diagrams/deploy-e-envs.mmd](diagrams/deploy-e-envs.mmd). Tabelas normativas:
[§8.1 e §8.2 do plano](migracao-arquitetura.md#81-fluxo-de-deploy-por-deployable).

```mermaid
flowchart TB
  pr["PR aprovado e mergeado"]

  pr -->|"mudanca em web/** ou docs/contracts/**"| w1
  pr -->|"mudanca no repo bullcapital-ai"| a1

  subgraph web_pipe["Pipeline Web App - Vercel"]
    direction TB
    w1["1. prisma migrate deploy - usa DIRECT_URL, roda antes do app"]
    w2["2. next build + deploy"]
    w3["3. Vercel Cron ativo: /api/cron/quotes em pregao e /api/cron/eod 21:45 UTC"]
    w4["rollback: build anterior no Vercel; schema so avanca - migration corretiva, nunca reset"]
    w1 --> w2 --> w3
    w2 -. "falha" .-> w4
  end

  subgraph ai_pipe["Pipeline AI Service - repo bullcapital-ai"]
    direction TB
    a1["1. Alembic - schemas news/ai, quando existir"]
    a2["2. build Dockerfile + deploy - Railway como hipotese de trabalho"]
    a3["rollback: versao anterior compativel com o contrato SSE"]
    a1 --> a2
    a2 -. "falha" .-> a3
  end

  contract["Bump de contrato BFF-AI (SSE/envelope):\nversao nova, fixtures dos dois lados,\nprodutor emite campos opcionais ANTES\nde consumidor exigir obrigatorios"]
  web_pipe -.-> contract
  ai_pipe -.-> contract

  subgraph vercel_env["Env vars - Vercel (Web)"]
    direction TB
    ev1["DATABASE_URL - Neon pooled (runtime)"]
    ev2["DIRECT_URL - Neon direto (so migrations)"]
    ev3["NEXTAUTH_SECRET + NEXTAUTH_URL"]
    ev4["ANALYSIS_API_URL + API_SHARED_SECRET"]
    ev5["BRAPI_KEY (ingestao) + CRON_SECRET (protege /api/cron/*)"]
    ev6["F4+: UPSTASH_REDIS_REST_URL / TOKEN"]
    ev7["F4+: SUPABASE_TRANSACTION_POOLER (leitura fallback)\nSUPABASE_DIRECT_CONNECTION (job de sync)"]
  end

  subgraph ai_env["Env vars - host da IA"]
    direction TB
    ea1["DATABASE_URL - role escopada D9:\nwrite news/ai - read-only market/portfolio"]
    ea2["OPENAI_API_KEY / OPENROUTER_API_KEY / OPENROUTER_MODEL"]
    ea3["API_SHARED_SECRET - mesmo valor do web"]
    ea4["CORS_ORIGINS + DATABASE_SSL + LOG_LEVEL"]
    ea5["MARKET_SCHEDULERS_ENABLED=false apos handoff F3"]
  end

  web_pipe --- vercel_env
  ai_pipe --- ai_env

  neon[("Neon - banco real")]
  supabase[("Supabase - Snapshot DB")]
  upstash[("Upstash - Redis")]

  ev1 --> neon
  ev2 --> neon
  ea1 --> neon
  ev7 --> supabase
  ev6 --> upstash
  ev4 -. "server-to-server autenticado" .- ea3
```

Regras que o diagrama resume: cada deployable mantém exatamente um `.env.example` versionado que bate
com a tabela §8.2; nova env var só passa em PR se tabela e exemplo mudarem juntos; o Upstash nunca é
pré-requisito para servir snapshot; escrita no Supabase só pelo job de sync, nunca no caminho de request.

## Documentos normativos

- [Plano de migração](migracao-arquitetura.md) - destino, ordem de build e critérios de aceite.
- [Contrato BFF ↔ AI via SSE](contracts/bff-ai-sse.md) - transporte, eventos, timeout e falhas.
- [Envelope de provenance](contracts/data-envelope.md) - `source`, `ts`, `stale` e semântica de fallback.
- [ADRs](adrs/) - decisões arquiteturais que não devem ser simplificadas sem nova decisão registrada.

## Critério de fechamento

Marco D só fecha quando os critérios da seção
[0.1 do plano de migração](migracao-arquitetura.md#01-critérios-de-aceite-da-migração) estiverem verdes:
documento de arquitetura, fluxo de deploy, setup local e ADRs.
