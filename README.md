# SignalForge

**Turn a trading rule into a visual, testable experiment — without writing a script.**

A trader may know the rule they want to explore, but translating it into code creates a barrier to testing it. SignalForge lets them inspect the rule as a graph, change a parameter, and see the resulting simulated trades in the same workspace.

**The outcome:** an understandable rule and a repeatable experiment. All prices, trades, and returns are **synthetic examples**, not historical market results.

![Four steps: express an idea, inspect its graph, run a simulated backtest, and examine the result. Change one rule and repeat.](docs/flow.svg)

[Try it locally](#try-it-locally) · [Guided walkthrough](docs/walkthrough.md) · [80-second demo script](docs/demo-script.md) · [Engineering evidence](docs/engineering.md)

## See the loop

1. **Idea:** “Enter when RSI, a momentum indicator, falls below 30.”
2. **Graph:** open a preset and inspect the connected data, indicator, condition, entry, and risk nodes.
3. **Backtest:** run those rules against seeded, simulated candles in the browser.
4. **Result:** inspect trade count, drawdown, and individual trades; change the threshold and run again.

| Inspect the rule | Inspect the result |
| --- | --- |
| ![BTC Mean Reversion canvas: price data flows through RSI and a threshold into entry and risk nodes](docs/screenshots/rsi-graph.png) | ![Computed synthetic backtest: three trades and Sharpe withheld below ten trades](docs/screenshots/rsi-results.png) |

*Actual local-app captures using synthetic data only. Open either image for detail. The [walkthrough](docs/walkthrough.md) follows this same preset.*

## Try it locally

Use **Node.js 22+** and **pnpm 11** (the CI toolchain). No account, API key, database, or `.env` file is needed. Installation and the first build need internet access; Next.js downloads the bundled Google fonts at build time.

```bash
git clone https://github.com/Calvin1921/signal-forge.git
cd signal-forge
pnpm install --frozen-lockfile
pnpm dev
```

Open **[the ready-to-run RSI preset](http://localhost:3000/strategy/btc-mean-rev)** and click **Backtest**. The results panel should show a price chart, RSI chart, summary statistics, and trades. Keep the strategy name, asset, and timeframe unchanged; run again to reproduce the result.

For a first edit, select the **RSI < 30** condition, change its **Value** to **25**, and press **Backtest** again. Read the parameter value: the node title may still say “RSI < 30.” Edits live in memory and are lost on a full page reload.

If port 3000 is busy, run `pnpm dev --port 3001` and open the same route on port 3001. Desktop is the best current canvas experience. See [the walkthrough](docs/walkthrough.md) for controls, expected states, and troubleshooting.

## User value and engineering substance

| What the user gets | What makes it technically interesting |
| --- | --- |
| Rules they can inspect and edit visually | A graph is evaluated into indicator series, conditions, entries, and risk exits. |
| A repeatable feedback loop | Seeded candles and deterministic evaluation make the same inputs reproducible. |
| Multi-indicator rules, such as comparing two moving averages | Indicators are keyed by node ID, so two EMAs keep distinct series. |
| A way to inspect outcomes beyond a headline return | Computed statistics, trade filters, and per-trade details; Sharpe is withheld below 10 trades. |
| A starting point instead of an empty canvas | Ten presets load editable graphs; inline controls and the inspector share field definitions. |

This is a **product-engineering prototype**, with no in-app LLM or agent. Its relevant engineering story is making structured logic inspectable, evaluation reproducible, and results understandable. AI tools assisted development; the runtime evaluates explicit rules.

## Quality signals, with evidence

- **Test discipline:** Vitest covers the generator, engine, statistics, graph connections, and preset loading. [Tests](lib/__tests__/backtest-engine.test.ts) include repeated-input determinism and regression cases.
- **Review gates:** [CI](.github/workflows/ci.yml) runs lint, tests, production build, and explicit typechecking. Dependency auditing is **advisory**, not a blocking security guarantee.
- **Accessibility foundations:** visible focus styles, native form controls, named canvas actions, and labelled diagram previews. Full keyboard graph authoring, screen-reader workflows, mobile panels, and contrast still need a dedicated audit; no WCAG conformance claim.
- **Maintainability:** shared UI primitives, field definitions, and written [design decisions](docs/engineering.md#architecture-and-tradeoffs) make the implementation reviewable.

## Current boundaries

- **Synthetic data only.** No historical feed, brokerage connection, live execution, or evidence of trading profitability. Fees, slippage, and realistic fills are not modeled.
- **Two kinds of demo data.** Canvas backtests compute results from the graph. Dashboard/preset figures and share-page curves are illustrative fixtures, not the result of your latest run.
- **Session-only edits.** No persistence or saved custom share links. `/s/[id]` presents built-in presets, not your edited graph.
- **Determinism includes the name.** The strategy name contributes to the candle seed; renaming changes the data. Keep it fixed when comparing rule changes.
- **Local prototype.** No hosted demo is supplied. Simulation runs on the browser's main thread. A nonce-based security policy supports the app's interactive scripts; deployment still needs validation. See the [engineering guide](docs/engineering.md#limitations-to-review-before-expanding-the-prototype).

## Go deeper

[Engineering guide and validation commands](docs/engineering.md) · [Design system](DESIGN.md) · [Demo script / shot list](docs/demo-script.md) · [Audit findings](docs/repo-audit.md)
