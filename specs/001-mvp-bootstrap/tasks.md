# Tasks: MVP Project Bootstrap

**Input**: Design documents from `specs/001-mvp-bootstrap/`

**Branch**: `001-mvp-bootstrap`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks grouped by user story for independent, incremental delivery.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable (different files, no incomplete dependencies)
- **[Story]**: User story label (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Workspace root config that makes the monorepo structure valid.

- [x] T001 [P] Create `pnpm-workspace.yaml` at repo root with content `packages:\n  - "web"`
- [x] T002 [P] Create `.nvmrc` at repo root with content `20`

**Checkpoint**: Workspace structure declared. `pnpm install` inside `web/` will resolve correctly.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Web project config files AND auth/db lib files that everything depends on at compile time. All must be complete before any App Router page can type-check cleanly.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete. T003 must finish and `pnpm install` must run before T004–T014 can proceed.

- [x] T003 Create `web/package.json` with all production and dev dependencies per `specs/001-mvp-bootstrap/data-model.md` §Package Dependency Manifest — production: `next@^15.2.0`, `react@^19.0.0`, `react-dom@^19.0.0`, `next-auth@5.0.0-beta.30`, `@auth/prisma-adapter@^2.11.1`, `@prisma/client@^7.4.2`, `@prisma/adapter-pg@^7.4.2`, `pg@^8.19.0`, `bcryptjs@^3.0.3`, `brapi@^1.0.1`, `recharts@^3.7.0`, `zod@^4.3.6`, `lucide-react@^0.576.0`, `motion@^12.35.0`, `clsx@^2.1.1`, `tailwind-merge@^3.5.0`, `class-variance-authority@^0.7.1`, `tailwindcss-animate@^1.0.7`, `@radix-ui/react-slot@^1.2.4`, `@radix-ui/react-label@^2.1.4`, `@radix-ui/react-avatar@^1.1.11`, `@radix-ui/react-dropdown-menu@^2.1.16`, `@radix-ui/react-separator@^1.1.4`; devDeps: `typescript@^5.7.0`, `tailwindcss@^3.4.17`, `postcss@^8.5.0`, `autoprefixer@^10.4.20`, `prisma@^7.4.2`, `vitest@^3.0.0`, `@testing-library/react@^16.2.0`, `@testing-library/jest-dom@^6.9.1`, `@vitejs/plugin-react@^4.3.0`, `jsdom@^26.0.0`, `prettier@^3.8.1`, `prettier-plugin-tailwindcss@^0.7.2`, `tsx@^4.19.0`, `eslint-config-next@^15.2.0`, `@types/node@^22.0.0`, `@types/react@^19.0.0`, `@types/react-dom@^19.0.0`, `@types/pg@^8.16.0`, `@types/bcryptjs@^2.4.6`; add `"engines": { "node": ">=20" }`; add `scripts`: `dev: "next dev"`, `build: "prisma generate && next build"`, `start: "next start"`, `lint: "next lint"`, `test: "vitest"`, `type-check: "tsc --noEmit"`, `db:generate: "prisma generate"`, `db:migrate: "prisma migrate dev"`, `db:push: "prisma db push"`, `db:studio: "prisma studio"`, `db:seed: "tsx prisma/seed.ts"`; set `name: "web"`, `version: "0.0.0"`, `private: true`
- [x] T004 [P] Create `web/tsconfig.json` with `compilerOptions`: `target: "ES2017"`, `lib: ["dom","dom.iterable","esnext"]`, `allowJs: true`, `skipLibCheck: true`, `strict: true`, `noEmit: true`, `esModuleInterop: true`, `module: "esnext"`, `moduleResolution: "bundler"`, `resolveJsonModule: true`, `isolatedModules: true`, `jsx: "preserve"`, `incremental: true`, `plugins: [{ "name": "next" }]`, `paths: { "@/*": ["./src/*"] }`; `include: ["next-env.d.ts","**/*.ts","**/*.tsx",".next/types/**/*.ts"]`; `exclude: ["node_modules"]`
- [x] T005 [P] Create `web/postcss.config.mjs` exporting `{ plugins: { tailwindcss: {}, autoprefixer: {} } }`
- [x] T006 [P] Create `web/eslint.config.js` as a flat config extending `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript` — port structure from `BC/web/eslint.config.mjs`
- [x] T007 [P] Create `web/vitest.config.ts` with `defineConfig`: plugin `@vitejs/plugin-react`, `test: { environment: "jsdom", globals: true, setupFiles: ["src/test/setup.ts"] }`, `resolve: { alias: { "@": path.resolve(__dirname, "src") } }`
- [x] T008 [P] Create `web/src/test/setup.ts` with a single line: `import '@testing-library/jest-dom'` — required by T007's `setupFiles` reference
- [x] T009 [P] Create `web/.env.local.example` documenting all 4 web env vars per `specs/001-mvp-bootstrap/contracts/env-vars.md`: `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`), `NEXTAUTH_URL=http://localhost:3000`, `DATABASE_URL=postgresql://bullcapital:bullcapital@localhost:5432/bullcapital`, `BRAPI_KEY=` (optional for dev)
- [x] T010 [P] Update `api/.env.example` to document all 3 API env vars: `DATABASE_URL=postgresql+asyncpg://bullcapital:bullcapital@localhost:5432/bullcapital` (note asyncpg driver format required by SQLAlchemy async), `OPENAI_API_KEY=`, `CORS_ORIGINS=http://localhost:3000`
- [x] T011 Create `web/src/lib/db.ts` — Prisma client singleton with pg adapter: `import { PrismaPg } from '@prisma/adapter-pg'`; `import { Pool } from 'pg'`; `import { PrismaClient } from '@/generated/prisma'`; create `Pool` with `connectionString: process.env.DATABASE_URL, max: 10` (no SSL options — local dev); create `PrismaPg` adapter from pool; export `prisma` singleton via `globalThis.__prisma` guard pattern: `const globalForPrisma = global as unknown as { prisma: PrismaClient }; export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter }); if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma`
- [x] T012 [P] Update `web/src/lib/auth.config.ts` — remove `Google` import and `Google({})` provider; keep only `Credentials` provider with email/password credential fields and no `authorize` callback (authorize lives in auth.ts only); change `pages.signIn` from `'/sign-in'` to `'/auth/sign-in'`; change `pages.error` from `'/sign-in'` to `'/auth/sign-in'`; keep `satisfies NextAuthConfig` typing
- [x] T013 Update `web/src/lib/auth.ts` — remove `Google` import and the `Google({ allowDangerousEmailAccountLinking: true })` entry from providers array; change `prisma` import source from `'@/lib/db'` (using the new db.ts from T011 — same path, but confirm it matches); remove the `googleSignIn`-related `linkAccount` log and the `linkAccount` event entry; keep `PrismaAdapter`, `Credentials`, bcrypt `compare`, `jwt` callback, `session` callback, and remaining events (`signIn`, `signOut`, `createUser`); depends on T011 being complete
- [x] T014 Rewrite `web/src/middleware.ts` — replace entire file content: keep `import NextAuth from 'next-auth'` and `import authConfig from '@/lib/auth.config'`; keep `const { auth } = NextAuth(authConfig)`; update route arrays: `protectedRoutes = ['/home', '/asset', '/chat']`; `authRoutes = ['/auth/sign-in', '/auth/sign-up']`; `publicApiRoutes = ['/api/auth']` (remove `'/'` — this was making every path public); fix redirect targets: authenticated users on auth pages redirect to `'/home'` (not `'/dashboard'`); unauthenticated users on protected routes redirect to `'/auth/sign-in'` (not `'/sign-in'`); keep the `matcher` export unchanged

