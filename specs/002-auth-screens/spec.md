# Feature Specification: Auth Screens

**Feature Branch**: `002-auth-screens`

**Created**: 2026-05-20

**Status**: Draft

**Input**: Implement sign-in and sign-up screens with full glass design, form validation, server actions, and redirect flows.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — New user creates an account (Priority: P1)

A first-time visitor arrives at the landing page, taps "Entrar", is shown the sign-up option, fills in their name (optional), email, and password, and lands on the home screen after successful registration.

**Why this priority**: Account creation is the entry point to the entire product. Without it, no user can reach any protected screen. It must work correctly before sign-in can be meaningful.

**Independent Test**: Navigate to `/auth/sign-up`. Fill in email and a valid password (8+ characters). Submit. Verify a new user record is created and the browser lands on `/home`.

**Acceptance Scenarios**:

1. **Given** a visitor on `/auth/sign-up`, **When** they submit a valid email and password (8+ chars), **Then** their account is created, they are signed in automatically, and they are redirected to `/home`.
2. **Given** a visitor tries to register with an email already in use, **When** they submit the form, **Then** they see an inline error: "Já existe uma conta com este e-mail." and the form stays open.
3. **Given** a visitor submits a password shorter than 8 characters, **When** the form validates, **Then** they see an inline error: "A senha deve ter pelo menos 8 caracteres." before the request is sent.
4. **Given** a visitor submits an invalid email format, **When** the form validates, **Then** they see an inline error: "Endereço de e-mail inválido."
5. **Given** a signed-in user navigates directly to `/auth/sign-up`, **When** the page loads, **Then** they are redirected to `/home` without seeing the form.

---

### User Story 2 — Returning user signs in (Priority: P2)

A registered user navigates to the sign-in screen, enters their credentials, and is taken to `/home` (or the page they originally tried to access via `callbackUrl`).

**Why this priority**: Sign-in is the primary daily interaction. Without it, registered users cannot access the app. Depends on US1 (a user must exist to sign in).

**Independent Test**: Create an account via US1, sign out, navigate to `/auth/sign-in`, enter credentials. Verify redirect to `/home`.

**Acceptance Scenarios**:

1. **Given** a registered user on `/auth/sign-in`, **When** they submit valid credentials, **Then** they are signed in and redirected to `/home`.
2. **Given** a registered user tried to access a protected route before signing in, **When** they successfully sign in at `/auth/sign-in`, **Then** they are redirected to the original destination (via `callbackUrl` query param).
3. **Given** a user submits wrong credentials, **When** the form submits, **Then** they see: "E-mail ou senha incorretos." and the form stays open with the password field cleared.
4. **Given** a signed-in user navigates directly to `/auth/sign-in`, **When** the page loads, **Then** they are redirected to `/home`.
5. **Given** a user submits with an empty email or password field, **When** the form validates, **Then** they see field-level errors before the request is sent.

---

### User Story 3 — User navigates between auth screens (Priority: P3)

A user who arrived at sign-in can switch to sign-up (and vice versa) without losing context, using clearly labeled links below the form.

**Why this priority**: Navigation between auth screens reduces friction for users who land on the wrong page. It does not add new functionality but directly impacts conversion.

**Independent Test**: On `/auth/sign-in`, click "Criar conta". Verify the URL changes to `/auth/sign-up` and the sign-up form renders. Click "Já tenho uma conta". Verify return to `/auth/sign-in`.

**Acceptance Scenarios**:

1. **Given** a user on `/auth/sign-in`, **When** they click "Criar conta", **Then** they navigate to `/auth/sign-up`.
2. **Given** a user on `/auth/sign-up`, **When** they click "Já tenho uma conta", **Then** they navigate to `/auth/sign-in`.

---

### Edge Cases

