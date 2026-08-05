@AGENTS.md

# SignalForge

Node-based trading strategy builder for stocks, crypto, and forex.

## Quick Start

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # Production build
pnpm test       # 56 integration tests (vitest)
```

## Tech Stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS v4
- @xyflow/react (ReactFlow) for node canvas
- lightweight-charts v5 for TradingView-quality charts
- Zustand for state management
- Framer Motion for floating panels
- Vitest for testing

## Architecture

- **Client-side only (MVP)** — no backend, no auth, no database
- **Backtest engine** runs in main thread with deterministic seeded PRNG
- **3 Zustand stores:** canvasStore (nodes/edges), backtestStore (results/filters), panelStore (UI state)
- **OHLCV data** generated deterministically per asset (BTC, ETH, SPY, AAPL, EUR/USD)

## Design System (Forge)

- **Dark-only** — no light mode
- **OKLCH colors** as CSS custom properties (globals.css)
- **No-Line Rule** — zero 1px borders, hierarchy through surface tier shifts
- **Gradient CTA Rule** — only primary buttons get gradients
- **Color-Means-Something** — green=profit, red=loss, amber=warning, cyan=primary, magenta=secondary
- **Fonts:** Inter (UI) + JetBrains Mono (all numeric data)
- **Chart colors:** Use `lib/chart-colors.ts` for hex equivalents (lightweight-charts doesn't accept OKLCH)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — stats, equity curve, strategies, trades |
| `/strategy/[id]` | Strategy Canvas — node editor + backtest panel |
| `/presets` | Preset Library — 6 strategies with fork-to-canvas |
| `/strategy/new` | New Strategy — empty state with start options |

## Quality Gates

- `pnpm build` must pass (zero TypeScript errors)
- `pnpm test` must pass (56 tests)
- Zero raw Tailwind colors (bg-white, bg-gray-*, etc.)
- All numbers rendered with `font-mono-data` class
- Health pills must use correct classification thresholds

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
