# ADR-001: OKLCH design tokens with a single hex bridge for charts

Status: accepted
Date: 2026-08-05 (recorded retroactively; decision made when the Forge token
system was introduced)

## Context

Forge's visual hierarchy depends on *tonal surface stepping* — adjacent surface
tiers must differ by a perceptually even amount of lightness, because the
No-Line Rule forbids 1px borders and leaves tone as the only structural signal.
sRGB/hex lightness steps are not perceptually even: the same numeric delta
reads differently in dark blues vs greys.

At the same time, lightweight-charts (the only real rendering dependency that
takes color values at runtime through JavaScript) cannot parse `oklch()`
strings.

## Decision

- All UI colors are OKLCH CSS custom properties in `app/globals.css`. The
  5-lightness-point minimum between adjacent surface tiers is specified on the
  OKLCH L channel, where it is perceptually meaningful.
- Chart code never receives OKLCH. A single module, `lib/chart-colors.ts`,
  holds hand-converted hex/rgba equivalents of exactly the tokens charts need,
  and every chart call site imports from it.

## Alternatives considered

- **Hex everywhere.** Kills the perceptual-stepping guarantee the No-Line Rule
  depends on; every future tier adjustment becomes eyeballing.
- **Runtime conversion (`getComputedStyle` + a color library).** Adds a
  dependency and a startup read for values that change only when a designer
  edits tokens. Rejected as machinery without a payoff at this scale.

## Consequences

- Token edits that touch chart-visible colors must be mirrored in
  `lib/chart-colors.ts`; the file header states this contract. The drift
  surface is one file instead of every chart call site.
- Charts and UI can never disagree on what "profit green" is without a diff
  showing it.
