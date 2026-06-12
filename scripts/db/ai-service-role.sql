-- D9 — role escopada do AI Service (ADR 0007: schema como contrato).
-- Grants: write em news/ai (donos: Alembic do repo bullcapital-ai) e
-- read-only em market/portfolio (donos: Prisma deste repo).
--
-- Rodar como a role administrativa do banco (owner no Neon):
--   psql "$DIRECT_URL" -v ai_service_password='<senha-forte>' -f scripts/db/ai-service-role.sql
--
-- Idempotente: re-executar apenas reaplica grants (a senha NÃO é alterada se a
-- role já existe — use ALTER ROLE ... PASSWORD para rotacionar).

-- Cria a role apenas se não existir (\gexec executa o SQL gerado pelo SELECT)
SELECT format('CREATE ROLE bull_ai_service LOGIN PASSWORD %L', :'ai_service_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bull_ai_service')
\gexec

-- Schemas do AI Service podem ainda não existir num banco recém-provisionado;
-- a criação aqui é só bootstrap — DDL interno é do Alembic (bullcapital-ai).
CREATE SCHEMA IF NOT EXISTS "news";
CREATE SCHEMA IF NOT EXISTS "ai";

-- Escrita total nos schemas próprios (CREATE inclusive, para o Alembic migrar)
GRANT USAGE, CREATE ON SCHEMA "news", "ai" TO bull_ai_service;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA "news", "ai" TO bull_ai_service;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "news", "ai" TO bull_ai_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA "news", "ai" GRANT ALL PRIVILEGES ON TABLES TO bull_ai_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA "news", "ai" GRANT ALL PRIVILEGES ON SEQUENCES TO bull_ai_service;

-- Leitura nos schemas do web app (tools do AI Service leem snapshot/mercado)
GRANT USAGE ON SCHEMA "market", "portfolio" TO bull_ai_service;
GRANT SELECT ON ALL TABLES IN SCHEMA "market", "portfolio" TO bull_ai_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA "market", "portfolio" GRANT SELECT ON TABLES TO bull_ai_service;

-- Nenhum grant em "auth" e "public": identidade/sessões ficam invisíveis à IA.
