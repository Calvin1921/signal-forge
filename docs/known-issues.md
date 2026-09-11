# Known correctness issues

These findings are open, not completed fixes. SignalForge is a synthetic-data product prototype; repeatability is not proof of financial or mathematical validity. The [README](../README.md) explains the intended scope.

| Finding | Current behavior | Suggested verification for a fix |
| --- | --- | --- |
| Swing High/Low reads future candles | Its centered window can extend beyond the bar being evaluated. With lookback 4, changing candle 7 can change the output at candle 6. | Earlier outputs remain unchanged when future candles change; document the confirmation delay. |
| Names affect datasets | The engine uses the strategy name as part of the synthetic candle seed. Renaming can change results without changing rules. | Introduce an explicit dataset identity; renaming preserves candles and trades. Compare parameters on the same dataset. |
| Graph fallbacks | Missing entry connections can use other conditions or an implicit RSI condition; incomplete topological sorting does not itself report a cycle. | Reject invalid graphs with actionable errors; never silently substitute trading logic. |
| ATR risk denominator | ATR-based stops use an ATR distance, but R-multiples use the percentage-based stop distance. | Use the actual initial risk for normal and forced-close results. |
| Fixture and rule descriptions | Preset/dashboard figures and share curves are fixtures. Some preset prose describes exits absent from the graph. | Align descriptions with executable rules and label result provenance consistently. |

The README's RSI example uses a fixed percentage stop and does not use Swing High/Low. It demonstrates editing and inspecting a simulation, not validated market research. These issues remain relevant before expanding to other presets or interpreting metrics.

For reproduction and contribution guidance, see [CONTRIBUTING.md](../CONTRIBUTING.md). Broader operational, accessibility, and modeling limits are in the [engineering guide](engineering.md#limitations-to-review-before-expanding-the-prototype).
