/**
 * Hex color equivalents of our OKLCH design tokens.
 * lightweight-charts cannot parse oklch() — it needs hex or rgb strings.
 * CSS custom properties stay OKLCH; this map is ONLY for chart library calls.
 */
export const chartColors = {
  // Surfaces (near-black Bloomberg terminal base)
  "surface-0": "#1a1b23",
  "surface-1": "#262730",
  "surface-2": "#32333e",
  "surface-1-half": "#20212a", // between 0 and 1, used for chart bg
  "grid": "#2a2b35",

  // Text
  "text-primary": "#e2e3e8",
  "text-secondary": "#8c8d96",
  "text-muted": "#64656d",

  // Accents
  "accent-primary": "#00c8e0",
  "accent-primary-30": "rgba(0, 200, 224, 0.3)",
  "accent-primary-02": "rgba(0, 200, 224, 0.02)",

  // Semantics
  "semantic-profit": "#2bb57a",
  "semantic-loss": "#e05252",
  "semantic-warning": "#d4a843",

  // Semi-transparent variants for crosshair / wicks
  "text-secondary-30": "rgba(140, 141, 150, 0.3)",
  "semantic-profit-60": "rgba(43, 181, 122, 0.6)",
  "semantic-loss-60": "rgba(224, 82, 82, 0.6)",
  "semantic-loss-40": "rgba(224, 82, 82, 0.4)",
  "semantic-profit-40": "rgba(43, 181, 122, 0.4)",
} as const;
