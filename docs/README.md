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

## Documentos normativos

- [Plano de migração](migracao-arquitetura.md) - destino, ordem de build e critérios de aceite.
- [Contrato BFF ↔ AI via SSE](contracts/bff-ai-sse.md) - transporte, eventos, timeout e falhas.
- [Envelope de provenance](contracts/data-envelope.md) - `source`, `ts`, `stale` e semântica de fallback.
- [ADRs](adrs/) - decisões arquiteturais que não devem ser simplificadas sem nova decisão registrada.

## Critério de fechamento

Marco D só fecha quando os critérios da seção
[0.1 do plano de migração](migracao-arquitetura.md#01-critérios-de-aceite-da-migração) estiverem verdes:
documento de arquitetura, fluxo de deploy, setup local e ADRs.
