# Engineering evidence and boundaries

SignalForge demonstrates a visual rule editor connected to deterministic evaluation and inspectable outputs. This guide supports the concise [README](../README.md); it separates implemented behavior from future work.

## Architecture and tradeoffs

| Area | Implementation | Why it matters / tradeoff |
| --- | --- | --- |
| Product state | Three Zustand stores: [canvas](../lib/stores/canvasStore.ts), [backtest](../lib/stores/backtestStore.ts), [panels](../lib/stores/panelStore.ts) | Graph, evaluation, and layout concerns are separate. State is in memory; no persistence. |
| Visual editing | React Flow; [shared field definitions](../lib/node-fields.ts) feed inline controls and the inspector | Parameters have one definition across two editing surfaces. Drag-based authoring still needs an accessible alternative. |
| Evaluation | [Engine](../lib/backtest-engine.ts) sorts the graph, computes indicators, evaluates conditions, simulates entries/exits, then computes statistics | The same graph drives the interaction and evaluation. Evaluation is synchronous on the browser's main thread. |
| Indicator identity | Registry keyed by node ID | Multiple instances of an indicator stay independent. See [ADR-002](adr-002-node-id-indicator-registry.md). The legacy chart-facing data also has type-keyed series; not every indicator instance is independently plotted. |
| Repeatability | [Seeded OHLCV generator](../lib/generate-ohlcv.ts), fixed initial timestamp | Same inputs yield the same candles and trades. Asset and strategy name affect the seed; timeframe and periods also affect evaluation. |
| Reporting | [Statistics](../lib/compute-stats.ts) and [results UI](../components/backtest/BacktestPanel.tsx) | Individual trades and sample size accompany return. Sharpe/Sortino require at least 10 trades, but this is a heuristic guard, not statistical validation. |
| Presentation | Next.js 16, React 19, Tailwind v4, Framer Motion, lightweight-charts v5 | A browser-based prototype with no application backend, authentication, or database. Next.js still serves the app and renders its initial HTML. |
| Design system | [DESIGN.md](../DESIGN.md), shared primitives, OKLCH tokens, [chart color bridge](../lib/chart-colors.ts) | Centralized conventions reduce visual drift. [ADR-001](adr-001-oklch-tokens-hex-bridge.md) explains the chart compatibility tradeoff. These conventions are not all enforced by CI. |

## Validation commands

```bash
pnpm lint
pnpm test
pnpm build
pnpm exec tsc --noEmit
```

Build precedes explicit typechecking because it generates Next.js type declarations. [CI](../.github/workflows/ci.yml) runs these checks. The existing suite has **89 passing tests** across three files, including unit and integration-style checks:

- [Generator, statistics, and engine](../lib/__tests__/backtest-engine.test.ts): deterministic reruns, indicator identity, gates, risk behavior, preset integration, and statistics regressions.
- [Canvas store](../lib/stores/canvasStore.test.ts): valid/rejected connections, node removal, parameter updates, and graph validation.
- [Preset loading](../lib/stores/presetFork.test.ts): all ten definitions and route/store behavior.

Some tests changing strategy parameters also change the strategy name, and therefore the candle seed. Those tests do not isolate parameter effects. The demo keeps the name fixed; future engine tests should do the same when attributing a difference to one rule.

Dependency auditing is advisory in CI:

```bash
pnpm audit --prod --audit-level high
```

A successful main CI job is not proof that dependencies have no advisories. No browser accessibility suite or formal coverage threshold is configured.

## Security headers and working hydration

The original static `script-src 'self'` policy blocked Next.js inline bootstrap scripts: the canvas chrome appeared, but the graph and Backtest did not activate. [proxy.ts](../proxy.ts) now issues a fresh script nonce on each request and forwards the policy to Next.js so the rendered scripts carry that nonce. The [root layout](../app/layout.tsx) waits for a request, making nonce-bearing HTML dynamic.