**Checkpoint**: Phase 2 complete — run `pnpm install` from `web/`, then `pnpm type-check`. The pre-built files (`market.ts`, atoms, `auth.ts`, `auth.config.ts`, `middleware.ts`) must all compile with zero errors before proceeding.

---

## Phase 3: User Story 1 — Developer Can Run the Web App Locally (Priority: P1) 🎯 MVP

**Goal**: After this phase, `pnpm dev` starts on :3000, all 6 routes return 200 and render, `pnpm type-check` passes.

**Independent Test**: From `web/`, run `pnpm dev`. Navigate to `localhost:3000` — void (`#0D0B14`) background renders. Hit all 6 routes directly — each returns 200 without crashing. Run `pnpm type-check` — zero errors. Note: `/home`, `/asset/PETR4`, `/chat` will redirect to `/auth/sign-in` (middleware is active), which is correct behaviour.

### Implementation

- [x] T015 [US1] Create `web/tailwind.config.ts` — `darkMode: ['class']`; `content` covering `./src/pages/**`, `./src/components/**`, `./src/app/**` (all `{js,ts,jsx,tsx,mdx}`); `theme.extend.colors`: `void: '#0D0B14'`, `surface: '#1A1625'`, `starlight: '#F4F0FF'`, `amethyst: { DEFAULT: '#8B5CF6', light: '#A78BFA', dim: '#7C3AED' }`, plus full shadcn token map (`background`, `foreground`, `card`, `card-foreground`, `primary`, `primary-foreground`, `secondary`, `muted`, `muted-foreground`, `accent`, `destructive`, `border`, `input`, `ring` — all pointing to `hsl(var(--TOKEN))`); `theme.extend.borderRadius`: `lg: 'var(--radius)'`, `md: 'calc(var(--radius) - 2px)'`, `sm: 'calc(var(--radius) - 4px)'`; `theme.extend.fontFamily`: `serif: ['Playfair Display', 'Georgia', 'serif']`, `sans: ['Inter', 'system-ui', 'sans-serif']`; `plugins: [require('tailwindcss-animate')]`
- [x] T016 [P] [US1] Create `web/src/app/globals.css` — `@tailwind base/components/utilities`; `@layer base { :root { --background: 260 30% 6%; --foreground: 260 100% 97%; --card: 260 24% 13%; --card-foreground: 260 100% 97%; --popover: 260 24% 10%; --popover-foreground: 260 100% 97%; --primary: 263 90% 66%; --primary-foreground: 0 0% 100%; --secondary: 260 24% 13%; --secondary-foreground: 260 100% 97%; --muted: 260 20% 18%; --muted-foreground: 260 10% 55%; --accent: 263 90% 66%; --accent-foreground: 0 0% 100%; --destructive: 0 60% 50%; --destructive-foreground: 0 0% 98%; --border: 0 0% 100% / 0.1; --input: 0 0% 100% / 0.1; --ring: 263 90% 66%; --radius: 1.5rem; --void: #0D0B14; --surface: #1a1625; --starlight: #f4f0ff; --amethyst: #8b5cf6; --glass-rim: rgba(255,255,255,0.1); --glass-rim-strong: rgba(255,255,255,0.2); --shadow-soft: rgba(0,0,0,0.4); --shadow-deep: rgba(0,0,0,0.6); } * { @apply border-border; } body { @apply bg-[var(--void)] text-[var(--starlight)]; font-family: 'Inter', system-ui, sans-serif; } }`; `@layer utilities { .glow-amethyst { box-shadow: 0 0 20px rgba(139,92,246,0.3), 0 0 40px rgba(139,92,246,0.1); } .text-gradient-amethyst { background: linear-gradient(135deg,#8b5cf6,#a78bfa,#c4b5fd); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; } }`
- [x] T017 [US1] Create `web/next.config.ts` — export default `NextConfig` object with `experimental: {}` (empty, no flags needed for Next.js 15 base); the `@/` alias is already handled by tsconfig so no webpack alias needed; add `async headers()` returning a rule for `source: '/'` that adds `Link: </manifest.json>; rel=manifest` header for PWA discovery
- [x] T018 [US1] Create `web/src/app/layout.tsx` — async server component; import `Inter` and `Playfair_Display` from `next/font/google` with `subsets: ['latin']` and `variable` props `--font-inter` / `--font-playfair`; export `metadata: Metadata` = `{ title: 'BullCapital', description: 'Inteligência de investimentos para o investidor brasileiro', manifest: '/manifest.json', themeColor: '#0D0B14' }`; export default async function `RootLayout` rendering `<html lang="pt-BR" className="dark"><body className={\`\${inter.variable} \${playfair.variable} \${inter.className}\`}>{children}</body></html>`; import `'./globals.css'`; no `<Header>` or nav component in root layout — depends on T015 and T016
- [x] T019 [P] [US1] Create `web/src/app/page.tsx` — async server component; import `{ auth }` from `@/lib/auth` and `{ redirect }` from `next/navigation`; call `const session = await auth()`; if `session` redirect to `'/home'`; otherwise render a minimal dark landing with `className="min-h-screen bg-[#0D0B14] flex flex-col items-center justify-center gap-8"`, app name "BullCapital" in `font-serif text-4xl font-bold text-[#F4F0FF]`, tagline "Inteligência de investimentos para o investidor brasileiro" in `text-[#F4F0FF]/60`, and a link to `/auth/sign-in` styled as a ghost button
- [x] T020 [P] [US1] Create `web/src/app/auth/layout.tsx` — server component rendering `<div className="min-h-screen bg-[#0D0B14] flex items-center justify-center px-4">{children}</div>`; this is a real `auth/` directory (NOT a route group) so pages under it will have URL prefix `/auth/`
- [x] T021 [P] [US1] Create `web/src/app/auth/sign-in/page.tsx` — minimal placeholder server component; render a glass card (`rounded-[2.5rem] border border-white/10 bg-[#1A1625]/40 backdrop-blur-2xl p-8 w-full max-w-sm`) with heading "Entrar" in `font-serif font-bold text-[#F4F0FF]` and a subtext "Acesse sua conta" — no form logic yet; link to `/auth/sign-up`
- [x] T022 [P] [US1] Create `web/src/app/auth/sign-up/page.tsx` — same glass card pattern as T021 with heading "Criar conta" and subtext "Comece a investir com inteligência" — no form logic yet; link to `/auth/sign-in`
- [x] T023 [P] [US1] Create `web/src/app/home/page.tsx` — async server component; import `{ auth }` and `{ redirect }`; `const session = await auth(); if (!session) redirect('/auth/sign-in')`; render placeholder with void background, heading "Visão Geral" in `font-serif`, and subtext "Mercado em {new Date().toLocaleDateString('pt-BR')}"
- [x] T024 [P] [US1] Create `web/src/app/asset/[ticker]/page.tsx` — async server component receiving `{ params }: { params: Promise<{ ticker: string }> }`; await params; auth guard redirecting to `/auth/sign-in`; render placeholder with heading showing `ticker.toUpperCase()` and subtext "Detalhes do ativo"
- [x] T025 [P] [US1] Create `web/src/app/chat/page.tsx` — async server component; auth guard redirecting to `/auth/sign-in`; render placeholder with heading "Chat com IA" and subtext "Pergunte sobre o mercado"
- [x] T026 [US1] Run `pnpm install` from `web/` directory to materialize `node_modules/` and `pnpm-lock.yaml`; then run `pnpm type-check` — fix any TypeScript errors before proceeding; the pre-built files (`src/lib/services/market.ts`, `src/components/atoms/`, `src/types/market.ts`) must compile cleanly with the new deps; the updated `auth.ts`, `auth.config.ts`, `middleware.ts`, and `db.ts` must also be error-free

