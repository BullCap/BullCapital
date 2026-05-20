# Feature Specification: Home Screen — Market Overview

**Feature Branch**: `003-home-screen`

**Created**: 2026-05-20

**Status**: Draft

**Input**: Home screen — market overview dashboard: market temperature dial, top movers (gainers/losers), IBOVESPA and S&P 500 status, SELIC rate indicator, and entry point to AI chat. Uses pre-built atoms and Brapi market services. Mobile-first, glassmorphism design.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Investor reads the market at a glance (Priority: P1)

A signed-in investor opens the app and immediately understands the current state of the market through a visual temperature gauge, the IBOVESPA and S&P 500 levels, and the SELIC rate — without having to navigate anywhere.

**Why this priority**: This is the core value proposition of the product. The first screen after login must communicate market context instantly. If this doesn't work, the app has no reason to exist.

**Independent Test**: Sign in, land on `/home`. Within 3 seconds: the temperature dial shows a value and a state label in Portuguese, IBOVESPA shows a price and a daily change %, S&P 500 shows a price and change %, and the SELIC rate is visible. No blank sections — all visible above the fold on a 390px screen.

**Acceptance Scenarios**:

1. **Given** a signed-in user navigates to `/home`, **When** the page loads, **Then** the temperature dial renders with a numeric value between 0–100 and a Portuguese label (e.g., "Euforia", "Medo", "Neutro"), IBOVESPA price and change % are visible, S&P 500 price and change % are visible, and the SELIC rate is visible.
2. **Given** the B3 market is closed, **When** the home screen loads, **Then** the data shown reflects the last available values and a "Mercado fechado" label appears near the indices.
3. **Given** a data source fails partially (e.g., S&P 500 unavailable), **When** the home screen loads, **Then** IBOVESPA and SELIC still render correctly and the failed section shows "Dados indisponíveis" instead of crashing.

---

### User Story 2 — Investor discovers the day's biggest market movers (Priority: P2)

The investor scrolls down and sees a list of the biggest gainers and the biggest losers for the day, with enough information (ticker, name, price, % change) to decide whether to investigate further.

**Why this priority**: Top movers is the highest-value signal for beginner investors trying to understand what is happening. It contextualises the temperature dial reading.

**Independent Test**: On the home screen, scroll past the temperature section. Two labeled groups appear: "Maiores altas" (top gainers) and "Maiores baixas" (top losers). Each group shows at least 3 assets. Each asset shows: ticker code, asset name, current price in BRL, and the daily change % (green for positive, red for negative). Tapping an asset navigates to `/asset/[ticker]`.

**Acceptance Scenarios**:

1. **Given** the home screen is loaded during market hours, **When** the top movers section renders, **Then** "Maiores altas" shows 3 assets with positive % change and "Maiores baixas" shows 3 assets with negative % change — each with ticker, name, BRL price, and color-coded % badge.
2. **Given** market data is available, **When** the user taps any asset card in the movers list, **Then** the app navigates to `/asset/[ticker]` for that asset.
3. **Given** market data is unavailable for movers, **When** the section renders, **Then** a Portuguese empty state message is shown ("Dados de mercado indisponíveis") instead of an empty list or crash.

---

### User Story 3 — Investor opens the AI chat from the home screen (Priority: P3)

The investor sees a clear call-to-action on the home screen to start a conversation with the AI assistant about the current market.

**Why this priority**: The AI chat is the product's core value driver. The home screen must make it obvious and accessible — not buried. This is the funnel entry point.

**Independent Test**: On the home screen, a prominent button or banner is visible reading something like "Conversar com a IA" or "Perguntar sobre o mercado". Tapping it navigates to `/chat` within 100ms.

**Acceptance Scenarios**:

1. **Given** the investor is on the home screen, **When** they tap the AI chat entry point, **Then** they are navigated to `/chat`.
2. **Given** the AI chat entry point is rendered, **When** inspected on a 390px mobile screen, **Then** the element is fully visible without horizontal scroll and has a minimum tap target of 44px height.

---

### Edge Cases

