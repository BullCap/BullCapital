# Contract: Environment Variables

**Feature**: `001-mvp-bootstrap`
**Type**: Configuration Interface
**Date**: 2026-05-20

---

## Web Service (`web/.env.local`)

### `NEXTAUTH_SECRET`
- **Required**: Yes (app will throw on startup without it)
- **Format**: Random string, minimum 32 characters
- **Example**: `openssl rand -base64 32`
- **How it's used**: Signs and verifies NextAuth JWT tokens. Changing this value invalidates all existing sessions.

### `NEXTAUTH_URL`
- **Required**: Yes for production; optional in dev (auto-detected)
- **Format**: Full URL including protocol and port, no trailing slash
- **Example**: `http://localhost:3000`
- **How it's used**: Used by NextAuth for callback URL construction and CSRF validation.

### `DATABASE_URL`
- **Required**: Yes
- **Format**: PostgreSQL connection string
- **Example**: `postgresql://bullcapital:bullcapital@localhost:5432/bullcapital`
- **How it's used**: Prisma database connection via `@prisma/adapter-pg`. Also used by docker-compose to configure the `db` service.

### `BRAPI_KEY`
- **Required**: Yes for production; app boots without it but market data calls return `null`
- **Format**: API key string from brapi.dev dashboard
- **Example**: `your-brapi-key-here`
- **How it's used**: Authenticated calls to Brapi Brazilian market data API in `web/src/lib/services/market.ts`. All 7 market service functions check for this key.

---

## API Service (`api/.env`)

### `DATABASE_URL`
- **Required**: Yes
- **Format**: Same PostgreSQL connection string as web service
- **Example**: `postgresql://bullcapital:bullcapital@localhost:5432/bullcapital`
- **How it's used**: SQLAlchemy async session for pgVector conversation persistence.

### `OPENAI_API_KEY`
- **Required**: Yes for AI features; FastAPI service starts but chat endpoints return errors without it
- **Format**: OpenAI API key starting with `sk-`
- **Example**: `sk-...`
- **How it's used**: The Agno `InvestmentAgent` uses gpt-4o for conversational responses.

### `CORS_ORIGINS`
- **Required**: Yes
- **Format**: Comma-separated list of allowed origins
- **Example**: `http://localhost:3000`
- **How it's used**: FastAPI CORSMiddleware `allow_origins` — must include the Next.js app origin to allow cross-origin requests from the browser.

---

## Docker Compose Service Variables

These are set in `docker-compose.yml` for the `db` service and consumed by both web and api services:

| Variable | Service | Value (local dev) |
|----------|---------|-------------------|
| `POSTGRES_USER` | db | `bullcapital` |
| `POSTGRES_PASSWORD` | db | `bullcapital` |
| `POSTGRES_DB` | db | `bullcapital` |
| `DATABASE_URL` | api | `postgresql://bullcapital:bullcapital@db:5432/bullcapital` |

**Note**: The `web` service connects to `localhost:5432` from the host machine. The `api` service (inside Docker network) connects to `db:5432` (service hostname). These are two different connection strings for the same database.
