# Data Model: Auth Screens

**Feature**: `002-auth-screens`
**Date**: 2026-05-20

> The database schema is already defined in `web/prisma/schema.prisma` and MUST NOT be modified. This document covers the **form state model**, **server action contracts**, and **validation rules** specific to this feature.

---

## Entity 1: RegisterInput (Form Data — Sign-Up)

The data collected by the sign-up form before submission.

| Field    | Type   | Required | Validation Rules |
|----------|--------|----------|-----------------|
| `email`  | string | Yes      | Valid email format (RFC 5322); max 255 chars |
| `password` | string | Yes   | Min 8 characters; no max enforced for MVP |
| `name`   | string | No       | Min 2 characters if provided; max 100 chars |

**Zod Schema** (server-side):
```
z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).optional().or(z.literal(''))
})
```

**Error Messages** (pt-BR):
- `email` invalid format → "Endereço de e-mail inválido."
- `password` too short → "A senha deve ter pelo menos 8 caracteres."
- `name` too short → "O nome deve ter pelo menos 2 caracteres."
- Duplicate email (DB check) → "Já existe uma conta com este e-mail."
- Generic server error → "Algo deu errado. Tente novamente."

---

## Entity 2: LoginInput (Form Data — Sign-In)

The data collected by the sign-in form before submission.

| Field      | Type   | Required | Validation Rules |
|-----------|--------|----------|-----------------|
| `email`   | string | Yes      | Valid email format |
| `password` | string | Yes     | Min 8 characters (same constraint as registration) |

**Zod Schema** (server-side):
```
z.object({
  email: z.string().email(),
  password: z.string().min(8)
})
```

**Error Messages** (pt-BR):
- Any validation failure → "E-mail ou senha inválidos." (intentionally ambiguous per SC-007)
- Invalid credentials (wrong email or wrong password) → "E-mail ou senha incorretos."
- Generic server error → "Algo deu errado. Tente novamente."

---

## Entity 3: AuthActionState (Server Action Return Value)

The typed result returned by both `register()` and `login()` server actions, consumed by `useActionState`.

```typescript
type AuthActionState =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }
  | null   // initial state before first submission
```

| State | When | Client Behaviour |
|-------|------|-----------------|
| `null` | Before any submission | Form renders normally, no errors shown |
| `{ success: true }` | Successful register or login | `useEffect` triggers router redirect to `/home` or `callbackUrl` |
| `{ success: false, error }` | Server-side failure | Error shown in banner above form fields |
| `{ success: false, fieldErrors }` | Zod validation failure | Errors shown inline below each field |

---

## Entity 4: FormUIState (Client-Only — Sign-Up and Sign-In)

Transient client state within each form component. Not persisted or sent to the server.

| State       | Type    | Purpose |
|-------------|---------|---------|
| `showPassword` | boolean | Toggles input type between `"password"` and `"text"` |
| `pending`   | boolean | From `useFormStatus().pending` — disables submit button, shows spinner |

---

## Component File Map

```
web/src/
├── app/
│   ├── actions/
│   │   └── auth.ts                  ← NEW: register() + login() server actions
│   └── auth/
│       ├── sign-in/
│       │   └── page.tsx             ← UPDATE: add SignInForm, callbackUrl prop
│       └── sign-up/
│           └── page.tsx             ← UPDATE: add SignUpForm
│
└── components/
    └── auth/
        ├── SignInForm.tsx            ← NEW: 'use client' form component
        └── SignUpForm.tsx            ← NEW: 'use client' form component
```

---

## Existing DB Entities (Read-Only Reference)

These are defined in `web/prisma/schema.prisma` — do not modify.

| Entity | Relevant Fields for This Feature |
|--------|----------------------------------|
| `User` | `id`, `email` (unique), `passwordHash`, `name?` |
| `Session` | Created automatically by NextAuth on sign-in |
| `Account` | Created automatically by NextAuth on sign-in (provider link) |
