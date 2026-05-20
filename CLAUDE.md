# BullCapital — Agent Knowledge Base

## What This Is

BullCapital is a Brazilian investment intelligence PWA (Progressive Web App). It combines real-time Brazilian market data with AI agents to make investing accessible to beginner retail investors — a market that grew from 1M to 5M+ individual investors on B3 between 2019 and 2023.

The product has been validated by finance professionals, bankers, investors, and CEOs in Brazil. The core insight: most Brazilian retail investors are undereducated about markets and underserved by existing platforms (XP, Rico, BTG) which optimize for transaction revenue, not investor understanding.

**The moat**: a calm, beautiful UI (not fintech-generic) + AI that explains market movements in plain Portuguese, contextually, like a knowledgeable friend.

---

## Architecture

```
Browser / Mobile (PWA)
    └── Next.js 15 (App Router, Server Components, PWA)
            ├── Auth: NextAuth v5 (email/password, JWT)
            ├── Market Data: Brapi SDK → Brazilian equities, indices, forex
            └── AI Chat: FastAPI (api/) ← calls here for agent responses
                    └── PostgreSQL + pgVector
                            ├── Users / sessions (Prisma)
                            └── Conversations + embeddings (SQLAlchemy async)
```

**Key decisions:**
- PWA over native app: zero app store friction, instant deploy, share via WhatsApp link, Android-dominant Brazilian market (Chrome PWA support is excellent)
- Single backend (FastAPI): Brapi market data calls moved here, one service, one database
- Next.js stays as BFF: handles auth, serves the PWA, calls FastAPI for AI
- No Turborepo: previous project had it, unnecessary overhead for solo/small team

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 15 + React 19 | App Router, Server Components, PWA support |
| Language | TypeScript 5.7 (strict) | Existing codebase, strong typing |
| Styling | Tailwind CSS + shadcn/ui | Utility-first, consistent with design system |
| Auth | NextAuth v5 | Already configured, JWT + Prisma adapter |
| ORM (web) | Prisma 7 + pg adapter | Auth schema already written |
| Backend | FastAPI (Python) | AI/agent work, async, Agno framework |
| ORM (api) | SQLAlchemy 2 async | pgVector support |
| Vectors | pgVector | Conversation history embeddings for RAG |
| AI | Agno + OpenAI gpt-4o | Agent orchestration framework |
| Market Data | Brapi SDK | Brazilian equities, indices, SELIC, IPCA, forex |
| Database | PostgreSQL 16 | Single instance for MVP |

---

## What Has Been Copied (Pre-Built)

These files already exist and work — do not rewrite them:

### `web/src/lib/services/market.ts`
Seven working Brapi integrations. Do not touch unless adding new endpoints.
- `getMarketRadarData(ticker)` — radar chart scores (Rentabilidade, Momentum, Liquidez, Valuation, Tendência)
- `getMarketListings(params)` — paginated asset listings with BDR workaround
- `getMultipleQuotes(tickers)` — batch quote fetch
- `getMarketIndicators()` — SELIC + IPCA (24h cache)
- `searchAssets(query)` — ticker/name search
- `getMarketStatus()` — IBOVESPA, S&P 500, VIX, VXBR (with Yahoo Finance fallback)
- `getAssetHistory(tickers, range)` — historical price data, tiered caching

### `web/src/types/market.ts`
All TypeScript types for market data. Import from here, don't redefine.

### `web/src/components/atoms/MarketTemperatureDial.tsx`
SVG gauge component. Props: `{ value: number (0-100), stateName: string }`. Pure component, no dependencies. This is a key visual differentiator.

### `web/src/components/atoms/VariationBadge.tsx`
Price change badge. Shows green/red with percentage. Use everywhere for asset changes.

### `web/src/components/atoms/GlassHighlight.tsx`
Glass surface shimmer effect used on card tops. Props: `{ widthPercent, className }`. Apply to every card/panel.

### `web/src/lib/auth.ts` + `auth.config.ts`
NextAuth v5 configured with Credentials (email/password + bcrypt) and JWT strategy. Do not change providers for MVP — no Google OAuth needed yet.

### `web/src/middleware.ts`
Route protection. Currently protects `/dashboard`, `/settings`, `/portfolio`. Update protected routes list as new screens are added.

### `web/prisma/schema.prisma`
User + Account + Session schema for NextAuth. Do not modify.

### `api/`
FastAPI skeleton with:
- `app/agent/base.py` — AbstractBaseAgent class
- `app/agent/investment.py` — InvestmentAgent with Agno, gpt-4o, lazy init
- `app/models/conversation.py` — Conversation + Message with pgVector embeddings
- `app/core/config.py` — Pydantic settings
- `app/core/database.py` — SQLAlchemy async session