**Checkpoint**: US1 complete — `pnpm dev` starts on :3000, all 6 routes return 200 (protected ones redirect to `/auth/sign-in`), zero TypeScript errors.

---

## Phase 4: User Story 2 — Developer Can Connect to Local PostgreSQL (Priority: P2)

**Goal**: After this phase, `docker compose up -d db` starts Postgres 16, `pnpm prisma migrate dev` applies all 4 NextAuth tables, and the full sign-up → sign-in → `/home` flow works end-to-end.

**Independent Test**: `docker compose up -d db` from repo root → healthy. `pnpm prisma migrate dev` from `web/` → 4 tables created. `pnpm dev` → navigate to `/auth/sign-up`, create account, sign in, land on `/home`.

### Implementation

- [x] T027 [US2] Create `docker-compose.yml` at repo root with: service `db` — image `postgres:16-alpine`, restart `unless-stopped`, ports `"5432:5432"`, environment `POSTGRES_USER: bullcapital / POSTGRES_PASSWORD: bullcapital / POSTGRES_DB: bullcapital`, volume `postgres_data:/var/lib/postgresql/data`, healthcheck `test: ["CMD-SHELL","pg_isready -U bullcapital"] interval: 10s timeout: 5s retries: 5`; service `api` — build `context: ./api`, restart `unless-stopped`, ports `"8001:8001`, environment `DATABASE_URL: postgresql+asyncpg://bullcapital:bullcapital@db:5432/bullcapital` (asyncpg driver format required by SQLAlchemy async in FastAPI), `OPENAI_API_KEY: ${OPENAI_API_KEY:-}`, `CORS_ORIGINS: http://localhost:3000`, depends_on `db: { condition: service_healthy }`; top-level volumes: `postgres_data:`; note: web app connects to the same DB from the host via `localhost:5432` using the standard `postgresql://` prefix (not asyncpg)
- [x] T028 [US2] Verify the full database flow: run `docker compose up -d db`, wait for healthy status, then `pnpm prisma migrate dev --name init` from `web/` — confirm tables `users`, `accounts`, `sessions`, `verification_tokens` are created; start `pnpm dev` and complete the sign-up form manually at `localhost:3000/auth/sign-up`; confirm redirect to `/home` after sign-in; if any errors surface, fix before moving to Phase 5

