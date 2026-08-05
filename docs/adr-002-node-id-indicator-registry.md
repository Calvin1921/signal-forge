# ADR-002: Indicator registry keyed by node ID, not indicator type

Status: accepted
Date: 2026-08-05 (recorded retroactively; decision made during the engine v2
rewrite)

## Context

The first backtest engine stored indicator outputs by type name:

```ts
indicatorData.ema = ema; // a second EMA overwrites the first
```

That shape cannot express mainstream strategies. An EMA ribbon needs EMA(8),
EMA(21), and EMA(55) simultaneously; a crossover condition needs to compare
two indicator series to each other, not one series to a constant.

## Decision

The engine v2 resolves the node graph into a registry keyed by node ID:

```ts
const indicatorRegistry = new Map<string, (number | null)[]>();
indicatorRegistry.set("ema-101", computeEMA(closes, 8));
indicatorRegistry.set("ema-102", computeEMA(closes, 21));
```

- Multi-output indicators (MACD, Bollinger, Stochastic) register one series
  per named output handle (`output-*`), so downstream nodes address exactly
  the series they were wired to.
- Condition nodes take two input handles (`input-0`, `input-1`); an
  indicator-vs-threshold condition is just the two-input form with a constant
  on one side. One resolution path, no special cases.
- Indicator math lives in `lib/indicators.ts` as pure array functions with no
  graph knowledge; the engine owns graph resolution and the simulation loop.

## Alternatives considered

- **Type-keyed store with suffixes (`ema_2`, `ema_3`).** Preserves the old
  shape but makes wiring implicit — which suffix a condition reads depends on
  traversal order, not on what the user drew. Rejected: the graph on screen
  must be the single source of truth.
- **Computing indicators inline per condition.** Recomputes shared series per
  consumer and makes warmup periods inconsistent between conditions.

## Consequences

- The canvas is the contract: whatever the user wires is what the engine
  compares. Adding an indicator node type is one compute function plus field
  definitions — the registry and condition system need no changes.
- Warmup becomes dynamic: the simulation starts once every registered series
  a strategy actually uses has data, instead of a fixed worst-case offset.
- The old type-keyed behavior is gone; presets built against it were migrated
  in the same change (covered by the preset integration tests).
