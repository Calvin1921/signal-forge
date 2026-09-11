# SignalForge — 80-second demo script and shot list

**Status:** recording plan, not a completed video. **Format:** 16:9 desktop capture with captions. **Audience takeaway:** turn an explicit rule into an inspectable, repeatable experiment.

## Recording setup

- Follow the [quick-start](../README.md#try-it-locally) and rehearse the [walkthrough](walkthrough.md). Use only built-in simulated data, with no imports or external feeds.
- Capture only the app viewport. Hide personal tabs, bookmarks, notifications, terminal output, local paths, and browser profile details. Use a clean browser session.
- Keep a visible overlay throughout: **SIMULATED DATA · PRODUCT PROTOTYPE**. Asset symbols in the UI are synthetic scenario labels.
- Start at `/strategy/btc-mean-rev`. Use the default **BTC Mean Reversion** name, **BTC/USDT**, **4h**, RSI period **14**, threshold **30**, stop **−2%**, take-profit **6%**. Keep the name fixed because it affects the data seed.
- Record at 1920×1080 or another desktop size where controls remain legible. Use restrained crops/zoom during editing. Captions must not cover parameter values or results.
- Run once before capture to confirm the page is interactive and results are present. Use actual displayed results; do not fabricate returns or replace a disappointing result with a fixture. No numerical performance promise is needed.

## Timed script

| Time | Shot / action | Voiceover | On-screen caption |
| --- | --- | --- | --- |
| 0–10s | Begin on the fitted RSI graph. Brief title overlay, then let the app fill the screen. | “A trading idea often gets stuck between a rule in someone's head and the code needed to test it. SignalForge makes that rule visible and testable.” | From a rule to an experiment |
| 10–23s | Follow the connected nodes left to right: Price Data → RSI → RSI < 30 → Market Entry → Stop Loss / Take Profit. | “Here, the example is simple: enter when RSI drops below thirty, with explicit stop-loss and take-profit rules. Each step is a node you can inspect.” | Idea → graph |
| 23–36s | Click **Backtest**. Show the actual loading state and results panel. If waiting is cut, use a visible edit rather than implying a speed benchmark. | “Press Backtest, and the graph runs against seeded, simulated candles in the browser. No account, market feed, or API key is needed.” | Graph → simulated backtest |
| 36–50s | Scroll the results panel from charts to **Trades**, **Max DD**, and individual trade rows. Include losing trades if present. | “The useful output is more than a return number. You can inspect the trade count, drawdown, and individual trades to understand what the rule produced.” | Inspect outcomes, not just return |
| 50–65s | Close results if necessary. Select the condition; change **Value** from **30** to **25**. Show the field clearly, then click **Backtest** and inspect refreshed rows. | “Now I change one threshold and rerun. Keeping the other inputs fixed makes this a repeatable experiment. The goal is to understand the change, not to promise better returns.” | Change one rule → rerun |
| 65–80s | Finish on graph and results, then a concise end card: “Visual rules · Deterministic evaluation · Tested behavior.” | “Underneath is a graph evaluator with independent indicator instances and automated regression tests. This is a product prototype: synthetic data, session-only edits, and no live execution.” | Understand the rule. Inspect the result. |

Approximately 153 spoken words; rehearse at a measured pace and hold the final card so the cut stays between 60 and 90 seconds. The sequence totals 80 seconds.

## Editorial checks

Use the computed canvas results throughout. Dashboard figures, preset-card statistics, and read-only share curves are illustrative fixtures and must not be edited into the sequence as if they came from this run. Do not imply that a share link preserves an edited graph.

A losing or zero-trade result is valid. If results are empty, show that state honestly and restore the baseline threshold for the closing shot. If the node title remains “RSI < 30” after editing, frame the **Value = 25** field; do not imply the title updated.

Deliver captions and the transcript above alongside the eventual video. Check readable text, audible narration, consistent simulated-data disclosure, no private information, and actual duration. Do not describe a hosted demo, AI-generated strategy, or financial performance that the product does not provide.
