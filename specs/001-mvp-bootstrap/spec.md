# Feature Specification: MVP Project Bootstrap

**Feature Branch**: `001-mvp-bootstrap`

**Created**: 2026-05-20

**Status**: Draft

**Input**: Bootstrap the BullCapital Next.js web app — scaffold project dependencies, design system configuration, app router structure, local development environment, and port all reusable assets from the BC reference project.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Developer can run the web app locally (Priority: P1)

A developer clones the repository, runs the install and dev commands, and the BullCapital web app starts on localhost with the correct dark glassmorphism visual theme, without errors.

**Why this priority**: Nothing else can be built or tested until a working local dev environment exists. This is the absolute foundation.

**Independent Test**: Run `pnpm install && pnpm dev` in `web/`, navigate to `localhost:3000`, and observe: the page renders with the `#0D0B14` void background, Playfair Display and Inter fonts loaded, no console errors.

**Acceptance Scenarios**:

1. **Given** a clean clone with Node 20+ and pnpm installed, **When** `pnpm install` is run in `web/`, **Then** all dependencies install without errors and TypeScript compilation succeeds.
2. **Given** dependencies installed, **When** `pnpm dev` is run, **Then** Next.js starts on port 3000 and the root page renders with the correct dark background.
3. **Given** the app running, **When** the developer opens DevTools, **Then** Inter and Playfair Display fonts are loaded and no TypeScript or ESLint errors appear in the terminal.

---

### User Story 2 — Developer can connect to a local PostgreSQL database (Priority: P2)

A developer starts the local database via Docker Compose and runs Prisma migrations, resulting in a ready database with the auth schema applied.

**Why this priority**: Auth and all data features depend on the database being available and migrated. Must be solved before any screen can be implemented end-to-end.

**Independent Test**: Run `docker compose up -d db`, then `pnpm prisma migrate dev` — migrations complete successfully and `pnpm prisma studio` opens showing the User/Account/Session tables.

**Acceptance Scenarios**:

1. **Given** Docker installed, **When** `docker compose up -d db` is run from the project root, **Then** a PostgreSQL 16 container starts and listens on port 5432.
2. **Given** the database running, **When** `pnpm prisma migrate dev` is run in `web/`, **Then** migrations apply without error and all NextAuth tables (User, Account, Session, VerificationToken) exist.
3. **Given** the FastAPI service configured with the same `DATABASE_URL`, **When** `uvicorn` starts, **Then** the service connects to the database and the `/health` endpoint returns `200 OK`.

---

### User Story 3 — Developer can install and verify the shadcn/ui component library (Priority: P3)

The shadcn/ui library is configured and at least one base component (Button) is available for import in the app, confirming the design toolchain works.

**Why this priority**: All four MVP screens use shadcn primitives as the base layer. This must be verified before any UI work begins.

**Independent Test**: Import `Button` from `@/components/ui/button` in a test page, run the app, and confirm the button renders styled correctly with the amethyst accent color.

**Acceptance Scenarios**:

1. **Given** the project bootstrapped, **When** `components.json` is present with the correct theme and `src/components/ui/` contains at least `button.tsx` and `input.tsx`, **Then** importing these components in a page compiles without TypeScript errors.
2. **Given** the shadcn config pointing to the project's CSS variable tokens, **When** a `Button` renders, **Then** it uses the `--primary` color token (`#8B5CF6` amethyst) and rounded corners (`--radius: 1.5rem`).

---

### Edge Cases

