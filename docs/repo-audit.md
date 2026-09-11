# SignalForge repository audit

Scope: the README, first-run demo path, implementation claims, supporting visuals, and reviewability of this repository. No other project is part of this change.

## Findings and changes

| Finding | Why it matters | Resolution |
| --- | --- | --- |
| README introduced detailed indicators, design rules, and code counts before a guided first run | A new reader had to infer the product outcome | Lead with the problem and outcome; add a four-step visual and direct preset quick-start. |
| Screenshots showed isolated surfaces, without a continuous experiment | A reader could not distinguish fixtures from evaluated results | Add actual RSI graph/results captures and a step-by-step walkthrough using the same preset. |
| No demo recording plan | The project was harder to explain quickly | Add an 80-second script, shot timings, transcript, simulated-data overlays, and recording checks. This is a script, not a finished video. |
| Static CSP blocked Next.js inline bootstrap | Build/tests passed but browser controls were inert | Add request-specific script nonces and dynamic rendering; verify the real browser interaction and production HTML/CSP pairing. |
| Presets claimed to be “battle-tested” and “ready to deploy” | Unsupported wording overstated the prototype | Replace with example-rule / simulated-data wording. |
| README described dependency auditing as a blocking gate | CI uses `continue-on-error` for that step | Describe it as advisory, and link to the actual workflow. |
| README implied every strategy could be shared and every control had 44px targets | In-memory edits are not saved; small icon controls are smaller | Clarify preset-only sharing, session-only state, and accessibility foundations plus remaining audit work. |
| Data provenance and determinism had hidden qualifications | Renaming alters the seed; fixture statistics differ from computed runs | Explain both explicitly and keep the name fixed in the demo. |
| Deep implementation claims crowded the introduction | Technical substance obscured user value | Move architecture, metrics caveats, design tradeoffs, and validation commands into an engineering guide. |

## Reviewable production-quality signals

The repository contains deterministic-input tests, graph connection tests, preset integration checks, strict TypeScript, lint, CI, shared field definitions, and documented design decisions. They demonstrate engineering discipline, not production certification. The new response-level CSP check addresses a real failure that build-only checks missed.

## Remaining product gaps

The next useful product pass would align all preset descriptions with graph semantics, detach seeds from display names, persist experiments, and improve accessible graph authoring and narrow-screen results. Risk metrics and execution assumptions also need more work before historical-data research. These are recorded in the [engineering guide](engineering.md), with source links and concrete limits.

Existing share pages synthesize a curve from fixture statistics and can use language such as “edge.” That is not independent evidence of market performance. The new walkthrough deliberately uses only the computed canvas path and does not promote the share page as a saved-run report.

## Privacy and presentation review

New documentation and visuals use only built-in synthetic scenarios and locally computed synthetic trades. No credentials, account data, personal contact details, employer material, or machine-specific paths are intentionally included. Screenshots capture only the app viewport. URLs in quick-start examples use localhost or this public repository. Historical Git commit metadata was not rewritten.

The four-step SVG is explicitly a conceptual diagram; the PNGs are actual app captures. The script requires a persistent simulated-data overlay for the eventual recording. Claims about an in-app LLM, autonomous trading, live feeds, a hosted demo, or achieved financial outcomes were avoided.

## Validation record

See [validation.md](validation.md) for commands, toolchain details, browser observations, and any remaining verification limits.
