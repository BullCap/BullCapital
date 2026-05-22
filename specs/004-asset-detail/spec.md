# Feature Specification: Asset Detail Screen

**Feature Branch**: `004-asset-detail`

**Created**: 2026-05-21

**Status**: Draft

**Input**: Asset Detail screen (/asset/[ticker]) — shows a single Brazilian stock with: header (ticker, full name, current price, daily change badge), simple price chart (1d/1mo/1y range toggle, line chart using Recharts), radar chart (Rentabilidade, Momentum, Liquidez, Valuation, Tendência — already built in getMarketRadarData), and a prominent "Analisar este ativo" CTA that navigates to /analysis with the ticker as context. Uses pre-built atoms (VariationBadge, GlassHighlight) and existing market services (getAssetHistory for chart, getMarketRadarData for radar). Mobile-first, glassmorphism design, pt-BR copy. Back navigation to /home.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Investor reads the current status of an asset (Priority: P1)

A signed-in investor arrives at the asset detail page (either by tapping a mover on the home screen or navigating directly to `/asset/PETR4`) and immediately sees the asset's ticker code, full name, current price in BRL, and the day's percentage change — color-coded positive or negative.

**Why this priority**: This is the minimum context an investor needs before deciding to investigate further. Without this, the page has no reason to exist. Price + daily change = the single most important piece of data on this screen.

**Independent Test**: Navigate to `/asset/PETR4`. Within 3 seconds: the page header shows "PETR4", the asset's full name, a BRL price, and a color-coded daily change badge. A back arrow navigates to `/home`.

**Acceptance Scenarios**:

1. **Given** a signed-in user navigates to `/asset/PETR4`, **When** the page loads, **Then** the header displays "PETR4", the asset's full long name, its current price formatted as Brazilian currency (e.g., "R$ 38,50"), and a daily change badge (e.g., "+1,2%") colored green for positive or rose-red for negative.
2. **Given** the user is on the asset detail page, **When** they tap the back button, **Then** they are navigated to `/home`.
3. **Given** the market data source is unavailable, **When** the page loads, **Then** the header still renders with the ticker code and shows "Dados indisponíveis" for price and change — the page does not crash.

---

### User Story 2 — Investor visualises the asset's price history (Priority: P2)

The investor sees a line chart showing the asset's price over time and can switch between three time ranges — 1 day, 1 month, and 1 year — to understand short and long-term performance.

**Why this priority**: Price context over time is what separates a detail screen from the home screen's movers list. The chart answers "is this movement unusual?" — the second most important question after the current price.

**Independent Test**: On `/asset/PETR4`, a line chart is visible below the header. Three range buttons ("1D", "1M", "1A") are present. Tapping each reloads the chart data for that range. Each transition takes under 2 seconds. On a 390px screen the chart renders without horizontal overflow.

**Acceptance Scenarios**:

1. **Given** the user is on the asset detail page, **When** the chart section loads, **Then** a line chart is visible showing price over time for the default range (1 month), with the Y-axis formatted in BRL and X-axis showing dates.
2. **Given** the chart is showing 1-month data, **When** the user taps "1D", **Then** the chart updates to show intraday price data for the current trading day, with time on the X-axis.
3. **Given** the user taps "1A", **Then** the chart updates to show 12 months of price history.
4. **Given** the chart data source fails, **When** the chart section renders, **Then** a Portuguese empty state message ("Histórico indisponível") is shown instead of a broken or empty chart.

---

### User Story 3 — Investor reads the asset's multi-dimensional performance radar (Priority: P3)

The investor scrolls down and sees a radar chart visualising the asset across five dimensions: Rentabilidade, Momentum, Liquidez, Valuation, and Tendência — giving a quick qualitative read of the asset's profile beyond just price.

**Why this priority**: The radar chart is BullCapital's visual differentiator. It translates raw fundamentals into an at-a-glance profile, which is the product's core proposition for non-expert investors. Placed below the chart so it doesn't block the primary price data.

**Independent Test**: Scroll below the price chart on `/asset/PETR4`. A five-axis radar chart is visible with labelled axes (Rentabilidade, Momentum, Liquidez, Valuation, Tendência), each scored 0–100. The chart renders correctly on a 390px screen.

**Acceptance Scenarios**:

1. **Given** the user scrolls below the price chart, **When** the radar section loads, **Then** a filled radar chart is visible with all five axes labelled in Portuguese and filled with values between 0 and 100.
2. **Given** the radar data source fails, **When** the section renders, **Then** a Portuguese empty state ("Análise indisponível") is shown without crashing.
3. **Given** the radar section is visible, **When** the user inspects it on a 390px screen, **Then** all five axis labels are readable without truncation or overflow.

---

### User Story 4 — Investor triggers contextual AI analysis for the asset (Priority: P4)

A prominent call-to-action at the bottom of the page lets the investor request an AI-generated contextual analysis of this specific asset, navigating to `/analysis` with the ticker pre-filled as the subject.

**Why this priority**: This is the bridge between market data and AI interpretation — the action the entire product funnel leads to. Placed last because it requires all the above context to feel purposeful rather than generic.

**Independent Test**: Scroll to the bottom of `/asset/PETR4`. A card or button labelled "Analisar este ativo" (or similar) is visible. Tapping it navigates to `/analysis?ticker=PETR4` (or equivalent). The element is at least 44px tall.

**Acceptance Scenarios**:

1. **Given** the user is on `/asset/PETR4`, **When** they tap "Analisar este ativo", **Then** they are navigated to `/analysis` with PETR4 as the analysis subject.
2. **Given** the CTA is rendered on a 390px screen, **Then** the tap target is fully visible without horizontal scroll and is at least 44px tall.
3. **Given** the user triggers analysis, **When** `/analysis` loads, **Then** the analysis is framed around PETR4 specifically — not a generic overview.

