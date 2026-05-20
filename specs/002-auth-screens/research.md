# Research: Auth Screens

**Feature**: `002-auth-screens`
**Date**: 2026-05-20

---

## Decision 1: Form Interaction Pattern

**Decision**: React 19 `useActionState` (formerly `useFormState`) + `useFormStatus` for pending state.
**Rationale**: This is the canonical React 19 / Next.js 15 Server Actions pattern. `useActionState` gives a typed state object returned by the server action (`{ success, error, fieldErrors? }`). `useFormStatus` gives `.pending` to disable the submit button during flight. The BC reference already uses this exact pattern in `SignInForm.tsx` — no new dependencies needed.
**Alternatives considered**: React Hook Form — adds ~25KB, overkill for two simple forms. Tanstack Form — same issue. Plain `fetch` — loses progressive enhancement and server action typing.

---

## Decision 2: Validation Strategy

**Decision**: Zod schema on the server action (`z.object({...}).safeParse()`), plus native HTML5 attributes (`required`, `type="email"`, `minLength={8}`) for instant client-side feedback before any network request. No separate client-side Zod run.
**Rationale**: Server-side Zod is the security boundary — it always runs. HTML5 attributes give sub-100ms inline feedback for the obvious cases (empty field, wrong email format, short password) without JS overhead. The BC `auth.ts` actions already use this exact pattern. `fieldErrors` from Zod's `.flatten()` can be passed back in the action state for server-side errors to be shown inline.
**Alternatives considered**: Full client-side Zod (pre-submission) — adds complexity for forms with 2-3 fields where HTML5 covers the common cases. RHF + resolver — unnecessary overhead.

---

## Decision 3: Server Action File Location

**Decision**: `web/src/app/actions/auth.ts` — a shared server actions file, ported and updated from the BC reference.
**Rationale**: BC already has `app/actions/auth.ts` with working `register()` and `login()` functions. BullCapital needs the same two functions with minor changes: remove `googleSignIn()`, adjust redirect targets. Keeping it at `actions/auth.ts` follows Next.js convention of co-locating actions near the app directory root.
**Alternatives considered**: Co-locating actions in `app/auth/actions.ts` — splits the file unnecessarily when both screens share the same domain.

---

## Decision 4: Sign-Up Auto-Login Flow

**Decision**: After `prisma.user.create()` succeeds in `register()`, immediately call `signIn('credentials', { email, password, redirect: false })` within the same server action, then return `{ success: true }`. The client redirects to `/home` on `success`.
**Rationale**: Users expect to land directly in the app after signing up, not to be asked to sign in again. This matches the BC `register()` pattern. Using `redirect: false` keeps the server action in control; the client-side router handles navigation after the state update.
**Alternatives considered**: Redirect the user to `/auth/sign-in` after registration — creates unnecessary friction, contradicts SC-001 (under 60 seconds to `/home`).

---

## Decision 5: Password Show/Hide Toggle

**Decision**: Local `useState` boolean (`showPassword`) toggling `input type` between `"password"` and `"text"`. The toggle button uses a Lucide `Eye` / `EyeOff` icon inside the input field via absolute positioning.
**Rationale**: No external dependency needed. The pattern is well-understood and accessible (toggle button with `aria-label` updates). Lucide is already installed in the project.
**Alternatives considered**: CSS-only approach — not possible for changing input `type`. Radix UI PasswordInput — not in shadcn registry, adds a dep.

---

## Decision 6: `callbackUrl` Sanitization

**Decision**: In the sign-in redirect logic (client side, in `useEffect` after `state.success`), check that `callbackUrl` starts with `/` and does not start with `//` (open redirect via protocol-relative URLs). If valid, use it; otherwise fall back to `/home`.
**Rationale**: Open redirect via `callbackUrl` is a known attack vector. The check `url.startsWith('/') && !url.startsWith('//')` covers the common cases. NextAuth also validates the `callbackUrl` on its own for its internal redirects, but the client-side navigation in `useEffect` is the one that needs explicit guarding here.
**Alternatives considered**: Server-side sanitization in the action — the `callbackUrl` is a URL query param that affects client navigation, so client-side guarding is the right layer. Both can be applied.

---

## Decision 7: Error Message Strategy (No Email Enumeration)

**Decision**: Both "email not found" and "wrong password" return the same error: `"E-mail ou senha incorretos."` — never distinguish which was wrong.
**Rationale**: Spec SC-007 explicitly requires this. Distinct error messages for "email not found" vs "wrong password" allow attackers to enumerate registered accounts. The BC reference already returns the same `CredentialsSignin` error for both cases via NextAuth.
**Alternatives considered**: Distinct messages — explicitly rejected by SC-007.

---

## Decision 8: Glass Design Component Composition

**Decision**: The form container uses the `glass-card` utility class from `globals.css` (already defined in bootstrap). Inside: `GlassHighlight` atom at the top of the card. Each input uses the `Input` shadcn component styled with `bg-transparent border-white/10 text-starlight focus:border-amethyst focus:ring-amethyst/20`. The primary submit button uses `Button` variant `default` (amethyst glass).
**Rationale**: All components exist. The `glass-card` utility, `GlassHighlight`, `Input`, and `Button` are all from the bootstrap and follow the constitution exactly. No new design primitives needed.
**Alternatives considered**: Custom CSS — unnecessary given the utility class and atoms already exist.

---

## Decision 9: Form Component Architecture

**Decision**: Each screen (`sign-in/page.tsx`, `sign-up/page.tsx`) is a Server Component that handles the auth redirect check. The actual form is extracted into a Client Component (`SignInForm.tsx`, `SignUpForm.tsx`) under `src/components/auth/`. This matches the Next.js App Router pattern: server shell for data, client leaf for interactivity.
**Rationale**: `useActionState` and `useFormStatus` require `'use client'`. The auth check (`await auth()`) requires the server context. Splitting them follows the App Router composition model. The BC reference uses the exact same split.
**Alternatives considered**: Full client component — loses the server-side auth redirect without an extra API call. Full server component — cannot use `useActionState`.