**Checkpoint**: US2 complete — auth flow works end-to-end with local Postgres container.

---

## Phase 5: User Story 3 — Developer Can Verify shadcn/ui Component Library (Priority: P3)

**Goal**: After this phase, shadcn base components are installed in `src/components/ui/`, the PWA manifest is in place, and a `Button` renders with the amethyst primary color.

**Independent Test**: Import `{ Button }` from `@/components/ui/button` in any page, run `pnpm type-check` — no errors. `pnpm dev`, navigate to any page containing the Button — it renders with rounded corners and amethyst accent.

### Implementation

- [x] T029 [US3] Create `web/components.json` with: `"$schema": "https://ui.shadcn.com/schema.json"`, `style: "new-york"`, `rsc: true`, `tsx: true`, `tailwind: { config: "tailwind.config.ts", css: "src/app/globals.css", baseColor: "neutral", cssVariables: true, prefix: "" }`, `iconLibrary: "lucide"`, `aliases: { components: "@/components", utils: "@/lib/utils", ui: "@/components/ui", lib: "@/lib", hooks: "@/hooks" }`
- [x] T030 [US3] Install shadcn/ui base components by creating files in `web/src/components/ui/`: `button.tsx`, `input.tsx`, `label.tsx`, `card.tsx`, `avatar.tsx`, `dropdown-menu.tsx`, `separator.tsx` — copy from BC reference at `/home/joaoh/Documents/Projetos/BC/web/src/components/ui/` where files exist (verify they use `new-york` style and `cssVariables`); for any missing files generate from the shadcn new-york registry spec using the installed Radix UI deps; ensure `web/src/lib/utils.ts` exports `cn` (it already exists — verify it has `clsx` + `tailwind-merge` implementation, update if needed)
- [x] T031 [P] [US3] Create `web/public/manifest.json` with: `name: "BullCapital"`, `short_name: "Bull"`, `description: "Inteligência de investimentos para o investidor brasileiro"`, `theme_color: "#0D0B14"`, `background_color: "#0D0B14"`, `display: "standalone"`, `orientation: "portrait"`, `start_url: "/home"`, `scope: "/"`, `icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }]`
- [x] T032 [P] [US3] Create placeholder PNG icons at `web/public/icons/icon-192.png` and `web/public/icons/icon-512.png` — run this Node.js one-liner from `web/` to generate minimal valid PNG files: `node -e "const fs=require('fs');fs.mkdirSync('public/icons',{recursive:true});const png=(s)=>{/*1x1 purple PNG*/const b=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==','base64');fs.writeFileSync('public/icons/icon-'+s+'.png',b)};png('192');png('512');"` — these are 1×1 pixel purple PNGs that satisfy the manifest parser; replace with real artwork before launch