**These routes need actual implementation (currently placeholders):**
- `api/app/api/routes/chat.py` — POST /api/v1/chat
- `api/app/api/routes/analysis.py` — POST/GET /api/v1/analysis
- `api/app/api/routes/health.py` — add real DB connectivity check

---

## MVP Scope — What to Build

**4 screens, no more for v1:**

### 1. Onboarding / Auth (`/` and `/auth`)
- Landing: app name, one-line value proposition in Portuguese, sign up CTA
- Sign up: email + password only
- Sign in: email + password only
- No OAuth, no social login, no password recovery for MVP

### 2. Home / Market Overview (`/home`)
- Market temperature dial (already built: `MarketTemperatureDial`)
- Top movers (gainers/losers) using `getMultipleQuotes`
- IBOVESPA, S&P 500 index status using `getMarketStatus`
- SELIC rate indicator using `getMarketIndicators`
- Entry point to chat

### 3. Asset Detail (`/asset/[ticker]`)
- Price + change badge (`VariationBadge`)
- Simple price chart (1d/1mo/1y range)
- Radar chart (Rentabilidade, Momentum, Liquidez, Valuation, Tendência)
- "Explain this asset" button → opens AI chat in context of this asset

### 4. AI Chat (`/chat`)
- Conversational interface in Portuguese
- Context-aware: can be opened from an asset detail
- Backed by FastAPI `/api/v1/chat` endpoint (implement this)
- Message history persisted to pgVector for context
- Streaming responses

**Explicitly OUT of MVP:**
- Portfolio tracking
- Watchlists
- Price alerts / push notifications
- Settings screen
- Social / sharing features
- Screeners / filters
- CSV export
- Professional tools / advanced analysis

---

## Design System

Full reference in `system-design.md`. Summary for agents:

**Philosophy**: "The Financial Reading Room" — calm, contextual, serious but approachable. NOT a trading terminal. NOT aggressive colors. Like a well-designed notebook for someone who cares about their financial future.

**Color tokens** (use these, not arbitrary hex values):
- `#0D0B14` — Void (deepest background)
- `#1A1625` — Surface (card backgrounds)
- `#F4F0FF` — Starlight (primary text)
- `#8B5CF6` — Amethyst (accent, highlights, positive)
- `#F43F5E` — Rose (negative, alerts)
- `rgba(255,255,255,0.05-0.15)` — Glass layers

**Typography**:
- Playfair Display (serif) — headings, card titles, emphasis
- Inter (sans-serif) — body, labels, numbers

**Component anatomy**:
- Cards: `rounded-[2.5rem]`, `border border-white/10`, `bg-[#1A1625]/40`, `backdrop-blur-2xl`, `shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)...]`
- Always apply `GlassHighlight` at top of cards
- Glows: `absolute` div with `bg-[#8B5CF6]/15 blur-[100px]` behind content
- Buttons: ghost style, `rounded-xl`, subtle hover states

**Hard rules** (never break these):
1. No flat design — every surface has depth (shadow, blur, highlight)
2. No bright or aggressive colors outside the palette
3. All corners rounded — minimum `rounded-xl`, cards `rounded-[2.5rem]`
4. Glassmorphism on every card — `backdrop-blur`, `bg-.../40`, `border-white/10`
5. Portuguese for all user-facing text
6. No skeleton loaders — use Suspense with graceful empty states

---

## Brazilian Market Context

- Target user: 25-40yo, discovered investing post-2020, uses Nubank/Inter, mobile-first
- Language: all UI copy in Brazilian Portuguese (pt-BR)
- Currency: BRL, format with `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`
- Key indices: IBOVESPA (^BVSP), SELIC rate, IPCA inflation
- Market hours: B3 opens 10:00-17:00 BRT (UTC-3)
- Brapi API key required: set `BRAPI_KEY` in environment

---

## Environment Variables

```bash
# web/.env.local
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://...
BRAPI_KEY=

# api/.env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=
CORS_ORIGINS=http://localhost:3000
```

---

## Commands

```bash
# Web
cd web && pnpm install
pnpm dev                          # localhost:3000
pnpm prisma migrate dev           # run DB migrations

# API
cd api
python -m uvicorn app.main:app --reload --port 8001

# Database
# Single PostgreSQL instance for MVP
# Run Alembic migrations: alembic upgrade head (needs alembic/ dir — not yet created)
```

---

## What Not to Do

- Do not add Google OAuth or social login — out of scope for MVP
- Do not split into two databases — one Postgres for everything in MVP
- Do not add Turborepo or complex monorepo tooling
- Do not rewrite `market.ts` — it works, use it
- Do not add portfolio tracking, watchlists, or alerts — not in MVP
- Do not use English in user-facing text — everything is pt-BR
- Do not use flat UI patterns — always apply the glassmorphism system
- Do not add Swagger/API docs pages — not for MVP
- Do not implement Google OAuth — credentials only for now
- Do not over-engineer the AI — one conversational endpoint is enough for MVP
