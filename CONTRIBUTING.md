# Contributing to SignalForge

SignalForge is an MIT-licensed prototype for inspecting explicit rules and running synthetic experiments. Start with the [README](README.md) and [walkthrough](docs/walkthrough.md).

## Useful first contributions

- Correct a reproducible engine issue with a focused regression test. See [known issues](docs/known-issues.md).
- Improve keyboard access, control labels, or narrow-screen usability.
- Make an explanation match the actual executable graph.

For larger changes, open an issue describing the user problem and proposed behavior before investing in an implementation. The current scope is a local simulation playground; live execution is not implemented.

## Report a bug

Include the route, preset, exact parameters, steps, expected behavior, and actual result. Keep the strategy name unchanged when reproducing a run because it currently affects the dataset seed. Include your Node.js/pnpm versions and browser when relevant.

Use synthetic examples only. Remove credentials, personal information, local filesystem paths, account details, and real financial or user data from reports and media.

## Make a change

1. Fork or create a branch and follow the README quick-start.
2. Keep the change focused. Explain the user-visible problem and resulting behavior.
3. Add a regression test for changed engine behavior; isolate parameters by keeping the dataset inputs fixed.
4. Run the checks in the [engineering guide](docs/engineering.md#validation-commands). For UI changes, also exercise the affected flow and keyboard controls. Include a synthetic-data screenshot when it helps review.
5. Open a pull request with the change, verification results, and remaining limitations. Do not claim checks that were not performed.

Preserve visible simulated-data disclosures. Use shared UI primitives and field definitions where applicable; consult [DESIGN.md](DESIGN.md) for visual conventions. Framework changes should also follow [AGENTS.md](AGENTS.md).

Documentation-only changes should verify links, wording against implemented behavior, and visual legibility. New prose does not require artificial unit tests.