**Checkpoint**: US3 complete — `pnpm type-check` passes with shadcn imports, PWA manifest valid (check via Chrome DevTools → Application → Manifest).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Wire the NextAuth API route handler (required for auth to function) and run full end-to-end verification.

- [x] T033 Create `web/src/app/api/auth/[...nextauth]/route.ts` — import `{ handlers }` from `@/lib/auth`; export `const { GET, POST } = handlers` — this is the NextAuth v5 App Router catch-all route; without it, all auth callbacks (sign-in, sign-out, session) return 404
- [x] T034 Run full verification per `specs/001-mvp-bootstrap/quickstart.md`: `docker compose up -d db` → healthy; `pnpm prisma migrate dev` → success; `pnpm dev` → starts; hit all 6 routes and confirm status; create account at `/auth/sign-up`, sign in, confirm `/home` loads; run `pnpm type-check` → zero errors; open Chrome DevTools → Application → Manifest → confirm PWA manifest loads without errors

**Checkpoint**: All 5 success criteria from `specs/001-mvp-bootstrap/spec.md` verified ✅

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: No dependencies — T001 and T002 fully parallel, start immediately
- **Phase 2**: Depends on Phase 1; T003 (`package.json`) must complete and `pnpm install` must run before T004–T014 (T004–T010 parallel with each other; T011 before T013; T012 parallel with T011; T014 after T012+T013)
- **Phase 3**: Depends on all of Phase 2; T015 before T016+T017; T018 after T015+T016; T019–T025 parallel after T018; T026 after all of the above
- **Phase 4**: Depends on Phase 2 only (T027 independent of Phase 3; T028 requires running app so after Phase 3)
- **Phase 5**: Depends on Phase 2 (package.json) and Phase 3 (tailwind + globals must exist); T029 before T030; T031+T032 parallel
- **Phase 6**: Depends on Phases 3, 4, 5 all complete