- What happens if the server is unreachable during form submission? The form shows a generic error "Algo deu errado. Tente novamente." and does not crash.
- What happens when the user submits the form multiple times rapidly? The submit button is disabled while a request is pending to prevent double-submission.
- What if the `callbackUrl` parameter points to an external domain? It must be ignored; redirect only to internal paths.
- What if JavaScript is disabled? Forms use native browser validation as a fallback; the server-side validation always runs regardless.
- What happens when a session expires while the user is on the form? On next submission, they receive a clean sign-in prompt.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The sign-up screen MUST display a form with fields for email (required), password (required), and name (optional).
- **FR-002**: The sign-in screen MUST display a form with fields for email (required) and password (required).
- **FR-003**: Both screens MUST validate inputs client-side before submission: email format, password minimum length of 8 characters, and required-field presence.
- **FR-004**: Both screens MUST validate inputs server-side as well; client-side validation MUST NOT be the only line of defense.
- **FR-005**: On successful sign-up, the system MUST automatically sign the user in and redirect them to `/home`.
- **FR-006**: On successful sign-in, the system MUST redirect the user to `/home`, or to the `callbackUrl` query parameter value if present and pointing to an internal path.
- **FR-007**: On failed sign-up (duplicate email), the form MUST display the message "Já existe uma conta com este e-mail." as an inline error without navigating away.
- **FR-008**: On failed sign-in (invalid credentials), the form MUST display "E-mail ou senha incorretos." as an inline error and clear the password field.
- **FR-009**: The submit button MUST be disabled and show a loading indicator while a submission is in progress.
- **FR-010**: Both forms MUST follow the BullCapital glass design system: dark void background, glass card container, starlight text, amethyst accent on focus states and the primary action button.
- **FR-011**: Both forms MUST display all user-facing text in Brazilian Portuguese (pt-BR).
- **FR-012**: All interactive elements (inputs, buttons, links) MUST have minimum 44px tap targets for mobile usability.
- **FR-013**: The sign-in screen MUST include a link to `/auth/sign-up` ("Criar conta"). The sign-up screen MUST include a link to `/auth/sign-in` ("Já tenho uma conta").
- **FR-014**: Authenticated users who navigate to either auth screen MUST be silently redirected to `/home`.
- **FR-015**: Password fields MUST include a toggle to show/hide the password value, accessible via an icon button within the field.
- **FR-016**: The `callbackUrl` redirect target MUST be validated to be an internal path (starts with `/`); external URLs MUST be rejected and the fallback `/home` used instead.

### Key Entities

- **User**: An authenticated person with `email` (unique), `passwordHash`, and optional `name`. Created on sign-up; verified on sign-in.
- **Session**: A JWT-based session token issued on successful sign-in, persisted via the auth adapter. Valid until expiry.
- **Form State**: Transient UI state representing the current values, validation errors, and submission status of a sign-in or sign-up form. Not persisted.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can complete account creation in under 60 seconds from arriving on `/auth/sign-up` to landing on `/home`.
- **SC-002**: A returning user can sign in in under 30 seconds from arriving on `/auth/sign-in` to landing on `/home`.
- **SC-003**: 100% of form validation errors are shown inline, adjacent to the relevant field, within 300ms of form submission attempt — no full-page reloads for validation feedback.
- **SC-004**: The submit button is visually disabled (opacity reduced, cursor not-allowed) within 50ms of a submission starting, preventing any double-submit.
- **SC-005**: Both screens render correctly on a 390px-wide viewport with no horizontal scroll and all interactive elements meeting the 44px tap target requirement.
- **SC-006**: All user-facing strings on both screens are in pt-BR — zero English strings visible to the user.
- **SC-007**: Attempting to sign in with invalid credentials never exposes whether the email exists in the system (same error message for wrong email vs. wrong password).

---

## Assumptions

- The `User`, `Account`, `Session` database tables already exist from the `001-mvp-bootstrap` migration and MUST NOT be modified.
- The `auth.ts`, `auth.config.ts`, and `lib/db.ts` files from the bootstrap are already correctly configured — these screens build on top of them.
- No email verification flow is required for MVP — registration creates an active account immediately.
- No "Forgot password" or password-reset flow is in scope for this feature.
- No CAPTCHA or rate-limiting UI is in scope, though the server may enforce rate limits silently.
- The name field on sign-up is optional; omitting it creates a valid account.
- The glass card layout wrapper (`auth/layout.tsx`) already exists from bootstrap and requires no changes.
- No social login (Google, GitHub) is in scope — credentials only.
- The `server actions` pattern (React `useActionState` + `useFormStatus`) is the intended interaction model, matching the existing BC reference implementation.
