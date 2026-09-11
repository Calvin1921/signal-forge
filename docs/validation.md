# Validation record

Validation performed on the isolated `docs/signalforge-product-story` branch, based on `387b24f`.

| Check | Result |
| --- | --- |
| Locked dependency installation | Passed with `pnpm install --frozen-lockfile`; lockfile unchanged. |
| Lint | `pnpm lint` passed after runtime changes. |
| Existing tests | `pnpm test`: 89 tests passed across 3 files. |
| Production build | `pnpm build` passed; all page routes render dynamically for request-specific script nonces. |
| Explicit typecheck | `pnpm exec tsc --noEmit` passed after the build. |
| Production CSP smoke check | `pnpm test:csp` passed against a local production server: five routes, two responses each, fresh nonces matching every inline bootstrap script; no production script `unsafe-inline` or `unsafe-eval`. |
| Development browser | Preset loads nodes; Backtest opens computed charts/statistics/trades. Threshold 30 produced 3 trades; threshold 25 produced 1. Identical rerun retained the edited result. |
| Production browser | Direct preset navigation loads the graph and Backtest produces the same baseline 3 trades. Presets → Use Preset also opens the editable graph. |
| Documentation / privacy | 44 local documentation links resolved; no local-path or common credential-pattern findings. Trading-domain uses of “bullish” reviewed as unrelated to employer material. |
| Visual review | New SVG inspected in-browser at native size. Graph and result PNGs inspected for legibility, app-only framing, and synthetic content. |

Local verification used Node.js 25.9.0 and pnpm 10.33.0. CI is configured for Node.js 22 and pnpm 11; local success does not substitute for the next hosted CI run. A dedicated production CSP step was added to CI so a build-success / hydration-failure regression is checked automatically.

The first sandboxed install and localhost response-check attempts were blocked by network restrictions; both passed when run with the required network access. No dependency versions were changed to work around the environment.

This is not a full accessibility audit, security certification, historical-market validation, or performance benchmark. The demo video has not been recorded; the supplied deliverable is a timed script and shot list. The existing dependency-audit job remains advisory.