### Critical Dependency Chain

```
T003 (package.json) → pnpm install
  → T011 (db.ts) → T013 (auth.ts)
  → T012 (auth.config.ts) → T014 (middleware.ts)
  → T015 (tailwind) → T016 (globals.css) → T018 (layout.tsx)
    → T019–T025 (all pages, parallel)
      → T026 (type-check gate)
        → T027 (docker-compose)
          → T028 (DB verification)
            → T029 (components.json) → T030 (shadcn components)
              → T033 (NextAuth route)
                → T034 (full verification)
```

### Parallel Opportunities

```bash
# Phase 1 — both parallel:
T001 pnpm-workspace.yaml
T002 .nvmrc

# Phase 2 — after T003 + pnpm install:
T004 tsconfig.json
T005 postcss.config.mjs
T006 eslint.config.js
T007 vitest.config.ts
T008 src/test/setup.ts
T009 .env.local.example
T010 api/.env.example
T011 lib/db.ts          ← then T013 depends on this
T012 lib/auth.config.ts ← parallel with T011

# Phase 3 — after T018 (layout):
T019 app/page.tsx
T020 app/auth/layout.tsx
T021 app/auth/sign-in/page.tsx
T022 app/auth/sign-up/page.tsx
T023 app/home/page.tsx
T024 app/asset/[ticker]/page.tsx
T025 app/chat/page.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup (T001–T002)
2. Phase 2: Foundational (T003–T014) — run `pnpm install` after T003
3. Phase 3: US1 (T015–T026)
4. **STOP and VALIDATE**: app boots, all routes render, zero TS errors

### Incremental Delivery

1. Phases 1–2 → foundation compiles
2. Phase 3 → app boots, all routes reachable
3. Phase 4 → auth works end-to-end with real database
4. Phase 5 → shadcn wired, PWA installable
5. Phase 6 → project clean, ready for next feature branch

---

## Notes

- [P] tasks = different files, no incomplete dependencies — safe to create in a single agent turn
- T003 (`package.json`) is the single most critical task — nothing else resolves without it
- T026 is a hard gate — do not proceed to Phase 4 if type errors remain
- `web/prisma/schema.prisma` already exists and MUST NOT be modified
- `web/src/lib/services/market.ts`, all atoms in `src/components/atoms/`, and `src/types/market.ts` are pre-built — do not rewrite them; they compile once deps are installed
- T030 (shadcn components) can copy from BC at `/home/joaoh/Documents/Projetos/BC/web/src/components/ui/` — check each file uses `new-york` style (compact variants, no `default`-style size modifiers)
- T033 (NextAuth route) is required for any auth callback to work — without it, sign-in returns 404
- The web `DATABASE_URL` uses standard `postgresql://` prefix (pg driver); the API `DATABASE_URL` uses `postgresql+asyncpg://` prefix (SQLAlchemy asyncpg) — they point to the same database instance but different drivers
