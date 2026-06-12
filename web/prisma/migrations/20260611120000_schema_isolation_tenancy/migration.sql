-- F5 — schema isolation no Neon (plan §6.1, ADR 0007) + tenancy (workspace → assessor → cliente).
--
-- Três cenários cobertos:
--   1. Banco existente (dev/Neon): tabelas de auth em "public" e de mercado em "ai"
--      → ALTER TABLE ... SET SCHEMA (move sem copiar; dados e índices preservados).
--   2. Banco novo (CI, dev limpo): migrações anteriores criaram auth em "public",
--      "ai" não existe → move auth e cria as tabelas de mercado do zero.
--   3. Re-execução parcial: todos os passos são guardados por to_regclass/IF NOT EXISTS.
--
-- Os schemas "news" e "ai" pertencem ao AI Service (Alembic) e não são tocados aqui,
-- exceto pela SAÍDA das tabelas de mercado que o módulo market agora possui.

-- 1. Schemas de propriedade do web app
CREATE SCHEMA IF NOT EXISTS "auth";
CREATE SCHEMA IF NOT EXISTS "market";
CREATE SCHEMA IF NOT EXISTS "portfolio";

-- 2. Identity: public → auth (expand-contract; mesma forma, novo endereço)
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL AND to_regclass('auth.users') IS NULL THEN
    ALTER TABLE "public"."users" SET SCHEMA "auth";
  END IF;
  IF to_regclass('public.accounts') IS NOT NULL AND to_regclass('auth.accounts') IS NULL THEN
    ALTER TABLE "public"."accounts" SET SCHEMA "auth";
  END IF;
  IF to_regclass('public.sessions') IS NOT NULL AND to_regclass('auth.sessions') IS NULL THEN
    ALTER TABLE "public"."sessions" SET SCHEMA "auth";
  END IF;
  IF to_regclass('public.verification_tokens') IS NOT NULL AND to_regclass('auth.verification_tokens') IS NULL THEN
    ALTER TABLE "public"."verification_tokens" SET SCHEMA "auth";
  END IF;
END $$;

-- 3. Mercado: ai → market (tabelas herdadas da FastAPI; F5 transfere ownership ao Prisma)
DO $$
BEGIN
  IF to_regclass('ai.asset_quotes') IS NOT NULL AND to_regclass('market.asset_quotes') IS NULL THEN
    ALTER TABLE "ai"."asset_quotes" SET SCHEMA "market";
  END IF;
  IF to_regclass('ai.asset_historical_prices') IS NOT NULL AND to_regclass('market.asset_historical_prices') IS NULL THEN
    ALTER TABLE "ai"."asset_historical_prices" SET SCHEMA "market";
  END IF;
  IF to_regclass('ai.macro_indicators') IS NOT NULL AND to_regclass('market.macro_indicators') IS NULL THEN
    ALTER TABLE "ai"."macro_indicators" SET SCHEMA "market";
  END IF;
  IF to_regclass('ai.currency_quotes') IS NOT NULL AND to_regclass('market.currency_quotes') IS NULL THEN
    ALTER TABLE "ai"."currency_quotes" SET SCHEMA "market";
  END IF;
  IF to_regclass('ai.ingest_runs') IS NOT NULL AND to_regclass('market.ingest_runs') IS NULL THEN
    ALTER TABLE "ai"."ingest_runs" SET SCHEMA "market";
  END IF;
  IF to_regclass('ai.ingest_locks') IS NOT NULL AND to_regclass('market.ingest_locks') IS NULL THEN
    ALTER TABLE "ai"."ingest_locks" SET SCHEMA "market";
  END IF;
END $$;

-- 3b. Caminho de banco novo: cria o que não veio do move (no-op quando moveu)
CREATE TABLE IF NOT EXISTS "market"."asset_quotes" (
    "ticker" VARCHAR(20) NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "change_percent" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "market_cap" DOUBLE PRECISION,
    "high_52w" DOUBLE PRECISION,
    "low_52w" DOUBLE PRECISION,
    "pe_ratio" DOUBLE PRECISION,
    "dividend_yield" DOUBLE PRECISION,
    "ev_ebitda" DOUBLE PRECISION,
    "roe" DOUBLE PRECISION,
    "roic" DOUBLE PRECISION,
    "p_vp" DOUBLE PRECISION,
    "sector" TEXT,
    "industry" TEXT,
    "business_summary" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asset_quotes_pkey" PRIMARY KEY ("ticker")
);
CREATE INDEX IF NOT EXISTS "idx_asset_quotes_updated_at" ON "market"."asset_quotes"("updated_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_asset_quotes_change" ON "market"."asset_quotes"("change_percent");
CREATE INDEX IF NOT EXISTS "idx_asset_quotes_volume" ON "market"."asset_quotes"("volume");
CREATE INDEX IF NOT EXISTS "idx_asset_quotes_market_cap" ON "market"."asset_quotes"("market_cap");
CREATE INDEX IF NOT EXISTS "idx_asset_quotes_name" ON "market"."asset_quotes"("name");

CREATE TABLE IF NOT EXISTS "market"."asset_historical_prices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ticker" VARCHAR(20) NOT NULL,
    "date" DATE NOT NULL,
    "open" DOUBLE PRECISION,
    "high" DOUBLE PRECISION,
    "low" DOUBLE PRECISION,
    "close" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asset_historical_prices_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "uq_ticker_date" UNIQUE ("ticker", "date")
);
CREATE INDEX IF NOT EXISTS "idx_history_ticker_date" ON "market"."asset_historical_prices"("ticker", "date" DESC);

