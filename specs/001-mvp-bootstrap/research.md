# Research: MVP Project Bootstrap

**Feature**: `001-mvp-bootstrap`
**Date**: 2026-05-20

---

## Decision 1: Tailwind CSS Version

**Decision**: Tailwind CSS v3 (`tailwindcss@^3.4.17`)
**Rationale**: Tailwind v4 uses a completely different configuration approach (no `tailwind.config.ts`, CSS-first config), which breaks shadcn/ui compatibility and the BC reference config. The BC project already uses v3 with the exact design tokens needed. The BullCapital `CLAUDE.md` spec explicitly references `tailwindcss-animate` which is a v3 plugin.
**Alternatives considered**: Tailwind v4 — rejected because shadcn/ui does not yet have stable v4 support and the BC reference was built on v3.

---

## Decision 2: Next.js Config Format

**Decision**: `next.config.ts` (TypeScript format)
**Rationale**: TypeScript config provides type safety for the config object. Next.js 15 supports `.ts` config files natively. No special setup needed beyond `tsconfig.json`.
**Alternatives considered**: `next.config.js` (CJS) or `next.config.mjs` — rejected in favor of TS for consistency with the fully TypeScript codebase.

---

## Decision 3: shadcn/ui Style

**Decision**: `new-york` style with `cssVariables: true`, base color `neutral`
**Rationale**: BC reference used `new-york` style which produces compact, refined components well-suited for the "Financial Reading Room" aesthetic. `neutral` as base color allows the BullCapital amethyst tokens to fully override defaults without fighting a warm or cool tint.
**Alternatives considered**: `default` style — rejected because it produces slightly larger components; `slate` base — rejected because it introduces a blue tint that conflicts with the void/amethyst palette.

---

## Decision 4: PWA Implementation

**Decision**: Static `manifest.json` in `web/public/` + `<link rel="manifest">` in `layout.tsx` metadata. No `next-pwa` package.
**Rationale**: For MVP, a PWA manifest alone (name, icons, theme color, display mode) satisfies the "installable PWA" requirement with zero package overhead. Service worker / offline support is out of MVP scope (constitution § VI: scope discipline). The manifest can be added in the `metadata.manifest` Next.js field in `layout.tsx`.
**Alternatives considered**: `next-pwa` package — rejected because it adds ~30KB to bundle and offline caching logic that is not needed for MVP.

---

## Decision 5: Database Connection Strategy

**Decision**: `@prisma/adapter-pg` + `Pool` from `pg` package. Connection string via `DATABASE_URL` env var. No SSL options for local dev.
**Rationale**: Prisma 7 requires the `@prisma/adapter-pg` pg adapter (not the legacy `@prisma/client` direct driver). The BC reference has a working implementation in `lib/db.ts` that can be ported with the Supabase-specific SSL logic removed (not needed for local Postgres 16 container).
**Alternatives considered**: Prisma with direct driver — rejected because Prisma 7 deprecated the direct pg driver pattern in favor of the adapter.

---

## Decision 6: Authentication Providers

**Decision**: Credentials (email + password with bcryptjs) only. Google OAuth removed.
**Rationale**: Constitution § VI explicitly forbids Google OAuth for MVP. The `auth.config.ts` edge config must remove the `Google()` provider. The `auth.ts` Node.js config must also remove it. Sign-in/sign-up pages move from `/sign-in` (BC) to `/auth/sign-in` (BullCapital CLAUDE.md spec).
**Alternatives considered**: Keep Google OAuth — rejected by constitution.

---

## Decision 7: Monorepo / Workspace Structure

**Decision**: `pnpm-workspace.yaml` at root with `packages: ["web"]`. No Turborepo.
**Rationale**: The CLAUDE.md explicitly says "No Turborepo" for this project. The BC reference used Turborepo (`turbo.json`) — that is not carried over. A minimal `pnpm-workspace.yaml` is sufficient to allow `cd web && pnpm install` to work cleanly while keeping root tooling (eslint, prettier) shared.
**Alternatives considered**: Turborepo — explicitly rejected by CLAUDE.md.

---

## Decision 8: Docker Compose Services

**Decision**: `docker-compose.yml` at root with two services: `db` (postgres:16-alpine, port 5432) and `api` (builds from `api/Dockerfile`, port 8001). No Redis, no pgBouncer, no Supabase.
**Rationale**: MVP needs exactly these two backing services. PostgreSQL 16-alpine is smaller than the full image. `api/Dockerfile` already exists in the skeleton. Both share one network.
**Alternatives considered**: Supabase local stack — explicitly rejected by CLAUDE.md ("Do not split into two databases", "not Supabase" implied by the plain Postgres directive).

---

## Decision 9: Route URL Structure

**Decision**: Auth routes at `/auth/sign-in` and `/auth/sign-up` (route group `(auth)` under `app/`). Protected dashboard at `/home`. Asset at `/asset/[ticker]`. Chat at `/chat`.
**Rationale**: Matches CLAUDE.md spec exactly. The BC reference used `/sign-in` and `/dashboard` — these differ from the new spec. The `(auth)` route group allows a separate layout for auth screens (centered, fullscreen, no bottom nav).
**Alternatives considered**: BC route structure (`/sign-in`, `/dashboard`) — rejected; new BullCapital spec defines the target routes.

---

## Decision 10: Middleware Protected Routes

**Decision**: Update `web/src/middleware.ts` to protect `/home`, `/asset/:path*`, `/chat` (the 3 post-auth MVP screens). Redirect unauthenticated users to `/auth/sign-in`.
**Rationale**: The existing middleware already has protection logic but points to `/dashboard` (old BC route). It must be updated to match the new route structure.
**Alternatives considered**: Per-page auth checks — rejected because middleware provides a single enforcement point that can't be bypassed by navigating directly.

---

## Decision 11: ESLint + Prettier Configuration

**Decision**: Port `eslint.config.js`, `.prettierrc`, and `prettier-plugin-tailwindcss` from BC reference.
**Rationale**: BC has a working `eslint-config-next` + TypeScript ESLint setup. Prettier with `prettier-plugin-tailwindcss` sorts Tailwind classes automatically. The root `commitlint.config.cjs` and `.editorconfig` already exist in BullCapital.
**Alternatives considered**: Biome — not in BC reference; skip and use BC config for consistency.

---

## Decision 12: Testing Framework

**Decision**: Vitest + `@testing-library/react` + jsdom. Config in `web/vitest.config.ts`.
**Rationale**: BC reference already uses Vitest. The existing pre-built atoms/services may have co-located tests in future. Vitest works natively with Next.js 15 via `@vitejs/plugin-react`.
**Alternatives considered**: Jest — rejected; Vitest is faster and already established in BC reference.
