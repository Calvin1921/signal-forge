# Forge Design System

## Philosophy

### North Star
"Instrument panel of a well-engineered machine."

SignalForge is a professional trading strategy builder. Every pixel must communicate precision, trust, and clarity under pressure. The interface recedes so the data speaks. We design for the trader who has three monitors, scans dozens of signals before coffee, and needs zero ambiguity about what any number means.

### Governing Rules

**Dark-First, Dark-Only.**
Trading tools live in dark environments. There is no light mode. The absence of light lets semantic color carry maximum signal -- green means profit, red means loss, and nothing else competes for that bandwidth.

**Color Is Earned.**
Every color in the system must justify its existence with a semantic role. Green = profit/bullish. Red = loss/bearish. Amber = warning/caution. Cyan = primary action and live data. Magenta = secondary accent and short positions. If a color does not map to a meaning, it does not appear. Decorative color is banned.

**No-Line Rule.**
Zero structural 1px borders anywhere. Visual hierarchy is achieved exclusively through tonal surface shifts -- a minimum of 5 lightness points (OKLCH L channel) between any two adjacent surface tiers. Borders are noise; tonal layers are architecture.

**Gradient CTA Rule.**
Only primary action buttons receive a gradient fill (135deg cyan sweep). Every other interactive element uses flat surface fills with tonal hover shifts. This ensures the primary call-to-action is always the most visually prominent element on any screen.

**Color-Means-Something Rule.**
- `--semantic-profit` (green): profit, gain, bullish, long, success
- `--semantic-loss` (red): loss, drawdown, bearish, short trigger, error
- `--semantic-warning` (amber): caution, validation warning, near-threshold
- `--accent-primary` (cyan): primary actions, live data highlights, active states
- `--accent-secondary` (magenta): secondary actions, short-side indicators, alternative paths

**Dual-Font System.**
JetBrains Mono for every number that a trader reads -- prices, percentages, P&L, timestamps, parameter values. Inter for all prose -- labels, navigation, descriptions, tooltips. Mixing the two in the same line is intentional: "Moving Average period: `14`" uses Inter then JetBrains Mono.

**Conservative Radius.**
8-12px for cards, panels, and node containers. 6px for buttons and inputs. Nothing pill-shaped. This is a professional instrument, not a consumer app.

**Shadow Discipline.**
Shadows use the on-surface tone at low opacity, never `rgba(0,0,0,...)`. This keeps elevation shifts feeling integrated with the surface palette rather than punching holes in the dark canvas.

---

## Tokens

### Surface Tiers (5 tiers, 5L delta between each)

| Token          | Value                      | Usage                        |
|----------------|----------------------------|------------------------------|
| `--surface-0`  | `oklch(12% 0.005 260)`    | App background, canvas       |
| `--surface-1`  | `oklch(17% 0.005 260)`    | Sidebar, panels              |
| `--surface-2`  | `oklch(22% 0.008 260)`    | Cards, nodes at rest         |
| `--surface-3`  | `oklch(27% 0.008 260)`    | Hovered cards, active panels |
| `--surface-4`  | `oklch(32% 0.010 260)`    | Elevated popover, dropdown   |

### Semantic Colors

| Token               | Value                      | Meaning          |
|----------------------|----------------------------|------------------|
| `--semantic-profit`  | `oklch(72% 0.17 155)`     | Profit / bullish |
| `--semantic-loss`    | `oklch(65% 0.2 25)`       | Loss / bearish   |
| `--semantic-warning` | `oklch(78% 0.15 80)`      | Warning / caution|

### Accent Colors

| Token                  | Value                      | Role                     |
|------------------------|----------------------------|--------------------------|
| `--accent-primary`     | `oklch(75% 0.15 200)`     | Primary action, live data|
| `--accent-primary-dim` | `oklch(65% 0.12 200)`     | Dimmed primary states    |
| `--accent-secondary`   | `oklch(70% 0.15 330)`     | Secondary accent, shorts |

### Node Category Colors

| Token              | Value                      | Node Type      |
|--------------------|----------------------------|----------------|
| `--node-data`      | `oklch(75% 0.15 200)`     | Data sources   |
| `--node-indicator` | `oklch(78% 0.15 80)`      | Indicators     |
| `--node-condition` | `oklch(72% 0.17 155)`     | Conditions     |
| `--node-action`    | `oklch(70% 0.15 330)`     | Actions        |
| `--node-risk`      | `oklch(70% 0.15 25)`      | Risk management|

### Text

| Token              | Value                      | Usage            |
|--------------------|----------------------------|------------------|
| `--text-primary`   | `oklch(90% 0.005 260)`    | Headings, values |
| `--text-secondary` | `oklch(60% 0.005 260)`    | Labels, captions |
| `--text-muted`     | `oklch(45% 0.005 260)`    | Disabled, hints  |

### Gradient

| Token                  | Value                                                              |
|------------------------|--------------------------------------------------------------------|
| `--gradient-cta`       | `linear-gradient(135deg, oklch(75% 0.15 200), oklch(72% 0.14 220))` |
| `--gradient-cta-hover` | `linear-gradient(180deg, oklch(75% 0.15 200), oklch(72% 0.14 220))` |

### Radius

| Token         | Value  | Usage                  |
|---------------|--------|------------------------|
| `--radius-sm` | `6px`  | Buttons, inputs        |
| `--radius-md` | `8px`  | Small cards, chips     |
| `--radius-lg` | `12px` | Panels, nodes, dialogs |

### Typography

| Role        | Font           | Usage                                    |
|-------------|----------------|------------------------------------------|
| Display     | Inter          | Headings, navigation, labels, prose      |
| Data / Mono | JetBrains Mono | Prices, percentages, P&L, timestamps     |
