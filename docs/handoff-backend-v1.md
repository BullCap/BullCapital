# Handoff — Backend V1 a partir da `develop` (2026-06-11)

> Documento de transferência para o próximo coding agent. Contexto completo do que foi
> feito na branch `feat/fundacao-tenancy` e TODO detalhado dos blocos restantes do
> escopo "factível já no backend (web app/BFF)".

## 0. Leia antes de qualquer coisa

1. [AGENTS.md](../AGENTS.md) §1 (TL;DR) — atenção ao banner: o roadmap §13 foi **substituído**;
   o produto é gestão de carteiras para assessores (pivô B2B).
2. [docs/migracao-arquitetura.md](migracao-arquitetura.md) — fonte da verdade da arquitetura.
   §6.1 (schemas), §8 (fases F0–F8), §12 (roadmap por marcos), decisões D1–D18.
3. ADRs em [docs/adrs/](adrs/) — em especial 0007 (banco unificado no Neon, schema como
   contrato) e 0008 (SSE direto com token curto emitido pelo BFF).
4. Contratos versionados: [contracts/data-envelope.md](contracts/data-envelope.md) e
   [contracts/bff-ai-sse.md](contracts/bff-ai-sse.md).

## 1. Estado do repositório

- **Branch canônica**: `develop` (criada 2026-06-11 do estado local aprovado).
- **Branch de trabalho atual**: `feat/fundacao-tenancy` (a partir da `develop`) — contém o
  bloco "Fundação" implementado e validado, **ainda não commitado** (o dono do repo commita
  quando quiser; commits convencionais pequenos).
- **Stash pendente**: `git stash list` mostra um WIP da branch `architecture-migration`
  ("docs/contratos + home UI") guardado antes da troca para `develop`. **Não dropar.**
- **`origin/architecture-migration` divergiu** da linha local (~24 commits locais vs ~10
  remotos com trabalho paralelo diferente). O dono do repo decide qual linha vence — não
  fazer merge/push forçado.
- AI Service vive em repo separado `bullcapital-ai` (clone lado a lado em `../bullcapital-ai`,
  sem remote). Alembic é dono dos schemas `news`/`ai`.

## 2. O que foi feito nesta sessão (bloco "Fundação") — PRONTO e validado

### 2.1 Schemas isolados no Neon (F5 do plano, lado web)

- [web/prisma/schema.prisma](../web/prisma/schema.prisma) virou multi-schema:
  `schemas = ["auth", "market", "portfolio", "public"]`.
  - `auth`: User/Account/Session/VerificationToken (movidos de `public`) + tenancy novo.
  - `market`: AssetQuote, AssetHistoricalPrice, MacroIndicator, CurrencyQuote, IngestRun,
    IngestLock — agora **modelados no Prisma**, que é o dono do DDL (antes era DDL manual
    em runtime via `schema-sql.ts`, que foi **apagado**).
  - `portfolio`: Client (âncora de tenancy; domínio completo entra via Spec Kit).
  - `public`: só `watchlist_items` (domínio definitivo — workspace-level — a decidir via Spec Kit).
- Migração [20260611120000_schema_isolation_tenancy](../web/prisma/migrations/20260611120000_schema_isolation_tenancy/migration.sql):
  - `ALTER TABLE ... SET SCHEMA` move `public.users` etc → `auth` e `ai.asset_quotes` etc →
    `market` **preservando dados e índices** (expand-contract; validado com 118 quotes +
    2776 históricos intactos no banco local).
  - Caminho de banco novo: `CREATE TABLE IF NOT EXISTS` espelhando o DDL legado (CI/dev limpo).
  - Guardas `to_regclass`/`IF NOT EXISTS` em tudo — re-execução parcial é segura.
  - Dropa índices single-column legados da SQLAlchemy (redundantes com os compostos).
  - Cria enums/tabelas de tenancy + **backfill**: todo usuário pré-existente ganha workspace
    próprio como OWNER (ids determinísticos `ws-<userId>` / `wsm-<userId>`).
- **Zero drift validado**: `prisma migrate diff --from-config-datasource --to-schema
  prisma/schema.prisma` → "No difference detected".

### 2.2 Tenancy: workspace → assessor → cliente

- Modelos: `Workspace` (auth) → `WorkspaceMember` (auth, role OWNER|ADVISOR, unique
  workspace+user) → `Client` (portfolio, FK p/ workspace e p/ member-assessor, `cpf`
  varchar(11) nullable com unique workspace+cpf — chave futura do FGC por CPF×instituição).
- **Resolução de escopo**: [web/src/modules/user/scope.ts](../web/src/modules/user/scope.ts)
  - `getScope()` (React `cache`, deduped por request): sessão NextAuth → membership →
    `WorkspaceScope { userId, workspaceId, memberId, role }`. Backfill lazy para usuários
    criados fora do signup (ex.: futuro OAuth adapter).
  - `requireScope()` lança `ScopeError` — usar em toda rota BFF/server action com dados.
  - Exportado pelo seam público [modules/user/index.ts](../web/src/modules/user/index.ts).
