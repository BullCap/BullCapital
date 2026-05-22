# Feature Specification: Daily Market Brief

**Feature Branch**: `007-daily-market-brief`

**Created**: 2026-05-22

**Status**: Draft

**Input**: User description: "Create a daily market brief home screen with top stories, radar context, and stronger AI entry points."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Daily market briefing on first open (Priority: P1)

An authenticated user opens BullCapital in the morning and immediately understands what matters now: the market tone, the main stories, and the next analysis paths to inspect.

**Why this priority**: The home screen needs to become the daily habit loop for the product instead of just a collection of market cards.

**Independent Test**: Open `/home` on mobile and desktop and confirm the first viewport presents a clear daily brief, top stories, and at least one direct path into a deeper analysis flow.

**Acceptance Scenarios**:

1. **Given** the user opens `/home`, **When** the page loads, **Then** the top section summarizes the market day in plain language and highlights primary actions.
2. **Given** the page has market and news data, **When** the user scans the home screen, **Then** they can identify top stories and open a related asset or deeper analysis without using search.

---

### User Story 2 - Story-to-analysis flow (Priority: P2)

The user sees a headline affecting a known ticker and wants to continue into context quickly.

**Why this priority**: News only matters if it creates a useful next step.

**Independent Test**: From the home story digest, open a linked asset and a linked analysis entry point from a story card.

**Acceptance Scenarios**:

1. **Given** a story is associated with a tracked ticker, **When** the user opens the story digest, **Then** the card shows the related ticker and a contextual next action.

---

### User Story 3 - Radar context without portfolio scope (Priority: P3)

The user has not configured a portfolio, but still wants a useful shortlist of names and signals to monitor today.

**Why this priority**: BullCapital needs lightweight personalization/value before full watchlists or portfolio tracking exist.

**Independent Test**: Open `/home` and confirm the radar section surfaces a curated shortlist derived from daily movers and key market anchors.

**Acceptance Scenarios**:

1. **Given** the user has no saved assets, **When** the home screen renders, **Then** the radar panel still surfaces actionable names and reasons to inspect them.

---

### Edge Cases

- The briefing must remain useful when one or more macro indicators fail to load.
- The story digest must handle duplicate headlines from multiple ticker queries.
- The radar panel must degrade gracefully when gainers or losers are unavailable.
- The home screen must stay legible on the narrow mobile column and in the wider workstation layout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The home screen MUST present a top-level daily market brief before the supporting dashboard cards.
- **FR-002**: The daily brief MUST summarize the current market tone using available macro and market indicator data.
- **FR-003**: The home screen MUST expose at least one direct path into the analysis experience from the briefing area.
- **FR-004**: The home screen MUST include a story digest built from existing news sources already used in the application.
- **FR-005**: Story digest entries MUST deduplicate repeated links and show source freshness.
- **FR-006**: Story digest entries SHOULD link to a related asset detail page when a concrete ticker is known.
- **FR-007**: The home screen MUST include a radar section that surfaces a shortlist of names or signals to inspect without requiring portfolio setup.
- **FR-008**: Existing home market widgets MUST remain available as supporting context in the new layout.

### Key Entities

- **Daily brief**: A compact home summary made from current macro and market state plus clear next actions.
- **Story digest item**: A deduplicated news entry with source, freshness, related ticker tags, and contextual action.
- **Radar entry**: A short item in the home radar panel that explains why a name or signal deserves attention now.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On `/home`, users can identify the market tone, at least one key story, and at least one next action without scrolling.
- **SC-002**: The home screen remains usable at mobile and desktop widths with no overlapping content.
- **SC-003**: Every story digest card includes a timestamp/source treatment and a clear next action.
- **SC-004**: The new home layout preserves the existing market widgets while making the briefing content visually primary.

## Assumptions

- The first slice uses existing market and Yahoo Finance news sources instead of adding new providers.
- Portfolio tracking remains out of MVP scope; the radar panel is generated from market signals and editorial defaults.
- AI entry points can link into the current analysis route before adding richer cross-page context handoff.
