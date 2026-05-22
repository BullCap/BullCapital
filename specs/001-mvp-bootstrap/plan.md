# Implementation Plan: MVP Project Bootstrap

**Branch**: `001-mvp-bootstrap` | **Date**: 2026-05-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-mvp-bootstrap/spec.md`

---

## Summary

Bootstrap the BullCapital Next.js web app from a source-files-only state to a fully runnable project. This involves writing `package.json`, all config files (Tailwind, shadcn, TypeScript, ESLint, Prettier, Next.js, Vitest), scaffolding the App Router directory with placeholder routes for all 4 MVP screens, adding docker-compose for local Postgres + FastAPI, porting design tokens from the BC reference, and updating the pre-built auth files to remove Google OAuth and fix route paths. No business logic is implemented in this feature — only infrastructure.

---

## Technical Context

**Language/Version**: TypeScript 5.7 (strict), Node.js >= 20

**Primary Dependencies**: Next.js 15, React 19, NextAuth v5 (beta.30), Tailwind CSS 3, shadcn/ui (new-york), Prisma 7 + @prisma/adapter-pg, bcryptjs, Zod, Recharts, Brapi SDK

**Storage**: PostgreSQL 16 (local Docker container), Prisma migrations

**Testing**: Vitest 3 + @testing-library/react + jsdom

**Target Platform**: Browser PWA (mobile-first, Chrome on Android primary target)

**Project Type**: Next.js 15 App Router web application + FastAPI Python backend

**Performance Goals**: First Contentful Paint < 1.5s on mobile (no SSR-heavy pages in bootstrap). Zero TS errors.

**Constraints**: Node >= 20, pnpm workspace, no Turborepo, no Supabase, no Google OAuth

**Scale/Scope**: 4 MVP screens, single Postgres database, one developer team

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|-----------|-------|--------|
| I. Ship First | Bootstrap unblocks all 4 screens — correct sequencing | PASS |
| II. Presentation Is the Moat | Design tokens ported, glassmorphism system wired in globals.css + tailwind.config.ts | PASS |
| III. AI Interprets Signals | FastAPI service added to docker-compose; contextual analysis route placeholder | PASS |
| IV. Portuguese Always | Root layout sets `lang="pt-BR"`; placeholder pages have no English UI text | PASS |
| V. Mobile-First | Root layout has no fixed header; meta viewport configured in Next.js metadata | PASS |
| VI. Scope Discipline | No portfolio ingestion, alerts, social features, settings, or generic conversation surface | PASS |
| No Google OAuth | Google provider removed from auth.config.ts and auth.ts | PASS |
| No Turborepo | pnpm-workspace.yaml only, no turbo.json | PASS |
| No Supabase | Plain postgres:16-alpine in docker-compose, no Supabase SDK | PASS |
| Keep existing files | market.ts, atoms, prisma schema — MUST NOT be rewritten | PASS |

**Re-check post-design**: All constitution gates pass. No violations.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-mvp-bootstrap/
├── plan.md              # This file
├── research.md          # Phase 0 — all decisions resolved
├── data-model.md        # Config entities, dependency manifest, route manifest
├── quickstart.md        # Developer setup guide
├── contracts/
│   └── env-vars.md      # Environment variable contract
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit-tasks)
```

### Source Code Layout

After this feature, the repository will look like:

```text
BullCapital/                          # Repo root
├── docker-compose.yml                # NEW: db + api services
├── pnpm-workspace.yaml               # NEW: workspace config
├── .nvmrc                            # NEW: Node 20
├── .editorconfig                     # EXISTS (unchanged)
├── .prettierrc                       # EXISTS (unchanged)
├── commitlint.config.cjs             # EXISTS (unchanged)
│
├── api/                              # EXISTS (FastAPI skeleton, unchanged)
│   ├── .env.example                  # UPDATED: add OPENAI_API_KEY + CORS_ORIGINS docs
│   └── Dockerfile                    # EXISTS (unchanged)
│
└── web/                              # PRIMARY WORK AREA
    ├── package.json                  # NEW: all deps
    ├── next.config.ts                # NEW
    ├── tailwind.config.ts            # NEW (ported from BC)
    ├── postcss.config.mjs            # NEW
    ├── tsconfig.json                 # NEW
    ├── components.json               # NEW (shadcn config)
    ├── vitest.config.ts              # NEW (ported from BC)
    ├── eslint.config.js              # NEW (ported from BC)
    ├── .env.local.example            # NEW
    │
    ├── prisma/
    │   └── schema.prisma             # EXISTS — MUST NOT MODIFY
    │
    ├── public/
    │   ├── manifest.json             # NEW: PWA manifest
    │   └── icons/                    # NEW: app icons (192x192, 512x512 placeholders)
    │
    └── src/
        ├── app/
        │   ├── layout.tsx            # NEW: root layout (fonts, metadata, lang=pt-BR)
        │   ├── page.tsx              # NEW: landing placeholder (redirects authed → /home)
        │   ├── globals.css           # NEW (ported from BC — design tokens)
        │   │
        │   ├── (auth)/
        │   │   ├── layout.tsx        # NEW: centered auth layout
        │   │   ├── sign-in/
        │   │   │   └── page.tsx      # NEW: placeholder for /auth/sign-in
        │   │   └── sign-up/
        │   │       └── page.tsx      # NEW: placeholder for /auth/sign-up
        │   │
        │   ├── home/
        │   │   └── page.tsx          # NEW: placeholder for /home (protected)
        │   │
        │   ├── asset/
        │   │   └── [ticker]/
        │   │       └── page.tsx      # NEW: placeholder for /asset/[ticker] (protected)
        │   │
        │   └── analysis/
        │       └── page.tsx          # NEW: placeholder for /analysis (protected contextual analysis)
        │
        ├── components/
        │   ├── atoms/                # EXISTS (unchanged: GlassHighlight, MarketTemperatureDial, VariationBadge)
        │   └── ui/                   # NEW: shadcn components (button, input, label, card, avatar, dropdown-menu, separator)
        │
        ├── lib/
        │   ├── auth.ts               # UPDATED: remove Google provider
        │   ├── auth.config.ts        # UPDATED: remove Google, fix signIn page to /auth/sign-in
        │   ├── db.ts                 # NEW: Prisma client with pg adapter (no Supabase SSL logic)
        │   ├── utils.ts              # EXISTS (unchanged)
        │   └── services/
        │       └── market.ts         # EXISTS (unchanged)
        │
        ├── middleware.ts             # UPDATED: protect /home, /asset/:path*, /analysis → redirect to /auth/sign-in
        └── types/
            └── market.ts             # EXISTS (unchanged)
```