- What if BRAPI_KEY is missing from the environment? The screen must not crash — each data section shows "Dados indisponíveis" and the layout remains intact.
- What if all 3 data sources fail simultaneously? The temperature dial, movers, and indices sections each show their own empty states; the screen still renders with the glassmorphism layout.
- What if a mover has an extreme % change (e.g., +200% or -80%)? The badge and layout must not overflow — truncate at a reasonable display width.
- What if SELIC has not been updated recently? Show the most recently available value with its date.
- What if the user is on a slow connection and data loads sequentially? Each section should render independently as data arrives — no full-screen spinner blocking the whole page.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The screen MUST be accessible only to authenticated users — unauthenticated visitors are redirected to `/auth/sign-in`.
- **FR-002**: The screen MUST display a market temperature dial showing a numeric sentiment value (0–100) and a Portuguese state label derived from current market conditions.
- **FR-003**: The screen MUST display the IBOVESPA index current price and its daily percentage change.
- **FR-004**: The screen MUST display the S&P 500 index current price and its daily percentage change.
- **FR-005**: Percentage changes MUST be color-coded: positive values in the amethyst/green spectrum, negative values in rose/red — consistent with `VariationBadge` atom conventions.
- **FR-006**: The screen MUST display the current SELIC rate as a percentage with one decimal place (e.g., "10,5% a.a.").
- **FR-007**: The screen MUST display a "Maiores altas" section showing the 3 assets with the highest positive daily change %, each with: ticker code, asset name, current price in BRL (formatted as Brazilian currency), and change % badge.
- **FR-008**: The screen MUST display a "Maiores baixas" section showing the 3 assets with the highest negative daily change %, each with the same fields as FR-007.
- **FR-009**: Each asset card in the movers sections MUST be tappable and navigate to `/asset/[ticker]` for that asset.
- **FR-010**: The screen MUST include a visible call-to-action to navigate to `/chat`.
- **FR-011**: All user-facing text, labels, error messages, and empty states MUST be in Brazilian Portuguese.
- **FR-012**: Each data section (temperature dial, indices, SELIC, movers) MUST render independently — if one fails, the others still display.
- **FR-013**: Each failed or unavailable data section MUST display a Portuguese-language empty state message ("Dados indisponíveis") instead of a blank space or error crash.
- **FR-014**: The layout MUST be optimised for 390px width (mobile-first) with no horizontal overflow.
- **FR-015**: All card surfaces MUST apply the glassmorphism treatment (backdrop blur, translucent background, inset highlight, rounded corners of at least `rounded-[2rem]`).
- **FR-016**: When B3 is closed (outside trading hours, weekends, holidays), indices and movers sections MUST show a "Mercado fechado" indicator alongside the last available values.

### Key Entities

- **MarketTemperature**: A derived sentiment value (0–100) and a label (e.g., "Euforia", "Ganância", "Neutro", "Medo", "Pânico extremo") computed from available market indicators.
- **IndexStatus**: An index name (IBOVESPA, S&P 500), its current price, and its daily % change.
- **SELICRate**: The most recent SELIC base rate value as an annual percentage.
- **AssetMover**: A tradable asset with ticker, name, current price in BRL, and daily % change — appearing in the gainers or losers list.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The home screen displays visible market data (at minimum: temperature dial + one index) within 3 seconds on a simulated 4G connection (10 Mbps down).
- **SC-002**: The temperature dial value changes between visits when market conditions change — it is never hardcoded.
- **SC-003**: Each of the 5 data sections (temperature, IBOVESPA, S&P 500, SELIC, top movers) renders with real data on at least 4 out of 5 load attempts during active market hours.
- **SC-004**: Zero JavaScript crashes or white screens occur when any single data source returns an error.
- **SC-005**: Every interactive element (asset cards, AI chat CTA) has a minimum tap target of 44×44px.
- **SC-006**: All text on the screen meets WCAG AA contrast ratio (4.5:1) against the void background.
- **SC-007**: Tapping an asset card navigates to the correct `/asset/[ticker]` route within 300ms.

---

## Assumptions

- The market temperature value is computed from IBOVESPA's daily change % and volatility indicators available from the Brapi market status endpoint — not from an external fear/greed index.
- The temperature state labels follow a 5-level scale: "Pânico extremo" (0–20), "Medo" (21–40), "Neutro" (41–60), "Ganância" (61–80), "Euforia" (81–100).
- The top movers list is drawn from a curated fixed set of the most liquid Brazilian stocks (e.g., PETR4, VALE3, ITUB4, BBDC4, ABEV3, WEGE3, MGLU3, B3SA3, BBAS3, RENT3) — not a full market scan, which would be too slow for MVP.
- Market data refreshes on each page visit (no real-time streaming for MVP); there is no auto-refresh timer.
- SELIC data has a 24-hour cache as defined in the existing market service — stale data for one day is acceptable.
- The `MarketTemperatureDial`, `VariationBadge`, and `GlassHighlight` atoms are already built and must be used as-is without modification.
- The home screen is a Next.js Server Component that fetches all data server-side in parallel on each request — this avoids client-side loading spinners and improves perceived performance.
- B3 market hours are 10:00–17:00 BRT (UTC-3) on weekdays excluding Brazilian public holidays — the "Mercado fechado" indicator is based on the market status returned by the existing `getMarketStatus()` service.
- The screen does NOT include: search, asset filtering, portfolio balances, notifications, or settings — these are out of MVP scope.
