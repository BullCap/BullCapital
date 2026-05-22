# BullCapital Constitution

## Core Principles

### I. Ship First, Refine Later
The primary goal is to get a working product in front of real users as fast as possible. An imperfect product that exists beats a perfect product that doesn't. Every decision is evaluated by: does this get us closer to shipping, or further away? Defer anything that doesn't directly serve the current MVP scope.

### II. Presentation Is the Moat
For our target user (Brazilian retail investor, mobile-first, fintech-native), trust and comprehension come through visual quality. The Financial Reading Room aesthetic — glassmorphism, calm palette, typographic hierarchy — is not decoration, it's the product. Never ship a screen that violates the design system. Every surface has depth. Every card gets the glass treatment. Every corner is rounded.

### III. AI Interprets Signals, Not Open-Ended Prompts
The core value is not a generic conversation surface. BullCapital is a market intelligence radar: users monitor assets, indices, macro indicators, and trends; AI turns relevant signals into contextual analysis cards, briefings, and report-ready explanations. The user interacts with AI through assets, events, trends, and generated analyses, not through an open-ended prompt box. The market data (Brapi) exists to detect and explain what matters, not to feed open-ended recommendations.

### IV. Portuguese Always
All user-facing text is in Brazilian Portuguese (pt-BR). This is non-negotiable. Financial concepts are explained simply, without jargon, as if talking to a smart friend who is new to investing. Never use English strings in UI copy.

### V. Mobile-First Constraints
Every layout decision assumes a 390px-wide screen first. The PWA is the product. Interactions are touch-friendly (min 44px tap targets). Animations are purposeful, not decorative noise. Performance matters — users on mid-range Android devices are the target.

### VI. Scope Discipline
The MVP has 4 screens: Onboarding, Home/Market Overview, Asset Detail, and Contextual Analysis. Nothing else ships until these 4 are working and validated with real users. Monitoring is limited to watchlist-like choices and curated market signals; no portfolio ingestion, Open Finance, order routing, or personalized buy/sell recommendations. When in doubt about adding a feature, the answer is no. Features can be added after validation; they cannot be un-built once users depend on them.

---

## Technical Constraints

### What Exists and Must Not Be Rewritten
- `web/src/lib/services/market.ts` — Brapi integrations, all 7 functions, working
- `web/src/types/market.ts` — market data types
- `web/src/components/atoms/` — MarketTemperatureDial, VariationBadge, GlassHighlight
- `web/src/lib/auth.ts` + `auth.config.ts` — NextAuth v5, configured and working
- `web/prisma/schema.prisma` — auth database schema
- `api/app/agent/` — Agno agent abstractions
- `api/app/models/` — pgVector conversation models

### Architecture Boundaries
- Next.js handles: auth, PWA shell, market data display, routing
- FastAPI handles: AI analysis generation, signal interpretation, optional contextual follow-up persistence, embeddings
- One PostgreSQL database for MVP (no split)
- No external CDN, no microservice explosion, no message queues for MVP

### Dependency Policy
Before adding any npm or Python package, ask: can this be done with what's already installed? If a package is added, it must have >1M weekly downloads or be from a trusted maintainer. No experimental packages in the data/auth path.

---

## Development Workflow

### Branching
- `main` — always deployable
- `feat/[name]` — feature branches, PRs into main
- Commit format: Conventional Commits (`feat:`, `fix:`, `chore:`, `style:`)

### Definition of Done for a Screen
1. Works on mobile (390px viewport)
2. Follows design system (glassmorphism, palette, typography)
3. All text is in Portuguese
4. Data states handled: loading, error, empty
5. Accessible: interactive elements have labels, contrast meets AA

### What Blocks a Merge
- English strings in user-facing UI
- Flat design patterns (no glass, no depth)
- Missing error/empty states
- TypeScript errors

---

## Governance

This constitution supersedes all other practices. When a technical decision conflicts with a principle here, the constitution wins. Amendments require explicit discussion and a documented reason.

The CLAUDE.md file extends this constitution with implementation details, existing code inventory, and commands.

**Version**: 1.1.0 | **Ratified**: 2026-05-20 | **Last Amended**: 2026-05-20
