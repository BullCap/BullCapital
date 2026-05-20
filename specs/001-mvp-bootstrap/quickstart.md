# Quickstart: BullCapital Development Environment

**Feature**: `001-mvp-bootstrap`
**Date**: 2026-05-20

---

## Prerequisites

- Node.js >= 20 (`node --version`)
- pnpm >= 9 (`npm install -g pnpm`)
- Docker Desktop with Compose v2 (`docker compose version`)
- Python 3.11+ (for the API service)

---

## 1. Clone and Install

```bash
git clone <repo-url>
cd BullCapital

# Install web dependencies
cd web && pnpm install && cd ..
```

---

## 2. Configure Environment

```bash
# Web service
cp web/.env.local.example web/.env.local
# Edit web/.env.local and fill in:
#   NEXTAUTH_SECRET=<run: openssl rand -base64 32>
#   NEXTAUTH_URL=http://localhost:3000
#   DATABASE_URL=postgresql://bullcapital:bullcapital@localhost:5432/bullcapital
#   BRAPI_KEY=<your key from brapi.dev — optional for dev>

# API service
cp api/.env.example api/.env
# Edit api/.env and fill in:
#   DATABASE_URL=postgresql://bullcapital:bullcapital@localhost:5432/bullcapital
#   OPENAI_API_KEY=<your OpenAI key>
#   CORS_ORIGINS=http://localhost:3000
```

---

## 3. Start the Database

```bash
# From project root
docker compose up -d db

# Verify it's running
docker compose ps
```

---

## 4. Run Database Migrations

```bash
cd web
pnpm prisma migrate dev
# Creates tables: users, accounts, sessions, verification_tokens
```

---

## 5. Start the Web App

```bash
cd web
pnpm dev
# → http://localhost:3000
```

---

## 6. Start the API Service (optional for bootstrap)

```bash
cd api
python -m venv .venv && source .venv/bin/activate  # or use uv
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
# → http://localhost:8001
# → http://localhost:8001/docs
```

---

## Common Commands

```bash
# Web
cd web
pnpm dev              # Dev server on :3000
pnpm build            # Production build (runs prisma generate first)
pnpm type-check       # TypeScript check (no emit)
pnpm lint             # ESLint
pnpm test             # Vitest
pnpm prisma studio    # DB browser on :5555
pnpm prisma migrate dev    # Apply new migrations
pnpm prisma db push        # Push schema without migration (dev only)

# Docker
docker compose up -d db    # Start database only
docker compose up -d       # Start all services
docker compose down        # Stop all services
docker compose down -v     # Stop and delete volumes (resets DB)
```

---

## Verify Everything Works

1. Navigate to `http://localhost:3000` — should render the BullCapital landing page with void dark background
2. Navigate to `http://localhost:3000/home` — should redirect to `/auth/sign-in`
3. Navigate to `http://localhost:3000/auth/sign-up` — sign up form should render
4. Create an account, sign in — should redirect to `/home`
5. Check terminal for no TypeScript errors

---

## Troubleshooting

**"DATABASE_URL must start with protocol `prisma://`..."**
→ You have the wrong Prisma version expecting Prisma Accelerate. Check that `prisma` and `@prisma/client` are both `^7.4.2`.

**"Cannot find module '@/generated/prisma'"**
→ Run `pnpm prisma generate` first (or `pnpm build` which runs it automatically).

**Market data returning null**
→ Normal without `BRAPI_KEY`. Set it in `.env.local` if needed.

**Docker `db` service not starting**
→ Port 5432 may be in use. Run `lsof -i :5432` and stop any local Postgres instance.