- **Signup** ([app/actions/auth.ts](../web/src/app/actions/auth.ts)): cria user + workspace +
  membership OWNER em um único create aninhado (atômico).
- **Data layer de clientes com escopo obrigatório**:
  [modules/portfolio/data/clients.ts](../web/src/modules/portfolio/data/clients.ts) —
  list/get/create/update/archive, todos recebem `WorkspaceScope`; `normalizeCpf` (11 dígitos).
  Exportado em [modules/portfolio/index.ts](../web/src/modules/portfolio/index.ts).
  **Padrão a seguir em todo o domínio portfolio: nenhuma query sem escopo resolvido.**

### 2.3 Módulo market sem bootstrap em runtime

- [ingest-db.ts](../web/src/modules/market/data/ingest-db.ts): removido `ensureIngestTables()`
  (migração é o único caminho de DDL agora); todas as referências `"ai".` → `"market".`;
  `ON CONFLICT ON CONSTRAINT <nome>` → `ON CONFLICT (colunas)` (robusto a constraint vs índice único).
- [reads.ts](../web/src/modules/market/data/reads.ts): `FROM "ai".` → `FROM "market".`.
- [prisma/seed.ts](../web/prisma/seed.ts): não roda mais DDL (exige `pnpm db:migrate` antes);
  cria workspace OWNER para o dev user com a mesma convenção de ids do backfill.

### 2.4 Roles escopadas (D9)

- [scripts/db/ai-service-role.sql](../scripts/db/ai-service-role.sql) — idempotente, roda com
  `psql "$DIRECT_URL" -v ai_service_password='<senha>' -f scripts/db/ai-service-role.sql`.
  Role `bull_ai_service`: write em `news`/`ai`, **read-only** em `market`/`portfolio`,
  **nenhum grant** em `auth`/`public`. Default privileges configurados para tabelas futuras.
- **Ainda não foi rodado em nenhum banco** (local roda como superuser; Neon pendente).

### 2.5 Pipeline de migração

- Já existia e foi mantido: `"build": "prisma generate && prisma migrate deploy && next build"`
  — migra **antes** do app no deploy da Vercel. `prisma.config.ts` usa `DIRECT_URL` (Neon
  direto, sem pooler) com fallback `DATABASE_URL`.

### 2.6 Validações executadas (todas passando)

```
npx prisma migrate deploy        # aplicou no Postgres local (docker compose db)
npx prisma migrate diff ...      # zero drift banco ↔ schema
npx tsc --noEmit                 # limpo
pnpm vitest run                  # 3 testes / 2 arquivos OK
pnpm db:seed                     # OK contra banco migrado
pnpm build                       # migrate deploy + next build OK
```

## 3. ⚠️ Coordenação obrigatória com o repo `bullcapital-ai`

A migração move as tabelas de mercado de `ai.*` para `market.*`. **As tools do AI Service
que leem `ai.asset_quotes`/`ai.macro_indicators`/etc quebram** quando a migração rodar no
banco compartilhado. Antes de aplicar no Neon:

1. Atualizar o repo `bullcapital-ai` (clone em `../bullcapital-ai`) para ler de `market.*`.
2. Rodar `scripts/db/ai-service-role.sql` no Neon e trocar a credencial do AI Service para
   `bull_ai_service` (descomissionando o acesso de owner — D9/F7b).
3. Só então deployar o web com a migração.
   No banco local de dev (docker), a migração já rodou — se for usar o AI Service local,
   atualize o clone lado a lado primeiro.

O desmembramento de `news_articles` (hoje em `ai`) para o schema `news` é do Alembic do
AI Service — **não** fazer pelo Prisma.

## 4. TODO detalhado — blocos restantes

### Bloco 2 — Núcleo determinístico (coração da V1, zero IA)

Recomendação: entrar **via Spec Kit** (`/speckit-git-feature 009-portfolio-deterministico` →
`/speckit-specify` → ...), como o plano de migração prevê. Tudo em `modules/portfolio/`,
todas as queries recebendo `WorkspaceScope`. Itens, em ordem de dependência:

1. **Parser do Excel padrão Bull** (A1)
   - Input: planilha padrão Bull (posições por cliente/instituição). Validação estrutural
     (colunas, tipos) + normalização (ticker, classe de ativo, emissor, CPF, datas,
     valores BRL) + relatório de erros linha a linha (o assessor corrige e re-importa).
   - Decidir lib de parse XLSX (ex.: `exceljs` ou `xlsx`) e onde roda (server action / route
     handler com limite de payload).
   - Persistir o import bruto + normalizado ligado a `Client` (CPF já normalizado existe).
2. **Snapshots versionados** (D10)
   - Cada import gera `snapshot_id` imutável; carteira corrente = snapshot mais recente.
   - Rotulagem de **staleness**: idade do snapshot exposta em toda leitura (crédito privado
     não tem feed — envelhece até re-import; padrão já existe no envelope do market,
     ver `QuoteEnvelope` em [reads.ts](../web/src/modules/market/data/reads.ts)).
