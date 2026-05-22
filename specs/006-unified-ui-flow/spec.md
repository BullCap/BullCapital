# Feature Specification: Unified UI Flow

**Feature Branch**: `006-unified-ui-flow`

**Created**: 2026-05-22

**Status**: Draft

**Input**: User description: "Unify the mobile and web UI flow so the PWA can become a Capacitor-distributed app while phones, tablets, and desktops share the same base components."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Shared app flow across screens (Priority: P1)

An authenticated user can move between market overview, search, analysis, and asset detail from the same navigation landmarks on phone, tablet, and desktop. The screen may gain room and density as the viewport grows, but it should not feel like a different product.

**Why this priority**: A shared flow is the foundation for reusing components in the PWA and a future native shell.

**Independent Test**: Open the authenticated app on phone, tablet, and desktop viewports, navigate through the primary routes, and confirm that navigation and account access stay available without route-specific wrappers.

**Acceptance Scenarios**:

1. **Given** an authenticated user starts on the market overview on a phone, **When** they navigate to search and analysis, **Then** the same primary navigation remains reachable and active state stays clear.
2. **Given** the same user opens the app on a tablet or desktop, **When** they navigate the same routes, **Then** the shell reflows for the larger viewport without replacing the shared route components.

---

### User Story 2 - Progressive workstation density (Priority: P2)

A user on a tablet or desktop can see more context around the same core tasks: roomier market dashboards, persistent navigation, and layout slots that can grow into higher density tools without forking the mobile flow.

**Why this priority**: Larger screens should become more capable than a stretched phone view while staying on the same base components.

**Independent Test**: Compare the market and analysis routes at mobile, tablet, and desktop widths and verify that the app shell widens and reserves stable navigation space without hiding mobile-critical actions.

**Acceptance Scenarios**:

1. **Given** a desktop viewport, **When** a user scans an authenticated route, **Then** navigation occupies stable workstation space and the content region can expand beyond the phone column.

---

### User Story 3 - Native-ready PWA shell (Priority: P3)

The team can package the existing PWA with Capacitor without redesigning the primary application flow for native distribution.

**Why this priority**: Native distribution should build on the web app architecture after the shared shell is stable.

**Independent Test**: Review the app shell and packaging plan and confirm that safe-area-aware navigation, PWA assets, and Capacitor configuration have explicit ownership.

**Acceptance Scenarios**:

1. **Given** the unified shell is in place, **When** Capacitor packaging work starts, **Then** the team can reuse the same authenticated routes and document only platform-specific wrappers or plugins.

---

### Edge Cases

- A mobile viewport must keep navigation reachable above device safe areas and browser chrome.
- Tablet widths must avoid a half-mobile, half-desktop layout that leaves navigation and content competing for the same narrow column.
- Desktop reflow must not duplicate navigation landmarks or split route state between mobile and desktop components.
- Auth routes remain outside the authenticated application shell.
- Asset-not-found and loading/error states still need navigation and account access when the user is authenticated.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The authenticated application MUST use a shared shell for market, search, analysis, and asset routes.
- **FR-002**: The shared shell MUST keep a primary navigation landmark available on phone, tablet, and desktop layouts.
- **FR-003**: The shared shell MUST keep account access visible in the authenticated flow.
- **FR-004**: Phone layouts MUST remain touch-first and safe-area-aware for PWA and embedded native webview use.
- **FR-005**: Tablet layouts MUST reuse the same base components while allowing wider layouts and denser information groupings.
- **FR-006**: Desktop layouts MUST reuse the same base components while reserving stable space for workstation navigation and future high-density tools.
- **FR-007**: Shared navigation MUST preserve clear active state for the market, search, and analysis sections.
- **FR-008**: Auth screens MUST remain focused entry flows and MUST NOT inherit the authenticated workstation shell.
- **FR-009**: The feature plan MUST describe how the PWA is prepared for Capacitor packaging, including app configuration, safe areas, build output, and platform-specific validation.
- **FR-010**: Any platform-only capability added for Capacitor MUST be isolated behind explicit adapters or wrappers so web behavior remains first-class.

### Key Entities

- **Application shell**: Shared authenticated frame that owns account access, responsive navigation placement, and route content width.
- **Navigation section**: Primary destination with label, icon, route, and active state shared by all viewport variants.
- **Platform wrapper**: Web, PWA, or Capacitor host concerns that may add configuration without forking business routes or UI primitives.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The same authenticated primary routes are navigable at 375px, 820px, and 1440px widths with account access visible at each size.
- **SC-002**: Primary navigation remains reachable without overlap with content or safe-area insets on tested mobile PWA viewports.
- **SC-003**: Tablet and desktop layouts expose a wider content region than mobile while sharing the same route-level components.
- **SC-004**: Packaging work can add Capacitor configuration without duplicating the authenticated page tree.

## Assumptions

- The existing Next.js PWA remains the product base; Capacitor distribution follows the unified shell work instead of replacing it.
- Mobile is the interaction baseline, tablets add room and comparison affordances, and desktop grows toward a workstation surface.
- Existing route components, authentication, market services, and design tokens are reused.
- Bottom navigation is the mobile landmark; the same navigation model may reflow into a rail on larger viewports.
- Account/profile access remains a persistent authenticated landmark across viewport variants.
