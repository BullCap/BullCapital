// DDL of the market tables owned by the market module (F3). Mirrors the
// SQLAlchemy models the FastAPI used to create at startup; idempotent so the
// web app cold-starts independently of the AI Service repo. F5 moves this to
// Prisma migrations when the schema split (ai → market) happens.
// Shared by the module bootstrap (ingest-db.ts) and prisma/seed.ts.

export const MARKET_SCHEMA = 'ai' // becomes 'market' in F5

export const MARKET_DDL: string[] = [
  `CREATE SCHEMA IF NOT EXISTS ${MARKET_SCHEMA}`,
  `CREATE TABLE IF NOT EXISTS ${MARKET_SCHEMA}.asset_quotes (
     ticker varchar(20) PRIMARY KEY,
     name text NOT NULL,
     price double precision NOT NULL,
     change_percent double precision NOT NULL,
     volume double precision NOT NULL,
     market_cap double precision,
     high_52w double precision,
     low_52w double precision,
     pe_ratio double precision,
     dividend_yield double precision,
     ev_ebitda double precision,
     roe double precision,
     roic double precision,
     p_vp double precision,
     sector text,
     industry text,
     business_summary text,
     updated_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_asset_quotes_updated_at ON ${MARKET_SCHEMA}.asset_quotes (updated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_asset_quotes_change ON ${MARKET_SCHEMA}.asset_quotes (change_percent)`,
  `CREATE INDEX IF NOT EXISTS idx_asset_quotes_volume ON ${MARKET_SCHEMA}.asset_quotes (volume)`,
  `CREATE INDEX IF NOT EXISTS idx_asset_quotes_market_cap ON ${MARKET_SCHEMA}.asset_quotes (market_cap)`,
  `CREATE INDEX IF NOT EXISTS idx_asset_quotes_name ON ${MARKET_SCHEMA}.asset_quotes (name)`,
  `CREATE TABLE IF NOT EXISTS ${MARKET_SCHEMA}.asset_historical_prices (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     ticker varchar(20) NOT NULL,
     date date NOT NULL,
     open double precision,
     high double precision,
     low double precision,
     close double precision NOT NULL,
     volume double precision,
     created_at timestamptz NOT NULL DEFAULT now(),
     CONSTRAINT uq_ticker_date UNIQUE (ticker, date)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_history_ticker_date ON ${MARKET_SCHEMA}.asset_historical_prices (ticker, date DESC)`,
  // Legacy tables created by SQLAlchemy generated uuids client-side (no DB default).
  `ALTER TABLE IF EXISTS ${MARKET_SCHEMA}.asset_historical_prices ALTER COLUMN id SET DEFAULT gen_random_uuid()`,
  `CREATE TABLE IF NOT EXISTS ${MARKET_SCHEMA}.macro_indicators (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     series_id integer NOT NULL,
     name varchar(50) NOT NULL,
     date date NOT NULL,
     value double precision NOT NULL,
     created_at timestamptz NOT NULL DEFAULT now(),
     updated_at timestamptz DEFAULT now(),
     CONSTRAINT uq_series_date UNIQUE (series_id, date)
   )`,
  `ALTER TABLE IF EXISTS ${MARKET_SCHEMA}.macro_indicators ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now()`,
  `ALTER TABLE IF EXISTS ${MARKET_SCHEMA}.macro_indicators ALTER COLUMN id SET DEFAULT gen_random_uuid()`,
  `CREATE INDEX IF NOT EXISTS idx_macro_name_date ON ${MARKET_SCHEMA}.macro_indicators (name, date DESC)`,
  `CREATE TABLE IF NOT EXISTS ${MARKET_SCHEMA}.currency_quotes (
     pair varchar(20) PRIMARY KEY,
     name varchar(50) NOT NULL,
     bid double precision NOT NULL,
     ask double precision NOT NULL,
     high double precision NOT NULL,
     low double precision NOT NULL,
     updated_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS ${MARKET_SCHEMA}.ingest_runs (
     id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
     job text NOT NULL,
     source text NOT NULL,
     started_at timestamptz NOT NULL,
     finished_at timestamptz NOT NULL DEFAULT now(),
     ok_count integer NOT NULL DEFAULT 0,
     fail_count integer NOT NULL DEFAULT 0
   )`,
  `CREATE INDEX IF NOT EXISTS ix_ingest_runs_job_finished ON ${MARKET_SCHEMA}.ingest_runs (job, finished_at DESC)`,
  `CREATE TABLE IF NOT EXISTS ${MARKET_SCHEMA}.ingest_locks (
     job text PRIMARY KEY,
     locked_until timestamptz NOT NULL
   )`,
]
