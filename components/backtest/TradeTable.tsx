"use client";

import { MonospaceValue } from "@/components/ui/MonospaceValue";
import { RMultipleBadge } from "@/components/RMultipleBadge";
import {
  useBacktestStore,
  useFilteredTrades,
  useHiddenTradeCount,
  type TradeFilter,
} from "@/lib/stores/backtestStore";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

function formatPrice(price: number, asset: string): string {
  if (asset.includes("EUR")) return price.toFixed(4);
  if (asset.includes("SPY") || asset.includes("AAPL")) return price.toFixed(2);
  return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatDuration(bars: number, timeframe: string): string {
  const tfHours: Record<string, number> = {
    "1m": 1 / 60,
    "5m": 5 / 60,
    "15m": 0.25,
    "1h": 1,
    "4h": 4,
    "1D": 24,
    "1W": 168,
  };
  const hoursPerBar = tfHours[timeframe] ?? 24;
  const totalHours = bars * hoursPerBar;

  if (totalHours < 1) return `${Math.round(totalHours * 60)}m`;
  if (totalHours < 24) return `${totalHours.toFixed(0)}h`;
  const days = Math.floor(totalHours / 24);
  const remainHours = Math.round(totalHours % 24);
  return remainHours > 0 ? `${days}d ${remainHours}h` : `${days}d`;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const mins = String(d.getUTCMinutes()).padStart(2, "0");
  return `${month}-${day} ${hours}:${mins}`;
}

interface SortHeaderProps {
  column: string;
  label: string;
  align?: "left" | "right";
}

function SortHeader({ column, label, align = "left" }: SortHeaderProps) {
  const sortColumn = useBacktestStore((s) => s.sortColumn);
  const sortDirection = useBacktestStore((s) => s.sortDirection);
  const setSortColumn = useBacktestStore((s) => s.setSortColumn);

  const isActive = sortColumn === column;
  const textAlign = align === "right" ? "text-right" : "text-left";

  return (
    <th
      className={`transition-fast ${textAlign} py-2 px-3 font-medium cursor-pointer select-none text-caption-1 uppercase tracking-wider hover:text-primary focus-ring`}
      onClick={() => setSortColumn(column)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          sortDirection === "asc" ? (
            <ArrowUp size={10} />
          ) : (
            <ArrowDown size={10} />
          )
        ) : (
          <ArrowUpDown size={10} className="opacity-30" />
        )}
      </span>
    </th>
  );
}

const filterOptions: { value: TradeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "winners", label: "Winners" },
  { value: "losers", label: "Losers" },
];

export function TradeTable() {
  const filter = useBacktestStore((s) => s.filter);
  const setFilter = useBacktestStore((s) => s.setFilter);
  const trades = useFilteredTrades();
  const hiddenCount = useHiddenTradeCount();
  const asset = trades[0]?.asset ?? "BTC/USDT";

  // Detect timeframe from canvasStore asset config or default
  const timeframe = useBacktestStore.getState().candles.length > 0 ? "4h" : "1D";

  return (
    <div>
      {/* Filter bar — 44px touch targets */}
      <div className="flex items-center gap-2 mb-2">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`transition-fast text-caption-1 px-3 min-h-[44px] rounded-[var(--radius-sm)] focus-ring ${
              filter === opt.value
                ? "bg-surface-3 text-primary"
                : "bg-surface-2 text-secondary hover:text-primary hover:bg-surface-3"
            }`}
          >
            {opt.label}
          </button>
        ))}
        {hiddenCount > 0 && (
          <span className="text-caption-1 text-muted ml-auto">
            {hiddenCount} trade{hiddenCount !== 1 ? "s" : ""} hidden by filter
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-secondary">
              <SortHeader column="time" label="Time" />
              <th className="text-left py-2 px-3 font-medium text-caption-1 uppercase tracking-wider">Side</th>
              <th className="text-right py-2 px-3 font-medium text-caption-1 uppercase tracking-wider">Entry</th>
              <th className="text-right py-2 px-3 font-medium text-caption-1 uppercase tracking-wider">Exit</th>
              <SortHeader column="pnl" label="P&L" align="right" />
              <SortHeader column="rMultiple" label="R-Mult" align="right" />
              <SortHeader column="duration" label="Duration" align="right" />
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => {
              const isProfit = trade.pnl > 0;

              return (
                <tr key={trade.id} className={isProfit ? "row-profit" : "row-loss"}>
                  <td className="py-2 px-3">
                    <MonospaceValue
                      value={formatTime(trade.exitTime)}
                      sentiment="neutral"
                      className="text-subhead"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className="text-subhead"
                      style={{
                        color:
                          trade.side === "Long"
                            ? "var(--semantic-profit)"
                            : "var(--semantic-loss)",
                      }}
                    >
                      {trade.side}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <MonospaceValue
                      value={formatPrice(trade.entryPrice, asset)}
                      sentiment="neutral"
                      className="text-subhead"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <MonospaceValue
                      value={formatPrice(trade.exitPrice, asset)}
                      sentiment="neutral"
                      className="text-subhead"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <MonospaceValue
                      value={`${isProfit ? "+" : ""}$${trade.pnl.toFixed(2)}`}
                      sentiment={isProfit ? "profit" : "loss"}
                      className="text-subhead font-medium"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <RMultipleBadge value={trade.rMultiple} />
                  </td>
                  <td className="py-2 px-3 text-right text-secondary text-subhead">
                    {formatDuration(trade.holdBars, timeframe)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {trades.length === 0 && (
          <div className="text-center py-8 text-footnote text-muted">
            No trades match this filter.
          </div>
        )}
      </div>
    </div>
  );
}
