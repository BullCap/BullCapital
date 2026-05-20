# Tasks: Auth Screens

**Input**: Design documents from `specs/002-auth-screens/`

**Branch**: `002-auth-screens`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks grouped by user story for independent, incremental delivery.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable (different files, no incomplete dependencies)
- **[Story]**: User story label (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the server actions file and shared type — the single blocking prerequisite for both form components.

- [x] T001 Create `web/src/app/actions/auth.ts` as a `'use server'` module: define the shared type `type AuthActionState = { success: true } | { success: false; error: string; fieldErrors?: Record<string, string[]> } | null`; define `registerSchema` with `z.object({ email: z.string().email('Endereço de e-mail inválido.'), password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'), name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.').optional().or(z.literal('')) })`; define `loginSchema` with `z.object({ email: z.string().email(), password: z.string().min(8) })`; implement `export async function register(prevState: AuthActionState, formData: FormData | Record<string, unknown>): Promise<AuthActionState>` — (1) extract raw with `formData instanceof FormData ? Object.fromEntries(formData.entries()) : formData`, (2) `registerSchema.safeParse(raw)` — on failure return `{ success: false, error: 'Dados inválidos.', fieldErrors: parsed.error.flatten().fieldErrors }`, (3) `prisma.user.findUnique({ where: { email } })` — if found return `{ success: false, error: 'Já existe uma conta com este e-mail.' }`, (4) `hash(password, 12)`, (5) `prisma.user.create({ data: { email, passwordHash, name: name || null } })`, (6) try `await signIn('credentials', { email, password, redirect: false })` catch silently, (7) return `{ success: true }`; implement `export async function login(prevState: AuthActionState, formData: FormData | Record<string, unknown>): Promise<AuthActionState>` — (1) extract raw, (2) `loginSchema.safeParse(raw)` — on failure return `{ success: false, error: 'E-mail ou senha inválidos.' }`, (3) try `await signIn('credentials', { email, password, redirect: false })` — catch `AuthError`: if `error.type === 'CredentialsSignin'` return `{ success: false, error: 'E-mail ou senha incorretos.' }`, else return `{ success: false, error: 'Algo deu errado. Tente novamente.' }` — catch non-AuthError: re-throw, (4) return `{ success: true }`; imports: `'use server'`, `{ AuthError }` from `'next-auth'`, `{ signIn }` from `'@/lib/auth'`, `{ hash }` from `'bcryptjs'`, `{ prisma }` from `'@/lib/db'`, `{ z }` from `'zod'`

**Checkpoint**: Server actions file complete. Both `register()` and `login()` are typed, exported, and handle all error paths. All dependent form components can now be built.

---

## Phase 2: Foundational — Shared Form Primitives

**Purpose**: Extract a reusable `PasswordInput` sub-component used by both forms, and confirm `GlassHighlight` import path.

- [x] T002 Create `web/src/components/auth/PasswordInput.tsx` as a `'use client'` component: props `{ id: string; name: string; placeholder?: string; autoComplete?: string; disabled?: boolean; error?: string }`; local `const [show, setShow] = useState(false)`; render a `<div className="relative">` containing an `<Input>` (from `@/components/ui/input`) with `id`, `name`, `type={show ? 'text' : 'password'}`, `placeholder`, `autoComplete`, `disabled`, `required`, `minLength={8}`, `className="pr-11 bg-transparent border-white/10 text-[#F4F0FF] placeholder:text-[#F4F0FF]/40 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20"` and an `aria-label` on the toggle button `"Mostrar senha"` / `"Ocultar senha"` that contains `<Eye size={16} />` / `<EyeOff size={16} />` from `lucide-react`, positioned `absolute right-3 top-1/2 -translate-y-1/2`; if `error` prop is provided render `<p className="mt-1 text-xs text-[#F43F5E]">{error}</p>` below the wrapper; export as `default`

**Checkpoint**: `PasswordInput` reusable — both `SignInForm` and `SignUpForm` will import it.

---

## Phase 3: User Story 1 — New User Creates an Account (Priority: P1) 🎯 MVP

**Goal**: A visitor can complete registration at `/auth/sign-up` and land on `/home` in under 60 seconds.

**Independent Test**: Navigate to `localhost:3000/auth/sign-up`. Enter a new email + password (8+ chars). Submit. Confirm redirect to `/home` and the user exists in the DB (`pnpm prisma studio`).

### Implementation

- [x] T003 [US1] Create `web/src/components/auth/SignUpForm.tsx` as a `'use client'` component: import `{ useActionState }` from `'react'`, `{ useFormStatus }` from `'react-dom'`, `{ useRouter }` from `'next/navigation'`, `{ useEffect }` from `'react'`, `Link` from `'next/link'`, `{ register }` from `'@/app/actions/auth'`, `{ Button }` from `'@/components/ui/button'`, `{ Input }` from `'@/components/ui/input'`, `{ Label }` from `'@/components/ui/label'`, `{ GlassHighlight }` from `'@/components/atoms/GlassHighlight'`, `PasswordInput` from `'@/components/auth/PasswordInput'`; define inner `function SubmitButton()` using `useFormStatus()` that renders `<Button type="submit" disabled={pending} className="w-full">{pending ? 'Criando conta…' : 'Criar conta'}</Button>`; export default `function SignUpForm()` using `const [state, formAction] = useActionState(register, null)` and `const router = useRouter()`; `useEffect(() => { if (state?.success) router.push('/home') }, [state, router])`; render a `<form action={formAction} noValidate>` inside a `<div className="glass-card relative overflow-hidden p-8 w-full max-w-sm">` containing: `<GlassHighlight widthPercent={70} />`, heading "Criar conta" in `font-serif text-3xl text-[#F4F0FF]`, subheading "Comece a investir com inteligência" in `text-sm text-[#F4F0FF]/60`; if `state && !state.success && state.error` render banner `<p className="rounded-xl border border-[#F43F5E]/30 bg-[#F43F5E]/10 px-4 py-2 text-sm text-[#F43F5E]">{state.error}</p>`; render `<Label htmlFor="name">Nome (opcional)</Label>` + `<Input id="name" name="name" type="text" autoComplete="name" placeholder="Seu nome" className="bg-transparent border-white/10 text-[#F4F0FF] placeholder:text-[#F4F0FF]/40 focus:border-[#8B5CF6]" />`; if `state?.fieldErrors?.name` render `<p className="text-xs text-[#F43F5E]">{state.fieldErrors.name[0]}</p>`; render `<Label htmlFor="email">E-mail</Label>` + `<Input id="email" name="email" type="email" required autoComplete="email" placeholder="seu@email.com" className="..." />`; if `state?.fieldErrors?.email` render field error; render `<Label htmlFor="password">Senha</Label>` + `<PasswordInput id="password" name="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" error={state?.fieldErrors?.password?.[0]} />`; render `<SubmitButton />`; render `<p className="text-center text-sm text-[#F4F0FF]/50">Já tem uma conta? <Link href="/auth/sign-in" className="text-[#8B5CF6] hover:underline">Entrar</Link></p>`

- [x] T004 [US1] Update `web/src/app/auth/sign-up/page.tsx` — keep the existing `auth()` guard and `redirect('/home')` for authenticated users; import `SignUpForm` from `'@/components/auth/SignUpForm'`; replace the placeholder `<section>` content with `<SignUpForm />`; the `auth/layout.tsx` already wraps this in a centered dark container

**Checkpoint**: US1 complete — navigate to `/auth/sign-up`, create account, land on `/home`. Duplicate email shows "Já existe uma conta com este e-mail." Weak password shows field-level error.

---

## Phase 4: User Story 2 — Returning User Signs In (Priority: P2)

**Goal**: A registered user can sign in at `/auth/sign-in` and land on `/home` (or `callbackUrl`) in under 30 seconds.

**Independent Test**: Create an account (US1), sign out (clear cookies), navigate to `/auth/sign-in`, enter credentials, confirm redirect to `/home`. Test wrong credentials → "E-mail ou senha incorretos."

### Implementation

- [x] T005 [US2] Create `web/src/components/auth/SignInForm.tsx` as a `'use client'` component: import `{ useActionState }` from `'react'`, `{ useFormStatus }` from `'react-dom'`, `{ useRouter, useSearchParams }` from `'next/navigation'`, `{ useEffect }` from `'react'`, `Link` from `'next/link'`, `{ login }` from `'@/app/actions/auth'`, `{ Button }` from `'@/components/ui/button'`, `{ Input }` from `'@/components/ui/input'`, `{ Label }` from `'@/components/ui/label'`, `{ GlassHighlight }` from `'@/components/atoms/GlassHighlight'`, `PasswordInput` from `'@/components/auth/PasswordInput'`; define inner `function SubmitButton()` using `useFormStatus()` that renders `<Button type="submit" disabled={pending} className="w-full">{pending ? 'Entrando…' : 'Entrar'}</Button>`; export default `function SignInForm()` using `const [state, formAction] = useActionState(login, null)`, `const router = useRouter()`, `const searchParams = useSearchParams()`; derive `const callbackUrl = (() => { const raw = searchParams.get('callbackUrl') ?? ''; return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/home' })()`; `useEffect(() => { if (state?.success) router.push(callbackUrl) }, [state, router, callbackUrl])`; render a `<form action={formAction} noValidate>` inside a `<div className="glass-card relative overflow-hidden p-8 w-full max-w-sm">` containing: `<GlassHighlight widthPercent={70} />`, heading "Entrar" in `font-serif text-3xl text-[#F4F0FF]`, subheading "Acesse sua conta BullCapital" in `text-sm text-[#F4F0FF]/60`; if `state && !state.success && state.error` render error banner `<p className="rounded-xl border border-[#F43F5E]/30 bg-[#F43F5E]/10 px-4 py-2 text-sm text-[#F43F5E]">{state.error}</p>`; render `<Label htmlFor="email">E-mail</Label>` + `<Input id="email" name="email" type="email" required autoComplete="email" placeholder="seu@email.com" className="bg-transparent border-white/10 text-[#F4F0FF] placeholder:text-[#F4F0FF]/40 focus:border-[#8B5CF6]" />`; render `<Label htmlFor="password">Senha</Label>` + `<PasswordInput id="password" name="password" autoComplete="current-password" placeholder="Sua senha" />`; render `<SubmitButton />`; render `<p className="text-center text-sm text-[#F4F0FF]/50">Não tem uma conta? <Link href="/auth/sign-up" className="text-[#8B5CF6] hover:underline">Criar conta</Link></p>`

- [x] T006 [US2] Update `web/src/app/auth/sign-in/page.tsx` — keep the existing `auth()` guard and `redirect('/home')` for authenticated users; wrap `SignInForm` in `<Suspense fallback={null}>` (required because `SignInForm` uses `useSearchParams()`); import `SignInForm` from `'@/components/auth/SignInForm'`, `{ Suspense }` from `'react'`; replace the placeholder `<section>` content with `<Suspense fallback={null}><SignInForm /></Suspense>`

**Checkpoint**: US2 complete — sign in with valid credentials → `/home`. Wrong credentials → banner error. Already signed in → redirects to `/home`. `callbackUrl=/home` respected; `callbackUrl=https://evil.com` falls back to `/home`.

---

## Phase 5: User Story 3 — Navigation Between Auth Screens (Priority: P3)

**Goal**: Links between sign-in and sign-up screens work correctly and are clearly labeled.

**Independent Test**: From `/auth/sign-in`, click "Criar conta" → lands on `/auth/sign-up`. From `/auth/sign-up`, click "Já tenho uma conta" → lands on `/auth/sign-in`.

### Implementation

- [x] T007 [P] [US3] Verify `SignInForm.tsx` link: confirm the "Criar conta" `<Link href="/auth/sign-up">` is present and the text matches "Criar conta" exactly (already implemented in T005 — this is a verification task; if the link text or href is wrong, fix it in `web/src/components/auth/SignInForm.tsx`)
- [x] T008 [P] [US3] Verify `SignUpForm.tsx` link: confirm the "Já tenho uma conta" `<Link href="/auth/sign-in">` is present and the text reads "Já tenho uma conta" (already implemented in T003 — verify and fix if needed in `web/src/components/auth/SignUpForm.tsx`)

**Checkpoint**: US3 complete — both cross-links render, navigate correctly, and use the exact pt-BR strings from the spec.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Type-check gate, visual consistency pass, and edge-case hardening.

- [x] T009 Run `pnpm type-check` from `web/` and fix any TypeScript errors across all new files (`actions/auth.ts`, `SignInForm.tsx`, `SignUpForm.tsx`, `PasswordInput.tsx`, updated page files) — zero errors required before proceeding
- [x] T010 [P] Verify all user-facing strings across `SignInForm.tsx`, `SignUpForm.tsx`, `PasswordInput.tsx`, and `actions/auth.ts` are in pt-BR — scan for any English words in labels (`"Email"` → should be `"E-mail"`), placeholders, button text, error messages, and links; fix any found
- [x] T011 [P] Verify 44px minimum tap targets on all interactive elements in both forms: check that `<Input>` elements have `min-h-11` (44px), `<Button>` has `min-h-11`, and the password toggle button in `PasswordInput.tsx` has at least `w-11 h-11` or equivalent tap area; fix any that fall short
- [x] T012 Manual end-to-end verification: (1) `docker compose up -d db`, `pnpm dev`; (2) navigate to `/auth/sign-up`, create account → `/home`; (3) clear session (DevTools → Application → Cookies → delete), navigate to `/auth/sign-in`, sign in → `/home`; (4) navigate to `/home` without session → redirect to `/auth/sign-in?callbackUrl=/home`; (5) sign in → redirect back to `/home`; (6) test `/auth/sign-in?callbackUrl=https://evil.com` → after sign-in lands on `/home`; (7) test duplicate email registration → "Já existe uma conta com este e-mail."; (8) test wrong password → "E-mail ou senha incorretos."; (9) test password show/hide on both forms

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (T001)**: No dependencies — start immediately
- **Phase 2 (T002)**: Depends on Phase 1 (uses `Input` from shadcn, already installed)
- **Phase 3 (T003–T004)**: Depends on T001 (server actions) + T002 (PasswordInput)
- **Phase 4 (T005–T006)**: Depends on T001 (server actions) + T002 (PasswordInput)
- **Phase 5 (T007–T008)**: Depends on T003 and T005 existing (verification only)
- **Phase 6 (T009–T012)**: Depends on all phases complete

### Critical Dependency Chain

```
T001 (auth.ts server actions)
  → T002 (PasswordInput)
    → T003 (SignUpForm) → T004 (sign-up/page.tsx)    [US1]
    → T005 (SignInForm) → T006 (sign-in/page.tsx)    [US2]
      → T007 verify SignInForm link                   [US3]
      → T008 verify SignUpForm link                   [US3]
        → T009 type-check gate
          → T010, T011 parallel polish
            → T012 full verification
```

### Parallel Opportunities

```bash
# After T001 + T002 complete, these can run in parallel:
T003  web/src/components/auth/SignUpForm.tsx    [US1]
T005  web/src/components/auth/SignInForm.tsx    [US2]

# After T003 complete:
T004  web/src/app/auth/sign-up/page.tsx

# After T005 complete:
T006  web/src/app/auth/sign-in/page.tsx

# After T009 (type-check):
T010  pt-BR string audit
T011  44px tap target check
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001 — server actions (both `register` and `login` — they're in the same file)
2. T002 — PasswordInput component
3. T003 + T004 — SignUpForm + sign-up page
4. **STOP and VALIDATE**: `/auth/sign-up` → create account → `/home`

### Incremental Delivery

1. T001 + T002 → shared foundation
2. T003 + T004 → US1: new user can register
3. T005 + T006 → US2: returning user can sign in
4. T007 + T008 → US3: navigation between screens
5. T009 + T010 + T011 + T012 → polish and full verification

---

## Notes

- [P] tasks = different files, no incomplete dependencies — safe to implement in parallel
- T001 (`actions/auth.ts`) is the single blocking prerequisite — nothing else can be done without it
- `register()` must call `signIn()` after `user.create()` in a try/catch — if signIn fails after a successful create, return `{ success: true }` anyway (user can sign in manually); do NOT roll back the user creation
- `login()` must re-throw non-`AuthError` exceptions — let Next.js error boundaries handle them
- `useSearchParams()` in `SignInForm` requires a `<Suspense>` boundary in the page — T006 handles this
- The `Label` component from shadcn must have `htmlFor` matching the `Input`'s `id` for accessibility (screen readers + tap-label-to-focus)
- `GlassHighlight` is imported from `'@/components/atoms/GlassHighlight'` — verify the import path compiles before building the full form
- Both forms use `noValidate` on the `<form>` tag to prevent browser-native validation UI from conflicting with the custom error display; HTML5 attributes (`required`, `type="email"`, `minLength`) still fire before `formAction` if JS is disabled
