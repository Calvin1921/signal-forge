"use client";

import { FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface SimDataBadgeProps {
  /**
   * Force icon-only (no visible label at any breakpoint). Use in already-
   * dense fixed-position chrome — e.g. the strategy canvas top bar, which
   * shares its row with the strategy name and a fork chip and has no
   * spare width even at tablet sizes. The `title` tooltip still carries
   * the full sentence, and the icon alone matches this app's existing
   * icon-only-with-title convention (CanvasToolbar's zoom/minimap buttons).
   */
  compact?: boolean;
}

/**
 * Persistent disclosure that every number in the app — P&L, win rate,
 * equity curve, trades, backtests — is deterministically simulated, never
 * live market data. This is the structural fix for a recurring failure
 * class: three separate surfaces (BacktestPanel empty state, the public
 * share page, and this dashboard) have each independently presented
 * simulated results without saying so. Render this in every app-chrome
 * surface (Navbar, and the strategy canvas's own top bar, which does not
 * use Navbar) so no route can ship without it.
 *
 * Default (Navbar): full label shows from `sm:` up; below that only the
 * icon renders, to avoid crowding the 375px mobile header. `compact`
 * always renders icon-only. Either way the `title` tooltip carries the
 * full sentence, and the icon alone remains a legitimate disclosure
 * surface (same pattern as an unlabeled status dot).
 */
export function SimDataBadge({ compact = false }: SimDataBadgeProps) {
  return (
    <Badge
      sentiment="neutral"
      size="sm"
      className="shrink-0"
      title="All market data and P&L are deterministically simulated — see README"
    >
      <FlaskConical size={12} className="shrink-0" />
      <span className={compact ? "sr-only" : "sr-only sm:not-sr-only"}>
        Simulated data
      </span>
    </Badge>
  );
}
