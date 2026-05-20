# Contract: Server Actions — Auth

**Feature**: `002-auth-screens`
**File**: `web/src/app/actions/auth.ts`
**Date**: 2026-05-20

---

## Action: `register(prevState, formData)`

**Purpose**: Create a new user account and sign them in automatically.

**Signature**:
```typescript
export async function register(
  prevState: AuthActionState,
  formData: FormData | Record<string, unknown>
): Promise<AuthActionState>
```

**Inputs** (from `formData`):
| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |
| `password` | string | Yes |
| `name` | string | No |

**Outputs**:

| Condition | Return Value |
|-----------|-------------|
| Zod validation fails | `{ success: false, error: "...", fieldErrors: { field: ["message"] } }` |
| Email already exists in DB | `{ success: false, error: "Já existe uma conta com este e-mail." }` |
| DB error | `{ success: false, error: "Algo deu errado. Tente novamente." }` |
| Success (user created + signed in) | `{ success: true }` |

**Side Effects on success**:
1. Creates a `User` record with hashed password (bcrypt, cost 12)
2. Calls `signIn('credentials', { email, password, redirect: false })` to establish a session
3. Returns `{ success: true }` — client handles redirect to `/home`

**Error handling**: Never throws; always returns a typed state. Unhandled errors from `signIn` after a successful `create` are caught and logged but do not surface the session failure to the user (they can try signing in manually).

---

## Action: `login(prevState, formData)`

**Purpose**: Authenticate an existing user with email and password.

**Signature**:
```typescript
export async function login(
  prevState: AuthActionState,
  formData: FormData | Record<string, unknown>
): Promise<AuthActionState>
```

**Inputs** (from `formData`):
| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |
| `password` | string | Yes |

**Outputs**:

| Condition | Return Value |
|-----------|-------------|
| Zod validation fails | `{ success: false, error: "E-mail ou senha inválidos." }` |
| NextAuth `CredentialsSignin` error | `{ success: false, error: "E-mail ou senha incorretos." }` |
| Any other `AuthError` | `{ success: false, error: "Algo deu errado. Tente novamente." }` |
| Non-AuthError thrown | Re-throw (let Next.js error boundary handle) |
| Success | `{ success: true }` |

**Important**: The same error message "E-mail ou senha incorretos." is returned for both wrong email AND wrong password. This prevents email enumeration (SC-007).

---

## UI Contract: SignInForm Component

**File**: `web/src/components/auth/SignInForm.tsx`
**Type**: `'use client'` React component

**Props**: None (reads `callbackUrl` from `useSearchParams()`)

**Behaviour**:
- Renders email input, password input (with show/hide toggle), submit button, link to sign-up
- `useActionState(login, null)` for form state
- `useFormStatus().pending` disables submit button + shows loading indicator
- `state.success` triggers `router.push(validCallbackUrl || '/home')`
- `state.error` renders a banner error above the fields
- HTML5 attributes: `type="email"`, `required`, `minLength={8}` on password

**callbackUrl validation** (client):
```typescript
const raw = searchParams.get('callbackUrl') ?? ''
const callbackUrl = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/home'
```

---

## UI Contract: SignUpForm Component

**File**: `web/src/components/auth/SignUpForm.tsx`
**Type**: `'use client'` React component

**Props**: None

**Behaviour**:
- Renders name input (optional), email input, password input (with show/hide toggle), submit button, link to sign-in
- `useActionState(register, null)` for form state
- `useFormStatus().pending` disables submit + shows loading indicator
- `state.success` triggers `router.push('/home')` (no callbackUrl for new accounts)
- `state.error` renders a banner error above the fields
- `state.fieldErrors` renders field-level errors below each input