- What happens when `BRAPI_KEY` is missing from `.env.local`? Market service calls must fail gracefully, not crash the server.
- What happens when the Docker database container is not running when `pnpm dev` starts? The app must boot (auth is lazy-loaded) and only show errors on auth-dependent routes.
- What if Node version is below 20? `pnpm` should emit a clear engines error.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The `web/` directory MUST have a complete `package.json` with all production and dev dependencies needed for Next.js 15, React 19, TypeScript 5.7, Tailwind CSS 3, NextAuth v5, Prisma 7, shadcn/ui, Brapi SDK, Recharts, Zod, and Lucide icons.
- **FR-002**: The project MUST have a `web/next.config.ts` that enables the PWA manifest headers and configures the `@/` path alias.
- **FR-003**: The project MUST have `web/tailwind.config.ts` with the BullCapital design tokens: `void (#0D0B14)`, `surface (#1A1625)`, `starlight (#F4F0FF)`, `amethyst (#8B5CF6)`, Playfair Display serif font, Inter sans font, and `--radius: 1.5rem` as the base border-radius.
- **FR-004**: The project MUST have `web/src/app/globals.css` with Tailwind directives, the HSL CSS variables for shadcn compatibility, and BullCapital utility classes (`glow-amethyst`, `text-gradient-amethyst`).
- **FR-005**: The `web/src/app/layout.tsx` MUST load Inter and Playfair Display from Google Fonts, set `lang="pt-BR"`, apply the void background, and render the app shell without a top `<Header>` (navigation is per-screen for the mobile-first PWA).
- **FR-006**: The project MUST have a `web/tsconfig.json` with strict mode enabled and the `@/` alias resolving to `src/`.
- **FR-007**: The project MUST have `web/components.json` (shadcn/ui config) pointing to the correct CSS variables and the `src/components/ui/` output directory.
- **FR-008**: The shadcn/ui base components MUST be installed: `button`, `input`, `label`, `card`, `avatar`, `dropdown-menu`, and `separator`.
- **FR-009**: A `docker-compose.yml` MUST exist at the project root providing: a PostgreSQL 16 service (`db`) with environment variables for user/password/database, and a FastAPI service (`api`) that builds from `api/Dockerfile` with the correct `DATABASE_URL` and `CORS_ORIGINS` env vars.
- **FR-010**: A `web/.env.local.example` MUST exist documenting all required environment variables: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL`, `BRAPI_KEY`.
- **FR-011**: An `api/.env` (or `api/.env.example`) MUST exist documenting: `DATABASE_URL`, `OPENAI_API_KEY`, `CORS_ORIGINS`.
- **FR-012**: The `web/prisma/schema.prisma` MUST have a valid `DATABASE_URL` reference and the existing NextAuth schema (User, Account, Session, VerificationToken) MUST migrate cleanly with `prisma migrate dev`.
- **FR-013**: The `web/src/app/` MUST have a working root page (`page.tsx`) that renders a minimal placeholder with the correct dark background and design tokens — not a blank screen.
- **FR-014**: The existing pre-built files in `web/src/` (components/atoms/, lib/services/market.ts, lib/auth.ts, lib/auth.config.ts, types/market.ts, middleware.ts) MUST compile without TypeScript errors after the package dependencies are installed.
- **FR-015**: A `.nvmrc` or `package.json` `engines` field MUST specify Node >= 20.
- **FR-016**: The `web/src/app/` structure MUST include the route placeholders for all 4 MVP screens: `/` (root/landing), `/auth/sign-in`, `/auth/sign-up`, `/home`, `/asset/[ticker]`, `/chat` — each as a minimal `page.tsx` returning a placeholder so routing works before screens are fully implemented.

### Key Entities

- **Design Token**: A named color, spacing, or typography value that must be consistently applied across all screens (e.g., `void`, `amethyst`, `starlight`).
- **Environment Variable**: A runtime configuration value that must be present for a service to operate — documented in `.env.example` files, never committed with real values.
- **App Route**: A Next.js App Router route file (`page.tsx`) defining a URL path in the application.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can go from a clean clone to a running app (`localhost:3000`) in under 5 minutes following only the README commands.
- **SC-002**: Zero TypeScript compiler errors when `pnpm type-check` runs after fresh install.
- **SC-003**: The root page (`/`) renders with the correct void background (`#0D0B14`) and amethyst accent visible — confirmed visually and by checking the CSS output.
- **SC-004**: All 6 MVP route placeholders (`/`, `/auth/sign-in`, `/auth/sign-up`, `/home`, `/asset/[ticker]`, `/chat`) return HTTP 200 and render without crashing.
- **SC-005**: `docker compose up -d db` starts the database and `pnpm prisma migrate dev` completes in under 60 seconds on a standard developer machine.

---

## Assumptions

- The developer has Node 20+, pnpm 9+, and Docker Desktop installed — these are not installed by this feature.
- `BRAPI_KEY` may be absent during bootstrap; market service calls that fail silently are acceptable at this stage.
- The `web/prisma/schema.prisma` file already exists and is correct — it MUST NOT be modified.
- The existing pre-built atom components and lib files in `web/src/` are correct and MUST NOT be rewritten — only their dependencies need to be installed.
- No top-level navigation bar/header is included in the root layout — each screen manages its own navigation chrome (bottom nav or back buttons) as this is a mobile-first PWA.
- The FastAPI service (`api/`) already has its skeleton in place; this feature only adds it to docker-compose and documents its env vars — no FastAPI route logic is implemented here.
- Supabase is explicitly NOT used — a plain PostgreSQL 16 container replaces it.
- The BC reference project (`/home/joaoh/Documents/Projetos/BC/`) is available locally for config file porting but MUST NOT be imported as a dependency.