This preserves restrictions on arbitrary inline scripts without adding blanket `unsafe-inline` to `script-src`. Development alone permits `unsafe-eval` for framework debugging. Existing inline style permission remains because the canvas and charts use inline positioning. Framing denial, MIME sniffing prevention, referrer policy, and browser permission restrictions remain configured.

**Tradeoff:** all pages now render per request; this is not a static-export or CDN-cacheable HTML setup. A future host must preserve the CSP/HTML nonce pairing. No third-party runtime scripts, analytics, or credentials were added.

After a production build, start the server in one terminal and check rendered responses in another:

```bash
pnpm start
# In a second terminal:
pnpm test:csp
```

For a different port, use `pnpm start --port 3001`, then `SIGNALFORGE_BASE_URL=http://localhost:3001 pnpm test:csp`. The [smoke check](../scripts/check-csp.mjs) requests each main route twice, verifies fresh nonces, confirms inline bootstrap scripts match the response policy, and rejects production `unsafe-eval` / script `unsafe-inline`. CI now runs this smoke check after the build. Browser interaction remains a separate check: load the preset, run, edit, rerun, reload, and navigate through presets.

## Accessibility: evidence, not a blanket claim

Implemented foundations include native buttons/selects/inputs, visible focus styles, named toolbar actions, a simulated-data text alternative, and `role="img"` / labels on share-page schematics. The README flow has a text equivalent and SVG title/description.

Remaining work includes complete keyboard graph authoring, inspector input label associations, reduced-motion behavior, screen-reader announcements, contrast measurements, and narrow-screen results-panel layout. The `IconButton` primitive defaults to 36×36px (and has a 28px small size), so a claim of universal 44px targets would be inaccurate. A full WCAG assessment has not been performed.

## Limitations to review before expanding the prototype

1. **Data provenance:** all fixtures and candles are synthetic. Preset/dashboard statistics and synthesized share curves are not computed from the current canvas run. Some preset descriptions and share theses do not match their executable graph exactly; inspect the actual nodes. For example, the RSI demo exits via its risk rules or timeout, not the editorial description's RSI/EMA exit.
2. **Research realism:** no fees, slippage, spread, partial fills, or liquidity model. Entry is at a signal candle's close. One position is held at a time, with a fixed 5% initial-capital allocation. Stop-loss is evaluated before take-profit when both fall in a candle range; OHLCV cannot establish the intrabar path.
3. **Metrics:** drawdown uses closed-trade equity. Sharpe uses trade-level returns and trade-frequency annualization, with display clamps. ATR-based stops do not currently change the percentage-based risk denominator used for R-multiples. Do not present these outputs as validated research metrics.
4. **Graph semantics:** support is not a general-purpose execution language. The evaluator recognizes some nodes by label, selects single entry/risk components, and has fallbacks for incomplete wiring. Category validation does not prove arbitrary graph correctness or prevent every malformed/cyclic graph.
5. **Durability:** edits disappear on reload; share routes show built-in presets. No import/export, stored runs, custom share snapshots, collaboration, auth, or database.
6. **Scale:** main-thread computation can block interaction; no worker, cancellation, or long-run resource budget. UI loading delay is not a performance guarantee.
7. **Operational readiness:** no production deployment or hosted demo is asserted. Dependency review, accessibility checks, deployment headers, observability, and further graph/metric validation remain needed before a production claim.

The confirmed correctness findings and suggested regression checks are tracked in [known issues](known-issues.md). In particular, Swing High/Low currently permits future-candle access; deterministic output alone does not establish causal correctness.

## Possible next milestones

First align preset prose with executable rules and give experiments a data seed independent of their display name. Then add durable graph/run snapshots and accessible authoring. Historical-data adapters and paper-trading portability are future work; no live execution is implemented.

## AI-assisted development

AI tools assisted implementation. Runtime behavior comes from explicit graph rules and deterministic code; no in-app model call, agent orchestration, or autonomous trading is implemented. Evidence for engineering quality should come from runnable checks and source, not an unverifiable claim about how every past change was reviewed.