3. **Consolidação multi-instituição** — visão por cliente agregando snapshots por
   instituição (posição consolidada, % por classe/emissor/instituição).
4. **FGC por CPF×instituição** (A2) — limite vigente **parametrizado** (tabela de config,
   não constante; R$ 250k/instituição e teto global atuais como default de demo).
   Saída: exposição coberta/descoberta por CPF×instituição.
5. **Política-alvo + delta** — CRUD da política do assessor (alocação-alvo por classe,
   por workspace ou por cliente) + cálculo de delta carteira vs política.
6. **Calendário de vencimentos** — extraído das posições de renda fixa do snapshot
   (CDB/LCI/LCA/CRI têm vencimento no Excel); agrupado por mês/cliente.
7. **Concentração por emissor/classe** — thresholds **configuráveis por workspace**
   (tabela de config com defaults conservadores como placeholder até os números da EQI).

### Bloco 3 — Contratos que destravam o paralelismo

Pouco código, alto valor — pode andar em paralelo ao Bloco 2:

1. **Schema versionado do payload determinístico** (o que o serviço de IA narra):
   novo arquivo em `docs/contracts/` (ex.: `deterministic-payload.md`) com JSON Schema +
   tipos TS em `modules/portfolio/types.ts`. Versionar como os contratos existentes
   (data-envelope/bff-ai-sse seguem o padrão — copiar a anatomia).
   ⚠️ O stash da `architecture-migration` contém edições não commitadas nos dois contratos
   existentes — conferir com o dono antes de tocar neles na develop.
2. **Envelope SSE com state machine** — já existe [contracts/bff-ai-sse.md](contracts/bff-ai-sse.md);
   revisar contra a lista do escopo (estados explícitos) e versionar mudanças.
3. **Endpoint do BFF que emite token curto** (ADR 0008): rota em `web/src/app/api/`
   (ex.: `api/ai/token`) que valida sessão via `requireScope()` e assina JWT curto
   (1–5 min, claims: workspaceId, memberId, conversationId) com segredo compartilhado
   (`API_SHARED_SECRET` já existe no docker-compose) para o cliente conectar **direto**
   no AI Service via SSE. Nenhuma dependência do serviço existir — mockar do outro lado.

### Bloco 4 — Operação

1. **approval_registry** — tabela (schema `portfolio` ou `auth`? decidir: é trilha de
   governança do workspace; sugestão: `portfolio.approval_registry`) com: id, workspaceId,
   memberId, alvo (tipo + id, ex.: snapshot/relatório), decisão (APPROVED|REJECTED),
   **hash do conteúdo aprovado**, motivo, timestamp. Endpoints simples no BFF
   (create + list por alvo). Valor desproporcional ao tamanho — priorizar.
2. **Trilha de auditoria web** — tabela `audit_log` (workspaceId, memberId, ação, alvo,
   metadata jsonb, timestamp) + helper `audit(scope, action, target, meta)` chamado nos
   pontos sensíveis: imports, acessos a cliente, aprovações.
3. **Cron de ingestão com locks no Upstash** (F4) — handlers já existem em
   `web/src/app/api/cron/{eod,quotes}` com lease em Postgres (`market.ingest_locks`).
   Migrar lock para Upstash (`SET NX EX`) + rate-limit + cache quente de quotes.
   Env vars `UPSTASH_REDIS_REST_URL/TOKEN` já previstas na §8.2 do plano. Resolver antes
   o open item §10.3 (plano Vercel/limites de cron).
4. **Export EOD para Blob** — ao fim do job EOD, serializar snapshot do dia (quotes+macro)
   para Vercel Blob (fallback tier-2 de leitura, ADR 0005).
5. **Brapi atrás de feature flag** até termos comerciais validados (BCB é público, sem
   ressalva) — flag por env var (ex.: `BRAPI_ENABLED`) checada nos handlers de ingest;
   com flag off, EOD grava apenas macro BCB e quotes ficam staleness-labeled.

### Pendências menores desta sessão

- [ ] Rodar `scripts/db/ai-service-role.sql` no Neon (depois da coordenação §3).
- [ ] Decidir destino de `watchlist_items` (hoje em `public`; provável: workspace-level).
- [ ] `docs/migracao-arquitetura.md` §12: marcar F5 (lado web) como feito quando esta branch
      mergear — **o dono edita os docs do plano; perguntar antes**.
- [ ] Commitar a branch (o dono pede o commit; convenção: commits convencionais pequenos,
      sem `git add -A`).

## 5. Comandos úteis

```bash
docker compose up -d db                  # Postgres local (precisa do daemon docker ativo)
cd web
pnpm db:migrate                          # prisma migrate dev
pnpm db:seed                             # exige migração aplicada (não roda mais DDL)
pnpm vitest run
npx tsc --noEmit
sh -c 'set -a; . ./.env.local; set +a; npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma'  # checar drift
```

Login dev: `dev@bullcapital.app` / `senha123456` (OWNER do próprio workspace).
