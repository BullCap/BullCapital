# Data Model: MVP Project Bootstrap

**Feature**: `001-mvp-bootstrap`
**Date**: 2026-05-20

> Note: The bootstrap feature does not add new database entities — the Prisma schema (`web/prisma/schema.prisma`) already defines all auth entities and MUST NOT be modified. This document covers the **configuration schema** — the files and tokens that make up the project's structural data layer.

---

## Config Entity 1: Design Token Set

The canonical set of visual constants shared across all screens.

| Token Name     | Value                | Usage |
|----------------|---------------------|-------|
| `void`         | `#0D0B14`           | Deepest background (`bg-[var(--void)]`, `body`) |
| `surface`      | `#1A1625`           | Card backgrounds (`bg-[#1A1625]/40`) |
| `starlight`    | `#F4F0FF`           | Primary text, headings |
| `amethyst`     | `#8B5CF6`           | Accent, CTA, positive indicators |
| `amethyst-light` | `#A78BFA`         | Hover states, gradients |
| `rose`         | `#F43F5E`           | Negative indicators, alerts |
| `glass-rim`    | `rgba(255,255,255,0.10)` | Card borders |
| `glass-rim-strong` | `rgba(255,255,255,0.20)` | Focus states |
| `shadow-soft`  | `rgba(0,0,0,0.40)`  | Card drop shadows |
| `shadow-deep`  | `rgba(0,0,0,0.60)`  | Inset card shadows |
| `--radius`     | `1.5rem`            | shadcn base border radius |

**Defined in**: `web/src/app/globals.css` (CSS vars) + `web/tailwind.config.ts` (Tailwind tokens)

---

## Config Entity 2: Environment Variable Manifest

All runtime secrets and config values required by the application. See `contracts/env-vars.md` for full contract.

**Web service** (`web/.env.local`):

| Variable         | Required | Description |
|-----------------|----------|-------------|
| `NEXTAUTH_SECRET` | Yes     | Random string for JWT signing (min 32 chars) |
| `NEXTAUTH_URL`   | Yes      | Base URL of the app (`http://localhost:3000` for dev) |
| `DATABASE_URL`   | Yes      | PostgreSQL connection string |
| `BRAPI_KEY`      | Yes (prod) | Brapi API key for market data |

**API service** (`api/.env`):

| Variable         | Required | Description |
|-----------------|----------|-------------|
| `DATABASE_URL`   | Yes      | Same PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes      | OpenAI API key for the investment agent |
| `CORS_ORIGINS`   | Yes      | Comma-separated allowed origins (`http://localhost:3000`) |

---

## Config Entity 3: App Router Manifest

The route file structure that defines all navigable URLs in the Next.js App Router.

```
web/src/app/
├── layout.tsx              # Root layout — fonts, metadata, PWA manifest, lang="pt-BR"
├── page.tsx                # Landing page (/) — redirects authed users to /home
├── globals.css             # Design tokens + Tailwind directives
│
├── (auth)/                 # Auth route group — separate layout (centered, fullscreen)
│   ├── layout.tsx
│   ├── sign-in/
│   │   └── page.tsx        # /auth/sign-in
│   └── sign-up/
│       └── page.tsx        # /auth/sign-up
│
├── home/
│   └── page.tsx            # /home — market overview (protected)
│
├── asset/
│   └── [ticker]/
│       └── page.tsx        # /asset/[ticker] — asset detail (protected)
│
└── chat/
    └── page.tsx            # /chat — AI chat (protected)
```

---

## Config Entity 4: Package Dependency Manifest

All production dependencies and their pinned version ranges.

**Production** (`web/package.json` dependencies):

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | `^15.2.0` | App framework |
| `react` / `react-dom` | `^19.0.0` | UI library |
| `next-auth` | `5.0.0-beta.30` | Auth (exact pin — beta) |
| `@auth/prisma-adapter` | `^2.11.1` | NextAuth Prisma adapter |
| `@prisma/client` | `^7.4.2` | Database client |
| `@prisma/adapter-pg` | `^7.4.2` | Prisma pg adapter |
| `pg` | `^8.19.0` | PostgreSQL driver |
| `bcryptjs` | `^3.0.3` | Password hashing |
| `brapi` | `^1.0.1` | Brazilian market data |
| `recharts` | `^3.7.0` | Charts (price history) |
| `zod` | `^4.3.6` | Schema validation |
| `lucide-react` | `^0.576.0` | Icons |
| `motion` | `^12.35.0` | Animations |
| `clsx` | `^2.1.1` | Class merging |
| `tailwind-merge` | `^3.5.0` | Tailwind class dedup |
| `class-variance-authority` | `^0.7.1` | shadcn/ui CVA |
| `tailwindcss-animate` | `^1.0.7` | Animation plugin |
| All `@radix-ui/*` used by shadcn components | latest | Headless UI primitives |

**Dev** (`web/package.json` devDependencies):

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | `^5.7.0` | Type checking |
| `tailwindcss` | `^3.4.17` | CSS framework |
| `postcss` / `autoprefixer` | latest | CSS processing |
| `prisma` | `^7.4.2` | Migrations + schema |
| `vitest` | `^3.0.0` | Test runner |
| `@testing-library/react` | `^16.2.0` | Component testing |
| `@vitejs/plugin-react` | `^4.3.0` | Vitest React plugin |
| `jsdom` | `^26.0.0` | Browser env for tests |
| `prettier` | `^3.8.1` | Formatter |
| `prettier-plugin-tailwindcss` | `^0.7.2` | Class sorting |
| `tsx` | `^4.19.0` | Run TS scripts (seed) |
| `eslint-config-next` | `^15.2.0` | Linting |

---

## Existing Database Schema (Read-Only Reference)

The following entities are already defined in `web/prisma/schema.prisma` and MUST NOT be modified:

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| `User` | `id (cuid)`, `email (unique)`, `passwordHash?`, `name?` | Primary auth entity |
| `Account` | `userId`, `provider`, `providerAccountId` | OAuth provider links (unused for MVP, table exists) |
| `Session` | `sessionToken`, `userId`, `expires` | JWT sessions via NextAuth |
| `VerificationToken` | `identifier`, `token`, `expires` | Email verification (not used in MVP) |

Generator output: `../src/generated/prisma` (relative to `web/prisma/`).