---

### Edge Cases

- What if the ticker in the URL does not exist on the market data provider? The page must show a "Ativo não encontrado" message without crashing, with a link back to `/home`.
- What if the asset has no intraday data (e.g., market is closed and 1D data is empty)? The chart section shows the last available data with a "Mercado fechado" label.
- What if the full asset name is very long? The name must truncate gracefully without breaking the header layout.
- What if all three data fetches (quote, history, radar) fail simultaneously? The page must still render the header with the ticker code and show three independent empty states — one per section.
- What if the user navigates directly to `/asset/[ticker]` without coming from home? Back navigation must still go to `/home`.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The screen MUST be accessible only to authenticated users — unauthenticated visitors are redirected to `/auth/sign-in`.
- **FR-002**: The screen MUST display a header section containing: the ticker code in large type, the asset's full name, the current price in BRL (formatted as Brazilian currency), and a daily change percentage badge color-coded positive (amethyst/green) or negative (rose-red).
- **FR-003**: The header MUST include a back navigation control that returns the user to `/home`.
- **FR-004**: The screen MUST display a price history line chart for the selected time range, with the Y-axis in BRL and the X-axis showing dates or times appropriate to the range.
- **FR-005**: The screen MUST provide three range toggle buttons — "1D" (1 day), "1M" (1 month), and "1A" (1 year) — that update the chart data when tapped.
- **FR-006**: The default chart range on initial page load MUST be "1M" (1 month).
- **FR-007**: The screen MUST display a radar chart with five axes: Rentabilidade, Momentum, Liquidez, Valuation, Tendência — each scored 0–100.
- **FR-008**: The screen MUST include a prominent "Analisar este ativo" call-to-action that navigates to `/analysis` with the current ticker as the analysis subject.
- **FR-009**: The "Analisar este ativo" CTA MUST have a minimum tap target height of 44px.
- **FR-010**: Each data section (header quote, price chart, radar chart) MUST render independently — if one fetch fails, the others still display.
- **FR-011**: Each failed or unavailable data section MUST display a Portuguese-language empty state message instead of a blank space or crash.
- **FR-012**: If the ticker is not found by the data provider, the screen MUST display a "Ativo não encontrado" message with a link back to `/home`.
- **FR-013**: All user-facing text, labels, axis names, range buttons, error messages, and empty states MUST be in Brazilian Portuguese.
- **FR-014**: The layout MUST be optimised for 390px width (mobile-first) with no horizontal overflow.
- **FR-015**: All card surfaces MUST apply the glassmorphism treatment (backdrop blur, translucent background, inset highlight, rounded corners of at least `rounded-[2rem]`).
- **FR-016**: When B3 is closed (outside 10:00–17:00 BRT on weekdays), the chart section for the 1D range MUST show a "Mercado fechado" indicator alongside the last available data.

### Key Entities

- **AssetQuote**: A snapshot of an asset at a point in time — ticker code, full name, current price in BRL, and daily percentage change. Sourced from the market data provider.
- **PriceHistory**: A time-ordered sequence of (timestamp, price) pairs for a given ticker and time range. Used to render the line chart.
- **RadarProfile**: Five normalised scores (0–100) for Rentabilidade, Momentum, Liquidez, Valuation, and Tendência for a given ticker. Used to render the radar chart.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The asset header (ticker, name, price, change badge) is visible within 3 seconds of navigating to `/asset/[ticker]` on a simulated 4G connection.
- **SC-002**: Switching between the three chart ranges (1D, 1M, 1A) completes and re-renders the chart within 2 seconds of the tap.
- **SC-003**: Zero JavaScript crashes or white screens occur when any single data source returns an error.
- **SC-004**: Every interactive element (range buttons, "Analisar este ativo" CTA, back button) has a minimum tap target of 44×44px.
- **SC-005**: All text on the screen meets WCAG AA contrast ratio (4.5:1) against the void background.
- **SC-006**: Tapping "Analisar este ativo" navigates to `/analysis` with the ticker context within 300ms.
- **SC-007**: On a 390px viewport, all five radar chart axis labels are readable without truncation or horizontal scroll.

---

## Assumptions

- The price chart range toggle requires client-side interactivity (state for selected range + fetch on change) — the chart and range toggle will be a Client Component while the page shell remains a Server Component.
- The "1D" range shows intraday prices at 5-minute intervals; "1M" shows daily closes over 30 days; "1A" shows daily closes over 12 months — matching the intervals defined in the existing `getAssetHistory` service.
- The radar chart is rendered using the existing `getMarketRadarData` service which returns pre-normalised 0–100 scores; no new scoring logic is needed.
- The `getMarketRadarData` service requires a valid Brapi API key and a single ticker — one request per page load, free-tier compatible.
- The chart library (Recharts) is already installed in the project — no new dependencies required.
- Back navigation to `/home` is implemented as a `<Link href="/home">` — not `router.back()` — to ensure it always goes to home regardless of navigation history.
- The ticker in the URL is always uppercase in the data layer; display formatting matches the ticker exactly as returned by the API.
- The "Analisar este ativo" CTA passes the ticker as a URL search parameter to `/analysis` (e.g., `/analysis?ticker=PETR4`), which the analysis screen will use to pre-populate the subject.
- Market hours are 10:00–17:00 BRT (UTC-3) on weekdays, using the existing `isMarketOpen()` utility from `market-utils.ts`.
- No social sharing, watchlist add, or alert-setting features are included — out of MVP scope.