**Structure Decision**: Standard Next.js App Router monolith under `web/`. Route groups `(auth)` for isolated auth layout. All pre-built files in `src/` remain at their existing paths; only config and new app files are added.

---

## Implementation Phases

### Phase A: Root & Web Configuration Files

Create the workspace and all config files. No business logic. This phase produces a compilable (but not yet navigable) project.

**Files to create/update**:
1. `docker-compose.yml` — postgres:16-alpine (port 5432) + api service (port 8001)
2. `pnpm-workspace.yaml` — `packages: ["web"]`
3. `.nvmrc` — `20`
4. `web/package.json` — full dependency manifest from `data-model.md`
5. `web/next.config.ts` — PWA manifest header, `@/` alias
6. `web/tailwind.config.ts` — BullCapital tokens, font vars, shadcn compatibility
7. `web/postcss.config.mjs` — tailwindcss + autoprefixer
8. `web/tsconfig.json` — strict, `@/` → `src/`, `moduleResolution: bundler`
9. `web/components.json` — shadcn new-york, cssVariables, neutral base
10. `web/vitest.config.ts` — @vitejs/plugin-react, jsdom, path aliases
11. `web/eslint.config.js` — eslint-config-next
12. `web/.env.local.example` — documented env vars
13. `api/.env.example` — update with all required vars

### Phase B: App Router Scaffold

Create the `globals.css`, root layout, and all route placeholder pages. This phase produces a navigable app with zero business logic.

**Files to create/update**:
1. `web/src/app/globals.css` — Tailwind directives + CSS vars (from BC, updated)
2. `web/src/app/layout.tsx` — Inter + Playfair fonts, PWA metadata, lang=pt-BR, void background
3. `web/src/app/page.tsx` — minimal landing placeholder (redirects authed users to /home)
4. `web/src/app/(auth)/layout.tsx` — centered fullscreen dark layout for auth screens
5. `web/src/app/(auth)/sign-in/page.tsx` — placeholder (renders title "Entrar")
6. `web/src/app/(auth)/sign-up/page.tsx` — placeholder (renders title "Criar conta")
7. `web/src/app/home/page.tsx` — placeholder (renders "Visão Geral" heading, protected)
8. `web/src/app/asset/[ticker]/page.tsx` — placeholder (renders ticker param, protected)
9. `web/src/app/analysis/page.tsx` — placeholder (renders "Análises", protected)

### Phase C: Auth + Lib Updates

Fix the pre-built auth files and add the Prisma db client.

**Files to update/create**:
1. `web/src/lib/auth.config.ts` — remove Google provider; change `signIn` page to `/auth/sign-in`; `error` page to `/auth/sign-in`
2. `web/src/lib/auth.ts` — remove Google provider, remove Google log events
3. `web/src/lib/db.ts` — new file: Prisma client + PrismaPg adapter, no Supabase SSL, pool max 10
4. `web/src/middleware.ts` — update protected routes to `/home`, `/asset/:path*`, `/analysis`; redirect to `/auth/sign-in`

### Phase D: shadcn/ui + PWA Assets

Install shadcn base components and add the PWA manifest.

**Actions**:
1. Install shadcn components: `button`, `input`, `label`, `card`, `avatar`, `dropdown-menu`, `separator`
2. Create `web/public/manifest.json` — PWA manifest (name: "BullCapital", short_name, theme_color: `#0D0B14`, background_color: `#0D0B14`, display: `standalone`, start_url: `/home`)
3. Create `web/public/icons/` with placeholder icon files (192x192, 512x512)

### Phase E: Verification

Confirm all success criteria from spec are met.

1. `pnpm install` completes without errors
2. `pnpm type-check` → zero TypeScript errors
3. `pnpm dev` starts on :3000
4. All 6 routes return HTTP 200 without crashing
5. `docker compose up -d db` + `pnpm prisma migrate dev` complete cleanly

---

## Complexity Tracking

No constitution violations. No complexity exceptions needed.