CREATE TABLE IF NOT EXISTS "market"."macro_indicators" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "series_id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "date" DATE NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "macro_indicators_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "uq_series_date" UNIQUE ("series_id", "date")
);
CREATE INDEX IF NOT EXISTS "idx_macro_name_date" ON "market"."macro_indicators"("name", "date" DESC);

CREATE TABLE IF NOT EXISTS "market"."currency_quotes" (
    "pair" VARCHAR(20) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "bid" DOUBLE PRECISION NOT NULL,
    "ask" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "currency_quotes_pkey" PRIMARY KEY ("pair")
);

CREATE TABLE IF NOT EXISTS "market"."ingest_runs" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "job" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "finished_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ok_count" INTEGER NOT NULL DEFAULT 0,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ingest_runs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ix_ingest_runs_job_finished" ON "market"."ingest_runs"("job", "finished_at" DESC);

CREATE TABLE IF NOT EXISTS "market"."ingest_locks" (
    "job" TEXT NOT NULL,
    "locked_until" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "ingest_locks_pkey" PRIMARY KEY ("job")
);

-- 3c. Upgrades herdados (tabelas legadas criadas pela SQLAlchemy sem defaults no banco)
ALTER TABLE IF EXISTS "market"."asset_historical_prices" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS "market"."macro_indicators" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE IF EXISTS "market"."macro_indicators" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Índices single-column da SQLAlchemy, redundantes com os compostos acima — fora do schema Prisma
DROP INDEX IF EXISTS "market"."ix_ai_asset_historical_prices_date";
DROP INDEX IF EXISTS "market"."ix_ai_asset_historical_prices_ticker";
DROP INDEX IF EXISTS "market"."ix_ai_macro_indicators_series_id";
DROP INDEX IF EXISTS "market"."ix_ai_macro_indicators_date";
DROP INDEX IF EXISTS "market"."ix_ai_macro_indicators_name";

-- 4. Tenancy
CREATE TYPE "auth"."WorkspaceRole" AS ENUM ('OWNER', 'ADVISOR');
CREATE TYPE "portfolio"."ClientStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

CREATE TABLE "auth"."workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth"."workspace_members" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "auth"."WorkspaceRole" NOT NULL DEFAULT 'ADVISOR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "portfolio"."clients" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "advisor_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" VARCHAR(11),
    "email" TEXT,
    "status" "portfolio"."ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "workspace_members_user_id_idx" ON "auth"."workspace_members"("user_id");
CREATE UNIQUE INDEX "workspace_members_workspace_id_user_id_key" ON "auth"."workspace_members"("workspace_id", "user_id");
CREATE INDEX "clients_workspace_id_idx" ON "portfolio"."clients"("workspace_id");
CREATE INDEX "clients_advisor_id_idx" ON "portfolio"."clients"("advisor_id");
CREATE UNIQUE INDEX "clients_workspace_id_cpf_key" ON "portfolio"."clients"("workspace_id", "cpf");

ALTER TABLE "auth"."workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "auth"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "auth"."workspace_members" ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "portfolio"."clients" ADD CONSTRAINT "clients_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "auth"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "portfolio"."clients" ADD CONSTRAINT "clients_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "auth"."workspace_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5. Backfill: usuários pré-tenancy ganham workspace próprio como OWNER
INSERT INTO "auth"."workspaces" ("id", "name", "created_at", "updated_at")
SELECT 'ws-' || u."id", COALESCE(u."name", split_part(u."email", '@', 1)), now(), now()
FROM "auth"."users" u
WHERE NOT EXISTS (SELECT 1 FROM "auth"."workspace_members" m WHERE m."user_id" = u."id");

INSERT INTO "auth"."workspace_members" ("id", "workspace_id", "user_id", "role", "created_at")
SELECT 'wsm-' || u."id", 'ws-' || u."id", u."id", 'OWNER', now()
FROM "auth"."users" u
WHERE NOT EXISTS (SELECT 1 FROM "auth"."workspace_members" m WHERE m."user_id" = u."id");
